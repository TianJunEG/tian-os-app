import { describe, it, expect } from 'vitest';
import {
  COUNTABLE_CONTEXT_NOUNS,
  generateFractionQuestion,
  generateAssessmentQuestionSet,
  generatePracticeQuestionSet,
  checkFractionAnswer,
  isWholeNumber,
  validateCountableFractionSequence,
  validateFractionQuestionGenerator,
} from './fractionQuestionGenerator';
import { getQuestionFamiliesBySkill } from './fractionQuestionFamilies';
import {
  ASSESSMENT_LOCK_MESSAGE,
  FRACTIONS_ASSESSMENT_BLUEPRINT,
  getFractionAssessmentBlueprintReadiness,
} from './fractionAssessmentReadinessGate';

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
    expect(q.requiredVisualTypes).toContain('shaded_fraction_model');
    expect(q.providedVisualTypes).toEqual(expect.arrayContaining(['fraction_strip', 'shaded_fraction_model']));
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

  it('asks F014_001 students to convert mixed to improper', () => {
    const q = generateFractionQuestion({ skillId: 'F014', questionFamilyId: 'QF_F014_001', difficulty: 3, variant: 7, mode: 'practice' });
    expect(q.prompt).toMatch(/convert.*improper/i);
    expect(q.answer?.type).toBe('fraction');
    expect(q.answer.numerator).toBeGreaterThan(q.answer.denominator);
  });

  it('asks F014 students to convert mixed numbers to improper fractions (default)', () => {
    const q = generateFractionQuestion({ skillId: 'F014', questionFamilyId: 'QF_F014_002', difficulty: 3, variant: 7, mode: 'practice' });
    expect(q.prompt).toMatch(/recipe|cups|mixed number/i);
    expect(q.answer?.type).toBe('mixed');
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

  it('marks assessment metadata and filters out non-eligible easy assessment questions', () => {
    const easyRecognition = generateFractionQuestion({
      skillId: 'F001',
      questionFamilyId: 'QF_F001_001',
      difficulty: 1,
      variant: 1,
      mode: 'assessment',
    });
    expect(easyRecognition).toMatchObject({
      moeLevel: expect.any(String),
      questionType: 'recognition',
      assessmentEligible: false,
    });

    const conversion = generateFractionQuestion({
      skillId: 'F014',
      questionFamilyId: 'QF_F014_001',
      difficulty: 3,
      variant: 1,
      mode: 'assessment',
    });
    expect(conversion).toMatchObject({
      questionType: 'conversion_mixed_numbers',
      assessmentEligible: true,
    });

    const questions = generateAssessmentQuestionSet({
      assessmentSession: {
        targetSkillIds: ['F001', 'F014', 'F018', 'F023', 'F026'],
        targetQuestionFamilyIds: ['QF_F001_001', 'QF_F014_001', 'QF_F018_001', 'QF_F023_001', 'QF_F026_001'],
      },
      count: 10,
    });
    expect(questions.length).toBeGreaterThan(0);
    expect(questions.every((question) => question.assessmentEligible === true)).toBe(true);
    expect(questions.every((question) => Number(question.difficulty) >= 2)).toBe(true);
    expect(questions.some((question) => Number(question.difficulty) >= 4)).toBe(true);
  });

  it('keeps the pilot mastery check gated until prerequisites are complete', () => {
    expect(FRACTIONS_ASSESSMENT_BLUEPRINT.map((row) => row.weight)).toEqual([20, 20, 30, 20, 10]);
    const locked = getFractionAssessmentBlueprintReadiness({
      completedSkillIds: ['F001', 'F002', 'F003', 'F004'],
    });
    expect(locked.ready).toBe(false);
    expect(locked.message).toBe(ASSESSMENT_LOCK_MESSAGE);

    const ready = getFractionAssessmentBlueprintReadiness({
      completedSkillIds: Array.from({ length: 20 }, (_, index) => `F${String(index + 1).padStart(3, '0')}`),
    });
    expect(ready.hasAssessmentQualityQuestions).toBe(true);
    expect(ready.ready).toBe(true);
    expect(ready.missingBlueprintSections).toEqual([]);
  });

  it('does not reference visual bars for F012 same-numerator comparisons without a diagram', () => {
    const q = generateFractionQuestion({
      skillId: 'F012',
      questionFamilyId: 'QF_F012_006',
      difficulty: 3,
      variant: 4,
      mode: 'diagnostic',
    });
    expect(q.prompt).toMatch(/^Simplify \d+\/\d+ to lowest terms/);
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

describe('generatePracticeQuestionSet rendered-signature dedupe (U1)', () => {
  const signatureOf = (q) =>
    `${String(q.prompt || '').toLowerCase().replace(/\s+/g, ' ').trim()}::${String(
      q?.answer?.display ?? ''
    )
      .toLowerCase()
      .replace(/\s+/g, '')}`;

  it('does not serve the same rendered question twice across sibling F018 families', () => {
    // The four "Add Unlike Fractions" families (LCM Scaffolded / Independent /
    // Simplify & Convert / In Context) previously shared a template and could emit
    // identical prompts such as "Compute: 2/3 + 1/2" under different labels.
    const families = getQuestionFamiliesBySkill('F018')
      .filter((f) => /add unlike/i.test(f.name))
      .map((f) => ({ skillId: 'F018', questionFamilyId: f.id, questionFamilyIds: [f.id] }));
    expect(families.length).toBeGreaterThanOrEqual(2);

    const questions = generatePracticeQuestionSet({ practiceQueue: families, count: 8 });
    expect(questions.length).toBeGreaterThan(0);

    const signatures = questions.map(signatureOf);
    expect(new Set(signatures).size).toBe(signatures.length);
  });

  it('keeps distinct operands distinct (does not over-dedupe different sums)', () => {
    const families = getQuestionFamiliesBySkill('F018')
      .slice(0, 3)
      .map((f) => ({ skillId: 'F018', questionFamilyId: f.id, questionFamilyIds: [f.id] }));
    const questions = generatePracticeQuestionSet({ practiceQueue: families, count: 6 });
    // With dedupe in place we should still get a full-length, varied set rather than
    // the engine collapsing everything to a single question.
    expect(questions.length).toBeGreaterThanOrEqual(4);
    const signatures = questions.map(signatureOf);
    expect(new Set(signatures).size).toBe(signatures.length);
  });
});
