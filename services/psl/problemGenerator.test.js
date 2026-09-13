import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockTemplates = [];
vi.mock('../../models/psl/PSLProblemTemplate.js', () => ({
  default: { find: vi.fn(() => ({ lean: () => Promise.resolve(mockTemplates) })) },
}));

import PSLProblemTemplate from '../../models/psl/PSLProblemTemplate.js';
import { generateProblem, generateProblemsForSession } from './problemGenerator.js';

const TEMPLATE_PW_WHOLE = {
  templateId: 'tpl-pw-whole-01',
  skillId: 'psl-p3-bar-pw-find-whole',
  structure: 'partWhole',
  unknownPosition: 'whole',
  storyTemplate: '{nameA} has {partA} {itemPlural}. {nameB} has {partB} {itemPlural}. How many {itemPlural} in total?',
  constraints: { partA: { min: 10, max: 50 }, partB: { min: 10, max: 50 }, answer: { max: 100 } },
  contexts: [{ setting: 'market', entityA: 'apples', entityB: 'oranges', itemPlural: 'apples', verb: 'has' }],
  scaffold: {
    understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: ['Buying fruit', 'Going to school'] },
    identify_info: { type: 'highlight', expected: ['{partA}', '{partB}'] },
    identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: ['The total', 'The difference'] },
    plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
    solve: { type: 'expression', operation: 'addition', expression: '{partA} + {partB}', answer: '{answer}' },
    check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
  },
};

const TEMPLATE_COMP_DIFF = {
  templateId: 'tpl-comp-diff-01',
  skillId: 'psl-p3-bar-comp-find-diff',
  structure: 'comparison',
  unknownPosition: 'difference',
  storyTemplate: '{nameA} has {larger} {itemPlural}. {nameB} has {smaller} {itemPlural}. How many more does {nameA} have?',
  constraints: { larger: { min: 30, max: 80 }, smaller: { min: 10, max: 40 }, answer: { min: 5 } },
  contexts: [{ setting: 'school', entityA: 'pencils', entityB: 'pens', itemPlural: 'pencils', verb: 'has' }],
  scaffold: {
    understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: ['Comparing pencils', 'Buying pens'] },
    identify_info: { type: 'highlight', expected: ['{larger}', '{smaller}'] },
    identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: ['The difference', 'The total'] },
    plan: { type: 'model', modelType: 'comparison', unknownPosition: 'difference' },
    solve: { type: 'expression', operation: 'subtraction', expression: '{larger} - {smaller}', answer: '{answer}' },
    check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('generateProblem', () => {
  it('generates a part-whole problem with all required fields', async () => {
    mockTemplates = [TEMPLATE_PW_WHOLE];
    const problem = await generateProblem('psl-p3-bar-pw-find-whole');

    expect(problem.problemId).toBeDefined();
    expect(problem.templateId).toBe('tpl-pw-whole-01');
    expect(problem.storyText).toBeTruthy();
    expect(problem.storyText).not.toContain('{partA}');
    expect(problem.storyText).not.toContain('{nameA}');
    expect(problem.givenNumbers).toBeInstanceOf(Array);
    expect(problem.givenNumbers.length).toBeGreaterThanOrEqual(2);
    expect(problem.correctAnswer).toBeGreaterThan(0);
    expect(problem.barModelSpec.modelType).toBe('partWhole');
    expect(problem.barModelSpec.unknownPosition).toBe('whole');
    expect(problem.status).toBe('pending');
  });

  it('scaffold steps are generated for all 6 steps', async () => {
    mockTemplates = [TEMPLATE_PW_WHOLE];
    const problem = await generateProblem('psl-p3-bar-pw-find-whole');

    expect(problem.scaffoldSteps).toHaveLength(6);
    const stepIds = problem.scaffoldSteps.map((s) => s.stepId);
    expect(stepIds).toEqual(['understand', 'identify_info', 'identify_question', 'plan', 'solve', 'check']);
  });

  it('scaffold step prompts have tokens substituted', async () => {
    mockTemplates = [TEMPLATE_PW_WHOLE];
    const problem = await generateProblem('psl-p3-bar-pw-find-whole');

    for (const step of problem.scaffoldSteps) {
      if (step.prompt) {
        expect(step.prompt).not.toContain('{partA}');
        expect(step.prompt).not.toContain('{nameA}');
      }
    }
  });

  it('identify_info expected clues are normalized non-empty strings', async () => {
    mockTemplates = [TEMPLATE_PW_WHOLE];
    const problem = await generateProblem('psl-p3-bar-pw-find-whole');

    // Clues are kept as normalized STRINGS (not coerced numbers) so compound clues
    // like fractions ("2/5"), ratios ("3:5"), money ("$4") and percentages ("30%")
    // survive instead of being dropped by Number()/filter(Boolean).
    const infoStep = problem.scaffoldSteps.find((s) => s.stepId === 'identify_info');
    expect(infoStep.expectedResponse.numbers).toBeInstanceOf(Array);
    expect(infoStep.expectedResponse.numbers.length).toBeGreaterThan(0);
    for (const n of infoStep.expectedResponse.numbers) {
      expect(typeof n).toBe('string');
      expect(n.length).toBeGreaterThan(0);
    }
  });

  it('solve step has numeric answer', async () => {
    mockTemplates = [TEMPLATE_PW_WHOLE];
    const problem = await generateProblem('psl-p3-bar-pw-find-whole');

    const solveStep = problem.scaffoldSteps.find((s) => s.stepId === 'solve');
    expect(typeof solveStep.expectedResponse.answer).toBe('number');
    expect(solveStep.expectedResponse.answer).toBe(problem.correctAnswer);
  });

  it('generates a comparison problem', async () => {
    mockTemplates = [TEMPLATE_COMP_DIFF];
    const problem = await generateProblem('psl-p3-bar-comp-find-diff');

    expect(problem.barModelSpec.modelType).toBe('comparison');
    expect(problem.correctAnswer).toBeGreaterThan(0);
    const planStep = problem.scaffoldSteps.find((s) => s.stepId === 'plan');
    expect(planStep.expectedResponse.modelType).toBe('comparison');
    expect(planStep.expectedResponse.unknownPosition).toBe('difference');
  });

  it('respects number constraints', async () => {
    mockTemplates = [TEMPLATE_PW_WHOLE];
    for (let i = 0; i < 20; i++) {
      const problem = await generateProblem('psl-p3-bar-pw-find-whole');
      expect(problem.correctAnswer).toBeLessThanOrEqual(100);
      for (const n of problem.givenNumbers) {
        expect(n).toBeGreaterThanOrEqual(10);
        expect(n).toBeLessThanOrEqual(50);
      }
    }
  });

  it('throws when no templates found', async () => {
    mockTemplates = [];
    await expect(generateProblem('nonexistent-skill')).rejects.toThrow('No templates for skill');
  });

  it('avoids used template IDs when alternatives exist', async () => {
    const tpl2 = { ...TEMPLATE_PW_WHOLE, templateId: 'tpl-pw-whole-02' };
    mockTemplates = [TEMPLATE_PW_WHOLE, tpl2];

    const problem = await generateProblem('psl-p3-bar-pw-find-whole', { usedTemplateIds: ['tpl-pw-whole-01'] });
    expect(problem.templateId).toBe('tpl-pw-whole-02');
  });

  it('falls back to used templates when all are used', async () => {
    mockTemplates = [TEMPLATE_PW_WHOLE];
    const problem = await generateProblem('psl-p3-bar-pw-find-whole', { usedTemplateIds: ['tpl-pw-whole-01'] });
    expect(problem.templateId).toBe('tpl-pw-whole-01');
  });
});

describe('generateProblemsForSession', () => {
  it('generates the requested number of problems', async () => {
    mockTemplates = [TEMPLATE_PW_WHOLE];
    const { problems } = await generateProblemsForSession('psl-p3-bar-pw-find-whole', 3);

    expect(problems).toHaveLength(3);
    for (const p of problems) {
      expect(p.problemId).toBeDefined();
      expect(p.scaffoldSteps).toHaveLength(6);
    }
  });

  it('each problem has a unique ID', async () => {
    mockTemplates = [TEMPLATE_PW_WHOLE];
    const { problems } = await generateProblemsForSession('psl-p3-bar-pw-find-whole', 5);

    const ids = problems.map((p) => p.problemId);
    expect(new Set(ids).size).toBe(5);
  });

  it('defaults to 5 problems', async () => {
    mockTemplates = [TEMPLATE_PW_WHOLE];
    const { problems } = await generateProblemsForSession('psl-p3-bar-pw-find-whole');
    expect(problems).toHaveLength(5);
  });

  it('returns targetDifficulty based on mastery score', async () => {
    mockTemplates = [TEMPLATE_PW_WHOLE];
    const { targetDifficulty } = await generateProblemsForSession('psl-p3-bar-pw-find-whole', 3, { masteryScore: 80 });
    expect(targetDifficulty).toBe(3);
  });

  it('returns targetDifficulty 1 when no mastery score', async () => {
    mockTemplates = [TEMPLATE_PW_WHOLE];
    const { targetDifficulty } = await generateProblemsForSession('psl-p3-bar-pw-find-whole', 3);
    expect(targetDifficulty).toBe(1);
  });
});
