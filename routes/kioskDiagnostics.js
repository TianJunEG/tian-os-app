import express from 'express';
import ClassDiagnosticSession from '../models/ClassDiagnosticSession.js';
import Student from '../models/Student.js';
import MathPathDiagnosticSession from '../models/mathpath/MathPathDiagnosticSession.js';
import PracticeSession from '../models/PracticeSession.js';
import PracticeAttempt from '../models/PracticeAttempt.js';
import Question from '../models/Question.js';
import Mistake from '../models/Mistake.js';
import {
  startAdaptiveDiagnostic,
  answerAdaptiveDiagnostic,
  scrubQuestionForClient,
} from '../services/diagnostics/diagnosticRuntime.js';
import { getDiagnosticDomain } from '../services/diagnostics/diagnosticDomainRegistry.js';
import { ensureQuestionsForSkills, clientQuestion } from './practice.js';
import { selectSimilarQuestions } from '../utils/worksheetGen.js';
import { isCorrectWithContext } from '../utils/answerCheck.js';
import { recordAttempt } from '../utils/masteryEngine.js';
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
  const isPractice = session.type === 'practice';
  return res.json({
    code: session.code,
    subjectId: session.subjectId,
    domainId: session.domainId,
    mode: session.mode,
    type: session.type || 'diagnostic',
    // For a practice session, tell the picker what skill/how many so it can label
    // the screen ("2-digit addition practice"). Never exposes answers.
    practiceConfig: isPractice
      ? { skillName: session.practiceConfig?.skillName || '', questionCount: session.practiceConfig?.questionCount ?? null }
      : undefined,
    // Expose an opaque per-session ref (the roster index), never the real student
    // ObjectId — the picker only needs to identify a slot to claim. Practice allows
    // redo, so `taken` is reported false there (the tile stays tappable).
    roster: session.roster.map((r, i) => ({
      ref: String(i),
      name: r.name,
      taken: isPractice ? false : !!r.taken,
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

// ── Practice mode ────────────────────────────────────────────────────────────
// A practice kiosk serves a FIXED set of questions on one skill (not adaptive).
// The client walks the returned items[] locally, POSTing one attempt each, then
// /complete. Results land on the real student's account (PracticeSession +
// PracticeAttempt + mastery + Mistakes) exactly like authenticated practice, so
// Mistakes review / corrections come free. Practice ALLOWS REDO — a name never
// locks; each begin starts a fresh PracticeSession.

// P1 — begin a practice attempt: claim the name (redo-friendly), build a fixed
// question set for the configured skill, create a PracticeSession, mint a token.
router.post('/sessions/:code/practice-begin', asyncHandler(async (req, res) => {
  const found = await findSessionByCode(req.params.code);
  if (!found) return res.status(404).json({ error: 'Session not found.' });
  if (found.gone) return res.status(410).json({ error: 'This class session is closed or has expired.' });
  const { session } = found;
  if (session.type !== 'practice') {
    return res.status(400).json({ error: 'This code is not a practice check-in.' });
  }

  const idx = Number(req.body?.ref);
  if (!Number.isInteger(idx) || idx < 0 || idx >= session.roster.length) {
    return res.status(400).json({ error: 'Please choose your name to begin.' });
  }
  const rosterEntry = session.roster[idx];

  const student = await Student.findById(rosterEntry.studentId);
  if (!student || !student.workspaceId || String(student.workspaceId) !== String(session.workspaceId)) {
    return res.status(400).json({ error: 'That selection is not available. Please tell your teacher.' });
  }

  const skillId = session.practiceConfig?.skillId;
  const questionCount = session.practiceConfig?.questionCount || 10;
  if (!skillId) return res.status(500).json({ error: 'This practice is not set up yet. Please tell your teacher.' });

  // Build the fixed set: prefer seeded/similar questions, fall back to generating
  // a bank for the skill (mirrors the authenticated practice route). Done before
  // any state change so a failure leaves the roster untouched.
  let questions = [];
  try {
    questions = await selectSimilarQuestions({
      studentId: student._id, skillIds: [skillId], difficulty: 'medium', count: questionCount, excludeQuestionIds: [],
    });
    if (!questions.length) {
      const generated = await ensureQuestionsForSkills([skillId], Math.max(questionCount, 6));
      questions = generated.slice(0, questionCount);
    }
  } catch (err) {
    console.error('[kiosk] practice question build failed:', err?.message || err);
    questions = [];
  }
  if (!questions.length) {
    return res.status(500).json({ error: 'Could not start this practice right now. Please tell your teacher.' });
  }

  const practiceSession = await PracticeSession.create({
    studentId: student._id,
    workspaceId: student.workspaceId,
    module: 'MathPath',
    mode: 'practice',
    feature: 'Class Practice Kiosk',
    skillIds: [skillId],
    // Persist the fixed set's order so a mid-set refresh rehydrates the same items.
    questionIds: questions.map((q) => q._id),
    status: 'active',
  });

  const { token, jti } = mintAttemptToken({
    diagnosticSessionId: String(practiceSession._id), // token.sid holds the practice session id
    studentId: student._id,
    classDiagSessionId: session._id,
  });

  // Redo-friendly: match by studentId only (NOT taken:false), so a finished
  // student can tap their name again and get a fresh set. Latest attempt wins.
  await ClassDiagnosticSession.updateOne(
    { _id: session._id, status: 'open', 'roster.studentId': student._id },
    {
      $set: {
        'roster.$.status': 'in_progress',
        'roster.$.startedAt': new Date(),
        'roster.$.completedAt': null,
        'roster.$.practiceSessionId': String(practiceSession._id),
        'roster.$.attemptTokenJti': jti,
      },
    },
  );

  return res.json({
    attemptToken: token,
    sessionId: String(practiceSession._id),
    skillName: session.practiceConfig?.skillName || '',
    items: questions.map(clientQuestion),
  });
}));

// P2 — submit one practice answer. Scores + persists to the real account.
// Mirrors the short-answer/MCQ core of routes/practice.js POST /sessions/:id/attempts
// (no AI/open-ended marking here — kiosk math is short-answer/MCQ).
// NOTE: keep in sync with routes/practice.js.
router.post('/practice/:sessionId/attempt', requireAttemptToken, asyncHandler(async (req, res) => {
  const ctx = await loadAttempt(req, res);
  if (!ctx) return undefined;

  const { questionId, answer, timeMs = null, timeTakenSeconds = null } = req.body || {};
  const skipped = Boolean(req.body?.skipped);
  const q = await Question.findById(questionId);
  if (!q) return res.status(404).json({ error: 'Question not found.' });

  const resolvedTimeMs = timeMs ?? (timeTakenSeconds != null ? Math.round(Number(timeTakenSeconds) * 1000) : null);
  const correct = skipped ? false : isCorrectWithContext(answer, q.answer, q.stem);
  const confidence = req.body?.confidence || '';

  await PracticeAttempt.create({
    sessionId: ctx.sessionId, studentId: ctx.student._id, questionId: q._id, skillId: q.skillId,
    answer: String(answer ?? ''), correct, timeMs: resolvedTimeMs,
    timeTakenSeconds: timeTakenSeconds ?? (resolvedTimeMs == null ? null : Math.round(Number(resolvedTimeMs) / 1000)),
    confidence, skipped,
  });

  await recordAttempt({
    studentId: ctx.student._id, skillId: q.skillId, workspaceId: ctx.student.workspaceId,
    correct, timeMs: resolvedTimeMs, module: 'MathPath', subject: 'Math',
  });

  if (!correct) {
    await Mistake.create({
      studentId: ctx.student._id, workspaceId: ctx.student.workspaceId, questionId: q._id, skillId: q.skillId,
      sessionId: String(ctx.sessionId), skillCode: String(q.skillId || ''), module: 'MathPath',
      questionStem: q.stem, workedSolution: q.modelAnswer || q.workedSolution,
      studentAnswer: String(answer ?? ''), correctAnswer: q.modelAnswer || q.answer,
      confidence, timestamp: new Date(),
      mistakeType: 'unknown', misconceptionTag: q.misconceptionTag || '', status: 'open',
      source: 'practice-incorrect',
    });
  }

  // Do NOT leak the correct answer / worked solution on the shared iPad.
  return res.json({ correct });
}));

// P3 — finish a practice set: summarise and mark the roster slot complete.
router.post('/practice/:sessionId/complete', requireAttemptToken, asyncHandler(async (req, res) => {
  const ctx = await loadAttempt(req, res);
  if (!ctx) return undefined;

  const attempts = await PracticeAttempt.find({ sessionId: ctx.sessionId });
  const total = attempts.length;
  const correct = attempts.filter((a) => a.correct).length;
  const scorePct = total ? Math.round((correct / total) * 100) : 0;
  const times = attempts.map((a) => a.timeMs).filter((t) => typeof t === 'number');

  const practiceSession = await PracticeSession.findById(ctx.sessionId);
  if (practiceSession && practiceSession.status !== 'completed') {
    practiceSession.status = 'completed';
    practiceSession.endedAt = new Date();
    practiceSession.summary = {
      total, correct, scorePct,
      avgTimeMs: times.length ? Math.round(times.reduce((s, t) => s + t, 0) / times.length) : null,
    };
    // Intentionally skip the remediation-gate side effects that the authenticated
    // complete path applies — a one-off class practice set shouldn't gate a student
    // into guided mode.
    await practiceSession.save();
  }

  await ClassDiagnosticSession.updateOne(
    { _id: req.kiosk.cds, 'roster.studentId': ctx.student._id },
    { $set: { 'roster.$.status': 'completed', 'roster.$.completedAt': new Date() } },
  );

  return res.json({ summary: { total, correct, scorePct } });
}));

// RESUME — rehydrate an in-progress attempt after a mid-attempt page refresh
// (both modes). The attempt token lives in the iPad's sessionStorage so it
// survives a reload; this returns the current question (diagnostic) or the fixed
// item set + how many are already answered (practice), so the student continues
// where they left off instead of being dumped back to the name list.
router.get('/attempt/:sessionId/resume', requireAttemptToken, asyncHandler(async (req, res) => {
  const ctx = await loadAttempt(req, res);
  if (!ctx) return undefined;
  const classSession = await ClassDiagnosticSession.findById(req.kiosk.cds).lean();
  const type = classSession?.type || 'diagnostic';

  if (type === 'practice') {
    const ps = await PracticeSession.findById(ctx.sessionId).lean();
    if (!ps) return res.status(404).json({ error: 'Practice attempt not found.' });
    if (ps.status === 'completed') return res.json({ mode: 'practice', sessionComplete: true });
    const orderedIds = (ps.questionIds || []).map(String);
    const qDocs = await Question.find({ _id: { $in: orderedIds } }).populate('skillId', 'name topicId');
    const byId = new Map(qDocs.map((q) => [String(q._id), q]));
    const items = orderedIds.map((id) => byId.get(id)).filter(Boolean).map(clientQuestion);
    const answeredIds = new Set(
      (await PracticeAttempt.find({ sessionId: ctx.sessionId }).select('questionId').lean())
        .map((a) => String(a.questionId)),
    );
    // The kiosk practice walk is strictly linear, so the answered count is the
    // index to resume at (no answer leaked — items[] never carries the answer).
    const answeredCount = items.filter((it) => answeredIds.has(String(it.questionId))).length;
    return res.json({
      mode: 'practice',
      sessionComplete: false,
      items,
      answeredCount,
      skillName: classSession?.practiceConfig?.skillName || '',
    });
  }

  // Diagnostic — return the question the student is currently on (server-side
  // currentQuestionId), scrubbed of its answer.
  const diag = await MathPathDiagnosticSession.findOne({ diagnosticSessionId: ctx.sessionId }).lean();
  if (!diag) return res.status(404).json({ error: 'Diagnostic attempt not found.' });
  if (diag.status === 'completed') return res.json({ mode: 'diagnostic', sessionComplete: true });
  let currentQuestion = null;
  if (diag.currentQuestionId) {
    try {
      const domain = getDiagnosticDomain({ subjectId: diag.subjectId || 'math', domainId: diag.domainId });
      const qDoc = await domain.getQuestionById(diag.currentQuestionId);
      if (qDoc) currentQuestion = scrubQuestionForClient(domain.normaliseQuestion(qDoc, qDoc.skillId));
    } catch (_) { /* fall through: client sends them back to the name list */ }
  }
  const adaptiveState = diag.adaptiveState || {};
  return res.json({
    mode: 'diagnostic',
    sessionComplete: false,
    currentQuestion,
    progress: {
      answeredCount: (adaptiveState.responses || []).length,
      estimatedQuestionCount: adaptiveState.maxQuestions || 10,
    },
  });
}));

export default router;
