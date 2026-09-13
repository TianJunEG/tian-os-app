import { describe, it, expect } from 'vitest';
import { comicMomentum } from './comicMomentum';

// Fixed "now" so the day math is deterministic: Wed 2026-06-17, midday.
const NOW = new Date('2026-06-17T12:00:00');
const at = (iso) => new Date(iso);

describe('comicMomentum', () => {
  it('is zero for no activity', () => {
    expect(comicMomentum([], NOW)).toEqual({ thisWeek: 0, streak: 0 });
  });

  it('counts completions in the last 7 days for thisWeek', () => {
    const list = [
      at('2026-06-17T09:00:00'), // today
      at('2026-06-12T09:00:00'), // 5 days ago — within a week
      at('2026-06-09T09:00:00'), // 8 days ago — outside the week
    ];
    expect(comicMomentum(list, NOW).thisWeek).toBe(2);
  });

  it('counts a consecutive day streak ending today', () => {
    const list = [
      at('2026-06-17T08:00:00'), // today
      at('2026-06-16T20:00:00'), // yesterday
      at('2026-06-16T09:00:00'), // yesterday again (same day → counts once)
      at('2026-06-15T10:00:00'), // 2 days ago
      at('2026-06-13T10:00:00'), // gap on the 14th → stops here
    ];
    expect(comicMomentum(list, NOW).streak).toBe(3);
  });

  it('stays alive when the most recent activity was yesterday (not today)', () => {
    const list = [at('2026-06-16T10:00:00'), at('2026-06-15T10:00:00')];
    expect(comicMomentum(list, NOW).streak).toBe(2);
  });

  it('is a broken streak when the latest activity is 2+ days ago', () => {
    const list = [at('2026-06-14T10:00:00'), at('2026-06-13T10:00:00')];
    expect(comicMomentum(list, NOW).streak).toBe(0);
  });

  it('ignores invalid/future timestamps gracefully', () => {
    const list = [at('2026-06-17T09:00:00'), new Date('not-a-date'), at('2027-01-01T00:00:00')];
    const { thisWeek, streak } = comicMomentum(list, NOW);
    expect(thisWeek).toBe(1); // future one excluded
    expect(streak).toBe(1);
  });
});
