import { describe, it, expect } from 'vitest';
import {
  TEST_MODES,
  DEFAULT_TEST_MODE,
  isTestMode,
  resolveTestMode,
  getTestModeConfig,
  normalizeDifficultyMix,
  sampleQuestionsByDifficulty,
} from './testModePresets.js';

const q = (id, difficulty, extra = {}) => ({ _id: id, difficulty, ...extra });

describe('resolveTestMode', () => {
  it('honours an explicit valid testMode', () => {
    expect(resolveTestMode({ testMode: 'error_diagnosis' })).toBe('error_diagnosis');
  });

  it('maps a legacy outputMode when testMode is absent', () => {
    expect(resolveTestMode({ outputMode: 'schoolAlignedMock' })).toBe('psle_mock');
    expect(resolveTestMode({ outputMode: 'topicTest' })).toBe('topic_test');
  });

  it('falls back to the default for unknown input', () => {
    expect(resolveTestMode({ testMode: 'nonsense' })).toBe(DEFAULT_TEST_MODE);
    expect(resolveTestMode({})).toBe(DEFAULT_TEST_MODE);
  });

  it('exposes a config for every mode', () => {
    Object.keys(TEST_MODES).forEach((mode) => {
      expect(isTestMode(mode)).toBe(true);
      const cfg = getTestModeConfig(mode);
      expect(cfg.difficultyMix).toBeTruthy();
    });
  });
});

describe('normalizeDifficultyMix', () => {
  it('returns null for empty/invalid input', () => {
    expect(normalizeDifficultyMix(null)).toBeNull();
    expect(normalizeDifficultyMix({})).toBeNull();
    expect(normalizeDifficultyMix({ easy: 0, medium: 0, hard: 0 })).toBeNull();
  });

  it('coerces partial mixes', () => {
    expect(normalizeDifficultyMix({ easy: 50 })).toEqual({ easy: 50, medium: 0, hard: 0 });
  });
});

describe('sampleQuestionsByDifficulty', () => {
  const pool = [
    ...Array.from({ length: 10 }, (_, i) => q(`e${i}`, 'easy')),
    ...Array.from({ length: 10 }, (_, i) => q(`m${i}`, 'medium')),
    ...Array.from({ length: 10 }, (_, i) => q(`h${i}`, 'hard')),
  ];

  it('respects the requested mix', () => {
    const picked = sampleQuestionsByDifficulty(pool, 10, { easy: 40, medium: 40, hard: 20 });
    expect(picked).toHaveLength(10);
    const byDiff = picked.reduce((acc, p) => ({ ...acc, [p.difficulty]: (acc[p.difficulty] || 0) + 1 }), {});
    expect(byDiff.easy).toBe(4);
    expect(byDiff.medium).toBe(4);
    expect(byDiff.hard).toBe(2);
  });

  it('keeps the hard bucket on small papers (largest-remainder, not double-round)', () => {
    // count=4 with 40/40/20: naive round(1.6)+round(1.6)=4 would zero out hard.
    const picked = sampleQuestionsByDifficulty(pool, 4, { easy: 40, medium: 40, hard: 20 });
    expect(picked).toHaveLength(4);
    const byDiff = picked.reduce((acc, p) => ({ ...acc, [p.difficulty]: (acc[p.difficulty] || 0) + 1 }), {});
    expect(byDiff.hard).toBe(1);
    expect(byDiff.easy).toBe(2);
    expect(byDiff.medium).toBe(1);
  });

  it('does NOT just take the first N of one difficulty (the old bug)', () => {
    // First 10 of the pool are all easy; a correct sampler must reach into medium/hard.
    const picked = sampleQuestionsByDifficulty(pool, 10, { easy: 40, medium: 40, hard: 20 });
    const allEasy = picked.every((p) => p.difficulty === 'easy');
    expect(allEasy).toBe(false);
  });

  it('backfills shortfall when a bucket is empty', () => {
    const easyOnly = Array.from({ length: 6 }, (_, i) => q(`e${i}`, 'easy'));
    const picked = sampleQuestionsByDifficulty(easyOnly, 5, { easy: 30, medium: 40, hard: 30 });
    expect(picked).toHaveLength(5);
    expect(picked.every((p) => p.difficulty === 'easy')).toBe(true);
  });

  it('never returns duplicates', () => {
    const picked = sampleQuestionsByDifficulty(pool, 25, { easy: 33, medium: 33, hard: 33 });
    const ids = picked.map((p) => p._id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('handles empty pool and zero count', () => {
    expect(sampleQuestionsByDifficulty([], 5, {})).toEqual([]);
    expect(sampleQuestionsByDifficulty(pool, 0, {})).toEqual([]);
  });
});
