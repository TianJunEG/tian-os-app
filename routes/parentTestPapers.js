// Parent-facing test-paper results for one child.
//
// Test papers are self-serve (a student sits any published paper), so — like the
// teacher view — this is read-only visibility of a child's COMPLETED sittings and
// a full per-question review of any one of them. Mounted at /api/parents alongside
// routes/parents.js. Access is gated by resolveStudent (the same guardian/tutor/
// workspace check every student-scoped route uses), so a parent only ever reads
// their own child. Reuses projectMarkedSitting — the shared source of truth the
// student submit handler and the teacher drill-down also use.

import express from 'express';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { resolveStudent } from '../utils/studentContext.js';
import { projectMarkedSitting } from '../utils/testPaperSitting.js';
import TestPaperSession from '../models/TestPaperSession.js';

const router = express.Router();

// @route   GET /api/parents/:studentId/test-papers
// @desc    A child's completed test-paper sittings (newest first).
// @access  Private (guardian/tutor/workspace member of the student)
router.get('/:studentId/test-papers', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req, req.params.studentId);
    const sittings = await TestPaperSession.find({ studentId: student._id, status: 'completed' })
      .select('sessionId paperCode paperTitle level category topic durationMinutes summary completedAt')
      .sort({ completedAt: -1 })
      .lean();
    res.json({
      studentId: String(student._id),
      sittings: sittings.map((s) => ({
        sessionId: s.sessionId,
        paperCode: s.paperCode,
        paperTitle: s.paperTitle,
        level: s.level,
        category: s.category || 'mock',
        topic: s.topic || '',
        durationMinutes: s.durationMinutes,
        summary: s.summary,
        completedAt: s.completedAt,
      })),
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load test papers.' });
  }
}));

// @route   GET /api/parents/:studentId/test-papers/sittings/:sessionId
// @desc    Full per-question review of one completed sitting (what the child saw).
// @access  Private (guardian/tutor/workspace member of the student)
router.get('/:studentId/test-papers/sittings/:sessionId', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req, req.params.studentId);
    const session = await TestPaperSession.findOne({
      sessionId: req.params.sessionId, studentId: student._id, status: 'completed',
    }).lean();
    if (!session) return res.status(404).json({ error: 'Sitting not found.' });
    res.json({
      sessionId: session.sessionId,
      paperCode: session.paperCode,
      title: session.paperTitle,
      level: session.level,
      category: session.category || 'mock',
      topic: session.topic || '',
      summary: session.summary,
      completedAt: session.completedAt,
      questions: projectMarkedSitting(session.questions, session.answers),
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load the sitting.' });
  }
}));

export default router;
