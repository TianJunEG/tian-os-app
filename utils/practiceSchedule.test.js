import { describe, it, expect } from 'vitest';
import { SESSION_OFFSETS, buildSessions, recomputeSchedule } from './practiceSchedule.js';

const DAY = 24 * 60 * 60 * 1000;

describe('buildSessions', () => {
  it('returns no sessions for an empty pool', () => {
    expect(buildSessions([])).toEqual([]);
    expect(buildSessions(null)).toEqual([]);
  });

  it('spreads questions across the spaced sessions with the right offsets', () => {
    const qs = Array.from({ length: 9 }, (_, i) => ({ prompt: `q${i}`, difficulty: 'similar' }));
    const t0 = 1_000_000;
    const sessions = buildSessions(qs, t0);

    expect(sessions).toHaveLength(SESSION_OFFSETS.length);
    expect(sessions.map((s) => s.sessionNumber)).toEqual([1, 2, 3]);

    const total = sessions.reduce((n, s) => n + s.questions.length, 0);
    expect(total).toBe(9);

    expect(sessions[0].scheduledFor.getTime()).toBe(t0 + SESSION_OFFSETS[0] * DAY);
    expect(sessions[2].scheduledFor.getTime()).toBe(t0 + SESSION_OFFSETS[2] * DAY);
  });

  it('drops empty sessions when there are fewer questions than sessions', () => {
    const sessions = buildSessions([{ prompt: 'only', difficulty: 'similar' }]);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].questions).toHaveLength(1);
  });
});

describe('recomputeSchedule', () => {
  it('counts sessions and finds the earliest incomplete due date', () => {
    const d0 = new Date('2026-01-01');
    const d2 = new Date('2026-01-03');
    const d7 = new Date('2026-01-08');
    const worksheet = {
      practiceSessions: [
        { scheduledFor: d0, completed: true },
        { scheduledFor: d2, completed: false },
        { scheduledFor: d7, completed: false },
      ],
    };
    recomputeSchedule(worksheet);
    expect(worksheet.sessionsTotal).toBe(3);
    expect(worksheet.sessionsCompleted).toBe(1);
    expect(worksheet.nextDueAt).toEqual(d2);
  });

  it('sets nextDueAt to null when every session is complete', () => {
    const worksheet = { practiceSessions: [{ scheduledFor: new Date(), completed: true }] };
    recomputeSchedule(worksheet);
    expect(worksheet.nextDueAt).toBeNull();
  });
});
