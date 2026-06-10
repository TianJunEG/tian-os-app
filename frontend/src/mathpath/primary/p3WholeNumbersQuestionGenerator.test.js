import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getSupportedSkillIds,
} from './p3WholeNumbersQuestionGenerator.js';
import { validateP3WholeNumbersSkillGraph, p3WholeNumbersSkillGraph } from './p3WholeNumbersSkillGraph.js';
import { validateP3WholeNumbersQuestionFamilies } from './p3WholeNumbersQuestionFamilies.js';

// ---------------------------------------------------------------------------
// Skill graph validation
// ---------------------------------------------------------------------------

describe('p3WholeNumbersSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP3WholeNumbersSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains all 3 P3-WN skills', () => {
    expect(p3WholeNumbersSkillGraph.skills).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// Question families validation
// ---------------------------------------------------------------------------

describe('p3WholeNumbersQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP3WholeNumbersQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.totalQuestionFamilies).toBe(10);
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Generator: skill coverage
// ---------------------------------------------------------------------------

describe('p3WholeNumbersQuestionGenerator', () => {
  it('supports all 3 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(3);
    expect(ids).toContain('P3-WN-01');
    expect(ids).toContain('P3-WN-02');
    expect(ids).toContain('P3-WN-03');
  });

  // -------------------------------------------------------------------------
  // P3-WN-01: Place Value
  // -------------------------------------------------------------------------

  describe('P3-WN-01: Place Value', () => {
    it('generates decompose questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-WN-01', { questionFamilyId: 'QF_P3-WN-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P3-WN-01');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThanOrEqual(9);
        expect(q.diagramSpec).toBeDefined();
      }
    });

    it('generates compose questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-WN-01', { questionFamilyId: 'QF_P3-WN-01_002' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThanOrEqual(1000);
        expect(q.answer).toBeLessThanOrEqual(9999);
      }
    });

    it('generates value-of-digit questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-WN-01', { questionFamilyId: 'QF_P3-WN-01_003' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('value of the digit');
        expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].some(
          (d) => q.answer === d || q.answer === d * 10 || q.answer === d * 100 || q.answer === d * 1000
        )).toBe(true);
      }
    });

    it('generates zero-placeholder questions (_004)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-WN-01', { questionFamilyId: 'QF_P3-WN-01_004' });
        expect(q).not.toBeNull();
        const str = String(q.answer);
        expect(str.length).toBeLessThanOrEqual(4);
        expect(q.prompt).toContain('0');
      }
    });
  });

  // -------------------------------------------------------------------------
  // P3-WN-02: Comparing & Ordering
  // -------------------------------------------------------------------------

  describe('P3-WN-02: Comparing & Ordering', () => {
    it('generates comparison questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-WN-02', { questionFamilyId: 'QF_P3-WN-02_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P3-WN-02');
        expect(q.answerType).toBe('choice');
        expect(['>', '<', '=']).toContain(q.answer);
        expect(q.diagramSpec).toBeDefined();
        expect(q.diagramSpec.type).toBe('number_line');
      }
    });

    it('generates ordering questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-WN-02', { questionFamilyId: 'QF_P3-WN-02_002' });
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
        const q = generateQuestion('P3-WN-02', { questionFamilyId: 'QF_P3-WN-02_003' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(1000);
        expect(q.answer).toBeLessThanOrEqual(9876);
        expect(q.prompt).toMatch(/greatest|smallest/);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P3-WN-03: Number Patterns
  // -------------------------------------------------------------------------

  describe('P3-WN-03: Number Patterns', () => {
    it('generates increasing pattern (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-WN-03', { questionFamilyId: 'QF_P3-WN-03_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P3-WN-03');
        expect(q.answerType).toBe('number');
        expect(q.prompt).toContain('?');
        expect(q.solutionText).toContain('increases');
        expect(q.diagramSpec).toBeDefined();
        expect(q.diagramSpec.type).toBe('number_line');
      }
    });

    it('generates decreasing pattern (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-WN-03', { questionFamilyId: 'QF_P3-WN-03_002' });
        expect(q).not.toBeNull();
        expect(q.solutionText).toContain('decreases');
        expect(q.answer).toBeGreaterThanOrEqual(0);
      }
    });

    it('generates missing-term pattern (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-WN-03', { questionFamilyId: 'QF_P3-WN-03_003' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('?');
        expect(q.prompt).toContain('missing');
      }
    });
  });

  // -------------------------------------------------------------------------
  // generateQuestionSet
  // -------------------------------------------------------------------------

  describe('generateQuestionSet', () => {
    it('returns the requested number of questions', () => {
      const set = generateQuestionSet('P3-WN-01', 5);
      expect(set).toHaveLength(5);
      set.forEach((q) => expect(q.skillId).toBe('P3-WN-01'));
    });

    it('defaults to 5 questions', () => {
      const set = generateQuestionSet('P3-WN-02');
      expect(set).toHaveLength(5);
    });
  });

  // -------------------------------------------------------------------------
  // generateDiagnosticSet
  // -------------------------------------------------------------------------

  describe('generateDiagnosticSet', () => {
    it('generates questions across all skills', () => {
      const skills = ['P3-WN-01', 'P3-WN-02', 'P3-WN-03'];
      const set = generateDiagnosticSet(skills, 2);
      expect(set).toHaveLength(6);
      const skillIds = new Set(set.map((q) => q.skillId));
      expect(skillIds.size).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases and cross-cutting concerns
  // -------------------------------------------------------------------------

  it('returns null for unknown skill', () => {
    expect(generateQuestion('FAKE-SKILL')).toBeNull();
    expect(generateQuestion('P3-WN-99')).toBeNull();
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
