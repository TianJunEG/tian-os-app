import { describe, it, expect } from 'vitest';
import { generateFractionQuestion, validateFractionQuestionGenerator } from './fractionQuestionGenerator';

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

  it('keeps F024 count-based word problem answers as whole numbers', () => {
    for (let variant = 0; variant < 40; variant += 1) {
      const q = generateFractionQuestion({
        skillId: 'F024',
        questionFamilyId: 'QF_F024_001',
        difficulty: 4,
        variant,
        mode: 'practice',
      });
      expect(q.answer?.type).toBe('whole');
      expect(Number.isInteger(q.answer.whole)).toBe(true);
    }
  });

  it('keeps F026 quantity mastery answers as whole numbers', () => {
    for (let variant = 0; variant < 40; variant += 1) {
      const q = generateFractionQuestion({
        skillId: 'F026',
        questionFamilyId: 'QF_F026_001',
        difficulty: 4,
        variant,
        mode: 'practice',
      });
      expect(q.answer?.type).toBe('whole');
      expect(Number.isInteger(q.answer.whole)).toBe(true);
    }
  });

  it('does not reference visual bars for F012 same-numerator comparisons without a diagram', () => {
    const q = generateFractionQuestion({
      skillId: 'F012',
      questionFamilyId: 'QF_F012_005',
      difficulty: 3,
      variant: 4,
      mode: 'diagnostic',
    });
    expect(q.prompt).toMatch(/^Compare \d+\/\d+ and \d+\/\d+\./);
    expect(q.prompt).not.toMatch(/\bbars?\b|\bshaded\b/i);
    expect(q.diagramSpec).toBeUndefined();
  });

  it('passes the built-in generator validation checks', () => {
    const result = validateFractionQuestionGenerator();
    expect(result.isValid).toBe(true);
    expect(result.checks.workingRuleCorrect).toBe(true);
    expect(result.checks.mentalRuleCorrect).toBe(true);
    expect(result.checks.noZeroDenominator).toBe(true);
  });
});
