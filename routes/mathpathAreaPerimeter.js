import express from 'express';
import { protect } from '../middleware/auth.js';
import { writeCurriculumAttempts } from '../services/mathpath/curriculumAttemptWriter.js';
import { resolveStudent } from '../utils/studentContext.js';
import MathPathPracticeSession from '../models/mathpath/MathPathPracticeSession.js';
import MathPathStudentSkillState from '../models/mathpath/MathPathStudentSkillState.js';
import MathPathMistakeRecord from '../models/mathpath/MathPathMistakeRecord.js';
import {
  DOMAIN_ID, buildAreaPerimeterPracticeSession, toClientQuestions, scoreAreaPerimeterSubmission,
} from '../services/mathpath/areaPerimeterPracticeService.js';
import { areaPerimeterSkillGraph } from '../shared/mathpath/areaPerimeter/AreaPerimeterSkillGraph.js';
import { skillHasPSLContent, getHeuristicForSkill } from '../services/mathpath/heuristicBridge.js';

const CODE_TO_SLUG = Object.fromEntries(
  (areaPerimeterSkillGraph.skills || []).map((s) => [s.id, s.slug])
);

const router = express.Router();

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
    for (const mistake of scored.mistakes) {
      const tag = mistake.misconceptionTag || 'areaPerimeter_error';
      await MathPathMistakeRecord.findOneAndUpdate(
        { studentId, domainId: DOMAIN_ID, mistakeCode: tag, skillId: mistake.skillId || '', questionFamilyId: mistake.questionFamilyId || '' },
        {
          $inc: { frequency: 1 },
          $set: { mistakeName: tag, severity: mistake.confidence === 'i_know_this' ? 'high' : 'medium', lastSeenAt: new Date() },
          $push: { evidence: {
            source: 'areaPerimeter-practice-incorrect', questionId: mistake.questionId,
            sessionId: req.params.practiceSessionId, studentAnswer: mistake.studentAnswer,
            correctAnswer: mistake.correctAnswer, answerCorrect: false,
            confidence: mistake.confidence, timeTaken: mistake.timeTaken, seenAt: new Date(),
          } },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }
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

export default router;
