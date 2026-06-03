import express from 'express';
import { protect } from '../middleware/auth.js';
import { recordLearningEvent } from '../services/telemetry/learningTelemetryService.js';

const router = express.Router();

router.post('/events', protect, async (req, res) => {
  try {
    const event = await recordLearningEvent({
      studentId: req.body?.studentId || req.user?.id,
      eventType: req.body?.eventType,
      domain: req.body?.domain,
      subjectId: req.body?.subjectId,
      skillCode: req.body?.skillCode,
      questionId: req.body?.questionId,
      sessionId: req.body?.sessionId,
      timestamp: req.body?.timestamp,
      metadata: req.body?.metadata || {},
    });
    if (!event) return res.status(400).json({ error: 'Invalid learning telemetry event.' });
    res.status(201).json({ ok: true, eventId: event._id });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to record telemetry event.' });
  }
});

export default router;
