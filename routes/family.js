import express from 'express';
import { protect } from '../middleware/auth.js';
import Student from '../models/Student.js';
import StudentGuardian from '../models/StudentGuardian.js';
import MasteryRecord from '../models/MasteryRecord.js';
import Skill from '../models/Skill.js';
import Mistake from '../models/Mistake.js';
import Assignment from '../models/Assignment.js';
import { resolveStudent } from '../utils/studentContext.js';
import { buildRecommendations } from '../utils/parentRecommendations.js';

const router = express.Router();

// Light mastery summary for one student (used in the children list + home).
async function masterySummary(studentId) {
  const records = await MasteryRecord.find({ studentId }).populate({ path: 'skillId', model: Skill, populate: { path: 'topicId' } });
  const mastered = records.filter((r) => r.status === 'mastered').length;
  const weak = records.filter((r) => r.attempts > 0 && r.score < 40).sort((a, b) => a.score - b.score)[0];
  const overall = records.length ? Math.round(records.reduce((s, r) => s + r.score, 0) / records.length) : 0;
  return {
    overallMastery: overall, skillsSeen: records.length, masteredCount: mastered,
    weakestTopic: weak?.skillId?.topicId?.name || null, weakestSkill: weak?.skillId?.name || null,
  };
}

// @route GET /api/family/children
// @desc  Students this parent is a guardian of (parent-workspace scope only).
// @access Private
router.get('/children', protect, async (req, res) => {
  try {
    const links = await StudentGuardian.find({ guardianUserId: req.user.id });
    const students = await Student.find({ _id: { $in: links.map((l) => l.studentId) } });
    const children = await Promise.all(students.map(async (s) => ({
      studentId: s._id, name: s.name, level: s.level,
      mainFocus: s.profile?.mainFocus || 'MathPath', ...(await masterySummary(s._id)),
    })));
    res.json({ children });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load children.' });
  }
});

// @route GET /api/family/children/:studentId/recommendations
// @desc  Rule-based parent actions for one child (deterministic).
// @access Private (guardian of the child)
router.get('/children/:studentId/recommendations', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req, req.params.studentId);

    const recordsRaw = await MasteryRecord.find({ studentId: student._id })
      .populate({ path: 'skillId', model: Skill, populate: { path: 'topicId' } });
    const records = recordsRaw.map((r) => ({
      skillId: r.skillId?._id, skillName: r.skillId?.name || '', topicName: r.skillId?.topicId?.name || '',
      score: r.score, status: r.status, attempts: r.attempts,
    }));
    const lastPracticedAt = recordsRaw
      .map((r) => r.lastPracticedAt).filter(Boolean).sort((a, b) => b - a)[0] || null;

    const mistakes = await Mistake.find({ studentId: student._id, status: { $ne: 'resolved' } })
      .populate({ path: 'skillId', model: Skill });
    const bySkill = {};
    for (const m of mistakes) {
      const k = String(m.skillId?._id);
      if (!bySkill[k]) bySkill[k] = { skillId: m.skillId?._id, skillName: m.skillId?.name || '', count: 0 };
      bySkill[k].count++;
    }

    const assignments = await Assignment.find({ studentId: student._id });

    const recommendations = buildRecommendations({
      records, mistakesBySkill: Object.values(bySkill),
      assignments: assignments.map((a) => ({ status: a.status, dueDate: a.dueDate })),
      lastPracticedAt,
    });
    res.json({ studentId: student._id, recommendations });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load recommendations.' });
  }
});

export default router;
