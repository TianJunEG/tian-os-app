import { getSkill } from './fractionSkillGraph.js';
import { getQuestionFamily } from './fractionQuestionFamilies.js';
import { calculateQuestionFluency } from './fractionFluencyEngine.js';

const REVIEW_DAYS = [1, 7, 30, 90, 180];
const RETENTION_STATUS = {
  RETAINED: 'retained',
  NEEDS_REVIEW: 'needsReview',
  FORGOTTEN: 'forgotten',
  REVIEW_SCHEDULED: 'reviewScheduled',
};

function toDate(value) {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function addDays(baseDate, days) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfDay(value) {
  const d = toDate(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

function skillRiskFromReviews(skillReviews = []) {
  if (!skillReviews.length) {
    return { riskLevel: 'medium', reason: 'No retention review history yet.' };
  }
  const latest = skillReviews
    .slice()
    .sort((a, b) => new Date(b.reviewedAt || b.updatedAt || 0) - new Date(a.reviewedAt || a.updatedAt || 0))[0];
  if (latest.retentionStatus === RETENTION_STATUS.FORGOTTEN) {
    return { riskLevel: 'high', reason: 'Most recent review indicates forgotten performance.' };
  }
  if (latest.retentionStatus === RETENTION_STATUS.NEEDS_REVIEW) {
    return { riskLevel: 'medium', reason: 'Recent review is accurate but not yet stable/fast.' };
  }
  return { riskLevel: 'low', reason: 'Recent review shows retained and fluent performance.' };
}

export function scheduleFractionRetentionReviews(skillId, masteredAt) {
  const masteredDate = toDate(masteredAt || new Date());
  return {
    skillId,
    reviews: REVIEW_DAYS.map((day) => ({
      day,
      dueDate: addDays(masteredDate, day).toISOString(),
      status: 'scheduled',
    })),
  };
}

export function getDueFractionRetentionReviews(studentState = {}, currentDate = new Date()) {
  const now = startOfDay(currentDate);
  const plans = studentState.retentionPlans || {};
  const due = [];

  Object.entries(plans).forEach(([skillId, plan]) => {
    (plan.reviews || []).forEach((review) => {
      if (review.status !== 'scheduled') return;
      const dueDate = startOfDay(review.dueDate);
      if (dueDate <= now) {
        due.push({
          skillId,
          day: review.day,
          dueDate: review.dueDate,
          status: review.status,
          questionFamilyIds: plan.questionFamilyIds || [],
        });
      }
    });
  });

  return due.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

export function scoreFractionRetentionReview(reviewAttempt = {}) {
  const {
    skillId,
    questionFamilyId,
    correct,
    timeTaken,
    confidence,
    previousFluencyLevel = 'notReady',
  } = reviewAttempt;

  const family = getQuestionFamily(questionFamilyId) || {
    id: questionFamilyId,
    fluencyTargetSeconds: 20,
    fluencyBenchmarks: { bronze: 30, silver: 20, gold: 12, platinum: 8 },
    workingRequired: false,
    mentalMathEligible: true,
  };

  const fluency = calculateQuestionFluency(
    { correct, timeTaken, confidence, skipped: false },
    family
  );

  let retentionStatus = RETENTION_STATUS.FORGOTTEN;
  let retained = false;
  let recommendation = 'reteachConcept';

  const guessed = String(confidence || '').toLowerCase().includes('guess');
  if (!correct) {
    retentionStatus = RETENTION_STATUS.FORGOTTEN;
    retained = false;
    recommendation = 'reteachConcept';
  } else if (guessed) {
    retentionStatus = RETENTION_STATUS.NEEDS_REVIEW;
    retained = false;
    recommendation = 'continuePractice';
  } else if (fluency.fluencyFlag === 'accurateButSlow') {
    retentionStatus = RETENTION_STATUS.NEEDS_REVIEW;
    retained = false;
    recommendation = 'fluencyDrill';
  } else if (['accurateAndFluent', 'automatic'].includes(fluency.fluencyFlag)) {
    retentionStatus = RETENTION_STATUS.RETAINED;
    retained = true;
    recommendation = previousFluencyLevel === 'platinum' ? 'scheduleRetention' : 'continuePractice';
  }

  const updatedSkillStatus =
    retentionStatus === RETENTION_STATUS.RETAINED
      ? 'retained'
      : retentionStatus === RETENTION_STATUS.NEEDS_REVIEW
        ? 'needsReview'
        : 'weak';

  return {
    retained,
    retentionStatus,
    updatedSkillStatus,
    recommendation,
    fluencyFlag: fluency.fluencyFlag,
    notes: fluency.notes || [],
  };
}

export function calculateFractionRetentionRisk(studentState = {}) {
  const reviewsBySkill = studentState.retentionHistory || {};
  const skillIds = Object.keys(reviewsBySkill);
  return skillIds.map((skillId) => {
    const { riskLevel, reason } = skillRiskFromReviews(reviewsBySkill[skillId]);
    return { skillId, riskLevel, reason };
  });
}

export function updateFractionRetentionState(studentState = {}, reviewResult = {}) {
  const next = {
    ...studentState,
    retentionPlans: { ...(studentState.retentionPlans || {}) },
    retentionHistory: { ...(studentState.retentionHistory || {}) },
    skillStatuses: { ...(studentState.skillStatuses || {}) },
  };

  const skillId = reviewResult.skillId;
  if (!skillId) return next;

  if (!next.retentionHistory[skillId]) next.retentionHistory[skillId] = [];
  next.retentionHistory[skillId].push({
    ...reviewResult,
    reviewedAt: new Date().toISOString(),
  });

  next.skillStatuses[skillId] = reviewResult.retentionStatus;

  const plan = next.retentionPlans[skillId];
  if (plan?.reviews?.length) {
    const pending = plan.reviews.find((r) => r.status === 'scheduled');
    if (pending) {
      pending.status = reviewResult.retentionStatus === RETENTION_STATUS.RETAINED ? 'completed' : 'needsReview';
      pending.updatedAt = new Date().toISOString();
    }
  }

  if (reviewResult.retentionStatus !== RETENTION_STATUS.RETAINED) {
    const reschedule = scheduleFractionRetentionReviews(skillId, new Date());
    next.retentionPlans[skillId] = {
      ...reschedule,
      questionFamilyIds: next.retentionPlans[skillId]?.questionFamilyIds || [],
      status: RETENTION_STATUS.REVIEW_SCHEDULED,
    };
    next.skillStatuses[skillId] = RETENTION_STATUS.REVIEW_SCHEDULED;
  }

  return next;
}

export function validateFractionRetentionEngine() {
  const masteredAt = '2026-01-01T00:00:00.000Z';
  const schedule = scheduleFractionRetentionReviews('F010', masteredAt);
  const hasRequiredDays = JSON.stringify(schedule.reviews.map((r) => r.day)) === JSON.stringify(REVIEW_DAYS);

  const dueState = {
    retentionPlans: {
      F010: {
        ...schedule,
        questionFamilyIds: ['QF_F010_001'],
      },
    },
  };
  const dueReviews = getDueFractionRetentionReviews(dueState, '2026-01-08T00:00:00.000Z');
  const dueReturnedCorrectly = dueReviews.length >= 2;

  const fluentReview = scoreFractionRetentionReview({
    skillId: 'F010',
    questionFamilyId: 'QF_F010_001',
    correct: true,
    timeTaken: 10,
    confidence: 'Very Confident',
    previousFluencyLevel: 'gold',
  });
  const slowReview = scoreFractionRetentionReview({
    skillId: 'F010',
    questionFamilyId: 'QF_F010_001',
    correct: true,
    timeTaken: 40,
    confidence: 'Confident',
    previousFluencyLevel: 'silver',
  });
  const incorrectReview = scoreFractionRetentionReview({
    skillId: 'F010',
    questionFamilyId: 'QF_F010_001',
    correct: false,
    timeTaken: 8,
    confidence: 'Very Confident',
    previousFluencyLevel: 'gold',
  });
  const guessingReview = scoreFractionRetentionReview({
    skillId: 'F010',
    questionFamilyId: 'QF_F010_001',
    correct: true,
    timeTaken: 9,
    confidence: 'Guessing',
    previousFluencyLevel: 'gold',
  });

  const updated = updateFractionRetentionState(
    {
      retentionPlans: {
        F010: { ...schedule, questionFamilyIds: ['QF_F010_001'] },
      },
      retentionHistory: {},
      skillStatuses: {},
    },
    { ...slowReview, skillId: 'F010' }
  );

  const stateUpdatedCorrectly =
    updated.skillStatuses.F010 === RETENTION_STATUS.REVIEW_SCHEDULED &&
    Array.isArray(updated.retentionHistory.F010) &&
    updated.retentionHistory.F010.length === 1;

  return {
    isValid:
      hasRequiredDays &&
      dueReturnedCorrectly &&
      fluentReview.retentionStatus === RETENTION_STATUS.RETAINED &&
      slowReview.retentionStatus === RETENTION_STATUS.NEEDS_REVIEW &&
      incorrectReview.retentionStatus === RETENTION_STATUS.FORGOTTEN &&
      guessingReview.retentionStatus === RETENTION_STATUS.NEEDS_REVIEW &&
      stateUpdatedCorrectly,
    checks: {
      hasRequiredDays,
      dueReturnedCorrectly,
      accurateFluentRetained: fluentReview.retentionStatus === RETENTION_STATUS.RETAINED,
      accurateSlowNeedsReview: slowReview.retentionStatus === RETENTION_STATUS.NEEDS_REVIEW,
      incorrectForgotten: incorrectReview.retentionStatus === RETENTION_STATUS.FORGOTTEN,
      guessingPreventsRetained: guessingReview.retentionStatus === RETENTION_STATUS.NEEDS_REVIEW,
      stateUpdatedCorrectly,
    },
    sample: {
      schedule,
      dueReviews: dueReviews.slice(0, 2),
      fluentReview,
      slowReview,
      incorrectReview,
      guessingReview,
      updatedSkillStatus: updated.skillStatuses.F010,
    },
  };
}

export const fractionRetentionEngine = {
  scheduleFractionRetentionReviews,
  getDueFractionRetentionReviews,
  scoreFractionRetentionReview,
  calculateFractionRetentionRisk,
  updateFractionRetentionState,
  validateFractionRetentionEngine,
  RETENTION_STATUS,
};

export default fractionRetentionEngine;
