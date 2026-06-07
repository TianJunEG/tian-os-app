import { evaluateMasteryCriteria } from './masteryCriteriaEngine.js';

export const RECHECK_COMPLETION_RATIO = 0.8;
export const RECHECK_ACCURACY_THRESHOLD = 70;

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function baseCompletionReadiness(assignment = {}) {
  const completion = assignment.completion || {};
  const attempted = num(completion.questionsAttempted);
  const target = num(assignment.targetQuestionCount || completion.questionsAssigned);
  const accuracy = num(completion.accuracy);

  if (assignment.status === 'completed') {
    return {
      recommended: true,
      reason: 'Recovery pack completed.',
      attempted,
      target,
      accuracy,
    };
  }

  if (target > 0 && attempted >= target * RECHECK_COMPLETION_RATIO && accuracy >= RECHECK_ACCURACY_THRESHOLD) {
    return {
      recommended: true,
      reason: 'At least 80% complete with 70% or higher accuracy.',
      attempted,
      target,
      accuracy,
    };
  }

  return {
    recommended: false,
    reason: 'Keep practising before recheck.',
    attempted,
    target,
    accuracy,
  };
}

export function evaluateRecheckReadiness(assignment = {}, { learningPath = null, evidence = {} } = {}) {
  const base = baseCompletionReadiness(assignment);

  if (!assignment.learningPathId) {
    return {
      ...base,
      reason: base.recommended
        ? `${base.reason} Legacy assignment has no learning path criteria.`
        : base.reason,
      learningPathReady: null,
      legacyAssignment: true,
    };
  }

  const mastery = evaluateMasteryCriteria({ assignment, learningPath, evidence });
  if (!base.recommended) {
    return {
      ...base,
      learningPathReady: mastery.readyForRecheck,
      mastery,
    };
  }

  if (!mastery.readyForRecheck) {
    return {
      ...base,
      recommended: false,
      reason: `Complete the learning path before recheck: ${mastery.missingCriteria.join(', ')}.`,
      learningPathReady: false,
      mastery,
    };
  }

  return {
    ...base,
    reason: `${base.reason} Learning path criteria met.`,
    learningPathReady: true,
    mastery,
  };
}

export default {
  evaluateRecheckReadiness,
};
