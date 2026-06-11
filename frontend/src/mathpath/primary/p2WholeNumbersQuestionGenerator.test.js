import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getSupportedSkillIds,
} from './p2WholeNumbersQuestionGenerator.js';
import { validateP2WholeNumbersSkillGraph, p2WholeNumbersSkillGraph } from './p2WholeNumbersSkillGraph.js';
import { validateP2WholeNumbersQuestionFamilies } from './p2WholeNumbersQuestionFamilies.js';

// ---------------------------------------------------------------------------
// Skill graph validation
// ---------------------------------------------------------------------------

describe('p2WholeNumbersSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP2WholeNumbersSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains all 5 P2-WN skills', () => {
    expect(p2WholeNumbersSkillGraph.skills).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// Question families validation
// ---------------------------------------------------------------------------

describe('p2WholeNumbersQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP2WholeNumbersQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.totalQuestionFamilies).toBe(14);
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Generator: skill coverage
// ---------------------------------------------------------------------------

describe('p2WholeNumbersQuestionGenerator', () => {
  it('supports all 5 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(5);
    expect(ids).toContain('P2-WN-01');
    expect(ids).toContain('P2-WN-02');
    expect(ids).toContain('P2-WN-03');
    expect(ids).toContain('P2-WN-04');
    expect(ids).toContain('P2-WN-05');
  });

  // -------------------------------------------------------------------------
  // P2-WN-01: Place Value
  // -------------------------------------------------------------------------

  describe('P2-WN-01: Place Value', () => {
    it('generates decompose questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-WN-01', { questionFamilyId: 'QF_P2-WN-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P2-WN-01');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThanOrEqual(9);
        expect(q.diagramSpec).toBeDefined();
      }
    });

    it('generates compose questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-WN-01', { questionFamilyId: 'QF_P2-WN-01_002' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThanOrEqual(100);
        expect(q.answer).toBeLessThanOrEqual(999);
      }
    });

    it('generates value-of-digit questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-WN-01', { questionFamilyId: 'QF_P2-WN-01_003' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('value of the digit');
        expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].some(
          (d) => q.answer === d || q.answer === d * 10 || q.answer === d * 100
        )).toBe(true);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P2-WN-02: Comparing & Ordering
  // -------------------------------------------------------------------------

  describe('P2-WN-02: Comparing & Ordering', () => {
    it('generates comparison questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-WN-02', { questionFamilyId: 'QF_P2-WN-02_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P2-WN-02');
        expect(q.answerType).toBe('choice');
        expect(['>', '<', '=']).toContain(q.answer);
        expect(q.diagramSpec).toBeDefined();
        expect(q.diagramSpec.type).toBe('number_line');
      }
    });

    it('generates ordering questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-WN-02', { questionFamilyId: 'QF_P2-WN-02_002' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('choice');
        expect(q.diagramSpec).toBeDefined();
        expect(q.diagramSpec.type).toBe('number_line');
        const nums = q.answer.split(', ').map(Number);
        expect(nums).toHaveLength(3);
      }
    });

    it('generates greatest/smallest from digits (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-WN-02', { questionFamilyId: 'QF_P2-WN-02_003' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(100);
        expect(q.answer).toBeLessThanOrEqual(987);
        expect(q.prompt).toMatch(/greatest|smallest/);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P2-WN-03: Odd & Even Numbers
  // -------------------------------------------------------------------------

  describe('P2-WN-03: Odd & Even Numbers', () => {
    it('generates identify odd/even questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-WN-03', { questionFamilyId: 'QF_P2-WN-03_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P2-WN-03');
        expect(q.answerType).toBe('choice');
        expect(['odd', 'even']).toContain(q.answer);
        expect(q.options).toContain('odd');
        expect(q.options).toContain('even');
      }
    });

    it('generates next odd/even number questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-WN-03', { questionFamilyId: 'QF_P2-WN-03_002' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(11);
        expect(q.answer).toBeLessThanOrEqual(99);
        expect(q.prompt).toMatch(/next (odd|even) number/);
      }
    });

    it('generates count odd/even in set questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-WN-03', { questionFamilyId: 'QF_P2-WN-03_003' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.prompt).toMatch(/How many (odd|even) numbers/);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P2-WN-04: Number Patterns
  // -------------------------------------------------------------------------

  describe('P2-WN-04: Number Patterns', () => {
    it('generates increasing pattern (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-WN-04', { questionFamilyId: 'QF_P2-WN-04_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P2-WN-04');
        expect(q.answerType).toBe('number');
        expect(q.prompt).toContain('?');
        expect(q.solutionText).toContain('increases');
        expect(q.diagramSpec).toBeDefined();
        expect(q.diagramSpec.type).toBe('number_line');
      }
    });

    it('generates decreasing pattern (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-WN-04', { questionFamilyId: 'QF_P2-WN-04_002' });
        expect(q).not.toBeNull();
        expect(q.solutionText).toContain('decreases');
        expect(q.answer).toBeGreaterThanOrEqual(0);
      }
    });

    it('generates missing-term pattern (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-WN-04', { questionFamilyId: 'QF_P2-WN-04_003' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('?');
        expect(q.prompt).toContain('missing');
      }
    });
  });

  // -------------------------------------------------------------------------
  // P2-WN-05: Numbers in Words
  // -------------------------------------------------------------------------

  describe('P2-WN-05: Numbers in Words', () => {
    it('generates number-to-words questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-WN-05', { questionFamilyId: 'QF_P2-WN-05_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P2-WN-05');
        expect(q.answerType).toBe('choice');
        expect(typeof q.answer).toBe('string');
        expect(q.answer).toMatch(/hundred/);
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.options).toContain(q.answer);
      }
    });

    it('generates words-to-number questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-WN-05', { questionFamilyId: 'QF_P2-WN-05_002' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('choice');
        expect(typeof q.answer).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(101);
        expect(q.answer).toBeLessThanOrEqual(999);
        expect(q.options).toContain(q.answer);
        expect(q.prompt).toMatch(/"/);
      }
    });
  });

  // -------------------------------------------------------------------------
  // generateQuestionSet
  // -------------------------------------------------------------------------

  describe('generateQuestionSet', () => {
    it('returns the requested number of questions', () => {
      const set = generateQuestionSet('P2-WN-01', 5);
      expect(set).toHaveLength(5);
      set.forEach((q) => expect(q.skillId).toBe('P2-WN-01'));
    });

    it('defaults to 5 questions', () => {
      const set = generateQuestionSet('P2-WN-02');
      expect(set).toHaveLength(5);
    });
  });

  // -------------------------------------------------------------------------
  // generateDiagnosticSet
  // -------------------------------------------------------------------------

  describe('generateDiagnosticSet', () => {
    it('generates questions across all skills', () => {
      const skills = ['P2-WN-01', 'P2-WN-02', 'P2-WN-03', 'P2-WN-04', 'P2-WN-05'];
      const set = generateDiagnosticSet(skills, 2);
      expect(set).toHaveLength(10);
      const skillIds = new Set(set.map((q) => q.skillId));
      expect(skillIds.size).toBe(5);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases and cross-cutting concerns
  // -------------------------------------------------------------------------

  it('returns null for unknown skill', () => {
    expect(generateQuestion('FAKE-SKILL')).toBeNull();
    expect(generateQuestion('P2-WN-99')).toBeNull();
  });

  it('every question has a unique questionId', () => {
    const ids = new Set();
    for (const skillId of getSupportedSkillIds()) {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion(skillId);
        expect(ids.has(q.questionId)).toBe(false);
        ids.add(q.questionId);
      }
    }
  });

  it('every question has misconceptionTraps', () => {
    for (const skillId of getSupportedSkillIds()) {
      for (let i = 0; i < 3; i++) {
        const q = generateQuestion(skillId);
        expect(q.misconceptionTraps).toBeDefined();
        expect(q.misconceptionTraps.length).toBeGreaterThan(0);
      }
    }
  });

  it('every question has solutionText', () => {
    for (const skillId of getSupportedSkillIds()) {
      for (let i = 0; i < 3; i++) {
        const q = generateQuestion(skillId);
        expect(q.solutionText).toBeDefined();
        expect(q.solutionText.length).toBeGreaterThan(0);
      }
    }
  });
});
