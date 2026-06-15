import { describe, it, expect } from 'vitest';
import { buildAnswerBody, summariseDiagnosticResult } from './DecimalsDiagnosticSession';

describe('DecimalsDiagnosticSession.buildAnswerBody', () => {
  it('builds the answer POST body with elapsed time', () => {
    const body = buildAnswerBody({
      question: { questionId: 'QF_D006_001__v0' },
      draft: '0.13',
      startedAtMs: 1000,
      nowMs: 6000,
    });
    expect(body).toEqual({ questionId: 'QF_D006_001__v0', studentAnswer: '0.13', timeTakenMs: 5000 });
  });

  it('coerces a blank/undefined answer and never returns negative time', () => {
    const body = buildAnswerBody({ question: { questionId: 'q1' }, draft: undefined, startedAtMs: 9000, nowMs: 1000 });
    expect(body).toEqual({ questionId: 'q1', studentAnswer: '', timeTakenMs: 0 });
  });
});

describe('DecimalsDiagnosticSession.summariseDiagnosticResult', () => {
  it('derives display data from a diagnostic result payload', () => {
    const view = summariseDiagnosticResult({
      readinessBand: 'progressing',
      readinessScore: 62,
      questionsCorrect: 5,
      totalQuestions: 8,
      weakSkills: [{ skillId: 'D006', name: 'Adding and Subtracting Decimals' }],
      masteredSkills: [{ skillId: 'D001', name: 'Decimal Place Value' }],
      recommendedStartingSkill: { skillId: 'D006', name: 'Adding and Subtracting Decimals' },
    });
    expect(view).toMatchObject({
      readinessBand: 'progressing',
      readinessScore: 62,
      questionsCorrect: 5,
      totalQuestions: 8,
      recommendedStartingSkillId: 'D006',
      recommendedStartingSkillName: 'Adding and Subtracting Decimals',
    });
    expect(view.weakSkills).toEqual([{ skillId: 'D006', name: 'Adding and Subtracting Decimals' }]);
  });

  it('falls back safely on an empty result', () => {
    const view = summariseDiagnosticResult({});
    expect(view).toMatchObject({
      readinessBand: 'developing',
      readinessScore: 0,
      questionsCorrect: 0,
      totalQuestions: 0,
      recommendedStartingSkillId: 'D001',
      weakSkills: [],
      masteredSkills: [],
    });
  });

  it('reads recommendedStartingSkillId when no nested skill object is present', () => {
    const view = summariseDiagnosticResult({ recommendedStartingSkillId: 'D004' });
    expect(view.recommendedStartingSkillId).toBe('D004');
  });
});
