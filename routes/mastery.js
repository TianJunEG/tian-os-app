import express from 'express';
import { protect } from '../middleware/auth.js';
import MasteryRecord from '../models/MasteryRecord.js';
import Skill from '../models/Skill.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Mistake from '../models/Mistake.js';
import Question from '../models/Question.js';
import MathPathDiagnosticSession from '../models/mathpath/MathPathDiagnosticSession.js';
import MathPathAttempt from '../models/mathpath/MathPathAttempt.js';
import { resolveStudent } from '../utils/studentContext.js';
import { weakSkills, recommendNextSkill, deriveMastery, MASTERY_LABEL, fluencyLabel, isStale } from '../utils/masteryEngine.js';
import { buildSkillGraphView } from '../utils/skillGraphView.js';
import { runPlacement } from '../utils/placementEngine.js';
import { normalizeDiagnosticModeForLevel, resolveFractionsStartingSkill } from '../utils/fractionPlacementResolver.js';
import { studentMathAnalytics } from '../utils/analytics.js';
import { buildRemediationPlan } from '../utils/remediationEngine.js';
import { isCorrectWithContext } from '../utils/answerCheck.js';
import { evaluateDiagnosticReplayPolicy } from '../utils/diagnosticReplayPolicy.js';
import {
  getFractionsModelTrainerForSkill,
  getFractionsModelTrainerTemplate,
  listFractionsModelTrainerTemplates,
} from '../services/mathpath/fractionsModelTrainer.js';

const router = express.Router();

const STATUS_LABEL = { not_started: 'needs practice', needs_review: 'needs practice', learning: 'learning', mastered: 'fluent' };
const DIAG_MODE_RANGES = {
  basic: ['F001', 'F005'],
  core: ['F001', 'F019'],
  full: ['F001', 'F026'],
};
const DIAG_COUNTS = {
  baseline: { basic: 10, core: 10, full: 12 },
  recheck: { basic: 12, core: 18, full: 24 },
  assigned: { basic: 12, core: 18, full: 24 },
};
const DIAG_PURPOSES = new Set(['baseline', 'recheck', 'assigned']);

router.get('/fractions/model-trainer', protect, async (req, res) => {
  try {
    res.json({
      templates: listFractionsModelTrainerTemplates({ skillId: req.query.skillId }),
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load model trainer templates.' });
  }
});

router.get('/fractions/model-trainer/skill/:skillId', protect, async (req, res) => {
  try {
    res.json({
      skillId: String(req.params.skillId || '').toUpperCase(),
      templates: getFractionsModelTrainerForSkill(req.params.skillId),
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load model trainer templates.' });
  }
});

router.get('/fractions/model-trainer/:templateId', protect, async (req, res) => {
  try {
    const template = getFractionsModelTrainerTemplate(req.params.templateId);
    if (!template) return res.status(404).json({ error: 'Model trainer template not found.' });
    res.json({ template });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load model trainer template.' });
  }
});

const normalizeLevelTag = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const upper = raw.toUpperCase();
  if (/^P\d$/.test(upper)) return upper;
  const p = upper.match(/PRIMARY\s*(\d)/);
  if (p) return `P${p[1]}`;
  const s = upper.match(/SEC(ONDARY)?\s*(\d)/);
  if (s) return `Sec${s[2]}`;
  return raw;
};

const skillNum = (id = '') => Number(String(id).replace(/^F/i, '')) || 0;
const inSkillRange = (id, [start, end]) => {
  const n = skillNum(id);
  return n >= skillNum(start) && n <= skillNum(end);
};

function mapPlacementReadiness(profile = []) {
  if (!profile.length) return 'Beginner';
  const mastered = profile.filter((p) => p.mastery === 'mastered').length;
  const developing = profile.filter((p) => p.mastery === 'developing').length;
  const notSecure = profile.filter((p) => p.mastery === 'not-secure').length;
  const ratio = mastered / profile.length;
  if (ratio >= 0.85 && notSecure <= 1) return 'Advanced';
  if (ratio >= 0.65 && notSecure <= 2) return 'Ready';
  if (ratio >= 0.4 || developing >= 3) return 'Progressing';
  if (notSecure >= Math.ceil(profile.length * 0.5)) return 'Beginner';
  return 'Developing';
}

function resolveDiagnosticCount(mode = 'core', purpose = 'baseline') {
  const p = DIAG_PURPOSES.has(String(purpose || '').toLowerCase())
    ? String(purpose || '').toLowerCase()
    : 'baseline';
  return DIAG_COUNTS[p]?.[mode] || DIAG_COUNTS.baseline[mode] || 10;
}

function parentPlacementSummary({ recommendedStartingSkill, weakSkills = [] }) {
  const weakNames = weakSkills.slice(0, 2).map((s) => s.name).filter(Boolean);
  const weakText = weakNames.length
    ? `needs more support with ${weakNames.join(' and ')}`
    : 'has some areas that need support';
  return `Your child understands parts of fractions but ${weakText}. We recommend starting at ${recommendedStartingSkill?.name || 'the recommended skill'} before moving to harder operations.`;
}

function buildStudentPlacementReport(payload = {}) {
  const strengths = (payload.masteredSkills || []).slice(0, 4).map((s) => s.name);
  const improve = (payload.weakSkills || []).slice(0, 4).map((s) => s.name);
  const start = payload.recommendedStartingSkill?.name || 'Fractions Foundations';
  return {
    strengths,
    areasToImprove: improve,
    recommendedStartingPoint: start,
    estimatedDifficulty: payload.readinessLevel || 'Developing',
    suggestedFirstSession: `Start with ${start} practice (8–10 questions).`,
  };
}

function readinessBandFromLevel(level = '') {
  const l = String(level || '').toLowerCase();
  if (l === 'advanced') return 'advanced';
  if (l === 'ready') return 'ready';
  if (l === 'progressing') return 'progressing';
  if (l === 'developing') return 'developing';
  return 'beginner';
}

async function loadFractionsSkills() {
  const skills = await Skill.find({ slug: /^fr\./i }).sort({ order: 1 });
  const byFrameworkId = new Map();
  const byObjectId = new Map();
  for (const s of skills) {
    const fid = s.metadata?.mathPathSkillId || s.metadata?.frameworkCode || '';
    if (fid) byFrameworkId.set(String(fid).toUpperCase(), s);
    byObjectId.set(String(s._id), s);
  }
  return { skills, byFrameworkId, byObjectId };
}

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

// @route POST /api/mastery/diagnostic/start
// @desc  Start fractions diagnostic from existing question bank + persist session.
// @access Private
router.post('/diagnostic/start', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const { requestedMode, studentLevel, diagnosticPurpose } = req.body || {};
    const levelTag = normalizeLevelTag(studentLevel || student.level || '');
    const requested = String(requestedMode || '').toLowerCase();
    const purpose = DIAG_PURPOSES.has(String(diagnosticPurpose || '').toLowerCase())
      ? String(diagnosticPurpose || '').toLowerCase()
      : 'baseline';
    const mode = normalizeDiagnosticModeForLevel(levelTag, requested);

    const latestCompleted = await MathPathDiagnosticSession.findOne({
      studentId: String(student._id),
      domainId: 'fractions',
      status: 'completed',
    }).sort({ completedAt: -1, createdAt: -1 });
    const replayPolicy = evaluateDiagnosticReplayPolicy({
      diagnosticPurpose: purpose,
      latestCompletedSession: latestCompleted,
    });
    if (!replayPolicy.allowed) {
      return res.status(409).json({
        error: 'Diagnostic replay is currently blocked. Continue from your saved placement or run a re-check.',
        code: 'DIAGNOSTIC_REPLAY_BLOCKED',
        replayPolicy,
        latestPlacement: latestCompleted
          ? {
              sessionId: latestCompleted.diagnosticSessionId,
              completedAt: latestCompleted.completedAt,
              result: latestCompleted.result || {},
            }
          : null,
      });
    }

    const { skills, byFrameworkId } = await loadFractionsSkills();
    if (!skills.length) return res.status(400).json({ error: 'Fractions skills are not seeded yet.' });

    const [rangeStart, rangeEnd] = DIAG_MODE_RANGES[mode] || DIAG_MODE_RANGES.core;
    const targetSkills = skills
      .filter((s) => {
        const fid = String(s.metadata?.mathPathSkillId || s.metadata?.frameworkCode || '').toUpperCase();
        return fid && inSkillRange(fid, [rangeStart, rangeEnd]);
      })
      .sort((a, b) => {
        const af = String(a.metadata?.mathPathSkillId || a.metadata?.frameworkCode || '');
        const bf = String(b.metadata?.mathPathSkillId || b.metadata?.frameworkCode || '');
        return skillNum(af) - skillNum(bf);
      });
    if (!targetSkills.length) return res.status(400).json({ error: 'No fraction skills available for this diagnostic mode.' });

    const targetSkillIds = targetSkills.map((s) => String(s.metadata?.mathPathSkillId || s.metadata?.frameworkCode || ''));
    const count = resolveDiagnosticCount(mode, purpose);
    const questions = await Question.aggregate([
      { $match: { skillId: { $in: targetSkills.map((s) => s._id) } } },
      { $sample: { size: Math.max(count, Math.min(count + 8, 32)) } },
      { $limit: count },
    ]);
    if (!questions.length) return res.status(400).json({ error: 'No diagnostic questions available yet for Fractions.' });

    const sessionCode = `fracdiag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const qSkillIds = [];
    const qFamilyIds = [];
    const mappedQuestions = questions.map((q) => {
      const skill = byFrameworkId.get(String(targetSkills.find((s) => String(s._id) === String(q.skillId))?.metadata?.mathPathSkillId || '').toUpperCase())
        || targetSkills.find((s) => String(s._id) === String(q.skillId));
      const fid = String(skill?.metadata?.mathPathSkillId || skill?.metadata?.frameworkCode || '');
      const qf = `QF_${fid || 'UNK'}_${String(q._id).slice(-4).toUpperCase()}`;
      if (fid) qSkillIds.push(fid);
      qFamilyIds.push(qf);
      return {
        questionId: String(q._id),
        skillId: fid || '',
        questionFamilyId: qf,
        prompt: q.stem,
        type: q.type,
        choices: q.choices || [],
        workingRequired: !/mental/i.test(String(q.type || '')),
      };
    }).filter((q) => q.skillId);

    const doc = await MathPathDiagnosticSession.create({
      diagnosticSessionId: sessionCode,
      studentId: String(student._id),
      domainId: 'fractions',
      mode,
      studentLevel: levelTag || '',
      targetSkillIds: [...new Set(qSkillIds)],
      targetQuestionFamilyIds: [...new Set(qFamilyIds)],
      status: 'inProgress',
      startedAt: new Date(),
      result: {
        diagnosticPurpose: purpose,
        questionIds: mappedQuestions.map((q) => q.questionId),
        questionMeta: mappedQuestions.map((q) => ({
          questionId: q.questionId,
          skillId: q.skillId,
          questionFamilyId: q.questionFamilyId,
        })),
      },
    });

    const enrichmentOnly = ['P1', 'P2'].includes((levelTag || '').toUpperCase());
    return res.json({
      session: {
        sessionId: doc.diagnosticSessionId,
        mode,
        diagnosticPurpose: purpose,
        studentLevel: levelTag || '',
        enrichmentOnly,
        targetSkillIds: doc.targetSkillIds,
        targetQuestionFamilyIds: doc.targetQuestionFamilyIds,
        estimatedQuestionCount: mappedQuestions.length,
      },
      questions: mappedQuestions,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Failed to start diagnostic.' });
  }
});

// @route POST /api/mastery/diagnostic/:sessionId/submit
// @desc  Save diagnostic attempts, execute existing placement engine, persist result.
// @access Private
router.post('/diagnostic/:sessionId/submit', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const session = await MathPathDiagnosticSession.findOne({
      diagnosticSessionId: req.params.sessionId,
      studentId: String(student._id),
      domainId: 'fractions',
    });
    if (!session) return res.status(404).json({ error: 'Diagnostic session not found.' });

    const responses = Array.isArray(req.body?.responses) ? req.body.responses : [];
    if (!responses.length) return res.status(400).json({ error: 'No diagnostic responses submitted.' });

    const questionIds = responses.map((r) => r.questionId).filter(Boolean);
    const questions = await Question.find({ _id: { $in: questionIds } }).populate('skillId');
    const qMap = new Map(questions.map((q) => [String(q._id), q]));
    const attemptsForPlacement = [];
    const masteryProfileHints = [];
    const savedAttempts = [];

    for (const r of responses) {
      const q = qMap.get(String(r.questionId));
      if (!q || !q.skillId) continue;
      const skill = q.skillId;
      const skillFid = String(skill.metadata?.mathPathSkillId || skill.metadata?.frameworkCode || '').toUpperCase();
      const studentAnswer = String(r.studentAnswer ?? '');
      const correct = r.skipped ? false : isCorrectWithContext(studentAnswer, q.answer, q.stem);
      const retries = Math.max(0, Number(r.attemptNumber || 1) - 1);
      const responseMs = Math.max(0, Number(r.timeTaken || 0) * 1000);
      const confidence = String(r.confidence || '');
      const questionFamilyId = String(r.questionFamilyId || `QF_${skillFid || 'UNK'}_${String(q._id).slice(-4).toUpperCase()}`);

      attemptsForPlacement.push({
        slug: skill.slug,
        correct,
        responseMs,
        hesitationMs: 0,
        retries,
        misconceptionTag: correct ? '' : (q.misconceptionTag || ''),
      });

      masteryProfileHints.push({
        skillId: skillFid,
        skillName: skill.name,
        correct,
        confidence,
        skipped: Boolean(r.skipped),
        timeTaken: Number(r.timeTaken || 0),
      });

      savedAttempts.push({
        studentId: String(student._id),
        domainId: 'fractions',
        skillId: skillFid || skill.slug || String(skill._id),
        questionFamilyId,
        questionId: String(q._id),
        sessionId: session.diagnosticSessionId,
        sessionType: 'diagnostic',
        studentAnswer,
        correctAnswer: String(q.answer || ''),
        correct,
        timeTaken: Number(r.timeTaken || 0) || null,
        confidence,
        attemptNumber: Number(r.attemptNumber || 1),
      });
    }

    if (!savedAttempts.length) return res.status(400).json({ error: 'Submitted responses do not match valid diagnostic questions.' });
    await MathPathAttempt.insertMany(savedAttempts);

    const placement = await runPlacement(student._id, attemptsForPlacement);
    const { byFrameworkId } = await loadFractionsSkills();
    const mapSlugToF = (slug) => {
      const skill = [...byFrameworkId.values()].find((s) => s.slug === slug);
      return skill ? {
        skillId: String(skill.metadata?.mathPathSkillId || skill.metadata?.frameworkCode || ''),
        name: skill.name,
        slug: skill.slug,
      } : { skillId: '', name: slug, slug };
    };

    const placementRecommended = placement?.recommendedStartSkills?.[0]
      ? mapSlugToF(placement.recommendedStartSkills[0].slug)
      : null;
    const masteredSkills = (placement?.masteryProfile || [])
      .filter((p) => p.mastery === 'mastered')
      .map((p) => mapSlugToF(p.slug))
      .filter((s) => s.skillId);
    const weakSkills = (placement?.masteryProfile || [])
      .filter((p) => p.mastery === 'not-secure' || p.mastery === 'developing')
      .map((p) => mapSlugToF(p.slug))
      .filter((s) => s.skillId);
    const fluencyRecommendations = (placement?.fluencyRecommendations || []).map((f) => mapSlugToF(f.slug));
    const prerequisiteGaps = (placement?.prerequisiteGaps || []).map((g) => ({
      skill: mapSlugToF(g.slug),
      rootGap: mapSlugToF(g.rootGap),
    }));
    const remediationRecommendations = (placement?.remediationPathways || []).map((r) => ({
      skill: mapSlugToF(r.slug),
      reinforce: (r.reinforce || []).map((slug) => mapSlugToF(slug)).filter((s) => s.skillId),
      misconception: r.misconception || null,
    }));
    const readinessLevel = mapPlacementReadiness(placement?.masteryProfile || []);

    const recommendedSkillId = resolveFractionsStartingSkill({
      mode: session.mode,
      weakSkills,
      prerequisiteGaps,
      placementRecommended,
      targetSkillIds: session.targetSkillIds || [],
    });
    const recommended = mapSlugToF(
      [...byFrameworkId.values()].find(
        (s) => String(s.metadata?.mathPathSkillId || s.metadata?.frameworkCode || '').toUpperCase() === String(recommendedSkillId).toUpperCase()
      )?.slug || ''
    );
    const safeRecommended = recommended?.skillId ? recommended : {
      skillId: recommendedSkillId,
      name: byFrameworkId.get(String(recommendedSkillId).toUpperCase())?.name || recommendedSkillId,
      slug: byFrameworkId.get(String(recommendedSkillId).toUpperCase())?.slug || '',
    };

    const totalExpected = Array.isArray(session.result?.questionIds) ? session.result.questionIds.length : savedAttempts.length;
    const completionRatio = totalExpected > 0 ? Math.min(1, savedAttempts.length / totalExpected) : 1;
    const confidenceScore = Math.round(Math.min(1, (placement?.overallConfidence || 0) * completionRatio) * 100) / 100;
    const fluencyGaps = fluencyRecommendations.filter((f) => f?.skillId);

    const result = {
      readinessBand: readinessBandFromLevel(readinessLevel),
      recommendedStartingSkill: safeRecommended,
      recommendedStartingSkillName: safeRecommended?.name || '',
      recommendedStartingTopic: 'Fractions',
      masteryProfile: placement?.masteryProfile || [],
      masteredSkills,
      weakSkills,
      prerequisiteGaps,
      fluencyRecommendations,
      fluencyGaps,
      remediationRecommendations,
      confidenceScore,
      readinessLevel,
      diagnosticCompleted: true,
      diagnosticCompletedAt: new Date().toISOString(),
      lastSessionAt: new Date().toISOString(),
      currentSkillId: safeRecommended?.skillId || null,
      skillMasteryStatus: (placement?.masteryProfile || []).reduce((acc, row) => {
        const key = mapSlugToF(row.slug)?.skillId;
        if (key) acc[key] = row.mastery || 'developing';
        return acc;
      }, {}),
      recentMistakeTypes: [],
      needsRecheck: false,
      masteryCheckCompleted: false,
      completedAt: new Date().toISOString(),
      nextPracticePayload: {
        skillId: safeRecommended?.skillId || 'F001',
        source: 'diagnostic-placement',
        mode: session.mode,
        questionCount: 8,
      },
    };
    result.studentPlacementReport = buildStudentPlacementReport(result);
    result.parentPlacementSummary = parentPlacementSummary(result);
    result.parentSummary = result.parentPlacementSummary;

    session.status = 'completed';
    session.completedAt = new Date();
    session.result = result;
    await session.save();

    return res.json({
      sessionId: session.diagnosticSessionId,
      mode: session.mode,
      studentLevel: session.studentLevel,
      ...result,
      recommendedStartingSkillId: safeRecommended?.skillId || null,
      studentFriendlySummary: `You are doing well in parts of fractions. Start with ${safeRecommended?.name || 'the recommended skill'} to build stronger confidence.`,
      parentFriendlySummary: result.parentPlacementSummary,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Failed to complete diagnostic.' });
  }
});

// @route GET /api/mastery/diagnostic/:sessionId
// @desc  Read persisted diagnostic session result.
// @access Private
router.get('/diagnostic/:sessionId', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const session = await MathPathDiagnosticSession.findOne({
      diagnosticSessionId: req.params.sessionId,
      studentId: String(student._id),
      domainId: 'fractions',
    });
    if (!session) return res.status(404).json({ error: 'Diagnostic session not found.' });
    let questions = [];
    const storedIds = Array.isArray(session.result?.questionIds) ? session.result.questionIds : [];
    if (storedIds.length) {
      const docs = await Question.find({ _id: { $in: storedIds } });
      const byId = new Map(docs.map((q) => [String(q._id), q]));
      const metaById = new Map((session.result?.questionMeta || []).map((m) => [String(m.questionId), m]));
      questions = storedIds
        .map((qid) => {
          const q = byId.get(String(qid));
          if (!q) return null;
          const meta = metaById.get(String(qid)) || {};
          return {
            questionId: String(q._id),
            skillId: meta.skillId || '',
            questionFamilyId: meta.questionFamilyId || '',
            prompt: q.stem,
            type: q.type,
            choices: q.choices || [],
            workingRequired: !/mental/i.test(String(q.type || '')),
          };
        })
        .filter(Boolean);
    }

    return res.json({
      sessionId: session.diagnosticSessionId,
      mode: session.mode,
      studentLevel: session.studentLevel,
      status: session.status,
      result: session.result || {},
      completedAt: session.completedAt,
      questions,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Failed to load diagnostic session.' });
  }
});

// @route GET /api/mastery/diagnostic/latest?studentId=
// @desc  Latest completed Fractions diagnostic/placement result for dashboard use.
// @access Private (student self, parent guardian, tutor/teacher workspace member)
router.get('/diagnostic/latest', protect, async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const latest = await MathPathDiagnosticSession.findOne({
      studentId: String(student._id),
      domainId: 'fractions',
      status: 'completed',
    }).sort({ completedAt: -1, createdAt: -1 });

    if (!latest) {
      return res.json({ hasPlacement: false, result: null });
    }

    return res.json({
      hasPlacement: true,
      diagnosticCompleted: true,
      sessionId: latest.diagnosticSessionId,
      mode: latest.mode,
      studentLevel: latest.studentLevel,
      completedAt: latest.completedAt,
      lastSessionAt: latest.completedAt,
      result: latest.result || null,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Failed to load latest diagnostic.' });
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
