import { fractionSkillGraph, getSkill as getFractionSkill } from '../fractions/fractionSkillGraph.js';
import { resolveDomainSkillGraph } from './domainSkillGraphResolver.js';
import {
  buildAdultActionCentre,
  buildUnifiedAdultIntelligenceModel,
} from './adultIntelligenceEngine.js';

const STATUS_BANDS = ['needsSupport', 'developing', 'onTrack', 'strong', 'advanced'];

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function dedupe(arr) {
  return [...new Set(arr)];
}

// Build a skill-id → parent-friendly name labeller for a domain's skill lookup.
// Resolves a human name when the lookup knows the skill; otherwise returns the
// raw value (already-friendly strings pass straight through).
function makeLabeller(getSkillFn) {
  return function labelFor(value) {
    if (!value) return '';
    const skill = typeof getSkillFn === 'function' ? getSkillFn(value) : null;
    if (skill?.name) return skill.name;
    return String(value);
  };
}

// Default labeller preserves the prior fractions behaviour for any caller that
// does not supply a domain labeller.
const defaultLabel = makeLabeller(getFractionSkill);

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

export function buildMasteryProgressSummary(skillGraph = fractionSkillGraph, studentState = {}, labelFor = defaultLabel) {
  const totalSkills = skillGraph?.skillIds?.length || 0;
  const masteredSet = new Set(studentState.masteredSkillIds || []);
  const weakSet = new Set(studentState.weakSkillIds || []);
  const fluentSet = new Set(studentState.fluentSkillIds || []);
  const retainedSet = new Set(studentState.retainedSkillIds || []);

  const masteredSkills = [...masteredSet];
  const fluentSkills = [...fluentSet].filter((id) => masteredSet.has(id) || !weakSet.has(id));
  const retainedSkills = [...retainedSet];
  const weakSkills = [...weakSet];
  const inProgressSkills = skillGraph.skillIds.filter((id) => !masteredSet.has(id) && !weakSet.has(id));

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

export function buildFluencyParentSummary(fluencyState = {}, labelFor = defaultLabel) {
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
        ? 'Your child is showing fluent responses in multiple fraction topics. Keep up regular short practice to maintain this progress.'
        : 'Fluency data is still building. Continue regular practice to get a clearer fluency picture.';

  return { overallFluencyBand, accurateButSlowAreas, fluentAreas, automaticAreas, parentExplanation };
}

export function buildRetentionParentSummary(retentionState = {}, labelFor = defaultLabel) {
  const retainedSkills = (retentionState.retainedSkillIds || []).map(labelFor);
  const skillsDueForReview = (retentionState.skillsDueForReview || []).map(labelFor);
  const skillsNeedingRefresh = (retentionState.skillsNeedingRefresh || []).map(labelFor);

  const parentExplanation =
    skillsDueForReview.length || skillsNeedingRefresh.length
      ? 'Some skills are due for review to prevent forgetting. A short review cycle this week will help keep learning stable.'
      : 'Retention looks stable. Continue periodic review to maintain confidence over time.';

  return { retainedSkills, skillsDueForReview, skillsNeedingRefresh, parentExplanation };
}

export function buildAssessmentParentSummary(assessmentResults = [], labelFor = defaultLabel) {
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

export function buildMistakeParentSummary(mistakeToMasteryPlans = [], labelFor = defaultLabel) {
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

export function buildWorkingQualityParentSummary(workingAnalysisSummary = {}) {
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

export function buildWeeklyParentActionPlan(options = {}) {
  const {
    masteryProgress = {},
    fluencySummary = {},
    retentionSummary = {},
    assessmentSummary = {},
    currentWeaknesses = [],
    recommendedNextActions = [],
  } = options;

  const weekFocus =
    currentWeaknesses.length
      ? `Strengthen ${currentWeaknesses.slice(0, 2).join(' and ')}`
      : 'Maintain momentum in current fraction skills';

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
    'Review one weaker fraction skill together at least twice this week.',
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

export function buildParentMathPathSummary(options = {}) {
  const {
    studentId,
    domainId = 'fractions',
    diagnosticResult = {},
    practiceState = {},
    fluencyState = {},
    retentionState = {},
    assessmentResults = [],
    mistakeToMasteryPlans = [],
    workingAnalysisSummary = {},
    workingSessions = [],
    attempts = [],
    helpRequests = [],
  } = options;

  // Resolve the domain's skill graph + name lookup (defaults to fractions).
  // options.skillGraph / options.getSkill allow an explicit override (tests,
  // future per-level resolution).
  const resolved = resolveDomainSkillGraph(domainId);
  const skillGraph = options.skillGraph || resolved.skillGraph;
  const labelFor = makeLabeller(options.getSkill || resolved.getSkill);

  const masteryProgress = buildMasteryProgressSummary(skillGraph, {
    masteredSkillIds: practiceState.masteredSkillIds || diagnosticResult.masteredSkillIds || [],
    weakSkillIds: practiceState.weakSkillIds || diagnosticResult.weakSkillIds || [],
    fluentSkillIds: fluencyState.fluentSkillIds || [],
    retainedSkillIds: retentionState.retainedSkillIds || [],
  }, labelFor);
  const fluencySummary = buildFluencyParentSummary(fluencyState, labelFor);
  const retentionSummary = buildRetentionParentSummary(retentionState, labelFor);
  const assessmentSummary = buildAssessmentParentSummary(assessmentResults, labelFor);
  const mistakeSummary = buildMistakeParentSummary(mistakeToMasteryPlans, labelFor);
  const workingSummary = buildWorkingQualityParentSummary(workingAnalysisSummary);

  const currentWeaknesses = dedupe([
    ...(masteryProgress.weakSkills || []),
    ...(assessmentSummary.weakAreas || []),
    ...(mistakeSummary.likelyRootCauses || []),
  ]).slice(0, 6);

  const recentImprovements = dedupe([
    ...(assessmentSummary.improvedAreas || []),
    ...(masteryProgress.masteredSkills || []).slice(-3),
  ]).slice(0, 6);

  const recommendedNextActions = dedupe([
    currentWeaknesses.length ? 'followRemediationPlan' : null,
    fluencySummary.accurateButSlowAreas?.length ? 'startFluencyPractice' : null,
    retentionSummary.skillsDueForReview?.length ? 'reviewPreviousSkill' : null,
    workingSummary.missingWorkingCount > 0 ? 'uploadWorking' : null,
    assessmentSummary.readinessBand === 'ready' || assessmentSummary.readinessBand === 'strong' ? 'attemptAssessment' : 'continueCurrentSkill',
    masteryProgress.percentageMastered >= 70 && !currentWeaknesses.length ? 'moveToNextSkill' : null,
  ].filter(Boolean));

  const readinessScoreProxy =
    assessmentResults?.length
      ? toNum(assessmentResults[assessmentResults.length - 1]?.readinessScore?.readinessScore, 50)
      : (masteryProgress.percentageMastered + masteryProgress.percentageFluent) / 2;
  const overallStatus = statusBandFromMetrics({
    percentageMastered: masteryProgress.percentageMastered,
    readinessScore: readinessScoreProxy,
    weakCount: currentWeaknesses.length,
  });

  const weeklyActionPlan = buildWeeklyParentActionPlan({
    masteryProgress,
    fluencySummary,
    retentionSummary,
    assessmentSummary,
    currentWeaknesses,
    recommendedNextActions,
  });

  const narrative = stripTechnicalJargon(
    `${fluencySummary.parentExplanation} ${retentionSummary.parentExplanation} ${assessmentSummary.parentExplanation} Next week focus: ${weeklyActionPlan.weekFocus}.`
  );
  const adultIntelligence = buildUnifiedAdultIntelligenceModel({
    studentId,
    audience: 'parent',
    diagnosticResult,
    practiceState,
    fluencyState,
    retentionState,
    assessmentResults,
    mistakePlans: mistakeToMasteryPlans,
    workingAnalysisSummary,
    workingSessions,
    attempts,
    helpRequests,
  });

  return {
    studentId,
    domainId,
    overallStatus,
    masteryProgress,
    fluencySummary,
    retentionSummary,
    assessmentSummary,
    currentWeaknesses,
    recentImprovements,
    recommendedNextActions,
    parentFriendlyNarrative: narrative,
    weeklyActionPlan,
    mistakeSummary,
    workingSummary,
    parentHome: {
      overallProgress: masteryProgress.percentageMastered,
      currentFocusSkills: adultIntelligence.masterySignals.currentFocusSkills.map((skillId) => labelFor(skillId)),
      recentlyMasteredSkills: adultIntelligence.masterySignals.recentlyMasteredSkills,
      skillsRequiringAttention: adultIntelligence.masterySignals.skillsRequiringAttention,
      upcomingActivities: adultIntelligence.upcomingActivities,
      recommendedActions: adultIntelligence.recommendedActions,
    },
    parentStudentProfile: {
      masteryMap: masteryProgress,
      strengths: recentImprovements,
      weaknesses: currentWeaknesses,
      confidenceTrends: adultIntelligence.confidenceSignals,
      fluencyTrends: adultIntelligence.fluencySignals,
      retentionStatus: adultIntelligence.retentionSignals,
      learningHistory: adultIntelligence.timeline,
    },
    parentActionCentre: buildAdultActionCentre(adultIntelligence),
    parentWorkingReview: {
      workingEvidence: adultIntelligence.workingEvidence,
      helpRequests: adultIntelligence.supportFlags.filter((flag) => flag.flagType === 'student_help_request'),
    },
    parentTraining: adultIntelligence.parentTrainingRecommendations,
    adultIntelligence,
  };
}

export function validateParentMathPathDashboardEngine() {
  const partialSummary = buildParentMathPathSummary({
    studentId: 'p_1',
    domainId: 'fractions',
  });

  const fullSummary = buildParentMathPathSummary({
    studentId: 'p_2',
    domainId: 'fractions',
    diagnosticResult: { masteredSkillIds: ['F001', 'F002'], weakSkillIds: ['F010'] },
    practiceState: { masteredSkillIds: ['F001', 'F002', 'F003'], weakSkillIds: ['F010', 'F018'] },
    fluencyState: {
      questionFamilyResults: [
        { status: 'accurateButSlow', skillId: 'F018', displayName: 'Adding Different Denominators' },
        { status: 'fluent', skillId: 'F007', displayName: 'Compare Same Denominator' },
      ],
      fluentSkillIds: ['F007'],
    },
    retentionState: {
      retainedSkillIds: ['F001'],
      skillsDueForReview: ['F003'],
      skillsNeedingRefresh: ['F010'],
    },
    assessmentResults: [
      { percentage: 52, readinessScore: { readinessScore: 50, readinessBand: 'developing' }, skillBreakdown: { F010: { percentage: 45 }, F007: { percentage: 75 } }, fluencyBreakdown: {} },
      { percentage: 63, readinessScore: { readinessScore: 64, readinessBand: 'approaching' }, skillBreakdown: { F010: { percentage: 60 }, F007: { percentage: 82 } }, fluencyBreakdown: {} },
    ],
    mistakeToMasteryPlans: [
      {
      rootCauseSkillIds: ['F010'],
      remediationQueue: [{ skillId: 'F010' }, { skillId: 'F011' }],
      focusMistakes: [{ mistakeCode: 'M001', count: 3, highestSeverityLevel: 'major' }],
      interventionPathways: [{ pathway_id: 'PATH_FRA_M001_major' }],
      worksheetMappings: [{ worksheet_id: 'WS_FRA_M001' }],
    },
  ],
    workingAnalysisSummary: {
    averageWorkingQuality: 62,
    missingWorkingCount: 1,
  },
  helpRequests: [{ skillId: 'F010', count: 1, latestAt: '2026-01-01T00:00:00.000Z' }],
  });

  const hasNoCrashOnPartial = Boolean(partialSummary && partialSummary.masteryProgress);
  const internalIdsConverted = !fullSummary.currentWeaknesses.some((s) => /^F\d{3}$/.test(s));
  const fluencyDistinguishes = fullSummary.fluencySummary.accurateButSlowAreas.length > 0 && fullSummary.fluencySummary.fluentAreas.length > 0;
  const retentionShowsDue = fullSummary.retentionSummary.skillsDueForReview.length > 0;
  const assessmentTrend = toNum(fullSummary.assessmentSummary.scoreChange, 0) > 0;
  const weeklyPlanGenerated = Boolean(fullSummary.weeklyActionPlan?.weekFocus && fullSummary.weeklyActionPlan?.parentChecklist?.length);
  const noJargonInNarrative = !/\bF\d{3}\b|\bQF_F\d{3}_\d{3}\b/.test(fullSummary.parentFriendlyNarrative);
  const adultModelBuilt = Boolean(fullSummary.adultIntelligence?.whatIsHappening && fullSummary.parentActionCentre?.actions?.length);

  return {
    isValid:
      hasNoCrashOnPartial &&
      internalIdsConverted &&
      fluencyDistinguishes &&
      retentionShowsDue &&
      assessmentTrend &&
      weeklyPlanGenerated &&
      noJargonInNarrative &&
      adultModelBuilt &&
      STATUS_BANDS.includes(fullSummary.overallStatus),
    checks: {
      hasNoCrashOnPartial,
      internalIdsConverted,
      fluencyDistinguishes,
      retentionShowsDue,
      assessmentTrend,
      weeklyPlanGenerated,
      noJargonInNarrative,
      adultModelBuilt,
      overallStatusValid: STATUS_BANDS.includes(fullSummary.overallStatus),
    },
    sample: {
      partialSummary,
      fullSummary,
      weeklyActionPlan: fullSummary.weeklyActionPlan,
    },
  };
}

export const parentMathPathDashboardEngine = {
  buildParentMathPathSummary,
  buildMasteryProgressSummary,
  buildFluencyParentSummary,
  buildRetentionParentSummary,
  buildAssessmentParentSummary,
  buildMistakeParentSummary,
  buildWorkingQualityParentSummary,
  buildWeeklyParentActionPlan,
  buildUnifiedAdultIntelligenceModel,
  buildAdultActionCentre,
  validateParentMathPathDashboardEngine,
};

export default parentMathPathDashboardEngine;
