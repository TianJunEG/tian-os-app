export const RECHECK_COMPLETION_RATIO = 0.8;
export const RECHECK_ACCURACY_THRESHOLD = 70;

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function evaluateRecheckReadiness(assignment = {}) {
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

export default {
  evaluateRecheckReadiness,
};
