import { getQuestionFamiliesBySkill } from './NumberSenseQuestionFamilies.js';
import { getSkill } from './NumberSenseSkillGraph.js';

export const DOMAIN_ID = 'number_sense';
export const RETENTION_STATES = { NOT_SCHEDULED: 'not_scheduled', REVIEW_SCHEDULED: 'reviewScheduled', REVIEW_DUE: 'review_due', RETAINED: 'retained', NEEDS_REVIEW: 'needsReview', FORGOTTEN: 'forgotten' };
export const FLUENT_BANDS = ['gold', 'platinum'];
export const FLUENT_STATUSES = ['fluent', 'retained'];
export const DEFAULT_REVIEW_INTERVALS_DAYS = [3, 7, 30, 90];

function toNum(v, f = 0) { const n = Number(v); return Number.isFinite(n) ? n : f; }
function normalizeDate(v) { if (v == null) return null; const d = v instanceof Date ? v : new Date(v); return Number.isNaN(d.getTime()) ? null : d; }
function addDays(date, days) { const d = new Date(date); d.setDate(d.getDate() + days); return d; }

export function reviewIntervalsForSkill(skillId = '') { const s = getSkill(skillId); const d = s?.retention?.reviewDays; return Array.isArray(d) && d.length ? d.slice() : DEFAULT_REVIEW_INTERVALS_DAYS.slice(); }
export function isFluentEnoughForRetention({ fluencyLevel = '', status = '' } = {}) { return FLUENT_BANDS.includes(String(fluencyLevel)) || FLUENT_STATUSES.includes(String(status)); }

export function buildSpacedReviewSchedule({ skillId = '', fluentAt = new Date(), intervals = null } = {}) {
  const start = normalizeDate(fluentAt) || new Date();
  const days = Array.isArray(intervals) && intervals.length ? intervals : reviewIntervalsForSkill(skillId);
  return { domainId: DOMAIN_ID, skillId, fluentAt: start.toISOString(), reviews: days.map((intervalDays, index) => ({ reviewNumber: index + 1, intervalDays, dueAt: addDays(start, intervalDays).toISOString(), status: RETENTION_STATES.REVIEW_SCHEDULED })) };
}

export function buildRetentionScheduleFromFluency({ skillId = '', fluencyLevel = '', status = '', fluentAt = new Date(), intervals = null } = {}) {
  if (!isFluentEnoughForRetention({ fluencyLevel, status })) return { domainId: DOMAIN_ID, skillId, shouldSchedule: false, reason: 'Schedule retention only after the skill is fluent, not just accurate.', reviews: [], nextReviewDate: null };
  const schedule = buildSpacedReviewSchedule({ skillId, fluentAt, intervals });
  return { ...schedule, shouldSchedule: true, reason: 'Protect fluent performance with spaced same-concept reviews.', sourceFluencyLevel: fluencyLevel || null, nextReviewDate: schedule.reviews[0]?.dueAt || null, reviews: schedule.reviews.map((r) => ({ ...r, reviewMode: 'speed_accuracy_retention' })) };
}

export function findNextDueReview({ skillId = '', fluentAt = null, completedIntervalDays = [], asOf = new Date() } = {}) {
  if (!fluentAt) return null;
  const now = normalizeDate(asOf) || new Date();
  const done = new Set(completedIntervalDays.map(Number));
  return buildSpacedReviewSchedule({ skillId, fluentAt }).reviews.find((r) => !done.has(r.intervalDays) && normalizeDate(r.dueAt) <= now) || null;
}

export function evaluateRetentionStatus({ state = {}, asOf = new Date() } = {}) {
  const skillId = String(state.skillId || '');
  const now = normalizeDate(asOf) || new Date();
  const fluentAt = normalizeDate(state.fluentAt || state.masteredAt);
  const nextReviewDate = normalizeDate(state.nextReviewDate);
  const persisted = String(state.retentionStatus || '');
  const completedIntervalDays = Array.isArray(state.completedIntervalDays) ? state.completedIntervalDays : [];
  let retentionState = RETENTION_STATES.NOT_SCHEDULED;
  if (isFluentEnoughForRetention({ fluencyLevel: state.fluencyLevel, status: state.status }) || fluentAt) retentionState = RETENTION_STATES.REVIEW_SCHEDULED;
  if (persisted === RETENTION_STATES.RETAINED) retentionState = RETENTION_STATES.RETAINED;
  if (persisted === RETENTION_STATES.NEEDS_REVIEW) retentionState = RETENTION_STATES.NEEDS_REVIEW;
  if (persisted === RETENTION_STATES.FORGOTTEN) retentionState = RETENTION_STATES.FORGOTTEN;
  const nextDue = nextReviewDate ? null : findNextDueReview({ skillId, fluentAt, completedIntervalDays, asOf: now });
  const dueByPersistedDate = nextReviewDate ? nextReviewDate <= now : false;
  if ((nextDue || dueByPersistedDate) && ![RETENTION_STATES.RETAINED, RETENTION_STATES.FORGOTTEN].includes(retentionState)) retentionState = RETENTION_STATES.REVIEW_DUE;
  return { domainId: DOMAIN_ID, skillId, skillName: getSkill(skillId)?.name || skillId, retentionState, fluentAt: fluentAt ? fluentAt.toISOString() : null, nextReviewDate: nextReviewDate ? nextReviewDate.toISOString() : (nextDue ? nextDue.dueAt : null), nextDueReview: nextDue || null, alert: [RETENTION_STATES.REVIEW_DUE, RETENTION_STATES.NEEDS_REVIEW, RETENTION_STATES.FORGOTTEN].includes(retentionState) };
}

export function detectForgetting({ states = [], asOf = new Date() } = {}) {
  return states.map((s) => evaluateRetentionStatus({ state: s, asOf })).filter((s) => s.alert).map((s) => ({ skillId: s.skillId, skillName: s.skillName, retentionState: s.retentionState, alertType: s.retentionState === RETENTION_STATES.REVIEW_DUE ? 'retention_review_due' : 'forgetting_detected', message: `${s.skillName} was previously fluent but now needs a retention review.`, nextReviewDate: s.nextReviewDate }));
}

export function summariseRetention({ states = [], asOf = new Date() } = {}) {
  const now = normalizeDate(asOf) || new Date();
  const rows = states.filter((s) => normalizeDate(s.nextReviewDate) || normalizeDate(s.fluentAt || s.masteredAt)).map((state) => ({ state, status: evaluateRetentionStatus({ state, asOf: now }) }));
  const shape = (state) => { const st = evaluateRetentionStatus({ state, asOf: now }); return { skillId: st.skillId, skillName: st.skillName, reviewDate: st.nextReviewDate, retentionState: st.retentionState, fluencyLevel: state.fluencyLevel || null, intervalDays: st.nextDueReview?.intervalDays ?? null, lastReviewedAt: state.lastReviewedAt || null }; };
  return { domainId: DOMAIN_ID, upcomingReviews: rows.filter(({ status: st }) => st.retentionState === RETENTION_STATES.REVIEW_SCHEDULED && st.nextReviewDate && new Date(st.nextReviewDate) >= now).map(({ state }) => shape(state)), overdueReviews: rows.filter(({ status: st }) => [RETENTION_STATES.REVIEW_DUE, RETENTION_STATES.NEEDS_REVIEW, RETENTION_STATES.FORGOTTEN].includes(st.retentionState)).map(({ state }) => shape(state)), retentionHistory: rows.filter(({ status: st }) => st.retentionState === RETENTION_STATES.RETAINED).map(({ state }) => shape(state)), emptyState: rows.length ? null : 'Retention reviews will appear after a number sense skill becomes fluent.' };
}

export function generateRetentionReview({ skillId = '', previousQuestionFamilyIds = [], difficulty = null } = {}) {
  const previous = new Set(previousQuestionFamilyIds);
  const td = difficulty == null ? (getSkill(skillId)?.difficulty || 2) : difficulty;
  const families = getQuestionFamiliesBySkill(skillId).filter((f) => !previous.has(f.id)).sort((a, b) => Math.abs((a.difficulty || td) - td) - Math.abs((b.difficulty || td) - td));
  const pool = families.length ? families : getQuestionFamiliesBySkill(skillId);
  return { reviewId: `RET_NS_${skillId}_${Date.now()}`, domainId: DOMAIN_ID, skillId, sameConcept: true, differentQuestions: families.length > 0, preventMemorisation: true, questionFamilyIds: pool.slice(0, 4).map((f) => f.id), recommendedQuestionCount: Math.min(5, Math.max(3, pool.length)) };
}

export function classifyReviewOutcome({ accuracy = 0, averageTimeSeconds = null, skillId = '' } = {}) {
  const acc = toNum(accuracy);
  const ts = toNum(getSkill(skillId)?.fluency?.targetAverageSeconds, 8);
  const fast = averageTimeSeconds == null ? true : toNum(averageTimeSeconds, Infinity) <= ts * 2;
  if (acc >= 85 && fast) return { retentionStatus: RETENTION_STATES.RETAINED, retained: true, reason: 'Accurate and quick — skill retained.' };
  if (acc >= 60) return { retentionStatus: RETENTION_STATES.NEEDS_REVIEW, retained: false, reason: 'Partially retained — schedule another review soon.' };
  return { retentionStatus: RETENTION_STATES.FORGOTTEN, retained: false, reason: 'Skill appears forgotten — return to fluency practice.' };
}

export function applyReviewCompletion({ skillId = '', accuracy = 0, averageTimeSeconds = null, completedIntervalDays = [], lastIntervalDays = null, completedAt = new Date() } = {}) {
  const outcome = classifyReviewOutcome({ accuracy, averageTimeSeconds, skillId });
  const now = normalizeDate(completedAt) || new Date();
  const intervals = reviewIntervalsForSkill(skillId);
  const done = new Set(completedIntervalDays.map(Number));
  if (lastIntervalDays != null) done.add(Number(lastIntervalDays));
  const nextInterval = intervals.find((d) => !done.has(d)) ?? null;
  const set = { retentionStatus: outcome.retentionStatus, lastReviewedAt: now };
  if (outcome.retained) { set.status = 'retained'; set.retainedAt = now; set.nextReviewDate = nextInterval == null ? null : addDays(now, nextInterval); }
  else { set.nextReviewDate = addDays(now, intervals[0]); if (outcome.retentionStatus === RETENTION_STATES.FORGOTTEN) set.status = 'needsReview'; }
  return { domainId: DOMAIN_ID, skillId, ...outcome, set, nextIntervalDays: outcome.retained ? nextInterval : intervals[0] };
}

export function validateNumberSenseRetentionEngine() {
  const skillId = 'NS001'; const fluentAt = '2026-01-01T00:00:00.000Z';
  const schedule = buildSpacedReviewSchedule({ skillId, fluentAt });
  const gated = buildRetentionScheduleFromFluency({ skillId, fluencyLevel: 'gold', fluentAt });
  const blocked = buildRetentionScheduleFromFluency({ skillId, fluencyLevel: 'bronze', status: 'accurate', fluentAt });
  const due = evaluateRetentionStatus({ state: { skillId, fluentAt, fluencyLevel: 'gold', status: 'fluent', retentionStatus: 'reviewScheduled' }, asOf: '2026-01-08T00:00:00.000Z' });
  const notDue = evaluateRetentionStatus({ state: { skillId, fluentAt, fluencyLevel: 'gold', status: 'fluent', retentionStatus: 'reviewScheduled' }, asOf: '2026-01-01T12:00:00.000Z' });
  const review = generateRetentionReview({ skillId });
  const retained = classifyReviewOutcome({ accuracy: 95, averageTimeSeconds: 5, skillId });
  const forgotten = classifyReviewOutcome({ accuracy: 30, skillId });
  const completion = applyReviewCompletion({ skillId, accuracy: 95, averageTimeSeconds: 5, lastIntervalDays: 3 });
  const checks = { scheduleOk: schedule.reviews.length === reviewIntervalsForSkill(skillId).length, datesOk: schedule.reviews.every((r) => typeof r.dueAt === 'string'), gateBlocks: blocked.shouldSchedule === false, gateAllows: gated.shouldSchedule === true, dueDetected: due.retentionState === RETENTION_STATES.REVIEW_DUE, notDueEarly: notDue.retentionState === RETENTION_STATES.REVIEW_SCHEDULED, reviewFamilies: review.questionFamilyIds.length > 0, retainedOk: retained.retentionStatus === RETENTION_STATES.RETAINED, forgottenOk: forgotten.retentionStatus === RETENTION_STATES.FORGOTTEN, completionOk: completion.set.retentionStatus === RETENTION_STATES.RETAINED };
  return { isValid: Object.values(checks).every(Boolean), checks, sample: { schedule, gated, due, review, completion } };
}

export const numberSenseRetentionEngine = { DOMAIN_ID, RETENTION_STATES, FLUENT_BANDS, FLUENT_STATUSES, DEFAULT_REVIEW_INTERVALS_DAYS, reviewIntervalsForSkill, isFluentEnoughForRetention, buildSpacedReviewSchedule, buildRetentionScheduleFromFluency, findNextDueReview, evaluateRetentionStatus, detectForgetting, summariseRetention, generateRetentionReview, classifyReviewOutcome, applyReviewCompletion, validateNumberSenseRetentionEngine };
export default numberSenseRetentionEngine;
