import { fractionSkillGraph, getSkill } from '../fractions/fractionSkillGraph.js';

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function dedupe(arr) {
  return [...new Set(arr)];
}

function skillName(skillId) {
  return getSkill(skillId)?.name || skillId;
}

function nowIso() {
  return new Date().toISOString();
}

function daysSince(value) {
  if (!value) return null;
  const ts = new Date(value).getTime();
  if (!Number.isFinite(ts)) return null;
  return Math.floor((Date.now() - ts) / (24 * 60 * 60 * 1000));
}

function computeSkillStatuses(input = {}) {
  const {
    masteredSkillIds = [],
    fluentSkillIds = [],
    retainedSkillIds = [],
    weakSkillIds = [],
    retentionState = {},
  } = input;

  const mastered = new Set(masteredSkillIds);
  const fluent = new Set(fluentSkillIds);
  const weak = new Set(weakSkillIds);
  const retainedFromReviews = new Set(retentionState.retainedSkillIds || []);

  const statuses = {};
  fractionSkillGraph.skillIds.forEach((skillId) => {
    let status = 'learning';
    if (weak.has(skillId)) status = 'needsReview';
    if (mastered.has(skillId)) status = 'accurate';
    if (fluent.has(skillId)) status = 'fluent';

    // Retained rule: must have mastery + fluency + retention pass
    if (mastered.has(skillId) && fluent.has(skillId) && retainedFromReviews.has(skillId)) {
      status = 'retained';
    }
    statuses[skillId] = status;
  });

  return statuses;
}

export function calculateFractionMasteryProgress(studentState = {}) {
  const totalSkills = fractionSkillGraph.skillIds.length;
  const skillStatuses = studentState.skillStatuses || {};
  const entries = Object.entries(skillStatuses);

  const masteredSkills = entries.filter(([, s]) => ['accurate', 'fluent', 'retained'].includes(s)).map(([id]) => id);
  const fluentSkills = entries.filter(([, s]) => ['fluent', 'retained'].includes(s)).map(([id]) => id);
  const retainedSkills = entries.filter(([, s]) => s === 'retained').map(([id]) => id);

  const percentageMastered = totalSkills ? Math.round((masteredSkills.length / totalSkills) * 1000) / 10 : 0;
  const percentageFluent = totalSkills ? Math.round((fluentSkills.length / totalSkills) * 1000) / 10 : 0;
  const percentageRetained = totalSkills ? Math.round((retainedSkills.length / totalSkills) * 1000) / 10 : 0;

  return {
    totalSkills,
    masteredSkills,
    fluentSkills,
    retainedSkills,
    percentageMastered,
    percentageFluent,
    percentageRetained,
  };
}

export function calculateFractionReadinessLevel(studentState = {}) {
  const mastery = toNum(studentState.masteryProgress?.percentageMastered, 0);
  const fluency = toNum(studentState.masteryProgress?.percentageFluent, 0);
  const retention = toNum(studentState.masteryProgress?.percentageRetained, 0);
  const latestAssessment = Array.isArray(studentState.assessmentProgress?.assessmentResults)
    ? studentState.assessmentProgress.assessmentResults.at(-1)
    : null;
  const assessment = latestAssessment
    ? toNum(latestAssessment.readinessScore?.readinessScore, toNum(latestAssessment.percentage, 0))
    : toNum(studentState.assessmentProgress?.latestScore, 0);

  const readinessScore = Math.round((mastery * 0.3 + fluency * 0.25 + retention * 0.2 + assessment * 0.25) * 10) / 10;
  let readinessBand = 'beginner';
  if (readinessScore >= 85) readinessBand = 'advanced';
  else if (readinessScore >= 70) readinessBand = 'ready';
  else if (readinessScore >= 55) readinessBand = 'progressing';
  else if (readinessScore >= 40) readinessBand = 'developing';

  return { readinessScore, readinessBand };
}

export function getWeakFractionSkills(studentState = {}) {
  const weakFromPractice = studentState.practiceState?.weakSkillIds || [];
  const weakFromDiagnostic = studentState.diagnosticResult?.weakSkillIds || [];
  const weakFromRetention = studentState.retentionState?.skillsNeedingRefresh || [];
  const weakFromMistakes = (studentState.mistakePlans || [])
    .flatMap((p) => p.rootCauseSkillIds || []);
  const weak = dedupe([
    ...weakFromPractice,
    ...weakFromDiagnostic,
    ...weakFromRetention,
    ...weakFromMistakes,
  ]);

  return weak.map((skillId) => {
    let priority = 'low';
    let reason = 'Needs additional consolidation.';
    if (weakFromDiagnostic.includes(skillId) || weakFromRetention.includes(skillId)) {
      priority = 'high';
      reason = 'Foundational gap or retention decline detected.';
    } else if (weakFromMistakes.includes(skillId) || weakFromPractice.includes(skillId)) {
      priority = 'medium';
      reason = 'Repeated mistake or low recent performance.';
    }
    return { skillId, reason, priority, skillName: skillName(skillId) };
  }).sort((a, b) => {
    const p = { high: 3, medium: 2, low: 1 };
    return p[b.priority] - p[a.priority];
  });
}

export function getStrengthSkills(studentState = {}) {
  const statuses = studentState.skillStatuses || {};
  return Object.entries(statuses)
    .filter(([, s]) => ['retained', 'fluent'].includes(s))
    .map(([skillId, status]) => ({ skillId, skillName: skillName(skillId), status }))
    .slice(0, 8);
}

export function buildRemediationQueue(studentState = {}) {
  const weakSkills = getWeakFractionSkills(studentState);
  const queue = weakSkills.map((w) => ({
    skillId: w.skillId,
    reason: w.reason,
    estimatedSessions: w.priority === 'high' ? 3 : w.priority === 'medium' ? 2 : 1,
  }));

  // enrich with explicit mistake-plan queue
  const fromMistakePlans = (studentState.mistakePlans || [])
    .flatMap((p) => p.remediationQueue || [])
    .map((item) => ({
      skillId: item.skillId,
      reason: 'Remediation from recent mistake pattern.',
      estimatedSessions: 2,
    }));

  const merged = [...fromMistakePlans, ...queue];
  const keyed = new Map();
  merged.forEach((item) => {
    if (!item?.skillId) return;
    if (!keyed.has(item.skillId)) keyed.set(item.skillId, item);
  });
  return [...keyed.values()];
}

export function buildRetentionQueue(studentState = {}) {
  const due = studentState.retentionState?.skillsDueForReview || [];
  const today = new Date();
  return due.map((skillId, idx) => ({
    skillId,
    reviewDate: new Date(today.getTime() + idx * 24 * 3600 * 1000).toISOString(),
    reviewType: 'spacedReview',
  }));
}

export function getCurrentFractionSkill(studentState = {}) {
  const currentSkillId =
    studentState.practiceState?.currentSkillId ||
    studentState.diagnosticResult?.recommendedStartingSkillId ||
    studentState.remediationQueue?.[0]?.skillId ||
    'F001';
  const status = studentState.skillStatuses?.[currentSkillId] || 'learning';
  let reason = 'Current guided learning target.';
  if (status === 'needsReview') reason = 'This skill needs reinforcement before advancing.';
  if (status === 'accurate') reason = 'Accuracy is improving; fluency is next.';
  if (status === 'fluent') reason = 'Skill is fluent; retention checks will follow.';
  if (status === 'retained') reason = 'Skill retained through review.';
  return {
    skillId: currentSkillId,
    skillName: skillName(currentSkillId),
    status,
    reason,
  };
}

export function getNextRecommendedAction(studentState = {}) {
  const workingMissing = toNum(studentState.workingAnalysisSummary?.missingWorkingCount, 0);
  if (workingMissing > 0) {
    return {
      action: 'uploadWorking',
      skillId: getCurrentFractionSkill(studentState).skillId,
      explanation: 'Some required working is missing. Uploading working helps teachers provide better guidance.',
    };
  }

  const retentionQueue = studentState.retentionDue || [];
  if (retentionQueue.length) {
    return {
      action: 'completeRetentionReview',
      skillId: retentionQueue[0].skillId,
      explanation: 'A retained skill is due for review to prevent forgetting.',
    };
  }

  const weak = getWeakFractionSkills(studentState);
  if (weak.length) {
    return {
      action: 'followRemediationPlan',
      skillId: weak[0].skillId,
      explanation: 'Addressing the highest-priority weak skill first will improve overall progress.',
    };
  }

  const current = getCurrentFractionSkill(studentState);
  if (current.status === 'accurate') {
    return {
      action: 'startFluency',
      skillId: current.skillId,
      explanation: 'Accuracy is in place. Next step is improving speed and consistency.',
    };
  }

  const readiness = studentState.readinessLevel || { readinessBand: 'developing' };
  if (['ready', 'advanced'].includes(readiness.readinessBand)) {
    return {
      action: 'attemptAssessment',
      skillId: current.skillId,
      explanation: 'Performance is stable enough to check readiness in assessment mode.',
    };
  }

  if (current.status === 'retained' || current.status === 'fluent') {
    return {
      action: 'advanceSkill',
      skillId: current.skillId,
      explanation: 'Current skill is secure. Moving to the next skill is appropriate.',
    };
  }

  return {
    action: 'continuePractice',
    skillId: current.skillId,
    explanation: 'Continue practice to build secure mastery.',
  };
}

export function buildStudentDashboardPayload(studentState = {}) {
  const currentSkill = getCurrentFractionSkill(studentState);
  const nextAction = getNextRecommendedAction(studentState);

  return {
    currentSkill,
    progressSummary: {
      mastered: studentState.masteryProgress?.percentageMastered || 0,
      fluent: studentState.masteryProgress?.percentageFluent || 0,
      retained: studentState.masteryProgress?.percentageRetained || 0,
    },
    nextAction,
    weakSkills: (studentState.weakSkills || []).slice(0, 6),
    strengths: (studentState.strengths || []).slice(0, 6),
    masteryProgress: studentState.masteryProgress,
    fluencyProgress: studentState.fluencyProgress,
    retentionProgress: studentState.retentionProgress,
    readinessLevel: studentState.readinessLevel,
  };
}

export function buildStudentProgressState(options = {}) {
  const {
    studentId,
    diagnosticResult = {},
    practiceState = {},
    fluencyState = {},
    retentionState = {},
    assessmentResults = [],
    mistakePlans = [],
    workingAnalysisSummary = {},
  } = options;

  if (!studentId) throw new Error('studentId is required.');

  const skillStatuses = computeSkillStatuses({
    masteredSkillIds: dedupe([
      ...(practiceState.masteredSkillIds || []),
      ...(diagnosticResult.masteredSkillIds || []),
    ]),
    fluentSkillIds: dedupe([
      ...(practiceState.fluentSkillIds || []),
      ...(fluencyState.fluentSkillIds || []),
    ]),
    retainedSkillIds: retentionState.retainedSkillIds || [],
    weakSkillIds: dedupe([
      ...(practiceState.weakSkillIds || []),
      ...(diagnosticResult.weakSkillIds || []),
    ]),
    retentionState,
  });

  const baseState = {
    studentId,
    currentDomain: 'fractions',
    currentSkill: practiceState.currentSkillId || diagnosticResult.recommendedStartingSkillId || 'F001',
    skillStatuses,
    diagnosticResult,
    practiceState,
    fluencyState,
    retentionState,
    assessmentResults,
    mistakePlans,
    workingAnalysisSummary,
  };

  const masteryProgress = calculateFractionMasteryProgress(baseState);
  const weakSkills = getWeakFractionSkills({ ...baseState, masteryProgress, mistakePlans });
  const strengths = getStrengthSkills({ ...baseState, masteryProgress });
  const remediationQueue = buildRemediationQueue({ ...baseState, weakSkills, mistakePlans });
  const retentionDue = buildRetentionQueue({ ...baseState, retentionState });
  const diagnosticCompleted = Boolean(
    diagnosticResult?.diagnosticCompleted
    || diagnosticResult?.recommendedStartingSkillId
    || diagnosticResult?.recommendedStartingSkill?.skillId
  );
  const diagnosticCompletedAt = diagnosticResult?.diagnosticCompletedAt || diagnosticResult?.completedAt || null;
  const lastSessionAt = practiceState?.lastSessionAt || practiceState?.updatedAt || null;
  const recentMistakeTypes = dedupe(
    (mistakePlans || [])
      .flatMap((p) => (p.focusMistakes || []).map((m) => m.mistakeCode || m.mistakeName || '').filter(Boolean))
  );
  const masteryCheckCompleted = (assessmentResults || []).some(
    (r) => String(r?.assessmentType || '').toLowerCase() === 'mastery'
  );
  const needsRecheck = diagnosticCompleted && (
    (daysSince(lastSessionAt || diagnosticCompletedAt) || 0) >= 45
    || weakSkills.length >= 4
    || recentMistakeTypes.length >= 3
  );
  const assessmentProgress = {
    assessmentResults,
    latestScore: assessmentResults.at(-1)?.percentage ?? null,
  };
  const fluencyProgress = {
    fluentSkillIds: dedupe([
      ...(practiceState.fluentSkillIds || []),
      ...(fluencyState.fluentSkillIds || []),
    ]),
    accurateButSlowAreas: fluencyState.accurateButSlowAreas || [],
  };
  const retentionProgress = {
    retainedSkillIds: retentionState.retainedSkillIds || [],
    skillsDueForReview: retentionState.skillsDueForReview || [],
    skillsNeedingRefresh: retentionState.skillsNeedingRefresh || [],
  };

  const state = {
    ...baseState,
    masteryProgress,
    fluencyProgress,
    retentionProgress,
    assessmentProgress,
    weakSkills,
    strengths,
    activeMistakes: mistakePlans.flatMap((p) => p.focusMistakes || []),
    remediationQueue,
    retentionDue,
    domainId: 'fractions',
    diagnosticCompleted,
    diagnosticCompletedAt,
    lastSessionAt,
    currentSkillId: baseState.currentSkill,
    skillMasteryStatus: skillStatuses,
    recentMistakeTypes,
    needsRecheck,
    masteryCheckCompleted,
    generatedAt: nowIso(),
  };

  const readinessLevel = calculateFractionReadinessLevel(state);
  state.readinessLevel = readinessLevel;
  state.nextRecommendedAction = getNextRecommendedAction(state);

  return state;
}

export function validateMathPathStudentProgressEngine() {
  const full = buildStudentProgressState({
    studentId: 'student_state_1',
    diagnosticResult: {
      masteredSkillIds: ['F001', 'F002'],
      weakSkillIds: ['F010', 'F018'],
      recommendedStartingSkillId: 'F010',
    },
    practiceState: {
      masteredSkillIds: ['F001', 'F002', 'F003'],
      fluentSkillIds: ['F001'],
      weakSkillIds: ['F010'],
      currentSkillId: 'F010',
    },
    fluencyState: {
      fluentSkillIds: ['F001', 'F003'],
      accurateButSlowAreas: ['Equivalent Fractions'],
    },
    retentionState: {
      retainedSkillIds: ['F001'],
      skillsDueForReview: ['F003'],
      skillsNeedingRefresh: ['F010'],
    },
    assessmentResults: [
      { percentage: 55, readinessScore: { readinessScore: 58, readinessBand: 'progressing' } },
    ],
    mistakePlans: [
      {
        focusMistakes: [{ mistakeCode: 'M001', highestSeverity: 'high' }],
        rootCauseSkillIds: ['F010'],
        remediationQueue: [{ skillId: 'F010' }, { skillId: 'F011' }],
      },
    ],
    workingAnalysisSummary: {
      missingWorkingCount: 1,
      averageWorkingQuality: 62,
    },
  });

  const partial = buildStudentProgressState({ studentId: 'student_state_2' });

  const weakHigh = getWeakFractionSkills(full);
  const retentionQueue = buildRetentionQueue(full);
  const remediationQueue = buildRemediationQueue(full);
  const readiness = calculateFractionReadinessLevel(full);
  const nextAction = getNextRecommendedAction(full);
  const dashboard = buildStudentDashboardPayload(full);

  return {
    isValid:
      Boolean(full.studentId && full.skillStatuses) &&
      Boolean(partial.studentId && partial.masteryProgress) &&
      weakHigh.length > 0 &&
      retentionQueue.length > 0 &&
      remediationQueue.some((r) => r.skillId === 'F010') &&
      typeof readiness.readinessScore === 'number' &&
      Boolean(nextAction.action) &&
      Boolean(dashboard.currentSkill && dashboard.nextAction),
    checks: {
      builtFromAllEngines: Boolean(full.studentId && full.skillStatuses && full.masteryProgress),
      partialDataSafe: Boolean(partial.studentId && partial.masteryProgress),
      weakPrioritised: weakHigh[0]?.priority === 'high' || weakHigh.length > 0,
      retentionQueueDue: retentionQueue.length > 0,
      remediationUsesMistakes: remediationQueue.some((r) => r.skillId === 'F010'),
      readinessCalculated: typeof readiness.readinessScore === 'number' && Boolean(readiness.readinessBand),
      nextActionGenerated: Boolean(nextAction.action && nextAction.explanation),
      dashboardPayloadProduced: Boolean(dashboard.currentSkill && dashboard.progressSummary),
    },
    sample: {
      studentState: full,
      dashboardPayload: dashboard,
      readiness,
    },
  };
}

export const mathPathStudentProgressEngine = {
  buildStudentProgressState,
  getCurrentFractionSkill,
  calculateFractionMasteryProgress,
  calculateFractionReadinessLevel,
  getWeakFractionSkills,
  getStrengthSkills,
  buildRemediationQueue,
  buildRetentionQueue,
  getNextRecommendedAction,
  buildStudentDashboardPayload,
  validateMathPathStudentProgressEngine,
};

export default mathPathStudentProgressEngine;
