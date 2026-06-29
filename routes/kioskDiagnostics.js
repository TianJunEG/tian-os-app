import express from 'express';
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
    // Expose an opaque per-session ref (the roster index), never the real student
    // ObjectId — the picker only needs to identify a slot to claim.
    roster: session.roster.map((r, i) => ({
      ref: String(i),
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

  const idx = Number(req.body?.ref);
  if (!Number.isInteger(idx) || idx < 0 || idx >= session.roster.length) {
    return res.status(400).json({ error: 'Please choose your name to begin.' });
  }
  const rosterEntry = session.roster[idx];
  if (rosterEntry.taken) {
    return res.status(409).json({ error: 'That name has already started. Ask your teacher if you need to retry.' });
  }

  const student = await Student.findById(rosterEntry.studentId);
  // Generic message — never reveal roster/workspace internals to an unauthenticated
  // caller. (The roster was workspace-filtered at creation, so this is defence in depth.)
  if (!student || !student.workspaceId || String(student.workspaceId) !== String(session.workspaceId)) {
    return res.status(400).json({ error: 'That selection is not available. Please tell your teacher.' });
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
    // Roll the claim back so the student can try again.
    await ClassDiagnosticSession.updateOne(
      { _id: session._id, 'roster.studentId': student._id },
      { $set: { 'roster.$.taken': false, 'roster.$.status': 'not_started', 'roster.$.startedAt': null } },
    );
    // Never leak engine internals (e.g. "skills are not seeded yet") to the public kiosk.
    console.error('[kiosk] begin failed:', err?.message || err);
    return res.status(500).json({ error: 'Could not start the check-in right now. Please tell your teacher.' });
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
  // The parent class session must still be open AND unexpired — a still-valid token
  // must not let answers through after the teacher ends the check-in or it expires.
  const classSession = await ClassDiagnosticSession.findById(req.kiosk.cds);
  if (!classSession || classSession.status !== 'open'
      || (classSession.expiresAt && classSession.expiresAt.getTime() < Date.now())) {
    res.status(410).json({ error: 'This class check-in is no longer active.' });
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
