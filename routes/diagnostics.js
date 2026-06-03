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

router.post('/start', protect, async (req, res) => {
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
});

router.post('/:sessionId/answer', protect, async (req, res) => {
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
});

export default router;
