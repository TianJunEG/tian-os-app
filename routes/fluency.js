import express from 'express';
import { protect } from '../middleware/auth.js';
import PracticeSession from '../models/PracticeSession.js';
import PracticeAttempt from '../models/PracticeAttempt.js';
import Question from '../models/Question.js';
import Skill from '../models/Skill.js';
import Assignment from '../models/Assignment.js';
import FluencyRecord from '../models/FluencyRecord.js';
import RetentionReview from '../models/RetentionReview.js';
import { resolveStudent } from '../utils/studentContext.js';
import { selectSimilarQuestions } from '../utils/worksheetGen.js';
import { isCorrectWithContext } from '../utils/answerCheck.js';
import {
  buildRetentionReviews,
  calculateFluencyMetrics,
  classifyFluencyBuckets,
  FLUENCY_STATUS,
} from '../utils/fluencyEngine.js';

const router = express.Router();
const SKILL_CODE = /^F\d{3}$/i;

function answerInputTypeFor(answer = '') {
  const raw = String(answer || '').trim();
  if (/^-?\d+\s+\d+\s*\/\s*\d+$/.test(raw)) return 'mixed';
  if (/^-?\d+\s*\/\s*-?\d+$/.test(raw)) return 'fraction';
  return '';
}

function clientQuestion(q) {
  return {
    questionId: q._id,
    stem: q.stem,
    type: q.type,
    choices: q.choices,
    difficulty: q.difficulty,
    skillId: q.skillId?._id || q.skillId,
    skillName: q.skillId?.name,
    answerInputType: answerInputTypeFor(q.answer),
    visual: q.visual || null,
  };
}

async function resolveSkill(ref) {
  const value = String(ref || '').trim();
  if (!value) return null;
  if (SKILL_CODE.test(value)) {
    return Skill.findOne({
      $or: [
        { 'metadata.mathPathSkillId': value.toUpperCase() },
        { 'metadata.frameworkCode': value.toUpperCase() },
        { slug: value.toUpperCase() },
      ],
    });
  }
  return Skill.findById(value);
}

function skillCodeFor(skill) {
  return skill?.metadata?.mathPathSkillId || skill?.metadata?.frameworkCode || skill?.slug || String(skill?._id || '');
}

async function upsertRetentionReviews({ student, skill, skillCode, fluentAt }) {
  const reviews = buildRetentionReviews({
    studentId: String(student._id),
    skillId: skill._id,
    skillCode,
    fluentAt,
  });
  for (const review of reviews) {
    await RetentionReview.updateOne(
      { studentId: student._id, skillId: skill._id, intervalDays: review.intervalDays },
      {
        $setOnInsert: {
          ...review,
          studentId: student._id,
          skillId: skill._id,
          skillName: skill.name,
        },
      },
      { upsert: true }
    );
  }
}

async function publicFluencySummary(studentId) {
  const records = await FluencyRecord.find({ studentId }).sort({ updatedAt: -1 }).lean();
  return classifyFluencyBuckets(records.map((record) => ({
    ...record,
    skillId: String(record.skillId),
  })));
}

async function publicRetentionSummary(studentId) {
  const now = new Date();
  const rows = await RetentionReview.find({ studentId }).sort({ reviewDate: 1 }).lean();
  const shape = (row) => ({
    id: String(row._id),
    skillId: String(row.skillId),
    skillCode: row.skillCode,
    skillName: row.skillName,
    reviewDate: row.reviewDate,
    completed: Boolean(row.completed),
    retained: Boolean(row.retained),
    status: row.status,
    intervalDays: row.intervalDays,
    metrics: row.metrics || null,
  });
  return {
    upcomingReviews: rows.filter((row) => !row.completed && new Date(row.reviewDate) >= now).map(shape),
    overdueReviews: rows.filter((row) => !row.completed && new Date(row.reviewDate) < now).map(shape),
    retentionHistory: rows.filter((row) => row.completed).map(shape),
    emptyState: rows.length ? null : 'Retention reviews will appear after a skill becomes fluent.',
  };
}

router.get('/me', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const summary = await publicFluencySummary(student._id);
    const hasData = Boolean(summary.fluentSkills.length || summary.developingSkills.length || summary.needsPracticeSkills.length);
    res.json({
      ...summary,
      emptyState: hasData ? null : 'Complete more practice to begin fluency tracking.',
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load fluency.' });
  }
});

router.get('/me/retention', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    res.json(await publicRetentionSummary(student._id));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load retention reviews.' });
  }
});

router.post('/session/start', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const retentionReview = req.body?.retentionReviewId
      ? await RetentionReview.findOne({ _id: req.body.retentionReviewId, studentId: student._id })
      : null;
    const skill = retentionReview
      ? await Skill.findById(retentionReview.skillId)
      : await resolveSkill(req.body?.skillCode || req.body?.skillId);
    if (!skill) return res.status(400).json({ error: 'Select one fluency skill.' });

    const minQuestions = retentionReview ? 3 : 10;
    const maxQuestions = retentionReview ? 5 : 20;
    const defaultQuestions = retentionReview ? 5 : 12;
    const questionCount = Math.max(minQuestions, Math.min(maxQuestions, Number(req.body?.questionCount || defaultQuestions)));
    const questions = await selectSimilarQuestions({
      studentId: student._id,
      skillIds: [String(skill._id)],
      difficulty: 'medium',
      count: questionCount,
    });
    if (!questions.length) return res.status(400).json({ error: 'No fluency questions available for this skill yet.' });

    const session = await PracticeSession.create({
      studentId: student._id,
      workspaceId: student.workspaceId,
      module: 'MathPath',
      feature: retentionReview ? 'Retention Review' : 'Fluency Practice',
      mode: 'fluency',
      skillIds: [skill._id],
      status: 'active',
    });

    res.json({
      session_id: session._id,
      mode: 'fluency',
      feature: retentionReview ? 'Retention Review' : 'Fluency Practice',
      retentionReviewId: retentionReview ? String(retentionReview._id) : null,
      skillCode: skillCodeFor(skill),
      skillName: skill.name,
      questionCount: questions.length,
      items: questions.map(clientQuestion),
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to start fluency session.' });
  }
});

router.post('/session/complete', protect, async (req, res) => {
  try {
    const session = await PracticeSession.findById(req.body?.sessionId || req.body?.session_id);
    if (!session) return res.status(404).json({ error: 'Session not found.' });
    const student = await resolveStudent(req, session.studentId);
    const skill = await Skill.findById(session.skillIds?.[0]);
    if (!skill) return res.status(400).json({ error: 'Fluency session has no skill.' });

    let attempts = Array.isArray(req.body?.attempts) ? req.body.attempts : [];
    if (attempts.length) {
      const questions = await Question.find({ _id: { $in: attempts.map((attempt) => attempt.questionId).filter(Boolean) } });
      const byId = new Map(questions.map((q) => [String(q._id), q]));
      for (const attempt of attempts) {
        const q = byId.get(String(attempt.questionId));
        if (!q) continue;
        const skipped = Boolean(attempt.skipped);
        const correct = skipped
          ? false
          : attempt.correct !== undefined
          ? Boolean(attempt.correct)
          : isCorrectWithContext(attempt.answer, q.answer, q.stem);
        const timeMs = attempt.timeMs ?? (attempt.timeTakenSeconds !== undefined ? Math.round(Number(attempt.timeTakenSeconds) * 1000) : null);
        await PracticeAttempt.create({
          sessionId: session._id,
          studentId: student._id,
          questionId: q._id,
          skillId: q.skillId,
          answer: String(attempt.answer ?? ''),
          correct,
          timeMs,
          timeTakenSeconds: attempt.timeTakenSeconds ?? (timeMs === null ? null : Math.round(timeMs / 1000)),
          questionStartTime: attempt.questionStartTime || null,
          questionSubmitTime: attempt.questionSubmitTime || null,
          confidence: attempt.confidence || attempt.confidenceLevel || '',
          skipped,
          workingSubmitted: Boolean(attempt.workingSubmitted),
          workingUploaded: Boolean(attempt.workingUploaded),
          fullscreenWorkingSubmitted: Boolean(attempt.fullscreenWorkingSubmitted),
          hintsUsed: Number(attempt.hintsUsed || 0),
        });
      }
    }

    const storedAttempts = await PracticeAttempt.find({ sessionId: session._id }).lean();
    attempts = storedAttempts.map((attempt) => ({
      questionId: String(attempt.questionId),
      answer: attempt.answer,
      correct: attempt.correct,
      confidence: attempt.confidence,
      skipped: attempt.skipped,
      workingSubmitted: attempt.workingSubmitted || attempt.workingUploaded || attempt.fullscreenWorkingSubmitted,
      timeMs: attempt.timeMs,
      timeTakenSeconds: attempt.timeTakenSeconds,
      questionStartTime: attempt.questionStartTime,
      questionSubmitTime: attempt.questionSubmitTime,
    }));

    const skillCode = skillCodeFor(skill);
    const targetSeconds = skill?.metadata?.fluency?.targetSeconds || 10;
    const metrics = calculateFluencyMetrics({ skillCode, attempts, targetSeconds });
    const previous = await FluencyRecord.findOne({ studentId: student._id, skillId: skill._id });
    const becameFluentNow = metrics.fluencyStatus === FLUENCY_STATUS.FLUENT && previous?.fluencyStatus !== FLUENCY_STATUS.FLUENT;
    const completedAt = new Date();

    const record = await FluencyRecord.findOneAndUpdate(
      { studentId: student._id, skillId: skill._id },
      {
        $set: {
          skillCode,
          skillName: skill.name,
          totalQuestions: metrics.totalQuestions,
          correctAnswers: metrics.correctAnswers,
          accuracy: metrics.accuracy,
          averageTimeSeconds: metrics.averageTimeSeconds,
          confidenceAverage: metrics.confidenceAverage,
          workingSubmissionRate: metrics.workingSubmissionRate,
          fluencyScore: metrics.fluencyScore,
          fluencyStatus: metrics.fluencyStatus,
          ...(becameFluentNow ? { becameFluentAt: completedAt } : {}),
        },
        $push: {
          history: {
            sessionId: String(session._id),
            completedAt,
            ...metrics,
          },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (becameFluentNow) {
      await upsertRetentionReviews({ student, skill, skillCode, fluentAt: completedAt });
    }

    const retentionReviewId = req.body?.retentionReviewId || req.body?.retention_review_id || null;
    if (retentionReviewId) {
      const retained = metrics.accuracy >= 85 && (metrics.averageTimeSeconds === null || metrics.averageTimeSeconds <= targetSeconds * 1.5);
      await RetentionReview.findOneAndUpdate(
        { _id: retentionReviewId, studentId: student._id, skillId: skill._id },
        {
          completed: true,
          retained,
          status: retained ? 'completed' : 'retention_risk',
          completedAt,
          metrics,
        }
      );
    }

    session.status = 'completed';
    session.endedAt = completedAt;
    session.summary = { total: metrics.totalQuestions, correct: metrics.correctAnswers, scorePct: Math.round(metrics.accuracy) };
    if (session.assignmentId) await Assignment.findByIdAndUpdate(session.assignmentId, { status: 'completed', completionDate: completedAt, score: metrics.accuracy });
    await session.save();

    res.json({
      session_id: session._id,
      fluency: {
        ...metrics,
        skillId: String(skill._id),
        skillName: skill.name,
      },
      record,
      retentionScheduled: becameFluentNow,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to complete fluency session.' });
  }
});

router.get('/student/:studentId', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req, req.params.studentId);
    const summary = await publicFluencySummary(student._id);
    const hasData = Boolean(summary.fluentSkills.length || summary.developingSkills.length || summary.needsPracticeSkills.length);
    res.json({
      ...summary,
      emptyState: hasData ? null : 'Complete more practice to begin fluency tracking.',
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load fluency.' });
  }
});

router.get('/student/:studentId/retention', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req, req.params.studentId);
    res.json(await publicRetentionSummary(student._id));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load retention reviews.' });
  }
});

export default router;
