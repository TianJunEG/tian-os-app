import express from 'express';
import { protect } from '../middleware/auth.js';
import MasteryRecord from '../models/MasteryRecord.js';
import Skill from '../models/Skill.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Mistake from '../models/Mistake.js';
import { resolveStudent } from '../utils/studentContext.js';
import { weakSkills } from '../utils/masteryEngine.js';

const router = express.Router();

const STATUS_LABEL = { not_started: 'needs practice', needs_review: 'needs practice', learning: 'learning', mastered: 'fluent' };

// @route GET /api/mastery?studentId=&skillIds=a,b
// @desc  Mastery records + weak skills + a recommended next skill. Used by the
//        MathPath progress, Fluency home, and Mistake-to-Mastery home.
// @access Private
router.get('/', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);

    // MathPath progress only — spelling/other-module mastery lives on its own surface.
    let recFilter = { studentId: student._id, module: 'MathPath' };
    if (req.query.skillIds) recFilter.skillId = { $in: req.query.skillIds.split(',') };
    const records = await MasteryRecord.find(recFilter).populate({ path: 'skillId', model: Skill, populate: { path: 'topicId' } });

    const shaped = records.map((r) => ({
      skillId: r.skillId?._id, skillName: r.skillId?.name || '', topicName: r.skillId?.topicId?.name || '',
      moeLevel: r.skillId?.moeLevel || '', score: r.score, attempts: r.attempts,
      status: r.status, statusLabel: STATUS_LABEL[r.status] || r.status, lastPracticedAt: r.lastPracticedAt,
    }));

    const weak = await weakSkills(student._id, { limit: 5 });
    const weakShaped = weak.map((r) => ({
      skillId: r.skillId?._id, skillName: r.skillId?.name || '', topicName: r.skillId?.topicId?.name || '',
      score: r.score, status: r.status, statusLabel: STATUS_LABEL[r.status] || r.status,
    }));

    // Recommendation: an in-progress weak skill first; otherwise the NEXT
    // un-mastered skill in curriculum order (topic order → skill order) so that
    // mastering a skill advances you instead of recommending it again. Skills you
    // have never practised have no MasteryRecord, so they must be read from the
    // catalog, not from `records`.
    let recommended = weakShaped[0] || null;
    if (!recommended) {
      const math = await Subject.findOne({ key: 'math' });
      if (math) {
        const topics = await Topic.find({ subjectId: math._id }).sort({ order: 1 });
        const topicById = new Map(topics.map((t) => [String(t._id), t]));
        const allSkills = await Skill.find({ topicId: { $in: topics.map((t) => t._id) } });
        allSkills.sort((a, b) =>
          ((topicById.get(String(a.topicId))?.order ?? 0) - (topicById.get(String(b.topicId))?.order ?? 0))
          || (a.order - b.order));
        const masteredRecs = await MasteryRecord.find({ studentId: student._id, module: 'MathPath', status: 'mastered' });
        const masteredIds = new Set(masteredRecs.map((r) => String(r.skillId)));
        const next = allSkills.find((s) => !masteredIds.has(String(s._id)));
        if (next) {
          const t = topicById.get(String(next.topicId));
          recommended = {
            skillId: next._id, skillName: next.name, topicName: t?.name || '',
            score: 0, status: 'not_started', statusLabel: STATUS_LABEL.not_started,
          };
        }
      }
    }
    const recentMistakes = await Mistake.countDocuments({ studentId: student._id, module: 'MathPath', status: { $ne: 'resolved' } });

    res.json({ studentId: student._id, records: shaped, weakSkills: weakShaped, recommended, recentMistakeCount: recentMistakes });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load mastery.' });
  }
});

// @route GET /api/mastery/map?studentId=
// @desc  The Math topic→skill map merged with this student's mastery, for the
//        MathPath home topic list and the Topic Detail page. Not-started skills
//        are included (they have no MasteryRecord yet).
// @access Private
router.get('/map', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const math = await Subject.findOne({ key: 'math' });
    if (!math) return res.json({ studentId: student._id, topics: [] });

    const topics = await Topic.find({ subjectId: math._id }).sort({ order: 1 });
    const skills = await Skill.find({ topicId: { $in: topics.map((t) => t._id) } }).sort({ order: 1 });
    const records = await MasteryRecord.find({ studentId: student._id });
    const recMap = new Map(records.map((r) => [String(r.skillId), r]));

    const topicList = topics.map((t) => {
      const ts = skills.filter((s) => String(s.topicId) === String(t._id)).map((s) => {
        const r = recMap.get(String(s._id));
        const status = r?.status || 'not_started';
        return { skillId: s._id, name: s.name, moeLevel: s.moeLevel, score: r?.score || 0, attempts: r?.attempts || 0, status, statusLabel: STATUS_LABEL[status] || status };
      });
      const attempted = ts.filter((s) => s.attempts > 0);
      return {
        topicId: t._id, name: t.name, moeLevel: t.moeLevel, skills: ts, total: ts.length,
        masteredCount: ts.filter((s) => s.status === 'mastered').length,
        avgScore: attempted.length ? Math.round(attempted.reduce((a, s) => a + s.score, 0) / attempted.length) : 0,
      };
    });

    res.json({ studentId: student._id, topics: topicList });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load topic map.' });
  }
});

export default router;
