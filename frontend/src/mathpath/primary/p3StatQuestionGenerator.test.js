import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getSupportedSkillIds,
} from './p3StatQuestionGenerator.js';
import { validateP3StatSkillGraph, p3StatSkillGraph } from './p3StatSkillGraph.js';
import { validateP3StatQuestionFamilies } from './p3StatQuestionFamilies.js';

describe('p3StatSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP3StatSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains all 2 P3-ST skills', () => {
    expect(p3StatSkillGraph.skills).toHaveLength(2);
  });
});

describe('p3StatQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP3StatQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.totalQuestionFamilies).toBe(6);
    expect(result.errors).toHaveLength(0);
  });
});

describe('p3StatQuestionGenerator', () => {
  it('supports all 2 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(2);
    expect(ids).toContain('P3-ST-01');
    expect(ids).toContain('P3-ST-02');
  });

  // -------------------------------------------------------------------------
  // P3-ST-01: Reading a Bar Graph
  // -------------------------------------------------------------------------

  describe('P3-ST-01: Reading a Bar Graph', () => {
    it('generates read-single-bar questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-ST-01', { questionFamilyId: 'QF_P3-ST-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P3-ST-01');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThan(0);
        expect(q.diagramData).toBeDefined();
        expect(q.diagramData.categories.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('generates difference questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-ST-01', { questionFamilyId: 'QF_P3-ST-01_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('more');
        expect(q.answer).toBeGreaterThanOrEqual(0);
      }
    });

    it('generates total questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-ST-01', { questionFamilyId: 'QF_P3-ST-01_003' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('altogether');
        expect(q.answer).toBeGreaterThan(0);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P3-ST-02: Most & Least
  // -------------------------------------------------------------------------

  describe('P3-ST-02: Most & Least', () => {
    it('generates most questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-ST-02', { questionFamilyId: 'QF_P3-ST-02_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P3-ST-02');
        expect(q.answerType).toBe('text');
        expect(q.prompt).toContain('most');
        // Answer should be one of the categories
        expect(q.diagramData.categories).toContain(q.answer);
      }
    });

    it('generates least questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-ST-02', { questionFamilyId: 'QF_P3-ST-02_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('least');
        expect(q.diagramData.categories).toContain(q.answer);
      }
    });

    it('generates most-vs-least difference questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-ST-02', { questionFamilyId: 'QF_P3-ST-02_003' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.prompt).toContain('more');
      }
    });
  });

  // -------------------------------------------------------------------------
  // Utility functions
  // -------------------------------------------------------------------------

  describe('generateQuestionSet', () => {
    it('returns the requested number', () => {
      const set = generateQuestionSet('P3-ST-01', 5);
      expect(set).toHaveLength(5);
    });
  });

  describe('generateDiagnosticSet', () => {
    it('covers all skills', () => {
      const set = generateDiagnosticSet(['P3-ST-01', 'P3-ST-02'], 2);
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

  it('every question includes diagramData', () => {
    for (const sid of getSupportedSkillIds()) {
      for (let i = 0; i < 3; i++) {
        const q = generateQuestion(sid);
        expect(q.diagramData).toBeDefined();
        expect(q.diagramData.title).toBeDefined();
        expect(q.diagramData.categories.length).toBeGreaterThanOrEqual(3);
      }
    }
  });
});
