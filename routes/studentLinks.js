import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Student from '../models/Student.js';
import StudentGuardian from '../models/StudentGuardian.js';
import TutorStudentLink from '../models/TutorStudentLink.js';
import StudentAccountLink, { DEFAULT_SHARED_SCOPES } from '../models/StudentAccountLink.js';
import SchoolClaimCode from '../models/SchoolClaimCode.js';
import { notify } from '../services/notifications/notificationService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Gap C — consented tutor↔school-student linking. New, isolated router mounted at
// /api/student-links so it coexists with the school/parent-invite work. All
// routes are user-scoped (protect); guardian/issuer checks are per-handler.
const router = express.Router();
router.use(protect);

const CLAIM_TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function isGuardianOf(req, studentId) {
  return Boolean(await StudentGuardian.findOne({ studentId, guardianUserId: req.user.id }));
}

// ── Tutor: request a link to an existing student ───────────────────────────
// POST /api/student-links/tutor/request { studentId }
router.post('/tutor/request', asyncHandler(async (req, res) => {
  const { studentId } = req.body || {};
  if (!studentId) return res.status(400).json({ error: 'studentId is required.' });
  const student = await Student.findById(studentId);
  if (!student) return res.status(404).json({ error: 'Student not found.' });
  const workspaceId = req.header('X-Workspace-Id') || null;

  // Reuse an existing pending/active link if present (idempotent).
  let link = await StudentAccountLink.findOne({
    tutorUserId: req.user.id, studentId, workspaceId, status: { $in: ['consent_pending', 'active'] },
  });
  if (!link) {
    link = await StudentAccountLink.create({
      studentId, studentUserId: student.userId || null,
      fromContext: 'school', toContext: 'tutor',
      tutorUserId: req.user.id, workspaceId,
      requestedByUserId: req.user.id, status: 'consent_pending',
      sharedScopes: DEFAULT_SHARED_SCOPES,
    });
    // Notify the student's guardians to consent.
    const guardians = await StudentGuardian.find({ studentId });
    await Promise.all(guardians.map((g) => notify({
      recipientUserId: g.guardianUserId,
      type: 'link_request',
      title: `A tutor requested access to ${student.name}'s math progress`,
      body: 'Review and approve to let the tutor see math progress and mastery.',
      linkPath: '/parent/link-requests',
      sourceType: 'StudentAccountLink', sourceId: link._id,
    })));
  }
  res.status(201).json({ link });
}));

// ── Guardian: pending requests for their children ──────────────────────────
router.get('/requests', asyncHandler(async (req, res) => {
  const links = await StudentGuardian.find({ guardianUserId: req.user.id }).select('studentId').lean();
  const studentIds = links.map((l) => l.studentId);
  const requests = await StudentAccountLink.find({ studentId: { $in: studentIds }, status: 'consent_pending' }).sort({ createdAt: -1 });
  res.json({ requests });
}));

// POST /api/student-links/requests/:id/consent { scopes? }
router.post('/requests/:id/consent', asyncHandler(async (req, res) => {
  const link = await StudentAccountLink.findById(req.params.id);
  if (!link || link.status !== 'consent_pending') return res.status(404).json({ error: 'Request not found.' });
  if (!(await isGuardianOf(req, link.studentId))) return res.status(403).json({ error: 'Not a guardian of this student.' });

  if (Array.isArray(req.body?.scopes) && req.body.scopes.length) link.sharedScopes = req.body.scopes;
  link.status = 'active';
  link.consentByUserId = req.user.id;
  link.consentAt = new Date();
  await link.save();

  // Create the operational TutorStudentLink the tutor routes check (idempotent).
  await TutorStudentLink.findOneAndUpdate(
    { workspaceId: link.workspaceId, studentId: link.studentId },
    { $set: { tutorUserId: link.tutorUserId, focusArea: 'MathPath', status: 'active' } },
    { upsert: true, setDefaultsOnInsert: true },
  );
  res.json({ link });
}));

router.post('/requests/:id/decline', asyncHandler(async (req, res) => {
  const link = await StudentAccountLink.findById(req.params.id);
  if (!link || link.status !== 'consent_pending') return res.status(404).json({ error: 'Request not found.' });
  if (!(await isGuardianOf(req, link.studentId))) return res.status(403).json({ error: 'Not a guardian of this student.' });
  link.status = 'revoked';
  await link.save();
  res.json({ link });
}));

// ── Guardian: manage active links ──────────────────────────────────────────
router.get('/mine', asyncHandler(async (req, res) => {
  const links = await StudentGuardian.find({ guardianUserId: req.user.id }).select('studentId').lean();
  const studentIds = links.map((l) => l.studentId);
  const active = await StudentAccountLink.find({ studentId: { $in: studentIds }, status: 'active' }).sort({ updatedAt: -1 });
  res.json({ links: active });
}));

router.patch('/:id/scopes', asyncHandler(async (req, res) => {
  const link = await StudentAccountLink.findById(req.params.id);
  if (!link) return res.status(404).json({ error: 'Link not found.' });
  if (!(await isGuardianOf(req, link.studentId))) return res.status(403).json({ error: 'Not a guardian of this student.' });
  if (!Array.isArray(req.body?.scopes)) return res.status(400).json({ error: 'scopes array required.' });
  link.sharedScopes = req.body.scopes;
  await link.save();
  res.json({ link });
}));

// POST /api/student-links/:id/revoke — ends tutor access immediately.
router.post('/:id/revoke', asyncHandler(async (req, res) => {
  const link = await StudentAccountLink.findById(req.params.id);
  if (!link) return res.status(404).json({ error: 'Link not found.' });
  if (!(await isGuardianOf(req, link.studentId))) return res.status(403).json({ error: 'Not a guardian of this student.' });
  link.status = 'revoked';
  await link.save();
  await TutorStudentLink.findOneAndUpdate(
    { workspaceId: link.workspaceId, studentId: link.studentId, tutorUserId: link.tutorUserId },
    { $set: { status: 'ended' } },
  );
  res.json({ link });
}));

// ── Two-email claim code ───────────────────────────────────────────────────
// POST /api/student-links/claim-code/issue { studentId } — school side.
router.post('/claim-code/issue', authorize('teacher', 'school_admin', 'admin'), asyncHandler(async (req, res) => {
  const { studentId } = req.body || {};
  const student = await Student.findById(studentId);
  if (!student) return res.status(404).json({ error: 'Student not found.' });
  const claim = await SchoolClaimCode.create({
    studentId, schoolUserId: req.user.id,
    expiresAt: new Date(Date.now() + CLAIM_TTL_MS),
  });
  res.status(201).json({ code: claim.code, expiresAt: claim.expiresAt });
}));

// POST /api/student-links/claim-code/redeem { code } — guardian proves ownership,
// establishing guardianship of the existing school student account.
router.post('/claim-code/redeem', asyncHandler(async (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: 'code is required.' });
  const claim = await SchoolClaimCode.findOne({ code: String(code).toUpperCase().trim(), status: 'active' });
  if (!claim || claim.expiresAt < new Date()) return res.status(404).json({ error: 'Invalid or expired code.' });
  const student = await Student.findById(claim.studentId);
  if (!student) return res.status(404).json({ error: 'Student not found.' });

  await StudentGuardian.findOneAndUpdate(
    { studentId: student._id, guardianUserId: req.user.id },
    { $set: { workspaceId: student.workspaceId, relation: 'parent' } },
    { upsert: true, setDefaultsOnInsert: true },
  );
  claim.status = 'redeemed';
  claim.redeemedByUserId = req.user.id;
  claim.redeemedAt = new Date();
  await claim.save();
  res.json({ studentId: student._id, linked: true });
}));

export default router;
