import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getSupportedSkillIds,
} from './p2MulDivQuestionGenerator.js';
import { validateP2MulDivSkillGraph, p2MulDivSkillGraph } from './p2MulDivSkillGraph.js';
import { validateP2MulDivQuestionFamilies } from './p2MulDivQuestionFamilies.js';

// ---------------------------------------------------------------------------
// Skill graph validation
// ---------------------------------------------------------------------------

describe('p2MulDivSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP2MulDivSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains all 2 P2-MD skills', () => {
    expect(p2MulDivSkillGraph.skills).toHaveLength(2);
  });

  it('has correct skill IDs', () => {
    const ids = p2MulDivSkillGraph.skillIds;
    expect(ids).toContain('P2-MD-01');
    expect(ids).toContain('P2-MD-02');
  });

  it('P2-MD-02 depends on P2-MD-01', () => {
    const md02 = p2MulDivSkillGraph.skills.find((s) => s.id === 'P2-MD-02');
    expect(md02.prerequisites).toContain('P2-MD-01');
  });
});

// ---------------------------------------------------------------------------
// Question families validation
// ---------------------------------------------------------------------------

describe('p2MulDivQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP2MulDivQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.totalQuestionFamilies).toBe(6);
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Generator: skill coverage
// ---------------------------------------------------------------------------

describe('p2MulDivQuestionGenerator', () => {
  it('supports all 2 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(2);
    expect(ids).toContain('P2-MD-01');
    expect(ids).toContain('P2-MD-02');
  });

  // -------------------------------------------------------------------------
  // P2-MD-01: Multiplication Tables (2, 3, 4, 5, 10)
  // -------------------------------------------------------------------------

  describe('P2-MD-01: Multiplication Tables', () => {
    it('generates straight multiplication questions (_001)', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P2-MD-01', { questionFamilyId: 'QF_P2-MD-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P2-MD-01');
        expect(q.answerType).toBe('number');
        // Verify answer is correct: prompt is "a x b = ?"
        const match = q.prompt.match(/(\d+) x (\d+) = \?/);
        expect(match).not.toBeNull();
        const a = Number(match[1]);
        const b = Number(match[2]);
        expect([2, 3, 4, 5, 10]).toContain(a);
        expect(b).toBeGreaterThanOrEqual(1);
        expect(b).toBeLessThanOrEqual(10);
        expect(q.answer).toBe(a * b);
        expect(q.answer).toBeLessThanOrEqual(100);
      }
    });

    it('generates commutative form questions (_002)', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P2-MD-01', { questionFamilyId: 'QF_P2-MD-01_002' });
        expect(q).not.toBeNull();
        const match = q.prompt.match(/(\d+) x (\d+) = \?/);
        expect(match).not.toBeNull();
        const a = Number(match[1]);
        const b = Number(match[2]);
        // In commutative form, b is the table number
        expect([2, 3, 4, 5, 10]).toContain(b);
        expect(a).toBeGreaterThanOrEqual(1);
        expect(a).toBeLessThanOrEqual(10);
        expect(q.answer).toBe(a * b);
      }
    });

    it('generates missing factor MCQ questions (_003)', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P2-MD-01', { questionFamilyId: 'QF_P2-MD-01_003' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('?');
        expect(q.answerType).toBe('mcq');
        expect(q.choices).toBeDefined();
        expect(q.choices).toHaveLength(4);
        expect(q.choices).toContain(q.answer);
        // Answer should be a valid factor (1-10)
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(q.answer).toBeLessThanOrEqual(10);
        // Choices should be sorted
        for (let j = 1; j < q.choices.length; j++) {
          expect(q.choices[j]).toBeGreaterThanOrEqual(q.choices[j - 1]);
        }
      }
    });

    it('only uses tables 2, 3, 4, 5, 10 and factors 1-10', () => {
      const seenTables = new Set();
      for (let i = 0; i < 100; i++) {
        const q = generateQuestion('P2-MD-01', { questionFamilyId: 'QF_P2-MD-01_001' });
        const match = q.prompt.match(/(\d+) x (\d+) = \?/);
        seenTables.add(Number(match[1]));
        expect(Number(match[2])).toBeLessThanOrEqual(10);
      }
      // Should only see allowed tables
      for (const t of seenTables) {
        expect([2, 3, 4, 5, 10]).toContain(t);
      }
    });

    it('product never exceeds 100', () => {
      for (let i = 0; i < 100; i++) {
        const q = generateQuestion('P2-MD-01');
        expect(q.answer).toBeLessThanOrEqual(100);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P2-MD-02: Dividing Within the Tables
  // -------------------------------------------------------------------------

  describe('P2-MD-02: Dividing Within the Tables', () => {
    it('generates straight division questions (_001)', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P2-MD-02', { questionFamilyId: 'QF_P2-MD-02_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P2-MD-02');
        expect(q.answerType).toBe('number');
        const match = q.prompt.match(/(\d+) \/ (\d+) = \?/);
        expect(match).not.toBeNull();
        const dividend = Number(match[1]);
        const divisor = Number(match[2]);
        expect([2, 3, 4, 5, 10]).toContain(divisor);
        expect(dividend % divisor).toBe(0);
        expect(q.answer).toBe(dividend / divisor);
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(q.answer).toBeLessThanOrEqual(10);
      }
    });

    it('generates word-context sharing questions (_002)', () => {
      const validNames = ['Ali', 'Ben', 'Mei', 'Siti', 'Raj', 'Tom', 'Lily', 'Sarah', 'John', 'Mary'];
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P2-MD-02', { questionFamilyId: 'QF_P2-MD-02_002' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P2-MD-02');
        expect(q.prompt).toContain('shared equally among');
        expect(q.prompt).toContain('friends');
        // Should contain a valid Singapore name
        const hasName = validNames.some((n) => q.prompt.includes(n));
        expect(hasName).toBe(true);
        // Answer should be a valid quotient
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(q.answer).toBeLessThanOrEqual(10);
      }
    });

    it('generates missing dividend questions (_003)', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P2-MD-02', { questionFamilyId: 'QF_P2-MD-02_003' });
        expect(q).not.toBeNull();
        expect(q.prompt).toMatch(/\? \/ \d+ = \d+/);
        // Answer is the dividend = divisor x quotient
        const match = q.prompt.match(/\? \/ (\d+) = (\d+)/);
        expect(match).not.toBeNull();
        const divisor = Number(match[1]);
        const quotient = Number(match[2]);
        expect(q.answer).toBe(divisor * quotient);
        expect(q.answer).toBeLessThanOrEqual(100);
      }
    });

    it('only uses divisors 2, 3, 4, 5, 10', () => {
      const seenDivisors = new Set();
      for (let i = 0; i < 100; i++) {
        const q = generateQuestion('P2-MD-02', { questionFamilyId: 'QF_P2-MD-02_001' });
        const match = q.prompt.match(/(\d+) \/ (\d+) = \?/);
        seenDivisors.add(Number(match[2]));
      }
      for (const d of seenDivisors) {
        expect([2, 3, 4, 5, 10]).toContain(d);
      }
    });
  });

  // -------------------------------------------------------------------------
  // generateQuestionSet
  // -------------------------------------------------------------------------

  describe('generateQuestionSet', () => {
    it('returns the requested number of questions', () => {
      const set = generateQuestionSet('P2-MD-01', 5);
      expect(set).toHaveLength(5);
      set.forEach((q) => expect(q.skillId).toBe('P2-MD-01'));
    });

    it('defaults to 5 questions', () => {
      const set = generateQuestionSet('P2-MD-02');
      expect(set).toHaveLength(5);
    });

    it('handles large sets', () => {
      const set = generateQuestionSet('P2-MD-01', 50);
      expect(set).toHaveLength(50);
    });
  });

  // -------------------------------------------------------------------------
  // generateDiagnosticSet
  // -------------------------------------------------------------------------

  describe('generateDiagnosticSet', () => {
    it('generates questions across all skills', () => {
      const skillIds = ['P2-MD-01', 'P2-MD-02'];
      const set = generateDiagnosticSet(skillIds, 3);
      expect(set).toHaveLength(6);
      const ids = new Set(set.map((q) => q.skillId));
      expect(ids.size).toBe(2);
    });

    it('defaults to 3 questions per skill', () => {
      const set = generateDiagnosticSet(['P2-MD-01']);
      expect(set).toHaveLength(3);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases and cross-cutting concerns
  // -------------------------------------------------------------------------

  it('returns null for unknown skill', () => {
    expect(generateQuestion('FAKE-SKILL')).toBeNull();
    expect(generateQuestion('P2-MD-99')).toBeNull();
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
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion(skillId);
        expect(q.difficulty).toBeDefined();
        expect(q.difficulty).toBeGreaterThanOrEqual(1);
        expect(q.fluencyTargetSeconds).toBeDefined();
        expect(q.fluencyTargetSeconds).toBeGreaterThan(0);
      }
    }
  });

  it('every question has a valid questionFamilyId', () => {
    const validFamilyIds = [
      'QF_P2-MD-01_001', 'QF_P2-MD-01_002', 'QF_P2-MD-01_003',
      'QF_P2-MD-02_001', 'QF_P2-MD-02_002', 'QF_P2-MD-02_003',
    ];
    for (const skillId of getSupportedSkillIds()) {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion(skillId);
        expect(validFamilyIds).toContain(q.questionFamilyId);
      }
    }
  });
});
