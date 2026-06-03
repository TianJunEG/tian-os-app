import express from 'express';
import { protect } from '../middleware/auth.js';
import { resolveStudent } from '../utils/studentContext.js';
import { getStudentAnalytics } from '../services/telemetry/learningTelemetryService.js';

const router = express.Router();

router.get('/analytics', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const analytics = await getStudentAnalytics({
      studentId: String(student._id),
      days: req.query.days || 30,
    });
    res.json(analytics);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load student analytics.' });
  }
});

export default router;
