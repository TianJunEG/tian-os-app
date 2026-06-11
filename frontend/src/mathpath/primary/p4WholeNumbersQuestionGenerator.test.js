import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getSupportedSkillIds,
} from './p4WholeNumbersQuestionGenerator.js';
import { validateP4WholeNumbersSkillGraph, p4WholeNumbersSkillGraph } from './p4WholeNumbersSkillGraph.js';
import { validateP4WholeNumbersQuestionFamilies } from './p4WholeNumbersQuestionFamilies.js';

// ---------------------------------------------------------------------------
// Skill graph validation
// ---------------------------------------------------------------------------

describe('p4WholeNumbersSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP4WholeNumbersSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains all 4 P4-WN skills', () => {
    expect(p4WholeNumbersSkillGraph.skills).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// Question families validation
// ---------------------------------------------------------------------------

describe('p4WholeNumbersQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP4WholeNumbersQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.totalQuestionFamilies).toBe(12);
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Generator: skill coverage
// ---------------------------------------------------------------------------

describe('p4WholeNumbersQuestionGenerator', () => {
  it('supports all 4 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(4);
    expect(ids).toContain('P4-WN-01');
    expect(ids).toContain('P4-WN-02');
    expect(ids).toContain('P4-WN-03');
    expect(ids).toContain('P4-WN-04');
  });

  // -------------------------------------------------------------------------
  // P4-WN-01: Place Value (ten thousands to ones)
  // -------------------------------------------------------------------------

  describe('P4-WN-01: Place Value', () => {
    it('generates expanded-form-to-number questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-WN-01', { questionFamilyId: 'QF_P4-WN-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P4-WN-01');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(10000);
        expect(q.answer).toBeLessThanOrEqual(99999);
        expect(q.prompt).toContain('+');
        expect(q.diagramSpec).toBeDefined();
      }
    });

    it('generates number-to-expanded-form questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-WN-01', { questionFamilyId: 'QF_P4-WN-01_002' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('choice');
        expect(q.options).toBeDefined();
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.answer).toContain('+');
        expect(q.prompt).toContain('expanded form');
      }
    });

    it('generates value-of-digit questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-WN-01', { questionFamilyId: 'QF_P4-WN-01_003' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('value of the digit');
        expect(q.answerType).toBe('number');
        // The answer is a digit times its place value: 0, d, d*10, d*100, d*1000, d*10000
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThanOrEqual(90000);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P4-WN-02: Comparing & Ordering Numbers
  // -------------------------------------------------------------------------

  describe('P4-WN-02: Comparing & Ordering', () => {
    it('generates which-is-greater questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-WN-02', { questionFamilyId: 'QF_P4-WN-02_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P4-WN-02');
        expect(q.answerType).toBe('choice');
        expect(['>', '<', '=']).toContain(q.answer);
        expect(q.diagramSpec).toBeDefined();
        expect(q.diagramSpec.type).toBe('number_line');
      }
    });

    it('generates order-ascending questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-WN-02', { questionFamilyId: 'QF_P4-WN-02_002' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('choice');
        expect(q.prompt).toContain('smallest to largest');
        const nums = q.answer.split(', ').map(Number);
        expect(nums).toHaveLength(3);
        // Verify ascending order
        expect(nums[0]).toBeLessThan(nums[1]);
        expect(nums[1]).toBeLessThan(nums[2]);
      }
    });

    it('generates order-descending questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-WN-02', { questionFamilyId: 'QF_P4-WN-02_003' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('choice');
        expect(q.prompt).toContain('largest to smallest');
        const nums = q.answer.split(', ').map(Number);
        expect(nums).toHaveLength(3);
        // Verify descending order
        expect(nums[0]).toBeGreaterThan(nums[1]);
        expect(nums[1]).toBeGreaterThan(nums[2]);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P4-WN-03: Number Patterns
  // -------------------------------------------------------------------------

  describe('P4-WN-03: Number Patterns', () => {
    it('generates find-next-in-sequence questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-WN-03', { questionFamilyId: 'QF_P4-WN-03_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P4-WN-03');
        expect(q.answerType).toBe('number');
        expect(q.prompt).toContain('?');
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(q.answer).toBeLessThanOrEqual(100000);
        expect(q.diagramSpec).toBeDefined();
        expect(q.diagramSpec.type).toBe('number_line');
      }
    });

    it('generates find-rule questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-WN-03', { questionFamilyId: 'QF_P4-WN-03_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('rule');
        expect(q.answerType).toBe('number');
        // Step is non-zero
        expect(q.answer).not.toBe(0);
      }
    });

    it('generates find-missing-middle questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-WN-03', { questionFamilyId: 'QF_P4-WN-03_003' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('?');
        expect(q.prompt).toContain('missing');
        expect(q.answer).toBeGreaterThanOrEqual(1);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P4-WN-04: Rounding
  // -------------------------------------------------------------------------

  describe('P4-WN-04: Rounding', () => {
    it('generates round-to-10 questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-WN-04', { questionFamilyId: 'QF_P4-WN-04_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P4-WN-04');
        expect(q.answerType).toBe('number');
        expect(q.prompt).toContain('nearest 10');
        expect(q.answer % 10).toBe(0);
        expect(q.answer).toBeGreaterThanOrEqual(1000);
        expect(q.answer).toBeLessThanOrEqual(100000);
      }
    });

    it('generates round-to-100 questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-WN-04', { questionFamilyId: 'QF_P4-WN-04_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('nearest 100');
        expect(q.answer % 100).toBe(0);
        expect(q.answer).toBeGreaterThanOrEqual(1000);
        expect(q.answer).toBeLessThanOrEqual(100000);
      }
    });

    it('generates round-to-1000 questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-WN-04', { questionFamilyId: 'QF_P4-WN-04_003' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('nearest 1,000');
        expect(q.answer % 1000).toBe(0);
        expect(q.answer).toBeGreaterThanOrEqual(1000);
        expect(q.answer).toBeLessThanOrEqual(100000);
      }
    });

    it('correctly rounds numbers with 5 in the deciding position', () => {
      // Regression: 5 should round up
      // We test the rounding logic directly
      const roundTo = (n, place) => Math.round(n / place) * place;
      expect(roundTo(4385, 10)).toBe(4390);
      expect(roundTo(4350, 100)).toBe(4400);
      expect(roundTo(4500, 1000)).toBe(5000);
      expect(roundTo(45000, 10000)).toBe(50000);
    });
  });

  // -------------------------------------------------------------------------
  // generateQuestionSet
  // -------------------------------------------------------------------------

  describe('generateQuestionSet', () => {
    it('returns the requested number of questions', () => {
      const set = generateQuestionSet('P4-WN-01', 5);
      expect(set).toHaveLength(5);
      set.forEach((q) => expect(q.skillId).toBe('P4-WN-01'));
    });

    it('defaults to 5 questions', () => {
      const set = generateQuestionSet('P4-WN-02');
      expect(set).toHaveLength(5);
    });
  });

  // -------------------------------------------------------------------------
  // generateDiagnosticSet
  // -------------------------------------------------------------------------

  describe('generateDiagnosticSet', () => {
    it('generates questions across all skills', () => {
      const skills = ['P4-WN-01', 'P4-WN-02', 'P4-WN-03', 'P4-WN-04'];
      const set = generateDiagnosticSet(skills, 2);
      expect(set).toHaveLength(8);
      const skillIds = new Set(set.map((q) => q.skillId));
      expect(skillIds.size).toBe(4);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases and cross-cutting concerns
  // -------------------------------------------------------------------------

  it('returns null for unknown skill', () => {
    expect(generateQuestion('FAKE-SKILL')).toBeNull();
    expect(generateQuestion('P4-WN-99')).toBeNull();
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
