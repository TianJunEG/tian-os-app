import { resolveDomainSkillGraph } from './domainSkillGraphResolver.js';
import {
  buildAdultActionCentre,
  buildUnifiedAdultIntelligenceModel,
} from './adultIntelligenceEngine.js';
// The pure summary builders now live in a shared, dependency-free module so the
// server-side aggregator (services/mathpath/parentDashboardAggregator.js) runs
// the exact same logic. This engine keeps the fractions/per-domain labelling and
// the heavy adult-intelligence orchestration; it re-exports the builders so
// existing importers are unaffected.
import {
  STATUS_BANDS,
  toNum,
  statusBandFromMetrics,
  buildMasteryProgressSummary,
  buildFluencyParentSummary,
  buildRetentionParentSummary,
  buildAssessmentParentSummary,
  buildMistakeParentSummary,
  buildWorkingQualityParentSummary,
  buildWeeklyParentActionPlan,
} from '../../../../shared/mathpath/dashboard/parentSummaryBuilders.js';

export {
  buildMasteryProgressSummary,
  buildFluencyParentSummary,
  buildRetentionParentSummary,
  buildAssessmentParentSummary,
  buildMistakeParentSummary,
  buildWorkingQualityParentSummary,
  buildWeeklyParentActionPlan,
};

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

function stripTechnicalJargon(text) {
  return String(text || '')
    .replace(/\bF\d{3}\b/g, '')                       // fractions skill code, e.g. F010
    .replace(/\bQF_F\d{3}_\d{3}\b/g, '')               // fractions question-family code
    .replace(/\b[A-Z]\d?-[A-Z]{2,5}-\d{2,3}\b/g, '')   // P6-style code, e.g. P6-PCT-01, P6-SPD-02
    .replace(/\s{2,}/g, ' ')
    .trim();
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
