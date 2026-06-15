import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import express from 'express';
import { protect, getSignedToken } from '../middleware/auth.js';
import { requireWorkspace } from '../middleware/workspace.js';
import { requireEntitlement } from '../middleware/entitlements.js';
import ParentInvite from '../models/ParentInvite.js';
import Student from '../models/Student.js';
import StudentGuardian from '../models/StudentGuardian.js';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import MasteryRecord from '../models/MasteryRecord.js';
import Skill from '../models/Skill.js';
import User from '../models/User.js';
import { sendParentInvite } from '../utils/emailService.js';

const router = express.Router();

function isExpired(invite) {
  return !invite?.expiresAt || invite.expiresAt.getTime() <= Date.now();
}
async function markExpiredIfNeeded(invite) {
  if (invite && invite.status === 'pending' && isExpired(invite)) {
    invite.status = 'expired';
    await invite.save();
  }
}
function safePreview(invite) {
  return {
    studentName: invite.studentName,
    schoolName: invite.schoolName,
    email: invite.email,
    status: invite.status,
    expiresAt: invite.expiresAt,
  };
}

// Ensure the user holds the 'parent' role + has a family workspace to land in.
async function ensureParentWorkspace(user) {
  if (!Array.isArray(user.roles) || !user.roles.includes('parent')) {
    user.roles = [...new Set([...(user.roles || [user.role]), 'parent'])];
    await user.save();
  }
  let ws = await Workspace.findOne({ ownerUserId: user._id, type: 'parent' });
  if (!ws) {
    ws = await Workspace.create({ type: 'parent', name: 'Family workspace', role: 'parent', ownerUserId: user._id });
    await WorkspaceMember.create({ workspaceId: ws._id, userId: user._id, role: 'parent', status: 'active' });
  }
  if (!user.defaultWorkspace) { user.defaultWorkspace = ws._id; await user.save(); }
  return ws;
}

// ── Create an invite (school admin / workspace owner only) ───────────────────
// POST /api/parent-invites
router.post('/', protect, requireWorkspace, requireEntitlement('inviteParents'), asyncHandler(async (req, res) => {
  const isAdminRole = req.workspaceRole === 'school_admin' || req.workspaceRole === 'admin' || req.workspaceRole === 'teacher';
  const isOwner = req.workspace && String(req.workspace.ownerUserId) === String(req.user.id);
  if (!isAdminRole && !isOwner) return res.status(403).json({ error: 'Not allowed to invite parents in this workspace.' });

  const { studentId, email, expiresInDays = 30 } = req.body || {};
  if (!studentId || !email) return res.status(400).json({ error: 'studentId and email are required.' });

  const student = await Student.findOne({ _id: studentId, workspaceId: req.workspaceId });
  if (!student) return res.status(404).json({ error: 'Student not found in this workspace.' });

  const token = crypto.randomBytes(24).toString('hex');
  const boundedDays = Math.max(1, Math.min(90, Number(expiresInDays) || 30));
  const expiresAt = new Date(Date.now() + boundedDays * 24 * 60 * 60 * 1000);

  const invite = await ParentInvite.create({
    token,
    workspaceId: req.workspaceId,
    studentId: student._id,
    invitedByUserId: req.user.id,
    studentName: student.name,
    schoolName: req.workspace?.name || '',
    email: String(email).toLowerCase().trim(),
    status: 'pending',
    expiresAt,
  });

  const appBase = (process.env.APP_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const inviteUrl = `${appBase}/connect/parent/${invite.token}`;

  // Email is best-effort: the link is returned regardless so the admin can copy it.
  try {
    await sendParentInvite({ to: invite.email, studentName: invite.studentName, schoolName: invite.schoolName, inviteUrl, expiresAt });
  } catch (_) { /* surfaced via emailSent flag */ }

  res.status(201).json({ inviteUrl, token: invite.token, email: invite.email, expiresAt });
}));

// ── Public preview ───────────────────────────────────────────────────────────
// GET /api/parent-invites/:token
router.get('/:token', asyncHandler(async (req, res) => {
  const invite = await ParentInvite.findOne({ token: req.params.token });
  if (!invite) return res.status(404).json({ error: 'Invite not found.' });
  await markExpiredIfNeeded(invite);
  res.json(safePreview(invite));
}));

// ── Accept ───────────────────────────────────────────────────────────────────
// POST /api/parent-invites/:token/accept
// Two modes: an authenticated parent (Bearer token) accepts directly, or a new
// guardian signs up inline with { name, password }. Creates a view-only link.
router.post('/:token/accept', asyncHandler(async (req, res) => {
  const invite = await ParentInvite.findOne({ token: req.params.token });
  if (!invite) return res.status(404).json({ error: 'Invite not found.' });
  await markExpiredIfNeeded(invite);
  if (invite.status === 'revoked') return res.status(400).json({ error: 'This invite has been revoked.' });
  if (invite.status === 'expired') return res.status(400).json({ error: 'This invite has expired.' });
  if (invite.status === 'accepted') return res.json({ alreadyAccepted: true, status: 'accepted' });

  // Resolve the acting user: decode an optional bearer token, else sign up.
  let user = null;
  let issuedToken = null;
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer')) {
    try {
      const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
      user = await User.findById(decoded.id);
    } catch (_) { /* fall through to signup */ }
  }

  if (!user) {
    const { name, password } = req.body || {};
    const existing = await User.findOne({ email: invite.email });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists. Please log in, then open the invite link again.' });
    }
    if (!name || !password) return res.status(400).json({ error: 'name and password are required to create your account.' });
    user = await User.create({ name, email: invite.email, password, role: 'parent', roles: ['parent'] });
    issuedToken = getSignedToken(user._id, 'parent');
  }

  await ensureParentWorkspace(user);

  // Create the view-only, school-sourced guardian link (idempotent).
  await StudentGuardian.updateOne(
    { studentId: invite.studentId, guardianUserId: user._id, workspaceId: invite.workspaceId },
    { $setOnInsert: {
      studentId: invite.studentId, guardianUserId: user._id, workspaceId: invite.workspaceId,
      relation: 'parent', accessLevel: 'view_only', source: 'school_invite',
    } },
    { upsert: true }
  );

  invite.status = 'accepted';
  invite.acceptedByUserId = user._id;
  invite.acceptedAt = new Date();
  await invite.save();

  res.json({
    status: 'accepted',
    linked: true,
    token: issuedToken, // present only for a freshly-created account
    studentName: invite.studentName,
  });
}));

// ── A parent's view-only school children ─────────────────────────────────────
// GET /api/parent-invites/children  (authenticated)
router.get('/children/list', protect, asyncHandler(async (req, res) => {
  const links = await StudentGuardian.find({ guardianUserId: req.user.id, source: 'school_invite' }).lean();
  const out = await Promise.all(links.map(async (link) => {
    const student = await Student.findById(link.studentId).lean();
    if (!student) return null;
    const recs = await MasteryRecord.find({ studentId: student._id })
      .populate({ path: 'skillId', model: Skill }).lean();
    const attempted = recs.filter((r) => r.skillId && r.attempts > 0);
    const overall = attempted.length ? Math.round(attempted.reduce((s, r) => s + r.score, 0) / attempted.length) : 0;
    const weakest = [...attempted].sort((a, b) => a.score - b.score)[0];
    return {
      studentId: student._id,
      name: student.name,
      level: student.level,
      accessLevel: link.accessLevel,
      overallMastery: overall,
      weakestSkill: weakest?.skillId?.name || null,
      hasData: attempted.length > 0,
    };
  }));
  res.json({ children: out.filter(Boolean) });
}));

export default router;
