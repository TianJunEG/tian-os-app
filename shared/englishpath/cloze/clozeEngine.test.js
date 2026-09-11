import { describe, it, expect } from 'vitest';
import {
  initClozeState,
  recordAttempt,
  selectNextPassageId,
  skillReadiness,
  summarizeCloze,
  weakBlanks,
  buildFocusPassage,
  recordFocusResult,
  CLOZE_INTERVALS_DAYS,
} from './clozeEngine.js';
import { gradePassage } from './clozeGrader.js';

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

describe('cloze mistake tracking', () => {
  // A tiny 3-blank "passage" (real ones have 15) so the fixture stays readable.
  const RICH = [
    {
      id: 'p1',
      title: 'Passage One',
      text: 'The cat sat {1} the mat.\n\nIt was {2} and {3}.',
      blanks: [
        { n: 1, accept: ['on'], skill: 'grammar', note: 'preposition' },
        { n: 2, accept: ['happy', 'content'], skill: 'content', note: 'mood' },
        { n: 3, accept: ['warm'], skill: 'content', note: 'temperature' },
      ],
    },
    {
      id: 'p2',
      title: 'Passage Two',
      text: 'She ran {1} the park {2} her dog.',
      blanks: [
        { n: 1, accept: ['through', 'across'], skill: 'grammar', note: 'preposition' },
        { n: 2, accept: ['with'], skill: 'collocation', note: 'accompanied by' },
      ],
    },
  ];

  it('recordAttempt with perBlank tracks per-blank misses', () => {
    let s = initClozeState();
    const res = gradePassage({ 1: 'off', 2: 'happy', 3: 'warm' }, RICH[0]); // blank 1 wrong
    s = recordAttempt(s, 'p1', res, 1000);
    expect(s.passages.p1.blankStats[1]).toEqual({ misses: 1, lastCorrect: false });
    expect(s.passages.p1.blankStats[2]).toEqual({ misses: 0, lastCorrect: true });
    expect(s.passages.p1.blankStats[3]).toEqual({ misses: 0, lastCorrect: true });
  });

  it('weakBlanks surfaces only blanks whose last attempt was wrong', () => {
    let s = initClozeState();
    s = recordAttempt(s, 'p1', gradePassage({ 1: 'off', 2: 'sad', 3: 'warm' }, RICH[0]), 1000);
    const weak = weakBlanks(s, { passages: RICH });
    expect(weak.map((w) => w.n).sort()).toEqual([1, 2]);
    expect(weak.every((w) => w.passageId === 'p1')).toBe(true);
  });

  it('answering a missed blank right again clears it', () => {
    let s = initClozeState();
    s = recordAttempt(s, 'p1', gradePassage({ 1: 'off', 2: 'happy', 3: 'warm' }, RICH[0]), 1000);
    expect(weakBlanks(s, { passages: RICH })).toHaveLength(1);
    s = recordAttempt(s, 'p1', gradePassage({ 1: 'on', 2: 'happy', 3: 'warm' }, RICH[0]), 2000);
    expect(weakBlanks(s, { passages: RICH })).toHaveLength(0);
    // the miss count is kept as history even after it's cleared
    expect(s.passages.p1.blankStats[1].misses).toBe(1);
  });

  it('buildFocusPassage returns null with nothing weak', () => {
    const s = initClozeState();
    expect(buildFocusPassage(s, { passages: RICH })).toBeNull();
  });

  it('buildFocusPassage assembles a gradable mini-passage across multiple source passages', () => {
    let s = initClozeState();
    s = recordAttempt(s, 'p1', gradePassage({ 1: 'off', 2: 'happy', 3: 'warm' }, RICH[0]), 1000);
    s = recordAttempt(s, 'p2', gradePassage({ 1: 'via', 2: 'with' }, RICH[1]), 1000);
    const focus = buildFocusPassage(s, { passages: RICH });
    expect(focus.blanks).toHaveLength(2); // p1#1 and p2#1
    // renumbered 1..2, and grading it with the right answers is full marks
    const answers = {};
    for (const b of focus.blanks) answers[b.n] = b.accept[0];
    const res = gradePassage(answers, focus);
    expect(res.score).toBe(res.total);
    // p2's blank 2 ("with") was answered correctly and isn't part of the drill,
    // but it shares a paragraph with p2's (weak) blank 1 — it should read
    // naturally, pre-filled, rather than leaving a second open blank.
    expect(focus.text).toContain('She ran');
    expect(focus.text).toContain('with her dog');
    expect(focus.text.match(/\{\d+\}/g)).toHaveLength(2); // only the 2 weak blanks stay open
  });

  it('recordFocusResult folds a focus-drill result back onto the real passages', () => {
    let s = initClozeState();
    s = recordAttempt(s, 'p1', gradePassage({ 1: 'off', 2: 'happy', 3: 'warm' }, RICH[0]), 1000);
    const focus = buildFocusPassage(s, { passages: RICH });
    const answers = {};
    for (const b of focus.blanks) answers[b.n] = b.accept[0]; // get it right this time
    const res = gradePassage(answers, focus);
    s = recordFocusResult(s, focus.mapping, res.perBlank);
    expect(weakBlanks(s, { passages: RICH })).toHaveLength(0);
    expect(s.passages.p1.blankStats[1].lastCorrect).toBe(true);
  });

  it('a blank whose passage no longer exists in the bank is skipped, not thrown', () => {
    let s = initClozeState();
    s = recordAttempt(s, 'gone', gradePassage({ 1: 'x' }, { blanks: [{ n: 1, accept: ['on'], skill: 'grammar' }] }), 1000);
    expect(() => weakBlanks(s, { passages: RICH })).not.toThrow();
    expect(weakBlanks(s, { passages: RICH })).toEqual([]);
  });
});
