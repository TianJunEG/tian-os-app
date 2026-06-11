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

  it('contains all 2 P4-WP skills', () => {
    expect(p4WordProbSkillGraph.skills).toHaveLength(2);
  });
});

describe('p4WordProbQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP4WordProbQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.totalQuestionFamilies).toBe(4);
    expect(result.errors).toHaveLength(0);
  });
});

describe('p4WordProbQuestionGenerator', () => {
  it('supports all 2 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(2);
    expect(ids).toContain('P4-WP-01');
    expect(ids).toContain('P4-WP-02');
  });

  // -------------------------------------------------------------------------
  // P4-WP-01: Fraction of a Quantity
  // -------------------------------------------------------------------------

  describe('P4-WP-01: Fraction of a Quantity', () => {
    it('generates fraction-of-quantity questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-WP-01', { questionFamilyId: 'QF_P4-WP-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P4-WP-01');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThan(0);
        expect(Number.isInteger(q.answer)).toBe(true);
      }
    });

    it('generates find-remainder questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-WP-01', { questionFamilyId: 'QF_P4-WP-01_002' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThan(0);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.prompt).toMatch(/left/i);
      }
    });

    it('setSize is always divisible by denominator', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P4-WP-01');
        expect(q).not.toBeNull();
        expect(Number.isInteger(q.answer)).toBe(true);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P4-WP-02: Two-Step Word Problem
  // -------------------------------------------------------------------------

  describe('P4-WP-02: Two-Step Word Problem', () => {
    it('generates two-step-subtraction questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-WP-02', { questionFamilyId: 'QF_P4-WP-02_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P4-WP-02');
        expect(q.prompt).toContain('left');
        expect(q.answer).toBeGreaterThan(0);
      }
    });

    it('generates two-step-mixed questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-WP-02', { questionFamilyId: 'QF_P4-WP-02_002' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThan(0);
        expect(q.solutionText).toContain('$');
      }
    });

    it('uses values in the 150-2500 range', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P4-WP-02', { questionFamilyId: 'QF_P4-WP-02_001' });
        const dollarAmounts = q.prompt.match(/\$(\d+)/g).map((s) => parseInt(s.replace('$', ''), 10));
        const maxAmount = Math.max(...dollarAmounts);
        expect(maxAmount).toBeGreaterThanOrEqual(150);
        expect(maxAmount).toBeLessThanOrEqual(2500);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Utility functions
  // -------------------------------------------------------------------------

  describe('generateQuestionSet', () => {
    it('returns the requested number', () => {
      const set = generateQuestionSet('P4-WP-01', 5);
      expect(set).toHaveLength(5);
    });
  });

  describe('generateDiagnosticSet', () => {
    it('covers all skills', () => {
      const set = generateDiagnosticSet(['P4-WP-01', 'P4-WP-02'], 2);
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
