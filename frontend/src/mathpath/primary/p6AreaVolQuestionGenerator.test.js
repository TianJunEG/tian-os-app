import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getSupportedSkillIds,
} from './p6AreaVolQuestionGenerator.js';
import { validateP6AreaVolSkillGraph, p6AreaVolSkillGraph } from './p6AreaVolSkillGraph.js';
import { validateP6AreaVolQuestionFamilies } from './p6AreaVolQuestionFamilies.js';

describe('p6AreaVolSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP6AreaVolSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains all 3 P6-AV skills', () => {
    expect(p6AreaVolSkillGraph.skills).toHaveLength(3);
  });

  it('has correct prerequisite chain', () => {
    const skills = p6AreaVolSkillGraph.skills;
    const av01 = skills.find((s) => s.id === 'P6-AV-01');
    const av02 = skills.find((s) => s.id === 'P6-AV-02');
    const av03 = skills.find((s) => s.id === 'P6-AV-03');
    expect(av01.prerequisites).toContain('P5-AV-01');
    expect(av02.prerequisites).toContain('P5-AV-02');
    expect(av03.prerequisites).toContain('P6-AV-02');
  });
});

describe('p6AreaVolQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP6AreaVolQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.totalQuestionFamilies).toBe(9);
    expect(result.errors).toHaveLength(0);
  });

  it('has 3 families per skill', () => {
    const result = validateP6AreaVolQuestionFamilies();
    expect(result.familiesPerSkill['P6-AV-01']).toBe(3);
    expect(result.familiesPerSkill['P6-AV-02']).toBe(3);
    expect(result.familiesPerSkill['P6-AV-03']).toBe(3);
  });
});

describe('p6AreaVolQuestionGenerator', () => {
  it('supports all 3 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(3);
    expect(ids).toContain('P6-AV-01');
    expect(ids).toContain('P6-AV-02');
    expect(ids).toContain('P6-AV-03');
  });

  // -------------------------------------------------------------------------
  // P6-AV-01: Area of Composite Figures
  // -------------------------------------------------------------------------

  describe('P6-AV-01: Composite Area', () => {
    it('generates L-shape area questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-AV-01', { questionFamilyId: 'QF_P6-AV-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P6-AV-01');
        expect(q.answerType).toBe('number');
        expect(q.prompt).toContain('L-shaped');
        // Parse outer and cut-out dimensions
        const outerMatch = q.prompt.match(/outer dimensions (\d+) cm by (\d+) cm/);
        const cutMatch = q.prompt.match(/A (\d+) cm by (\d+) cm rectangle/);
        expect(outerMatch).not.toBeNull();
        expect(cutMatch).not.toBeNull();
        const outerArea = Number(outerMatch[1]) * Number(outerMatch[2]);
        const cutArea = Number(cutMatch[1]) * Number(cutMatch[2]);
        expect(q.answer).toBe(outerArea - cutArea);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.answer).toBeGreaterThan(0);
      }
    });

    it('generates T-shape area questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-AV-01', { questionFamilyId: 'QF_P6-AV-01_002' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P6-AV-01');
        expect(q.prompt).toContain('T-shaped');
        // Parse dimensions
        const topMatch = q.prompt.match(/top bar is (\d+) cm long and (\d+) cm wide/);
        const stemMatch = q.prompt.match(/stem .+ is (\d+) cm wide and (\d+) cm tall/);
        expect(topMatch).not.toBeNull();
        expect(stemMatch).not.toBeNull();
        const topArea = Number(topMatch[1]) * Number(topMatch[2]);
        const stemArea = Number(stemMatch[1]) * Number(stemMatch[2]);
        expect(q.answer).toBe(topArea + stemArea);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.answer).toBeGreaterThan(0);
      }
    });

    it('generates rectangle-plus-triangle area questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-AV-01', { questionFamilyId: 'QF_P6-AV-01_003' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P6-AV-01');
        // Parse rectangle and triangle
        const rectMatch = q.prompt.match(/rectangle (\d+) cm by (\d+) cm/);
        const triMatch = q.prompt.match(/base of (\d+) cm and a height of (\d+) cm/);
        expect(rectMatch).not.toBeNull();
        expect(triMatch).not.toBeNull();
        const rectArea = Number(rectMatch[1]) * Number(rectMatch[2]);
        const triArea = (Number(triMatch[1]) * Number(triMatch[2])) / 2;
        expect(q.answer).toBe(rectArea + triArea);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.answer).toBeGreaterThan(0);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P6-AV-02: Volume of Cubes & Cuboids
  // -------------------------------------------------------------------------

  describe('P6-AV-02: Volume', () => {
    it('generates cuboid volume questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-AV-02', { questionFamilyId: 'QF_P6-AV-02_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P6-AV-02');
        expect(q.prompt).toContain('cuboid');
        const match = q.prompt.match(/length of (\d+) cm.*width of (\d+) cm.*height of (\d+) cm/);
        expect(match).not.toBeNull();
        expect(q.answer).toBe(Number(match[1]) * Number(match[2]) * Number(match[3]));
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.answer).toBeGreaterThan(0);
      }
    });

    it('generates missing-dimension questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-AV-02', { questionFamilyId: 'QF_P6-AV-02_002' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P6-AV-02');
        expect(q.prompt).toContain('volume of');
        // Extract volume and two given dimensions
        const volMatch = q.prompt.match(/volume of (\d+) cm³/);
        expect(volMatch).not.toBeNull();
        const volume = Number(volMatch[1]);
        // Extract the two given dimensions
        const dimMatches = [...q.prompt.matchAll(/is (\d+) cm/g)];
        expect(dimMatches.length).toBe(2);
        const d1 = Number(dimMatches[0][1]);
        const d2 = Number(dimMatches[1][1]);
        // answer * d1 * d2 should equal volume
        expect(q.answer * d1 * d2).toBe(volume);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.answer).toBeGreaterThan(0);
      }
    });

    it('generates composite solid volume questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-AV-02', { questionFamilyId: 'QF_P6-AV-02_003' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P6-AV-02');
        expect(q.prompt).toContain('Cuboid A');
        expect(q.prompt).toContain('Cuboid B');
        // Parse cuboid A and B dimensions
        const aMatch = q.prompt.match(/Cuboid A is (\d+) cm by (\d+) cm by (\d+) cm/);
        const bMatch = q.prompt.match(/Cuboid B is (\d+) cm by (\d+) cm by (\d+) cm/);
        expect(aMatch).not.toBeNull();
        expect(bMatch).not.toBeNull();
        const volA = Number(aMatch[1]) * Number(aMatch[2]) * Number(aMatch[3]);
        const volB = Number(bMatch[1]) * Number(bMatch[2]) * Number(bMatch[3]);
        expect(q.answer).toBe(volA + volB);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.answer).toBeGreaterThan(0);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P6-AV-03: Volume & Water Problems
  // -------------------------------------------------------------------------

  describe('P6-AV-03: Water Problems', () => {
    it('generates water level rise questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-AV-03', { questionFamilyId: 'QF_P6-AV-03_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P6-AV-03');
        expect(q.prompt).toContain('rise');
        // Parse tank dimensions and object volume
        const tankMatch = q.prompt.match(/(\d+) cm long and (\d+) cm wide/);
        const volMatch = q.prompt.match(/volume of (\d+) cm³/);
        expect(tankMatch).not.toBeNull();
        expect(volMatch).not.toBeNull();
        const baseArea = Number(tankMatch[1]) * Number(tankMatch[2]);
        const objVol = Number(volMatch[1]);
        expect(q.answer).toBe(objVol / baseArea);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.answer).toBeGreaterThan(0);
      }
    });

    it('generates volume of water questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-AV-03', { questionFamilyId: 'QF_P6-AV-03_002' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P6-AV-03');
        expect(q.prompt).toContain('volume of water');
        // Parse dimensions
        const lMatch = q.prompt.match(/(\d+) cm long/);
        const wMatch = q.prompt.match(/(\d+) cm wide/);
        const hMatch = q.prompt.match(/height of (\d+) cm/);
        expect(lMatch).not.toBeNull();
        expect(wMatch).not.toBeNull();
        expect(hMatch).not.toBeNull();
        expect(q.answer).toBe(Number(lMatch[1]) * Number(wMatch[1]) * Number(hMatch[1]));
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.answer).toBeGreaterThan(0);
      }
    });

    it('generates volume-to-fill questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-AV-03', { questionFamilyId: 'QF_P6-AV-03_003' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P6-AV-03');
        expect(q.prompt).toContain('fill the tank completely');
        // Parse dimensions
        const lMatch = q.prompt.match(/(\d+) cm long/);
        const wMatch = q.prompt.match(/(\d+) cm wide/);
        const tankHMatch = q.prompt.match(/(\d+) cm tall/);
        const waterHMatch = q.prompt.match(/height of (\d+) cm/);
        expect(lMatch).not.toBeNull();
        expect(wMatch).not.toBeNull();
        expect(tankHMatch).not.toBeNull();
        expect(waterHMatch).not.toBeNull();
        const emptyH = Number(tankHMatch[1]) - Number(waterHMatch[1]);
        expect(q.answer).toBe(Number(lMatch[1]) * Number(wMatch[1]) * emptyH);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.answer).toBeGreaterThan(0);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Utility functions
  // -------------------------------------------------------------------------

  describe('generateQuestionSet', () => {
    it('returns the requested number of questions', () => {
      const set = generateQuestionSet('P6-AV-01', 5);
      expect(set).toHaveLength(5);
    });
  });

  describe('generateDiagnosticSet', () => {
    it('covers all skills', () => {
      const set = generateDiagnosticSet(['P6-AV-01', 'P6-AV-02', 'P6-AV-03'], 2);
      expect(set).toHaveLength(6);
      expect(new Set(set.map((q) => q.skillId)).size).toBe(3);
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
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion(sid);
        expect(q.misconceptionTraps.length).toBeGreaterThan(0);
        expect(q.solutionText.length).toBeGreaterThan(0);
      }
    }
  });

  it('all answers across all families are positive integers (10 iterations each)', () => {
    const families = [
      'QF_P6-AV-01_001', 'QF_P6-AV-01_002', 'QF_P6-AV-01_003',
      'QF_P6-AV-02_001', 'QF_P6-AV-02_002', 'QF_P6-AV-02_003',
      'QF_P6-AV-03_001', 'QF_P6-AV-03_002', 'QF_P6-AV-03_003',
    ];
    for (const fam of families) {
      const skillId = fam.replace(/^QF_(P6-AV-\d+)_.*$/, '$1');
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion(skillId, { questionFamilyId: fam });
        expect(q).not.toBeNull();
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.answer).toBeGreaterThan(0);
      }
    }
  });
});
