import { fractionSkillGraph, getSkill, getPrerequisites } from '../fractions/fractionSkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from '../fractions/fractionQuestionFamilies.js';
import { buildStudentProgressState } from '../state/mathPathStudentProgressEngine.js';
import { getFractionMistakeTaxonomy } from '../fractions/fractionMistakeToMasteryEngine.js';
import {
  buildTutorInterventionQueue,
  buildUnifiedAdultIntelligenceModel,
} from './adultIntelligenceEngine.js';

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function skillName(skillId) {
  return getSkill(skillId)?.name || skillId;
}

function familyName(questionFamilyId) {
  return getQuestionFamily(questionFamilyId)?.name || questionFamilyId;
}

function dedupe(arr) {
  return [...new Set(arr)];
}

function flattenMistakePlans(mistakePlans = []) {
  return (mistakePlans || []).flatMap((plan) => {
    const focus = plan.focusMistakes || [];
    return focus.map((m) => ({
      ...m,
      remediationQueue: plan.remediationQueue || [],
      rootCauseSkillIds: plan.rootCauseSkillIds || [],
    }));
  });
}

function buildPrerequisiteChain(skillId) {
  const chain = [];
  const visited = new Set();
  function walk(id) {
    if (visited.has(id)) return;
    visited.add(id);
    const prereqs = getPrerequisites(id);
    prereqs.forEach((p) => walk(p));
    chain.push(id);
  }
  walk(skillId);
  return chain;
}

export function buildRootCauseAnalysis(options = {}) {
  const {
    studentProgressState = {},
    skillGraph = fractionSkillGraph,
    diagnosticResult = {},
    mistakePlans = [],
  } = options;

  const weakFromState = (studentProgressState.weakSkills || []).map((w) => w.skillId);
  const weakFromDiagnostic = diagnosticResult.weakSkillIds || [];
  const weakSkillIds = dedupe([...weakFromState, ...weakFromDiagnostic]);
  const mistakeRoots = dedupe((mistakePlans || []).flatMap((p) => p.rootCauseSkillIds || []));

  return weakSkillIds.map((weakSkillId) => {
    const prereqChain = buildPrerequisiteChain(weakSkillId);
    const suspectedRootCauseSkillIds = prereqChain.filter((id) => mistakeRoots.includes(id)).length
      ? prereqChain.filter((id) => mistakeRoots.includes(id))
      : prereqChain.slice(0, Math.max(1, prereqChain.length - 1));
    const severity = diagnosticResult.weakSkillIds?.includes(weakSkillId) ? 'high' : 'medium';
    const evidence = [
      diagnosticResult.weakSkillIds?.includes(weakSkillId) ? 'Flagged as weak in diagnostic scan.' : null,
      mistakeRoots.length ? 'Recurring mistake plan indicates prerequisite dependency.' : null,
    ].filter(Boolean);

    return {
      weakSkillId,
      weakSkillName: skillName(weakSkillId),
      suspectedRootCauseSkillIds,
      prerequisiteChain: prereqChain,
      severity,
      evidence,
      recommendedIntervention:
        severity === 'high'
          ? 'reteachConcept'
          : 'assignTargetedPractice',
    };
  });
}

export function buildMistakeClusterSummary(mistakePlans = []) {
  const taxonomy = getFractionMistakeTaxonomy();
  const taxMap = new Map(taxonomy.map((t) => [t.code, t]));
  const clusters = new Map();
  flattenMistakePlans(mistakePlans).forEach((m) => {
    const code = m.mistakeCode || m.suspectedMistakeCode;
    if (!code) return;
    if (!clusters.has(code)) {
      clusters.set(code, {
        mistakeCode: code,
        mistakeName: taxMap.get(code)?.title || code,
        frequency: 0,
        severity: 'low',
        affectedSkills: new Set(),
        remediationSkills: new Set(),
      });
    }
    const row = clusters.get(code);
    row.frequency += toNum(m.count, 1);
    if (m.highestSeverity === 'high') row.severity = 'high';
    else if (m.highestSeverity === 'medium' && row.severity !== 'high') row.severity = 'medium';
    (m.rootCauseSkillIds || []).forEach((id) => row.affectedSkills.add(id));
    (taxMap.get(code)?.remediationSkillIds || []).forEach((id) => row.remediationSkills.add(id));
  });

  return [...clusters.values()].map((c) => ({
    mistakeCode: c.mistakeCode,
    mistakeName: c.mistakeName,
    frequency: c.frequency,
    severity: c.severity,
    affectedSkills: [...c.affectedSkills],
    remediationSkills: [...c.remediationSkills],
    tutorExplanation: `${c.mistakeCode} ${c.mistakeName} appears ${c.frequency} time(s). Focus on remediation skills: ${[...c.remediationSkills].join(', ') || 'none'}.`,
  }));
}

export function buildFluencyBottlenecks(fluencyState = {}) {
  const rows = fluencyState.questionFamilyResults || [];
  return rows.map((r) => {
    const family = getQuestionFamily(r.questionFamilyId);
    const benchmarkTime = family?.fluencyTargetSeconds ?? null;
    let issueType = 'notEnoughAttempts';
    if (r.status === 'accurateButSlow') issueType = 'accurateButSlow';
    else if (toNum(r.accuracy, 0) < 75 && toNum(r.averageTime, 0) <= toNum(benchmarkTime, 999)) issueType = 'fastButInaccurate';
    else if (toNum(r.consistencyScore, 0) < 60) issueType = 'inconsistent';
    else if (r.status === 'weak' || toNum(r.accuracy, 0) < 75) issueType = 'fastButInaccurate';

    const recommendation =
      issueType === 'accurateButSlow'
        ? 'runFluencyDrill'
        : issueType === 'fastButInaccurate'
          ? 'assignTargetedPractice'
          : issueType === 'inconsistent'
            ? 'conductMiniAssessment'
            : 'continuePractice';

    return {
      skillId: r.skillId,
      skillName: skillName(r.skillId),
      questionFamilyId: r.questionFamilyId,
      questionFamilyName: familyName(r.questionFamilyId),
      issueType,
      accuracy: r.accuracy,
      averageTime: r.averageTime,
      benchmarkTime,
      recommendation,
    };
  }).filter((x) => x.issueType !== 'notEnoughAttempts');
}

export function buildRetentionRiskSummary(retentionState = {}) {
  const due = retentionState.skillsDueForReview || [];
  const refresh = retentionState.skillsNeedingRefresh || [];
  const retained = new Set(retentionState.retainedSkillIds || []);
  const all = dedupe([...due, ...refresh, ...retained]);

  return all.map((skillId, idx) => {
    const retentionStatus = refresh.includes(skillId)
      ? 'needsReview'
      : due.includes(skillId)
        ? 'reviewScheduled'
        : 'retained';
    const riskLevel =
      refresh.includes(skillId)
        ? 'high'
        : due.includes(skillId)
          ? 'medium'
          : 'low';
    return {
      skillId,
      skillName: skillName(skillId),
      retentionStatus,
      lastReviewedAt: retentionState.lastReviewedAt || null,
      nextReviewDue: due.includes(skillId)
        ? new Date(Date.now() + idx * 24 * 3600 * 1000).toISOString()
        : null,
      riskLevel,
      recommendation:
        riskLevel === 'high'
          ? 'scheduleRetentionReview'
          : riskLevel === 'medium'
            ? 'conductMiniAssessment'
            : 'continuePractice',
    };
  });
}

export function buildWorkingQualityTutorSummary(workingAnalysisSummary = {}) {
  const calculatorIntegrityFlags = workingAnalysisSummary.calculatorIntegrityFlags || [];
  const missingWorkingQuestions = workingAnalysisSummary.missingWorkingQuestions || [];
  const unreadableWorkingQuestions = workingAnalysisSummary.unreadableWorkingQuestions || [];
  const overallWorkingQuality = workingAnalysisSummary.averageWorkingQuality || null;
  const tutorRecommendations = [];

  if ((missingWorkingQuestions.length || toNum(workingAnalysisSummary.missingWorkingCount, 0) > 0)) {
    tutorRecommendations.push('reviewWorking');
  }
  if (unreadableWorkingQuestions.length || calculatorIntegrityFlags.some((f) => f.flagType === 'unreadableWorking')) {
    tutorRecommendations.push('reviewWorking');
  }
  if (!tutorRecommendations.length) tutorRecommendations.push('continuePractice');

  return {
    overallWorkingQuality,
    missingWorkingQuestions,
    unreadableWorkingQuestions,
    calculatorIntegrityFlags,
    tutorRecommendations: dedupe(tutorRecommendations),
  };
}

export function buildInterventionPriorities(options = {}) {
  const {
    rootCauseAnalysis = [],
    mistakeClusters = [],
    fluencyBottlenecks = [],
    retentionRisks = [],
    workingQualityConcerns = {},
  } = options;

  const list = [];
  rootCauseAnalysis.forEach((r) => {
    list.push({
      priorityRank: 0,
      skillId: r.weakSkillId,
      issueType: 'rootCause',
      severity: r.severity,
      reason: `Root weakness in ${r.weakSkillName}.`,
      recommendedAction: r.recommendedIntervention,
      estimatedSessions: r.severity === 'high' ? 3 : 2,
    });
  });
  fluencyBottlenecks.forEach((f) => {
    list.push({
      priorityRank: 0,
      skillId: f.skillId,
      issueType: f.issueType,
      severity: f.issueType === 'fastButInaccurate' ? 'high' : 'medium',
      reason: `${f.questionFamilyName} has ${f.issueType}.`,
      recommendedAction: f.recommendation,
      estimatedSessions: 2,
    });
  });
  retentionRisks.forEach((r) => {
    if (r.riskLevel === 'low') return;
    list.push({
      priorityRank: 0,
      skillId: r.skillId,
      issueType: 'retentionRisk',
      severity: r.riskLevel,
      reason: `Retention status is ${r.retentionStatus}.`,
      recommendedAction: r.recommendation,
      estimatedSessions: r.riskLevel === 'high' ? 2 : 1,
    });
  });
  mistakeClusters.forEach((m) => {
    list.push({
      priorityRank: 0,
      skillId: m.remediationSkills[0] || null,
      issueType: 'mistakeCluster',
      severity: m.severity,
      reason: `${m.mistakeCode} ${m.mistakeName} recurring.`,
      recommendedAction: m.severity === 'high' ? 'reteachConcept' : 'assignTargetedPractice',
      estimatedSessions: m.severity === 'high' ? 3 : 2,
    });
  });
  if ((workingQualityConcerns.missingWorkingQuestions || []).length) {
    list.push({
      priorityRank: 0,
      skillId: null,
      issueType: 'workingQuality',
      severity: 'medium',
      reason: 'Required working missing on recent questions.',
      recommendedAction: 'reviewWorking',
      estimatedSessions: 1,
    });
  }

  const sev = { high: 3, medium: 2, low: 1 };
  const ranked = list
    .sort((a, b) => (sev[b.severity] - sev[a.severity]) || (b.estimatedSessions - a.estimatedSessions))
    .map((item, idx) => ({ ...item, priorityRank: idx + 1 }));

  return ranked.slice(0, 12);
}

export function buildNextTutorSessionPlan(options = {}) {
  const {
    interventionPriorities = [],
    rootCauseAnalysis = [],
    fluencyBottlenecks = [],
    mistakeClusters = [],
  } = options;

  const top = interventionPriorities[0] || {};
  const topRoot = rootCauseAnalysis[0];
  const topFluency = fluencyBottlenecks[0];
  const topMistake = mistakeClusters[0];
  const focusSkillId = top.skillId || topRoot?.weakSkillId || topFluency?.skillId || 'F010';
  const focusSkillName = skillName(focusSkillId);

  const guidedFamilies = (topRoot?.suspectedRootCauseSkillIds || [focusSkillId])
    .flatMap((id) => getQuestionFamiliesBySkill(id).slice(0, 1).map((f) => f.id))
    .slice(0, 2);

  return {
    sessionGoal: `Strengthen ${focusSkillName} to support downstream fraction skills.`,
    estimatedDurationMinutes: 45,
    warmUp: '5 short mental fraction checks targeting prior prerequisites.',
    mainIntervention: topRoot
      ? `Reteach ${skillName(topRoot.suspectedRootCauseSkillIds[0] || focusSkillId)} with visual-to-symbolic transitions.`
      : `Address primary issue: ${top.issueType || 'practice accuracy'}.`,
    guidedPractice: guidedFamilies,
    independentPractice: {
      questionFamilyIds: guidedFamilies,
      recommendedQuestionCount: 10,
    },
    homeworkAssignment: {
      focusSkills: dedupe([focusSkillId, ...(topRoot?.suspectedRootCauseSkillIds || [])]).slice(0, 3),
      durationMinutes: 20,
    },
    successCriteria: topFluency
      ? `Reach at least 90% accuracy and closer-to-benchmark time in ${topFluency.questionFamilyName}.`
      : `Reach at least 90% accuracy in guided practice with clear working.`,
  };
}

export function buildSuggestedTutorAssignments(options = {}) {
  const {
    interventionPriorities = [],
    retentionRisks = [],
    fluencyBottlenecks = [],
    rootCauseAnalysis = [],
  } = options;

  const assignments = [];

  rootCauseAnalysis.slice(0, 3).forEach((root) => {
    assignments.push({
      assignmentType: 'remediation',
      skillId: root.weakSkillId,
      questionFamilyIds: getQuestionFamiliesBySkill(root.weakSkillId).slice(0, 2).map((f) => f.id),
      recommendedQuestionCount: 8,
      workingRequired: true,
      reason: `Root-cause reinforcement for ${root.weakSkillName}.`,
    });
  });

  fluencyBottlenecks.slice(0, 2).forEach((f) => {
    assignments.push({
      assignmentType: 'fluency',
      skillId: f.skillId,
      questionFamilyIds: [f.questionFamilyId],
      recommendedQuestionCount: 10,
      workingRequired: false,
      reason: `Fluency bottleneck: ${f.issueType}.`,
    });
  });

  retentionRisks
    .filter((r) => ['high', 'medium'].includes(r.riskLevel))
    .slice(0, 2)
    .forEach((r) => {
      assignments.push({
        assignmentType: 'retentionReview',
        skillId: r.skillId,
        questionFamilyIds: getQuestionFamiliesBySkill(r.skillId).slice(0, 1).map((f) => f.id),
        recommendedQuestionCount: 6,
        workingRequired: true,
        reason: `Retention risk level ${r.riskLevel}.`,
      });
    });

  if (interventionPriorities.some((p) => p.issueType === 'workingQuality')) {
    assignments.push({
      assignmentType: 'workingPractice',
      skillId: interventionPriorities.find((p) => p.skillId)?.skillId || rootCauseAnalysis[0]?.weakSkillId || 'F010',
      questionFamilyIds: getQuestionFamiliesBySkill(rootCauseAnalysis[0]?.weakSkillId || 'F010').slice(0, 1).map((f) => f.id),
      recommendedQuestionCount: 4,
      workingRequired: true,
      reason: 'Improve step clarity and working completeness.',
    });
  }

  assignments.push({
    assignmentType: 'assessmentPrep',
    skillId: rootCauseAnalysis[0]?.weakSkillId || 'F018',
    questionFamilyIds: getQuestionFamiliesBySkill(rootCauseAnalysis[0]?.weakSkillId || 'F018').slice(0, 2).map((f) => f.id),
    recommendedQuestionCount: 8,
    workingRequired: true,
    reason: 'Prepare for next progress check.',
  });

  return assignments;
}

export function buildTutorMathPathDashboard(options = {}) {
  const {
    studentId,
    studentProgressState = null,
    diagnosticResult = {},
    practiceState = {},
    fluencyState = {},
    retentionState = {},
    assessmentResults = [],
    mistakePlans = [],
    workingAnalysisSummary = {},
    workingSessions = [],
    attempts = [],
    helpRequests = [],
  } = options;

  const resolvedState =
    studentProgressState ||
    buildStudentProgressState({
      studentId,
      diagnosticResult,
      practiceState,
      fluencyState,
      retentionState,
      assessmentResults,
      mistakePlans,
      workingAnalysisSummary,
    });

  const rootCauseAnalysis = buildRootCauseAnalysis({
    studentProgressState: resolvedState,
    skillGraph: fractionSkillGraph,
    diagnosticResult,
    mistakePlans,
  });
  const mistakeClusters = buildMistakeClusterSummary(mistakePlans);
  const fluencyBottlenecks = buildFluencyBottlenecks(fluencyState);
  const retentionRisks = buildRetentionRiskSummary(retentionState);
  const workingQualityConcerns = buildWorkingQualityTutorSummary(workingAnalysisSummary);
  const interventionPriorities = buildInterventionPriorities({
    rootCauseAnalysis,
    mistakeClusters,
    fluencyBottlenecks,
    retentionRisks,
    workingQualityConcerns,
  });
  const nextSessionPlan = buildNextTutorSessionPlan({
    interventionPriorities,
    rootCauseAnalysis,
    fluencyBottlenecks,
    mistakeClusters,
  });
  const suggestedAssignments = buildSuggestedTutorAssignments({
    interventionPriorities,
    retentionRisks,
    fluencyBottlenecks,
    rootCauseAnalysis,
  });

  const overallTutorSummary =
    rootCauseAnalysis.length
      ? `${rootCauseAnalysis[0].suspectedRootCauseSkillIds[0] || rootCauseAnalysis[0].weakSkillId} ${skillName(rootCauseAnalysis[0].suspectedRootCauseSkillIds[0] || rootCauseAnalysis[0].weakSkillId)} appears to be the root cause affecting ${rootCauseAnalysis[0].weakSkillId} ${rootCauseAnalysis[0].weakSkillName}.`
      : 'No critical root-cause pattern currently flagged. Continue routine monitoring.';

  const tutorNotes = {
    currentSkill: resolvedState.currentSkill,
    nextAction: resolvedState.nextRecommendedAction,
    readinessBand: resolvedState.readinessLevel?.readinessBand || 'developing',
    readinessScore: resolvedState.readinessLevel?.readinessScore || null,
  };
  const adultIntelligence = buildUnifiedAdultIntelligenceModel({
    studentId: resolvedState.studentId || studentId,
    audience: 'tutor',
    studentProgressState: resolvedState,
    diagnosticResult,
    practiceState,
    fluencyState,
    retentionState,
    assessmentResults,
    mistakePlans,
    workingAnalysisSummary,
    workingSessions,
    attempts,
    helpRequests,
  });

  return {
    studentId: resolvedState.studentId || studentId,
    domainId: resolvedState.currentDomain || 'fractions',
    overallTutorSummary,
    rootCauseAnalysis,
    mistakeClusters,
    fluencyBottlenecks,
    retentionRisks,
    workingQualityConcerns,
    interventionPriorities,
    nextSessionPlan,
    suggestedAssignments,
    tutorHome: {
      studentsRequiringIntervention: adultIntelligence.supportFlags.length ? [adultIntelligence.studentId].filter(Boolean) : [],
      upcomingPriorities: adultIntelligence.recommendedActions,
      lessonRecommendations: [nextSessionPlan],
      recentMasteryGains: adultIntelligence.masterySignals.recentlyMasteredSkills,
      persistentMisconceptions: adultIntelligence.misconceptions,
    },
    tutorStudentProfile: {
      skillGraph: resolvedState.skillStatuses || {},
      masteryStatus: adultIntelligence.masterySignals,
      rootCauses: adultIntelligence.rootCauses,
      misconceptions: adultIntelligence.misconceptions,
      confidenceCalibration: adultIntelligence.confidenceSignals,
      workingEvidence: adultIntelligence.workingEvidence,
      interventionHistory: adultIntelligence.interventions,
    },
    tutorSessionPlanner: nextSessionPlan,
    tutorInterventionQueue: buildTutorInterventionQueue([adultIntelligence]),
    adultIntelligence,
    tutorNotes,
  };
}

export function validateTutorMathPathDashboardEngine() {
  const studentProgressState = buildStudentProgressState({
    studentId: 'tutor_student_1',
    diagnosticResult: {
      weakSkillIds: ['F018'],
      masteredSkillIds: ['F001', 'F002', 'F003'],
      recommendedStartingSkillId: 'F010',
    },
    practiceState: {
      weakSkillIds: ['F010', 'F018'],
      masteredSkillIds: ['F001', 'F002', 'F003'],
      currentSkillId: 'F010',
    },
    fluencyState: {
      questionFamilyResults: [
        { skillId: 'F018', questionFamilyId: 'QF_F018_001', status: 'accurateButSlow', accuracy: 90, averageTime: 28, consistencyScore: 65 },
        { skillId: 'F010', questionFamilyId: 'QF_F010_001', status: 'weak', accuracy: 55, averageTime: 16, consistencyScore: 48 },
      ],
      fluentSkillIds: ['F001'],
    },
    retentionState: {
      retainedSkillIds: ['F001'],
      skillsDueForReview: ['F003'],
      skillsNeedingRefresh: ['F010'],
    },
    assessmentResults: [{ percentage: 58, readinessScore: { readinessScore: 55, readinessBand: 'progressing' } }],
    mistakePlans: [
      {
        focusMistakes: [{ mistakeCode: 'M001', count: 3, highestSeverity: 'high' }],
        rootCauseSkillIds: ['F010'],
        remediationQueue: [{ skillId: 'F010' }, { skillId: 'F011' }],
      },
    ],
    workingAnalysisSummary: {
      averageWorkingQuality: 58,
      missingWorkingCount: 2,
      calculatorIntegrityFlags: [{ flagType: 'missingWorking', severity: 'medium', reason: 'Working missing' }],
      missingWorkingQuestions: ['q2'],
      unreadableWorkingQuestions: [],
    },
  });

  const dashboard = buildTutorMathPathDashboard({
    studentId: 'tutor_student_1',
    studentProgressState,
    diagnosticResult: studentProgressState.diagnosticResult,
    practiceState: studentProgressState.practiceState,
    fluencyState: studentProgressState.fluencyState,
    retentionState: studentProgressState.retentionState,
    assessmentResults: studentProgressState.assessmentResults,
    mistakePlans: studentProgressState.mistakePlans,
    workingAnalysisSummary: studentProgressState.workingAnalysisSummary,
    helpRequests: [{ skillId: 'F010', count: 2, latestAt: '2026-01-01T00:00:00.000Z' }],
  });

  const rootWithChain = dashboard.rootCauseAnalysis.find((r) => r.prerequisiteChain.length > 0);
  const mistakeClustered = dashboard.mistakeClusters.some((m) => m.frequency >= 1);
  const fluencySplit = dashboard.fluencyBottlenecks.some((b) => ['accurateButSlow', 'fastButInaccurate'].includes(b.issueType));
  const retentionSurfaced = dashboard.retentionRisks.length > 0;
  const workingIncluded = !!dashboard.workingQualityConcerns;
  const prioritiesRanked =
    dashboard.interventionPriorities.length > 0 &&
    dashboard.interventionPriorities[0].priorityRank === 1;
  const sessionPlanBuilt = !!dashboard.nextSessionPlan?.sessionGoal;
  const assignmentsHaveFamilies = dashboard.suggestedAssignments.every((a) => Array.isArray(a.questionFamilyIds));
  const adultModelBuilt = Boolean(dashboard.adultIntelligence?.whatShouldHappenNext && dashboard.tutorInterventionQueue.length);

  return {
    isValid:
      Boolean(dashboard.studentId) &&
      rootWithChain &&
      mistakeClustered &&
      fluencySplit &&
      retentionSurfaced &&
      workingIncluded &&
      prioritiesRanked &&
      sessionPlanBuilt &&
      assignmentsHaveFamilies &&
      adultModelBuilt,
    checks: {
      consumesStudentProgressState: Boolean(dashboard.studentId && studentProgressState),
      rootCauseHasPrerequisiteChain: Boolean(rootWithChain),
      mistakeClustersGrouped: mistakeClustered,
      fluencyBottlenecksDistinguished: fluencySplit,
      retentionRisksSurfaced: retentionSurfaced,
      workingConcernsIncluded: workingIncluded,
      interventionPrioritiesRanked: prioritiesRanked,
      nextSessionPlanGenerated: sessionPlanBuilt,
      assignmentsIncludeFamilyIds: assignmentsHaveFamilies,
      adultIntelligenceIncluded: adultModelBuilt,
    },
    sample: {
      dashboard,
      rootCauseExample: dashboard.rootCauseAnalysis[0] || null,
      nextSessionPlan: dashboard.nextSessionPlan,
    },
  };
}

export const tutorMathPathDashboardEngine = {
  buildTutorMathPathDashboard,
  buildRootCauseAnalysis,
  buildMistakeClusterSummary,
  buildFluencyBottlenecks,
  buildRetentionRiskSummary,
  buildWorkingQualityTutorSummary,
  buildInterventionPriorities,
  buildNextTutorSessionPlan,
  buildSuggestedTutorAssignments,
  buildUnifiedAdultIntelligenceModel,
  buildTutorInterventionQueue,
  validateTutorMathPathDashboardEngine,
};

export default tutorMathPathDashboardEngine;
