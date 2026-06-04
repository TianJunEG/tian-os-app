import { describe, expect, it } from 'vitest';
import {
  directWorkingLookupForMistake,
  legacyWorkingLookupForMistake,
  shapeWorkingLinkFields,
  validateLearningChain,
} from '../services/mathpath/workingLinkageService.js';

describe('working linkage service', () => {
  it('prefers workingId for mistake-to-working lookup', () => {
    expect(directWorkingLookupForMistake({
      workingId: 'working_1',
      attemptId: 'attempt_1',
      mistakeId: 'mistake_1',
    })).toEqual({ query: { workingId: 'working_1' }, strategy: 'workingId' });
  });

  it('falls back to attemptId when workingId is not present', () => {
    expect(directWorkingLookupForMistake({
      attemptId: 'attempt_1',
      mistakeId: 'mistake_1',
    })).toEqual({ query: { attemptId: 'attempt_1' }, strategy: 'attemptId' });
  });

  it('builds legacy lookup only as a fallback', () => {
    expect(legacyWorkingLookupForMistake({
      studentId: 'student_1',
      questionId: 'question_1',
      sessionId: 'session_1',
    })).toEqual({
      studentId: 'student_1',
      questionId: 'question_1',
      sessionId: 'session_1',
    });
  });

  it('shapes working fields with explicit attempt and working IDs', () => {
    expect(shapeWorkingLinkFields({
      attemptId: 'attempt_1',
      workingId: 'working_1',
      rawImage: 'image.png',
      workingInsight: { workingQualityScore: 72, qualityBand: 'GOOD' },
    })).toMatchObject({
      attemptId: 'attempt_1',
      workingId: 'working_1',
      workingPreviewImage: 'image.png',
      workingQualityScore: 72,
      workingQualityBand: 'GOOD',
    });
  });

  it('detects broken attempt and working links', () => {
    const result = validateLearningChain({
      attempt: { attemptId: 'attempt_1' },
      working: { attemptId: 'attempt_2', workingId: 'working_1' },
      mistake: { attemptId: 'attempt_1', workingId: 'working_2' },
    });
    expect(result.ok).toBe(false);
    expect(result.broken).toContain('working_attempt_mismatch');
    expect(result.broken).toContain('mistake_working_mismatch');
  });
});
