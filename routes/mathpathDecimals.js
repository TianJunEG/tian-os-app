import express from 'express';
import { protect } from '../middleware/auth.js';
import { resolveStudent } from '../utils/studentContext.js';
import MathPathPracticeSession from '../models/mathpath/MathPathPracticeSession.js';
import MathPathStudentSkillState from '../models/mathpath/MathPathStudentSkillState.js';
import MathPathMistakeRecord from '../models/mathpath/MathPathMistakeRecord.js';
import {
  DOMAIN_ID,
  buildDecimalsPracticeSession,
  toClientQuestions,
  scoreDecimalsSubmission,
} from '../services/mathpath/decimalsPracticeService.js';
import {
  buildDecimalsFluencyDrill,
  toClientFluencyQuestions,
  scoreDecimalsFluencyDrill,
} from '../services/mathpath/decimalsFluencyService.js';

const router = express.Router();
const FLUENT_BANDS = new Set(['gold', 'platinum']);

function newSessionId() {
  return `decpractice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Derive mastered/weak skill ids from persisted decimals skill states.
async function loadProgress(studentId) {
  const states = await MathPathStudentSkillState.find({ studentId, domainId: DOMAIN_ID }).lean();
  const masteredSkillIds = states.filter((s) => ['mastered', 'accurate', 'fluent', 'retained'].includes(s.status)).map((s) => s.skillId);
  const weakSkillIds = states.filter((s) => ['needsReview', 'weak'].includes(s.status)).map((s) => s.skillId);
  return { states, masteredSkillIds, weakSkillIds };
}

// @route POST /api/mathpath/decimals/practice/start
// @desc  Build + persist a decimals practice session; returns client questions.
router.post('/practice/start', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const { targetSkillId = null, questionCount = 6 } = req.body || {};
    const { masteredSkillIds, weakSkillIds } = await loadProgress(studentId);

    const built = buildDecimalsPracticeSession({ targetSkillId, masteredSkillIds, weakSkillIds, questionCount });
    const practiceSessionId = newSessionId();

    await MathPathPracticeSession.create({
      practiceSessionId,
      studentId,
      domainId: DOMAIN_ID,
      targetSkillId: built.targetSkillId,
      targetQuestionFamilyIds: built.targetQuestionFamilyIds,
      sessionGoal: 'Decimals practice',
      estimatedQuestionCount: built.questions.length,
      questions: built.questions,
      responses: [],
      status: 'inProgress',
      startedAt: new Date(),
    });

    res.json({
      practiceSessionId,
      domainId: DOMAIN_ID,
      targetSkillId: built.targetSkillId,
      targetQuestionFamilyIds: built.targetQuestionFamilyIds,
      questions: toClientQuestions(built.questions),
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to start decimals practice.' });
  }
});

// @route POST /api/mathpath/decimals/practice/:practiceSessionId/submit
// @desc  Grade a submission, persist skill states + mistakes, complete session.
router.post('/practice/:practiceSessionId/submit', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const existing = await MathPathPracticeSession.findOne({ practiceSessionId: req.params.practiceSessionId, studentId });
    if (!existing) return res.status(404).json({ error: 'Decimals practice session not found.' });
    if (existing.domainId !== DOMAIN_ID) return res.status(400).json({ error: 'Session is not a decimals session.' });
    if (existing.status === 'completed') return res.json({ ...(existing.summary || {}), alreadyCompleted: true });

    const responses = Array.isArray(req.body?.responses) ? req.body.responses : [];
    const scored = scoreDecimalsSubmission({ questions: existing.questions || [], responses });

    // Persist per-skill mastery state.
    await Promise.all(Object.entries(scored.perSkill).map(([skillId, counts]) => {
      const set = { status: counts.status, accuracy: counts.accuracy, lastPractisedAt: new Date() };
      if (counts.status === 'mastered') set.masteredAt = new Date();
      return MathPathStudentSkillState.findOneAndUpdate(
        { studentId, domainId: DOMAIN_ID, skillId },
        { $inc: { attemptCount: counts.total, correctCount: counts.correct }, $set: set },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }));

    // Persist mistakes (one record per misconception/skill, frequency incremented).
    for (const mistake of scored.mistakes) {
      const tag = mistake.misconceptionTag || 'decimal_error';
      await MathPathMistakeRecord.findOneAndUpdate(
        { studentId, domainId: DOMAIN_ID, mistakeCode: tag, skillId: mistake.skillId || '', questionFamilyId: mistake.questionFamilyId || '' },
        {
          $inc: { frequency: 1 },
          $set: { mistakeName: tag, severity: mistake.confidence === 'i_know_this' ? 'high' : 'medium', lastSeenAt: new Date() },
          $push: { evidence: {
            source: 'decimals-practice-incorrect',
            questionId: mistake.questionId,
            sessionId: req.params.practiceSessionId,
            studentAnswer: mistake.studentAnswer,
            correctAnswer: mistake.correctAnswer,
            answerCorrect: false,
            confidence: mistake.confidence,
            timeTaken: mistake.timeTaken,
            seenAt: new Date(),
          } },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    const summary = {
      practiceSessionId: req.params.practiceSessionId,
      domainId: DOMAIN_ID,
      results: scored.results,
      perSkill: scored.perSkill,
      accuracySummary: scored.accuracySummary,
      persisted: true,
    };
    existing.status = 'completed';
    existing.completedAt = new Date();
    existing.responses = responses;
    existing.summary = summary;
    await existing.save();

    res.json(summary);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to submit decimals practice.' });
  }
});

// @route GET /api/mathpath/decimals/skill-states
// @desc  Decimals skill states as { records: [{ skillId, status, accuracy }] }
//        — shape the student learning-path page consumes.
router.get('/skill-states', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const { states } = await loadProgress(String(student._id));
    const records = states.map((s) => ({
      skillId: s.skillId,
      status: s.status,
      accuracy: s.accuracy,
      attemptCount: s.attemptCount,
      lastPractisedAt: s.lastPractisedAt,
    }));
    res.json({ domainId: DOMAIN_ID, records });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load decimals skill states.' });
  }
});

// @route POST /api/mathpath/decimals/fluency/start
// @desc  Build + persist a timed fluency drill; returns answer-stripped questions.
router.post('/fluency/start', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const { skillId, count = 8 } = req.body || {};
    if (!skillId) return res.status(400).json({ error: 'skillId is required.' });

    const drill = buildDecimalsFluencyDrill({ skillId, count });
    const practiceSessionId = `decfluency_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await MathPathPracticeSession.create({
      practiceSessionId,
      studentId,
      domainId: DOMAIN_ID,
      targetSkillId: skillId,
      targetQuestionFamilyIds: [...new Set(drill.questions.map((q) => q.questionFamilyId))],
      sessionGoal: 'Decimals fluency',
      estimatedQuestionCount: drill.questions.length,
      questions: drill.questions,
      responses: [],
      status: 'inProgress',
      startedAt: new Date(),
    });

    res.json({
      practiceSessionId,
      domainId: DOMAIN_ID,
      skillId,
      benchmarks: drill.benchmarks,
      targetSeconds: drill.targetSeconds,
      questions: toClientFluencyQuestions(drill.questions),
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to start decimals fluency drill.' });
  }
});

// @route POST /api/mathpath/decimals/fluency/:practiceSessionId/submit
// @desc  Score the drill into a fluency band; persist fluencyLevel on the skill.
router.post('/fluency/:practiceSessionId/submit', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const existing = await MathPathPracticeSession.findOne({ practiceSessionId: req.params.practiceSessionId, studentId });
    if (!existing) return res.status(404).json({ error: 'Decimals fluency drill not found.' });
    if (existing.domainId !== DOMAIN_ID) return res.status(400).json({ error: 'Session is not a decimals session.' });
    if (existing.status === 'completed') return res.json({ ...(existing.summary || {}), alreadyCompleted: true });

    const responses = Array.isArray(req.body?.responses) ? req.body.responses : [];
    const scored = scoreDecimalsFluencyDrill({ skillId: existing.targetSkillId, questions: existing.questions || [], responses });

    const set = {
      fluencyLevel: scored.band,
      lastPractisedAt: new Date(),
    };
    if (FLUENT_BANDS.has(scored.band)) {
      set.status = 'fluent';
      set.fluentAt = new Date();
    }
    await MathPathStudentSkillState.findOneAndUpdate(
      { studentId, domainId: DOMAIN_ID, skillId: existing.targetSkillId },
      { $inc: { attemptCount: scored.total, correctCount: scored.correct }, $set: set },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const summary = { practiceSessionId: req.params.practiceSessionId, domainId: DOMAIN_ID, mode: 'fluency', ...scored, persisted: true };
    existing.status = 'completed';
    existing.completedAt = new Date();
    existing.responses = responses;
    existing.summary = summary;
    await existing.save();

    res.json(summary);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to submit decimals fluency drill.' });
  }
});

export default router;
