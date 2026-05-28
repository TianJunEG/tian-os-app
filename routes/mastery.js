import express from 'express';
import { protect } from '../middleware/auth.js';
import MasteryRecord from '../models/MasteryRecord.js';
import Skill from '../models/Skill.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Mistake from '../models/Mistake.js';
import { resolveStudent } from '../utils/studentContext.js';
import { weakSkills, recommendNextSkill, deriveMastery, MASTERY_LABEL, fluencyLabel, isStale } from '../utils/masteryEngine.js';
import { buildSkillGraphView } from '../utils/skillGraphView.js';
import { runPlacement } from '../utils/placementEngine.js';
import { studentMathAnalytics } from '../utils/analytics.js';
import { buildRemediationPlan } from '../utils/remediationEngine.js';

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

    const shaped = records.map((r) => {
      const masteryState = deriveMastery(r);
      return {
        skillId: r.skillId?._id, skillName: r.skillId?.name || '', topicName: r.skillId?.topicId?.name || '',
        moeLevel: r.skillId?.moeLevel || '', score: r.score, attempts: r.attempts,
        status: r.status, statusLabel: STATUS_LABEL[r.status] || r.status, lastPracticedAt: r.lastPracticedAt,
        // mastery v2 (derived): 5-state ladder + 3-state fluency label + estimate quality
        masteryState, masteryLabel: MASTERY_LABEL[masteryState], fluency: fluencyLabel(r.fluencyStatus),
        fluencyStatus: r.fluencyStatus || 'unknown', streak: r.streak || 0, bestStreak: r.bestStreak || 0,
        confidence: r.confidence ?? 0, consistency: r.consistency ?? 1, stale: isStale(r),
      };
    });

    const weak = await weakSkills(student._id, { limit: 5 });
    const weakShaped = weak.map((r) => ({
      skillId: r.skillId?._id, skillName: r.skillId?.name || '', topicName: r.skillId?.topicId?.name || '',
      score: r.score, status: r.status, statusLabel: STATUS_LABEL[r.status] || r.status,
    }));

    // Recommendation is prerequisite-aware: it targets the weakest in-progress
    // skill (else the next un-mastered skill in curriculum order) and then descends
    // the prerequisite chain to the earliest gap the student is ready for, so we
    // never recommend a skill whose foundations aren't yet mastered. See
    // recommendNextSkill in utils/masteryEngine.js.
    const rec = await recommendNextSkill(student._id);
    const recStatus = rec?.record?.status || 'not_started';
    const recommended = rec ? {
      skillId: rec.skill._id, skillName: rec.skill.name, topicName: rec.skill.topicId?.name || '',
      score: rec.record?.score ?? 0, status: recStatus, statusLabel: STATUS_LABEL[recStatus] || recStatus,
      reason: rec.reason, target: rec.target, mode: rec.mode, masteryState: rec.masteryState,
      masteryLabel: MASTERY_LABEL[rec.masteryState], confidence: rec.confidence,
    } : null;
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
        return { skillId: s._id, name: s.name, moeLevel: s.moeLevel, score: r?.score || 0, attempts: r?.attempts || 0, status, statusLabel: STATUS_LABEL[status] || status, masteryState: deriveMastery(r || {}), fluency: fluencyLabel(r?.fluencyStatus), fluencyStatus: r?.fluencyStatus || 'unknown', streak: r?.streak || 0 };
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

// @route POST /api/mastery/placement
// @desc  Estimate placement from diagnostic attempts — analyses speed, hesitation,
//        retries and misconception patterns (not just correctness) into a mastery
//        profile + recommended start skills, remediation paths and fluency recs.
//        body: { attempts: [{ slug, correct, responseMs, hesitationMs, retries, misconceptionTag }] }
// @access Private
router.post('/placement', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const attempts = Array.isArray(req.body?.attempts) ? req.body.attempts : [];
    const result = await runPlacement(student._id, attempts);
    res.json({ studentId: student._id, ...(result || { masteryProfile: [] }) });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Placement failed.' });
  }
});

// @route POST /api/mastery/remediation
// @desc  A calm, progressively-disclosed remediation plan for a skill the student
//        keeps missing: likely misconception → prerequisite warm-up → worked
//        example → guided replication → retry.
//        body: { skillSlug | skillId, recentAttempts?: [{ correct, misconceptionTag }] }
// @access Private
router.post('/remediation', protect, async (req, res) => {
  try {
    const { skillSlug, skillId, recentAttempts = [] } = req.body || {};
    const skill = skillSlug ? await Skill.findOne({ slug: skillSlug }) : (skillId ? await Skill.findById(skillId) : null);
    if (!skill) return res.status(404).json({ error: 'Skill not found.' });
    const prereqSkills = await Skill.find({ _id: { $in: skill.prerequisiteSkillIds || [] } });
    res.json(buildRemediationPlan({ skill, recentAttempts, prereqSkills }));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Remediation failed.' });
  }
});

// @route GET /api/mastery/analytics?studentId=&days=30
// @desc  Lightweight, dashboard-ready MathPath analytics (response times,
//        accuracy, consistency, mastery velocity, fluency trends, top
//        misconceptions, remediation triggers) for parent/tutor views + AI.
// @access Private
router.get('/analytics', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const sinceDays = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 30));
    res.json({ studentId: student._id, ...(await studentMathAnalytics(student._id, { sinceDays })) });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Analytics failed.' });
  }
});

// @route GET /api/mastery/graph?studentId=
// @desc  The Math curriculum graph + this student's mastery, with prerequisite-
//        aware lock/ready state and a "ready to learn next" list. Powers the
//        student Skill Graph page. Math (MathPath) only — that's where the
//        prerequisite graph is authored. A skill is `ready` when all its
//        prerequisites are mastered (stale mastery doesn't count, matching
//        recommendNextSkill), and `locked` when it's not yet started and a
//        prerequisite is still missing.
// @access Private
router.get('/graph', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const empty = { total: 0, mastered: 0, inProgress: 0, notStarted: 0, locked: 0, ready: 0, avgScore: 0 };
    const math = await Subject.findOne({ key: 'math' });
    if (!math) return res.json({ studentId: student._id, summary: empty, readyNext: [], topics: [] });

    const topics = await Topic.find({ subjectId: math._id }).sort({ order: 1 });
    const skills = await Skill.find({ topicId: { $in: topics.map((t) => t._id) } }).sort({ order: 1 });
    const records = await MasteryRecord.find({ studentId: student._id, module: 'MathPath' });
    const recordsBySkill = new Map(records.map((r) => [String(r.skillId), r]));
    // Mastered & fresh only — stale mastery shouldn't count as a met prerequisite.
    const masteredIds = new Set(records.filter((r) => r.status === 'mastered' && !isStale(r)).map((r) => String(r.skillId)));

    const topicsWithSkills = topics.map((t) => ({
      topicId: t._id, name: t.name, moeLevel: t.moeLevel,
      skills: skills.filter((s) => String(s.topicId) === String(t._id)),
    }));
    const view = buildSkillGraphView({ topics: topicsWithSkills, recordsBySkill, masteredIds });

    res.json({ studentId: student._id, ...view });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load skill graph.' });
  }
});

export default router;
