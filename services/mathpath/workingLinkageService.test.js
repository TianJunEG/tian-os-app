import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import {
  normalizeLinkId,
  legacyWorkingLookupForMistake,
  directWorkingLookupForMistake,
  validateLearningChain,
} from './workingLinkageService.js';

describe('workingLinkageService', () => {
  describe('normalizeLinkId', () => {
    it('converts ObjectId to string', () => {
      const oid = new mongoose.Types.ObjectId();
      expect(normalizeLinkId(oid)).toBe(oid.toString());
    });

    it('trims whitespace', () => {
      expect(normalizeLinkId('  abc  ')).toBe('abc');
    });

    it('handles null/undefined', () => {
      expect(normalizeLinkId(null)).toBe('');
      expect(normalizeLinkId(undefined)).toBe('');
      expect(normalizeLinkId()).toBe('');
    });
  });

  describe('legacyWorkingLookupForMistake', () => {
    it('converts ObjectId studentId to string', () => {
      const oid = new mongoose.Types.ObjectId();
      const result = legacyWorkingLookupForMistake(
        { studentId: oid, questionId: 'q1' },
        ''
      );
      expect(result.studentId).toBe(oid.toString());
      expect(typeof result.studentId).toBe('string');
    });

    it('prefers explicit studentId param over mistake.studentId', () => {
      const explicit = new mongoose.Types.ObjectId();
      const mistakeOid = new mongoose.Types.ObjectId();
      const result = legacyWorkingLookupForMistake(
        { studentId: mistakeOid, questionId: 'q1' },
        explicit
      );
      expect(result.studentId).toBe(explicit.toString());
    });

    it('returns null when questionId is missing', () => {
      expect(legacyWorkingLookupForMistake({ studentId: 'stu1' })).toBeNull();
    });

    it('returns null when studentId is missing', () => {
      expect(legacyWorkingLookupForMistake({ questionId: 'q1' })).toBeNull();
    });

    it('includes sessionId when present', () => {
      const result = legacyWorkingLookupForMistake(
        { studentId: 's1', questionId: 'q1', sessionId: 'sess1' },
        ''
      );
      expect(result.sessionId).toBe('sess1');
    });

    it('omits sessionId when absent', () => {
      const result = legacyWorkingLookupForMistake(
        { studentId: 's1', questionId: 'q1' },
        ''
      );
      expect(result).not.toHaveProperty('sessionId');
    });
  });

  describe('directWorkingLookupForMistake', () => {
    it('prefers workingId strategy', () => {
      const result = directWorkingLookupForMistake({
        workingId: 'w1',
        attemptId: 'a1',
        mistakeId: 'm1',
      });
      expect(result.strategy).toBe('workingId');
      expect(result.query).toEqual({ workingId: 'w1' });
    });

    it('falls back to attemptId', () => {
      const result = directWorkingLookupForMistake({ attemptId: 'a1' });
      expect(result.strategy).toBe('attemptId');
    });

    it('falls back to mistakeId', () => {
      const result = directWorkingLookupForMistake({ _id: 'm1' });
      expect(result.strategy).toBe('mistakeId');
    });

    it('returns missing_direct_link when no IDs', () => {
      const result = directWorkingLookupForMistake({});
      expect(result.strategy).toBe('missing_direct_link');
      expect(result.query).toBeNull();
    });
  });

  describe('validateLearningChain', () => {
    it('returns ok when chain is consistent', () => {
      const result = validateLearningChain({
        attempt: { attemptId: 'a1' },
        working: { attemptId: 'a1', workingId: 'w1' },
        mistake: { attemptId: 'a1', workingId: 'w1' },
      });
      expect(result.ok).toBe(true);
      expect(result.broken).toHaveLength(0);
    });

    it('detects working-attempt mismatch', () => {
      const result = validateLearningChain({
        attempt: { attemptId: 'a1' },
        working: { attemptId: 'a2', workingId: 'w1' },
      });
      expect(result.ok).toBe(false);
      expect(result.broken).toContain('working_attempt_mismatch');
    });

    it('detects mistake-working mismatch', () => {
      const result = validateLearningChain({
        working: { workingId: 'w1' },
        mistake: { workingId: 'w2' },
      });
      expect(result.ok).toBe(false);
      expect(result.broken).toContain('mistake_working_mismatch');
    });
  });

  describe('mixed ObjectId/String type safety', () => {
    it('legacyWorkingLookup always returns string studentId regardless of input type', () => {
      const cases = [
        new mongoose.Types.ObjectId(),
        '507f1f77bcf86cd799439011',
        'legacy-user-id-string',
      ];
      for (const input of cases) {
        const result = legacyWorkingLookupForMistake(
          { studentId: input, questionId: 'q1' },
          ''
        );
        expect(typeof result.studentId).toBe('string');
      }
    });

    it('normalizeLinkId produces consistent strings for ObjectId comparisons', () => {
      const oid = new mongoose.Types.ObjectId();
      const fromObj = normalizeLinkId(oid);
      const fromStr = normalizeLinkId(oid.toString());
      expect(fromObj).toBe(fromStr);
    });
  });
});
