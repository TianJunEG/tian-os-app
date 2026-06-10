import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getSupportedSkillIds,
} from './p2FractionsQuestionGenerator.js';
import { validateP2FractionsSkillGraph, p2FractionsSkillGraph } from './p2FractionsSkillGraph.js';
import { validateP2FractionsQuestionFamilies } from './p2FractionsQuestionFamilies.js';

describe('p2FractionsSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP2FractionsSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains all 2 P2-FR skills', () => {
    expect(p2FractionsSkillGraph.skills).toHaveLength(2);
  });

  it('has correct domain metadata', () => {
    expect(p2FractionsSkillGraph.domainId).toBe('p2-fractions');
    expect(p2FractionsSkillGraph.version).toBe('1.0.0');
  });

  it('every skill has P1 prerequisites', () => {
    for (const skill of p2FractionsSkillGraph.skills) {
      expect(skill.prerequisites.length).toBeGreaterThan(0);
      for (const prereq of skill.prerequisites) {
        expect(prereq).toMatch(/^P1-/);
      }
    }
  });
});

describe('p2FractionsQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP2FractionsQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.totalQuestionFamilies).toBe(5);
    expect(result.errors).toHaveLength(0);
  });

  it('has 3 families for FR-01 and 2 for FR-02', () => {
    const result = validateP2FractionsQuestionFamilies();
    expect(result.familiesPerSkill['P2-FR-01']).toBe(3);
    expect(result.familiesPerSkill['P2-FR-02']).toBe(2);
  });
});

describe('p2FractionsQuestionGenerator', () => {
  it('supports all 2 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(2);
    expect(ids).toContain('P2-FR-01');
    expect(ids).toContain('P2-FR-02');
  });

  // P2-FR-01: Add & Subtract Like Fractions
  describe('P2-FR-01: Add Like Fractions (_001)', () => {
    it('produces correct numerator sum within one whole', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P2-FR-01', { questionFamilyId: 'QF_P2-FR-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P2-FR-01');
        expect(q.answerType).toBe('number');

        // Parse: a/d + b/d = ?/d
        const match = q.prompt.match(/(\d+)\/(\d+) \+ (\d+)\/(\d+) = \?\/(\d+)/);
        expect(match).not.toBeNull();
        const [, a, d1, b, d2, d3] = match.map(Number);
        expect(d1).toBe(d2);
        expect(d1).toBe(d3);
        expect(d1).toBeGreaterThanOrEqual(3);
        expect(d1).toBeLessThanOrEqual(12);
        expect(q.answer).toBe(a + b);
        expect(q.answer).toBeLessThanOrEqual(d1); // within one whole
      }
    });
  });

  describe('P2-FR-01: Subtract Like Fractions (_002)', () => {
    it('produces correct numerator difference, non-negative', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P2-FR-01', { questionFamilyId: 'QF_P2-FR-01_002' });
        expect(q).not.toBeNull();

        const match = q.prompt.match(/(\d+)\/(\d+) . (\d+)\/(\d+) = \?\/(\d+)/);
        expect(match).not.toBeNull();
        const a = Number(match[1]);
        const d1 = Number(match[2]);
        const b = Number(match[3]);
        expect(q.answer).toBe(a - b);
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(d1).toBeGreaterThanOrEqual(3);
        expect(d1).toBeLessThanOrEqual(12);
      }
    });
  });

  describe('P2-FR-01: Word Context (_003)', () => {
    it('produces a word problem with a valid numeric answer', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P2-FR-01', { questionFamilyId: 'QF_P2-FR-01_003' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(typeof q.answer).toBe('number');
        // Must mention a name
        const hasName = ['Ali', 'Ben', 'Mei', 'Siti', 'Raj'].some((n) => q.prompt.includes(n));
        expect(hasName).toBe(true);
      }
    });
  });

  // P2-FR-02: Fraction of a Whole
  describe('P2-FR-02: Shaded Parts (_001)', () => {
    it('answer equals the shaded count (numerator)', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P2-FR-02', { questionFamilyId: 'QF_P2-FR-02_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P2-FR-02');
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(q.answer).toBeLessThanOrEqual(8);
        expect(q.diagramHint).toBeDefined();
        expect(q.diagramHint.shadedParts).toBe(q.answer);
      }
    });
  });

  describe('P2-FR-02: Parts to Shade (_002)', () => {
    it('answer equals the numerator of the given fraction', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P2-FR-02', { questionFamilyId: 'QF_P2-FR-02_002' });
        expect(q).not.toBeNull();

        const match = q.prompt.match(/(\d+)\/(\d+)/);
        expect(match).not.toBeNull();
        const num = Number(match[1]);
        expect(q.answer).toBe(num);
        expect(q.diagramHint).toBeDefined();
        expect(q.diagramHint.shadedParts).toBe(0); // student must shade
      }
    });
  });

  // Cross-cutting tests
  describe('generateQuestionSet', () => {
    it('returns the requested count', () => {
      const set = generateQuestionSet('P2-FR-01', 7);
      expect(set).toHaveLength(7);
    });
  });

  describe('generateDiagnosticSet', () => {
    it('generates across all skills', () => {
      const set = generateDiagnosticSet(['P2-FR-01', 'P2-FR-02'], 3);
      expect(set).toHaveLength(6);
      expect(set.filter((q) => q.skillId === 'P2-FR-01')).toHaveLength(3);
      expect(set.filter((q) => q.skillId === 'P2-FR-02')).toHaveLength(3);
    });
  });

  it('returns null for unknown skill', () => {
    expect(generateQuestion('FAKE')).toBeNull();
  });

  it('every question has a unique questionId', () => {
    const ids = new Set();
    for (const skillId of getSupportedSkillIds()) {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion(skillId);
        expect(ids.has(q.questionId)).toBe(false);
        ids.add(q.questionId);
      }
    }
  });

  it('every question has misconceptionTraps', () => {
    for (const skillId of getSupportedSkillIds()) {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion(skillId);
        expect(q.misconceptionTraps).toBeDefined();
        expect(q.misconceptionTraps.length).toBeGreaterThan(0);
      }
    }
  });

  it('every question has solutionText', () => {
    for (const skillId of getSupportedSkillIds()) {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion(skillId);
        expect(q.solutionText).toBeDefined();
        expect(q.solutionText.length).toBeGreaterThan(0);
      }
    }
  });

  it('every question has difficulty and fluencyTargetSeconds', () => {
    for (const skillId of getSupportedSkillIds()) {
      for (let i = 0; i < 3; i++) {
        const q = generateQuestion(skillId);
        expect(q.difficulty).toBeDefined();
        expect(q.difficulty).toBeGreaterThanOrEqual(1);
        expect(q.fluencyTargetSeconds).toBeDefined();
        expect(q.fluencyTargetSeconds).toBeGreaterThan(0);
      }
    }
  });

  // Edge cases
  describe('edge cases', () => {
    it('FR-01 _001 denominator 3 still works (minimal range)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-FR-01', { questionFamilyId: 'QF_P2-FR-01_001' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThanOrEqual(2); // at least 1+1
      }
    });

    it('FR-01 _002 answer is always >= 1', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P2-FR-01', { questionFamilyId: 'QF_P2-FR-01_002' });
        expect(q.answer).toBeGreaterThanOrEqual(1);
      }
    });

    it('FR-02 _001 answer never exceeds denominator', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P2-FR-02', { questionFamilyId: 'QF_P2-FR-02_001' });
        expect(q.answer).toBeLessThanOrEqual(q.diagramHint.totalParts);
      }
    });

    it('FR-02 shapes come from the expected set', () => {
      const validShapes = new Set(['circle', 'rectangle', 'square', 'bar']);
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P2-FR-02', { questionFamilyId: 'QF_P2-FR-02_001' });
        expect(validShapes.has(q.diagramHint.shape)).toBe(true);
      }
    });
  });
});
