import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getPilotAnalytics } from '../services/telemetry/learningTelemetryService.js';

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

export default router;
