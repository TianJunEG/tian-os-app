import express from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import { resolveStudent } from '../utils/studentContext.js';
import {
  getStudentAchievements,
  getStudentLearningTimeline,
  getStudentPersonalBests,
  getStudentProfileSummary,
} from '../services/studentProfile/studentProfileService.js';

const router = express.Router();

async function withStudent(req, res, handler) {
  try {
    const student = await resolveStudent(req);
    const payload = await handler(student);
    res.json(payload);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Could not load student profile.' });
  }
}

router.get('/', protect, async (req, res) => {
  await withStudent(req, res, async (student) => {
    const [summary, achievements, timeline] = await Promise.all([
      getStudentProfileSummary(student),
      getStudentAchievements(student),
      getStudentLearningTimeline(student),
    ]);
    return { summary, achievements, timeline };
  });
});

router.get('/summary', protect, async (req, res) => {
  await withStudent(req, res, (student) => getStudentProfileSummary(student));
});

router.get('/achievements', protect, async (req, res) => {
  await withStudent(req, res, (student) => getStudentAchievements(student));
});

router.get('/timeline', protect, async (req, res) => {
  await withStudent(req, res, (student) => getStudentLearningTimeline(student));
});

router.get('/personal-bests', protect, async (req, res) => {
  await withStudent(req, res, (student) => getStudentPersonalBests(student));
});

router.patch('/name', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const newName = String(req.body.name || '').trim();
    if (!newName || newName.length > 100) {
      return res.status(400).json({ error: 'Name must be between 1 and 100 characters.' });
    }
    student.name = newName;
    await student.save();
    if (student.userId) {
      await User.findByIdAndUpdate(student.userId, { name: newName });
    }
    res.json({ success: true, name: newName });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to update name.' });
  }
});

export default router;
