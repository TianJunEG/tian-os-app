// Server-side aggregation for the unified MathPath parent dashboard.
//
// The parent dashboard had no backend endpoint: the React page hand-assembled
// 4–5 calls and re-derived the summary client-side, hard-locked to Fractions.
// This service is the single server-side aggregation path. It reuses the same
// pure summary builders the frontend engine uses
// (shared/mathpath/dashboard/parentSummaryBuilders.js) so Fractions output is
// unchanged, and it reads from two stores so every domain shows real data:
//
//   • Fractions (legacy) → MasteryRecord + Mistake + FluencyRecord/RetentionReview
//   • Other domains      → MathPathStudentSkillState + MathPathMistakeRecord
//
// Source selection is per request: if the legacy MasteryRecord store has rows
// for the domain we use it (Fractions, unchanged); otherwise we fall back to the
// MathPath per-domain store (Percentage/Ratio/Algebra/Geometry/Volume). A domain
// with no data anywhere still returns a valid empty payload.

import MasteryRecord from '../../models/MasteryRecord.js';
import Skill from '../../models/Skill.js';
import Mistake from '../../models/Mistake.js';
import MathPathStudentSkillState from '../../models/mathpath/MathPathStudentSkillState.js';
import MathPathMistakeRecord from '../../models/mathpath/MathPathMistakeRecord.js';
import { domainIdFromSlug } from '../../utils/skillSlugDomain.js';
import { getDomain, listDomains } from '../domains/domainRegistry.js';
import { getDomainSkillGraph } from './domainSkillGraphServer.js';
import { publicFluencySummary, publicRetentionSummary } from '../../routes/fluency.js';
import {
  dedupe,
  statusBandFromMetrics,
  buildMasteryProgressSummary,
  buildFluencyParentSummary,
  buildRetentionParentSummary,
  buildWeeklyParentActionPlan,
} from '../../shared/mathpath/dashboard/parentSummaryBuilders.js';

// Status buckets. Legacy MasteryRecord uses 'mastered'/'needs_review';
// MathPathStudentSkillState uses 'accurate'/'fluent'/'retained'/'weak'/
// 'needsReview'/'forgotten'. Both vocabularies are covered so one classifier
// serves both stores (mirrors the prior client-side classification for
// fractions, so that categorisation does not move).
const MASTERED_STATUSES = new Set(['mastered', 'accurate', 'fluent', 'retained']);
const WEAK_STATUSES = new Set(['weak', 'needs_review', 'needsreview', 'forgotten']);
const FLUENT_STATUSES = new Set(['fluent', 'retained']);

function statusOf(record) {
  return String(record?.status || '').toLowerCase();
}

// Domain copy noun for the parent-facing summary text. Fractions stays the
// singular 'fraction' so the weekly-plan copy is byte-identical to the live
// pilot; other domains derive a friendly noun from their display name.
function domainNounFor(domainId, displayName) {
  if (domainId === 'fractions') return 'fraction';
  return String(displayName || '').replace(/^MathPath\s+/i, '').trim().toLowerCase() || 'math';
}

// Friendly display name without the "MathPath " prefix, for page copy.
function friendlyDomainName(displayName) {
  return String(displayName || '').replace(/^MathPath\s+/i, '').trim() || 'MathPath';
}

function shapeDomainMeta(subjectId, domainId) {
  const meta = listDomains().find((d) => d.subjectId === subjectId && d.domainId === domainId) || null;
  const displayName = meta?.displayName || domainId;
  return {
    ...(meta || { subjectId, domainId, displayName }),
    displayNoun: domainNounFor(domainId, displayName),
    friendlyName: friendlyDomainName(displayName),
  };
}

// Map FluencyRecord buckets → the questionFamilyResults shape the pure builder
// expects, so buildFluencyParentSummary produces the same framing.
function fluencyBucketsToFamilyResults(buckets = {}) {
  const fluent = (buckets.fluentSkills || []).map((s) => ({ status: 'fluent', skillId: s.skillId, displayName: s.skillName }));
  const developing = (buckets.developingSkills || []).map((s) => ({ status: 'accurateButSlow', skillId: s.skillId, displayName: s.skillName }));
  return [...fluent, ...developing];
}

function retentionToState(retention = {}) {
  const due = [...(retention.overdueReviews || []), ...(retention.upcomingReviews || [])];
  return {
    retainedSkillIds: (retention.retentionHistory || []).filter((r) => r.retained).map((r) => r.skillName || r.skillCode || r.skillId),
    skillsDueForReview: due.map((r) => r.skillName || r.skillCode || r.skillId),
    skillsNeedingRefresh: (retention.overdueReviews || []).map((r) => r.skillName || r.skillCode || r.skillId),
  };
}

// ── Source A: legacy MasteryRecord store (Fractions) ────────────────────────
async function loadLegacyDomainData({ studentId, domainId, domainNoun }) {
  const records = await MasteryRecord.find({ studentId, module: 'MathPath' })
    .populate({ path: 'skillId', model: Skill });
  const domainRecords = records.filter((r) => domainIdFromSlug(r.skillId?.slug) === domainId);
  if (!domainRecords.length) return { hasData: false };

  const idName = new Map();
  domainRecords.forEach((r) => {
    if (r.skillId?._id) idName.set(String(r.skillId._id), r.skillId.name || String(r.skillId._id));
  });

  const masteredSkillIds = domainRecords.filter((r) => MASTERED_STATUSES.has(statusOf(r))).map((r) => String(r.skillId?._id)).filter(Boolean);
  const weakRecords = domainRecords.filter((r) => WEAK_STATUSES.has(statusOf(r)));
  const weakSkillIds = weakRecords.map((r) => String(r.skillId?._id)).filter(Boolean);
  const fluentSkillIds = domainRecords.filter((r) => FLUENT_STATUSES.has(statusOf(r))).map((r) => String(r.skillId?._id)).filter(Boolean);

  // Total skills = the domain's full skill set (true denominator), from slugs.
  const allSkills = await Skill.find({}, 'name slug').lean();
  const domainSkills = allSkills.filter((s) => domainIdFromSlug(s.slug) === domainId);
  domainSkills.forEach((s) => { if (!idName.has(String(s._id))) idName.set(String(s._id), s.name || String(s._id)); });
  const skillIds = domainSkills.length
    ? domainSkills.map((s) => String(s._id))
    : dedupe(domainRecords.map((r) => String(r.skillId?._id)).filter(Boolean));
  const labelFor = (id) => idName.get(String(id)) || String(id || '');

  const masteryProgress = buildMasteryProgressSummary({ domainId, skillIds }, { masteredSkillIds, weakSkillIds, fluentSkillIds }, labelFor);

  const [fluencyBuckets, retention] = await Promise.all([
    publicFluencySummary(studentId),
    publicRetentionSummary(studentId),
  ]);
  const fluencySummary = buildFluencyParentSummary({ questionFamilyResults: fluencyBucketsToFamilyResults(fluencyBuckets) }, labelFor, { domainNoun });
  const retentionSummary = buildRetentionParentSummary(retentionToState(retention), labelFor);

  const mistakes = await Mistake.find({ studentId, module: 'MathPath', seeded: { $ne: true } })
    .populate({ path: 'skillId', model: Skill })
    .sort({ occurredAt: -1 })
    .limit(50);
  const recentMistakes = mistakes
    .filter((m) => !m.skillId?.slug || domainIdFromSlug(m.skillId?.slug) === domainId)
    .slice(0, 10)
    .map((m) => ({
      id: String(m._id),
      skillName: m.skillId?.name || m.skillCode || 'Unknown skill',
      misconceptionTag: m.misconceptionTag || '',
      questionText: m.questionText || m.questionStem || '',
      studentAnswer: m.studentAnswer,
      correctAnswer: m.correctAnswer,
      occurredAt: m.occurredAt || m.timestamp || null,
    }));

  const recommendedNextPractice = (() => {
    const weak = weakRecords[0];
    if (weak?.skillId?._id) return { skillId: String(weak.skillId._id), skillName: weak.skillId.name || '' };
    const inProgress = domainRecords.find((r) => !MASTERED_STATUSES.has(statusOf(r)));
    if (inProgress?.skillId?._id) return { skillId: String(inProgress.skillId._id), skillName: inProgress.skillId.name || '' };
    return null;
  })();

  return {
    hasData: true,
    source: 'mastery',
    masteryProgress,
    weakSkills: weakRecords.slice(0, 5).map((r) => ({ skillId: String(r.skillId?._id || ''), skillName: r.skillId?.name || '', status: statusOf(r) })),
    recentMistakes,
    fluency: { ...fluencyBuckets, emptyState: fluencyBucketsToFamilyResults(fluencyBuckets).length ? null : 'Complete more practice to begin fluency tracking.' },
    fluencySummary,
    retention,
    retentionSummary,
    recommendedNextPractice,
  };
}

// ── Source B: MathPath per-domain store (Percentage/Ratio/Algebra/…) ────────
const FLUENT_LEVELS = new Set(['gold', 'platinum']);
const DEVELOPING_LEVELS = new Set(['bronze', 'silver']);

function interpretFluency(state) {
  if (FLUENT_LEVELS.has(state.fluencyLevel)) return 'This skill is accurate and quick enough for retention review.';
  if (Number(state.accuracy) >= 85) return 'Your child understands the concept but needs more practice to answer quickly and confidently.';
  return 'This skill needs more accurate practice before fluency training.';
}

async function loadMathPathDomainData({ studentId, domainId, domainNoun }) {
  const sid = String(studentId);
  const states = await MathPathStudentSkillState.find({ studentId: sid, domainId }).lean();
  if (!states.length) return { hasData: false };

  const graph = getDomainSkillGraph(domainId);
  const labelFor = (id) => graph.nameFor(id);

  const masteredSkillIds = states.filter((s) => MASTERED_STATUSES.has(statusOf(s))).map((s) => s.skillId);
  const weakStates = states.filter((s) => WEAK_STATUSES.has(statusOf(s)));
  const weakSkillIds = weakStates.map((s) => s.skillId);
  const fluentSkillIds = states.filter((s) => FLUENT_STATUSES.has(statusOf(s)) || FLUENT_LEVELS.has(s.fluencyLevel)).map((s) => s.skillId);

  const skillIds = graph.hasGraph ? graph.skillIds : dedupe(states.map((s) => s.skillId));
  const masteryProgress = buildMasteryProgressSummary({ domainId, skillIds }, { masteredSkillIds, weakSkillIds, fluentSkillIds }, labelFor);

  // Fluency buckets derived from the per-skill state (no FluencyRecord rows for
  // these domains). Only practised skills are bucketed.
  const practised = states.filter((s) => Number(s.attemptCount) > 0);
  const fluencyShape = (s, fluencyStatus) => ({
    skillId: s.skillId,
    skillName: labelFor(s.skillId),
    accuracy: Number(s.accuracy) || 0,
    averageTimeSeconds: s.averageTime != null ? Math.round(Number(s.averageTime)) : null,
    fluencyStatus,
    interpretation: interpretFluency(s),
  });
  const fluentSkills = practised.filter((s) => FLUENT_LEVELS.has(s.fluencyLevel) || FLUENT_STATUSES.has(statusOf(s))).map((s) => fluencyShape(s, 'fluent'));
  const developingSkills = practised.filter((s) => DEVELOPING_LEVELS.has(s.fluencyLevel)).map((s) => fluencyShape(s, 'developing'));
  const needsPracticeSkills = practised
    .filter((s) => !FLUENT_LEVELS.has(s.fluencyLevel) && !DEVELOPING_LEVELS.has(s.fluencyLevel) && !FLUENT_STATUSES.has(statusOf(s)))
    .map((s) => fluencyShape(s, 'needsPractice'));
  const fluencyBuckets = { fluentSkills, developingSkills, needsPracticeSkills };
  const fluencySummary = buildFluencyParentSummary({ questionFamilyResults: fluencyBucketsToFamilyResults(fluencyBuckets) }, labelFor, { domainNoun });

  // Retention derived from the per-skill state.
  const now = Date.now();
  const isDue = (s) => statusOf(s) === 'needsreview' || s.retentionStatus === 'needsReview' || (s.nextReviewDate && new Date(s.nextReviewDate).getTime() <= now && s.retentionStatus !== 'retained');
  const dueStates = states.filter(isDue);
  const retentionState = {
    retainedSkillIds: states.filter((s) => s.retentionStatus === 'retained').map((s) => s.skillId),
    skillsDueForReview: dueStates.map((s) => s.skillId),
    skillsNeedingRefresh: states.filter((s) => s.retentionStatus === 'forgotten' || statusOf(s) === 'forgotten').map((s) => s.skillId),
  };
  const retentionSummary = buildRetentionParentSummary(retentionState, labelFor);
  const retention = {
    upcomingReviews: dueStates.map((s) => ({ skillId: s.skillId, skillName: labelFor(s.skillId), reviewDate: s.nextReviewDate || null })),
    overdueReviews: [],
    retentionHistory: states.filter((s) => s.retentionStatus === 'retained').map((s) => ({ skillId: s.skillId, skillName: labelFor(s.skillId), retained: true })),
    emptyState: dueStates.length ? null : 'No review is due today.',
  };

  // Recent mistakes from the MathPath mistake store.
  const mistakeRecords = await MathPathMistakeRecord.find({ studentId: sid, domainId }).sort({ lastSeenAt: -1 }).limit(10).lean();
  const recentMistakes = mistakeRecords.map((m) => {
    const lastEvidence = Array.isArray(m.evidence) && m.evidence.length ? m.evidence[m.evidence.length - 1] : {};
    return {
      id: String(m._id),
      skillName: (m.skillId && graph.nameFor(m.skillId)) || m.mistakeName || m.mistakeCode || 'Unknown skill',
      misconceptionTag: m.mistakeCode || '',
      questionText: lastEvidence.questionText || '',
      studentAnswer: lastEvidence.studentAnswer,
      correctAnswer: lastEvidence.correctAnswer,
      occurredAt: m.lastSeenAt || null,
    };
  });

  const recommendedNextPractice = (() => {
    const weak = weakStates[0];
    if (weak) return { skillId: weak.skillId, skillName: labelFor(weak.skillId) };
    const inProgress = states.find((s) => !MASTERED_STATUSES.has(statusOf(s)));
    if (inProgress) return { skillId: inProgress.skillId, skillName: labelFor(inProgress.skillId) };
    return null;
  })();

  return {
    hasData: true,
    source: 'mathpath',
    masteryProgress,
    weakSkills: weakStates.slice(0, 5).map((s) => ({ skillId: s.skillId, skillName: labelFor(s.skillId), status: statusOf(s) })),
    recentMistakes,
    fluency: { ...fluencyBuckets, emptyState: practised.length ? null : 'Complete more practice to begin fluency tracking.' },
    fluencySummary,
    retention,
    retentionSummary,
    recommendedNextPractice,
  };
}

// Empty-but-valid dataset so a domain with no activity anywhere still renders.
function emptyDomainData() {
  return {
    source: 'none',
    masteryProgress: buildMasteryProgressSummary({ skillIds: [] }, {}, (v) => String(v || '')),
    weakSkills: [],
    recentMistakes: [],
    fluency: { fluentSkills: [], developingSkills: [], needsPracticeSkills: [], emptyState: 'Complete more practice to begin fluency tracking.' },
    fluencySummary: buildFluencyParentSummary({}, (v) => String(v || '')),
    retention: { upcomingReviews: [], overdueReviews: [], retentionHistory: [], emptyState: 'No review is due today.' },
    retentionSummary: buildRetentionParentSummary({}, (v) => String(v || '')),
    recommendedNextPractice: null,
  };
}

// Build the full unified parent dashboard payload for one student + domain.
// Caller is responsible for access control (resolveStudent) and domain
// validation (hasDomain) BEFORE calling this.
export async function buildParentMathPathDashboard({ student, subjectId = 'math', domainId = 'fractions' } = {}) {
  const studentId = student._id;
  getDomain({ subjectId, domainId }); // throws DOMAIN_NOT_FOUND if unregistered (defensive)
  const domain = shapeDomainMeta(subjectId, domainId);
  const domainNoun = domain.displayNoun;

  // Source selection: legacy MasteryRecord (Fractions, unchanged) first, then
  // the MathPath per-domain store, then an empty-but-valid payload.
  const data = (await loadLegacyDomainData({ studentId, domainId, domainNoun }))
    || null;
  const resolved = (data && data.hasData)
    ? data
    : (await loadMathPathDomainData({ studentId, domainId, domainNoun }));
  const finalData = resolved && resolved.hasData ? resolved : emptyDomainData();

  const masteryProgress = finalData.masteryProgress;
  const currentWeaknesses = dedupe(masteryProgress.weakSkills || []).slice(0, 6);
  const recommendedNextActions = dedupe([
    currentWeaknesses.length ? 'followRemediationPlan' : null,
    finalData.fluencySummary.accurateButSlowAreas?.length ? 'startFluencyPractice' : null,
    finalData.retentionSummary.skillsDueForReview?.length ? 'reviewPreviousSkill' : null,
    masteryProgress.percentageMastered >= 70 && !currentWeaknesses.length ? 'moveToNextSkill' : 'continueCurrentSkill',
  ].filter(Boolean));

  const readinessScoreProxy = (masteryProgress.percentageMastered + masteryProgress.percentageFluent) / 2;
  const overallStatus = statusBandFromMetrics({
    percentageMastered: masteryProgress.percentageMastered,
    readinessScore: readinessScoreProxy,
    weakCount: currentWeaknesses.length,
  });

  const weeklyActionPlan = buildWeeklyParentActionPlan({
    masteryProgress,
    fluencySummary: finalData.fluencySummary,
    retentionSummary: finalData.retentionSummary,
    currentWeaknesses,
    recommendedNextActions,
    domainNoun,
  });

  return {
    studentId: String(studentId),
    subjectId,
    domainId,
    domain,
    dataSource: finalData.source,
    overallStatus,
    masteryProgress,
    weakSkills: finalData.weakSkills,
    recentMistakes: finalData.recentMistakes,
    fluency: finalData.fluency,
    fluencySummary: finalData.fluencySummary,
    retention: finalData.retention,
    retentionSummary: finalData.retentionSummary,
    currentWeaknesses,
    recommendedNextActions,
    recommendedNextPractice: finalData.recommendedNextPractice,
    weeklyActionPlan,
  };
}

// Domains the child actually has activity in, intersected with the registry.
// Activity is sourced from BOTH stores: legacy MasteryRecord (Fractions, via
// skill-slug → domainId) and MathPathStudentSkillState (per-domain). Used by the
// UI to render only relevant domain chips.
export async function listChildMathPathDomains({ student, subjectId = 'math' } = {}) {
  const studentId = student._id;
  const [records, mathDomainIds] = await Promise.all([
    MasteryRecord.find({ studentId, module: 'MathPath' }).populate({ path: 'skillId', model: Skill, select: 'slug' }),
    MathPathStudentSkillState.distinct('domainId', { studentId: String(studentId) }),
  ]);
  const activeDomainIds = new Set([
    ...records.map((r) => domainIdFromSlug(r.skillId?.slug)).filter(Boolean),
    ...mathDomainIds.filter(Boolean),
  ]);
  const registered = listDomains().filter((d) => d.subjectId === subjectId);
  return registered
    .filter((d) => activeDomainIds.has(d.domainId))
    .map((d) => ({
      subjectId: d.subjectId,
      domainId: d.domainId,
      displayName: d.displayName,
      friendlyName: friendlyDomainName(d.displayName),
      hasActivity: true,
    }));
}

export default { buildParentMathPathDashboard, listChildMathPathDomains };
