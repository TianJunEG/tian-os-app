import { describe, it, expect } from 'vitest';
import {
  COUNTABLE_CONTEXT_NOUNS,
  generateFractionQuestion,
  checkFractionAnswer,
  isWholeNumber,
  validateCountableFractionSequence,
  validateFractionQuestionGenerator,
} from './fractionQuestionGenerator';

describe('fractionQuestionGenerator', () => {
  it('marks F001 as a fraction answer with compact fraction tools', () => {
    const q = generateFractionQuestion({ skillId: 'F001', questionFamilyId: 'QF_F001_001', difficulty: 1, variant: 3, mode: 'practice' });
    expect(q.answer?.type).toBe('fraction');
    expect(q.answerFormat).toBe('fraction');
    expect(q.answer_type).toBe('fraction');
    expect(q.answerType).toBe('fraction');
    expect(q.allowedInputTools).toEqual(['fraction', 'mixed', 'whole', 'clear']);
    expect(q.requiresDiagram).toBe(true);
    expect(q.diagramSpec).toMatchObject({
      type: 'fraction_bar',
      data: { labelMode: 'none' },
    });
  });

  it('scores comparison questions using symbol answers (F006)', () => {
    const q = generateFractionQuestion({ skillId: 'F006', questionFamilyId: 'QF_F006_001', difficulty: 2, variant: 7, mode: 'diagnostic' });
    expect(q.answer?.type).toBe('text');
    expect(['>', '<', '=']).toContain(q.answer.value);
    expect(q.acceptedAnswers).toContain(q.answer.value);
  });

  it('accepts improper, mixed, and equivalent answers for fraction sums', () => {
    const correctAnswer = { type: 'fraction', numerator: 7, denominator: 6, display: '7/6' };

    expect(checkFractionAnswer({ studentAnswer: '7/6', correctAnswer }).correct).toBe(true);
    expect(checkFractionAnswer({ studentAnswer: '1 1/6', correctAnswer }).correct).toBe(true);
    expect(checkFractionAnswer({ studentAnswer: '14/12', correctAnswer }).correct).toBe(true);
    expect(checkFractionAnswer({ studentAnswer: '1/0', correctAnswer }).correct).toBe(false);
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

  it('rejects countable fraction sequences that create decimal intermediate counts', () => {
    const invalidCases = [
      { total: 41, fractions: [{ numerator: 1, denominator: 2 }] },
      { total: 25, fractions: [{ numerator: 1, denominator: 3 }] },
      { total: 50, fractions: [{ numerator: 1, denominator: 2 }, { numerator: 1, denominator: 3 }] },
      { total: 41, fractions: [{ numerator: 1, denominator: 2 }, { numerator: 1, denominator: 3 }] },
    ];

    invalidCases.forEach(({ total, fractions }) => {
      const result = validateCountableFractionSequence(total, fractions);
      expect(result.valid, `${total} with ${JSON.stringify(fractions)}`).toBe(false);
      expect(result.reason).toMatch(/decimal|integer|whole/);
    });
  });

  it('accepts countable two-step remainder problems only when every step is whole', () => {
    const case42 = validateCountableFractionSequence(42, [
      { numerator: 1, denominator: 2 },
      { numerator: 1, denominator: 3 },
    ]);
    expect(case42.valid).toBe(true);
    expect(case42.steps[0].amount).toBe(21);
    expect(case42.steps[0].remaining).toBe(21);
    expect(case42.steps[1].amount).toBe(7);
    expect(case42.final).toBe(14);

    const case36 = validateCountableFractionSequence(36, [
      { numerator: 1, denominator: 3 },
      { numerator: 1, denominator: 4 },
    ]);
    expect(case36.valid).toBe(true);
    expect(case36.steps[0].amount).toBe(12);
    expect(case36.steps[0].remaining).toBe(24);
    expect(case36.steps[1].amount).toBe(6);
    expect(case36.final).toBe(18);
  });

  it('tracks countable nouns that must not produce fractional quantities', () => {
    [
      'problems',
      'questions',
      'students',
      'books',
      'pages',
      'stickers',
      'marbles',
      'pencils',
      'sweets',
      'apples',
      'oranges',
      'chairs',
      'tickets',
      'marks',
    ].forEach((noun) => expect(COUNTABLE_CONTEXT_NOUNS).toContain(noun));
  });

  it('keeps F023 worksheet count word problems integer-friendly at every step', () => {
    for (let variant = 0; variant < 80; variant += 1) {
      const q = generateFractionQuestion({
        skillId: 'F023',
        questionFamilyId: 'QF_F023_001',
        difficulty: 3,
        variant,
        mode: 'diagnostic',
      });
      const match = q.prompt.match(/used\s+(\d+)\/(\d+)\s+of a worksheet with\s+(\d+)\s+questions/i);
      if (!match) continue;
      const numerator = Number(match[1]);
      const denominator = Number(match[2]);
      const total = Number(match[3]);
      const used = (total * numerator) / denominator;
      const left = total - used;
      expect(Number.isInteger(used), q.prompt).toBe(true);
      expect(Number.isInteger(left), q.prompt).toBe(true);
      expect(q.answer.whole).toBe(left);
    }
  });

  it('keeps F024 remainder word problems integer-friendly at every step', () => {
    for (let variant = 0; variant < 80; variant += 1) {
      const q = generateFractionQuestion({
        skillId: 'F024',
        questionFamilyId: 'QF_F024_001',
        difficulty: 4,
        variant,
        mode: 'diagnostic',
      });
      const match = q.prompt.match(/completed\s+(\d+)\/(\d+)\s+of\s+(\d+)\s+problems,\s+then\s+(\d+)\/(\d+)\s+of the remainder/i);
      expect(match, q.prompt).toBeTruthy();
      const firstNumerator = Number(match[1]);
      const firstDenominator = Number(match[2]);
      const total = Number(match[3]);
      const secondNumerator = Number(match[4]);
      const secondDenominator = Number(match[5]);
      const firstCompleted = (total * firstNumerator) / firstDenominator;
      const firstRemainder = total - firstCompleted;
      const secondCompleted = (firstRemainder * secondNumerator) / secondDenominator;
      const finalUnfinished = firstRemainder - secondCompleted;
      expect(isWholeNumber(firstCompleted), q.prompt).toBe(true);
      expect(isWholeNumber(firstRemainder), q.prompt).toBe(true);
      expect(isWholeNumber(secondCompleted), q.prompt).toBe(true);
      expect(isWholeNumber(finalUnfinished), q.prompt).toBe(true);
      expect(q.answer.whole).toBe(finalUnfinished);
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
