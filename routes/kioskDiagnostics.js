import express from 'express';
import mongoose from 'mongoose';
import ClassDiagnosticSession from '../models/ClassDiagnosticSession.js';
import Student from '../models/Student.js';
import MathPathDiagnosticSession from '../models/mathpath/MathPathDiagnosticSession.js';
import {
  startAdaptiveDiagnostic,
  answerAdaptiveDiagnostic,
} from '../services/diagnostics/diagnosticRuntime.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { mintAttemptToken, requireAttemptToken } from '../middleware/kioskAuth.js';

// PUBLIC (unauthenticated) router for the in-class diagnostic kiosk. Mounted
// WITHOUT `protect`. Everything is scoped to an open, unexpired ClassDiagnosticSession
// (looked up by code) and, for answer/finish, to a minted attempt token.
const router = express.Router();

// Look up an open, non-expired session by code. Returns { session, gone }.
async function findSessionByCode(code) {
  if (!code) return null;
  const session = await ClassDiagnosticSession.findOne({ code: String(code).toUpperCase().trim() });
  if (!session) return null;
  const expired = session.expiresAt && session.expiresAt.getTime() < Date.now();
  return { session, gone: session.status !== 'open' || expired };
}

// B1 — kiosk landing: session info + roster (name + opaque id + taken only).
router.get('/sessions/:code', asyncHandler(async (req, res) => {
  const found = await findSessionByCode(req.params.code);
  if (!found) return res.status(404).json({ error: 'Session not found.' });
  if (found.gone) return res.status(410).json({ error: 'This class session is closed or has expired.' });
  const { session } = found;
  return res.json({
    code: session.code,
    subjectId: session.subjectId,
    domainId: session.domainId,
    mode: session.mode,
    roster: session.roster.map((r) => ({
      studentId: String(r.studentId),
      name: r.name,
      taken: !!r.taken,
    })),
  });
}));

// B2 — begin attempt: claim the name, start the existing adaptive engine, mint a
// bound attempt token. This is the only public endpoint that mints a token.
router.post('/sessions/:code/begin', asyncHandler(async (req, res) => {
  const found = await findSessionByCode(req.params.code);
  if (!found) return res.status(404).json({ error: 'Session not found.' });
  if (found.gone) return res.status(410).json({ error: 'This class session is closed or has expired.' });
  const { session } = found;

  const studentId = String(req.body?.studentId || '');
  if (!mongoose.isValidObjectId(studentId)) {
    return res.status(400).json({ error: 'Please choose your name to begin.' });
  }
  const rosterEntry = session.roster.find((r) => String(r.studentId) === studentId);
  if (!rosterEntry) return res.status(403).json({ error: 'That name is not in this class session.' });
  if (rosterEntry.taken) {
    return res.status(409).json({ error: 'That name has already started. Ask your teacher if you need to retry.' });
  }

  const student = await Student.findById(studentId);
  if (!student) return res.status(404).json({ error: 'Student not found.' });
  // Cross-workspace leakage guard + results-write guard (writes no-op without a workspace).
  if (!student.workspaceId || String(student.workspaceId) !== String(session.workspaceId)) {
    return res.status(403).json({ error: 'Student does not belong to this class.' });
  }

  // Atomically claim the roster slot so two iPads can't both take the same name.
  const claimed = await ClassDiagnosticSession.findOneAndUpdate(
    { _id: session._id, status: 'open', roster: { $elemMatch: { studentId: student._id, taken: false } } },
    { $set: { 'roster.$.taken': true, 'roster.$.status': 'in_progress', 'roster.$.startedAt': new Date() } },
    { new: true },
  );
  if (!claimed) return res.status(409).json({ error: 'That name has already started.' });

  let payload;
  try {
    payload = await startAdaptiveDiagnostic({
      student,
      userId: '', // bypass the user-replay lookup path
      subjectId: session.subjectId || 'math',
      domainId: session.domainId,
      requestedMode: session.mode,
      studentLevel: session.studentLevel || student.level,
      diagnosticPurpose: 'baseline',
      enforceReplay: false, // kiosk students may legitimately re-sit across sessions
    });
  } catch (err) {
    // Roll the claim back so the student can try again, then surface the error.
    await ClassDiagnosticSession.updateOne(
      { _id: session._id, 'roster.studentId': student._id },
      { $set: { 'roster.$.taken': false, 'roster.$.status': 'not_started', 'roster.$.startedAt': null } },
    );
    const status = Number(err?.status) || 500;
    return res.status(status).json({ error: err?.publicMessage || err?.message || 'Could not start the diagnostic.' });
  }

  const diagnosticSessionId = payload.sessionId || payload.session?.sessionId;
  // Tag the per-student diagnostic so the teacher's live view can find it.
  await MathPathDiagnosticSession.updateOne(
    { diagnosticSessionId },
    { $set: { sourceType: 'kiosk', sourceId: String(session._id) } },
  );
  const { token, jti } = mintAttemptToken({
    diagnosticSessionId,
    studentId: student._id,
    classDiagSessionId: session._id,
  });
  await ClassDiagnosticSession.updateOne(
    { _id: session._id, 'roster.studentId': student._id },
    { $set: { 'roster.$.diagnosticSessionId': diagnosticSessionId, 'roster.$.attemptTokenJti': jti } },
  );

  return res.json({ attemptToken: token, ...payload });
}));

// Validate the attempt token binds to :sessionId and load the student.
async function loadAttempt(req, res) {
  if (req.kiosk.sid !== req.params.sessionId) {
    res.status(403).json({ error: 'This attempt token does not match the session.' });
    return null;
  }
  const student = await Student.findById(req.kiosk.stu);
  if (!student) {
    res.status(404).json({ error: 'Student not found.' });
    return null;
  }
  return { student, sessionId: req.params.sessionId };
}

// B3 — submit an answer. Reuses the existing engine, which writes mistakes,
// mastery and the recommended-practice pack automatically on completion.
router.post('/diagnostics/:sessionId/answer', requireAttemptToken, asyncHandler(async (req, res) => {
  const ctx = await loadAttempt(req, res);
  if (!ctx) return undefined;
  const payload = await answerAdaptiveDiagnostic({
    student: ctx.student,
    sessionId: ctx.sessionId,
    body: req.body || {},
  });
  if (payload?.sessionComplete) {
    await ClassDiagnosticSession.updateOne(
      { _id: req.kiosk.cds, 'roster.studentId': ctx.student._id },
      { $set: { 'roster.$.status': 'completed', 'roster.$.completedAt': new Date() } },
    );
  }
  return res.json(payload);
}));

// B4 — explicit abandon (a clean finish already fired inside B3). Frees the iPad.
router.post('/diagnostics/:sessionId/finish', requireAttemptToken, asyncHandler(async (req, res) => {
  const ctx = await loadAttempt(req, res);
  if (!ctx) return undefined;
  const session = await MathPathDiagnosticSession.findOne({ diagnosticSessionId: ctx.sessionId });
  const completed = session?.status === 'completed';
  if (session && !completed) {
    session.status = 'abandoned';
    await session.save();
    await ClassDiagnosticSession.updateOne(
      { _id: req.kiosk.cds, 'roster.studentId': ctx.student._id },
      { $set: { 'roster.$.status': 'abandoned' } },
    );
  }
  return res.json({ ok: true, status: completed ? 'completed' : 'abandoned' });
}));

export default router;
