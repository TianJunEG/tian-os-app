import { getQuestionFamiliesBySkill, getQuestionFamily } from './GeometryQuestionFamilies.js';
import { getSkill } from './GeometrySkillGraph.js';

// ---------------------------------------------------------------------------
// Geometry retention engine.
//
// This is the pure, persistence-free retention model for the Geometry domain.
// It follows the Algebra retention pilot (algebraRetentionEngine.js / PR #274),
// which in turn mirrors the fractions reference engine
// (shared/mathpath/fractions/fractionFluencyRetentionEngine.js) in spirit:
//   - spaced-review scheduling from per-skill review intervals
//   - a mastery gate (retention is only scheduled once a skill is fluent)
//   - "due for review" / overdue / forgetting detection
//   - generation of a fresh (same-concept, different-question) review set
//
// What is DOMAIN-SPECIFIC here (and therefore what each domain changes):
//   1. The two imports above (skill graph + question families for the domain).
//   2. DOMAIN_ID (persisted on MathPathStudentSkillState; matches practice + fluency).
//   3. Review intervals are read from each skill's `retention.reviewDays`
//      metadata in the skill graph (geometry ships [3, 7, 30, 90]); the
//      DEFAULT_REVIEW_INTERVALS_DAYS fallback is only used if a skill omits it.
//   4. The review/schedule id prefixes (RET_GEO).
// Everything else — the scheduling math, the state machine, due/forgetting
// detection — is generic and copied verbatim from the algebra pilot.
// ---------------------------------------------------------------------------

export const DOMAIN_ID = 'geometry';

// Retention states. These map onto MathPathStudentSkillState.retentionStatus
// (reviewScheduled | retained | needsReview | forgotten) plus a few transient
// states the engine surfaces to the UI but does not necessarily persist.
export const RETENTION_STATES = {
  NOT_SCHEDULED: 'not_scheduled',
  REVIEW_SCHEDULED: 'reviewScheduled',
  REVIEW_DUE: 'review_due',
  RETAINED: 'retained',
  NEEDS_REVIEW: 'needsReview',
  FORGOTTEN: 'forgotten',
};

// Fluency bands considered "fluent enough" to start protecting with retention.
// Matches geometryFluencyService bands (bronze|silver|gold|platinum) + the
// MathPathStudentSkillState 'fluent'/'retained' competence statuses.
export const FLUENT_BANDS = ['gold', 'platinum'];
export const FLUENT_STATUSES = ['fluent', 'retained'];

// Fallback only — geometry skills carry their own retention.reviewDays.
export const DEFAULT_REVIEW_INTERVALS_DAYS = [3, 7, 30, 90];

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function round(value, places = 1) {
  const m = 10 ** places;
  return Math.round(toNum(value, 0) * m) / m;
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

/**
 * Spaced-review interval days for a skill. Reads the skill graph's
 * `retention.reviewDays`; falls back to DEFAULT_REVIEW_INTERVALS_DAYS.
 */
export function reviewIntervalsForSkill(skillId = '') {
  const skill = getSkill(skillId);
  const days = skill?.retention?.reviewDays;
  return Array.isArray(days) && days.length ? days.slice() : DEFAULT_REVIEW_INTERVALS_DAYS.slice();
}

/**
 * Whether a skill is fluent enough to begin retention scheduling.
 * Accepts either a fluency band (gold/platinum) or a competence status
 * (fluent/retained) — the geometry fluency service writes both.
 */
export function isFluentEnoughForRetention({ fluencyLevel = '', status = '' } = {}) {
  return FLUENT_BANDS.includes(String(fluencyLevel)) || FLUENT_STATUSES.includes(String(status));
}

/**
 * Build the spaced-review schedule for a skill from a fluent-at anchor date.
 * Pure — produces the list of dated reviews; persistence is the caller's job.
 */
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

/**
 * Mastery-gated schedule: only schedules retention once the skill is fluent.
 * Mirrors fractions' buildRetentionScheduleFromFluency contract:
 *   { skillId, shouldSchedule, reason, reviews, nextReviewDate }
 */
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

/**
 * Given a fluent-at anchor and the history of completed reviews, find the next
 * review that is due (its dueAt is on/before `asOf` and it hasn't been done).
 * `completedReviewNumbers` / `completedIntervalDays` mark which reviews are done.
 */
export function findNextDueReview({ skillId = '', fluentAt = null, completedIntervalDays = [], asOf = new Date() } = {}) {
  if (!fluentAt) return null;
  const now = normalizeDate(asOf) || new Date();
  const done = new Set(completedIntervalDays.map((d) => Number(d)));
  const schedule = buildSpacedReviewSchedule({ skillId, fluentAt });
  // The earliest review whose due date has passed and which is not yet completed.
  return schedule.reviews.find((review) => !done.has(review.intervalDays) && (normalizeDate(review.dueAt) <= now)) || null;
}

/**
 * Evaluate the current retention status for one skill from its persisted
 * skill-state row plus an `asOf` clock. Pure: takes a plain state object
 * (shaped like a MathPathStudentSkillState lean doc) and returns a status
 * descriptor with an `alert` flag and the next due review (if any).
 */
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

  // Due detection. A persisted nextReviewDate is authoritative (it reflects
  // completed reviews); only fall back to the naive derived schedule when no
  // nextReviewDate has been persisted yet.
  const nextDue = nextReviewDate ? null : findNextDueReview({ skillId, fluentAt, completedIntervalDays, asOf: now });
  const dueByPersistedDate = nextReviewDate ? nextReviewDate <= now : false;
  // A persisted terminal status (retained/forgotten) is not re-flipped to "due"
  // by the naive derived schedule; only an actively scheduled skill can be due.
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

/**
 * Scan a set of persisted skill-state rows and surface every skill whose
 * retention is due / at risk. Mirrors fractions detectForgetting().
 */
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

/**
 * Build a retention summary for the API (upcoming / overdue / history) from
 * persisted skill-state rows. Same shape contract as fractions'
 * publicRetentionSummary (upcomingReviews / overdueReviews / retentionHistory).
 */
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
    emptyState: rows.length ? null : 'Retention reviews will appear after a geometry skill becomes fluent.',
  };
}

/**
 * Generate a fresh retention review set for a skill: same concept, different
 * question families than last time (prevents memorising the exact item).
 * Mirrors fractions generateRetentionReview().
 */
export function generateRetentionReview({ skillId = '', previousQuestionFamilyIds = [], difficulty = null } = {}) {
  const previous = new Set(previousQuestionFamilyIds);
  const targetDifficulty = difficulty == null ? (getSkill(skillId)?.difficulty || 2) : difficulty;
  const families = getQuestionFamiliesBySkill(skillId)
    .filter((family) => !previous.has(family.id))
    .sort((a, b) => Math.abs((a.difficulty || targetDifficulty) - targetDifficulty) - Math.abs((b.difficulty || targetDifficulty) - targetDifficulty));
  // If every family was used before, fall back to all of them rather than empty.
  const pool = families.length ? families : getQuestionFamiliesBySkill(skillId);
  return {
    reviewId: `RET_GEO_${skillId}_${Date.now()}`,
    domainId: DOMAIN_ID,
    skillId,
    sameConcept: true,
    differentQuestions: families.length > 0,
    preventMemorisation: true,
    questionFamilyIds: pool.slice(0, 4).map((family) => family.id),
    recommendedQuestionCount: Math.min(5, Math.max(3, pool.length)),
  };
}

/**
 * Decide the retention outcome of a completed review from its metrics.
 * Pure scoring: maps accuracy (+ optional speed vs target) onto a
 * retentionStatus. Mirrors the fractions route's retained/retention_risk gate.
 */
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

/**
 * Compute the persistence patch the route should $set on the
 * MathPathStudentSkillState row after a completed review. Generic across
 * domains; the route supplies the metrics + clock.
 */
export function applyReviewCompletion({ skillId = '', accuracy = 0, averageTimeSeconds = null, completedIntervalDays = [], lastIntervalDays = null, completedAt = new Date() } = {}) {
  const outcome = classifyReviewOutcome({ accuracy, averageTimeSeconds, skillId });
  const now = normalizeDate(completedAt) || new Date();
  const intervals = reviewIntervalsForSkill(skillId);
  const done = new Set(completedIntervalDays.map((d) => Number(d)));
  if (lastIntervalDays != null) done.add(Number(lastIntervalDays));
  // Next interval not yet done; null once every interval has been completed.
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
    // Re-review sooner (use the first/shortest interval) when not retained.
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

/**
 * Self-test, mirrors validateAlgebraRetentionEngine.
 */
export function validateGeometryRetentionEngine() {
  const skillId = 'GE003';
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
  const review = generateRetentionReview({ skillId, previousQuestionFamilyIds: ['QF_GE003_001'] });
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
    reviewUsesDifferentFamilies: !review.questionFamilyIds.includes('QF_GE003_001'),
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

export const geometryRetentionEngine = {
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
  validateGeometryRetentionEngine,
};

export default geometryRetentionEngine;
