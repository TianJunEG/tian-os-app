import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getSupportedSkillIds,
} from './p4WordProbQuestionGenerator.js';
import { validateP4WordProbSkillGraph, p4WordProbSkillGraph } from './p4WordProbSkillGraph.js';
import { validateP4WordProbQuestionFamilies } from './p4WordProbQuestionFamilies.js';

describe('p4WordProbSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP4WordProbSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains 2 skills', () => {
    expect(p4WordProbSkillGraph.skills).toHaveLength(2);
  });
});

describe('p4WordProbQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP4WordProbQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.totalQuestionFamilies).toBe(6);
    expect(result.errors).toHaveLength(0);
  });
});

describe('p4WordProbQuestionGenerator', () => {
  it('supports 2 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(2);
    expect(ids).toContain('P4-WP-01');
    expect(ids).toContain('P4-WP-02');
  });

  describe('P4-WP-01: Fraction of a Quantity', () => {
    it('generates unit-fraction questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-WP-01', { questionFamilyId: 'QF_P4-WP-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P4-WP-01');
        expect(q.answer).toBeGreaterThan(0);
        expect(Number.isInteger(q.answer)).toBe(true);
      }
    });

    it('generates non-unit-fraction questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-WP-01', { questionFamilyId: 'QF_P4-WP-01_002' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThan(0);
        expect(Number.isInteger(q.answer)).toBe(true);
      }
    });

    it('generates contextual fraction questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-WP-01', { questionFamilyId: 'QF_P4-WP-01_003' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThan(0);
        expect(Number.isInteger(q.answer)).toBe(true);
      }
    });

    it('produces answers that are whole numbers (divisible)', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P4-WP-01');
        expect(Number.isInteger(q.answer)).toBe(true);
      }
    });
  });

  describe('P4-WP-02: Two-Step Word Problems', () => {
    it('generates subtract-twice questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-WP-02', { questionFamilyId: 'QF_P4-WP-02_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P4-WP-02');
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.prompt).toContain('$');
      }
    });

    it('generates buy-and-change questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-WP-02', { questionFamilyId: 'QF_P4-WP-02_002' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.prompt).toContain('change');
      }
    });

    it('generates combined-operations questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-WP-02', { questionFamilyId: 'QF_P4-WP-02_003' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.prompt).toContain('earned');
      }
    });

    it('uses numbers in the 150-2500 range', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P4-WP-02', { questionFamilyId: 'QF_P4-WP-02_001' });
        // The total in the prompt should be >= 800 (our min)
        const nums = q.prompt.match(/\$(\d+)/g).map((s) => parseInt(s.replace('$', '')));
        const maxNum = Math.max(...nums);
        expect(maxNum).toBeGreaterThanOrEqual(150);
        expect(maxNum).toBeLessThanOrEqual(2500);
      }
    });
  });

  describe('generateQuestionSet', () => {
    it('returns the requested number of questions', () => {
      const set = generateQuestionSet('P4-WP-01', 5);
      expect(set).toHaveLength(5);
      set.forEach((q) => expect(q.skillId).toBe('P4-WP-01'));
    });
  });

  describe('generateDiagnosticSet', () => {
    it('generates questions across all skills', () => {
      const set = generateDiagnosticSet(['P4-WP-01', 'P4-WP-02'], 2);
      expect(set).toHaveLength(4);
      const skillIds = new Set(set.map((q) => q.skillId));
      expect(skillIds.size).toBe(2);
    });
  });

  it('returns null for unknown skill', () => {
    expect(generateQuestion('FAKE')).toBeNull();
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
