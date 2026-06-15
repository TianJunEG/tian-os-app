import { describe, it, expect } from 'vitest';
import {
  selectTargetDifficulty,
  buildDifficultyDistribution,
} from '../services/psl/problemGenerator.js';

describe('PSL difficulty progression', () => {
  describe('selectTargetDifficulty', () => {
    it('returns 1 for beginners (score < 40)', () => {
      expect(selectTargetDifficulty(0)).toBe(1);
      expect(selectTargetDifficulty(20)).toBe(1);
      expect(selectTargetDifficulty(39)).toBe(1);
    });

    it('returns 2 for developing students (40–74)', () => {
      expect(selectTargetDifficulty(40)).toBe(2);
      expect(selectTargetDifficulty(60)).toBe(2);
      expect(selectTargetDifficulty(74)).toBe(2);
    });

    it('returns 3 for strong students (75+)', () => {
      expect(selectTargetDifficulty(75)).toBe(3);
      expect(selectTargetDifficulty(90)).toBe(3);
      expect(selectTargetDifficulty(100)).toBe(3);
    });

    it('defaults to 1 with no score', () => {
      expect(selectTargetDifficulty()).toBe(1);
      expect(selectTargetDifficulty(undefined)).toBe(1);
    });
  });

  describe('buildDifficultyDistribution', () => {
    it('returns the correct number of items', () => {
      expect(buildDifficultyDistribution(2, 5)).toHaveLength(5);
      expect(buildDifficultyDistribution(1, 10)).toHaveLength(10);
    });

    it('all values are between 1 and 3', () => {
      for (const target of [1, 2, 3]) {
        const dist = buildDifficultyDistribution(target, 100);
        expect(dist.every((d) => d >= 1 && d <= 3)).toBe(true);
      }
    });

    it('majority of items match the target difficulty', () => {
      const dist = buildDifficultyDistribution(2, 1000);
      const targetCount = dist.filter((d) => d === 2).length;
      expect(targetCount).toBeGreaterThan(600);
    });

    it('clamps at boundaries — target 1 never goes below 1, target 3 never goes above 3', () => {
      const low = buildDifficultyDistribution(1, 500);
      expect(low.every((d) => d >= 1)).toBe(true);
      const high = buildDifficultyDistribution(3, 500);
      expect(high.every((d) => d <= 3)).toBe(true);
    });
  });
});
