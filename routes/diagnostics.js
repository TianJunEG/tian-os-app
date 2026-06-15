import express from 'express';
import { protect } from '../middleware/auth.js';
import { resolveStudent } from '../utils/studentContext.js';
import {
  answerAdaptiveDiagnostic,
  startAdaptiveDiagnostic,
} from '../services/diagnostics/diagnosticRuntime.js';
import {
  getDiagnosticDomain,
  listDiagnosticDomains,
} from '../services/diagnostics/diagnosticDomainRegistry.js';
import {
  getDiagnosticGrowth,
  getDiagnosticHistory,
} from '../services/diagnostics/diagnosticGrowthService.js';
import { getStudentRecheckSummary } from '../services/mathpath/studentRecheckSummaryService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

function sendDiagnosticError(res, err, fallback = 'Diagnostic request failed.') {
  const status = err.status || 500;
  return res.status(status).json({
    error: err.message || fallback,
    code: err.code,
    ...(err.payload || {}),
  });
}

router.get('/domains', protect, (req, res) => {
  res.json({ domains: listDiagnosticDomains() });
});

router.get('/history', protect, asyncHandler(async (req, res) => {
  try {
    const {
      subjectId = 'math',
      domainId = 'fractions',
      studentId = '',
    } = req.query || {};
    getDiagnosticDomain({ subjectId, domainId });
    const student = await resolveStudent(req, studentId);
    const history = await getDiagnosticHistory({
      studentId: String(student._id),
      subjectId,
      domainId,
    });
    return res.json({ studentId: String(student._id), subjectId, domainId, history });
  } catch (err) {
    return sendDiagnosticError(res, err, 'Failed to load diagnostic history.');
  }
}));

router.get('/growth', protect, asyncHandler(async (req, res) => {
  try {
    const {
      subjectId = 'math',
      domainId = 'fractions',
      studentId = '',
    } = req.query || {};
    getDiagnosticDomain({ subjectId, domainId });
    const student = await resolveStudent(req, studentId);
    const growth = await getDiagnosticGrowth({
      studentId: String(student._id),
      subjectId,
      domainId,
      assignmentId: req.query.assignmentId,
    });
    return res.json({ studentId: String(student._id), subjectId, domainId, ...growth });
  } catch (err) {
    return sendDiagnosticError(res, err, 'Failed to load diagnostic growth.');
  }
}));

router.get('/recheck-summary/:sessionId', protect, asyncHandler(async (req, res) => {
  try {
    const {
      subjectId = 'math',
      domainId = 'fractions',
      studentId = '',
      assignmentId = '',
    } = req.query || {};
    getDiagnosticDomain({ subjectId, domainId });
    const student = await resolveStudent(req, studentId);
    const summary = await getStudentRecheckSummary({
      studentId: String(student._id),
      diagnosticSessionId: req.params.sessionId,
      assignmentId,
      subjectId,
      domainId,
    });
    return res.json({ studentId: String(student._id), subjectId, domainId, diagnosticSessionId: req.params.sessionId, summary });
  } catch (err) {
    return sendDiagnosticError(res, err, 'Failed to load recheck summary.');
  }
}));

router.post('/start', protect, asyncHandler(async (req, res) => {
  try {
    const {
      subjectId = 'math',
      domainId = 'fractions',
      startSkillId = '',
      requestedMode,
      mode,
      studentLevel,
      diagnosticPurpose,
    } = req.body || {};
    getDiagnosticDomain({ subjectId, domainId });
    const student = await resolveStudent(req);
    const payload = await startAdaptiveDiagnostic({
      student,
      userId: req.user.id,
      subjectId,
      domainId,
      startSkillId,
      requestedMode: requestedMode || mode,
      studentLevel,
      diagnosticPurpose,
    });
    return res.json(payload);
  } catch (err) {
    return sendDiagnosticError(res, err, 'Failed to start diagnostic.');
  }
}));

router.post('/:sessionId/answer', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const payload = await answerAdaptiveDiagnostic({
      student,
      sessionId: req.params.sessionId,
      body: req.body || {},
    });
    return res.json(payload);
  } catch (err) {
    return sendDiagnosticError(res, err, 'Failed to process diagnostic answer.');
  }
}));

export default router;
