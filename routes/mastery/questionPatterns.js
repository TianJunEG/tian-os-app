import express from 'express';
import { protect } from '../../middleware/auth.js';
import MathPathAttempt from '../../models/mathpath/MathPathAttempt.js';
import MathPathMistakeRecord from '../../models/mathpath/MathPathMistakeRecord.js';
import MathPathStudentSkillState from '../../models/mathpath/MathPathStudentSkillState.js';
import { resolveStudent } from '../../utils/studentContext.js';
import { normalizeConfidence, recordLearningEvents } from '../../services/telemetry/learningTelemetryService.js';
import { calculateQuestionTiming } from '../../shared/mathpath/fractions/fractionFluencyRetentionEngine.js';
import {
  approvePracticeSet,
  extractQuestionPattern,
  generateVariantsFromPattern,
  getPracticeSet,
  listApprovedPracticeSets,
  startSimilarQuestionPractice,
  submitSimilarQuestionPractice,
} from '../../services/mathpath/questionPatternTrainer.js';
import {
  canTrainQuestionPatterns,
  toDateLike,
  normalizeTimeSpentSeconds,
} from './_helpers.js';

const router = express.Router();

router.post('/fractions/question-patterns/analyze', protect, async (req, res) => {
  try {
    if (!canTrainQuestionPatterns(req.user)) return res.status(403).json({ error: 'Only teachers, tutors, and admins can train question patterns.' });
    const pattern = extractQuestionPattern({
      sourceExamples: req.body?.sourceQuestions || req.body?.sourceExamples || [],
      targetSkillId: req.body?.skillId || req.body?.targetSkillId || '',
      level: req.body?.level || '',
      curriculumTags: [req.body?.curriculum, req.body?.level].filter(Boolean),
      topic: req.body?.topic || '',
      subtopic: req.body?.subtopic || '',
      compatibleSessionTypes: req.body?.compatibleSessionTypes || [],
      worksheetCompatible: req.body?.worksheetCompatible !== false,
      generatedVariantTarget: req.body?.generatedVariantTarget || req.body?.difficultyMix || {},
      variantCount: req.body?.variantCount,
    });
    const generated = generateVariantsFromPattern(pattern);
    res.json({ pattern, preview: generated.variants.slice(0, 12), quality: generated.quality });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to analyze question pattern.' });
  }
});

router.post('/fractions/question-patterns/generate', protect, async (req, res) => {
  try {
    if (!canTrainQuestionPatterns(req.user)) return res.status(403).json({ error: 'Only teachers, tutors, and admins can generate question patterns.' });
    const pattern = req.body?.pattern || extractQuestionPattern(req.body || {});
    const generated = generateVariantsFromPattern(pattern, {
      generatedVariantTarget: req.body?.generatedVariantTarget || req.body?.difficultyMix || {},
    });
    res.json(generated);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to generate similar questions.' });
  }
});

router.post('/fractions/question-patterns/approve', protect, async (req, res) => {
  try {
    if (!canTrainQuestionPatterns(req.user)) return res.status(403).json({ error: 'Only teachers, tutors, and admins can approve generated practice sets.' });
    const pattern = req.body?.pattern || extractQuestionPattern(req.body || {});
    const generated = req.body?.variants ? { pattern, variants: req.body.variants } : null;
    const practiceSet = await approvePracticeSet({
      patternInput: pattern,
      generated,
      userId: req.user?.id || null,
      title: req.body?.title || '',
      persist: true,
    });
    res.json({ practiceSet });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to approve practice set.' });
  }
});

router.get('/fractions/similar-practice-sets', protect, async (req, res) => {
  try {
    const sets = await listApprovedPracticeSets({
      domain: 'fractions',
      skillId: req.query.skillId ? String(req.query.skillId).toUpperCase() : '',
    });
    res.json({ practiceSets: sets });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load practice sets.' });
  }
});

router.get('/fractions/similar-practice-sets/:practiceSetId', protect, async (req, res) => {
  try {
    const practiceSet = await getPracticeSet(req.params.practiceSetId, { allowDraft: canTrainQuestionPatterns(req.user) });
    if (!practiceSet) return res.status(404).json({ error: 'Practice set not found.' });
    res.json({ practiceSet });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load practice set.' });
  }
});

router.post('/fractions/similar-practice-sets/:practiceSetId/start', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const started = await startSimilarQuestionPractice({
      practiceSetId: req.params.practiceSetId,
      studentId: String(student._id),
      limit: req.body?.limit || 10,
    });
    await recordLearningEvents([
      {
        studentId: String(student._id),
        eventType: 'session_started',
        domain: 'fractions',
        sessionId: started.sessionId || started.practiceSessionId || req.params.practiceSetId,
        metadata: { source: 'similar_question_practice', practiceSetId: req.params.practiceSetId },
      },
      {
        studentId: String(student._id),
        eventType: 'practice_started',
        domain: 'fractions',
        sessionId: started.sessionId || started.practiceSessionId || req.params.practiceSetId,
        metadata: { source: 'similar_question_practice', practiceSetId: req.params.practiceSetId },
      },
      ...((started.questions || started.items || []).map((question) => ({
        studentId: String(student._id),
        eventType: 'question_viewed',
        domain: 'fractions',
        skillCode: question.skillId || '',
        questionId: question.variantId || question.questionId || '',
        sessionId: started.sessionId || started.practiceSessionId || req.params.practiceSetId,
        metadata: { source: 'similar_question_practice', practiceSetId: req.params.practiceSetId },
      }))),
    ]);
    res.json(started);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to start similar question practice.' });
  }
});

router.post('/fractions/similar-practice/:sessionId/submit', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const submitted = await submitSimilarQuestionPractice({
      sessionId: req.params.sessionId,
      studentId: String(student._id),
      responses: req.body?.responses || [],
    });
    const studentId = String(student._id);
    const results = submitted.results || [];
    if (results.length) {
      await MathPathAttempt.insertMany(
        results.map((result) => {
          const timing = calculateQuestionTiming({
            ...result,
            timeTaken: result.timeTaken,
            timeSpentSeconds: result.timeTaken,
            answerSubmittedAt: result.questionEndedAt,
          });
          return ({
            studentId,
            domainId: 'fractions',
            skillId: result.skillId || 'F023',
            questionFamilyId: result.questionFamilyId || `TRAINED_${result.skillId || 'F023'}`,
            questionId: result.variantId,
            sessionId: req.params.sessionId,
            sessionType: 'practice',
            answer: result.studentAnswer || '',
            studentAnswer: result.studentAnswer || '',
            correctAnswer: result.correctAnswer || '',
            correct: Boolean(result.correct),
            timeTaken: normalizeTimeSpentSeconds(result.timeTaken, result.questionStartedAt, result.questionEndedAt),
            timeSpentSeconds: normalizeTimeSpentSeconds(result.timeTaken, result.questionStartedAt, result.questionEndedAt),
            rawTimeSeconds: timing.rawTimeSeconds,
            effectiveAnswerTimeSeconds: timing.effectiveAnswerTimeSeconds,
            totalQuestionTimeSeconds: timing.totalQuestionTimeSeconds,
            reviewTimeSeconds: timing.reviewTimeSeconds,
            skillTimingSnapshot: timing,
            confidenceLevel: result.confidenceLevel || '',
            confidence: result.confidence || '',
            timestamp: toDateLike(result.timestamp) || toDateLike(result.questionEndedAt) || new Date(),
            attemptNumber: Number(result.attemptNumber || 1),
            skipped: Boolean(result.skipped),
            timedOut: Boolean(result.timedOut),
            questionStartedAt: toDateLike(result.questionStartedAt) || null,
            questionEndedAt: toDateLike(result.questionEndedAt) || null,
            workingUploaded: Boolean(result.workingUploaded),
          });
        }),
        { ordered: false }
      );

      const bySkill = results.reduce((acc, result) => {
        const skillId = result.skillId || 'F023';
        if (!acc[skillId]) acc[skillId] = { total: 0, correct: 0 };
        acc[skillId].total += 1;
        if (result.correct) acc[skillId].correct += 1;
        return acc;
      }, {});
      await Promise.all(Object.entries(bySkill).map(([skillId, counts]) => {
        const accuracy = counts.total ? Math.round((counts.correct / counts.total) * 100) : 0;
        const skillStateSet = {
          status: accuracy >= 85 ? 'accurate' : accuracy >= 50 ? 'learning' : 'needsReview',
          accuracy,
          lastPractisedAt: new Date(),
        };
        return MathPathStudentSkillState.findOneAndUpdate(
          { studentId, domainId: 'fractions', skillId },
          {
            $inc: { attemptCount: counts.total, correctCount: counts.correct },
            $set: skillStateSet,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }));

      const wrongResults = results.filter((result) => !result.correct);
      await Promise.all(wrongResults.flatMap((result) => {
        const tags = result.misconceptionTags?.length ? result.misconceptionTags : ['M010'];
        return tags.map((tag) => MathPathMistakeRecord.findOneAndUpdate(
          {
            studentId,
            domainId: 'fractions',
            mistakeCode: tag,
            skillId: result.skillId || 'F023',
            questionFamilyId: result.questionFamilyId || '',
          },
          {
            $inc: { frequency: 1 },
            $set: {
              mistakeName: tag,
              severity: submitted.summary?.scorePct < 50 ? 'high' : 'medium',
              remediationSkillIds: result.remediationSkillIds || [],
              lastSeenAt: new Date(),
            },
            $push: {
              evidence: {
                questionId: result.variantId,
                prompt: result.prompt,
                studentAnswer: result.studentAnswer,
                correctAnswer: result.correctAnswer,
                seenAt: new Date(),
              },
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ));
      }));
    }
    if (results.length) {
      const sessionId = req.params.sessionId;
      const correct = results.filter((result) => result.correct).length;
      await recordLearningEvents([
        ...results.map((result) => {
          const confidence = normalizeConfidence(result.confidence || result.confidenceLevel || '');
          return {
            studentId,
            eventType: result.skipped ? 'question_skipped' : 'question_answered',
            domain: 'fractions',
            skillCode: result.skillId || '',
            questionId: result.variantId || result.questionId || '',
            sessionId,
            metadata: {
              answerCorrect: Boolean(result.correct),
              confidence,
              timeTakenSeconds: normalizeTimeSpentSeconds(result.timeTaken, result.questionStartedAt, result.questionEndedAt),
              workingSubmitted: Boolean(result.workingUploaded || result.workingSubmitted || result.fullscreenWorkingSubmitted),
              workingNotNeeded: Boolean(result.workingNotNeeded),
              skipped: Boolean(result.skipped),
            },
          };
        }),
        ...results
          .map((result) => normalizeConfidence(result.confidence || result.confidenceLevel || '') ? ({
            studentId,
            eventType: 'confidence_selected',
            domain: 'fractions',
            skillCode: result.skillId || '',
            questionId: result.variantId || result.questionId || '',
            sessionId,
            metadata: { confidence: normalizeConfidence(result.confidence || result.confidenceLevel || '') },
          }) : null)
          .filter(Boolean),
        {
          studentId,
          eventType: 'session_completed',
          domain: 'fractions',
          sessionId,
          metadata: { source: 'similar_question_practice', total: results.length, correct, scorePct: results.length ? Math.round((correct / results.length) * 100) : 0 },
        },
        {
          studentId,
          eventType: 'practice_completed',
          domain: 'fractions',
          sessionId,
          metadata: { source: 'similar_question_practice', total: results.length, correct, scorePct: results.length ? Math.round((correct / results.length) * 100) : 0 },
        },
      ]);
    }
    res.json(submitted);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to submit similar question practice.' });
  }
});

export default router;
