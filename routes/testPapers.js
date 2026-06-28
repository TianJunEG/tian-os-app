import crypto from 'crypto';
import express from 'express';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { resolveStudent } from '../utils/studentContext.js';
import { gradeAnswer } from '../utils/testPaperGrading.js';
import { recordLearningEvents } from '../services/telemetry/learningTelemetryService.js';
import TestPaper from '../models/TestPaper.js';
import TestPaperSession from '../models/TestPaperSession.js';
import Mistake from '../models/Mistake.js';

const router = express.Router();

// Project an embedded question to the shape the client may see DURING a sitting
// — answer / worked solution / solution steps are withheld until submission.
function toClientQuestion(q) {
  return {
    order: q.order,
    section: q.section,
    marks: q.marks,
    type: q.type,
    stem: q.stem,
    choices: Array.isArray(q.choices) ? q.choices : [],
    unit: q.unit || '',
    diagram: q.diagram || null,
  };
}

function secondsRemaining(session) {
  if (!session.durationMinutes) return null; // untimed
  const elapsedSec = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
  return Math.max(0, session.durationMinutes * 60 - elapsedSec);
}

// GET /api/test-papers — list published papers + this student's best score.
router.get('/', protect, asyncHandler(async (req, res) => {
  const student = await resolveStudent(req);
  const papers = await TestPaper.find({ status: 'published' })
    .select('paperCode title subject level durationMinutes totalMarks description tags questions')
    .lean();

  const sittings = await TestPaperSession.find({ studentId: student._id, status: 'completed' })
    .select('paperCode summary')
    .lean();
  const bestByPaper = {};
  for (const s of sittings) {
    const pct = s.summary?.scorePct || 0;
    if (bestByPaper[s.paperCode] == null || pct > bestByPaper[s.paperCode]) bestByPaper[s.paperCode] = pct;
  }

  // Surface the student's own level first (pilot spans P3–P6). Student.level is
  // a label like "Primary 5"; map to the paper level code "P5".
  const lm = String(student.level || '').match(/(\d+)/);
  const studentLevel = /primary/i.test(student.level || '') && lm ? `P${lm[1]}` : '';

  const shaped = papers.map((p) => ({
    paperCode: p.paperCode,
    title: p.title,
    subject: p.subject,
    level: p.level,
    durationMinutes: p.durationMinutes,
    totalMarks: p.totalMarks,
    description: p.description,
    tags: p.tags || [],
    questionCount: (p.questions || []).length,
    bestScorePct: bestByPaper[p.paperCode] ?? null,
    forYourLevel: studentLevel ? p.level === studentLevel : false,
  }));
  // Your-level papers first, then by level ascending, then title.
  shaped.sort((a, b) => (Number(b.forYourLevel) - Number(a.forYourLevel))
    || String(a.level).localeCompare(String(b.level))
    || String(a.title).localeCompare(String(b.title)));

  res.json({ studentLevel, papers: shaped });
}));

// GET /api/test-papers/:paperCode — paper meta (no answers).
router.get('/:paperCode', protect, asyncHandler(async (req, res) => {
  const paper = await TestPaper.findOne({ paperCode: req.params.paperCode, status: 'published' }).lean();
  if (!paper) return res.status(404).json({ error: 'Paper not found' });
  res.json({
    paperCode: paper.paperCode,
    title: paper.title,
    subject: paper.subject,
    level: paper.level,
    durationMinutes: paper.durationMinutes,
    totalMarks: paper.totalMarks,
    description: paper.description,
    tags: paper.tags || [],
    questionCount: (paper.questions || []).length,
  });
}));

// POST /api/test-papers/:paperCode/sessions — start a sitting.
router.post('/:paperCode/sessions', protect, asyncHandler(async (req, res) => {
  const student = await resolveStudent(req);
  const paper = await TestPaper.findOne({ paperCode: req.params.paperCode, status: 'published' }).lean();
  if (!paper) return res.status(404).json({ error: 'Paper not found' });

  const questions = [...(paper.questions || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  const sessionId = crypto.randomUUID();
  await TestPaperSession.create({
    sessionId,
    studentId: student._id,
    workspaceId: student.workspaceId,
    paperCode: paper.paperCode,
    paperTitle: paper.title,
    level: paper.level,
    durationMinutes: paper.durationMinutes,
    totalMarks: paper.totalMarks,
    status: 'inProgress',
    questions,
    answers: [],
    startedAt: new Date(),
  });

  res.status(201).json({
    sessionId,
    paperCode: paper.paperCode,
    title: paper.title,
    level: paper.level,
    durationMinutes: paper.durationMinutes,
    totalMarks: paper.totalMarks,
    secondsRemaining: paper.durationMinutes ? paper.durationMinutes * 60 : null,
    questions: questions.map(toClientQuestion),
  });
}));

// GET /api/test-papers/sessions/:sessionId — resume an in-progress sitting.
router.get('/sessions/:sessionId', protect, asyncHandler(async (req, res) => {
  const student = await resolveStudent(req);
  const session = await TestPaperSession.findOne({ sessionId: req.params.sessionId, studentId: student._id });
  if (!session) return res.status(404).json({ error: 'Sitting not found' });
  if (session.status !== 'inProgress') return res.status(409).json({ error: 'Sitting already submitted', status: session.status });

  res.json({
    sessionId: session.sessionId,
    paperCode: session.paperCode,
    title: session.paperTitle,
    level: session.level,
    durationMinutes: session.durationMinutes,
    totalMarks: session.totalMarks,
    secondsRemaining: secondsRemaining(session),
    questions: session.questions.map(toClientQuestion),
  });
}));

// POST /api/test-papers/sessions/:sessionId/submit — mark the whole paper.
// body: { answers: [{ order, answer, timeMs }], durationUsedSec }
router.post('/sessions/:sessionId/submit', protect, asyncHandler(async (req, res) => {
  const student = await resolveStudent(req);
  const session = await TestPaperSession.findOne({ sessionId: req.params.sessionId, studentId: student._id });
  if (!session) return res.status(404).json({ error: 'Sitting not found' });
  if (session.status === 'completed') return res.status(409).json({ error: 'Already submitted' });

  const byOrder = new Map((req.body?.answers || []).map((a) => [Number(a.order), a]));
  const marked = [];
  const scoredAnswers = [];
  let marksAwarded = 0;
  let correctCount = 0;

  for (const q of session.questions) {
    const submitted = byOrder.get(Number(q.order)) || {};
    const studentAnswer = String(submitted.answer ?? '').trim();
    const correct = gradeAnswer(studentAnswer, q);
    const awarded = correct ? (Number(q.marks) || 0) : 0;
    marksAwarded += awarded;
    if (correct) correctCount += 1;

    scoredAnswers.push({ order: q.order, answer: studentAnswer, correct, marksAwarded: awarded, timeMs: submitted.timeMs ?? null });
    marked.push({
      order: q.order,
      section: q.section,
      marks: q.marks,
      type: q.type,
      stem: q.stem,
      choices: q.choices,
      diagram: q.diagram || null,
      unit: q.unit || '',
      studentAnswer,
      correctAnswer: q.answer,
      correct,
      marksAwarded: awarded,
      workedSolution: q.workedSolution || '',
      solutionSteps: Array.isArray(q.solutionSteps) ? q.solutionSteps : [],
      skillName: q.skillName || '',
    });
  }

  const totalMarks = session.totalMarks || session.questions.reduce((s, q) => s + (Number(q.marks) || 0), 0);
  const scorePct = totalMarks ? Math.round((marksAwarded / totalMarks) * 100) : 0;
  const durationUsedSec = Number(req.body?.durationUsedSec) || Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);

  session.answers = scoredAnswers;
  session.status = 'completed';
  session.completedAt = new Date();
  session.summary = {
    totalMarks,
    marksAwarded,
    scorePct,
    correctCount,
    totalCount: session.questions.length,
    durationUsedSec,
  };
  await session.save();

  // Feed the shared learning loop (best-effort — never fail a submit on these).
  try {
    await recordLearningEvents(session.questions.map((q) => {
      const a = scoredAnswers.find((x) => x.order === q.order);
      return {
        studentId: String(student._id),
        eventType: 'question_answered',
        domain: 'mathpath',
        skillCode: String(q.frameworkSkillId || ''),
        questionId: `${session.paperCode}#${q.order}`,
        sessionId: session.sessionId,
        metadata: { answerCorrect: Boolean(a?.correct), source: 'test-paper', paperCode: session.paperCode },
      };
    }));
  } catch { /* telemetry is best-effort */ }

  // Wrong answers become Mistake docs so they surface in Mistake-to-Mastery
  // review alongside MathPath/PSL mistakes (module 'MathPath', deduped per
  // student/skill/question).
  try {
    const wrong = marked.filter((m) => !m.correct);
    for (const m of wrong) {
      const familyId = `${session.paperCode}#${m.order}`;
      await Mistake.findOneAndUpdate(
        { studentId: student._id, module: 'MathPath', skillCode: String(session.questions.find((q) => q.order === m.order)?.frameworkSkillId || ''), questionId: familyId, status: { $ne: 'resolved' } },
        {
          $set: {
            workspaceId: student.workspaceId,
            sessionId: session.sessionId,
            module: 'MathPath',
            questionText: m.stem,
            questionStem: m.stem,
            solutionSteps: m.solutionSteps,
            workedSolution: m.workedSolution || (m.solutionSteps || []).join('\n'),
            studentAnswer: String(m.studentAnswer ?? ''),
            correctAnswer: String(m.correctAnswer ?? ''),
            answerCorrect: false,
            mistakeType: 'unknown',
            status: 'open',
            source: 'test-paper-incorrect',
            mostRecentOccurredAt: new Date(),
            occurredAt: new Date(),
            timestamp: new Date(),
          },
          $setOnInsert: { questionId: familyId, firstOccurredAt: new Date() },
          $inc: { frequency: 1 },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }
  } catch { /* mistake persistence is best-effort */ }

  res.json({
    sessionId: session.sessionId,
    paperCode: session.paperCode,
    title: session.paperTitle,
    summary: session.summary,
    questions: marked,
  });
}));

// PATCH /api/test-papers/sessions/:sessionId/abandon
router.patch('/sessions/:sessionId/abandon', protect, asyncHandler(async (req, res) => {
  const student = await resolveStudent(req);
  const session = await TestPaperSession.findOne({ sessionId: req.params.sessionId, studentId: student._id });
  if (!session) return res.status(404).json({ error: 'Sitting not found' });
  if (session.status === 'inProgress') {
    session.status = 'abandoned';
    await session.save();
  }
  res.json({ ok: true });
}));

export default router;
