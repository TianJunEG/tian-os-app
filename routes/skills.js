import express from 'express';
import { protect } from '../middleware/auth.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Skill from '../models/Skill.js';
import MasteryRecord from '../models/MasteryRecord.js';
import { resolveStudent } from '../utils/studentContext.js';
import { deriveMastery, fluencyLabel } from '../utils/masteryEngine.js';

const router = express.Router();
const labelFor = (status, fluency) => ({
  not_started: 'needs practice', needs_review: 'needs practice', learning: 'learning',
  mastered: fluency ? 'fluent' : 'mastered',
}[status] || status);
// @route GET /api/skills?studentId=&subject=math|science&group=fluency
// @desc  Skill catalog (for a subject) merged with the student's mastery status.
//        subject defaults to 'math'. group=fluency limits to the speed-and-
//        accuracy ("timed") skills across all domains (MathPath Fluency feature).
//        Science reuses this for its topic list.
// @access Private
router.get('/', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const fluency = req.query.group === 'fluency';
    const subjectKey = req.query.subject || 'math';
    const subject = await Subject.findOne({ key: subjectKey });
    if (!subject) return res.json({ studentId: student._id, skills: [] });

    const topics = await Topic.find({ subjectId: subject._id }).sort({ order: 1 });
    const topicById = Object.fromEntries(topics.map((t) => [String(t._id), t]));
    // Fluency = the "timed" (speed + accuracy) skills, flagged by the domain spec.
    const skillFilter = { topicId: { $in: topics.map((t) => t._id) } };
    if (fluency) skillFilter['metadata.fluencyType'] = 'timed';
    const skills = await Skill.find(skillFilter).sort({ order: 1 });

    const records = await MasteryRecord.find({ studentId: student._id, skillId: { $in: skills.map((s) => s._id) } });
    const recBySkill = Object.fromEntries(records.map((r) => [String(r.skillId), r]));

    const out = skills.map((s) => {
      const r = recBySkill[String(s._id)];
      const status = r?.status || 'not_started';
      return {
        skillId: s._id, name: s.name, moeLevel: s.moeLevel,
        topicId: s.topicId, topicName: topicById[String(s.topicId)]?.name || '',
        score: r?.score || 0, status, statusLabel: labelFor(status, fluency),
        masteryState: deriveMastery(r || {}), fluency: fluencyLabel(r?.fluencyStatus),
        fluencyStatus: r?.fluencyStatus || 'unknown', streak: r?.streak || 0, bestStreak: r?.bestStreak || 0,
        targetSeconds: s.metadata?.fluency?.targetSeconds ?? null,
      };
    });
    res.json({ studentId: student._id, subject: subjectKey, skills: out });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load skills.' });
  }
});

export default router;
