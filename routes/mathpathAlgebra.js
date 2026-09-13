import express from 'express';
import { protect } from '../middleware/auth.js';
import { writeCurriculumAttempts } from '../services/mathpath/curriculumAttemptWriter.js';
import { resolveStudent } from '../utils/studentContext.js';
import MathPathPracticeSession from '../models/mathpath/MathPathPracticeSession.js';
import MathPathStudentSkillState from '../models/mathpath/MathPathStudentSkillState.js';
import { persistDomainPracticeMistakes } from '../services/mathpath/domainMistakePersistence.js';
import {
  DOMAIN_ID, buildAlgebraPracticeSession, toClientQuestions, scoreAlgebraSubmission,
} from '../services/mathpath/algebraPracticeService.js';
import {
  buildAlgebraFluencyDrill,
  toClientFluencyQuestions,
  scoreAlgebraFluencyDrill,
} from '../services/mathpath/algebraFluencyService.js';
import {
  buildAlgebraRetentionReview,
  toClientRetentionQuestions,
  scoreAlgebraRetentionReview,
} from '../services/mathpath/algebraRetentionService.js';
import {
  buildRetentionScheduleFromFluency,
  summariseRetention,
} from '../shared/mathpath/algebra/algebraRetentionEngine.js';
import { algebraSkillGraph } from '../shared/mathpath/algebra/AlgebraSkillGraph.js';
import { skillHasPSLContent, getHeuristicForSkill } from '../services/mathpath/heuristicBridge.js';

const CODE_TO_SLUG = Object.fromEntries(
  (algebraSkillGraph.skills || []).map((s) => [s.id, s.slug])
);

const router = express.Router();
const FLUENT_BANDS = new Set(['gold', 'platinum']);

function newSessionId() {
  return `algebrapractice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function loadProgress(studentId) {
  const states = await MathPathStudentSkillState.find({ studentId, domainId: DOMAIN_ID }).lean();
  const masteredSkillIds = states.filter((s) => ['mastered', 'accurate', 'fluent', 'retained'].includes(s.status)).map((s) => s.skillId);
  const weakSkillIds = states.filter((s) => ['needsReview', 'weak'].includes(s.status)).map((s) => s.skillId);
  return { states, masteredSkillIds, weakSkillIds };
}

router.post('/practice/start', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const { targetSkillId = null, questionCount = 6 } = req.body || {};
    const { masteredSkillIds, weakSkillIds } = await loadProgress(studentId);
    const built = buildAlgebraPracticeSession({ targetSkillId, masteredSkillIds, weakSkillIds, questionCount });
    if (!built.questions.length) return res.status(400).json({ error: 'No questions available for this skill. Try a different topic.' });
    const practiceSessionId = newSessionId();
    await MathPathPracticeSession.create({
      practiceSessionId, studentId, domainId: DOMAIN_ID,
      targetSkillId: built.targetSkillId, targetQuestionFamilyIds: built.targetQuestionFamilyIds,
      sessionGoal: 'Algebra practice', estimatedQuestionCount: built.questions.length,
      questions: built.questions, responses: [], status: 'inProgress', startedAt: new Date(),
    });
    res.json({
      practiceSessionId, domainId: DOMAIN_ID,
      targetSkillId: built.targetSkillId,
      targetQuestionFamilyIds: built.targetQuestionFamilyIds,
      questions: toClientQuestions(built.questions),
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to start algebra practice.' });
  }
});

router.post('/practice/:practiceSessionId/submit', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const existing = await MathPathPracticeSession.findOne({ practiceSessionId: req.params.practiceSessionId, studentId });
    if (!existing) return res.status(404).json({ error: 'Algebra practice session not found.' });
    if (existing.domainId !== DOMAIN_ID) return res.status(400).json({ error: 'Session is not a algebra session.' });
    if (existing.status === 'completed') return res.json({ ...(existing.summary || {}), alreadyCompleted: true });
    const responses = Array.isArray(req.body?.responses) ? req.body.responses : [];
    const scored = scoreAlgebraSubmission({ questions: existing.questions || [], responses });
    await writeCurriculumAttempts({ studentId, domainId: DOMAIN_ID, sessionId: req.params.practiceSessionId, results: scored.results });
    await Promise.all(Object.entries(scored.perSkill).map(([skillId, counts]) => {
      const set = { status: counts.status, accuracy: counts.accuracy, lastPractisedAt: new Date() };
      if (counts.status === 'mastered') set.masteredAt = new Date();
      return MathPathStudentSkillState.findOneAndUpdate(
        { studentId, domainId: DOMAIN_ID, skillId },
        { $inc: { attemptCount: counts.total, correctCount: counts.correct }, $set: set },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }));
    await persistDomainPracticeMistakes({ student, domainId: DOMAIN_ID, sessionId: req.params.practiceSessionId, scored, questions: existing.questions || [] });
    const weakestSkill = Object.entries(scored.perSkill)
      .filter(([, s]) => s.total > 0 && s.accuracy < 80)
      .sort(([, a], [, b]) => a.accuracy - b.accuracy)[0];
    let pslSuggestion = null;
    if (weakestSkill) {
      const slug = CODE_TO_SLUG[weakestSkill[0]];
      if (slug && skillHasPSLContent(slug)) {
        pslSuggestion = { skillSlug: slug, heuristic: getHeuristicForSkill(slug) };
      }
    }
    const summary = {
      practiceSessionId: req.params.practiceSessionId, domainId: DOMAIN_ID,
      results: scored.results, perSkill: scored.perSkill,
      accuracySummary: scored.accuracySummary, persisted: true,
      ...(pslSuggestion && { pslSuggestion }),
    };
    existing.status = 'completed';
    existing.completedAt = new Date();
    existing.responses = responses;
    existing.summary = summary;
    await existing.save();
    res.json(summary);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to submit algebra practice.' });
  }
});

router.get('/skill-states', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const { states } = await loadProgress(String(student._id));
    const records = states.map((s) => ({
      skillId: s.skillId, status: s.status, accuracy: s.accuracy,
      attemptCount: s.attemptCount, lastPractisedAt: s.lastPractisedAt,
    }));
    res.json({ domainId: DOMAIN_ID, records });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load algebra skill states.' });
  }
});

// @route POST /api/mathpath/algebra/fluency/start
// @desc  Build + persist a timed fluency drill; returns answer-stripped questions.
router.post('/fluency/start', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const { skillId, count = 8 } = req.body || {};
    if (!skillId) return res.status(400).json({ error: 'skillId is required.' });

    const drill = buildAlgebraFluencyDrill({ skillId, count });
    const practiceSessionId = `algebrafluency_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await MathPathPracticeSession.create({
      practiceSessionId, studentId, domainId: DOMAIN_ID,
      targetSkillId: skillId,
      targetQuestionFamilyIds: [...new Set(drill.questions.map((q) => q.questionFamilyId))],
      sessionGoal: 'Algebra fluency', estimatedQuestionCount: drill.questions.length,
      questions: drill.questions, responses: [], status: 'inProgress', startedAt: new Date(),
    });

    res.json({
      practiceSessionId, domainId: DOMAIN_ID, skillId,
      benchmarks: drill.benchmarks, targetSeconds: drill.targetSeconds,
      questions: toClientFluencyQuestions(drill.questions),
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to start algebra fluency drill.' });
  }
});

// @route POST /api/mathpath/algebra/fluency/:practiceSessionId/submit
// @desc  Score the drill into a fluency band; persist fluencyLevel on the skill.
router.post('/fluency/:practiceSessionId/submit', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const existing = await MathPathPracticeSession.findOne({ practiceSessionId: req.params.practiceSessionId, studentId });
    if (!existing) return res.status(404).json({ error: 'Algebra fluency drill not found.' });
    if (existing.domainId !== DOMAIN_ID) return res.status(400).json({ error: 'Session is not a algebra session.' });
    if (existing.status === 'completed') return res.json({ ...(existing.summary || {}), alreadyCompleted: true });

    const responses = Array.isArray(req.body?.responses) ? req.body.responses : [];
    const scored = scoreAlgebraFluencyDrill({ skillId: existing.targetSkillId, questions: existing.questions || [], responses });

    const set = {
      fluencyLevel: scored.band,
      lastPractisedAt: new Date(),
    };
    let retentionScheduled = false;
    if (FLUENT_BANDS.has(scored.band)) {
      const fluentAt = new Date();
      set.status = 'fluent';
      set.fluentAt = fluentAt;
      // Mastery gate met → schedule the first spaced retention review.
      // Only (re)schedule if this skill is not already in a retention cycle.
      const prior = await MathPathStudentSkillState.findOne(
        { studentId, domainId: DOMAIN_ID, skillId: existing.targetSkillId },
      ).lean();
      if (!prior?.fluentAt && !prior?.nextReviewDate) {
        const schedule = buildRetentionScheduleFromFluency({
          skillId: existing.targetSkillId, fluencyLevel: scored.band, fluentAt,
        });
        if (schedule.shouldSchedule) {
          set.retentionStatus = 'reviewScheduled';
          set.nextReviewDate = new Date(schedule.nextReviewDate);
          retentionScheduled = true;
        }
      }
    }
    await MathPathStudentSkillState.findOneAndUpdate(
      { studentId, domainId: DOMAIN_ID, skillId: existing.targetSkillId },
      { $inc: { attemptCount: scored.total, correctCount: scored.correct }, $set: set },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const summary = { practiceSessionId: req.params.practiceSessionId, domainId: DOMAIN_ID, mode: 'fluency', ...scored, retentionScheduled, persisted: true };
    existing.status = 'completed';
    existing.completedAt = new Date();
    existing.responses = responses;
    existing.summary = summary;
    await existing.save();

    res.json(summary);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to submit algebra fluency drill.' });
  }
});

// @route GET /api/mathpath/algebra/retention
// @desc  Upcoming / overdue / retained reviews for the student (parity with
//        fractions GET /api/fluency/me/retention). Read from skill-state rows.
router.get('/retention', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const states = await MathPathStudentSkillState.find({ studentId: String(student._id), domainId: DOMAIN_ID }).lean();
    res.json(summariseRetention({ states, asOf: new Date() }));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load algebra retention reviews.' });
  }
});

// @route POST /api/mathpath/algebra/retention/start
// @desc  Build + persist a spaced retention review (same concept, fresh
//        questions); returns answer-stripped questions. Mirrors fluency/start.
router.post('/retention/start', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const { skillId, previousQuestionFamilyIds = [], count = null } = req.body || {};
    if (!skillId) return res.status(400).json({ error: 'skillId is required.' });

    const review = buildAlgebraRetentionReview({ skillId, previousQuestionFamilyIds, count });
    const practiceSessionId = `algebraretention_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await MathPathPracticeSession.create({
      practiceSessionId, studentId, domainId: DOMAIN_ID,
      targetSkillId: skillId,
      targetQuestionFamilyIds: [...new Set(review.questions.map((q) => q.questionFamilyId))],
      sessionGoal: 'Algebra retention review', estimatedQuestionCount: review.questions.length,
      questions: review.questions, responses: [], status: 'inProgress', startedAt: new Date(),
    });

    res.json({
      practiceSessionId, domainId: DOMAIN_ID, skillId, mode: 'retention',
      reviewId: review.reviewId,
      questionFamilyIds: review.questionFamilyIds,
      questions: toClientRetentionQuestions(review.questions),
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to start algebra retention review.' });
  }
});

// @route POST /api/mathpath/algebra/retention/:practiceSessionId/submit
// @desc  Score the review into a retention outcome; advance/reset the spaced
//        schedule on the skill-state row. Mirrors fluency/:id/submit.
router.post('/retention/:practiceSessionId/submit', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const existing = await MathPathPracticeSession.findOne({ practiceSessionId: req.params.practiceSessionId, studentId });
    if (!existing) return res.status(404).json({ error: 'Algebra retention review not found.' });
    if (existing.domainId !== DOMAIN_ID) return res.status(400).json({ error: 'Session is not a algebra session.' });
    if (existing.status === 'completed') return res.json({ ...(existing.summary || {}), alreadyCompleted: true });

    const responses = Array.isArray(req.body?.responses) ? req.body.responses : [];
    const priorState = await MathPathStudentSkillState.findOne(
      { studentId, domainId: DOMAIN_ID, skillId: existing.targetSkillId },
    ).lean();
    const completedAt = new Date();
    const scored = scoreAlgebraRetentionReview({
      skillId: existing.targetSkillId,
      questions: existing.questions || [],
      responses,
      completedIntervalDays: priorState?.completedIntervalDays || [],
      lastIntervalDays: req.body?.intervalDays ?? null,
      completedAt,
    });

    await MathPathStudentSkillState.findOneAndUpdate(
      { studentId, domainId: DOMAIN_ID, skillId: existing.targetSkillId },
      { $inc: { attemptCount: scored.total, correctCount: scored.correct }, $set: { ...scored.set, lastPractisedAt: completedAt } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const summary = { practiceSessionId: req.params.practiceSessionId, domainId: DOMAIN_ID, mode: 'retention', ...scored, persisted: true };
    existing.status = 'completed';
    existing.completedAt = completedAt;
    existing.responses = responses;
    existing.summary = summary;
    await existing.save();

    res.json(summary);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to submit algebra retention review.' });
  }
});

export default router;
