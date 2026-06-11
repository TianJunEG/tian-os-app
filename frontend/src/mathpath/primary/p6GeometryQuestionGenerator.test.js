import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getSupportedSkillIds,
} from './p6GeometryQuestionGenerator.js';
import { validateP6GeometrySkillGraph, p6GeometrySkillGraph } from './p6GeometrySkillGraph.js';
import { validateP6GeometryQuestionFamilies } from './p6GeometryQuestionFamilies.js';
import { getAllMisconceptions, getMisconceptionsForSkill, getRemediationForTag } from './p6GeometryMisconceptionMap.js';

// ---------------------------------------------------------------------------
// Skill graph validation
// ---------------------------------------------------------------------------

describe('p6GeometrySkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP6GeometrySkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains 3 P6-GEO skills', () => {
    expect(p6GeometrySkillGraph.skills).toHaveLength(3);
  });

  it('has correct prerequisite chain', () => {
    const skillMap = new Map(p6GeometrySkillGraph.skills.map((s) => [s.id, s]));
    expect(skillMap.get('P6-GEO-01').prerequisites).toContain('P5-GEO-01');
    expect(skillMap.get('P6-GEO-02').prerequisites).toContain('P6-GEO-01');
    expect(skillMap.get('P6-GEO-03').prerequisites).toContain('P6-GEO-02');
  });

  it('skills have difficulty 4 or 5', () => {
    for (const skill of p6GeometrySkillGraph.skills) {
      expect(skill.difficulty).toBeGreaterThanOrEqual(4);
      expect(skill.difficulty).toBeLessThanOrEqual(5);
    }
  });
});

// ---------------------------------------------------------------------------
// Question families validation
// ---------------------------------------------------------------------------

describe('p6GeometryQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP6GeometryQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.totalQuestionFamilies).toBe(9);
    expect(result.errors).toHaveLength(0);
  });

  it('has 3 families per skill', () => {
    const result = validateP6GeometryQuestionFamilies();
    for (const skillId of p6GeometrySkillGraph.skillIds) {
      expect(result.familiesPerSkill[skillId]).toBe(3);
    }
  });
});

// ---------------------------------------------------------------------------
// Misconception map validation
// ---------------------------------------------------------------------------

describe('p6GeometryMisconceptionMap', () => {
  it('contains 9 misconceptions', () => {
    expect(getAllMisconceptions()).toHaveLength(9);
  });

  it('every misconception has remediation data', () => {
    for (const m of getAllMisconceptions()) {
      const r = getRemediationForTag(m.tag);
      expect(r).not.toBeNull();
      expect(r.explanation.length).toBeGreaterThan(0);
      expect(r.parentNote.length).toBeGreaterThan(0);
    }
  });

  it('covers all three skills', () => {
    for (const skillId of p6GeometrySkillGraph.skillIds) {
      const related = getMisconceptionsForSkill(skillId);
      expect(related.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Generator: skill coverage
// ---------------------------------------------------------------------------

describe('p6GeometryQuestionGenerator', () => {
  it('supports all 3 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(3);
    expect(ids).toContain('P6-GEO-01');
    expect(ids).toContain('P6-GEO-02');
    expect(ids).toContain('P6-GEO-03');
  });

  // -------------------------------------------------------------------------
  // P6-GEO-01: Angles in Parallel Lines
  // -------------------------------------------------------------------------

  describe('P6-GEO-01: Angles in Parallel Lines', () => {
    it('generates corresponding angle questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-GEO-01', { questionFamilyId: 'QF_P6-GEO-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P6-GEO-01');
        expect(q.answerType).toBe('number');
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(q.answer).toBeLessThanOrEqual(179);
        expect(q.prompt.length).toBeGreaterThan(0);
        expect(q.solutionText.length).toBeGreaterThan(0);
        expect(q.misconceptionTraps.length).toBeGreaterThan(0);
      }
    });

    it('generates alternate angle questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-GEO-01', { questionFamilyId: 'QF_P6-GEO-01_002' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('number');
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(q.answer).toBeLessThanOrEqual(179);
      }
    });

    it('generates co-interior angle questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-GEO-01', { questionFamilyId: 'QF_P6-GEO-01_003' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('number');
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(q.answer).toBeLessThanOrEqual(179);
        // Co-interior: given + answer = 180
        const givenMatch = q.prompt.match(/(\d+)°/);
        if (givenMatch) {
          const given = parseInt(givenMatch[1], 10);
          expect(given + q.answer).toBe(180);
        }
      }
    });
  });

  // -------------------------------------------------------------------------
  // P6-GEO-02: Angle Properties of Quadrilaterals
  // -------------------------------------------------------------------------

  describe('P6-GEO-02: Angle Properties of Quadrilaterals', () => {
    it('generates parallelogram opposite angle questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-GEO-02', { questionFamilyId: 'QF_P6-GEO-02_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P6-GEO-02');
        expect(q.answerType).toBe('number');
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(q.answer).toBeLessThanOrEqual(179);
        // Opposite angle equals the given angle
        const givenMatch = q.prompt.match(/= (\d+)°/);
        if (givenMatch) {
          expect(q.answer).toBe(parseInt(givenMatch[1], 10));
        }
      }
    });

    it('generates parallelogram adjacent angle questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-GEO-02', { questionFamilyId: 'QF_P6-GEO-02_002' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('number');
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(q.answer).toBeLessThanOrEqual(179);
        // Adjacent angle: given + answer = 180
        const givenMatch = q.prompt.match(/= (\d+)°/);
        if (givenMatch) {
          expect(parseInt(givenMatch[1], 10) + q.answer).toBe(180);
        }
      }
    });

    it('generates trapezium angle sum questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-GEO-02', { questionFamilyId: 'QF_P6-GEO-02_003' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('number');
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(q.answer).toBeLessThanOrEqual(179);
        // Sum of all given angles + answer = 360
        const angleMatches = q.prompt.match(/(\d+)°/g);
        if (angleMatches) {
          const givenAngles = angleMatches.map((m) => parseInt(m, 10));
          const sum = givenAngles.reduce((a, b) => a + b, 0) + q.answer;
          expect(sum).toBe(360);
        }
      }
    });
  });

  // -------------------------------------------------------------------------
  // P6-GEO-03: Finding Unknown Angles in Figures
  // -------------------------------------------------------------------------

  describe('P6-GEO-03: Finding Unknown Angles in Figures', () => {
    it('generates isosceles + parallelogram questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-GEO-03', { questionFamilyId: 'QF_P6-GEO-03_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P6-GEO-03');
        expect(q.answerType).toBe('number');
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(q.answer).toBeLessThanOrEqual(359);
        // Verify the math: vertex angle -> base angle -> answer = 180 - base
        const vertexMatch = q.prompt.match(/= (\d+)°/);
        if (vertexMatch) {
          const vertex = parseInt(vertexMatch[1], 10);
          const baseAngle = (180 - vertex) / 2;
          expect(q.answer).toBe(180 - baseAngle);
        }
      }
    });

    it('generates angles on line + vertically opposite questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-GEO-03', { questionFamilyId: 'QF_P6-GEO-03_002' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('number');
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(q.answer).toBeLessThanOrEqual(179);
        // AOC + COE = answer (vertically opposite to BOF)
        const matches = q.prompt.match(/(\d+)°/g);
        if (matches && matches.length >= 2) {
          const aoc = parseInt(matches[0], 10);
          const coe = parseInt(matches[1], 10);
          expect(q.answer).toBe(aoc + coe);
        }
      }
    });

    it('generates triangle exterior angle questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-GEO-03', { questionFamilyId: 'QF_P6-GEO-03_003' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('number');
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(q.answer).toBeLessThanOrEqual(179);
        // Exterior angle = sum of two remote interior angles
        const matches = q.prompt.match(/(\d+)°/g);
        if (matches && matches.length >= 2) {
          const a1 = parseInt(matches[0], 10);
          const a2 = parseInt(matches[1], 10);
          expect(q.answer).toBe(a1 + a2);
        }
      }
    });
  });

  // -------------------------------------------------------------------------
  // Utility functions
  // -------------------------------------------------------------------------

  describe('generateQuestionSet', () => {
    it('returns the requested number of questions', () => {
      const set = generateQuestionSet('P6-GEO-01', 5);
      expect(set).toHaveLength(5);
    });

    it('returns questions for each skill', () => {
      for (const skillId of getSupportedSkillIds()) {
        const set = generateQuestionSet(skillId, 3);
        expect(set).toHaveLength(3);
        for (const q of set) {
          expect(q.skillId).toBe(skillId);
        }
      }
    });
  });

  describe('generateDiagnosticSet', () => {
    it('generates questions across all skills', () => {
      const set = generateDiagnosticSet(['P6-GEO-01', 'P6-GEO-02', 'P6-GEO-03'], 3);
      expect(set).toHaveLength(9);
      const skillIds = new Set(set.map((q) => q.skillId));
      expect(skillIds.size).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  // Cross-cutting checks
  // -------------------------------------------------------------------------

  it('returns null for unknown skill', () => {
    expect(generateQuestion('FAKE')).toBeNull();
  });

  it('every question has a unique questionId', () => {
    const ids = new Set();
    for (let i = 0; i < 30; i++) {
      const skillId = pick(['P6-GEO-01', 'P6-GEO-02', 'P6-GEO-03']);
      const q = generateQuestion(skillId);
      expect(ids.has(q.questionId)).toBe(false);
      ids.add(q.questionId);
    }
  });

  it('every question has misconceptionTraps and solutionText', () => {
    for (let i = 0; i < 30; i++) {
      const skillId = pick(['P6-GEO-01', 'P6-GEO-02', 'P6-GEO-03']);
      const q = generateQuestion(skillId);
      expect(q.misconceptionTraps.length).toBeGreaterThan(0);
      expect(q.solutionText.length).toBeGreaterThan(0);
    }
  });

  it('all answers are positive integers between 1 and 359', () => {
    for (let i = 0; i < 50; i++) {
      const skillId = pick(['P6-GEO-01', 'P6-GEO-02', 'P6-GEO-03']);
      const q = generateQuestion(skillId);
      expect(Number.isInteger(q.answer)).toBe(true);
      expect(q.answer).toBeGreaterThanOrEqual(1);
      expect(q.answer).toBeLessThanOrEqual(359);
    }
  });

  it('all answers have answerType number', () => {
    for (let i = 0; i < 30; i++) {
      const skillId = pick(['P6-GEO-01', 'P6-GEO-02', 'P6-GEO-03']);
      const q = generateQuestion(skillId);
      expect(q.answerType).toBe('number');
    }
  });
});

// Helper used in cross-cutting tests
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
