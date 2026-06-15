import crypto from 'crypto';
import express from 'express';
import { protect } from '../middleware/auth.js';
import { requireWorkspace } from '../middleware/workspace.js';
import TutorInvite from '../models/TutorInvite.js';
import TutorStudentLink from '../models/TutorStudentLink.js';
import Student from '../models/Student.js';
import StudentGuardian from '../models/StudentGuardian.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

function now() {
  return new Date();
}

function isExpired(invite) {
  return !invite?.expiresAt || invite.expiresAt.getTime() <= Date.now();
}

async function markExpiredIfNeeded(invite) {
  if (invite && invite.status === 'pending' && isExpired(invite)) {
    invite.status = 'expired';
    await invite.save();
  }
}

function safeInvitePreview(invite) {
  return {
    tutorName: invite.tutorName,
    focusArea: invite.focusArea,
    expiresAt: invite.expiresAt,
    status: invite.status,
  };
}

// POST /api/tutor/invites
// Tutor creates an invite link in their active tutor workspace.
router.post('/', protect, requireWorkspace, asyncHandler(async (req, res) => {
  try {
    if (req.workspaceRole !== 'tutor') {
      return res.status(403).json({ error: 'Not a tutor workspace.' });
    }

    const tutorUser = await User.findById(req.user.id).select('name');
    if (!tutorUser) return res.status(404).json({ error: 'Tutor account not found.' });

    const token = crypto.randomBytes(24).toString('hex');
    const focusArea = String(req.body?.focusArea || 'MathPath').trim() || 'MathPath';
    const expiresInDays = Number(req.body?.expiresInDays || 7);
    const boundedDays = Number.isFinite(expiresInDays) ? Math.max(1, Math.min(30, expiresInDays)) : 7;
    const expiresAt = new Date(Date.now() + boundedDays * 24 * 60 * 60 * 1000);

    const invite = await TutorInvite.create({
      token,
      workspaceId: req.workspaceId,
      tutorUserId: req.user.id,
      tutorName: tutorUser.name || 'Tutor',
      focusArea,
      status: 'pending',
      expiresAt,
    });

    const appBase = (process.env.APP_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const inviteUrl = `${appBase}/connect/tutor/${invite.token}`;

    return res.status(201).json({
      inviteUrl,
      token: invite.token,
      expiresAt: invite.expiresAt,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create tutor invite.' });
  }
}));

// GET /api/tutor/invites/:token
// Safe preview route; does not expose internal IDs.
router.get('/:token', asyncHandler(async (req, res) => {
  try {
    const invite = await TutorInvite.findOne({ token: req.params.token });
    if (!invite) return res.status(404).json({ error: 'Invite not found.' });
    await markExpiredIfNeeded(invite);
    return res.json(safeInvitePreview(invite));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load invite.' });
  }
}));

// POST /api/tutor/invites/:token/accept
// Parent or student accepts invite and links an existing student profile.
router.post('/:token/accept', protect, asyncHandler(async (req, res) => {
  try {
    const invite = await TutorInvite.findOne({ token: req.params.token });
    if (!invite) return res.status(404).json({ error: 'Invite not found.' });

    await markExpiredIfNeeded(invite);
    if (invite.status === 'revoked') return res.status(400).json({ error: 'Invite has been revoked.' });
    if (invite.status === 'expired') return res.status(400).json({ error: 'Invite has expired.' });

    if (invite.status === 'accepted') {
      const existing = await TutorStudentLink.findOne({
        workspaceId: invite.workspaceId,
        tutorUserId: invite.tutorUserId,
        studentId: invite.acceptedStudentId,
      });
      return res.json({
        linked: Boolean(existing),
        alreadyLinked: Boolean(existing),
        status: 'accepted',
      });
    }

    let selectedStudentId = null;
    if (req.user.role === 'parent') {
      selectedStudentId = req.body?.studentId;
      if (!selectedStudentId) {
        return res.status(400).json({ error: 'studentId is required for parent acceptance.' });
      }
      const guardian = await StudentGuardian.findOne({
        studentId: selectedStudentId,
        guardianUserId: req.user.id,
      });
      if (!guardian) {
        return res.status(403).json({ error: 'You can only connect children you are guardian of.' });
      }
    } else if (req.user.role === 'student') {
      const own = await Student.findOne({ userId: req.user.id });
      if (!own) {
        return res.status(400).json({ error: 'No student profile found. Please create your student profile first.' });
      }
      selectedStudentId = own._id;
    } else {
      return res.status(403).json({ error: 'Only parent or student accounts can accept tutor invites.' });
    }

    const student = await Student.findById(selectedStudentId);
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    const sameLink = await TutorStudentLink.findOne({
      workspaceId: invite.workspaceId,
      tutorUserId: invite.tutorUserId,
      studentId: selectedStudentId,
    });
    if (sameLink) {
      invite.status = 'accepted';
      invite.acceptedByUserId = req.user.id;
      invite.acceptedStudentId = selectedStudentId;
      invite.acceptedAt = now();
      await invite.save();
      return res.json({ linked: true, alreadyLinked: true, status: invite.status });
    }

    const existingWorkspaceLink = await TutorStudentLink.findOne({
      workspaceId: invite.workspaceId,
      studentId: selectedStudentId,
    });
    if (existingWorkspaceLink) {
      return res.status(409).json({ error: 'This student is already linked in this tutor workspace.' });
    }

    await TutorStudentLink.create({
      workspaceId: invite.workspaceId,
      tutorUserId: invite.tutorUserId,
      studentId: selectedStudentId,
      focusArea: invite.focusArea || 'MathPath',
      status: 'active',
    });

    invite.status = 'accepted';
    invite.acceptedByUserId = req.user.id;
    invite.acceptedStudentId = selectedStudentId;
    invite.acceptedAt = now();
    await invite.save();

    return res.json({ linked: true, alreadyLinked: false, status: invite.status });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: 'Student is already linked to this tutor workspace.' });
    }
    return res.status(500).json({ error: 'Failed to accept tutor invite.' });
  }
}));

export default router;

