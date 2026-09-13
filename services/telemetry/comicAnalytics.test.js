import { describe, it, expect, vi } from 'vitest';

// Funnel logic for getComicAnalytics: engagement counts + the trial→paid
// correlation (did engaging with comics during the trial line up with
// converting to a paid subscription?). The DB layer is mocked.

const lteFind = vi.fn();
const subFind = vi.fn();

vi.mock('../../models/LearningTelemetryEvent.js', () => ({
  default: { find: (...a) => lteFind(...a) },
  LEARNING_EVENT_TYPES: [],
}));
vi.mock('../../models/Subscription.js', () => ({ default: { find: (...a) => subFind(...a) } }));
vi.mock('../../config/logger.js', () => ({ default: { warn: () => {}, info: () => {}, error: () => {} } }));

const { getComicAnalytics } = await import('./learningTelemetryService.js');

describe('getComicAnalytics', () => {
  it('aggregates engagement and the trial→paid funnel', async () => {
    // Engagement window events (eventType.$in): 2 opens, 2 completions on 2 days,
    // 2 distinct readers.
    const engagement = [
      { eventType: 'comic_episode_opened', studentId: 'u1', timestamp: new Date('2026-06-15T09:00:00Z') },
      { eventType: 'comic_episode_completed', studentId: 'u1', timestamp: new Date('2026-06-15T09:10:00Z') },
      { eventType: 'comic_episode_opened', studentId: 'u5', timestamp: new Date('2026-06-16T09:00:00Z') },
      { eventType: 'comic_episode_completed', studentId: 'u5', timestamp: new Date('2026-06-16T09:10:00Z') },
    ];
    // Completions used for the trial-window check (eventType === completed).
    const trialCompletions = [
      { studentId: 'u1', timestamp: new Date('2026-01-03T00:00:00Z') }, // inside u1 trial
      { studentId: 'u2', timestamp: new Date('2026-01-04T00:00:00Z') }, // inside u2 trial
      { studentId: 'u3', timestamp: new Date('2026-02-20T00:00:00Z') }, // AFTER u3 trial → doesn't count
    ];
    lteFind.mockImplementation((query) => ({
      lean: async () => (query?.eventType?.$in ? engagement : trialCompletions),
    }));

    // Four trial-bearing subscriptions: u1 engaged+active, u2 engaged+trial,
    // u3 not-engaged+active, u4 not-engaged+expired.
    const subs = [
      { ownerId: 'u1', status: 'active', trialStart: new Date('2026-01-01'), trialEnd: new Date('2026-01-08') },
      { ownerId: 'u2', status: 'trial', trialStart: new Date('2026-01-01'), trialEnd: new Date('2026-01-08') },
      { ownerId: 'u3', status: 'active', trialStart: new Date('2026-01-01'), trialEnd: new Date('2026-01-08') },
      { ownerId: 'u4', status: 'expired', trialStart: new Date('2026-01-01'), trialEnd: new Date('2026-01-08') },
    ];
    subFind.mockReturnValue({ lean: async () => subs });

    const out = await getComicAnalytics({ days: 30 });

    expect(out.engagement).toEqual({
      opens: 2,
      completions: 2,
      distinctReaders: 2,
      dailyCompletions: [
        { date: '2026-06-15', count: 1 },
        { date: '2026-06-16', count: 1 },
      ],
    });

    expect(out.trialFunnel.trialUsers).toBe(4);
    expect(out.trialFunnel.engagedDuringTrial).toBe(2); // u1, u2 (u3's completion is post-trial)
    expect(out.trialFunnel.engagedRate).toBe(50);
    // engaged: u1(active→converted), u2(trial→not) ⇒ 1/2 = 50%
    expect(out.trialFunnel.conversion.engaged).toEqual({ users: 2, converted: 1, rate: 50 });
    // not-engaged: u3(active→converted), u4(expired→not) ⇒ 1/2 = 50%
    expect(out.trialFunnel.conversion.notEngaged).toEqual({ users: 2, converted: 1, rate: 50 });
  });

  it('handles no trials / no events without dividing by zero', async () => {
    lteFind.mockImplementation(() => ({ lean: async () => [] }));
    subFind.mockReturnValue({ lean: async () => [] });

    const out = await getComicAnalytics({});
    expect(out.engagement).toEqual({ opens: 0, completions: 0, distinctReaders: 0, dailyCompletions: [] });
    expect(out.trialFunnel).toEqual({
      trialUsers: 0,
      engagedDuringTrial: 0,
      engagedRate: 0,
      conversion: {
        engaged: { users: 0, converted: 0, rate: 0 },
        notEngaged: { users: 0, converted: 0, rate: 0 },
      },
    });
  });
});
