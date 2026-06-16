// Server-side aggregation for the unified MathPath parent dashboard.
//
// Until now the parent dashboard had no backend endpoint: the React page
// hand-assembled 4–5 calls (mastery, mistakes, fluency, retention) and
// re-derived the parent summary client-side, hard-locked to Fractions. This
// service is the single server-side aggregation path. It reuses the SAME data
// sources the existing routes use:
//   • MasteryRecord (routes/mastery.js)   — progress, weak skills, recommended next
//   • Mistake       (routes/mistakes.js)  — recent mistakes
//   • FluencyRecord / RetentionReview via the fluency route's public summaries
// and the SAME pure summary builders the frontend engine uses
// (shared/mathpath/dashboard/parentSummaryBuilders.js), so Fractions output is
// unchanged while every registered domain renders whatever data exists.

import MasteryRecord from '../../models/MasteryRecord.js';
import Skill from '../../models/Skill.js';
import Mistake from '../../models/Mistake.js';
import { domainIdFromSlug } from '../../utils/skillSlugDomain.js';
import { getDomain, listDomains } from '../domains/domainRegistry.js';
import { publicFluencySummary, publicRetentionSummary } from '../../routes/fluency.js';
import {
  dedupe,
  statusBandFromMetrics,
  buildMasteryProgressSummary,
  buildFluencyParentSummary,
  buildRetentionParentSummary,
  buildWeeklyParentActionPlan,
} from '../../shared/mathpath/dashboard/parentSummaryBuilders.js';

// Status buckets mirror the client-side classification the page used before
// (frontend deriveParentPayload): which MasteryRecord statuses count as
// mastered vs weak. Kept identical so Fractions categorisation does not move.
const MASTERED_STATUSES = new Set(['mastered', 'accurate', 'fluent', 'retained']);
const WEAK_STATUSES = new Set(['weak', 'needs_review', 'needsreview']);
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
// expects, so buildFluencyParentSummary produces the same "accurate but slow /
// fluent / automatic" framing without a second classifier.
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

// Build the full unified parent dashboard payload for one student + domain.
// Caller is responsible for access control (resolveStudent) and domain
// validation (hasDomain) BEFORE calling this.
export async function buildParentMathPathDashboard({ student, subjectId = 'math', domainId = 'fractions' } = {}) {
  const studentId = student._id;
  getDomain({ subjectId, domainId }); // throws DOMAIN_NOT_FOUND if unregistered (defensive)
  const domain = shapeDomainMeta(subjectId, domainId);
  const domainNoun = domain.displayNoun;

  // 1) Mastery records → domain-scoped student state. Records are tagged with a
  // domainId derived from the skill slug; we filter to the requested domain.
  const records = await MasteryRecord.find({ studentId, module: 'MathPath' })
    .populate({ path: 'skillId', model: Skill });
  const domainRecords = records.filter((r) => domainIdFromSlug(r.skillId?.slug) === domainId);

  const idName = new Map();
  domainRecords.forEach((r) => {
    if (r.skillId?._id) idName.set(String(r.skillId._id), r.skillId.name || String(r.skillId._id));
  });

  const masteredSkillIds = domainRecords.filter((r) => MASTERED_STATUSES.has(statusOf(r))).map((r) => String(r.skillId?._id)).filter(Boolean);
  const weakRecords = domainRecords.filter((r) => WEAK_STATUSES.has(statusOf(r)));
  const weakSkillIds = weakRecords.map((r) => String(r.skillId?._id)).filter(Boolean);
  const fluentSkillIds = domainRecords.filter((r) => FLUENT_STATUSES.has(statusOf(r))).map((r) => String(r.skillId?._id)).filter(Boolean);

  // Total skills = the domain's full skill set (true denominator), derived from
  // skill slugs. Falls back to attempted-record count if no skills are seeded.
  const allSkills = await Skill.find({}, 'name slug').lean();
  const domainSkills = allSkills.filter((s) => domainIdFromSlug(s.slug) === domainId);
  domainSkills.forEach((s) => { if (!idName.has(String(s._id))) idName.set(String(s._id), s.name || String(s._id)); });
  const skillIds = domainSkills.length
    ? domainSkills.map((s) => String(s._id))
    : dedupe(domainRecords.map((r) => String(r.skillId?._id)).filter(Boolean));

  const labelFor = (id) => idName.get(String(id)) || String(id || '');

  const masteryProgress = buildMasteryProgressSummary(
    { domainId, skillIds },
    { masteredSkillIds, weakSkillIds, fluentSkillIds },
    labelFor,
  );

  // 2) Fluency + retention via the fluency route's canonical public summaries.
  const [fluencyBuckets, retention] = await Promise.all([
    publicFluencySummary(studentId),
    publicRetentionSummary(studentId),
  ]);
  const fluencySummary = buildFluencyParentSummary(
    { questionFamilyResults: fluencyBucketsToFamilyResults(fluencyBuckets) },
    labelFor,
    { domainNoun },
  );
  const retentionState = retentionToState(retention);
  const retentionSummary = buildRetentionParentSummary(retentionState, labelFor);

  // 3) Recent mistakes for this domain (light shape for the parent view).
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

  // 4) Derive cross-cut weaknesses + recommended actions + weekly plan.
  const currentWeaknesses = dedupe(masteryProgress.weakSkills || []).slice(0, 6);
  const recommendedNextActions = dedupe([
    currentWeaknesses.length ? 'followRemediationPlan' : null,
    fluencySummary.accurateButSlowAreas?.length ? 'startFluencyPractice' : null,
    retentionSummary.skillsDueForReview?.length ? 'reviewPreviousSkill' : null,
    masteryProgress.percentageMastered >= 70 && !currentWeaknesses.length ? 'moveToNextSkill' : 'continueCurrentSkill',
  ].filter(Boolean));

  const recommendedNextPractice = (() => {
    const weak = weakRecords[0];
    if (weak?.skillId?._id) return { skillId: String(weak.skillId._id), skillName: weak.skillId.name || '' };
    const inProgress = domainRecords.find((r) => !MASTERED_STATUSES.has(statusOf(r)));
    if (inProgress?.skillId?._id) return { skillId: String(inProgress.skillId._id), skillName: inProgress.skillId.name || '' };
    return null;
  })();

  const readinessScoreProxy = (masteryProgress.percentageMastered + masteryProgress.percentageFluent) / 2;
  const overallStatus = statusBandFromMetrics({
    percentageMastered: masteryProgress.percentageMastered,
    readinessScore: readinessScoreProxy,
    weakCount: currentWeaknesses.length,
  });

  const weeklyActionPlan = buildWeeklyParentActionPlan({
    masteryProgress,
    fluencySummary,
    retentionSummary,
    currentWeaknesses,
    recommendedNextActions,
    domainNoun,
  });

  return {
    studentId: String(studentId),
    subjectId,
    domainId,
    domain,
    overallStatus,
    masteryProgress,
    weakSkills: weakRecords.slice(0, 5).map((r) => ({
      skillId: String(r.skillId?._id || ''),
      skillName: r.skillId?.name || '',
      status: statusOf(r),
    })),
    recentMistakes,
    fluency: { ...fluencyBuckets, emptyState: fluencyBucketsToFamilyResults(fluencyBuckets).length ? null : 'Complete more practice to begin fluency tracking.' },
    fluencySummary,
    retention,
    retentionSummary,
    currentWeaknesses,
    recommendedNextActions,
    recommendedNextPractice,
    weeklyActionPlan,
  };
}

// Domains the child actually has activity in, intersected with the registry.
// Used by the UI to render only relevant domain chips. Always includes the
// requested/active domain handling on the caller side; here we return the pure
// intersection (plus a hasActivity flag).
export async function listChildMathPathDomains({ student, subjectId = 'math' } = {}) {
  const studentId = student._id;
  const records = await MasteryRecord.find({ studentId, module: 'MathPath' })
    .populate({ path: 'skillId', model: Skill, select: 'slug' });
  const activeDomainIds = new Set(
    records.map((r) => domainIdFromSlug(r.skillId?.slug)).filter(Boolean),
  );
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
