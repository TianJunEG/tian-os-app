import express from 'express';
import { protect } from '../../middleware/auth.js';
import MathPathAttempt from '../../models/mathpath/MathPathAttempt.js';
import MathPathMistakeRecord from '../../models/mathpath/MathPathMistakeRecord.js';
import MathPathStudentSkillState from '../../models/mathpath/MathPathStudentSkillState.js';
import MathPathPracticeSession from '../../models/mathpath/MathPathPracticeSession.js';
import Mistake from '../../models/Mistake.js';
import Skill from '../../models/Skill.js';
import { resolveStudent } from '../../utils/studentContext.js';
import { normalizeConfidence, recordLearningEvents } from '../../services/telemetry/learningTelemetryService.js';
import {
  startFractionPracticeFlow,
  submitFractionPracticeAttempt,
} from '../../shared/mathpath/fractions/fractionPracticeFlow.js';
import {
  getFractionsModelTrainerForSkill,
  getFractionsModelTrainerTemplate,
  listFractionsModelTrainerTemplates,
} from '../../services/mathpath/fractionsModelTrainer.js';
import {
  getAssignmentById,
  updateAssignmentProgress,
} from '../../services/mathpath/mathPathAssignmentService.js';
import {
  buildPracticeLifecycleLog,
  logPracticeLifecycle,
  practiceAttemptDoc,
  buildPracticeMistakeSnapshot,
  shouldCreatePracticeMistake,
  buildOfflineRecoveryPracticeSessionFields,
  normalizeTimeSpentSeconds,
  resolveSkillObjectIdForCode,
} from './_helpers.js';

const router = express.Router();

router.get('/fractions/model-trainer', protect, async (req, res) => {
  try {
    res.json({
      templates: listFractionsModelTrainerTemplates({ skillId: req.query.skillId }),
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load model trainer templates.' });
  }
});

router.get('/fractions/model-trainer/skill/:skillId', protect, async (req, res) => {
  try {
    res.json({
      skillId: String(req.params.skillId || '').toUpperCase(),
      templates: getFractionsModelTrainerForSkill(req.params.skillId),
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load model trainer templates.' });
  }
});

router.get('/fractions/model-trainer/:templateId', protect, async (req, res) => {
  try {
    const template = getFractionsModelTrainerTemplate(req.params.templateId);
    if (!template) return res.status(404).json({ error: 'Model trainer template not found.' });
    res.json({ template });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load model trainer template.' });
  }
});

router.post('/fractions/practice/start', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    const assignmentId = String(req.body?.assignmentId || '');
    let assignment = null;
    if (assignmentId) {
      assignment = await getAssignmentById(assignmentId);
      if (!assignment) return res.status(404).json({ error: 'MathPath assignment not found.' });
      await resolveStudent(req, assignment.studentId);
      if (String(assignment.studentId) !== studentId) return res.status(403).json({ error: 'Assignment does not belong to this student.' });
    }
    const started = startFractionPracticeFlow({
      studentId,
      domainId: 'fractions',
      sessionType: req.body?.sessionType || 'practice',
      requestedSkillId: req.body?.skillId || req.body?.requestedSkillId || assignment?.skillIds?.[0] || null,
      requestedQuestionFamilyId: req.body?.questionFamilyId || null,
      sessionLength: req.body?.questionCount || req.body?.sessionLength || assignment?.targetQuestionCount || 6,
      weakSkillIds: Array.isArray(req.body?.weakSkillIds) ? req.body.weakSkillIds : (assignment?.skillIds || []),
      recentMistakeTypes: Array.isArray(req.body?.recentMistakeTypes) ? req.body.recentMistakeTypes : [],
    });
    const lifecycleLog = buildPracticeLifecycleLog({
      sessionId: started.practiceSessionId,
      studentId,
      targetQuestions: started.questions?.length || 0,
      completionReason: 'in_progress',
    });
    await MathPathPracticeSession.findOneAndUpdate(
      { practiceSessionId: started.practiceSessionId },
      {
        $setOnInsert: {
          practiceSessionId: started.practiceSessionId,
          studentId,
          domainId: 'fractions',
          targetSkillId: started.targetSkillId || '',
          targetQuestionFamilyIds: started.targetQuestionFamilyIds || [],
          workingSessionId: started.workingSessionId || '',
          assignmentId,
          sessionGoal: started.sessionLabel || 'Practice',
          estimatedQuestionCount: started.questions?.length || 0,
          workingExpected: Boolean(started.workingExpected),
          questions: started.questions || [],
          responses: [],
          status: 'inProgress',
          startedAt: new Date(),
        },
        $set: { lifecycleLog, ...(assignmentId ? { assignmentId } : {}) },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    logPracticeLifecycle(lifecycleLog);
    await recordLearningEvents([
      {
        studentId,
        eventType: 'session_started',
        domain: 'fractions',
        sessionId: started.practiceSessionId,
        metadata: { source: 'mathpath_practice', sessionType: started.sessionType, targetSkillId: started.targetSkillId },
      },
      {
        studentId,
        eventType: 'practice_started',
        domain: 'fractions',
        sessionId: started.practiceSessionId,
        metadata: { source: 'mathpath_practice', sessionType: started.sessionType, targetSkillId: started.targetSkillId },
      },
    ]);
    res.json({ ...started, studentId, assignmentId, persisted: true, lifecycleLog });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to start practice.' });
  }
});

router.get('/fractions/practice/:practiceSessionId', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const session = await MathPathPracticeSession.findOne({
      practiceSessionId: req.params.practiceSessionId,
      studentId: String(student._id),
      domainId: 'fractions',
    }).lean();
    if (!session) return res.status(404).json({ error: 'Practice session not found.' });
    res.json({
      practiceSessionId: session.practiceSessionId,
      studentId: session.studentId,
      domainId: session.domainId,
      targetSkillId: session.targetSkillId,
      targetQuestionFamilyIds: session.targetQuestionFamilyIds || [],
      workingSessionId: session.workingSessionId || '',
      assignmentId: session.assignmentId || '',
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
    res.status(err.status || 500).json({ error: err.message || 'Failed to load practice session.' });
  }
});

router.post('/fractions/practice/:practiceSessionId/submit', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const studentId = String(student._id);
    let existing = await MathPathPracticeSession.findOne({
      practiceSessionId: req.params.practiceSessionId,
      studentId,
      domainId: 'fractions',
    });
    if (!existing) {
      const recoveryFields = buildOfflineRecoveryPracticeSessionFields({
        practiceSessionId: req.params.practiceSessionId,
        studentId,
        body: req.body,
      });
      if (!recoveryFields) {
        return res.status(404).json({ error: 'Practice session not found.' });
      }
      existing = new MathPathPracticeSession({ ...recoveryFields, startedAt: new Date() });
      await existing.save();
    }
    if (existing.status === 'completed' && existing.summary?.results?.length) {
      return res.json({ ...existing.summary, persisted: true, duplicateIgnored: true, lifecycleLog: existing.lifecycleLog || {} });
    }

    const submitted = submitFractionPracticeAttempt({
      practiceSessionId: req.params.practiceSessionId,
      studentId,
      sessionType: req.body?.sessionType || existing.summary?.sessionType || 'practice',
      responses: Array.isArray(req.body?.responses) ? req.body.responses : [],
    });
    const results = submitted.results || [];
    const questionsById = new Map((existing.questions || []).map((question) => [String(question.questionId), question]));
    const attemptDocs = results
      .filter((result) => result.questionId && !result.error)
      .map((result) => practiceAttemptDoc({
        studentId,
        result,
        sessionId: req.params.practiceSessionId,
        sessionType: submitted.sessionType || 'practice',
        question: questionsById.get(String(result.questionId)) || {},
        assignmentId: existing.assignmentId || '',
      }));
    let attemptSaved = false;
    if (attemptDocs.length) {
      const write = await MathPathAttempt.bulkWrite(
        attemptDocs.map((doc) => ({
          updateOne: {
            filter: { attemptId: doc.attemptId },
            update: { $setOnInsert: doc },
            upsert: true,
          },
        })),
        { ordered: false }
      );
      attemptSaved = Boolean((write.upsertedCount || 0) + (write.matchedCount || 0));
    }

    const wrongResults = results.filter(shouldCreatePracticeMistake);
    const skillObjectIds = new Map();
    await Promise.all([...new Set(wrongResults.map((result) => result.skillId).filter(Boolean))]
      .map(async (skillCode) => {
        skillObjectIds.set(skillCode, await resolveSkillObjectIdForCode(skillCode));
      }));
    const createdMistakes = [];
    for (const result of wrongResults) {
      const question = questionsById.get(String(result.questionId)) || {};
      const attempt = attemptDocs.find((doc) => doc.questionId === result.questionId);
      const mistakeTag = result.misconceptionTag || result.mistakeCode || 'practice_error';
      await MathPathMistakeRecord.findOneAndUpdate(
        {
          studentId,
          domainId: 'fractions',
          mistakeCode: mistakeTag,
          skillId: result.skillId || question.skillId || '',
          questionFamilyId: result.questionFamilyId || question.questionFamilyId || '',
        },
        {
          $inc: { frequency: 1 },
          $set: {
            mistakeName: mistakeTag,
            severity: result.confidence === 'i_know_this' ? 'high' : 'medium',
            lastSeenAt: new Date(),
          },
          $push: {
            evidence: {
              source: 'practice-incorrect',
              questionId: result.questionId,
              sessionId: req.params.practiceSessionId,
              attemptId: attempt?.attemptId || result.attemptId || '',
              prompt: question.prompt || question.stem || '',
              studentAnswer: result.studentAnswer || result.answer || '',
              correctAnswer: result.correctAnswer || question.answer?.display || '',
              answerCorrect: false,
              confidence: result.confidence || '',
              workingSubmitted: Boolean(result.workingSubmitted),
              workingOnPaper: Boolean(result.workingOnPaper),
              workingNotNeeded: Boolean(result.workingNotNeeded),
              workingSessionId: String(result.workingSessionId || ''),
              workingImage: String(result.workingImage || result.fullscreenWorkingImage || ''),
              workingStrokes: Array.isArray(result.workingStrokes) ? result.workingStrokes : [],
              timeTaken: normalizeTimeSpentSeconds(result.timeTaken, result.questionStartedAt, result.questionEndedAt),
              seenAt: new Date(),
            },
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      const sharedMistake = await Mistake.findOneAndUpdate(
        { studentId: student._id, attemptId: attempt?.attemptId || '', module: 'MathPath' },
        {
          $setOnInsert: buildPracticeMistakeSnapshot({
            student,
            result,
            question,
            attempt,
            sessionId: req.params.practiceSessionId,
            skillObjectId: skillObjectIds.get(result.skillId) || null,
            mistakeTag,
          }),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      createdMistakes.push(sharedMistake);
    }

    const bySkill = results.filter((result) => !result.error).reduce((acc, result) => {
      const skillId = result.skillId || '';
      if (!skillId) return acc;
      if (!acc[skillId]) acc[skillId] = { total: 0, correct: 0 };
      acc[skillId].total += 1;
      if (result.correct) acc[skillId].correct += 1;
      return acc;
    }, {});
    await Promise.all(Object.entries(bySkill).map(([skillId, counts]) => {
      const accuracy = counts.total ? Math.round((counts.correct / counts.total) * 100) : 0;
      const set = {
        status: accuracy >= 90 ? 'accurate' : accuracy >= 60 ? 'learning' : 'needsReview',
        accuracy,
        lastPractisedAt: new Date(),
      };
      return MathPathStudentSkillState.findOneAndUpdate(
        { studentId, domainId: 'fractions', skillId },
        { $inc: { attemptCount: counts.total, correctCount: counts.correct }, $set: set },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }));
    const progressUpdated = Object.keys(bySkill).length > 0;
    const lifecycleLog = buildPracticeLifecycleLog({
      sessionId: req.params.practiceSessionId,
      studentId,
      questionId: results.at(-1)?.questionId || '',
      attemptSaved,
      mistakeCreated: createdMistakes.length > 0,
      progressUpdated,
      answeredQuestions: results.length,
      targetQuestions: existing.estimatedQuestionCount || existing.questions?.length || results.length,
      completionReason: 'target_reached',
    });

    const summary = { ...submitted, persisted: true, lifecycleLog };
    existing.status = 'completed';
    existing.completedAt = new Date();
    existing.responses = req.body?.responses || [];
    existing.summary = summary;
    existing.lifecycleLog = lifecycleLog;
    await existing.save();
    let assignmentProgress = null;
    if (existing.assignmentId) {
      assignmentProgress = await updateAssignmentProgress({ assignmentId: existing.assignmentId });
    }
    logPracticeLifecycle(lifecycleLog);

    await recordLearningEvents([
      ...attemptDocs.map((attempt) => ({
        studentId,
        eventType: attempt.skipped ? 'question_skipped' : 'question_answered',
        domain: 'fractions',
        skillCode: attempt.skillId,
        questionId: attempt.questionId,
        sessionId: req.params.practiceSessionId,
        metadata: {
          answerCorrect: attempt.correct,
          confidence: normalizeConfidence(attempt.confidence),
          timeTakenSeconds: attempt.timeTaken,
          workingSubmitted: attempt.workingSubmitted,
          workingOnPaper: attempt.workingOnPaper,
          workingNotNeeded: attempt.workingNotNeeded,
          skipped: attempt.skipped,
        },
      })),
      {
        studentId,
        eventType: 'session_completed',
        domain: 'fractions',
        sessionId: req.params.practiceSessionId,
        metadata: { source: 'mathpath_practice', total: results.length, correct: results.filter((r) => r.correct).length },
      },
      {
        studentId,
        eventType: 'practice_completed',
        domain: 'fractions',
        sessionId: req.params.practiceSessionId,
        metadata: { source: 'mathpath_practice', total: results.length, correct: results.filter((r) => r.correct).length },
      },
    ]);

    res.json({ ...summary, assignmentProgress });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to submit practice.' });
  }
});

export default router;
