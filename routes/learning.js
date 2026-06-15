// routes/learning.js — the unified learning profile API.
// One normalised profile per learner, aggregated across every learning source (Spelling +
// the math apps via LearningResult; Science the same way). Parents see each child's profile;
// the account owner sees their own. Records are scoped by an optional `child` id.

import express from 'express';
import SpellingAttempt from '../models/SpellingAttempt.js';
import LearningResult from '../models/LearningResult.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import StudentGuardian from '../models/StudentGuardian.js';
import { computeWordStats } from '../utils/spellingStats.js';
import { spellingContribution, resultsToContributions, buildProfile } from '../utils/learningProfile.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
router.use(protect);

// Spelling stats for a learner (optionally a specific child of the account).
async function spellingStatsFor(userId, childId) {
  const q = { user: userId };
  if (childId) q.child = childId;
  const attempts = await SpellingAttempt.find(q).sort({ createdAt: -1 }).limit(2000);
  const all = [...computeWordStats(attempts).values()];
  return {
    total: attempts.length,
    correct: attempts.filter((a) => a.correct).length,
    accuracy: attempts.length ? Math.round((attempts.filter((a) => a.correct).length / attempts.length) * 100) : 0,
    uniqueWords: all.length,
    mastery: {
      mastered: all.filter((s) => s.mastered).length,
      learning: all.filter((s) => !s.mastered && !s.weak).length,
      weak: all.filter((s) => s.weak).length,
    },
    weakWords: all.filter((s) => s.weak).map((s) => ({ word: s.word, misses: s.misses })),
  };
}

// Build ONE unified profile for a learner = (account user, optional child).
async function buildLearnerProfile(userId, childId) {
  const contributions = [];
  const spelling = await spellingStatsFor(userId, childId);
  if (spelling.total) contributions.push(spellingContribution(spelling, 'eng'));
  const q = { user: userId };
  if (childId) q.child = childId;
  const results = await LearningResult.find(q).sort({ createdAt: -1 }).limit(2000);
  contributions.push(...resultsToContributions(results));
  return buildProfile(childId || userId, contributions);
}

// Any learning app posts a normalised result here (Math Heuristics, MathPath, Science…).
router.post('/result', asyncHandler(async (req, res) => {
  try {
    const { source, subject, topic = '', accuracy = 0, mastered = false, minutes = 0, child = null } = req.body || {};
    if (!source || !subject) return res.status(400).json({ error: 'source and subject are required' });
    const doc = await LearningResult.create({
      user: req.user.id, child: child || null, source, subject, topic,
      accuracy: Math.max(0, Math.min(100, Math.round(accuracy))), mastered: !!mastered, minutes: Math.round(minutes),
    });
    res.status(201).json({ success: true, id: doc._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

// The logged-in account's own profile.
router.get('/profile', asyncHandler(async (req, res) => {
  try {
    res.json({ success: true, profile: await buildLearnerProfile(req.user.id, null) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

// A parent's children, each with a headline readiness for the overview.
router.get('/children', asyncHandler(async (req, res) => {
  try {
    const links = await StudentGuardian.find({ guardianUserId: req.user.id });
    const students = links.length
      ? await Student.find({ _id: { $in: links.map((link) => link.studentId) } })
      : [];
    const children = [];
    for (const student of students) {
      const p = await buildLearnerProfile(req.user.id, student._id);
      children.push({
        id: student._id,
        studentId: student._id,
        name: student.name,
        level: student.level,
        overall: p.overall,
        band: p.band,
        subjects: p.subjects.length,
      });
    }
    // Compatibility only: this does not grant access to a child record. New
    // parent-child access must be represented by StudentGuardian.
    const u = !children.length ? await User.findById(req.user.id) : null;
    if (!children.length && u?.parentProfile?.studentName) {
      const p = await buildLearnerProfile(req.user.id, null);
      children.push({ id: 'self', name: u.parentProfile.studentName, level: u.parentProfile.gradeLevel || '', overall: p.overall, band: p.band, subjects: p.subjects.length });
    }
    res.json({ success: true, children });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

// Add a child to the parent's account.
router.post('/children', asyncHandler(async (req, res) => {
  try {
    const { name, level = '' } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name is required' });
    const u = await User.findById(req.user.id);
    u.children.push({ name, level });
    await u.save();
    res.status(201).json({ success: true, children: u.children });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

// A specific child's unified profile (parent-only; owner-scoped).
router.get('/children/:childId/profile', asyncHandler(async (req, res) => {
  try {
    const { childId } = req.params;
    if (childId === 'self') return res.json({ success: true, child: { id: 'self' }, profile: await buildLearnerProfile(req.user.id, null) });
    const link = await StudentGuardian.findOne({ studentId: childId, guardianUserId: req.user.id });
    if (!link) return res.status(404).json({ error: 'Child not found for this account' });
    const student = await Student.findById(childId);
    if (!student) return res.status(404).json({ error: 'Child not found for this account' });
    res.json({
      success: true,
      child: { id: student._id, studentId: student._id, name: student.name, level: student.level },
      profile: await buildLearnerProfile(req.user.id, student._id),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

export default router;
