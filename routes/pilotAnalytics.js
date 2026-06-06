import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getPilotAnalytics } from '../services/telemetry/learningTelemetryService.js';
import {
  getPilotInterventionMetrics,
  getPilotInterventionSummary,
} from '../services/mathpath/pilotInterventionMetricsService.js';

const router = express.Router();
const adminOnly = [protect, authorize('admin')];

router.get('/pilot-analytics', adminOnly, async (req, res) => {
  try {
    const analytics = await getPilotAnalytics({
      days: req.query.days || 30,
      domain: req.query.domain || '',
    });
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load pilot analytics.' });
  }
});

router.get('/pilot/intervention-metrics', adminOnly, async (req, res) => {
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
});

router.get('/pilot/intervention-summary', adminOnly, async (req, res) => {
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
});

export default router;
