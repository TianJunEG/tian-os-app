// Unified MathPath parent dashboard endpoints.
//
// Before this, the parent dashboard had no backend route — the React page
// hand-assembled mastery/mistakes/fluency/retention calls and re-derived the
// summary client-side, hard-locked to Fractions. These endpoints return a
// single domain-aware payload so the page renders any registered domain.
//
// Mounted at /api/parents (alongside routes/parents.js). Access is gated by
// resolveStudent — the same guardian/tutor/workspace check every other
// student-scoped route uses — so a parent can only read their own child.

import express from 'express';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { resolveStudent } from '../utils/studentContext.js';
import { hasDomain } from '../services/domains/domainRegistry.js';
import {
  buildParentMathPathDashboard,
  listChildMathPathDomains,
} from '../services/mathpath/parentDashboardAggregator.js';

const router = express.Router();

// @route   GET /api/parents/:studentId/mathpath/dashboard?subjectId=math&domainId=fractions
// @desc    Single combined parent dashboard payload for one child + domain:
//          domain meta, mastery progress, weak skills, recent mistakes, fluency,
//          retention, recommended next practice, and the weekly action plan.
// @access  Private (guardian/tutor/workspace member of the student)
router.get('/:studentId/mathpath/dashboard', protect, asyncHandler(async (req, res) => {
  try {
    const subjectId = String(req.query.subjectId || 'math');
    const domainId = String(req.query.domainId || 'fractions');

    // Access check first — never touch domain data for an unrelated child.
    const student = await resolveStudent(req, req.params.studentId);

    if (!hasDomain({ subjectId, domainId })) {
      return res.status(404).json({ error: `Domain is not registered: ${subjectId}/${domainId}`, code: 'DOMAIN_NOT_FOUND' });
    }

    const payload = await buildParentMathPathDashboard({ student, subjectId, domainId });
    res.json(payload);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load parent dashboard.', ...(err.code ? { code: err.code } : {}) });
  }
}));

// @route   GET /api/parents/:studentId/mathpath/domains?subjectId=math
// @desc    The registered domains this child actually has activity in, so the
//          UI renders only relevant domain chips.
// @access  Private (guardian/tutor/workspace member of the student)
router.get('/:studentId/mathpath/domains', protect, asyncHandler(async (req, res) => {
  try {
    const subjectId = String(req.query.subjectId || 'math');
    const student = await resolveStudent(req, req.params.studentId);
    const domains = await listChildMathPathDomains({ student, subjectId });
    res.json({ studentId: String(student._id), subjectId, domains });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load domains.' });
  }
}));

export default router;
