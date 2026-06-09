import { describe, it, expect } from 'vitest';
import {
  TABLES,
  QUIZ_LENGTH,
  FLUENCY_THRESHOLD_MS,
  STRENGTH,
  factKey,
  allFactPairs,
  initialFactState,
  generateQuestions,
  updateFactRecord,
  scoreSession,
  isTimesTableMistake,
  groupTimesTableMistakes,
} from './timesTablesEngine';

describe('timesTablesEngine', () => {
  describe('constants', () => {
    it('TABLES covers 2-12', () => {
      expect(TABLES).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });
    it('QUIZ_LENGTH is 10', () => {
      expect(QUIZ_LENGTH).toBe(10);
    });
    it('FLUENCY_THRESHOLD_MS is 4000', () => {
      expect(FLUENCY_THRESHOLD_MS).toBe(4000);
    });
  });

  describe('factKey', () => {
    it('puts smaller factor first', () => {
      expect(factKey(7, 3)).toBe('3x7');
      expect(factKey(3, 7)).toBe('3x7');
    });
    it('handles equal factors', () => {
      expect(factKey(5, 5)).toBe('5x5');
    });
  });

  describe('allFactPairs', () => {
    it('returns unique pairs where a <= b', () => {
      const pairs = allFactPairs([2, 3]);
      expect(pairs).toEqual([[2, 2], [2, 3], [3, 3]]);
    });
    it('returns 66 pairs for the default table set', () => {
      expect(allFactPairs().length).toBe(66);
    });
  });

  describe('initialFactState', () => {
    it('creates records for all pairs', () => {
      const state = initialFactState([2, 3]);
      expect(Object.keys(state)).toHaveLength(3);
      expect(state['2x3'].strength).toBe(STRENGTH.NEW);
    });
    it('initialises all counters to zero', () => {
      const state = initialFactState([4]);
      const rec = state['4x4'];
      expect(rec.correct).toBe(0);
      expect(rec.incorrect).toBe(0);
      expect(rec.attempts).toBe(0);
    });
  });

  describe('generateQuestions', () => {
    it('returns the requested count', () => {
      const qs = generateQuestions({}, TABLES, 5);
      expect(qs).toHaveLength(5);
    });
    it('each question has a, b, product', () => {
      const qs = generateQuestions({}, TABLES, 3);
      for (const q of qs) {
        expect(q).toHaveProperty('a');
        expect(q).toHaveProperty('b');
        expect(q.product).toBe(q.a * q.b);
      }
    });
    it('does not exceed available unique pairs', () => {
      const qs = generateQuestions({}, [2], 10);
      // only 1 unique pair (2x2) so max 1
      expect(qs.length).toBeLessThanOrEqual(1);
    });
  });

  describe('updateFactRecord', () => {
    it('increments correct on correct answer', () => {
      const base = { correct: 1, incorrect: 0, attempts: 1, totalMs: 3000, strength: STRENGTH.NEW, lastSeen: null };
      const updated = updateFactRecord(base, { correct: true, timeMs: 2500 });
      expect(updated.correct).toBe(2);
      expect(updated.attempts).toBe(2);
      expect(updated.totalMs).toBe(5500);
    });
    it('increments incorrect on wrong answer', () => {
      const base = { correct: 0, incorrect: 0, attempts: 0, totalMs: 0, strength: STRENGTH.NEW, lastSeen: null };
      const updated = updateFactRecord(base, { correct: false, timeMs: 5000 });
      expect(updated.incorrect).toBe(1);
      expect(updated.strength).toBe(STRENGTH.WEAK);
    });
    it('classifies as SECURE when fast + accurate', () => {
      const base = { correct: 9, incorrect: 0, attempts: 9, totalMs: 18000, strength: STRENGTH.DEVELOPING, lastSeen: null };
      const updated = updateFactRecord(base, { correct: true, timeMs: 2000 });
      expect(updated.strength).toBe(STRENGTH.SECURE);
    });
    it('classifies as DEVELOPING when moderately accurate', () => {
      const base = { correct: 5, incorrect: 2, attempts: 7, totalMs: 40000, strength: STRENGTH.WEAK, lastSeen: null };
      const updated = updateFactRecord(base, { correct: true, timeMs: 6000 });
      expect(updated.strength).toBe(STRENGTH.DEVELOPING);
    });
  });

  describe('scoreSession', () => {
    it('returns updated state and session stats', () => {
      const state = initialFactState([2, 3]);
      const results = [
        { a: 2, b: 3, correct: true, timeMs: 2000 },
        { a: 3, b: 3, correct: false, timeMs: 8000 },
      ];
      const { updatedFactState, sessionStats } = scoreSession(state, results);
      expect(updatedFactState['2x3'].correct).toBe(1);
      expect(updatedFactState['3x3'].incorrect).toBe(1);
      expect(sessionStats.correct).toBe(1);
      expect(sessionStats.total).toBe(2);
      expect(sessionStats.accuracy).toBe(0.5);
    });
    it('labels fluency correctly for high performance', () => {
      const state = initialFactState([2]);
      const results = [{ a: 2, b: 2, correct: true, timeMs: 1500 }];
      const { sessionStats } = scoreSession(state, results);
      expect(sessionStats.fluencyLabel).toBe('Fluent');
    });
  });

  describe('isTimesTableMistake', () => {
    it('detects × multiplication sign', () => {
      expect(isTimesTableMistake({ questionStem: 'What is 6 × 7?' })).toBe(true);
    });
    it('detects x multiplication sign', () => {
      expect(isTimesTableMistake({ questionStem: '3 x 4 = ?' })).toBe(true);
    });
    it('detects * multiplication sign', () => {
      expect(isTimesTableMistake({ questionText: '9 * 8' })).toBe(true);
    });
    it('rejects non-multiplication stems', () => {
      expect(isTimesTableMistake({ questionStem: 'Find 2/5 + 1/5' })).toBe(false);
    });
  });

  describe('groupTimesTableMistakes', () => {
    it('separates table and non-table mistakes', () => {
      const mistakes = [
        { questionStem: '6 × 7 = ?', studentAnswer: '48' },
        { questionStem: 'Find 1/3 + 1/3', studentAnswer: '2/6' },
        { questionStem: '8 x 9 = ?', studentAnswer: '63' },
      ];
      const result = groupTimesTableMistakes(mistakes);
      expect(result.tableMistakes).toHaveLength(2);
      expect(result.nonTableMistakes).toHaveLength(1);
      expect(result.hasTableMistakes).toBe(true);
    });
    it('extracts weak facts', () => {
      const mistakes = [
        { questionStem: '7 × 3 = ?', studentAnswer: '24' },
      ];
      const result = groupTimesTableMistakes(mistakes);
      expect(result.weakFacts).toContain('3x7');
    });
    it('handles empty array', () => {
      const result = groupTimesTableMistakes([]);
      expect(result.hasTableMistakes).toBe(false);
      expect(result.count).toBe(0);
    });
  });
});
