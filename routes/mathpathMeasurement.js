import express from 'express';
import { protect } from '../middleware/auth.js';
import { resolveStudent } from '../utils/studentContext.js';
import MathPathPracticeSession from '../models/mathpath/MathPathPracticeSession.js';
import MathPathStudentSkillState from '../models/mathpath/MathPathStudentSkillState.js';
import { persistDomainPracticeMistakes } from '../services/mathpath/domainMistakePersistence.js';
import {
  DOMAIN_ID, buildMeasurementPracticeSession, toClientQuestions, scoreMeasurementSubmission,
} from '../services/mathpath/measurementPracticeService.js';
import { measurementSkillGraph } from '../shared/mathpath/measurement/MeasurementSkillGraph.js';
import { skillHasPSLContent, getHeuristicForSkill } from '../services/mathpath/heuristicBridge.js';
import { buildMeasurementFluencyDrill, toClientFluencyQuestions, scoreMeasurementFluencyDrill } from '../services/mathpath/measurementFluencyService.js';
import { buildRetentionScheduleFromFluency, summariseRetention } from '../shared/mathpath/measurement/measurementRetentionEngine.js';
import { buildMeasurementRetentionReview, toClientRetentionQuestions, scoreMeasurementRetentionReview } from '../services/mathpath/measurementRetentionService.js';

const CODE_TO_SLUG = Object.fromEntries(
  (measurementSkillGraph.skills || []).map((s) => [s.id, s.slug])
);

const router = express.Router();
const FLUENT_BANDS = new Set(['gold', 'platinum']);

function newSessionId() {
  return `measurementpractice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
    const built = buildMeasurementPracticeSession({ targetSkillId, masteredSkillIds, weakSkillIds, questionCount });
    const practiceSessionId = newSessionId();
    await MathPathPracticeSession.create({
      practiceSessionId, studentId, domainId: DOMAIN_ID,
      targetSkillId: built.targetSkillId, targetQuestionFamilyIds: built.targetQuestionFamilyIds,
      sessionGoal: 'Measurement practice', estimatedQuestionCount: built.questions.length,
      questions: built.questions, responses: [], status: 'inProgress', startedAt: new Date(),
    });
    res.json({
      practiceSessionId, domainId: DOMAIN_ID,
      targetSkillId: built.targetSkillId,
      targetQuestionFamilyIds: built.targetQuestionFamilyIds,
      questions: toClientQuestions(built.questions),
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to start measurement practice.' });
  }
});

router.post('/practice/:practiceSessionId/submit', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const existing = await MathPathPracticeSession.findOne({ practiceSessionId: req.params.practiceSessionId, studentId });
    if (!existing) return res.status(404).json({ error: 'Measurement practice session not found.' });
    if (existing.domainId !== DOMAIN_ID) return res.status(400).json({ error: 'Session is not a measurement session.' });
    if (existing.status === 'completed') return res.json({ ...(existing.summary || {}), alreadyCompleted: true });
    const responses = Array.isArray(req.body?.responses) ? req.body.responses : [];
    const scored = scoreMeasurementSubmission({ questions: existing.questions || [], responses });
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
    res.status(err.status || 500).json({ error: err.message || 'Failed to submit measurement practice.' });
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
    res.status(err.status || 500).json({ error: err.message || 'Failed to load measurement skill states.' });
  }
});

router.post('/fluency/start', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const { skillId, count = 8 } = req.body || {};
    if (!skillId) return res.status(400).json({ error: 'skillId required.' });
    const drill = buildMeasurementFluencyDrill({ skillId, studentId, count });
    const sessionId = `measurementfluency_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await MathPathPracticeSession.create({
      practiceSessionId: sessionId, studentId, domainId: DOMAIN_ID,
      targetSkillId: skillId, mode: 'fluency',
      sessionGoal: 'Measurement fluency drill', estimatedQuestionCount: drill.totalQuestions,
      questions: drill.questions, responses: [], status: 'inProgress', startedAt: new Date(),
    });
    res.json({ sessionId, ...toClientFluencyQuestions(drill) });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to start measurement fluency drill.' });
  }
});

router.post('/fluency/:id/submit', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const existing = await MathPathPracticeSession.findOne({ practiceSessionId: req.params.id, studentId });
    if (!existing) return res.status(404).json({ error: 'Fluency session not found.' });
    const { answers = [], timingsSeconds = [] } = req.body || {};
    const scored = scoreMeasurementFluencyDrill({ drill: existing.toObject(), answers, timingsSeconds });
    const skillUpdate = { fluencyLevel: scored.fluencyLevel, fluencyAccuracy: scored.accuracy, lastFluencyAt: new Date(), lastPractisedAt: new Date() };
    if (FLUENT_BANDS.has(scored.fluencyLevel)) {
      const schedule = buildRetentionScheduleFromFluency({ skillId: existing.targetSkillId, fluencyLevel: scored.fluencyLevel, fluentAt: new Date() });
      if (schedule.shouldSchedule) { skillUpdate.nextReviewDate = new Date(schedule.nextReviewDate); skillUpdate.retentionStatus = 'reviewScheduled'; }
    }
    await MathPathStudentSkillState.findOneAndUpdate(
      { studentId, domainId: DOMAIN_ID, skillId: existing.targetSkillId },
      { $set: skillUpdate },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    existing.status = 'completed'; existing.completedAt = new Date();
    existing.summary = { ...scored, persisted: true };
    await existing.save();
    res.json({ sessionId: req.params.id, ...scored, persisted: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to submit measurement fluency drill.' });
  }
});

router.get('/retention', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const states = await MathPathStudentSkillState.find({ studentId: String(student._id), domainId: DOMAIN_ID }).lean();
    res.json({ domainId: DOMAIN_ID, ...summariseRetention({ states }) });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load measurement retention summary.' });
  }
});

router.post('/retention/start', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const { skillId, previousQuestionFamilyIds = [], difficulty = null } = req.body || {};
    if (!skillId) return res.status(400).json({ error: 'skillId required.' });
    const review = buildMeasurementRetentionReview({ skillId, studentId, previousQuestionFamilyIds, difficulty });
    const sessionId = `measurementretention_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await MathPathPracticeSession.create({
      practiceSessionId: sessionId, studentId, domainId: DOMAIN_ID,
      targetSkillId: skillId, mode: 'retention',
      sessionGoal: 'Measurement retention review', estimatedQuestionCount: review.totalQuestions,
      questions: review.questions, responses: [], status: 'inProgress', startedAt: new Date(),
    });
    res.json({ sessionId, ...toClientRetentionQuestions(review) });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to start measurement retention review.' });
  }
});

router.post('/retention/:id/submit', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const existing = await MathPathPracticeSession.findOne({ practiceSessionId: req.params.id, studentId });
    if (!existing) return res.status(404).json({ error: 'Retention session not found.' });
    const { answers = [], timingsSeconds = [] } = req.body || {};
    const scored = scoreMeasurementRetentionReview({ review: { ...existing.toObject(), mode: 'retention' }, answers, timingsSeconds });
    if (scored.set) {
      await MathPathStudentSkillState.findOneAndUpdate(
        { studentId, domainId: DOMAIN_ID, skillId: existing.targetSkillId },
        { $set: scored.set },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }
    existing.status = 'completed'; existing.completedAt = new Date();
    existing.summary = { ...scored, persisted: true };
    await existing.save();
    res.json({ sessionId: req.params.id, ...scored, persisted: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to submit measurement retention review.' });
  }
});

export default router;
