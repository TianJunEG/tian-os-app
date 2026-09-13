import { describe, it, expect } from 'vitest';
import { shouldCreatePracticeMistake } from './mastery.js';

// Every P1-P6 practice-flow client tags a submitted answer `answerCorrect`
// (never `correct`) — confirmed by a live network capture of the real P2
// multiplication practice flow. shouldCreatePracticeMistake used to read only
// `.correct`, which is always undefined on a real payload, so `!result.correct`
// was ALWAYS true — every correct answer across every primary level silently
// logged a phantom mistake record (and, via the same bug in the 6 submit
// routes' correctCount/bySkill computations, the results screen always showed
// 0% accuracy and skill-state mastery tracking never advanced).
describe('shouldCreatePracticeMistake', () => {
  it('does NOT flag a correct answer shaped like the real client payload (answerCorrect only)', () => {
    expect(shouldCreatePracticeMistake({ answerCorrect: true, questionId: 'q1' })).toBe(false);
  });

  it('flags a genuinely wrong answer', () => {
    expect(shouldCreatePracticeMistake({ answerCorrect: false, questionId: 'q1' })).toBe(true);
  });

  it('never flags an error row (no question matched)', () => {
    expect(shouldCreatePracticeMistake({ answerCorrect: false, error: 'Question not found.' })).toBe(false);
  });

  it('falls back to `correct` when `answerCorrect` is absent (defensive compatibility)', () => {
    expect(shouldCreatePracticeMistake({ correct: true })).toBe(false);
    expect(shouldCreatePracticeMistake({ correct: false })).toBe(true);
  });

  it('prefers answerCorrect over a stale/conflicting correct field', () => {
    expect(shouldCreatePracticeMistake({ answerCorrect: true, correct: false })).toBe(false);
  });
});
