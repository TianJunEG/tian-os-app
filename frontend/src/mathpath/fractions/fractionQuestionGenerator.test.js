import { describe, it, expect } from 'vitest';
import { generateFractionQuestion } from './fractionQuestionGenerator';

describe('fractionQuestionGenerator', () => {
  it('scores comparison questions using symbol answers (F006)', () => {
    const q = generateFractionQuestion({ skillId: 'F006', questionFamilyId: 'QF_F006_001', difficulty: 2, variant: 7, mode: 'diagnostic' });
    expect(q.answer?.type).toBe('text');
    expect(['>', '<', '=']).toContain(q.answer.value);
    expect(q.acceptedAnswers).toContain(q.answer.value);
  });

  it('scores equal-denominator and equal-numerator comparisons as symbols (F007/F008/F011)', () => {
    const q007 = generateFractionQuestion({ skillId: 'F007', questionFamilyId: 'QF_F007_001', difficulty: 2, variant: 11, mode: 'diagnostic' });
    const q008 = generateFractionQuestion({ skillId: 'F008', questionFamilyId: 'QF_F008_001', difficulty: 2, variant: 13, mode: 'diagnostic' });
    const q011 = generateFractionQuestion({ skillId: 'F011', questionFamilyId: 'QF_F011_005', difficulty: 2, variant: 17, mode: 'diagnostic' });
    expect(q007.answer.value).toMatch(/^[<>]$/);
    expect(q008.answer.value).toMatch(/^[<>]$/);
    expect(q011.answer.value).toMatch(/^[<>=$]$/);
  });

  it('uses a proper fraction payload for equivalent denominator completion (F010)', () => {
    const q = generateFractionQuestion({ skillId: 'F010', questionFamilyId: 'QF_F010_001', difficulty: 2, variant: 3, mode: 'diagnostic' });
    expect(q.answer?.type).toBe('fraction');
    expect(q.answer.numerator).toBeGreaterThan(0);
    expect(q.answer.denominator).toBeGreaterThan(0);
    expect(q.acceptedAnswers?.length).toBeGreaterThan(0);
  });
});
