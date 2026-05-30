import mongoose from 'mongoose';
import OutcomeTracking from '../../models/mathpath/OutcomeTracking.js';
import MathPathSkill from '../../models/mathpath/MathPathSkill.js';
import MathPathStudentSkillState from '../../models/mathpath/MathPathStudentSkillState.js';
import MathPathAssessmentSession from '../../models/mathpath/MathPathAssessmentSession.js';
import MathPathPracticeSession from '../../models/mathpath/MathPathPracticeSession.js';
import MathPathAttempt from '../../models/mathpath/MathPathAttempt.js';
import MathPathWorkingSession from '../../models/mathpath/MathPathWorkingSession.js';
import MasteryRecord from '../../models/MasteryRecord.js';
import PracticeSession from '../../models/PracticeSession.js';
import PracticeAttempt from '../../models/PracticeAttempt.js';
import ClassStudent from '../../models/ClassStudent.js';

const DEFAULT_DOMAIN_ID = 'fractions';
const DEFAULT_FRACTIONS_SKILL_COUNT = 26;
const COMPLETE_ASSESSMENT_STATUS = ['submitted', 'marked', 'reviewed'];

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toNullableNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function round(value, dp = 1) {
  const n = toNum(value, NaN);
  if (!Number.isFinite(n)) return 0;
  const p = 10 ** dp;
  return Math.round(n * p) / p;
}

function average(values = []) {
  const nums = values.map((v) => toNum(v, NaN)).filter(Number.isFinite);
  if (!nums.length) return 0;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

function unique(values = []) {
  return [...new Set(values)];
}

function normalizeDomainId(domainId) {
  return String(domainId || DEFAULT_DOMAIN_ID).trim() || DEFAULT_DOMAIN_ID;
}

function normalizeStudentId(studentId) {
  if (studentId === undefined || studentId === null) return '';
  return String(studentId).trim();
}

function toLegacyObjectId(studentId) {
  const normalized = normalizeStudentId(studentId);
  if (!normalized) return null;
  if (!mongoose.Types.ObjectId.isValid(normalized)) return null;
  return new mongoose.Types.ObjectId(normalized);
}

function readinessBandToScore(band) {
  const normalized = String(band || '').toLowerCase();
  if (['advanced', 'strong'].includes(normalized)) return 90;
  if (normalized === 'ready') return 75;
  if (['approaching', 'progressing', 'ontrack', 'on_track'].includes(normalized)) return 60;
  if (normalized === 'developing') return 45;
  if (normalized === 'notready' || normalized === 'beginner') return 30;
  return null;
}

function readinessScoreToBand(score) {
  const n = toNullableNum(score);
  if (n === null) return 'unknown';
  if (n >= 85) return 'strong';
  if (n >= 70) return 'ready';
  if (n >= 55) return 'approaching';
  if (n >= 40) return 'developing';
  return 'notReady';
}

function extractAssessmentScore(session = {}) {
  const result = session?.result || {};
  const direct = [
    result.percentage,
    result.scorePercentage,
    result.scorePct,
    result.score,
    session?.percentage,
  ].map(toNullableNum).find((v) => v !== null);
  if (direct !== undefined) return direct ?? null;

  const totalScore = toNullableNum(result.totalScore ?? result.scoreValue);
  const totalMarks = toNullableNum(result.totalMarks ?? session.totalMarks);
  if (totalScore !== null && totalMarks && totalMarks > 0) {
    return round((totalScore / totalMarks) * 100, 1);
  }
  return null;
}

function extractReadinessScore(session = {}) {
  const result = session?.result || {};
  const direct = [
    result?.readinessScore?.readinessScore,
    result?.readinessScore?.score,
    result?.readinessScore,
    result?.readiness,
    session?.readinessScore,
  ].map(toNullableNum).find((v) => v !== null);
  if (direct !== undefined) return direct ?? null;

  return readinessBandToScore(result?.readinessScore?.readinessBand || result?.readinessBand);
}

async function getDomainSkillCount(domainId) {
  const count = await MathPathSkill.countDocuments({ domainId, isActive: true });
  if (count > 0) return count;
  return domainId === 'fractions' ? DEFAULT_FRACTIONS_SKILL_COUNT : 0;
}

function getGrowthPercent(start, gain) {
  const safeStart = Math.max(1, toNum(start, 0));
  return round((toNum(gain, 0) / safeStart) * 100, 1);
}

function getUniversePercent(gain, universeSize) {
  if (!universeSize) return 0;
  return round((toNum(gain, 0) / universeSize) * 100, 1);
}

async function getCurrentSkillMetrics(studentId, domainId) {
  const states = await MathPathStudentSkillState.find({
    studentId,
    domainId,
  }).lean();

  if (states.length) {
    const mastered = new Set();
    const fluent = new Set();
    const retained = new Set();

    states.forEach((state) => {
      if (!state?.skillId) return;
      const status = String(state.status || '');
      const fluencyLevel = String(state.fluencyLevel || '');
      const retentionStatus = String(state.retentionStatus || '');

      if (['accurate', 'fluent', 'retained'].includes(status)) mastered.add(state.skillId);
      if (['fluent', 'retained'].includes(status) || ['gold', 'platinum'].includes(fluencyLevel)) {
        fluent.add(state.skillId);
      }
      if (status === 'retained' || retentionStatus === 'retained') retained.add(state.skillId);
    });

    return {
      masteredSkillsCurrent: mastered.size,
      fluentSkillsCurrent: fluent.size,
      retainedSkillsCurrent: retained.size,
    };
  }

  // Backward-compatible fallback for older MathPath flows that still write
  // mastery records but not the new skill-state collection.
  const legacyStudentId = toLegacyObjectId(studentId);
  if (!legacyStudentId) {
    return {
      masteredSkillsCurrent: 0,
      fluentSkillsCurrent: 0,
      retainedSkillsCurrent: 0,
    };
  }

  const records = await MasteryRecord.find({
    studentId: legacyStudentId,
    module: /mathpath/i,
    subject: /math/i,
  }).lean();

  const masteredSkillsCurrent = records.filter((r) => r.status === 'mastered').length;
  const fluentSkillsCurrent = records.filter((r) => ['developing', 'automatic'].includes(String(r.fluencyStatus || ''))).length;

  return {
    masteredSkillsCurrent,
    fluentSkillsCurrent,
    retainedSkillsCurrent: 0,
  };
}

async function getCurrentAssessmentMetrics(studentId, domainId) {
  const sessions = await MathPathAssessmentSession.find({
    studentId,
    domainId,
    status: { $in: COMPLETE_ASSESSMENT_STATUS },
  }).sort({ createdAt: 1, submittedAt: 1 }).lean();

  const withScores = sessions
    .map((session) => ({
      score: extractAssessmentScore(session),
      readinessScore: extractReadinessScore(session),
    }))
    .filter((row) => row.score !== null || row.readinessScore !== null);

  const scoreRows = withScores.filter((row) => row.score !== null);
  const readinessRows = withScores.filter((row) => row.readinessScore !== null);

  const baselineAssessmentScore = scoreRows.length ? scoreRows[0].score : null;
  const latestAssessmentScore = scoreRows.length ? scoreRows[scoreRows.length - 1].score : null;
  const bestAssessmentScore = scoreRows.length
    ? round(Math.max(...scoreRows.map((row) => toNum(row.score, 0))), 1)
    : null;
  const baselineReadinessScore = readinessRows.length ? readinessRows[0].readinessScore : null;
  const latestReadinessScore = readinessRows.length ? readinessRows[readinessRows.length - 1].readinessScore : null;

  return {
    baselineAssessmentScore,
    latestAssessmentScore,
    bestAssessmentScore,
    baselineReadinessScore,
    latestReadinessScore,
  };
}

async function getCurrentActivityMetrics(studentId, domainId) {
  const [mathPathPracticeSessions, mathPathAttempts, mathPathWorkingUploads] = await Promise.all([
    MathPathPracticeSession.countDocuments({ studentId, domainId }),
    MathPathAttempt.countDocuments({ studentId, domainId }),
    MathPathWorkingSession.countDocuments({
      studentId,
      domainId,
      $or: [
        { status: { $in: ['submitted', 'mapped', 'analysisReady'] } },
        { submittedAt: { $ne: null } },
        { 'fileUrls.0': { $exists: true } },
        { digitalInkData: { $ne: null } },
      ],
    }),
  ]);

  const legacyStudentId = toLegacyObjectId(studentId);
  let legacyPracticeSessions = 0;
  let legacyAttempts = 0;
  if (legacyStudentId) {
    const [sessions, attempts] = await Promise.all([
      PracticeSession.countDocuments({ studentId: legacyStudentId, module: /mathpath/i }),
      PracticeAttempt.countDocuments({ studentId: legacyStudentId }),
    ]);
    legacyPracticeSessions = sessions;
    legacyAttempts = attempts;
  }

  return {
    totalPracticeSessions: mathPathPracticeSessions + legacyPracticeSessions,
    totalQuestionsAnswered: mathPathAttempts + legacyAttempts,
    totalWorkingUploads: mathPathWorkingUploads,
  };
}

async function collectCurrentOutcomeSnapshot(studentId, domainId) {
  const [skillMetrics, assessmentMetrics, activityMetrics] = await Promise.all([
    getCurrentSkillMetrics(studentId, domainId),
    getCurrentAssessmentMetrics(studentId, domainId),
    getCurrentActivityMetrics(studentId, domainId),
  ]);

  return {
    ...skillMetrics,
    ...assessmentMetrics,
    ...activityMetrics,
  };
}

export function calculateOutcomeGrowth(record = {}) {
  const masteryGain = toNum(record.masteredSkillsCurrent, 0) - toNum(record.masteredSkillsStart, 0);
  const fluencyGain = toNum(record.fluentSkillsCurrent, 0) - toNum(record.fluentSkillsStart, 0);
  const retentionGain = toNum(record.retainedSkillsCurrent, 0) - toNum(record.retainedSkillsStart, 0);

  const baselineAssessmentScore = toNullableNum(record.baselineAssessmentScore);
  const latestAssessmentScore = toNullableNum(record.latestAssessmentScore);
  const assessmentGain =
    baselineAssessmentScore === null || latestAssessmentScore === null
      ? null
      : round(latestAssessmentScore - baselineAssessmentScore, 1);

  const baselineReadinessScore = toNullableNum(record.baselineReadinessScore);
  const latestReadinessScore = toNullableNum(record.latestReadinessScore);
  const readinessGain =
    baselineReadinessScore === null || latestReadinessScore === null
      ? null
      : round(latestReadinessScore - baselineReadinessScore, 1);

  return {
    masteryGain,
    fluencyGain,
    retentionGain,
    assessmentGain,
    readinessGain,
  };
}

export async function createBaselineOutcomeRecord(studentId, domainId = DEFAULT_DOMAIN_ID) {
  const normalizedStudentId = normalizeStudentId(studentId);
  const normalizedDomainId = normalizeDomainId(domainId);
  if (!normalizedStudentId) {
    throw new Error('studentId is required.');
  }

  const existing = await OutcomeTracking.findOne({
    studentId: normalizedStudentId,
    domainId: normalizedDomainId,
  }).lean();
  if (existing) return existing;

  const snapshot = await collectCurrentOutcomeSnapshot(normalizedStudentId, normalizedDomainId);
  const now = new Date();
  const baseline = {
    studentId: normalizedStudentId,
    domainId: normalizedDomainId,
    baselineDate: now,
    latestUpdatedAt: now,
    masteredSkillsStart: snapshot.masteredSkillsCurrent,
    masteredSkillsCurrent: snapshot.masteredSkillsCurrent,
    fluentSkillsStart: snapshot.fluentSkillsCurrent,
    fluentSkillsCurrent: snapshot.fluentSkillsCurrent,
    retainedSkillsStart: snapshot.retainedSkillsCurrent,
    retainedSkillsCurrent: snapshot.retainedSkillsCurrent,
    baselineAssessmentScore: snapshot.baselineAssessmentScore ?? snapshot.latestAssessmentScore,
    latestAssessmentScore: snapshot.latestAssessmentScore,
    bestAssessmentScore: snapshot.bestAssessmentScore ?? snapshot.latestAssessmentScore,
    baselineReadinessScore: snapshot.baselineReadinessScore ?? snapshot.latestReadinessScore,
    latestReadinessScore: snapshot.latestReadinessScore,
    totalPracticeSessions: snapshot.totalPracticeSessions,
    totalQuestionsAnswered: snapshot.totalQuestionsAnswered,
    totalWorkingUploads: snapshot.totalWorkingUploads,
  };

  const growth = calculateOutcomeGrowth(baseline);
  const created = await OutcomeTracking.create({
    ...baseline,
    ...growth,
  });
  return created.toObject();
}

export async function updateOutcomeTracking(studentId, domainId = DEFAULT_DOMAIN_ID) {
  const normalizedStudentId = normalizeStudentId(studentId);
  const normalizedDomainId = normalizeDomainId(domainId);
  if (!normalizedStudentId) {
    throw new Error('studentId is required.');
  }

  let record = await OutcomeTracking.findOne({
    studentId: normalizedStudentId,
    domainId: normalizedDomainId,
  }).lean();

  if (!record) {
    record = await createBaselineOutcomeRecord(normalizedStudentId, normalizedDomainId);
  }

  const snapshot = await collectCurrentOutcomeSnapshot(normalizedStudentId, normalizedDomainId);
  const updates = {
    latestUpdatedAt: new Date(),
    masteredSkillsCurrent: snapshot.masteredSkillsCurrent,
    fluentSkillsCurrent: snapshot.fluentSkillsCurrent,
    retainedSkillsCurrent: snapshot.retainedSkillsCurrent,
    latestAssessmentScore: snapshot.latestAssessmentScore,
    latestReadinessScore: snapshot.latestReadinessScore,
    totalPracticeSessions: snapshot.totalPracticeSessions,
    totalQuestionsAnswered: snapshot.totalQuestionsAnswered,
    totalWorkingUploads: snapshot.totalWorkingUploads,
  };

  if (record.baselineAssessmentScore === null && snapshot.baselineAssessmentScore !== null) {
    updates.baselineAssessmentScore = snapshot.baselineAssessmentScore;
  }
  if (record.baselineReadinessScore === null && snapshot.baselineReadinessScore !== null) {
    updates.baselineReadinessScore = snapshot.baselineReadinessScore;
  }

  const bestCandidates = [
    toNullableNum(record.bestAssessmentScore),
    toNullableNum(snapshot.bestAssessmentScore),
    toNullableNum(snapshot.latestAssessmentScore),
  ].filter((v) => v !== null);
  updates.bestAssessmentScore = bestCandidates.length ? round(Math.max(...bestCandidates), 1) : null;

  const merged = { ...record, ...updates };
  Object.assign(updates, calculateOutcomeGrowth(merged));

  const updated = await OutcomeTracking.findOneAndUpdate(
    { studentId: normalizedStudentId, domainId: normalizedDomainId },
    { $set: updates },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return updated;
}

export async function buildStudentOutcomeSummary(studentId, domainId = DEFAULT_DOMAIN_ID) {
  const normalizedStudentId = normalizeStudentId(studentId);
  if (!normalizedStudentId) {
    throw new Error('studentId is required.');
  }

  const record = await updateOutcomeTracking(normalizedStudentId, domainId);
  const growth = calculateOutcomeGrowth(record);

  const masteryGrowth = {
    before: toNum(record.masteredSkillsStart, 0),
    after: toNum(record.masteredSkillsCurrent, 0),
    gain: growth.masteryGain,
    growthPercent: getGrowthPercent(record.masteredSkillsStart, growth.masteryGain),
  };
  const fluencyGrowth = {
    before: toNum(record.fluentSkillsStart, 0),
    after: toNum(record.fluentSkillsCurrent, 0),
    gain: growth.fluencyGain,
    growthPercent: getGrowthPercent(record.fluentSkillsStart, growth.fluencyGain),
  };
  const retentionGrowth = {
    before: toNum(record.retainedSkillsStart, 0),
    after: toNum(record.retainedSkillsCurrent, 0),
    gain: growth.retentionGain,
    growthPercent: getGrowthPercent(record.retainedSkillsStart, growth.retentionGain),
  };
  const assessmentGrowth = {
    before: toNullableNum(record.baselineAssessmentScore),
    after: toNullableNum(record.latestAssessmentScore),
    best: toNullableNum(record.bestAssessmentScore),
    gain: growth.assessmentGain,
  };
  const readinessGrowth = {
    before: toNullableNum(record.baselineReadinessScore),
    after: toNullableNum(record.latestReadinessScore),
    beforeBand: readinessScoreToBand(record.baselineReadinessScore),
    afterBand: readinessScoreToBand(record.latestReadinessScore),
    gain: growth.readinessGain,
  };

  const narrative = [
    `Mastered skills increased from ${masteryGrowth.before} to ${masteryGrowth.after}.`,
    `Fluent skills moved from ${fluencyGrowth.before} to ${fluencyGrowth.after}.`,
    assessmentGrowth.gain !== null
      ? `Assessment score changed by ${assessmentGrowth.gain >= 0 ? '+' : ''}${assessmentGrowth.gain} points.`
      : 'Assessment growth will appear after baseline and latest assessments are available.',
  ].join(' ');

  return {
    studentId: normalizedStudentId,
    domainId: record.domainId,
    masteryGrowth,
    fluencyGrowth,
    retentionGrowth,
    assessmentGrowth,
    readinessGrowth,
    narrative,
    latestUpdatedAt: record.latestUpdatedAt,
  };
}

export async function buildParentOutcomeSummary(studentId, domainId = DEFAULT_DOMAIN_ID) {
  const summary = await buildStudentOutcomeSummary(studentId, domainId);

  const before = {
    masteredSkills: summary.masteryGrowth.before,
    fluentSkills: summary.fluencyGrowth.before,
    retainedSkills: summary.retentionGrowth.before,
    assessmentScore: summary.assessmentGrowth.before,
    readinessScore: summary.readinessGrowth.before,
    readinessBand: summary.readinessGrowth.beforeBand,
  };

  const after = {
    masteredSkills: summary.masteryGrowth.after,
    fluentSkills: summary.fluencyGrowth.after,
    retainedSkills: summary.retentionGrowth.after,
    assessmentScore: summary.assessmentGrowth.after,
    readinessScore: summary.readinessGrowth.after,
    readinessBand: summary.readinessGrowth.afterBand,
  };

  const growth = {
    masteryGain: summary.masteryGrowth.gain,
    fluencyGain: summary.fluencyGrowth.gain,
    retentionGain: summary.retentionGrowth.gain,
    assessmentGain: summary.assessmentGrowth.gain,
    readinessGain: summary.readinessGrowth.gain,
  };

  const narrative = summary.assessmentGrowth.gain === null
    ? `Your child has grown from ${before.masteredSkills} to ${after.masteredSkills} mastered fraction skills.`
    : `Your child improved from ${before.assessmentScore}% to ${after.assessmentScore}% on fraction assessments, while mastered skills increased from ${before.masteredSkills} to ${after.masteredSkills}.`;

  return {
    studentId: summary.studentId,
    domainId: summary.domainId,
    before,
    after,
    growth,
    narrative,
  };
}

export async function buildClassOutcomeSummary(classId, domainId = DEFAULT_DOMAIN_ID) {
  if (!classId) {
    throw new Error('classId is required.');
  }

  const normalizedDomainId = normalizeDomainId(domainId);
  const classStudents = await ClassStudent.find({ classId, status: 'active' }).select('studentId').lean();
  const studentIds = unique(classStudents.map((row) => normalizeStudentId(row.studentId)).filter(Boolean));

  if (!studentIds.length) {
    return {
      classId: normalizeStudentId(classId),
      domainId: normalizedDomainId,
      totalStudents: 0,
      averageMasteryGain: 0,
      averageFluencyGain: 0,
      averageRetentionGain: 0,
      averageAssessmentGain: 0,
      averageReadinessGain: 0,
    };
  }

  const records = (await Promise.all(studentIds.map((studentId) => updateOutcomeTracking(studentId, normalizedDomainId))))
    .filter(Boolean);

  return {
    classId: normalizeStudentId(classId),
    domainId: normalizedDomainId,
    totalStudents: records.length,
    averageMasteryGain: round(average(records.map((r) => toNum(r.masteryGain, 0))), 1),
    averageFluencyGain: round(average(records.map((r) => toNum(r.fluencyGain, 0))), 1),
    averageRetentionGain: round(average(records.map((r) => toNum(r.retentionGain, 0))), 1),
    averageAssessmentGain: round(average(records.map((r) => toNullableNum(r.assessmentGain)).filter((v) => v !== null)), 1),
    averageReadinessGain: round(average(records.map((r) => toNullableNum(r.readinessGain)).filter((v) => v !== null)), 1),
  };
}

export async function buildPilotOutcomeReport(options = {}) {
  const {
    studentIds = [],
    domainId = DEFAULT_DOMAIN_ID,
    startDate = null,
    endDate = null,
  } = options;

  const normalizedDomainId = normalizeDomainId(domainId);
  const requestedStudentIds = unique((Array.isArray(studentIds) ? studentIds : []).map(normalizeStudentId).filter(Boolean));

  let records = [];
  if (requestedStudentIds.length) {
    records = (await Promise.all(
      requestedStudentIds.map((studentId) => updateOutcomeTracking(studentId, normalizedDomainId))
    )).filter(Boolean);
  } else {
    records = await OutcomeTracking.find({ domainId: normalizedDomainId }).lean();
  }

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  const filtered = records.filter((record) => {
    const baseline = record?.baselineDate ? new Date(record.baselineDate) : null;
    const latest = record?.latestUpdatedAt ? new Date(record.latestUpdatedAt) : null;
    if (start && latest && latest < start) return false;
    if (end && baseline && baseline > end) return false;
    return true;
  });

  const skillUniverse = await getDomainSkillCount(normalizedDomainId);
  const completedStudents = filtered.filter((r) => (
    toNum(r.totalPracticeSessions, 0) > 0 ||
    toNullableNum(r.latestAssessmentScore) !== null ||
    toNum(r.masteredSkillsCurrent, 0) > toNum(r.masteredSkillsStart, 0)
  ));

  const masteryGrowth = round(average(filtered.map((r) => getUniversePercent(r.masteryGain, skillUniverse))), 1);
  const fluencyGrowth = round(average(filtered.map((r) => getUniversePercent(r.fluencyGain, skillUniverse))), 1);
  const retentionGrowth = round(average(filtered.map((r) => getUniversePercent(r.retentionGain, skillUniverse))), 1);
  const assessmentGrowth = round(average(filtered.map((r) => toNullableNum(r.assessmentGain)).filter((v) => v !== null)), 1);
  const readinessGrowth = round(average(filtered.map((r) => toNullableNum(r.readinessGain)).filter((v) => v !== null)), 1);
  const completionRate = filtered.length ? round((completedStudents.length / filtered.length) * 100, 1) : 0;

  return {
    studentCount: filtered.length,
    masteryGrowth,
    fluencyGrowth,
    retentionGrowth,
    assessmentGrowth,
    readinessGrowth,
    completionRate,
    summary: filtered.length
      ? `${filtered.length} students tracked. Average mastery gain ${masteryGrowth}%, fluency gain ${fluencyGrowth}%, retention gain ${retentionGrowth}%, assessment improvement ${assessmentGrowth} points, readiness gain ${readinessGrowth} points.`
      : 'No pilot outcome records matched the selected filters.',
  };
}

export async function validateOutcomeTrackingEngine(options = {}) {
  const { studentId, domainId = DEFAULT_DOMAIN_ID, classId = null } = options;
  const normalizedStudentId = normalizeStudentId(studentId);
  if (!normalizedStudentId) {
    return {
      isValid: false,
      checks: {},
      error: 'studentId is required for validation.',
    };
  }

  const baseline = await createBaselineOutcomeRecord(normalizedStudentId, domainId);
  const updated = await updateOutcomeTracking(normalizedStudentId, domainId);
  const studentSummary = await buildStudentOutcomeSummary(normalizedStudentId, domainId);
  const parentSummary = await buildParentOutcomeSummary(normalizedStudentId, domainId);
  const pilotReport = await buildPilotOutcomeReport({
    studentIds: [normalizedStudentId],
    domainId,
  });
  const classSummary = classId ? await buildClassOutcomeSummary(classId, domainId) : null;

  const checks = {
    baselineRecordCreated: Boolean(baseline?.studentId),
    outcomeRecordUpdated: Boolean(updated?.latestUpdatedAt),
    growthMetricsCalculated: Number.isFinite(toNum(updated?.masteryGain, NaN)),
    studentSummaryGenerated: Boolean(studentSummary?.narrative),
    parentSummaryGenerated: Boolean(parentSummary?.narrative),
    classSummaryGenerated: classId ? Boolean(classSummary?.totalStudents >= 0) : true,
    pilotReportGenerated: Boolean(Number.isFinite(toNum(pilotReport?.completionRate, NaN))),
    missingBaselineHandled: updated?.baselineDate ? true : false,
    partialDataHandled: Boolean(studentSummary && parentSummary),
  };

  return {
    isValid: Object.values(checks).every(Boolean),
    checks,
    baseline,
    updated,
    studentSummary,
    parentSummary,
    classSummary,
    pilotReport,
  };
}

export const outcomeTrackingEngine = {
  createBaselineOutcomeRecord,
  updateOutcomeTracking,
  calculateOutcomeGrowth,
  buildStudentOutcomeSummary,
  buildParentOutcomeSummary,
  buildClassOutcomeSummary,
  buildPilotOutcomeReport,
  validateOutcomeTrackingEngine,
};

export default outcomeTrackingEngine;
