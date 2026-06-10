import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getSupportedSkillIds,
} from './p3AreaPerimQuestionGenerator.js';
import { validateP3AreaPerimSkillGraph, p3AreaPerimSkillGraph } from './p3AreaPerimSkillGraph.js';
import { validateP3AreaPerimQuestionFamilies } from './p3AreaPerimQuestionFamilies.js';

describe('p3AreaPerimSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP3AreaPerimSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains all 2 P3-AP skills', () => {
    expect(p3AreaPerimSkillGraph.skills).toHaveLength(2);
  });
});

describe('p3AreaPerimQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP3AreaPerimQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.totalQuestionFamilies).toBe(6);
    expect(result.errors).toHaveLength(0);
  });
});

describe('p3AreaPerimQuestionGenerator', () => {
  it('supports all 2 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(2);
    expect(ids).toContain('P3-AP-01');
    expect(ids).toContain('P3-AP-02');
  });

  // -------------------------------------------------------------------------
  // P3-AP-01: Area
  // -------------------------------------------------------------------------

  describe('P3-AP-01: Area', () => {
    it('generates rectangle area questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-AP-01', { questionFamilyId: 'QF_P3-AP-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P3-AP-01');
        expect(q.prompt).toContain('rectangle');
        const match = q.prompt.match(/length of (\d+) cm.*width of (\d+) cm/);
        expect(match).not.toBeNull();
        expect(q.answer).toBe(Number(match[1]) * Number(match[2]));
      }
    });

    it('generates square area questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-AP-01', { questionFamilyId: 'QF_P3-AP-01_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('square');
        const match = q.prompt.match(/sides of (\d+) cm/);
        expect(match).not.toBeNull();
        const side = Number(match[1]);
        expect(q.answer).toBe(side * side);
      }
    });

    it('generates missing side from area (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-AP-01', { questionFamilyId: 'QF_P3-AP-01_003' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('area');
        // answer * given side should = area
        const areaMatch = q.prompt.match(/area of (\d+) cm²/);
        const sideMatch = q.prompt.match(/(?:width|length) of (\d+) cm/);
        expect(areaMatch).not.toBeNull();
        expect(sideMatch).not.toBeNull();
        expect(q.answer * Number(sideMatch[1])).toBe(Number(areaMatch[1]));
      }
    });
  });

  // -------------------------------------------------------------------------
  // P3-AP-02: Perimeter
  // -------------------------------------------------------------------------

  describe('P3-AP-02: Perimeter', () => {
    it('generates rectangle perimeter questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-AP-02', { questionFamilyId: 'QF_P3-AP-02_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P3-AP-02');
        expect(q.prompt).toContain('rectangle');
        const match = q.prompt.match(/length of (\d+) cm.*width of (\d+) cm/);
        expect(match).not.toBeNull();
        expect(q.answer).toBe(2 * (Number(match[1]) + Number(match[2])));
      }
    });

    it('generates square perimeter questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-AP-02', { questionFamilyId: 'QF_P3-AP-02_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('square');
        const match = q.prompt.match(/sides of (\d+) cm/);
        expect(match).not.toBeNull();
        expect(q.answer).toBe(4 * Number(match[1]));
      }
    });

    it('generates missing side from perimeter (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-AP-02', { questionFamilyId: 'QF_P3-AP-02_003' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('perimeter');
        const perimMatch = q.prompt.match(/perimeter of (\d+) cm/);
        const sideMatch = q.prompt.match(/(?:width|length) of (\d+) cm/);
        expect(perimMatch).not.toBeNull();
        expect(sideMatch).not.toBeNull();
        // Check: 2 * (answer + given) = perimeter
        expect(2 * (q.answer + Number(sideMatch[1]))).toBe(Number(perimMatch[1]));
      }
    });
  });

  // -------------------------------------------------------------------------
  // Utility functions
  // -------------------------------------------------------------------------

  describe('generateQuestionSet', () => {
    it('returns the requested number', () => {
      const set = generateQuestionSet('P3-AP-01', 5);
      expect(set).toHaveLength(5);
    });
  });

  describe('generateDiagnosticSet', () => {
    it('covers all skills', () => {
      const set = generateDiagnosticSet(['P3-AP-01', 'P3-AP-02'], 2);
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
