import express from 'express';
import { protect } from '../middleware/auth.js';
import { resolveStudent } from '../utils/studentContext.js';
import MathPathPracticeSession from '../models/mathpath/MathPathPracticeSession.js';
import MathPathStudentSkillState from '../models/mathpath/MathPathStudentSkillState.js';
import MathPathMistakeRecord from '../models/mathpath/MathPathMistakeRecord.js';
import {
  DOMAIN_ID,
  buildPercentagePracticeSession,
  toClientQuestions,
  scorePercentageSubmission,
} from '../services/mathpath/percentagePracticeService.js';
import { percentageSkillGraph } from '../shared/mathpath/percentages/percentageSkillGraph.js';
import { skillHasPSLContent, getHeuristicForSkill } from '../services/mathpath/heuristicBridge.js';

const PCODE_TO_SLUG = Object.fromEntries(
  (percentageSkillGraph.skills || []).map((s) => [s.id, s.slug])
);

const router = express.Router();

function newSessionId() {
  return `pctpractice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Derive mastered/weak skill ids from persisted percentage skill states.
async function loadProgress(studentId) {
  const states = await MathPathStudentSkillState.find({ studentId, domainId: DOMAIN_ID }).lean();
  const masteredSkillIds = states.filter((s) => ['mastered', 'accurate', 'fluent', 'retained'].includes(s.status)).map((s) => s.skillId);
  const weakSkillIds = states.filter((s) => ['needsReview', 'weak'].includes(s.status)).map((s) => s.skillId);
  return { states, masteredSkillIds, weakSkillIds };
}

// @route POST /api/mathpath/percentages/practice/start
// @desc  Build + persist a percentage practice session; returns client questions.
router.post('/practice/start', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const { targetSkillId = null, questionCount = 6 } = req.body || {};
    const { masteredSkillIds, weakSkillIds } = await loadProgress(studentId);

    const built = buildPercentagePracticeSession({ targetSkillId, masteredSkillIds, weakSkillIds, questionCount });
    const practiceSessionId = newSessionId();

    await MathPathPracticeSession.create({
      practiceSessionId,
      studentId,
      domainId: DOMAIN_ID,
      targetSkillId: built.targetSkillId,
      targetQuestionFamilyIds: built.targetQuestionFamilyIds,
      sessionGoal: 'Percentage practice',
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
    res.status(err.status || 500).json({ error: err.message || 'Failed to start percentage practice.' });
  }
});

// @route POST /api/mathpath/percentages/practice/:practiceSessionId/submit
// @desc  Grade a submission, persist skill states + mistakes, complete session.
router.post('/practice/:practiceSessionId/submit', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const existing = await MathPathPracticeSession.findOne({ practiceSessionId: req.params.practiceSessionId, studentId });
    if (!existing) return res.status(404).json({ error: 'Percentage practice session not found.' });
    if (existing.domainId !== DOMAIN_ID) return res.status(400).json({ error: 'Session is not a percentage session.' });
    if (existing.status === 'completed') return res.json({ ...(existing.summary || {}), alreadyCompleted: true });

    const responses = Array.isArray(req.body?.responses) ? req.body.responses : [];
    const scored = scorePercentageSubmission({ questions: existing.questions || [], responses });

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
      const tag = mistake.misconceptionTag || 'percentage_error';
      await MathPathMistakeRecord.findOneAndUpdate(
        { studentId, domainId: DOMAIN_ID, mistakeCode: tag, skillId: mistake.skillId || '', questionFamilyId: mistake.questionFamilyId || '' },
        {
          $inc: { frequency: 1 },
          $set: { mistakeName: tag, severity: mistake.confidence === 'i_know_this' ? 'high' : 'medium', lastSeenAt: new Date() },
          $push: { evidence: {
            source: 'percentage-practice-incorrect',
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

    // Find the weakest skill and check if PSL has content for it.
    const weakestSkill = Object.entries(scored.perSkill)
      .filter(([, s]) => s.total > 0 && s.accuracy < 80)
      .sort(([, a], [, b]) => a.accuracy - b.accuracy)[0];
    let pslSuggestion = null;
    if (weakestSkill) {
      const slug = PCODE_TO_SLUG[weakestSkill[0]];
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
    res.status(err.status || 500).json({ error: err.message || 'Failed to submit percentage practice.' });
  }
});

// @route GET /api/mathpath/percentages/skill-states
// @desc  Percentage skill states as { records: [{ skillId, status, accuracy }] }
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
    res.status(err.status || 500).json({ error: err.message || 'Failed to load percentage skill states.' });
  }
});

export default router;
