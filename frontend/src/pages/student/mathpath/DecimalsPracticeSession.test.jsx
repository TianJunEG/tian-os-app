import { describe, it, expect } from 'vitest';
import { buildSubmitPayload, summarisePracticeResult } from './DecimalsPracticeSession';

describe('DecimalsPracticeSession.buildSubmitPayload', () => {
  it('maps collected answers to the submit payload shape', () => {
    const payload = buildSubmitPayload([
      { questionId: 'QF_D001_001_0', studentAnswer: '2', timeTaken: 7 },
      { questionId: 'QF_D001_001_1', studentAnswer: '0.5', timeTaken: 9 },
    ]);
    expect(payload.responses).toHaveLength(2);
    expect(payload.responses[0]).toMatchObject({
      questionId: 'QF_D001_001_0',
      studentAnswer: '2',
      timeTaken: 7,
      skipped: false,
      workingSubmitted: false,
      fullscreenWorkingSubmitted: false,
      workingEvidence: [],
    });
    expect(payload.responses[1]).toMatchObject({
      questionId: 'QF_D001_001_1',
      studentAnswer: '0.5',
      timeTaken: 9,
      skipped: false,
      workingSubmitted: false,
      fullscreenWorkingSubmitted: false,
      workingEvidence: [],
    });
  });

  it('drops blank answers and coerces types', () => {
    const payload = buildSubmitPayload([
      { questionId: 'q1', studentAnswer: '  ', timeTaken: 3 },
      { questionId: 'q2', studentAnswer: 12, timeTaken: '4' },
      { questionId: null, studentAnswer: '5' },
    ]);
    expect(payload.responses).toHaveLength(1);
    expect(payload.responses[0]).toMatchObject({
      questionId: 'q2',
      studentAnswer: '12',
      timeTaken: 4,
      skipped: false,
      workingSubmitted: false,
      fullscreenWorkingSubmitted: false,
      workingEvidence: [],
    });
  });

  it('keeps skipped responses so the backend can persist the attempt', () => {
    const payload = buildSubmitPayload([
      { questionId: 'q1', studentAnswer: '', skipped: true, timeTaken: 5 },
    ]);
    expect(payload.responses[0]).toMatchObject({ questionId: 'q1', studentAnswer: '', skipped: true, timeTaken: 5 });
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
      results: [
        {
          questionId: 'q1',
          prompt: 'What is 0.5 as a fraction?',
          studentAnswer: '1/2',
          correctAnswer: '1/2',
          correct: true,
          solutionSteps: ['0.5 is five tenths.', '5/10 = 1/2.'],
        },
      ],
    });
    expect(view).toMatchObject({ total: 6, correct: 5, accuracyPercentage: 83 });
    expect(view.skillRows).toEqual([
      { skillId: 'D006', accuracy: 100, status: 'mastered' },
      { skillId: 'D007', accuracy: 50, status: 'needsReview' },
    ]);
    expect(view.questionRows).toEqual([
      {
        questionId: 'q1',
        prompt: 'What is 0.5 as a fraction?',
        studentAnswer: '1/2',
        correctAnswer: '1/2',
        correct: true,
        skipped: false,
        workedSolution: '',
        solutionSteps: ['0.5 is five tenths.', '5/10 = 1/2.'],
      },
    ]);
  });

  it('handles an empty/partial summary safely', () => {
    const view = summarisePracticeResult({});
    expect(view).toEqual({ total: 0, correct: 0, accuracyPercentage: 0, skillRows: [], questionRows: [] });
  });
});
