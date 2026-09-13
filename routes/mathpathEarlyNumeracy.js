import express from 'express';
import { protect } from '../middleware/auth.js';
import { writeCurriculumAttempts } from '../services/mathpath/curriculumAttemptWriter.js';
import { resolveStudent } from '../utils/studentContext.js';
import MathPathPracticeSession from '../models/mathpath/MathPathPracticeSession.js';
import MathPathStudentSkillState from '../models/mathpath/MathPathStudentSkillState.js';
import { persistDomainPracticeMistakes } from '../services/mathpath/domainMistakePersistence.js';
import {
  DOMAIN_ID,
  buildEarlyNumeracyPracticeSession,
  toClientQuestions,
  scoreEarlyNumeracySubmission,
} from '../services/mathpath/earlyNumeracyPracticeService.js';

// Gentle K2 "Explore & Practise" route: practice + skill-states only. No
// fluency drills, no retention scheduling, no high-stakes diagnostic — per the
// NEL play-based stance. See docs/k2-numeracy-scope.md.

const router = express.Router();

function newSessionId() {
  return `earlynumeracypractice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// A K2 skill "counts" once practised to the gentle accurate threshold.
const DONE_STATUSES = ['accurate', 'mastered', 'fluent', 'retained'];

async function loadProgress(studentId) {
  const states = await MathPathStudentSkillState.find({ studentId, domainId: DOMAIN_ID }).lean();
  const masteredSkillIds = states.filter((s) => DONE_STATUSES.includes(s.status)).map((s) => s.skillId);
  const weakSkillIds = states.filter((s) => ['needsReview', 'weak'].includes(s.status)).map((s) => s.skillId);
  return { states, masteredSkillIds, weakSkillIds };
}

router.post('/practice/start', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const { targetSkillId = null, questionCount = 6 } = req.body || {};
    const { masteredSkillIds, weakSkillIds } = await loadProgress(studentId);
    const built = buildEarlyNumeracyPracticeSession({ targetSkillId, masteredSkillIds, weakSkillIds, questionCount });
    if (!built.questions.length) return res.status(400).json({ error: 'No questions available for this skill. Try a different topic.' });
    const practiceSessionId = newSessionId();
    await MathPathPracticeSession.create({
      practiceSessionId, studentId, domainId: DOMAIN_ID,
      targetSkillId: built.targetSkillId, targetQuestionFamilyIds: built.targetQuestionFamilyIds,
      sessionGoal: 'Numeracy practice', estimatedQuestionCount: built.questions.length,
      questions: built.questions, responses: [], status: 'inProgress', startedAt: new Date(),
    });
    res.json({
      practiceSessionId, domainId: DOMAIN_ID,
      targetSkillId: built.targetSkillId,
      targetQuestionFamilyIds: built.targetQuestionFamilyIds,
      questions: toClientQuestions(built.questions),
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to start numeracy practice.' });
  }
});

router.post('/practice/:practiceSessionId/submit', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const existing = await MathPathPracticeSession.findOne({ practiceSessionId: req.params.practiceSessionId, studentId });
    if (!existing) return res.status(404).json({ error: 'Numeracy practice session not found.' });
    if (existing.domainId !== DOMAIN_ID) return res.status(400).json({ error: 'Session is not a numeracy session.' });
    if (existing.status === 'completed') return res.json({ ...(existing.summary || {}), alreadyCompleted: true });
    const responses = Array.isArray(req.body?.responses) ? req.body.responses : [];
    const scored = scoreEarlyNumeracySubmission({ questions: existing.questions || [], responses });
    await writeCurriculumAttempts({ studentId, domainId: DOMAIN_ID, sessionId: req.params.practiceSessionId, results: scored.results });
    await Promise.all(Object.entries(scored.perSkill).map(([skillId, counts]) => {
      const set = { status: counts.status, accuracy: counts.accuracy, lastPractisedAt: new Date() };
      if (DONE_STATUSES.includes(counts.status)) set.masteredAt = new Date();
      return MathPathStudentSkillState.findOneAndUpdate(
        { studentId, domainId: DOMAIN_ID, skillId },
        { $inc: { attemptCount: counts.total, correctCount: counts.correct }, $set: set },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }));
    await persistDomainPracticeMistakes({ student, domainId: DOMAIN_ID, sessionId: req.params.practiceSessionId, scored, questions: existing.questions || [] });
    const summary = {
      practiceSessionId: req.params.practiceSessionId, domainId: DOMAIN_ID,
      results: scored.results, perSkill: scored.perSkill,
      accuracySummary: scored.accuracySummary, persisted: true,
    };
    existing.status = 'completed';
    existing.completedAt = new Date();
    existing.responses = responses;
    existing.summary = summary;
    await existing.save();
    res.json(summary);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to submit numeracy practice.' });
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
    res.status(err.status || 500).json({ error: err.message || 'Failed to load numeracy skill states.' });
  }
});

export default router;
