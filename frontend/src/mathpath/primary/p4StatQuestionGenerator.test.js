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

  it('contains all 2 P4-ST skills', () => {
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
  it('supports all 2 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(2);
    expect(ids).toContain('P4-ST-01');
    expect(ids).toContain('P4-ST-02');
  });

  // -------------------------------------------------------------------------
  // P4-ST-01: Reading a Line Graph
  // -------------------------------------------------------------------------

  describe('P4-ST-01: Reading a Line Graph', () => {
    it('generates read-value questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-ST-01', { questionFamilyId: 'QF_P4-ST-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P4-ST-01');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThan(0);
        expect(q.diagramData).toBeDefined();
        expect(q.diagramData.type).toBe('line_graph');
        expect(q.diagramData.labels.length).toBe(5);
      }
    });

    it('generates find-change questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-ST-01', { questionFamilyId: 'QF_P4-ST-01_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toMatch(/increase|decrease|change/);
        expect(q.answer).toBeGreaterThanOrEqual(0);
      }
    });

    it('generates find-total questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-ST-01', { questionFamilyId: 'QF_P4-ST-01_003' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('total');
        expect(q.answer).toBeGreaterThan(0);
        // Total should equal sum of all diagramData values
        const expectedTotal = q.diagramData.values.reduce((s, v) => s + v, 0);
        expect(q.answer).toBe(expectedTotal);
      }
    });

    it('presents data as text description', () => {
      const q = generateQuestion('P4-ST-01', { questionFamilyId: 'QF_P4-ST-01_001' });
      // Prompt should contain the dash-separated label-value pairs
      expect(q.prompt).toMatch(/\w+ — \d+/);
    });
  });

  // -------------------------------------------------------------------------
  // P4-ST-02: Reading a Pie Chart
  // -------------------------------------------------------------------------

  describe('P4-ST-02: Reading a Pie Chart', () => {
    it('generates read-sector questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-ST-02', { questionFamilyId: 'QF_P4-ST-02_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P4-ST-02');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThan(0);
        expect(q.diagramData).toBeDefined();
        expect(q.diagramData.type).toBe('pie_chart');
        expect(q.diagramData.categories.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('generates find-total questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-ST-02', { questionFamilyId: 'QF_P4-ST-02_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('altogether');
        expect(q.answer).toBeGreaterThan(0);
        // Total should equal sum of all sector values
        const expectedTotal = q.diagramData.values.reduce((s, v) => s + v, 0);
        expect(q.answer).toBe(expectedTotal);
      }
    });

    it('generates find-difference questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-ST-02', { questionFamilyId: 'QF_P4-ST-02_003' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('more');
        expect(q.answer).toBeGreaterThanOrEqual(0);
      }
    });

    it('sector values sum to a round total', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P4-ST-02');
        const total = q.diagramData.values.reduce((s, v) => s + v, 0);
        expect(total).toBe(q.diagramData.total);
        expect([40, 50, 60, 80, 100, 120]).toContain(total);
      }
    });

    it('presents data as text description', () => {
      const q = generateQuestion('P4-ST-02', { questionFamilyId: 'QF_P4-ST-02_001' });
      expect(q.prompt).toContain('pie chart');
      expect(q.prompt).toMatch(/\w+ — \d+/);
    });
  });

  // -------------------------------------------------------------------------
  // Utility functions
  // -------------------------------------------------------------------------

  describe('generateQuestionSet', () => {
    it('returns the requested number', () => {
      const set = generateQuestionSet('P4-ST-01', 5);
      expect(set).toHaveLength(5);
    });
  });

  describe('generateDiagnosticSet', () => {
    it('covers all skills', () => {
      const set = generateDiagnosticSet(['P4-ST-01', 'P4-ST-02'], 2);
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
        expect(q.diagramData.type).toBeDefined();
      }
    }
  });
});
