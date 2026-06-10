import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getSupportedSkillIds,
} from './p4StatQuestionGenerator.js';
import { validateP4StatSkillGraph, p4StatSkillGraph } from './p4StatSkillGraph.js';
import { validateP4StatQuestionFamilies } from './p4StatQuestionFamilies.js';

describe('p4StatSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP4StatSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains 2 skills', () => {
    expect(p4StatSkillGraph.skills).toHaveLength(2);
  });
});

describe('p4StatQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP4StatQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.totalQuestionFamilies).toBe(6);
    expect(result.errors).toHaveLength(0);
  });
});

describe('p4StatQuestionGenerator', () => {
  it('supports 2 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(2);
    expect(ids).toContain('P4-STAT-01');
    expect(ids).toContain('P4-STAT-02');
  });

  describe('P4-STAT-01: Reading a Line Graph', () => {
    it('generates read-value questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-STAT-01', { questionFamilyId: 'QF_P4-STAT-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P4-STAT-01');
        expect(q.answer).toBeGreaterThan(0);
        expect(q.prompt).toContain('line graph');
      }
    });

    it('generates increase/decrease questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-STAT-01', { questionFamilyId: 'QF_P4-STAT-01_002' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.prompt).toMatch(/increase|decrease/);
      }
    });

    it('generates greatest-change questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-STAT-01', { questionFamilyId: 'QF_P4-STAT-01_003' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.prompt).toContain('greatest change');
      }
    });

    it('uses multiples of 5, 10, or 20 as values', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P4-STAT-01', { questionFamilyId: 'QF_P4-STAT-01_001' });
        expect(q.answer % 5).toBe(0);
      }
    });
  });

  describe('P4-STAT-02: Reading a Pie Chart', () => {
    it('generates read-sector questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-STAT-02', { questionFamilyId: 'QF_P4-STAT-02_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P4-STAT-02');
        expect(q.answer).toBeGreaterThan(0);
        expect(q.prompt).toContain('pie chart');
      }
    });

    it('generates missing-sector questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-STAT-02', { questionFamilyId: 'QF_P4-STAT-02_002' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThan(0);
        expect(q.answer).toBeLessThanOrEqual(100);
        expect(q.prompt).toContain('percentage');
      }
    });

    it('generates compare-sector questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-STAT-02', { questionFamilyId: 'QF_P4-STAT-02_003' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.prompt).toContain('more');
      }
    });

    it('produces whole-number answers for sector values', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P4-STAT-02', { questionFamilyId: 'QF_P4-STAT-02_001' });
        expect(Number.isInteger(q.answer)).toBe(true);
      }
    });
  });

  describe('generateQuestionSet', () => {
    it('returns the requested number of questions', () => {
      const set = generateQuestionSet('P4-STAT-01', 5);
      expect(set).toHaveLength(5);
      set.forEach((q) => expect(q.skillId).toBe('P4-STAT-01'));
    });
  });

  describe('generateDiagnosticSet', () => {
    it('generates questions across all skills', () => {
      const set = generateDiagnosticSet(['P4-STAT-01', 'P4-STAT-02'], 2);
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
