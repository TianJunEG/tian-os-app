import { describe, it, expect } from 'vitest';
import {
  initClozeState,
  recordAttempt,
  selectNextPassageId,
  skillReadiness,
  summarizeCloze,
  CLOZE_INTERVALS_DAYS,
} from './clozeEngine.js';

const DAY = 24 * 60 * 60 * 1000;
const PASSAGES = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
const full = (score) => ({ score, total: 15, bySkill: { grammar: { correct: score, total: 7 }, collocation: { correct: 0, total: 4 }, content: { correct: 0, total: 4 } } });

describe('cloze engine', () => {
  it('starts empty', () => {
    expect(initClozeState()).toEqual({ passages: {} });
  });

  it('records an attempt: best/last score + timestamp', () => {
    let s = initClozeState();
    s = recordAttempt(s, 'a', full(9), 1000);
    expect(s.passages.a.attempts).toBe(1);
    expect(s.passages.a.lastScore).toBe(9);
    expect(s.passages.a.bestScore).toBe(9);
    expect(s.passages.a.lastAt).toBe(1000);
    s = recordAttempt(s, 'a', full(6), 2000); // worse
    expect(s.passages.a.attempts).toBe(2);
    expect(s.passages.a.bestScore).toBe(9); // best is kept
    expect(s.passages.a.lastScore).toBe(6);
  });

  it('advances the box on a strong score and resets on a weak one', () => {
    let s = initClozeState();
    s = recordAttempt(s, 'a', full(13), 1000); // 87% → box up
    expect(s.passages.a.box).toBe(2);
    s = recordAttempt(s, 'a', full(14), 2000); // box up again
    expect(s.passages.a.box).toBe(3);
    s = recordAttempt(s, 'a', full(5), 3000); // 33% → reset
    expect(s.passages.a.box).toBe(1);
  });

  it('accumulates per-skill accuracy across attempts', () => {
    let s = initClozeState();
    s = recordAttempt(s, 'a', full(7), 1000); // grammar 7/7
    s = recordAttempt(s, 'a', full(0), 2000); // grammar 0/7
    const r = skillReadiness(s);
    expect(r.grammar).toBe(50); // 7 of 14
    expect(r.collocation).toBe(0); // 0 of 8
  });

  it('selects unseen passages first, in bank order', () => {
    let s = initClozeState();
    expect(selectNextPassageId(s, { passages: PASSAGES, now: 0 })).toBe('a');
    s = recordAttempt(s, 'a', full(15), 1000);
    expect(selectNextPassageId(s, { passages: PASSAGES, now: 1000 })).toBe('b');
  });

  it('re-surfaces a due passage once its spaced interval elapses', () => {
    let s = initClozeState();
    // all three seen, all mastered-ish
    s = recordAttempt(s, 'a', full(15), 0);
    s = recordAttempt(s, 'b', full(15), 0);
    s = recordAttempt(s, 'c', full(15), 0);
    // box 2 → interval = CLOZE_INTERVALS_DAYS[1] days; nothing due yet
    const soon = CLOZE_INTERVALS_DAYS[1] * DAY - 1;
    // not due → falls back to least-recently practised (still returns something)
    expect(selectNextPassageId(s, { passages: PASSAGES, now: soon })).toBeTruthy();
    // after the interval, 'a' is due
    const later = CLOZE_INTERVALS_DAYS[1] * DAY + 1;
    expect(['a', 'b', 'c']).toContain(selectNextPassageId(s, { passages: PASSAGES, now: later }));
  });

  it('summarize counts done / mastered / due', () => {
    let s = initClozeState();
    const sum0 = summarizeCloze(s, { passages: PASSAGES, now: 0 });
    expect(sum0.counts).toEqual({ total: 3, done: 0, mastered: 0, dueNow: 3 });
    // master 'a' to box 5
    let now = 0;
    for (let i = 0; i < 4; i++) { s = recordAttempt(s, 'a', full(15), now); now += 30 * DAY; }
    const sum1 = summarizeCloze(s, { passages: PASSAGES, now });
    expect(sum1.counts.done).toBe(1);
    expect(sum1.counts.mastered).toBe(1);
  });
});
