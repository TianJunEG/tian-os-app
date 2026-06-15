import express from 'express';
import { protect } from '../../middleware/auth.js';
import MathPathAttempt from '../../models/mathpath/MathPathAttempt.js';
import MathPathMistakeRecord from '../../models/mathpath/MathPathMistakeRecord.js';
import MathPathStudentSkillState from '../../models/mathpath/MathPathStudentSkillState.js';
import MathPathPracticeSession from '../../models/mathpath/MathPathPracticeSession.js';
import { resolveStudent } from '../../utils/studentContext.js';
import { normalizeConfidence, recordLearningEvents } from '../../services/telemetry/learningTelemetryService.js';
import {
  buildPracticeLifecycleLog,
  logPracticeLifecycle,
  normalizeTimeSpentSeconds,
  p1PracticeAttemptDoc,
  shouldCreatePracticeMistake,
  resolveP1DomainId,
} from './_helpers.js';

function createLevelPracticeRouter({ level, resolveDomainId }) {
  const router = express.Router();
  const prefix = `p${level}`;
  const source = `mathpath_p${level}_practice`;
  const domainRegex = new RegExp(`^p${level}-`);

  function isDomainId(domainId) {
    return String(domainId || '').startsWith(`p${level}-`);
  }

  router.post(`/${prefix}/practice/start`, protect, async (req, res) => {
    try {
      const student = await resolveStudent(req);
      const studentId = String(student._id);
      const { practiceSessionId, domainId, targetSkillId, sessionType = 'practice', sessionLabel = 'Practice', questions = [] } = req.body || {};
      if (!practiceSessionId || !targetSkillId) return res.status(400).json({ error: 'practiceSessionId and targetSkillId are required.' });
      const resolvedDomainId = domainId || (resolveDomainId ? resolveDomainId(targetSkillId) : `${prefix}-unknown`);
      const lifecycleLog = buildPracticeLifecycleLog({ sessionId: practiceSessionId, studentId, targetQuestions: questions.length || 0, completionReason: 'in_progress' });
      await MathPathPracticeSession.findOneAndUpdate(
        { practiceSessionId },
        {
          $setOnInsert: {
            practiceSessionId, studentId, domainId: resolvedDomainId, targetSkillId,
            targetQuestionFamilyIds: [], workingSessionId: '', assignmentId: '',
            sessionGoal: sessionLabel, estimatedQuestionCount: questions.length,
            workingExpected: false, questions, responses: [], status: 'inProgress', startedAt: new Date(),
          },
          $set: { lifecycleLog },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      logPracticeLifecycle(lifecycleLog);
      await recordLearningEvents([
        { studentId, eventType: 'session_started', domain: resolvedDomainId, sessionId: practiceSessionId, metadata: { source, sessionType, targetSkillId } },
        { studentId, eventType: 'practice_started', domain: resolvedDomainId, sessionId: practiceSessionId, metadata: { source, sessionType, targetSkillId } },
      ]);
      res.json({ practiceSessionId, studentId, domainId: resolvedDomainId, persisted: true, lifecycleLog });
    } catch (err) { res.status(err.status || 500).json({ error: err.message || `Failed to start P${level} practice.` }); }
  });

  if (level === 1) {
    router.get(`/${prefix}/practice/:practiceSessionId`, protect, async (req, res) => {
      try {
        const student = await resolveStudent(req);
        const session = await MathPathPracticeSession.findOne({
          practiceSessionId: req.params.practiceSessionId,
          studentId: String(student._id),
        }).lean();
        if (!session) return res.status(404).json({ error: `P${level} practice session not found.` });
        if (!isDomainId(session.domainId)) return res.status(404).json({ error: `Session is not a P${level} session.` });
        res.json({
          practiceSessionId: session.practiceSessionId,
          studentId: session.studentId,
          domainId: session.domainId,
          targetSkillId: session.targetSkillId,
          sessionType: session.summary?.sessionType || 'practice',
          questions: session.questions || [],
          responses: session.responses || [],
          status: session.status,
          summary: session.summary || {},
          lifecycleLog: session.lifecycleLog || {},
          startedAt: session.startedAt,
          completedAt: session.completedAt,
        });
      } catch (err) {
        res.status(err.status || 500).json({ error: err.message || `Failed to load P${level} practice session.` });
      }
    });
  }

  router.post(`/${prefix}/practice/:practiceSessionId/submit`, protect, async (req, res) => {
    try {
      const student = await resolveStudent(req);
      const studentId = String(student._id);
      const existing = await MathPathPracticeSession.findOne({ practiceSessionId: req.params.practiceSessionId, studentId });
      if (!existing) return res.status(404).json({ error: `P${level} practice session not found.` });
      if (!isDomainId(existing.domainId)) return res.status(400).json({ error: `Session is not a P${level} session.` });
      if (existing.status === 'completed') return res.json({ ...(existing.summary || {}), alreadyCompleted: true });
      const submitted = req.body || {};
      const sessionType = submitted.sessionType || 'practice';
      const results = Array.isArray(submitted.responses) ? submitted.responses : [];
      const domainId = existing.domainId;
      const questionsById = new Map((existing.questions || []).map((q) => [String(q.questionId), q]));
      const attemptDocs = results.filter((r) => r.questionId).map((r) => p1PracticeAttemptDoc({ studentId, result: r, sessionId: req.params.practiceSessionId, sessionType, domainId, question: questionsById.get(String(r.questionId)) || {} }));
      let attemptSaved = false;
      if (attemptDocs.length) {
        const write = await MathPathAttempt.bulkWrite(attemptDocs.map((doc) => ({ updateOne: { filter: { attemptId: doc.attemptId }, update: { $setOnInsert: doc }, upsert: true } })), { ordered: false });
        attemptSaved = Boolean((write.upsertedCount || 0) + (write.matchedCount || 0));
      }
      const wrongResults = results.filter(shouldCreatePracticeMistake);
      for (const result of wrongResults) {
        const question = questionsById.get(String(result.questionId)) || {};
        const attempt = attemptDocs.find((doc) => doc.questionId === result.questionId);
        const mistakeTag = result.misconceptionTag || result.mistakeCode || 'practice_error';
        await MathPathMistakeRecord.findOneAndUpdate(
          { studentId, domainId, mistakeCode: mistakeTag, skillId: result.skillId || question.skillId || '', questionFamilyId: result.questionFamilyId || question.questionFamilyId || '' },
          { $inc: { frequency: 1 }, $set: { mistakeName: mistakeTag, severity: result.confidence === 'i_know_this' ? 'high' : 'medium', lastSeenAt: new Date() },
            $push: { evidence: { source: 'practice-incorrect', questionId: result.questionId, sessionId: req.params.practiceSessionId, attemptId: attempt?.attemptId || result.attemptId || '', prompt: question.prompt || question.stem || '', studentAnswer: result.studentAnswer || result.answer || '', correctAnswer: result.correctAnswer || String(question.answer?.display ?? question.answer ?? ''), answerCorrect: false, confidence: result.confidence || '', timeTaken: normalizeTimeSpentSeconds(result.timeTaken, result.questionStartedAt, result.questionEndedAt), seenAt: new Date() } } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
      const bySkill = results.filter((r) => !r.error).reduce((acc, r) => { const skillId = r.skillId || ''; if (!skillId) return acc; if (!acc[skillId]) acc[skillId] = { total: 0, correct: 0 }; acc[skillId].total += 1; if (r.correct) acc[skillId].correct += 1; return acc; }, {});
      await Promise.all(Object.entries(bySkill).map(([skillId, counts]) => {
        const accuracy = counts.total ? Math.round((counts.correct / counts.total) * 100) : 0;
        const set = { status: accuracy >= 90 ? 'mastered' : accuracy >= 60 ? 'learning' : 'needsReview', accuracy, lastPractisedAt: new Date() };
        if (accuracy >= 90) set.masteredAt = new Date();
        return MathPathStudentSkillState.findOneAndUpdate({ studentId, domainId, skillId }, { $inc: { attemptCount: counts.total, correctCount: counts.correct }, $set: set }, { upsert: true, new: true, setDefaultsOnInsert: true });
      }));
      const progressUpdated = Object.keys(bySkill).length > 0;
      const total = results.length;
      const correctCount = results.filter((r) => r.correct).length;
      const accuracy = total ? Math.round((correctCount / total) * 100) : 0;
      const lifecycleLog = buildPracticeLifecycleLog({ sessionId: req.params.practiceSessionId, studentId, questionId: results.at(-1)?.questionId || '', attemptSaved, mistakeCreated: wrongResults.length > 0, progressUpdated, answeredQuestions: results.length, targetQuestions: existing.estimatedQuestionCount || existing.questions?.length || results.length, completionReason: 'target_reached' });
      const summary = { practiceSessionId: req.params.practiceSessionId, sessionType, results, accuracySummary: { total, correct: correctCount, accuracyPercentage: accuracy }, persisted: true, lifecycleLog };
      existing.status = 'completed'; existing.completedAt = new Date(); existing.responses = req.body?.responses || []; existing.summary = summary; existing.lifecycleLog = lifecycleLog;
      await existing.save();
      logPracticeLifecycle(lifecycleLog);
      await recordLearningEvents([
        ...attemptDocs.map((attempt) => ({ studentId, eventType: attempt.skipped ? 'question_skipped' : 'question_answered', domain: domainId, skillCode: attempt.skillId, questionId: attempt.questionId, sessionId: req.params.practiceSessionId, metadata: { answerCorrect: attempt.correct, confidence: normalizeConfidence(attempt.confidence), timeTakenSeconds: attempt.timeTaken, skipped: attempt.skipped } })),
        { studentId, eventType: 'session_completed', domain: domainId, sessionId: req.params.practiceSessionId, metadata: { source, total, correct: correctCount } },
        { studentId, eventType: 'practice_completed', domain: domainId, sessionId: req.params.practiceSessionId, metadata: { source, total, correct: correctCount } },
      ]);
      res.json(summary);
    } catch (err) { res.status(err.status || 500).json({ error: err.message || `Failed to submit P${level} practice.` }); }
  });

  router.get(`/${prefix}/skill-states`, protect, async (req, res) => {
    try {
      const student = await resolveStudent(req);
      const states = await MathPathStudentSkillState.find({ studentId: String(student._id), domainId: { $regex: domainRegex } }).lean();
      res.json({ skillStates: states });
    } catch (err) { res.status(err.status || 500).json({ error: err.message || `Failed to load P${level} skill states.` }); }
  });

  return router;
}

const levelPracticeRouters = [1, 2, 3, 4, 5, 6].map((level) =>
  createLevelPracticeRouter({
    level,
    resolveDomainId: level === 1 ? resolveP1DomainId : null,
  })
);

export default levelPracticeRouters;
