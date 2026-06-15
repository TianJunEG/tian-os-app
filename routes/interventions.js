import express from 'express';
import { protect } from '../middleware/auth.js';
import { resolveStudent } from '../utils/studentContext.js';
import {
  auditDecisionLogic,
  getInterventionEffectiveness,
  getInterventionIntelligence,
} from '../services/intervention/interventionIntelligenceEngine.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

function roleSet(user = {}) {
  return new Set([user.role, ...(Array.isArray(user.roles) ? user.roles : [])].filter(Boolean));
}

function assertAdultFeedAccess(req) {
  const roles = roleSet(req.user);
  if (['parent', 'tutor', 'teacher', 'student_care', 'admin'].some((role) => roles.has(role))) return;
  const err = new Error('Adult intervention recommendation access required.');
  err.status = 403;
  throw err;
}

router.get('/audit', protect, asyncHandler(async (req, res) => {
  try {
    assertAdultFeedAccess(req);
    return res.json({ audit: auditDecisionLogic() });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not load intervention audit.' });
  }
}));

router.get('/feed', protect, asyncHandler(async (req, res) => {
  try {
    assertAdultFeedAccess(req);
    const {
      subjectId = 'math',
      domainId = 'fractions',
      studentId = '',
      persist = '',
    } = req.query || {};
    const student = await resolveStudent(req, studentId);
    const intelligence = await getInterventionIntelligence({
      studentId: String(student._id),
      subjectId,
      domainId,
      persist: persist === '1' || persist === 'true',
    });
    return res.json({ studentId: String(student._id), subjectId, domainId, ...intelligence });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not load intervention recommendations.' });
  }
}));

router.get('/effectiveness', protect, asyncHandler(async (req, res) => {
  try {
    assertAdultFeedAccess(req);
    const subjectId = req.query?.subjectId || 'math';
    const domainId = req.query?.domainId || 'fractions';
    const effectiveness = await getInterventionEffectiveness({ subjectId, domainId });
    return res.json({ subjectId, domainId, effectiveness });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not load intervention effectiveness.' });
  }
}));

export default router;
