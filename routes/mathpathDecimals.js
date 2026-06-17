import express from 'express';
import { protect } from '../middleware/auth.js';
import { resolveStudent } from '../utils/studentContext.js';
import MathPathPracticeSession from '../models/mathpath/MathPathPracticeSession.js';
import MathPathStudentSkillState from '../models/mathpath/MathPathStudentSkillState.js';
import MathPathMistakeRecord from '../models/mathpath/MathPathMistakeRecord.js';
import { persistDomainPracticeMistakes } from '../services/mathpath/domainMistakePersistence.js';
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
import {
  getDecimalsAssessmentReadiness,
  buildDecimalsAssessment,
  toClientAssessmentQuestions,
  scoreDecimalsAssessment,
} from '../services/mathpath/decimalsAssessmentService.js';
import { decimalsSkillGraph } from '../shared/mathpath/decimals/decimalsSkillGraph.js';
import { skillHasPSLContent, getHeuristicForSkill } from '../services/mathpath/heuristicBridge.js';
import { buildRetentionScheduleFromFluency, summariseRetention } from '../shared/mathpath/decimals/decimalsRetentionEngine.js';
import {
  buildDecimalsRetentionReview,
  toClientRetentionQuestions,
  scoreDecimalsRetentionReview,
} from '../services/mathpath/decimalsRetentionService.js';

const DCODE_TO_SLUG = Object.fromEntries(
  (decimalsSkillGraph.skills || []).map((s) => [s.id, s.slug])
);

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

    // Persist mistakes: aggregate misconception record + per-question Mistake
    // docs that feed Mistake-to-Mastery review and the correction ladder.
    await persistDomainPracticeMistakes({ student, domainId: DOMAIN_ID, sessionId: req.params.practiceSessionId, scored, questions: existing.questions || [] });

    // Find the weakest skill and check if PSL has content for it.
    const weakestSkill = Object.entries(scored.perSkill)
      .filter(([, s]) => s.total > 0 && s.accuracy < 80)
      .sort(([, a], [, b]) => a.accuracy - b.accuracy)[0];
    let pslSuggestion = null;
    if (weakestSkill) {
      const slug = DCODE_TO_SLUG[weakestSkill[0]];
      if (slug && skillHasPSLContent(slug)) {
        pslSuggestion = { skillSlug: slug, heuristic: getHeuristicForSkill(slug) };
      }
    }

    const summary = {
      practiceSessionId: req.params.practiceSessionId,
      domainId: DOMAIN_ID,
      results: scored.results,
      perSkill: scored.perSkill,
      accuracySummary: scored.accuracySummary,
      persisted: true,
      ...(pslSuggestion && { pslSuggestion }),
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

    if (FLUENT_BANDS.has(scored.band)) {
      const retentionSchedule = buildRetentionScheduleFromFluency({
        skillId: existing.targetSkillId,
        fluencyLevel: scored.band,
        fluentAt: new Date(),
      });
      if (retentionSchedule.shouldSchedule) {
        await MathPathStudentSkillState.findOneAndUpdate(
          { studentId, domainId: DOMAIN_ID, skillId: existing.targetSkillId },
          { $set: { nextReviewDate: retentionSchedule.nextReviewDate, retentionStatus: 'reviewScheduled' } },
          { upsert: false },
        );
      }
    }

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

// @route GET /api/mathpath/decimals/assessment/readiness
// @desc  Whether the summative assessment is unlocked + readiness dimensions.
router.get('/assessment/readiness', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const { states } = await loadProgress(String(student._id));
    res.json(getDecimalsAssessmentReadiness({ skillStates: states }));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load decimals assessment readiness.' });
  }
});

// @route POST /api/mathpath/decimals/assessment/start
// @desc  Build + persist an assessment paper (only when unlocked).
router.post('/assessment/start', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const { states, masteredSkillIds } = await loadProgress(studentId);
    const readiness = getDecimalsAssessmentReadiness({ skillStates: states });
    if (!readiness.ready) return res.status(403).json({ error: readiness.message, readiness });

    const paper = buildDecimalsAssessment({ masteredSkillIds, count: Number(req.body?.count) || 10 });
    const practiceSessionId = `decassessment_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await MathPathPracticeSession.create({
      practiceSessionId,
      studentId,
      domainId: DOMAIN_ID,
      targetSkillId: paper.skillIds[0] || '',
      targetQuestionFamilyIds: [...new Set(paper.questions.map((q) => q.questionFamilyId))],
      sessionGoal: 'Decimals assessment',
      estimatedQuestionCount: paper.questions.length,
      questions: paper.questions,
      responses: [],
      status: 'inProgress',
      startedAt: new Date(),
    });

    res.json({
      practiceSessionId,
      domainId: DOMAIN_ID,
      skillIds: paper.skillIds,
      questions: toClientAssessmentQuestions(paper.questions),
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to start decimals assessment.' });
  }
});

// @route POST /api/mathpath/decimals/assessment/:practiceSessionId/submit
// @desc  Grade the paper, log mistakes, complete the session.
router.post('/assessment/:practiceSessionId/submit', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const existing = await MathPathPracticeSession.findOne({ practiceSessionId: req.params.practiceSessionId, studentId });
    if (!existing) return res.status(404).json({ error: 'Decimals assessment not found.' });
    if (existing.domainId !== DOMAIN_ID) return res.status(400).json({ error: 'Session is not a decimals session.' });
    if (existing.status === 'completed') return res.json({ ...(existing.summary || {}), alreadyCompleted: true });

    const responses = Array.isArray(req.body?.responses) ? req.body.responses : [];
    const scored = scoreDecimalsAssessment({ questions: existing.questions || [], responses });

    for (const mistake of scored.mistakes) {
      const tag = mistake.misconceptionTag || 'decimal_error';
      await MathPathMistakeRecord.findOneAndUpdate(
        { studentId, domainId: DOMAIN_ID, mistakeCode: tag, skillId: mistake.skillId || '', questionFamilyId: '' },
        {
          $inc: { frequency: 1 },
          $set: { mistakeName: tag, severity: 'medium', lastSeenAt: new Date() },
          $push: { evidence: { source: 'decimals-assessment-incorrect', questionId: mistake.questionId, sessionId: req.params.practiceSessionId, answerCorrect: false, seenAt: new Date() } },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    const summary = { practiceSessionId: req.params.practiceSessionId, domainId: DOMAIN_ID, mode: 'assessment', ...scored, persisted: true };
    existing.status = 'completed';
    existing.completedAt = new Date();
    existing.responses = responses;
    existing.summary = summary;
    await existing.save();

    res.json(summary);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to submit decimals assessment.' });
  }
});

// @route GET /api/mathpath/decimals/retention
// @desc  Return upcoming/overdue/history retention summary for this student.
router.get('/retention', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const { states } = await loadProgress(String(student._id));
    const summary = summariseRetention({ states });
    res.json({ domainId: DOMAIN_ID, ...summary });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load decimals retention.' });
  }
});

// @route POST /api/mathpath/decimals/retention/start
// @desc  Build + persist a retention review for one skill.
router.post('/retention/start', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const { skillId, count = null, previousQuestionFamilyIds = [] } = req.body || {};
    if (!skillId) return res.status(400).json({ error: 'skillId is required.' });

    const review = buildDecimalsRetentionReview({ skillId, previousQuestionFamilyIds, count });
    const practiceSessionId = `decimalsretention_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await MathPathPracticeSession.create({
      practiceSessionId,
      studentId,
      domainId: DOMAIN_ID,
      targetSkillId: skillId,
      targetQuestionFamilyIds: review.questionFamilyIds,
      sessionGoal: 'Decimals retention review',
      estimatedQuestionCount: review.questions.length,
      questions: review.questions,
      responses: [],
      status: 'inProgress',
      startedAt: new Date(),
    });

    res.json({
      practiceSessionId,
      domainId: DOMAIN_ID,
      skillId,
      mode: 'retention',
      questionFamilyIds: review.questionFamilyIds,
      questions: toClientRetentionQuestions(review.questions),
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to start decimals retention review.' });
  }
});

// @route POST /api/mathpath/decimals/retention/:practiceSessionId/submit
// @desc  Grade the retention review and update the student's retention schedule.
router.post('/retention/:practiceSessionId/submit', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const existing = await MathPathPracticeSession.findOne({ practiceSessionId: req.params.practiceSessionId, studentId });
    if (!existing) return res.status(404).json({ error: 'Decimals retention review not found.' });
    if (existing.domainId !== DOMAIN_ID) return res.status(400).json({ error: 'Session is not a decimals session.' });
    if (existing.status === 'completed') return res.json({ ...(existing.summary || {}), alreadyCompleted: true });

    const responses = Array.isArray(req.body?.responses) ? req.body.responses : [];
    const { completedIntervalDays = [], lastIntervalDays = null } = req.body || {};

    const scored = scoreDecimalsRetentionReview({
      skillId: existing.targetSkillId,
      questions: existing.questions || [],
      responses,
      completedIntervalDays,
      lastIntervalDays,
      completedAt: new Date(),
    });

    await MathPathStudentSkillState.findOneAndUpdate(
      { studentId, domainId: DOMAIN_ID, skillId: existing.targetSkillId },
      { $set: scored.set },
      { upsert: false },
    );

    const summary = { practiceSessionId: req.params.practiceSessionId, domainId: DOMAIN_ID, mode: 'retention', ...scored, persisted: true };
    existing.status = 'completed';
    existing.completedAt = new Date();
    existing.responses = responses;
    existing.summary = summary;
    await existing.save();

    res.json(summary);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to submit decimals retention review.' });
  }
});

export default router;
