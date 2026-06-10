import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getSupportedSkillIds,
} from './p3WordProbQuestionGenerator.js';
import { validateP3WordProbSkillGraph, p3WordProbSkillGraph } from './p3WordProbSkillGraph.js';
import { validateP3WordProbQuestionFamilies } from './p3WordProbQuestionFamilies.js';

describe('p3WordProbSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP3WordProbSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains all 2 P3-WP skills', () => {
    expect(p3WordProbSkillGraph.skills).toHaveLength(2);
  });
});

describe('p3WordProbQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP3WordProbQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.totalQuestionFamilies).toBe(6);
    expect(result.errors).toHaveLength(0);
  });
});

describe('p3WordProbQuestionGenerator', () => {
  it('supports all 2 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(2);
    expect(ids).toContain('P3-WP-01');
    expect(ids).toContain('P3-WP-02');
  });

  // -------------------------------------------------------------------------
  // P3-WP-01: Sharing Equally
  // -------------------------------------------------------------------------

  describe('P3-WP-01: Sharing Equally', () => {
    it('generates exact sharing questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-WP-01', { questionFamilyId: 'QF_P3-WP-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P3-WP-01');
        expect(q.prompt).toContain('equally');
        expect(q.answer).toBeGreaterThanOrEqual(3);
        expect(q.answer).toBeLessThanOrEqual(12);
      }
    });

    it('generates remainder sharing questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-WP-01', { questionFamilyId: 'QF_P3-WP-01_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('left over');
        expect(q.answer).toBeGreaterThanOrEqual(1);
        // remainder < groups
        const groupMatch = q.prompt.match(/among (\d+)/);
        if (groupMatch) {
          expect(q.answer).toBeLessThan(Number(groupMatch[1]));
        }
      }
    });

    it('generates how-many-groups questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-WP-01', { questionFamilyId: 'QF_P3-WP-01_003' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('How many');
        expect(q.answer).toBeGreaterThanOrEqual(3);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P3-WP-02: Two-Step
  // -------------------------------------------------------------------------

  describe('P3-WP-02: Two-Step Word Problem', () => {
    it('generates subtract-twice questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-WP-02', { questionFamilyId: 'QF_P3-WP-02_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P3-WP-02');
        expect(q.prompt).toContain('left');
        expect(q.answer).toBeGreaterThan(0);
      }
    });

    it('generates add-then-subtract questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-WP-02', { questionFamilyId: 'QF_P3-WP-02_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('left');
        expect(q.answer).toBeGreaterThan(0);
        expect(q.solutionText).toContain('Total spent');
      }
    });

    it('generates multiply-then-subtract questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-WP-02', { questionFamilyId: 'QF_P3-WP-02_003' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('change');
        expect(q.answer).toBeGreaterThan(0);
        expect(q.solutionText).toContain('Total cost');
      }
    });
  });

  // -------------------------------------------------------------------------
  // Utility functions
  // -------------------------------------------------------------------------

  describe('generateQuestionSet', () => {
    it('returns the requested number', () => {
      const set = generateQuestionSet('P3-WP-01', 5);
      expect(set).toHaveLength(5);
    });
  });

  describe('generateDiagnosticSet', () => {
    it('covers all skills', () => {
      const set = generateDiagnosticSet(['P3-WP-01', 'P3-WP-02'], 2);
      expect(set).toHaveLength(4);
      expect(new Set(set.map((q) => q.skillId)).size).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // Cross-cutting
  // -------------------------------------------------------------------------

  it('returns null for unknown skill', () => {
    expect(generateQuestion('FAKE')).toBeNull();
  });

  it('every question has a unique questionId', () => {
    const ids = new Set();
    for (const sid of getSupportedSkillIds()) {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion(sid);
        expect(ids.has(q.questionId)).toBe(false);
        ids.add(q.questionId);
      }
    }
  });

  it('every question has misconceptionTraps and solutionText', () => {
    for (const sid of getSupportedSkillIds()) {
      for (let i = 0; i < 3; i++) {
        const q = generateQuestion(sid);
        expect(q.misconceptionTraps.length).toBeGreaterThan(0);
        expect(q.solutionText.length).toBeGreaterThan(0);
      }
    }
  });
});
