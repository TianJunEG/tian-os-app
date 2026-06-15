import { describe, it, expect } from 'vitest';
import { buildSubmitPayload, summarisePracticeResult } from './DecimalsPracticeSession';

describe('DecimalsPracticeSession.buildSubmitPayload', () => {
  it('maps collected answers to the submit payload shape', () => {
    const payload = buildSubmitPayload([
      { questionId: 'QF_D001_001_0', studentAnswer: '2', timeTaken: 7 },
      { questionId: 'QF_D001_001_1', studentAnswer: '0.5', timeTaken: 9 },
    ]);
    expect(payload).toEqual({
      responses: [
        { questionId: 'QF_D001_001_0', studentAnswer: '2', timeTaken: 7 },
        { questionId: 'QF_D001_001_1', studentAnswer: '0.5', timeTaken: 9 },
      ],
    });
  });

  it('drops blank answers and coerces types', () => {
    const payload = buildSubmitPayload([
      { questionId: 'q1', studentAnswer: '  ', timeTaken: 3 },
      { questionId: 'q2', studentAnswer: 12, timeTaken: '4' },
      { questionId: null, studentAnswer: '5' },
    ]);
    expect(payload.responses).toEqual([
      { questionId: 'q2', studentAnswer: '12', timeTaken: 4 },
    ]);
  });
});

describe('DecimalsPracticeSession.summarisePracticeResult', () => {
  it('derives display data from a submit summary', () => {
    const view = summarisePracticeResult({
      accuracySummary: { total: 6, correct: 5, accuracyPercentage: 83 },
      perSkill: {
        D006: { accuracy: 100, status: 'mastered' },
        D007: { accuracy: 50, status: 'needsReview' },
      },
    });
    expect(view).toMatchObject({ total: 6, correct: 5, accuracyPercentage: 83 });
    expect(view.skillRows).toEqual([
      { skillId: 'D006', accuracy: 100, status: 'mastered' },
      { skillId: 'D007', accuracy: 50, status: 'needsReview' },
    ]);
  });

  it('handles an empty/partial summary safely', () => {
    const view = summarisePracticeResult({});
    expect(view).toEqual({ total: 0, correct: 0, accuracyPercentage: 0, skillRows: [] });
  });
});
