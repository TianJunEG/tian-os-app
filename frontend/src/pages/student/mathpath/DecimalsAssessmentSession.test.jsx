import { describe, it, expect } from 'vitest';
import { buildAssessmentPayload, summariseAssessmentResult } from './DecimalsAssessmentSession';

describe('DecimalsAssessmentSession.buildAssessmentPayload', () => {
  it('maps answers and drops blanks (no timing on a summative paper)', () => {
    const payload = buildAssessmentPayload([
      { questionId: 'QF_D001_001_a0', studentAnswer: '2' },
      { questionId: 'x', studentAnswer: '   ' },
      { questionId: 'QF_D003_001_a1', studentAnswer: 4.8 },
    ]);
    expect(payload.responses).toEqual([
      { questionId: 'QF_D001_001_a0', studentAnswer: '2' },
      { questionId: 'QF_D003_001_a1', studentAnswer: '4.8' },
    ]);
  });
});

describe('DecimalsAssessmentSession.summariseAssessmentResult', () => {
  it('maps a band result into display fields', () => {
    const view = summariseAssessmentResult({ band: 'exam_ready', accuracy: 90, total: 10, correct: 9, weakSkillIds: [] });
    expect(view).toMatchObject({ band: 'exam_ready', bandLabel: 'Exam Ready', accuracy: 90, total: 10, correct: 9 });
  });

  it('labels approaching + risk bands and surfaces weak skills', () => {
    expect(summariseAssessmentResult({ band: 'approaching_exam_ready' }).bandLabel).toBe('Approaching Ready');
    const risk = summariseAssessmentResult({ band: 'exam_risk', weakSkillIds: ['D006', 'D009'] });
    expect(risk.bandLabel).toBe('Needs More Practice');
    expect(risk.weakSkillIds).toEqual(['D006', 'D009']);
  });

  it('falls back safely on an empty summary', () => {
    const view = summariseAssessmentResult({});
    expect(view).toMatchObject({ band: 'exam_risk', accuracy: 0, total: 0, correct: 0, weakSkillIds: [] });
  });
});
