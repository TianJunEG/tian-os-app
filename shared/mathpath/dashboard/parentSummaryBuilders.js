// Pure, dependency-free builders for the MathPath parent dashboard.
//
// These were originally defined inline in
// frontend/src/mathpath/dashboard/parentMathPathDashboardEngine.js, locked to
// fractions. They are extracted here so BOTH the frontend engine and the new
// server-side aggregator (services/mathpath/parentDashboardAggregator.js) call
// the exact same logic instead of re-deriving the summary on each surface.
//
// Everything here is pure: callers pass the student state, a skill-id→name
// `labelFor` function, and (where copy mentions a domain) a `domainNoun`. The
// `domainNoun` defaults to 'fraction' so the live Fractions pilot produces
// byte-identical output; other domains pass their own noun (e.g. 'percentage').

const STATUS_BANDS = ['needsSupport', 'developing', 'onTrack', 'strong', 'advanced'];

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function dedupe(arr) {
  return [...new Set(arr)];
}

// Identity labeller — returns already-friendly strings unchanged. The frontend
// engine supplies a fractions/per-domain labeller; the server supplies a
// records-backed labeller. Either way, an explicit labeller is the norm.
function identityLabel(value) {
  return value ? String(value) : '';
}

function stripTechnicalJargon(text) {
  return String(text || '')
    .replace(/\bF\d{3}\b/g, '')                       // fractions skill code, e.g. F010
    .replace(/\bQF_F\d{3}_\d{3}\b/g, '')               // fractions question-family code
    .replace(/\b[A-Z]\d?-[A-Z]{2,5}-\d{2,3}\b/g, '')   // P6-style code, e.g. P6-PCT-01, P6-SPD-02
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function statusBandFromMetrics({ percentageMastered = 0, readinessScore = 0, weakCount = 0 }) {
  if (percentageMastered >= 80 && readinessScore >= 85 && weakCount <= 2) return 'advanced';
  if (percentageMastered >= 60 && readinessScore >= 75 && weakCount <= 4) return 'strong';
  if (percentageMastered >= 40 && readinessScore >= 60) return 'onTrack';
  if (percentageMastered >= 20 && readinessScore >= 45) return 'developing';
  return 'needsSupport';
}

function buildMasteryProgressSummary(skillGraph = { skillIds: [] }, studentState = {}, labelFor = identityLabel) {
  const totalSkills = skillGraph?.skillIds?.length || 0;
  const masteredSet = new Set(studentState.masteredSkillIds || []);
  const weakSet = new Set(studentState.weakSkillIds || []);
  const fluentSet = new Set(studentState.fluentSkillIds || []);
  const retainedSet = new Set(studentState.retainedSkillIds || []);

  const masteredSkills = [...masteredSet];
  const fluentSkills = [...fluentSet].filter((id) => masteredSet.has(id) || !weakSet.has(id));
  const retainedSkills = [...retainedSet];
  const weakSkills = [...weakSet];
  const inProgressSkills = (skillGraph?.skillIds || []).filter((id) => !masteredSet.has(id) && !weakSet.has(id));

  const percentageMastered = totalSkills ? Math.round((masteredSkills.length / totalSkills) * 1000) / 10 : 0;
  const percentageFluent = totalSkills ? Math.round((fluentSkills.length / totalSkills) * 1000) / 10 : 0;
  const percentageRetained = totalSkills ? Math.round((retainedSkills.length / totalSkills) * 1000) / 10 : 0;

  return {
    totalSkills,
    masteredSkills: masteredSkills.map(labelFor),
    fluentSkills: fluentSkills.map(labelFor),
    retainedSkills: retainedSkills.map(labelFor),
    inProgressSkills: inProgressSkills.map(labelFor),
    weakSkills: weakSkills.map(labelFor),
    percentageMastered,
    percentageFluent,
    percentageRetained,
  };
}

function buildFluencyParentSummary(fluencyState = {}, labelFor = identityLabel, { domainNoun = 'fraction' } = {}) {
  const familyResults = fluencyState.questionFamilyResults || [];
  const accurateButSlowAreas = familyResults
    .filter((r) => r.status === 'accurateButSlow')
    .map((r) => r.displayName || labelFor(r.skillId || r.questionFamilyId));
  const fluentAreas = familyResults
    .filter((r) => r.status === 'fluent')
    .map((r) => r.displayName || labelFor(r.skillId || r.questionFamilyId));
  const automaticAreas = familyResults
    .filter((r) => r.status === 'automatic')
    .map((r) => r.displayName || labelFor(r.skillId || r.questionFamilyId));

  const overallFluencyBand =
    automaticAreas.length >= 3 ? 'advanced'
      : fluentAreas.length >= 4 ? 'strong'
        : accurateButSlowAreas.length > 0 ? 'developing'
          : familyResults.length ? 'onTrack'
            : 'developing';

  const parentExplanation =
    accurateButSlowAreas.length
      ? `Your child understands several topics but is still slow in: ${accurateButSlowAreas.slice(0, 3).join(', ')}. Short fluency sessions can help speed and confidence.`
      : fluentAreas.length
        ? `Your child is showing fluent responses in multiple ${domainNoun} topics. Keep up regular short practice to maintain this progress.`
        : 'Fluency data is still building. Continue regular practice to get a clearer fluency picture.';

  return { overallFluencyBand, accurateButSlowAreas, fluentAreas, automaticAreas, parentExplanation };
}

function buildRetentionParentSummary(retentionState = {}, labelFor = identityLabel) {
  const retainedSkills = (retentionState.retainedSkillIds || []).map(labelFor);
  const skillsDueForReview = (retentionState.skillsDueForReview || []).map(labelFor);
  const skillsNeedingRefresh = (retentionState.skillsNeedingRefresh || []).map(labelFor);

  const parentExplanation =
    skillsDueForReview.length || skillsNeedingRefresh.length
      ? 'Some skills are due for review to prevent forgetting. A short review cycle this week will help keep learning stable.'
      : 'Retention looks stable. Continue periodic review to maintain confidence over time.';

  return { retainedSkills, skillsDueForReview, skillsNeedingRefresh, parentExplanation };
}

function buildAssessmentParentSummary(assessmentResults = [], labelFor = identityLabel) {
  const list = Array.isArray(assessmentResults) ? assessmentResults : [];
  const latest = list[list.length - 1] || null;
  const previous = list[list.length - 2] || null;
  const latestScore = latest?.percentage ?? null;
  const previousScore = previous?.percentage ?? null;
  const scoreChange =
    latestScore !== null && previousScore !== null
      ? Math.round((latestScore - previousScore) * 10) / 10
      : null;
  const readinessBand = latest?.readinessScore?.readinessBand || 'developing';

  const latestSkillEntries = Object.entries(latest?.skillBreakdown || {});
  const improvedAreas = latestSkillEntries
    .filter(([, v]) => toNum(v.percentage) >= 75)
    .map(([skillId]) => labelFor(skillId));
  const weakAreas = latestSkillEntries
    .filter(([, v]) => toNum(v.percentage) < 60)
    .map(([skillId]) => labelFor(skillId));

  const parentExplanation =
    latestScore === null
      ? 'No assessment results yet. Once available, this section will show score trends and readiness.'
      : scoreChange === null
        ? `Latest assessment score is ${latestScore}%. Readiness is currently ${readinessBand}.`
        : `Latest assessment score is ${latestScore}% (${scoreChange >= 0 ? '+' : ''}${scoreChange} from previous). Readiness is ${readinessBand}.`;

  return { latestScore, previousScore, scoreChange, readinessBand, improvedAreas, weakAreas, parentExplanation };
}

function buildMistakeParentSummary(mistakeToMasteryPlans = [], labelFor = identityLabel) {
  const plans = Array.isArray(mistakeToMasteryPlans) ? mistakeToMasteryPlans : [];
  const latest = plans[plans.length - 1] || {};
  const likelyRootCauses = (latest.rootCauseSkillIds || []).map(labelFor);
  const recommendedRemediation = (latest.remediationQueue || []).slice(0, 5).map((q) => labelFor(q.skillId));
  const parentExplanation =
    likelyRootCauses.length
      ? `We identified likely root causes in ${likelyRootCauses.slice(0, 3).join(', ')}. Targeted review is recommended before moving to harder tasks.`
      : 'No major misconception pattern is currently flagged.';

  return { likelyRootCauses, recommendedRemediation: dedupe(recommendedRemediation), parentExplanation };
}

function buildWorkingQualityParentSummary(workingAnalysisSummary = {}) {
  const average = toNum(workingAnalysisSummary.averageWorkingQuality, 0);
  const missingWorkingCount = toNum(workingAnalysisSummary.missingWorkingCount, 0);
  const workingQualityBand =
    average >= 85 ? 'excellent'
      : average >= 65 ? 'good'
        : average >= 40 ? 'needsImprovement'
          : 'unreadable';
  const parentInsights = Array.isArray(workingAnalysisSummary.parentInsights)
    ? workingAnalysisSummary.parentInsights
    : [];
  const methodMistakes = Array.isArray(workingAnalysisSummary.methodMistakes)
    ? workingAnalysisSummary.methodMistakes
    : [];
  const guidance = workingAnalysisSummary.guidance || parentInsights.map((insight) => (
    insight.recommendation || insight.summary || insight.message || ''
  )).filter(Boolean).slice(0, 3);
  const fallbackGuidance = guidance.length ? guidance : [
    'Write each step clearly on a new line.',
    'Label the question number before each method.',
  ];
  const parentExplanation =
    parentInsights[0]?.summary || parentInsights[0]?.message || methodMistakes[0]?.studentExplanation || (
      missingWorkingCount > 0
      ? 'Some required working was missing. Please remind your child to upload written steps at the end of each session.'
      : workingQualityBand === 'needsImprovement' || workingQualityBand === 'unreadable'
        ? 'Working was uploaded, but clarity can improve. Clearer step-by-step writing will support better feedback.'
        : 'Working quality is generally good and supports clear review.'
    );

  return { workingQualityBand, missingWorkingCount, guidance: fallbackGuidance, parentExplanation };
}

function buildWeeklyParentActionPlan(options = {}) {
  const {
    masteryProgress = {},
    fluencySummary = {},
    retentionSummary = {},
    assessmentSummary = {},
    currentWeaknesses = [],
    recommendedNextActions = [],
    domainNoun = 'fraction',
  } = options;

  const weekFocus =
    currentWeaknesses.length
      ? `Strengthen ${currentWeaknesses.slice(0, 2).join(' and ')}`
      : `Maintain momentum in current ${domainNoun} skills`;

  const recommendedPracticeMinutes =
    masteryProgress.percentageMastered >= 60 ? 75
      : masteryProgress.percentageMastered >= 30 ? 90 : 105;
  const recommendedSkills = dedupe(currentWeaknesses).slice(0, 4);
  const recommendedFluencySessions = fluencySummary.accurateButSlowAreas?.length ? 3 : 2;
  const recommendedReviewSessions = retentionSummary.skillsDueForReview?.length ? 3 : 1;
  const recommendedAssessment =
    assessmentSummary.readinessBand === 'ready' || assessmentSummary.readinessBand === 'strong'
      ? 'Attempt a short progress assessment this week'
      : 'Focus on practice and review before the next assessment';

  const parentChecklist = [
    'Complete planned practice minutes over 4-5 short sessions.',
    `Review one weaker ${domainNoun} skill together at least twice this week.`,
    'Ensure working is uploaded at the end of each practice session.',
    'Encourage short fluency drills for accurate-but-slow topics.',
  ];

  if (recommendedNextActions.includes('uploadWorking')) {
    parentChecklist.unshift('Remind your child to submit written working after each session.');
  }

  return {
    weekFocus,
    recommendedPracticeMinutes,
    recommendedSkills,
    recommendedFluencySessions,
    recommendedReviewSessions,
    recommendedAssessment,
    parentChecklist,
  };
}

export {
  STATUS_BANDS,
  toNum,
  dedupe,
  identityLabel,
  stripTechnicalJargon,
  statusBandFromMetrics,
  buildMasteryProgressSummary,
  buildFluencyParentSummary,
  buildRetentionParentSummary,
  buildAssessmentParentSummary,
  buildMistakeParentSummary,
  buildWorkingQualityParentSummary,
  buildWeeklyParentActionPlan,
};

export default {
  STATUS_BANDS,
  buildMasteryProgressSummary,
  buildFluencyParentSummary,
  buildRetentionParentSummary,
  buildAssessmentParentSummary,
  buildMistakeParentSummary,
  buildWorkingQualityParentSummary,
  buildWeeklyParentActionPlan,
};
