import express from 'express';
import { protect } from '../middleware/auth.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Skill from '../models/Skill.js';
import Question from '../models/Question.js';
import MasteryRecord from '../models/MasteryRecord.js';
import { resolveStudent } from '../utils/studentContext.js';
import { deriveMastery, fluencyLabel } from '../utils/masteryEngine.js';
import { getSkillAnalytics } from '../services/telemetry/learningTelemetryService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
const FLUENCY_TOPIC_NAME = 'Number Fluency';
const labelFor = (status, fluency) => ({
  not_started: 'needs practice', needs_review: 'needs practice', learning: 'learning',
  mastered: fluency ? 'fluent' : 'mastered',
}[status] || status);

// @route GET /api/skills/analytics
// @desc  Skill-level telemetry for pilot QA and intervention planning.
// @access Private
router.get('/analytics', protect, asyncHandler(async (req, res) => {
  try {
    const analytics = await getSkillAnalytics({
      domain: req.query.domain || '',
      days: req.query.days || 30,
      limit: req.query.limit || 10,
    });
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load skill analytics.' });
  }
}));

// @route GET /api/skills?studentId=&subject=math|science&group=fluency
// @desc  Skill catalog (for a subject) merged with the student's mastery status.
//        subject defaults to 'math'. group=fluency limits to the speed-and-
//        accuracy ("timed") skills across all domains (MathPath Fluency feature).
//        Science reuses this for its topic list.
// @access Private
router.get('/', protect, asyncHandler(async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const fluency = req.query.group === 'fluency';
    const subjectKey = req.query.subject || 'math';
    const subject = await Subject.findOne({ key: subjectKey });
    if (!subject) return res.json({ studentId: student._id, skills: [] });

    const topics = await Topic.find({ subjectId: subject._id }).sort({ order: 1 });
    const topicById = Object.fromEntries(topics.map((t) => [String(t._id), t]));
    // Fluency = the "timed" (speed + accuracy) skills, flagged by the domain spec.
    const topicIds = topics.map((t) => t._id);
    const fluencyTopicIds = topics
      .filter((topic) => String(topic.name || '').trim().toLowerCase() === FLUENCY_TOPIC_NAME.toLowerCase())
      .map((topic) => topic._id);
    const skillFilter = fluency
      ? {
          topicId: { $in: topicIds },
          $or: [
            { 'metadata.fluencyType': 'timed' },
            { 'metadata.fluency': { $exists: true, $ne: null } },
            ...(fluencyTopicIds.length ? [{ topicId: { $in: fluencyTopicIds } }] : []),
          ],
        }
      : { topicId: { $in: topicIds } };
    const candidateSkills = await Skill.find(skillFilter).sort({ order: 1 });
    const questionCounts = candidateSkills.length
      ? await Question.aggregate([
          { $match: { skillId: { $in: candidateSkills.map((skill) => skill._id) } } },
          { $group: { _id: '$skillId', count: { $sum: 1 } } },
        ])
      : [];
    const questionCountBySkill = Object.fromEntries(questionCounts.map((row) => [String(row._id), row.count]));
    const skills = fluency
      ? candidateSkills.filter((skill) => Number(questionCountBySkill[String(skill._id)] || 0) > 0)
      : candidateSkills;

    if (fluency) {
      console.info('[skills] fluency inventory', {
        subject: subjectKey,
        totalFluencySkillsFound: candidateSkills.length,
        availableFluencySkills: candidateSkills.filter((skill) => Number(questionCountBySkill[String(skill._id)] || 0) > 0).length,
        filteredFluencySkills: skills.length,
      });
    }

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
        availableQuestionCount: questionCountBySkill[String(s._id)] || 0,
        targetSeconds: s.metadata?.fluency?.targetSeconds ?? null,
      };
    });
    res.json({ studentId: student._id, studentLevel: student.level || '', subject: subjectKey, skills: out });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load skills.' });
  }
}));

export default router;
