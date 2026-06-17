import { getQuestionFamiliesBySkill, getQuestionFamily } from './CirclesQuestionFamilies.js';
import { getSkill } from './CirclesSkillGraph.js';

// ---------------------------------------------------------------------------
// Circles retention engine.
//
// Pure, persistence-free retention model — mirrors the Ratio / Volume engines
// exactly. Domain-specific changes from the Ratio template:
//   1. Imports from CirclesQuestionFamilies / CirclesSkillGraph.
//   2. DOMAIN_ID = 'circles'.
//   3. reviewId prefix: RET_CIR_.
//   4. Self-test uses CI003.
// ---------------------------------------------------------------------------

export const DOMAIN_ID = 'circles';

export const RETENTION_STATES = {
  NOT_SCHEDULED: 'not_scheduled',
  REVIEW_SCHEDULED: 'reviewScheduled',
  REVIEW_DUE: 'review_due',
  RETAINED: 'retained',
  NEEDS_REVIEW: 'needsReview',
  FORGOTTEN: 'forgotten',
};

export const FLUENT_BANDS = ['gold', 'platinum'];
export const FLUENT_STATUSES = ['fluent', 'retained'];

export const DEFAULT_REVIEW_INTERVALS_DAYS = [3, 7, 30, 90];

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeDate(value) {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function reviewIntervalsForSkill(skillId = '') {
  const skill = getSkill(skillId);
  const days = skill?.retention?.reviewDays;
  return Array.isArray(days) && days.length ? days.slice() : DEFAULT_REVIEW_INTERVALS_DAYS.slice();
}

export function isFluentEnoughForRetention({ fluencyLevel = '', status = '' } = {}) {
  return FLUENT_BANDS.includes(String(fluencyLevel)) || FLUENT_STATUSES.includes(String(status));
}

export function buildSpacedReviewSchedule({ skillId = '', fluentAt = new Date(), intervals = null } = {}) {
  const start = normalizeDate(fluentAt) || new Date();
  const days = Array.isArray(intervals) && intervals.length ? intervals : reviewIntervalsForSkill(skillId);
  return {
    domainId: DOMAIN_ID,
    skillId,
    fluentAt: start.toISOString(),
    reviews: days.map((intervalDays, index) => ({
      reviewNumber: index + 1,
      intervalDays,
      dueAt: addDays(start, intervalDays).toISOString(),
      status: RETENTION_STATES.REVIEW_SCHEDULED,
    })),
  };
}

export function buildRetentionScheduleFromFluency({ skillId = '', fluencyLevel = '', status = '', fluentAt = new Date(), intervals = null } = {}) {
  if (!isFluentEnoughForRetention({ fluencyLevel, status })) {
    return {
      domainId: DOMAIN_ID,
      skillId,
      shouldSchedule: false,
      reason: 'Schedule retention only after the skill is fluent, not just accurate.',
      reviews: [],
      nextReviewDate: null,
    };
  }
  const schedule = buildSpacedReviewSchedule({ skillId, fluentAt, intervals });
  return {
    ...schedule,
    shouldSchedule: true,
    reason: 'Protect fluent performance with spaced same-concept reviews.',
    sourceFluencyLevel: fluencyLevel || null,
    nextReviewDate: schedule.reviews[0]?.dueAt || null,
    reviews: schedule.reviews.map((review) => ({
      ...review,
      reviewMode: 'speed_accuracy_retention',
    })),
  };
}

export function findNextDueReview({ skillId = '', fluentAt = null, completedIntervalDays = [], asOf = new Date() } = {}) {
  if (!fluentAt) return null;
  const now = normalizeDate(asOf) || new Date();
  const done = new Set(completedIntervalDays.map((d) => Number(d)));
  const schedule = buildSpacedReviewSchedule({ skillId, fluentAt });
  return schedule.reviews.find((review) => !done.has(review.intervalDays) && (normalizeDate(review.dueAt) <= now)) || null;
}

export function evaluateRetentionStatus({ state = {}, asOf = new Date() } = {}) {
  const skillId = String(state.skillId || '');
  const now = normalizeDate(asOf) || new Date();
  const fluentAt = normalizeDate(state.fluentAt || state.masteredAt);
  const nextReviewDate = normalizeDate(state.nextReviewDate);
  const persisted = String(state.retentionStatus || '');
  const completedIntervalDays = Array.isArray(state.completedIntervalDays) ? state.completedIntervalDays : [];

  let retentionState = RETENTION_STATES.NOT_SCHEDULED;
  if (isFluentEnoughForRetention({ fluencyLevel: state.fluencyLevel, status: state.status }) || fluentAt) {
    retentionState = RETENTION_STATES.REVIEW_SCHEDULED;
  }
  if (persisted === RETENTION_STATES.RETAINED) retentionState = RETENTION_STATES.RETAINED;
  if (persisted === RETENTION_STATES.NEEDS_REVIEW) retentionState = RETENTION_STATES.NEEDS_REVIEW;
  if (persisted === RETENTION_STATES.FORGOTTEN) retentionState = RETENTION_STATES.FORGOTTEN;

  const nextDue = nextReviewDate ? null : findNextDueReview({ skillId, fluentAt, completedIntervalDays, asOf: now });
  const dueByPersistedDate = nextReviewDate ? nextReviewDate <= now : false;
  const dueOverridable = ![RETENTION_STATES.RETAINED, RETENTION_STATES.FORGOTTEN].includes(retentionState);
  if ((nextDue || dueByPersistedDate) && dueOverridable) {
    retentionState = RETENTION_STATES.REVIEW_DUE;
  }

  return {
    domainId: DOMAIN_ID,
    skillId,
    skillName: getSkill(skillId)?.name || skillId,
    retentionState,
    fluentAt: fluentAt ? fluentAt.toISOString() : null,
    nextReviewDate: nextReviewDate ? nextReviewDate.toISOString() : (nextDue ? nextDue.dueAt : null),
    nextDueReview: nextDue || null,
    alert: [RETENTION_STATES.REVIEW_DUE, RETENTION_STATES.NEEDS_REVIEW, RETENTION_STATES.FORGOTTEN].includes(retentionState),
  };
}

export function detectForgetting({ states = [], asOf = new Date() } = {}) {
  return states
    .map((state) => evaluateRetentionStatus({ state, asOf }))
    .filter((status) => status.alert)
    .map((status) => ({
      skillId: status.skillId,
      skillName: status.skillName,
      retentionState: status.retentionState,
      alertType: status.retentionState === RETENTION_STATES.REVIEW_DUE ? 'retention_review_due' : 'forgetting_detected',
      message: `${status.skillName} was previously fluent but now needs a retention review.`,
      nextReviewDate: status.nextReviewDate,
    }));
}

export function summariseRetention({ states = [], asOf = new Date() } = {}) {
  const now = normalizeDate(asOf) || new Date();
  const scheduled = states.filter((s) => normalizeDate(s.nextReviewDate) || normalizeDate(s.fluentAt || s.masteredAt));
  const shape = (state) => {
    const status = evaluateRetentionStatus({ state, asOf: now });
    return {
      skillId: status.skillId,
      skillName: status.skillName,
      reviewDate: status.nextReviewDate,
      retentionState: status.retentionState,
      fluencyLevel: state.fluencyLevel || null,
      intervalDays: status.nextDueReview?.intervalDays ?? null,
      lastReviewedAt: state.lastReviewedAt || null,
    };
  };
  const rows = scheduled.map((state) => ({ state, status: evaluateRetentionStatus({ state, asOf: now }) }));
  return {
    domainId: DOMAIN_ID,
    upcomingReviews: rows
      .filter(({ status }) => status.retentionState === RETENTION_STATES.REVIEW_SCHEDULED && status.nextReviewDate && new Date(status.nextReviewDate) >= now)
      .map(({ state }) => shape(state)),
    overdueReviews: rows
      .filter(({ status }) => [RETENTION_STATES.REVIEW_DUE, RETENTION_STATES.NEEDS_REVIEW, RETENTION_STATES.FORGOTTEN].includes(status.retentionState))
      .map(({ state }) => shape(state)),
    retentionHistory: rows
      .filter(({ status }) => status.retentionState === RETENTION_STATES.RETAINED)
      .map(({ state }) => shape(state)),
    emptyState: rows.length ? null : 'Retention reviews will appear after a circles skill becomes fluent.',
  };
}

export function generateRetentionReview({ skillId = '', previousQuestionFamilyIds = [], difficulty = null } = {}) {
  const previous = new Set(previousQuestionFamilyIds);
  const targetDifficulty = difficulty == null ? (getSkill(skillId)?.difficulty || 2) : difficulty;
  const families = getQuestionFamiliesBySkill(skillId)
    .filter((family) => !previous.has(family.id))
    .sort((a, b) => Math.abs((a.difficulty || targetDifficulty) - targetDifficulty) - Math.abs((b.difficulty || targetDifficulty) - targetDifficulty));
  const pool = families.length ? families : getQuestionFamiliesBySkill(skillId);
  return {
    reviewId: `RET_CIR_${skillId}_${Date.now()}`,
    domainId: DOMAIN_ID,
    skillId,
    sameConcept: true,
    differentQuestions: families.length > 0,
    preventMemorisation: true,
    questionFamilyIds: pool.slice(0, 4).map((family) => family.id),
    recommendedQuestionCount: Math.min(5, Math.max(3, pool.length)),
  };
}

export function classifyReviewOutcome({ accuracy = 0, averageTimeSeconds = null, skillId = '' } = {}) {
  const acc = toNum(accuracy, 0);
  const targetSeconds = toNum(getSkill(skillId)?.fluency?.targetAverageSeconds, 10);
  const fastEnough = averageTimeSeconds === null || averageTimeSeconds === undefined
    ? true
    : toNum(averageTimeSeconds, Number.MAX_SAFE_INTEGER) <= targetSeconds * 2;
  if (acc >= 85 && fastEnough) {
    return { retentionStatus: RETENTION_STATES.RETAINED, retained: true, reason: 'Accurate and quick — skill retained.' };
  }
  if (acc >= 60) {
    return { retentionStatus: RETENTION_STATES.NEEDS_REVIEW, retained: false, reason: 'Partially retained — schedule another review soon.' };
  }
  return { retentionStatus: RETENTION_STATES.FORGOTTEN, retained: false, reason: 'Skill appears forgotten — return to fluency practice.' };
}

export function applyReviewCompletion({ skillId = '', accuracy = 0, averageTimeSeconds = null, completedIntervalDays = [], lastIntervalDays = null, completedAt = new Date() } = {}) {
  const outcome = classifyReviewOutcome({ accuracy, averageTimeSeconds, skillId });
  const now = normalizeDate(completedAt) || new Date();
  const intervals = reviewIntervalsForSkill(skillId);
  const done = new Set(completedIntervalDays.map((d) => Number(d)));
  if (lastIntervalDays != null) done.add(Number(lastIntervalDays));
  const nextInterval = intervals.find((d) => !done.has(d)) ?? null;
  const set = {
    retentionStatus: outcome.retentionStatus,
    lastReviewedAt: now,
  };
  if (outcome.retained) {
    set.status = 'retained';
    set.retainedAt = now;
    set.nextReviewDate = nextInterval == null ? null : addDays(now, nextInterval);
  } else {
    set.nextReviewDate = addDays(now, intervals[0]);
    if (outcome.retentionStatus === RETENTION_STATES.FORGOTTEN) set.status = 'needsReview';
  }
  return {
    domainId: DOMAIN_ID,
    skillId,
    ...outcome,
    set,
    nextIntervalDays: outcome.retained ? nextInterval : intervals[0],
  };
}

export function validateCirclesRetentionEngine() {
  const skillId = 'CI003';
  const fluentAt = '2026-01-01T00:00:00.000Z';
  const schedule = buildSpacedReviewSchedule({ skillId, fluentAt });
  const gated = buildRetentionScheduleFromFluency({ skillId, fluencyLevel: 'gold', fluentAt });
  const gatedBlocked = buildRetentionScheduleFromFluency({ skillId, fluencyLevel: 'bronze', status: 'accurate', fluentAt });
  const due = evaluateRetentionStatus({
    state: { skillId, fluentAt, fluencyLevel: 'gold', status: 'fluent', retentionStatus: 'reviewScheduled' },
    asOf: '2026-01-08T00:00:00.000Z',
  });
  const notDueYet = evaluateRetentionStatus({
    state: { skillId, fluentAt, fluencyLevel: 'gold', status: 'fluent', retentionStatus: 'reviewScheduled' },
    asOf: '2026-01-01T12:00:00.000Z',
  });
  const review = generateRetentionReview({ skillId, previousQuestionFamilyIds: ['QF_CI003_001'] });
  const retained = classifyReviewOutcome({ accuracy: 95, averageTimeSeconds: 6, skillId });
  const forgotten = classifyReviewOutcome({ accuracy: 30, skillId });
  const completion = applyReviewCompletion({ skillId, accuracy: 95, averageTimeSeconds: 6, lastIntervalDays: 3 });

  const checks = {
    scheduleUsesSkillReviewDays: schedule.reviews.length === reviewIntervalsForSkill(skillId).length,
    scheduleHasDueDates: schedule.reviews.every((r) => typeof r.dueAt === 'string'),
    masteryGateBlocksNonFluent: gatedBlocked.shouldSchedule === false && gatedBlocked.reviews.length === 0,
    masteryGateAllowsFluent: gated.shouldSchedule === true && gated.reviews.length > 0,
    dueDetected: due.retentionState === RETENTION_STATES.REVIEW_DUE && due.alert === true,
    notDueWhenEarly: notDueYet.retentionState === RETENTION_STATES.REVIEW_SCHEDULED && notDueYet.alert === false,
    reviewUsesDifferentFamilies: !review.questionFamilyIds.includes('QF_CI003_001'),
    retainedClassified: retained.retentionStatus === RETENTION_STATES.RETAINED,
    forgottenClassified: forgotten.retentionStatus === RETENTION_STATES.FORGOTTEN,
    completionAdvancesSchedule: completion.set.retentionStatus === RETENTION_STATES.RETAINED && completion.nextIntervalDays !== 3,
  };

  return {
    isValid: Object.values(checks).every(Boolean),
    checks,
    sample: { schedule, gated, due, review, completion },
  };
}

export const circlesRetentionEngine = {
  DOMAIN_ID,
  RETENTION_STATES,
  FLUENT_BANDS,
  FLUENT_STATUSES,
  DEFAULT_REVIEW_INTERVALS_DAYS,
  reviewIntervalsForSkill,
  isFluentEnoughForRetention,
  buildSpacedReviewSchedule,
  buildRetentionScheduleFromFluency,
  findNextDueReview,
  evaluateRetentionStatus,
  detectForgetting,
  summariseRetention,
  generateRetentionReview,
  classifyReviewOutcome,
  applyReviewCompletion,
  validateCirclesRetentionEngine,
};

export default circlesRetentionEngine;
