import { describe, expect, it } from 'vitest';
import {
  approvePracticeSet,
  checkSimilarQuestionAnswer,
  extractQuestionPattern,
  generateVariantsFromPattern,
  startSimilarQuestionPractice,
  submitSimilarQuestionPractice,
  validateQuestionPatternTrainer,
} from '../services/mathpath/questionPatternTrainer.js';

const SOURCE_QUESTIONS = [
  {
    prompt: 'Cheng baked some tarts. 2/5 of the tarts were pineapple tarts. 1/6 of the remaining tarts were chocolate tarts and the rest were strawberry tarts. What fraction of the tarts were strawberry tarts?',
    answer: '1/2',
  },
  {
    prompt: 'There are 75 buttons in a box. 2/5 of the buttons are blue. 1/3 of the remaining buttons are red and the rest are green. How many buttons are green?',
    answer: '30 buttons',
  },
  {
    prompt: 'Mr Raju had some rice. He cooked 5kg of rice on Monday. He cooked 5/9 of the remaining rice on Tuesday. He had 1/6 of the rice left. What was the mass of the rice he had at first?',
    answer: 'unknown',
  },
  {
    prompt: 'Mrs Lim had a sum of money. She gave 1/3 of the money to her parents. She spent 2/5 of the remainder on transport and spent $360 on food. She had $120 left. How much money did she have at first?',
    answer: '$1200',
  },
];

function normalizePrompt(prompt) {
  return String(prompt || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

describe('Similar Question Pattern Trainer', () => {
  it('extracts a reusable Fractions pattern from representative seed questions', () => {
    const pattern = extractQuestionPattern({
      sourceExamples: SOURCE_QUESTIONS,
      targetSkillId: 'F023',
      level: 'P5',
      curriculumTags: ['MOE', 'P5'],
    });

    expect(pattern.patternId).toMatch(/^qpattern_/);
    expect(pattern.inferredSkillIds).toContain('F023');
    expect(pattern.domain).toBe('fractions');
    expect(pattern.archetype).toBe('fraction_of_remainder_word_problem');
    expect(pattern.questionTemplate).toContain('{firstNumerator}/{firstDenominator}');
    expect(pattern.variableRules.length).toBeGreaterThan(0);
    expect(pattern.compatibleSessionTypes).toEqual(expect.arrayContaining(['diagnostic', 'practice', 'remediation', 'mastery_check']));
    expect(pattern.worksheetCompatible).toBe(true);
  });

  it('generates a large validated question bank with answers, solutions, tags, and difficulty mix', () => {
    const pattern = extractQuestionPattern({
      sourceExamples: SOURCE_QUESTIONS,
      targetSkillId: 'F023',
      generatedVariantTarget: { easy: 6, medium: 6, hard: 6, wordProblem: 4, misconception: 4 },
    });
    const generated = generateVariantsFromPattern(pattern);
    const uniquePrompts = new Set(generated.variants.map((variant) => normalizePrompt(variant.prompt)));

    expect(generated.variants.length).toBeGreaterThanOrEqual(20);
    expect(uniquePrompts.size).toBe(generated.variants.length);
    expect(generated.variants.every((variant) => variant.answer && variant.acceptedAnswers.length)).toBe(true);
    expect(generated.variants.every((variant) => !/[{}]/.test(variant.prompt))).toBe(true);
    expect(generated.variants.every((variant) => variant.workedSolution && variant.solutionSteps.length)).toBe(true);
    expect(generated.variants.every((variant) => variant.answerCheckStrategy)).toBe(true);
    expect(generated.quality.difficultyDistribution.easy).toBeGreaterThan(0);
    expect(generated.quality.difficultyDistribution.medium).toBeGreaterThan(0);
    expect(generated.quality.difficultyDistribution.hard).toBeGreaterThan(0);
    expect(generated.quality.categoryDistribution.remediation).toBeGreaterThan(0);
    expect(generated.variants.some((variant) => variant.misconceptionTags.includes('M008'))).toBe(true);
    expect(generated.variants.every((variant) => typeof variant.worksheetCompatible === 'boolean')).toBe(true);
    expect(generated.variants.every((variant) => variant.compatibleSessionTypes.includes('practice'))).toBe(true);
  });

  it('warns when seed data is too shallow for confident expansion', () => {
    const pattern = extractQuestionPattern({
      sourceExamples: [{ prompt: 'Ali ate 2/5 of a cake. What fraction is left?', answer: '3/5' }],
      targetSkillId: 'F023',
    });

    expect(pattern.qualityWarnings.join(' ')).toMatch(/Shallow pattern extraction/i);
  });

  it('approves a generated set and allows a student to practise with tracked scoring and mistakes', async () => {
    const pattern = extractQuestionPattern({
      sourceExamples: SOURCE_QUESTIONS,
      targetSkillId: 'F023',
      generatedVariantTarget: { easy: 3, medium: 3, hard: 3, wordProblem: 1, misconception: 1 },
    });
    const generated = generateVariantsFromPattern(pattern);
    const practiceSet = await approvePracticeSet({
      patternInput: pattern,
      generated,
      title: 'Fraction Remainder Similar Questions',
      persist: false,
    });

    expect(practiceSet.approved).toBe(true);
    expect(practiceSet.generatedQuestions.length).toBeGreaterThanOrEqual(10);

    const started = await startSimilarQuestionPractice({
      practiceSetId: practiceSet.practiceSetId,
      studentId: 'student-1',
      limit: 4,
    });
    expect(started.questions).toHaveLength(4);

    const firstQuestion = practiceSet.generatedQuestions.find((question) => question.variantId === started.questions[0].variantId);
    const submitted = await submitSimilarQuestionPractice({
      sessionId: started.session.sessionId,
      studentId: 'student-1',
      responses: [
        { variantId: started.questions[0].variantId, answer: firstQuestion.answer },
        { variantId: started.questions[1].variantId, answer: 'wrong answer' },
      ],
    });

    expect(submitted.summary.total).toBe(2);
    expect(submitted.summary.correct).toBe(1);
    expect(submitted.summary.mistakeCount).toBe(1);
    expect(submitted.results[1].misconceptionTags.length).toBeGreaterThan(0);
    expect(submitted.results[1].skillId).toBe('F023');
    expect(submitted.results[1].questionFamilyId).toMatch(/^TRAINED_F023/);
  });

  it('checks generated answers using the configured strategy', () => {
    expect(checkSimilarQuestionAnswer('2/4', '1/2', 'fraction_equivalence')).toBe(true);
    expect(checkSimilarQuestionAnswer('30 buttons', '30 buttons', 'exact_number_with_unit')).toBe(true);
    expect(checkSimilarQuestionAnswer('30', '30 buttons', 'exact_number_with_unit')).toBe(false);
  });

  it('passes the built-in trainer validator', () => {
    const result = validateQuestionPatternTrainer();
    expect(result.isValid).toBe(true);
  });
});
