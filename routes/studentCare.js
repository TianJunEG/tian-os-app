import express from 'express';
import { protect } from '../middleware/auth.js';
import Student from '../models/Student.js';
import MathPathAssignment from '../models/mathpath/MathPathAssignment.js';
import PaperAnalysis from '../models/mathpath/PaperAnalysis.js';
import MathPathMistakeRecord from '../models/mathpath/MathPathMistakeRecord.js';
import { resolveStudent } from '../utils/studentContext.js';
import { buildDiagnosticGrowth, getDiagnosticHistory } from '../services/diagnostics/diagnosticGrowthService.js';
import { buildParentRecommendations } from '../services/mathpath/parentRecommendationEngine.js';
import {
  buildRecoveryPackQueue,
  buildRecheckQueue,
  buildStudentCareAttentionQueue,
} from '../services/studentCare/studentCareAttentionEngine.js';
import { generateStudentCareParentSummary } from '../services/studentCare/studentCareParentSummaryGenerator.js';
import { buildStudentCareMetrics } from '../services/studentCare/studentCareMetricsService.js';

const router = express.Router();

function roleSet(user = {}) {
  return new Set([user.role, ...(Array.isArray(user.roles) ? user.roles : [])].filter(Boolean));
}

function requireStudentCare(req) {
  const roles = roleSet(req.user);
  if (roles.has('student_care') || roles.has('admin')) return;
  const err = new Error('Student Care access required.');
  err.status = 403;
  throw err;
}

function workspaceId(req) {
  return req.header('X-Workspace-Id') || req.query?.workspaceId || '';
}

async function listAccessibleStudents(req) {
  const roles = roleSet(req.user);
  const workspace = workspaceId(req);
  if (workspace) {
    return Student.find({ workspaceId: workspace }).sort({ name: 1 }).lean();
  }
  if (roles.has('admin') || process.env.QA_DISABLE_RATE_LIMIT === '1') {
    return Student.find({}).sort({ name: 1 }).limit(100).lean();
  }
  return Student.find({ createdByUserId: req.user.id }).sort({ name: 1 }).lean();
}

async function loadEvidenceForStudent(studentId, { subjectId = 'math', domainId = 'fractions' } = {}) {
  const [history, assignments, papers, mistakes] = await Promise.all([
    getDiagnosticHistory({ studentId, subjectId, domainId }),
    MathPathAssignment.find({ studentId, subjectId, domainId }).sort({ createdAt: -1 }).lean(),
    PaperAnalysis.find({ studentId, subjectId, domainId }).sort({ createdAt: -1 }).lean(),
    MathPathMistakeRecord.find({ studentId, domainId }).sort({ lastSeenAt: -1 }).lean(),
  ]);
  const growth = { ...buildDiagnosticGrowth(history), history };
  const lastActivityAt = [
    growth.latest?.completedAt,
    assignments[0]?.updatedAt || assignments[0]?.createdAt,
    papers[0]?.updatedAt || papers[0]?.createdAt,
    mistakes[0]?.lastSeenAt,
  ].filter(Boolean).sort((a, b) => new Date(b) - new Date(a))[0] || null;
  return { history, growth, assignments, papers, mistakes, lastActivityAt };
}

async function buildDashboardPayload(req) {
  const subjectId = req.query?.subjectId || 'math';
  const domainId = req.query?.domainId || 'fractions';
  const students = await listAccessibleStudents(req);
  const evidenceEntries = await Promise.all(students.map(async (student) => {
    const evidence = await loadEvidenceForStudent(String(student._id), { subjectId, domainId });
    return [String(student._id), evidence];
  }));
  const evidenceByStudent = Object.fromEntries(evidenceEntries);
  const assignments = evidenceEntries.flatMap(([, evidence]) => evidence.assignments);
  const papers = evidenceEntries.flatMap(([, evidence]) => evidence.papers);
  const diagnosticGrowth = evidenceEntries.map(([, evidence]) => evidence.growth);

  return {
    subjectId,
    domainId,
    students: students.map((student) => ({
      studentId: String(student._id),
      name: student.name,
      level: student.level || '',
    })),
    attentionQueue: buildStudentCareAttentionQueue({ students, evidenceByStudent }),
    homeworkQueue: papers.filter((paper) => ['uploaded', 'processing', 'ocr_complete', 'questions_detected', 'needs_review'].includes(paper.status))
      .map((paper) => ({
        studentId: String(paper.studentId),
        paperAnalysisId: String(paper._id),
        title: paper.originalFilename || 'Uploaded paper',
        status: paper.status,
        weakSkillIds: paper.weakSkillIds || [],
        uploadedAt: paper.createdAt,
      })),
    reviewedPapers: papers.filter((paper) => ['reviewed', 'assigned'].includes(paper.status))
      .map((paper) => ({
        studentId: String(paper.studentId),
        paperAnalysisId: String(paper._id),
        title: paper.originalFilename || 'Uploaded paper',
        status: paper.status,
        weakSkillIds: paper.weakSkillIds || [],
        reviewedAt: paper.reviewedAt || paper.updatedAt,
      })),
    recoveryPacks: buildRecoveryPackQueue({ students, assignments }),
    recheckQueue: buildRecheckQueue({ students, assignments }),
    parentUpdatesNeeded: buildStudentCareAttentionQueue({ students, evidenceByStudent })
      .filter((item) => item.priority === 'high' || item.type === 'paper_needs_review')
      .slice(0, 10),
    metrics: buildStudentCareMetrics({ students, assignments, diagnosticGrowth, papers }),
  };
}

router.get('/dashboard', protect, async (req, res) => {
  try {
    requireStudentCare(req);
    const payload = await buildDashboardPayload(req);
    return res.json(payload);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not load Student Care dashboard.' });
  }
});

router.get('/homework', protect, async (req, res) => {
  try {
    requireStudentCare(req);
    const payload = await buildDashboardPayload(req);
    return res.json({
      students: payload.students,
      homeworkQueue: payload.homeworkQueue,
      recoveryPacks: payload.recoveryPacks,
      uploadActions: {
        paperAnalysisRoute: '/parent/mathpath/analyse-paper',
        supportedUploadTypes: ['blank_worksheet', 'completed_unmarked', 'marked_script', 'corrections_working'],
      },
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not load homework support.' });
  }
});

router.get('/recovery-packs', protect, async (req, res) => {
  try {
    requireStudentCare(req);
    const payload = await buildDashboardPayload(req);
    return res.json({
      students: payload.students,
      recoveryPacks: payload.recoveryPacks,
      metrics: {
        recoveryPacksAssigned: payload.metrics.recoveryPacksAssigned,
        recoveryPacksCompleted: payload.metrics.recoveryPacksCompleted,
      },
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not load recovery pack monitor.' });
  }
});

router.get('/rechecks', protect, async (req, res) => {
  try {
    requireStudentCare(req);
    const payload = await buildDashboardPayload(req);
    return res.json({
      students: payload.students,
      recheckQueue: payload.recheckQueue,
      recoveryPacks: payload.recoveryPacks.filter((pack) => pack.status === 'recheck_ready'),
      metrics: {
        rechecksCompleted: payload.metrics.rechecksCompleted,
        averageReadinessImprovement: payload.metrics.averageReadinessImprovement,
      },
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not load recheck centre.' });
  }
});

router.get('/reports', protect, async (req, res) => {
  try {
    requireStudentCare(req);
    const payload = await buildDashboardPayload(req);
    return res.json({
      metrics: payload.metrics,
      papersReviewed: payload.reviewedPapers,
      recoveryPacks: payload.recoveryPacks,
      recheckQueue: payload.recheckQueue,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not load Student Care reports.' });
  }
});

router.get('/students/:studentId/parent-summary', protect, async (req, res) => {
  try {
    requireStudentCare(req);
    const student = await resolveStudent(req, req.params.studentId);
    const evidence = await loadEvidenceForStudent(String(student._id), {
      subjectId: req.query?.subjectId || 'math',
      domainId: req.query?.domainId || 'fractions',
    });
    const recommendations = buildParentRecommendations(evidence);
    const summary = generateStudentCareParentSummary({ student, ...evidence, recommendations });
    return res.json({ studentId: String(student._id), summary });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not generate parent summary.' });
  }
});

export default router;
