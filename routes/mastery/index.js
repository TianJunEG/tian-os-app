import express from 'express';
import { protect } from '../../middleware/auth.js';
import MasteryRecord from '../../models/MasteryRecord.js';
import Skill from '../../models/Skill.js';
import Subject from '../../models/Subject.js';
import Topic from '../../models/Topic.js';
import Mistake from '../../models/Mistake.js';
import User from '../../models/User.js';
import PracticeSession from '../../models/PracticeSession.js';
import MathPathStudentSkillState from '../../models/mathpath/MathPathStudentSkillState.js';
import { resolveStudent } from '../../utils/studentContext.js';
import { weakSkills, recommendNextSkill, deriveMastery, MASTERY_LABEL, fluencyLabel, isStale } from '../../utils/masteryEngine.js';
import { studentMathAnalytics, studentMathPathTimingAnalytics } from '../../utils/analytics.js';
import { buildRemediationPlan } from '../../utils/remediationEngine.js';
import { recordLearningEvents } from '../../services/telemetry/learningTelemetryService.js';
import {
  STATUS_LABEL,
  buildPracticeLifecycleLog,
  buildPracticeMistakeSnapshot,
  practiceAttemptDoc,
  shouldCreatePracticeMistake,
  buildFractionsPersistedSkillGraphView,
  buildOfflineRecoveryPracticeSessionFields,
  buildResetStudentStateDeletionPlan,
} from './_helpers.js';
import fractionsPracticeRouter from './fractionsPractice.js';
import diagnosticRouter from './diagnostic.js';
import questionPatternsRouter from './questionPatterns.js';
import levelPracticeRouters from './levelPractice.js';

const router = express.Router();

router.use(fractionsPracticeRouter);
router.use(diagnosticRouter);
router.use(questionPatternsRouter);
for (const levelRouter of levelPracticeRouters) {
  router.use(levelRouter);
}

router.get('/', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    let recFilter = { studentId: student._id, module: 'MathPath' };
    if (req.query.skillIds) recFilter.skillId = { $in: req.query.skillIds.split(',') };
    const records = await MasteryRecord.find(recFilter).populate({ path: 'skillId', model: Skill, populate: { path: 'topicId' } });

    const shaped = records.map((r) => {
      const masteryState = deriveMastery(r);
      return {
        skillId: r.skillId?._id, skillName: r.skillId?.name || '', topicName: r.skillId?.topicId?.name || '',
        moeLevel: r.skillId?.moeLevel || '', score: r.score, attempts: r.attempts,
        status: r.status, statusLabel: STATUS_LABEL[r.status] || r.status, lastPracticedAt: r.lastPracticedAt,
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

router.post('/remediation', protect, async (req, res) => {
  try {
    const { skillSlug, skillId, recentAttempts = [] } = req.body || {};
    const skill = skillSlug ? await Skill.findOne({ slug: skillSlug }) : (skillId ? await Skill.findById(skillId) : null);
    if (!skill) return res.status(404).json({ error: 'Skill not found.' });
    const prereqSkills = await Skill.find({ _id: { $in: skill.prerequisiteSkillIds || [] } });
    const plan = buildRemediationPlan({ skill, recentAttempts, prereqSkills });
    if (plan?.workingEvidenceUsed) {
      const student = await resolveStudent(req).catch(() => null);
      await recordLearningEvents([{
        studentId: String(student?._id || req.user?.id || req.user?._id || ''),
        eventType: 'working_used_for_remediation',
        domain: 'fractions',
        skillCode: skill.metadata?.mathPathSkillId || skill.metadata?.frameworkCode || skill.slug || '',
        metadata: {
          skillId: String(skill._id),
          detectedMethod: plan.workingInsight?.detectedMethod || '',
          detectedIssue: plan.workingInsight?.detectedIssue || '',
          qualityBand: plan.workingInsight?.qualityBand || '',
        },
      }]);
    }
    res.json(plan);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Remediation failed.' });
  }
});

router.get('/analytics', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const sinceDays = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 30));
    const [summary, timingAnalytics] = await Promise.all([
      studentMathAnalytics(student._id, { sinceDays }),
      studentMathPathTimingAnalytics(student._id, { sinceDays }),
    ]);
    res.json({ studentId: student._id, ...summary, timingAnalytics });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Analytics failed.' });
  }
});

router.get('/graph', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const skillStates = await MathPathStudentSkillState.find({ studentId: String(student._id), domainId: 'fractions' }).lean();
    const view = buildFractionsPersistedSkillGraphView(skillStates);
    res.json({ studentId: student._id, ...view });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load skill graph.' });
  }
});

router.post('/test/reset-state', protect, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);
    const requesterRoles = new Set([requester?.role, ...(Array.isArray(requester?.roles) ? requester.roles : [])].filter(Boolean));
    const isAdmin = requesterRoles.has('admin');
    const targetStudent = isAdmin && req.body?.studentId
      ? await resolveStudent(req, req.body.studentId)
      : await resolveStudent(req);
    const targetUser = targetStudent?.userId ? await User.findById(targetStudent.userId) : null;
    const allowed = isAdmin || Boolean(requester?.is_test_account) || Boolean(targetUser?.is_test_account);
    if (!allowed) {
      return res.status(403).json({ error: 'Reset Student State is available only for admin or test accounts.' });
    }

    const studentId = String(targetStudent._id);
    const mathPathSessions = await PracticeSession.find({ studentId: targetStudent._id, module: 'MathPath' }).select('_id');
    const mathPathSessionIds = mathPathSessions.map((session) => session._id);
    const deletionPlan = buildResetStudentStateDeletionPlan({
      studentId,
      studentObjectId: targetStudent._id,
      mathPathSessionIds,
    });
    const deletionResults = await Promise.all(deletionPlan.map((item) => item.model.deleteMany(item.query)));
    const deleted = deletionPlan.reduce((acc, item, index) => {
      acc[item.key] = deletionResults[index]?.deletedCount || 0;
      return acc;
    }, {});

    return res.json({
      ok: true,
      studentId,
      deleted,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Failed to reset student state.' });
  }
});

export default router;

export {
  buildPracticeLifecycleLog,
  practiceAttemptDoc,
  buildPracticeMistakeSnapshot,
  shouldCreatePracticeMistake,
  buildFractionsPersistedSkillGraphView,
  buildOfflineRecoveryPracticeSessionFields,
  buildResetStudentStateDeletionPlan,
} from './_helpers.js';
