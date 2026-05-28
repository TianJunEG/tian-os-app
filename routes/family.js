import express from 'express';
import { protect } from '../middleware/auth.js';
import Student from '../models/Student.js';
import StudentGuardian from '../models/StudentGuardian.js';
import MasteryRecord from '../models/MasteryRecord.js';
import Skill from '../models/Skill.js';
import SpellingList from '../models/SpellingList.js';
import Mistake from '../models/Mistake.js';
import Assignment from '../models/Assignment.js';
import { resolveStudent } from '../utils/studentContext.js';
import { buildRecommendations } from '../utils/parentRecommendations.js';

const router = express.Router();

// Modules whose weak skills become an "assign practice" action — the parent can
// act on these from AssignPractice (MathPath = a skill, Spelling = a word list).
const ASSIGN_MODULES = ['MathPath', 'Spelling Practice'];
// Modules surfaced for mistake review. Science is included now that there's a
// parent Science surface to review on (it has no assign flow, so it only
// appears as a review action, not assign).
const REVIEW_MODULES = [...ASSIGN_MODULES, 'Science Adaptive Revision'];

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

    // Mastery (weak skills + celebrate) comes from the assignable modules; mistakes
    // (review) also include Science. Skill names resolve per module: MathPath and
    // Science skillIds reference a Skill, a Spelling Practice one references a
    // SpellingList — populating against the wrong collection would yield
    // blank-named, mis-routed actions.
    const masteryRaw = await MasteryRecord.find({ studentId: student._id, module: { $in: ASSIGN_MODULES } });
    const mistakesRaw = await Mistake.find({ studentId: student._id, module: { $in: REVIEW_MODULES }, status: { $ne: 'resolved' } });

    const all = [...masteryRaw, ...mistakesRaw];
    const skillBackedIds = all.filter((x) => x.module !== 'Spelling Practice').map((x) => x.skillId);
    const listIds = all.filter((x) => x.module === 'Spelling Practice').map((x) => x.skillId);
    const skills = await Skill.find({ _id: { $in: skillBackedIds } }).populate('topicId');
    const lists = await SpellingList.find({ _id: { $in: listIds } });
    const skillById = new Map(skills.map((s) => [String(s._id), s]));
    const listById = new Map(lists.map((l) => [String(l._id), l]));

    const nameOf = (x) => x.module === 'Spelling Practice'
      ? (listById.get(String(x.skillId))?.title || '')
      : (skillById.get(String(x.skillId))?.name || '');
    const topicOf = (x) => x.module === 'MathPath' ? (skillById.get(String(x.skillId))?.topicId?.name || '') : '';

    const records = masteryRaw.map((r) => ({
      skillId: r.skillId, skillName: nameOf(r), topicName: topicOf(r), module: r.module,
      score: r.score, status: r.status, attempts: r.attempts,
    }));
    const lastPracticedAt = masteryRaw.map((r) => r.lastPracticedAt).filter(Boolean).sort((a, b) => b - a)[0] || null;

    const bySkill = {};
    for (const m of mistakesRaw) {
      const k = String(m.skillId);
      if (!bySkill[k]) bySkill[k] = { skillId: m.skillId, skillName: nameOf(m), module: m.module, count: 0 };
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
