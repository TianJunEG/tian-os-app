import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getSupportedSkillIds,
} from './p4FactorsMultiplesQuestionGenerator.js';
import { validateP4FactorsMultiplesSkillGraph, p4FactorsMultiplesSkillGraph } from './p4FactorsMultiplesSkillGraph.js';
import { validateP4FactorsMultiplesQuestionFamilies } from './p4FactorsMultiplesQuestionFamilies.js';

describe('p4FactorsMultiplesSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP4FactorsMultiplesSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains 2 skills', () => {
    expect(p4FactorsMultiplesSkillGraph.skills).toHaveLength(2);
  });
});

describe('p4FactorsMultiplesQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP4FactorsMultiplesQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.totalQuestionFamilies).toBe(6);
    expect(result.errors).toHaveLength(0);
  });
});

describe('p4FactorsMultiplesQuestionGenerator', () => {
  it('supports 2 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(2);
    expect(ids).toContain('P4-FM-01');
    expect(ids).toContain('P4-FM-02');
  });

  describe('P4-FM-01: Common Factors', () => {
    it('generates factor-count questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-FM-01', { questionFamilyId: 'QF_P4-FM-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P4-FM-01');
        expect(q.answer).toBeGreaterThanOrEqual(2);
        expect(q.prompt).toContain('factors');
      }
    });

    it('generates common-factor-count questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-FM-01', { questionFamilyId: 'QF_P4-FM-01_002' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(q.prompt).toContain('common factors');
      }
    });

    it('generates HCF questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-FM-01', { questionFamilyId: 'QF_P4-FM-01_003' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(q.prompt).toContain('greatest common factor');
      }
    });
  });

  describe('P4-FM-02: Common Multiples', () => {
    it('generates Nth-multiple questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-FM-02', { questionFamilyId: 'QF_P4-FM-02_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P4-FM-02');
        expect(q.answer).toBeGreaterThan(0);
        expect(q.prompt).toContain('multiple');
      }
    });

    it('generates common-multiple-count questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-FM-02', { questionFamilyId: 'QF_P4-FM-02_002' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(q.prompt).toContain('common multiples');
      }
    });

    it('generates LCM questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-FM-02', { questionFamilyId: 'QF_P4-FM-02_003' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThan(0);
        expect(q.prompt).toContain('lowest common multiple');
      }
    });
  });

  describe('generateQuestionSet', () => {
    it('returns the requested number of questions', () => {
      const set = generateQuestionSet('P4-FM-01', 5);
      expect(set).toHaveLength(5);
      set.forEach((q) => expect(q.skillId).toBe('P4-FM-01'));
    });
  });

  describe('generateDiagnosticSet', () => {
    it('generates questions across all skills', () => {
      const set = generateDiagnosticSet(['P4-FM-01', 'P4-FM-02'], 2);
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
