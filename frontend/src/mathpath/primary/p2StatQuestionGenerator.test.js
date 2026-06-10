import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getSupportedSkillIds,
} from './p2StatQuestionGenerator.js';
import { validateP2StatSkillGraph, p2StatSkillGraph } from './p2StatSkillGraph.js';
import { validateP2StatQuestionFamilies } from './p2StatQuestionFamilies.js';

describe('p2StatSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP2StatSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains all 2 P2-ST skills', () => {
    expect(p2StatSkillGraph.skills).toHaveLength(2);
  });
});

describe('p2StatQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP2StatQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.totalQuestionFamilies).toBe(5);
    expect(result.errors).toHaveLength(0);
  });
});

describe('p2StatQuestionGenerator', () => {
  it('supports all 2 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(2);
    expect(ids).toContain('P2-ST-01');
    expect(ids).toContain('P2-ST-02');
  });

  // -------------------------------------------------------------------------
  // P2-ST-01: Reading a Picture Graph
  // -------------------------------------------------------------------------

  describe('P2-ST-01: Reading a Picture Graph', () => {
    it('generates read-single-category questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-ST-01', { questionFamilyId: 'QF_P2-ST-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P2-ST-01');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThan(0);
        expect(q.diagramData).toBeDefined();
        expect(q.diagramData.categories.length).toBeGreaterThanOrEqual(3);
        // Answer should be icons * scale
        const idx = q.diagramData.categories.findIndex((c) => q.prompt.includes(`chose ${c}?`));
        if (idx !== -1) {
          expect(q.answer).toBe(q.diagramData.iconCounts[idx] * q.diagramData.scale);
        }
      }
    });

    it('generates compare-two-categories questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-ST-01', { questionFamilyId: 'QF_P2-ST-01_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('more');
        expect(q.answer).toBeGreaterThanOrEqual(0);
      }
    });

    it('generates total questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-ST-01', { questionFamilyId: 'QF_P2-ST-01_003' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('altogether');
        expect(q.answer).toBeGreaterThan(0);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P2-ST-02: Most & Least
  // -------------------------------------------------------------------------

  describe('P2-ST-02: Most & Least', () => {
    it('generates most questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-ST-02', { questionFamilyId: 'QF_P2-ST-02_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P2-ST-02');
        expect(q.answerType).toBe('text');
        expect(q.prompt).toContain('most');
        expect(q.diagramData.categories).toContain(q.answer);
      }
    });

    it('generates least questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-ST-02', { questionFamilyId: 'QF_P2-ST-02_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('least');
        expect(q.diagramData.categories).toContain(q.answer);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Utility functions
  // -------------------------------------------------------------------------

  describe('generateQuestionSet', () => {
    it('returns the requested number', () => {
      const set = generateQuestionSet('P2-ST-01', 5);
      expect(set).toHaveLength(5);
    });
  });

  describe('generateDiagnosticSet', () => {
    it('covers all skills', () => {
      const set = generateDiagnosticSet(['P2-ST-01', 'P2-ST-02'], 2);
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

  it('scale is always 1, 2, or 5', () => {
    for (let i = 0; i < 20; i++) {
      const q = generateQuestion('P2-ST-01');
      expect([1, 2, 5]).toContain(q.diagramData.scale);
    }
  });

  it('icon counts are between 1 and 8', () => {
    for (let i = 0; i < 20; i++) {
      const q = generateQuestion('P2-ST-01');
      q.diagramData.iconCounts.forEach((c) => {
        expect(c).toBeGreaterThanOrEqual(1);
        expect(c).toBeLessThanOrEqual(8);
      });
    }
  });
});
