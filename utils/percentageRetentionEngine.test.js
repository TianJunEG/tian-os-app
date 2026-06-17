import { describe, it, expect } from 'vitest';
import {
  RETENTION_STATES,
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
  validatePercentageRetentionEngine,
} from '../shared/mathpath/percentage/percentageRetentionEngine.js';

const FLUENT_AT = '2026-01-01T00:00:00.000Z';

describe('Percentage retention — scheduling', () => {
  it('reads review intervals from the skill graph (percentage ships [3,7,30,90])', () => {
    expect(reviewIntervalsForSkill('P003')).toEqual([3, 7, 30, 90]);
  });

  it('builds dated reviews from the fluent-at anchor using the skill intervals', () => {
    const schedule = buildSpacedReviewSchedule({ skillId: 'P003', fluentAt: FLUENT_AT });
    expect(schedule.reviews).toHaveLength(4);
    expect(schedule.reviews[0].intervalDays).toBe(3);
    expect(schedule.reviews[0].dueAt).toBe('2026-01-04T00:00:00.000Z');
    expect(schedule.reviews[3].dueAt).toBe('2026-04-01T00:00:00.000Z');
  });
});

describe('Percentage retention — mastery gate', () => {
  it('schedules retention only once a skill is fluent', () => {
    expect(isFluentEnoughForRetention({ fluencyLevel: 'gold' })).toBe(true);
    expect(isFluentEnoughForRetention({ status: 'fluent' })).toBe(true);
    expect(isFluentEnoughForRetention({ fluencyLevel: 'bronze', status: 'accurate' })).toBe(false);
  });

  it('blocks scheduling for non-fluent skills, allows it for fluent ones', () => {
    const blocked = buildRetentionScheduleFromFluency({ skillId: 'P003', fluencyLevel: 'bronze', fluentAt: FLUENT_AT });
    expect(blocked.shouldSchedule).toBe(false);
    expect(blocked.reviews).toHaveLength(0);

    const allowed = buildRetentionScheduleFromFluency({ skillId: 'P003', fluencyLevel: 'gold', fluentAt: FLUENT_AT });
    expect(allowed.shouldSchedule).toBe(true);
    expect(allowed.reviews.length).toBeGreaterThan(0);
    expect(allowed.nextReviewDate).toBe('2026-01-04T00:00:00.000Z');
  });
});

describe('Percentage retention — due detection', () => {
  it('finds the earliest passed-but-uncompleted review', () => {
    const due = findNextDueReview({ skillId: 'P003', fluentAt: FLUENT_AT, completedIntervalDays: [], asOf: '2026-01-05T00:00:00.000Z' });
    expect(due.intervalDays).toBe(3);
  });

  it('skips reviews already completed', () => {
    const due = findNextDueReview({ skillId: 'P003', fluentAt: FLUENT_AT, completedIntervalDays: [3], asOf: '2026-01-09T00:00:00.000Z' });
    expect(due.intervalDays).toBe(7);
  });

  it('returns null before any review is due', () => {
    const due = findNextDueReview({ skillId: 'P003', fluentAt: FLUENT_AT, completedIntervalDays: [], asOf: '2026-01-02T00:00:00.000Z' });
    expect(due).toBeNull();
  });

  it('marks a fluent skill as review_due once the first interval has passed', () => {
    const status = evaluateRetentionStatus({
      state: { skillId: 'P003', fluentAt: FLUENT_AT, fluencyLevel: 'gold', status: 'fluent', retentionStatus: 'reviewScheduled' },
      asOf: '2026-01-08T00:00:00.000Z',
    });
    expect(status.retentionState).toBe(RETENTION_STATES.REVIEW_DUE);
    expect(status.alert).toBe(true);
  });

  it('does not alert before the first review is due', () => {
    const status = evaluateRetentionStatus({
      state: { skillId: 'P003', fluentAt: FLUENT_AT, fluencyLevel: 'gold', status: 'fluent', retentionStatus: 'reviewScheduled' },
      asOf: '2026-01-01T12:00:00.000Z',
    });
    expect(status.retentionState).toBe(RETENTION_STATES.REVIEW_SCHEDULED);
    expect(status.alert).toBe(false);
  });

  it('detectForgetting surfaces only skills whose retention is at risk', () => {
    const alerts = detectForgetting({
      states: [
        { skillId: 'P003', fluentAt: FLUENT_AT, fluencyLevel: 'gold', status: 'fluent', retentionStatus: 'reviewScheduled' },
        { skillId: 'P004', fluentAt: '2026-01-07T00:00:00.000Z', fluencyLevel: 'gold', status: 'fluent', retentionStatus: 'reviewScheduled' },
      ],
      asOf: '2026-01-08T00:00:00.000Z',
    });
    const ids = alerts.map((a) => a.skillId);
    expect(ids).toContain('P003');
    expect(ids).not.toContain('P004');
  });
});

describe('Percentage retention — summary shape', () => {
  it('buckets skill-states into upcoming / overdue / history', () => {
    const summary = summariseRetention({
      states: [
        // upcoming: fluent but not yet due
        { skillId: 'P001', fluentAt: FLUENT_AT, fluencyLevel: 'gold', status: 'fluent', retentionStatus: 'reviewScheduled', nextReviewDate: '2026-02-01T00:00:00.000Z' },
        // overdue: due date passed
        { skillId: 'P003', fluentAt: FLUENT_AT, fluencyLevel: 'gold', status: 'fluent', retentionStatus: 'reviewScheduled' },
        // history: retained
        { skillId: 'P005', fluentAt: FLUENT_AT, fluencyLevel: 'gold', status: 'retained', retentionStatus: 'retained' },
      ],
      asOf: '2026-01-15T00:00:00.000Z',
    });
    expect(summary.domainId).toBe('percentage');
    expect(summary.upcomingReviews.map((r) => r.skillId)).toContain('P001');
    expect(summary.overdueReviews.map((r) => r.skillId)).toContain('P003');
    expect(summary.retentionHistory.map((r) => r.skillId)).toContain('P005');
  });

  it('returns an empty-state message when there is nothing scheduled', () => {
    const summary = summariseRetention({ states: [], asOf: FLUENT_AT });
    expect(summary.emptyState).toMatch(/fluent/i);
  });
});

describe('Percentage retention — review generation', () => {
  it('produces a same-concept review with question families', () => {
    const review = generateRetentionReview({ skillId: 'P003', previousQuestionFamilyIds: [] });
    expect(review.skillId).toBe('P003');
    expect(review.sameConcept).toBe(true);
    expect(review.questionFamilyIds.length).toBeGreaterThan(0);
  });
});

describe('Percentage retention — outcome classification + completion', () => {
  it('classifies retained / needs-review / forgotten by accuracy + speed', () => {
    expect(classifyReviewOutcome({ accuracy: 95, averageTimeSeconds: 6, skillId: 'P003' }).retentionStatus).toBe(RETENTION_STATES.RETAINED);
    expect(classifyReviewOutcome({ accuracy: 70, skillId: 'P003' }).retentionStatus).toBe(RETENTION_STATES.NEEDS_REVIEW);
    expect(classifyReviewOutcome({ accuracy: 30, skillId: 'P003' }).retentionStatus).toBe(RETENTION_STATES.FORGOTTEN);
  });

  it('advances the schedule to the next interval when retained', () => {
    const completion = applyReviewCompletion({ skillId: 'P003', accuracy: 95, averageTimeSeconds: 6, lastIntervalDays: 3 });
    expect(completion.set.retentionStatus).toBe(RETENTION_STATES.RETAINED);
    expect(completion.nextIntervalDays).toBe(7);
    expect(completion.set.nextReviewDate).toBeInstanceOf(Date);
  });

  it('re-reviews soon (shortest interval) when not retained', () => {
    const completion = applyReviewCompletion({ skillId: 'P003', accuracy: 40, lastIntervalDays: 7 });
    expect(completion.set.retentionStatus).toBe(RETENTION_STATES.FORGOTTEN);
    expect(completion.nextIntervalDays).toBe(3);
  });
});

describe('Percentage retention — self-validation', () => {
  it('passes the engine self-test', () => {
    const result = validatePercentageRetentionEngine();
    expect(result.isValid).toBe(true);
  });
});
