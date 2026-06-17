import { describe, it, expect } from 'vitest';
import { expectedMarksPerQuestion } from './assessmentSpecifications.js';

describe('expectedMarksPerQuestion', () => {
  it('is exact for single difficulty bands (easy=1, medium=2, hard=3)', () => {
    expect(expectedMarksPerQuestion('easy')).toBe(1);
    expect(expectedMarksPerQuestion('medium')).toBe(2);
    expect(expectedMarksPerQuestion('hard')).toBe(3);
  });

  it('weights by the difficulty mix for mixed topics', () => {
    // 40/40/20 → 1*.4 + 2*.4 + 3*.2 = 1.8
    expect(expectedMarksPerQuestion('mixed', { easy: 40, medium: 40, hard: 20 })).toBeCloseTo(1.8, 5);
    // 25/45/30 → 1*.25 + 2*.45 + 3*.30 = 2.05
    expect(expectedMarksPerQuestion('mixed', { easy: 25, medium: 45, hard: 30 })).toBeCloseTo(2.05, 5);
  });

  it('sizes a mixed paper to track the requested total better than a flat rate', () => {
    // 40 marks, 40/40/20 mix → expected ~1.8/q → ~22 questions summing back ~40,
    // vs the old flat-medium assumption (40/2 = 20 questions → ~36 actual marks).
    const mix = { easy: 40, medium: 40, hard: 20 };
    const expected = expectedMarksPerQuestion('mixed', mix);
    const count = Math.round(40 / expected);
    const projectedMarks = count * expected;
    expect(Math.abs(projectedMarks - 40)).toBeLessThanOrEqual(1);
  });

  it('falls back to the medium rate when the mix is empty', () => {
    expect(expectedMarksPerQuestion('mixed', { easy: 0, medium: 0, hard: 0 })).toBe(2);
    expect(expectedMarksPerQuestion('mixed', null)).toBe(2);
  });
});
