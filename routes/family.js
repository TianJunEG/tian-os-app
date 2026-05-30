import express from 'express';
import { protect } from '../middleware/auth.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
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
// Adds a per-subject breakdown so ParentHome can show Math + Science + English
// side-by-side rather than collapsing everything into one cross-subject number.
// Subjects with zero records are omitted (don't render "Science 0%" for a kid
// who hasn't touched Science yet).
//
// Orphan-safe: filters records whose populated skillId is null. These occur
// when a seed script swaps a subject's skill catalog (the new Skills get fresh
// ObjectIds, old MasteryRecords keep pointing at the deleted ones) — they'd
// otherwise inflate the per-subject totals here while being invisible to
// routes/skills.js's join-based query, producing the per-screen divergence
// flagged in the post-Batch-4 verify. scripts/cleanupOrphanMastery.js
// removes them; this filter is the second line of defence.
async function masterySummary(studentId) {
  const raw = await MasteryRecord.find({ studentId }).populate({ path: 'skillId', model: Skill, populate: { path: 'topicId' } });
  const records = raw.filter((r) => r.skillId);
  const mastered = records.filter((r) => r.status === 'mastered').length;
  const weak = records.filter((r) => r.attempts > 0 && r.score < 40).sort((a, b) => a.score - b.score)[0];
  const overall = records.length ? Math.round(records.reduce((s, r) => s + r.score, 0) / records.length) : 0;

  // Per-subject buckets. Average over attempted records only — matches the
  // frontend's summariseMastery() definition so the same kid shows the same
  // numbers on ParentHome and on the per-subject screens.
  const bySubject = {};
  for (const r of records) {
    const subj = r.subject || 'Math';
    const b = bySubject[subj] || (bySubject[subj] = { subject: subj, total: 0, attempted: 0, mastered: 0, scoreSum: 0 });
    b.total += 1;
    if (r.status !== 'not_started') { b.attempted += 1; b.scoreSum += (r.score || 0); }
    if (r.status === 'mastered') b.mastered += 1;
  }
  const subjects = Object.values(bySubject).map((b) => ({
    subject: b.subject,
    total: b.total,
    attempted: b.attempted,
    mastered: b.mastered,
    overall: b.attempted ? Math.round(b.scoreSum / b.attempted) : 0,
  })).sort((a, b) => b.overall - a.overall);

  return {
    overallMastery: overall, skillsSeen: records.length, masteredCount: mastered,
    weakestTopic: weak?.skillId?.topicId?.name || null, weakestSkill: weak?.skillId?.name || null,
    subjects,
  };
}

// @route GET /api/family/children
// @desc  Students this parent is a guardian of (parent-workspace scope only).
// @access Private
router.get('/children', protect, async (req, res) => {
  try {
    let links = await StudentGuardian.find({ guardianUserId: req.user.id });

    // Pilot hotfix: if guardian links are missing/stale, self-heal from
    // parent-owned student records and linked student user accounts.
    if (!links.length) {
      const linkedUsers = await User.find({ linkedTo: req.user.id, role: 'student' }).select('_id');
      const linkedUserIds = linkedUsers.map((u) => u._id);
      const fallbackStudents = await Student.find({
        $or: [
          { createdByUserId: req.user.id },
          { userId: { $in: linkedUserIds } },
        ],
      }).select('_id workspaceId');

      if (fallbackStudents.length) {
        await Promise.all(fallbackStudents.map(async (student) => {
          try {
            await StudentGuardian.updateOne(
              { studentId: student._id, guardianUserId: req.user.id },
              {
                $setOnInsert: {
                  studentId: student._id,
                  guardianUserId: req.user.id,
                  workspaceId: student.workspaceId,
                  relation: 'parent',
                },
              },
              { upsert: true }
            );
          } catch (_) {
            // Ignore duplicate-race/noise: subsequent query is source of truth.
          }
        }));
      }

      links = await StudentGuardian.find({ guardianUserId: req.user.id });
    }

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
