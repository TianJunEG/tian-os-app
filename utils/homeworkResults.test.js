// Guards the tutor weekly-homework block: per-topic counts must persist cleanly
// and never produce an impossible (>100%) accuracy.
import { describe, it, expect } from 'vitest';
import { sanitizeHomeworkResults } from './homeworkResults.js';

describe('sanitizeHomeworkResults', () => {
  it('keeps valid per-topic rows with integer counts', () => {
    const out = sanitizeHomeworkResults([
      { topicId: 'abc', topicName: 'Fractions', correct: 8, total: 10 },
      { topicId: 'def', topicName: 'Decimals', correct: '5', total: '8' },
    ]);
    expect(out).toEqual([
      { topicId: 'abc', topicName: 'Fractions', total: 10, correct: 8 },
      { topicId: 'def', topicName: 'Decimals', total: 8, correct: 5 },
    ]);
  });

  it('drops rows with no topic name or zero total', () => {
    const out = sanitizeHomeworkResults([
      { topicName: '', correct: 3, total: 5 },
      { topicName: 'Ratio', correct: 0, total: 0 },
      { topicName: '   ', correct: 1, total: 2 },
      { topicName: 'Money', correct: 4, total: 6 },
    ]);
    expect(out.map((r) => r.topicName)).toEqual(['Money']);
  });

  it('clamps correct to total so accuracy can never exceed 100%', () => {
    const [row] = sanitizeHomeworkResults([{ topicName: 'Fractions', correct: 12, total: 10 }]);
    expect(row).toMatchObject({ correct: 10, total: 10 });
  });

  it('coerces junk/negative/decimal counts to safe non-negative integers', () => {
    const [row] = sanitizeHomeworkResults([{ topicName: 'Time', correct: -3, total: 7.6 }]);
    expect(row.total).toBe(8);     // 7.6 -> 8
    expect(row.correct).toBe(0);   // -3 -> 0
    const [row2] = sanitizeHomeworkResults([{ topicName: 'Area', correct: 'oops', total: 5 }]);
    expect(row2.correct).toBe(0);
  });

  it('returns [] for non-array / empty input', () => {
    expect(sanitizeHomeworkResults(undefined)).toEqual([]);
    expect(sanitizeHomeworkResults(null)).toEqual([]);
    expect(sanitizeHomeworkResults('nope')).toEqual([]);
    expect(sanitizeHomeworkResults([])).toEqual([]);
  });
});
