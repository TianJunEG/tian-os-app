import express from 'express';
import { protect, resolveRoles } from '../middleware/auth.js';
import PaperAnalysis from '../models/mathpath/PaperAnalysis.js';
import { resolveStudent } from '../utils/studentContext.js';
import {
  createAssignmentFromDiagnostic,
  createAssignmentFromPaperAnalysis,
  createRecheckForAssignment,
  evaluateRecheckRecommendation,
  getAssignmentById,
  getStudentAssignments,
  resolveAssignedByRole,
  updateAssignmentProgress,
} from '../services/mathpath/mathPathAssignmentService.js';
import {
  getRecoveryPackTeachingFlow,
  updateRecoveryPackTeachingProgress,
} from '../services/mathpath/recoveryPackTeachingFlowService.js';

const router = express.Router();

function userId(req) {
  return String(req.user?.id || req.user?._id || '');
}

function assertCanAssign(req, { allowStudentDiagnosticSelfAssign = false } = {}) {
  const roles = resolveRoles(req.user);
  if (roles.has('parent') || roles.has('tutor') || roles.has('teacher') || roles.has('student_care') || roles.has('admin')) return;
  if (allowStudentDiagnosticSelfAssign && roles.has('student')) return;
  const err = new Error('Students can view Recovery Packs but cannot assign them.');
  err.status = 403;
  throw err;
}

async function loadAccessibleAssignment(req, id, { write = false } = {}) {
  const assignment = await getAssignmentById(id);
  if (!assignment) {
    const err = new Error('MathPath assignment not found.');
    err.status = 404;
    throw err;
  }
  await resolveStudent(req, assignment.studentId, { write });
  return assignment;
}

router.post('/from-diagnostic', protect, async (req, res) => {
  try {
    assertCanAssign(req, { allowStudentDiagnosticSelfAssign: true });
    const student = await resolveStudent(req, req.body?.studentId, { write: true });
    const assignment = await createAssignmentFromDiagnostic({
      studentId: String(student._id),
      diagnosticSessionId: req.body?.diagnosticSessionId,
      assignedByUserId: userId(req),
      assignedByRole: resolveAssignedByRole(req),
    });
    return res.status(201).json({ assignment });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not create diagnostic assignment.' });
  }
});

router.post('/from-paper-analysis', protect, async (req, res) => {
  try {
    assertCanAssign(req);
    const analysis = await PaperAnalysis.findById(req.body?.paperAnalysisId).lean();
    if (!analysis) return res.status(404).json({ error: 'Paper analysis not found.' });
    await resolveStudent(req, analysis.studentId, { write: true });
    const assignment = await createAssignmentFromPaperAnalysis({
      paperAnalysisId: req.body?.paperAnalysisId,
      assignedByUserId: userId(req),
      assignedByRole: resolveAssignedByRole(req),
    });
    return res.status(201).json({ assignment });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not create paper-analysis assignment.' });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req, req.query?.studentId);
    const assignments = await getStudentAssignments({
      studentId: String(student._id),
      status: req.query?.status,
    });
    return res.json({ studentId: String(student._id), assignments });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not load MathPath assignments.' });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const assignment = await loadAccessibleAssignment(req, req.params.id);
    return res.json({ assignment });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not load MathPath assignment.' });
  }
});

router.get('/:id/teaching-flow', protect, async (req, res) => {
  try {
    await loadAccessibleAssignment(req, req.params.id);
    const recoveryPack = await getRecoveryPackTeachingFlow({ assignmentId: req.params.id });
    return res.json({ recoveryPack });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not load Recovery Pack teaching flow.' });
  }
});

router.patch('/:id/teaching-progress', protect, async (req, res) => {
  try {
    await loadAccessibleAssignment(req, req.params.id, { write: true });
    const recoveryPack = await updateRecoveryPackTeachingProgress({
      assignmentId: req.params.id,
      stageId: req.body?.stageId,
      questionId: req.body?.questionId,
      correct: Boolean(req.body?.correct),
    });
    return res.json({ recoveryPack });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not update Recovery Pack progress.' });
  }
});

router.patch('/:id/progress', protect, async (req, res) => {
  try {
    await loadAccessibleAssignment(req, req.params.id, { write: true });
    const assignment = await updateAssignmentProgress({
      assignmentId: req.params.id,
      attempt: req.body?.attempt || null,
    });
    return res.json({ assignment });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not update assignment progress.' });
  }
});

router.post('/:id/recheck-recommendation', protect, async (req, res) => {
  try {
    await loadAccessibleAssignment(req, req.params.id);
    const recommendation = await evaluateRecheckRecommendation({ assignmentId: req.params.id });
    return res.json(recommendation);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not evaluate recheck readiness.' });
  }
});

router.post('/:id/create-recheck', protect, async (req, res) => {
  try {
    await loadAccessibleAssignment(req, req.params.id, { write: true });
    const result = await createRecheckForAssignment({
      assignmentId: req.params.id,
      requestedByUserId: userId(req),
    });
    return res.status(result.created ? 201 : 200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({
      error: err.message || 'Could not create assignment recheck.',
      ...(err.payload || {}),
    });
  }
});

export default router;
