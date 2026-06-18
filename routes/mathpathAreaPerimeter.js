import express from 'express';
import { protect } from '../middleware/auth.js';
import { writeCurriculumAttempts } from '../services/mathpath/curriculumAttemptWriter.js';
import { resolveStudent } from '../utils/studentContext.js';
import MathPathPracticeSession from '../models/mathpath/MathPathPracticeSession.js';
import MathPathStudentSkillState from '../models/mathpath/MathPathStudentSkillState.js';
import { persistDomainPracticeMistakes } from '../services/mathpath/domainMistakePersistence.js';
import {
  DOMAIN_ID, buildAreaPerimeterPracticeSession, toClientQuestions, scoreAreaPerimeterSubmission,
} from '../services/mathpath/areaPerimeterPracticeService.js';
import { areaPerimeterSkillGraph } from '../shared/mathpath/areaPerimeter/AreaPerimeterSkillGraph.js';
import { skillHasPSLContent, getHeuristicForSkill } from '../services/mathpath/heuristicBridge.js';
import { buildAreaPerimeterFluencyDrill, toClientFluencyQuestions, scoreAreaPerimeterFluencyDrill } from '../services/mathpath/areaPerimeterFluencyService.js';
import { buildRetentionScheduleFromFluency, summariseRetention } from '../shared/mathpath/areaPerimeter/areaPerimeterRetentionEngine.js';
import { buildAreaPerimeterRetentionReview, toClientRetentionQuestions, scoreAreaPerimeterRetentionReview } from '../services/mathpath/areaPerimeterRetentionService.js';

const CODE_TO_SLUG = Object.fromEntries(
  (areaPerimeterSkillGraph.skills || []).map((s) => [s.id, s.slug])
);

const router = express.Router();
const FLUENT_BANDS = new Set(['gold', 'platinum']);

function newSessionId() {
  return `areaPerimeterpractice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
    const built = buildAreaPerimeterPracticeSession({ targetSkillId, masteredSkillIds, weakSkillIds, questionCount });
    const practiceSessionId = newSessionId();
    await MathPathPracticeSession.create({
      practiceSessionId, studentId, domainId: DOMAIN_ID,
      targetSkillId: built.targetSkillId, targetQuestionFamilyIds: built.targetQuestionFamilyIds,
      sessionGoal: 'AreaPerimeter practice', estimatedQuestionCount: built.questions.length,
      questions: built.questions, responses: [], status: 'inProgress', startedAt: new Date(),
    });
    res.json({
      practiceSessionId, domainId: DOMAIN_ID,
      targetSkillId: built.targetSkillId,
      targetQuestionFamilyIds: built.targetQuestionFamilyIds,
      questions: toClientQuestions(built.questions),
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to start area-perimeter practice.' });
  }
});

router.post('/practice/:practiceSessionId/submit', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const existing = await MathPathPracticeSession.findOne({ practiceSessionId: req.params.practiceSessionId, studentId });
    if (!existing) return res.status(404).json({ error: 'AreaPerimeter practice session not found.' });
    if (existing.domainId !== DOMAIN_ID) return res.status(400).json({ error: 'Session is not a area-perimeter session.' });
    if (existing.status === 'completed') return res.json({ ...(existing.summary || {}), alreadyCompleted: true });
    const responses = Array.isArray(req.body?.responses) ? req.body.responses : [];
    const scored = scoreAreaPerimeterSubmission({ questions: existing.questions || [], responses });
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
    res.status(err.status || 500).json({ error: err.message || 'Failed to submit area-perimeter practice.' });
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
    res.status(err.status || 500).json({ error: err.message || 'Failed to load area-perimeter skill states.' });
  }
});

router.post('/fluency/start', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const { skillId, count = 8 } = req.body || {};
    if (!skillId) return res.status(400).json({ error: 'skillId required.' });
    const drill = buildAreaPerimeterFluencyDrill({ skillId, studentId, count });
    const sessionId = `areaPerimeterfluency_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await MathPathPracticeSession.create({
      practiceSessionId: sessionId, studentId, domainId: DOMAIN_ID,
      targetSkillId: skillId, mode: 'fluency',
      sessionGoal: 'Area/Perimeter fluency drill', estimatedQuestionCount: drill.totalQuestions,
      questions: drill.questions, responses: [], status: 'inProgress', startedAt: new Date(),
    });
    res.json({ sessionId, ...toClientFluencyQuestions(drill) });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to start area/perimeter fluency drill.' });
  }
});

router.post('/fluency/:id/submit', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const existing = await MathPathPracticeSession.findOne({ practiceSessionId: req.params.id, studentId });
    if (!existing) return res.status(404).json({ error: 'Fluency session not found.' });
    const { answers = [], timingsSeconds = [] } = req.body || {};
    const scored = scoreAreaPerimeterFluencyDrill({ drill: existing.toObject(), answers, timingsSeconds });
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
    res.status(err.status || 500).json({ error: err.message || 'Failed to submit area/perimeter fluency drill.' });
  }
});

router.get('/retention', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const states = await MathPathStudentSkillState.find({ studentId: String(student._id), domainId: DOMAIN_ID }).lean();
    res.json({ domainId: DOMAIN_ID, ...summariseRetention({ states }) });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load area/perimeter retention summary.' });
  }
});

router.post('/retention/start', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const { skillId, previousQuestionFamilyIds = [], difficulty = null } = req.body || {};
    if (!skillId) return res.status(400).json({ error: 'skillId required.' });
    const review = buildAreaPerimeterRetentionReview({ skillId, studentId, previousQuestionFamilyIds, difficulty });
    const sessionId = `areaPerimeterretention_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await MathPathPracticeSession.create({
      practiceSessionId: sessionId, studentId, domainId: DOMAIN_ID,
      targetSkillId: skillId, mode: 'retention',
      sessionGoal: 'Area/Perimeter retention review', estimatedQuestionCount: review.totalQuestions,
      questions: review.questions, responses: [], status: 'inProgress', startedAt: new Date(),
    });
    res.json({ sessionId, ...toClientRetentionQuestions(review) });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to start area/perimeter retention review.' });
  }
});

router.post('/retention/:id/submit', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const existing = await MathPathPracticeSession.findOne({ practiceSessionId: req.params.id, studentId });
    if (!existing) return res.status(404).json({ error: 'Retention session not found.' });
    const { answers = [], timingsSeconds = [] } = req.body || {};
    const scored = scoreAreaPerimeterRetentionReview({ review: { ...existing.toObject(), mode: 'retention' }, answers, timingsSeconds });
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
    res.status(err.status || 500).json({ error: err.message || 'Failed to submit area/perimeter retention review.' });
  }
});

export default router;
