import express from 'express';
import { protect } from '../middleware/auth.js';
import { resolveStudent } from '../utils/studentContext.js';
import MathPathAssignment from '../models/mathpath/MathPathAssignment.js';
import PaperAnalysis from '../models/mathpath/PaperAnalysis.js';
import MathPathMistakeRecord from '../models/mathpath/MathPathMistakeRecord.js';
import {
  buildDiagnosticGrowth,
  getDiagnosticHistory,
} from '../services/diagnostics/diagnosticGrowthService.js';
import {
  buildParentRecommendations,
  buildSuccessCentreStory,
} from '../services/mathpath/parentRecommendationEngine.js';
import { buildTutorLessonPrepPreview } from '../services/mathpath/tutorLessonPrepEngine.js';
import { generateParentProgressReport } from '../services/mathpath/progressReportGenerator.js';
import { getPilotDashboardMetrics } from '../services/mathpath/pilotDashboardMetricsService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

function roleSet(user = {}) {
  return new Set([user.role, ...(Array.isArray(user.roles) ? user.roles : [])].filter(Boolean));
}

function requireAnyRole(req, roles = []) {
  const set = roleSet(req.user);
  if (roles.some((role) => set.has(role))) return;
  const err = new Error('Not authorized for this MathPath view.');
  err.status = 403;
  throw err;
}

async function loadMathPathEvidence(studentId, { subjectId = 'math', domainId = 'fractions' } = {}) {
  const [history, assignments, papers, mistakes] = await Promise.all([
    getDiagnosticHistory({ studentId, subjectId, domainId }),
    MathPathAssignment.find({ studentId, subjectId, domainId }).sort({ createdAt: -1 }).lean(),
    PaperAnalysis.find({ studentId, subjectId, domainId }).sort({ createdAt: -1 }).lean(),
    MathPathMistakeRecord.find({ studentId, domainId }).sort({ lastSeenAt: -1 }).lean(),
  ]);
  const growth = { ...buildDiagnosticGrowth(history), history };
  return { history, growth, assignments, papers, mistakes };
}

router.get('/parent', protect, asyncHandler(async (req, res) => {
  try {
    requireAnyRole(req, ['parent', 'admin']);
    const student = await resolveStudent(req, req.query?.studentId);
    const subjectId = req.query?.subjectId || 'math';
    const domainId = req.query?.domainId || 'fractions';
    const evidence = await loadMathPathEvidence(String(student._id), { subjectId, domainId });
    const recommendations = buildParentRecommendations(evidence);
    const successCentre = buildSuccessCentreStory({
      student,
      ...evidence,
      recommendations,
    });
    return res.json({
      studentId: String(student._id),
      subjectId,
      domainId,
      successCentre,
      recommendations,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not load Success Centre.' });
  }
}));

router.get('/parent/report', protect, asyncHandler(async (req, res) => {
  try {
    requireAnyRole(req, ['parent', 'admin']);
    const student = await resolveStudent(req, req.query?.studentId);
    const subjectId = req.query?.subjectId || 'math';
    const domainId = req.query?.domainId || 'fractions';
    const evidence = await loadMathPathEvidence(String(student._id), { subjectId, domainId });
    const recommendations = buildParentRecommendations(evidence);
    const report = generateParentProgressReport({
      student,
      ...evidence,
      recommendations,
    });
    return res.json({ studentId: String(student._id), subjectId, domainId, report });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not generate progress report.' });
  }
}));

router.get('/tutor/lesson-prep', protect, asyncHandler(async (req, res) => {
  try {
    requireAnyRole(req, ['tutor', 'teacher', 'admin']);
    const student = await resolveStudent(req, req.query?.studentId);
    const subjectId = req.query?.subjectId || 'math';
    const domainId = req.query?.domainId || 'fractions';
    const evidence = await loadMathPathEvidence(String(student._id), { subjectId, domainId });
    const lessonPrep = buildTutorLessonPrepPreview({ student, ...evidence });
    return res.json({ studentId: String(student._id), subjectId, domainId, lessonPrep });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not load lesson prep preview.' });
  }
}));

router.get('/pilot-metrics', protect, asyncHandler(async (req, res) => {
  try {
    requireAnyRole(req, ['admin']);
    const metrics = await getPilotDashboardMetrics({
      subjectId: req.query?.subjectId || 'math',
      domainId: req.query?.domainId || 'fractions',
    });
    return res.json({ metrics });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not load pilot metrics.' });
  }
}));

export default router;
