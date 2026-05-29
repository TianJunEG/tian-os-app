import express from 'express';
import { protect } from '../middleware/auth.js';
import Mistake from '../models/Mistake.js';
import Skill from '../models/Skill.js';
import { resolveStudent } from '../utils/studentContext.js';

const router = express.Router();

const MISCONCEPTION_LABELS = {
  'frac/add-without-common': 'Added numerators and denominators directly',
  'frac/add-denominators': 'Added numerators and denominators directly',
};

// @route GET /api/mistakes?studentId=&status=&skillId=
// @desc  Recent mistakes for a student (grouped by skill), for Mistake-to-Mastery.
// @access Private
router.get('/', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const filter = { studentId: student._id };
    if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
    else if (!req.query.status) filter.status = { $ne: 'resolved' };
    if (req.query.skillId) filter.skillId = req.query.skillId;
    // Default to MathPath mistakes; other modules (e.g. Spelling) pass ?module=.
    filter.module = req.query.module || 'MathPath';

    const mistakes = await Mistake.find(filter)
      .populate({ path: 'skillId', model: Skill, populate: { path: 'topicId' } })
      .sort({ occurredAt: -1 }).limit(100);

    const shaped = mistakes.map((m) => ({
      id: m._id, skillId: m.skillId?._id, skillName: m.skillId?.name || '',
      topicName: m.skillId?.topicId?.name || '', module: m.module,
      questionStem: m.questionStem, studentAnswer: m.studentAnswer, correctAnswer: m.correctAnswer,
      workedSolution: m.workedSolution, mistakeType: m.mistakeType, misconceptionTag: m.misconceptionTag,
      mistakeTypeLabel: MISCONCEPTION_LABELS[m.misconceptionTag] || '',
      status: m.status, reviewed: m.reviewed, reviewedAt: m.reviewedAt, occurredAt: m.occurredAt,
    }));

    // Group by skill for the home/weak-skills view.
    const bySkill = {};
    for (const m of shaped) {
      const key = String(m.skillId);
      if (!bySkill[key]) bySkill[key] = { skillId: m.skillId, skillName: m.skillName, topicName: m.topicName, count: 0 };
      bySkill[key].count++;
    }

    res.json({ studentId: student._id, mistakes: shaped, weakSkills: Object.values(bySkill).sort((a, b) => b.count - a.count) });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load mistakes.' });
  }
});

// @route GET /api/mistakes/:id
// @desc  One mistake (detail page).
// @access Private
router.get('/:id', protect, async (req, res) => {
  try {
    const m = await Mistake.findById(req.params.id).populate({ path: 'skillId', model: Skill, populate: { path: 'topicId' } });
    if (!m) return res.status(404).json({ error: 'Mistake not found.' });
    await resolveStudent(req, m.studentId); // access check
    res.json({
      id: m._id, skillId: m.skillId?._id, skillName: m.skillId?.name || '', topicName: m.skillId?.topicId?.name || '',
      questionStem: m.questionStem, studentAnswer: m.studentAnswer, correctAnswer: m.correctAnswer,
      workedSolution: m.workedSolution, mistakeType: m.mistakeType, misconceptionTag: m.misconceptionTag,
      mistakeTypeLabel: MISCONCEPTION_LABELS[m.misconceptionTag] || '',
      status: m.status, reviewed: m.reviewed, reviewedAt: m.reviewedAt,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load mistake.' });
  }
});

// @route POST /api/mistakes/:id/review
// @desc  Mark a mistake reviewed. body: { source: student|parent|tutor|teacher, mistakeType? }
// @access Private
router.post('/:id/review', protect, async (req, res) => {
  try {
    const m = await Mistake.findById(req.params.id);
    if (!m) return res.status(404).json({ error: 'Mistake not found.' });
    await resolveStudent(req, m.studentId); // access check

    m.reviewed = true;
    m.reviewedAt = new Date();
    m.reviewedByUserId = req.user.id;
    m.reviewSource = req.body.source || 'student';
    if (m.status === 'open') m.status = 'reviewed';
    if (req.body.mistakeType) m.mistakeType = req.body.mistakeType;
    await m.save();
    res.json({ id: m._id, status: m.status, reviewed: true, reviewedAt: m.reviewedAt });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to mark reviewed.' });
  }
});

export default router;
