import express from 'express';
import { protect } from '../middleware/auth.js';
import { requireWorkspace } from '../middleware/workspace.js';
import InformalAssessment from '../models/InformalAssessment.js';
import InformalAssessmentSession from '../models/InformalAssessmentSession.js';
import Assignment from '../models/Assignment.js';
import { gradeSubmission } from '../services/teacher/informalAssessmentService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
router.use(protect, requireWorkspace);

function stripAnswers(questions, module) {
  return questions.map((q, i) => {
    const safe = { questionId: q.questionId, index: i, skillId: q.skillId };
    if (module === 'MathPath') {
      safe.display = q.display;
      safe.choices = q.choices || [];
      safe.choice = !!q.choice;
      safe.kind = q.kind;
    } else {
      safe.storyText = q.storyText;
      safe.heuristic = q.heuristic;
      safe.structure = q.structure;
    }
    return safe;
  });
}

// Load session with questions (answers stripped)
router.get('/:sessionId', asyncHandler(async (req, res) => {
  const session = await InformalAssessmentSession.findById(req.params.sessionId).lean();
  if (!session) return res.status(404).json({ error: 'Session not found.' });

  const assessment = await InformalAssessment.findById(session.assessmentId).lean();
  if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });

  res.json({
    session: {
      _id: session._id,
      status: session.status,
      startedAt: session.startedAt,
      submittedAt: session.submittedAt,
      score: session.score,
      correctCount: session.correctCount,
      totalCount: session.totalCount,
      attempts: session.status === 'submitted' ? session.attempts : [],
    },
    assessment: {
      _id: assessment._id,
      title: assessment.title,
      module: assessment.module,
      questionCount: assessment.questionCount,
      timeLimitMinutes: assessment.timeLimitMinutes,
      questions: session.status === 'submitted'
        ? assessment.questions
        : stripAnswers(assessment.questions, assessment.module),
    },
  });
}));

// Start session
router.post('/:sessionId/start', asyncHandler(async (req, res) => {
  const session = await InformalAssessmentSession.findById(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found.' });
  if (session.status === 'submitted') return res.status(409).json({ error: 'Already submitted.' });

  const assessment = await InformalAssessment.findById(session.assessmentId).lean();
  if (assessment?.status === 'closed') return res.status(409).json({ error: 'Assessment is closed.' });

  session.status = 'in_progress';
  session.startedAt = new Date();
  await session.save();

  if (session.assignmentId) {
    await Assignment.findByIdAndUpdate(session.assignmentId, {
      status: 'in_progress',
      'timestamps.startedAt': new Date(),
      'timestamps.inProgressAt': new Date(),
    });
  }

  res.json({ status: 'in_progress', startedAt: session.startedAt });
}));

// Submit all answers
router.post('/:sessionId/submit', asyncHandler(async (req, res) => {
  const session = await InformalAssessmentSession.findById(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found.' });
  if (session.status === 'submitted') return res.status(409).json({ error: 'Already submitted.' });

  const assessment = await InformalAssessment.findById(session.assessmentId);
  if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });

  const { answers = [] } = req.body;
  const { attempts, correctCount, totalCount, score } = gradeSubmission(assessment, answers);

  session.attempts = attempts;
  session.correctCount = correctCount;
  session.totalCount = totalCount;
  session.score = score;
  session.status = 'submitted';
  session.submittedAt = new Date();
  if (session.startedAt) {
    session.timeSpentMs = Date.now() - session.startedAt.getTime();
  }
  await session.save();

  if (session.assignmentId) {
    await Assignment.findByIdAndUpdate(session.assignmentId, {
      status: 'completed',
      score,
      completionDate: new Date(),
      'timestamps.completedAt': new Date(),
    });
  }

  // Update cached summary on the assessment
  const completedCount = await InformalAssessmentSession.countDocuments({
    assessmentId: assessment._id,
    status: 'submitted',
  });
  const allScores = await InformalAssessmentSession.find({
    assessmentId: assessment._id,
    status: 'submitted',
  }).select('score').lean();
  const avg = allScores.length
    ? Math.round(allScores.reduce((s, r) => s + (r.score || 0), 0) / allScores.length)
    : null;
  assessment.resultsSummary.totalCompleted = completedCount;
  assessment.resultsSummary.averageScore = avg;
  await assessment.save();

  res.json({
    status: 'submitted',
    score,
    correctCount,
    totalCount,
    attempts,
    questions: assessment.questions,
  });
}));

export default router;
