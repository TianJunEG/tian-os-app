import express from 'express';
import { protect } from '../middleware/auth.js';
import { resolveStudent } from '../utils/studentContext.js';
import {
  startRemediationSession,
  advanceRemediationStep,
  handleMasteryCheckResult,
  skipPrerequisite,
  getRemediationSessionStatus,
  getStudentRemediationSessions,
} from '../services/mathpath/remediationSessionService.js';
import RemediationSession from '../models/mathpath/RemediationSession.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

function userId(req) {
  return String(req.user?.id || req.user?._id || '');
}

function roleSet(user = {}) {
  return new Set([user.role, ...(Array.isArray(user.roles) ? user.roles : [])].filter(Boolean));
}

async function loadSession(req, sessionId, { write = false } = {}) {
  const session = await RemediationSession.findById(sessionId).lean();
  if (!session) {
    const err = new Error('Remediation session not found.');
    err.status = 404;
    throw err;
  }
  await resolveStudent(req, session.studentId, { write });
  return session;
}

router.post('/', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req, req.body?.studentId, { write: true });
    const session = await startRemediationSession({
      studentId: String(student._id),
      diagnosticSessionId: String(req.body?.diagnosticSessionId || ''),
      assignedByUserId: userId(req),
      maxReteachAttempts: Number(req.body?.maxReteachAttempts) || 3,
    });
    return res.status(201).json({ session });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not start remediation session.' });
  }
}));

router.get('/', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req, req.query?.studentId);
    const sessions = await getStudentRemediationSessions({
      studentId: String(student._id),
      status: req.query?.status || undefined,
    });
    return res.json({ studentId: String(student._id), sessions });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not load remediation sessions.' });
  }
}));

router.get('/:id', protect, asyncHandler(async (req, res) => {
  try {
    await loadSession(req, req.params.id);
    const result = await getRemediationSessionStatus({ remediationSessionId: req.params.id });
    return res.json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not load remediation session.' });
  }
}));

router.post('/:id/advance', protect, asyncHandler(async (req, res) => {
  try {
    await loadSession(req, req.params.id, { write: true });
    const session = await advanceRemediationStep({ remediationSessionId: req.params.id });
    return res.json({ session });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not advance remediation step.' });
  }
}));

router.post('/:id/handle-mastery', protect, asyncHandler(async (req, res) => {
  try {
    await loadSession(req, req.params.id, { write: true });
    const result = await handleMasteryCheckResult({
      remediationSessionId: req.params.id,
      passed: Boolean(req.body?.passed),
    });
    return res.json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not process mastery result.' });
  }
}));

router.post('/:id/skip-prerequisite', protect, asyncHandler(async (req, res) => {
  try {
    await loadSession(req, req.params.id, { write: true });
    const roles = roleSet(req.user);
    if (!roles.has('parent') && !roles.has('tutor') && !roles.has('teacher') && !roles.has('admin')) {
      return res.status(403).json({ error: 'Only parents, tutors, teachers, or admins can skip prerequisites.' });
    }
    const session = await skipPrerequisite({
      remediationSessionId: req.params.id,
      skillId: String(req.body?.skillId || ''),
    });
    return res.json({ session });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not skip prerequisite.' });
  }
}));

export default router;
