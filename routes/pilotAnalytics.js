import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getPilotAnalytics } from '../services/telemetry/learningTelemetryService.js';
import {
  getPilotInterventionMetrics,
  getPilotInterventionSummary,
} from '../services/mathpath/pilotInterventionMetricsService.js';
import { getQuestionQualityAudit } from '../services/mathpath/questionQualityAuditService.js';
import { getQuestionVisualQualityAudit } from '../services/mathpath/visualQualityAuditService.js';
import { getDiagnosticValidationReport } from '../services/mathpath/diagnosticValidationEngine.js';
import { getRecoveryPackQualityReport } from '../services/mathpath/recoveryPackQualityService.js';
import { getInterventionEffectivenessReport } from '../services/mathpath/interventionEffectivenessService.js';
import { getRecoveryPackAssetReport } from '../services/mathpath/recoveryPackAssetService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
const adminOnly = [protect, authorize('admin')];

router.get('/pilot-analytics', adminOnly, asyncHandler(async (req, res) => {
  try {
    const analytics = await getPilotAnalytics({
      days: req.query.days || 30,
      domain: req.query.domain || '',
    });
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load pilot analytics.' });
  }
}));

router.get('/pilot/intervention-metrics', adminOnly, asyncHandler(async (req, res) => {
  try {
    const metrics = await getPilotInterventionMetrics({
      from: req.query.from,
      to: req.query.to,
      cohortId: req.query.cohortId,
      subjectId: req.query.subjectId || 'math',
      domainId: req.query.domainId || 'fractions',
    });
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load intervention metrics.' });
  }
}));

router.get('/pilot/intervention-summary', adminOnly, asyncHandler(async (req, res) => {
  try {
    const summary = await getPilotInterventionSummary({
      from: req.query.from,
      to: req.query.to,
      cohortId: req.query.cohortId,
      subjectId: req.query.subjectId || 'math',
      domainId: req.query.domainId || 'fractions',
    });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load intervention summary.' });
  }
}));

router.get('/question-quality', adminOnly, asyncHandler(async (req, res) => {
  try {
    const audit = await getQuestionQualityAudit({
      domainId: req.query.domainId || 'fractions',
      limit: req.query.limit || 500,
    });
    res.json(audit);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load question quality audit.' });
  }
}));

router.get('/question-visual-quality', adminOnly, asyncHandler(async (req, res) => {
  try {
    const audit = await getQuestionVisualQualityAudit({
      domainId: req.query.domainId || 'fractions',
      limit: req.query.limit || 500,
    });
    res.json(audit);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load question visual quality audit.' });
  }
}));

router.get('/diagnostic-validation', adminOnly, asyncHandler(async (req, res) => {
  try {
    const report = await getDiagnosticValidationReport({
      studentId: req.query.studentId,
      subjectId: req.query.subjectId || 'math',
      domainId: req.query.domainId || 'fractions',
      limit: req.query.limit || 50,
    });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load diagnostic validation report.' });
  }
}));

router.get('/remediation-quality', adminOnly, asyncHandler(async (req, res) => {
  try {
    const [quality, effectiveness] = await Promise.all([
      getRecoveryPackQualityReport({
        studentId: req.query.studentId,
        domainId: req.query.domainId || 'fractions',
        limit: req.query.limit || 100,
      }),
      getInterventionEffectivenessReport({
        studentId: req.query.studentId,
        domainId: req.query.domainId || 'fractions',
        limit: req.query.limit || 200,
      }),
    ]);
    res.json({ ...quality, effectiveness });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load remediation quality report.' });
  }
}));

router.get('/recovery-pack-assets', adminOnly, asyncHandler(async (req, res) => {
  try {
    const report = await getRecoveryPackAssetReport({
      domainId: req.query.domainId || 'fractions',
      limit: req.query.limit || 100,
    });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load Recovery Pack asset report.' });
  }
}));

export default router;
