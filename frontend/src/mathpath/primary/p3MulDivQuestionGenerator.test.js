import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getSupportedSkillIds,
} from './p3MulDivQuestionGenerator.js';
import { validateP3MulDivSkillGraph, p3MulDivSkillGraph } from './p3MulDivSkillGraph.js';
import { validateP3MulDivQuestionFamilies } from './p3MulDivQuestionFamilies.js';

// ---------------------------------------------------------------------------
// Skill graph validation
// ---------------------------------------------------------------------------

describe('p3MulDivSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP3MulDivSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains all 5 P3-MD skills', () => {
    expect(p3MulDivSkillGraph.skills).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// Question families validation
// ---------------------------------------------------------------------------

describe('p3MulDivQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP3MulDivQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.totalQuestionFamilies).toBe(15);
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Generator: skill coverage
// ---------------------------------------------------------------------------

describe('p3MulDivQuestionGenerator', () => {
  it('supports all 5 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(5);
    expect(ids).toContain('P3-MD-01');
    expect(ids).toContain('P3-MD-02');
    expect(ids).toContain('P3-MD-03');
    expect(ids).toContain('P3-MD-04');
    expect(ids).toContain('P3-MD-05');
  });

  // -------------------------------------------------------------------------
  // P3-MD-01: Multiplication Tables (6, 7, 8, 9)
  // -------------------------------------------------------------------------

  describe('P3-MD-01: Multiplication Tables', () => {
    it('generates table fact questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MD-01', { questionFamilyId: 'QF_P3-MD-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P3-MD-01');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(6);
        expect(q.answer).toBeLessThanOrEqual(90);
        // Verify answer is correct: prompt is "a x b = ?"
        const match = q.prompt.match(/(\d+) x (\d+) = \?/);
        expect(match).not.toBeNull();
        expect(q.answer).toBe(Number(match[1]) * Number(match[2]));
      }
    });

    it('generates commutative fact questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MD-01', { questionFamilyId: 'QF_P3-MD-01_002' });
        expect(q).not.toBeNull();
        const match = q.prompt.match(/(\d+) x (\d+) = \?/);
        expect(match).not.toBeNull();
        expect(q.answer).toBe(Number(match[1]) * Number(match[2]));
      }
    });

    it('generates missing factor questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MD-01', { questionFamilyId: 'QF_P3-MD-01_003' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('?');
        // Answer should be a valid single factor (1-10 or 6-9)
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(q.answer).toBeLessThanOrEqual(10);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P3-MD-02: Dividing Within the Tables
  // -------------------------------------------------------------------------

  describe('P3-MD-02: Dividing Within the Tables', () => {
    it('generates exact division questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MD-02', { questionFamilyId: 'QF_P3-MD-02_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P3-MD-02');
        expect(q.answerType).toBe('number');
        const match = q.prompt.match(/(\d+) \/ (\d+) = \?/);
        expect(match).not.toBeNull();
        const dividend = Number(match[1]);
        const divisor = Number(match[2]);
        expect(dividend % divisor).toBe(0);
        expect(q.answer).toBe(dividend / divisor);
      }
    });

    it('generates missing factor division questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MD-02', { questionFamilyId: 'QF_P3-MD-02_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('Think');
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(q.answer).toBeLessThanOrEqual(10);
      }
    });

    it('generates related facts questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MD-02', { questionFamilyId: 'QF_P3-MD-02_003' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('So');
        // The answer should divide the dividend evenly
        const divMatch = q.prompt.match(/(\d+) \/ (\d+) = \?/);
        if (divMatch) {
          expect(Number(divMatch[1]) / Number(divMatch[2])).toBe(q.answer);
        }
      }
    });
  });

  // -------------------------------------------------------------------------
  // P3-MD-03: Division with Remainder
  // -------------------------------------------------------------------------

  describe('P3-MD-03: Division with Remainder', () => {
    it('generates small-divisor remainder questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MD-03', { questionFamilyId: 'QF_P3-MD-03_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P3-MD-03');
        expect(q.answerType).toBe('number');
        // The answer is the remainder, must be < divisor
        const divMatch = q.prompt.match(/(\d+) \/ (\d+)/);
        expect(divMatch).not.toBeNull();
        const dividend = Number(divMatch[1]);
        const divisor = Number(divMatch[2]);
        expect([3, 4, 5]).toContain(divisor);
        expect(q.answer).toBe(dividend % divisor);
        expect(q.answer).toBeLessThan(divisor);
        expect(q.answer).toBeGreaterThan(0);
      }
    });

    it('generates larger-divisor remainder questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MD-03', { questionFamilyId: 'QF_P3-MD-03_002' });
        expect(q).not.toBeNull();
        const divMatch = q.prompt.match(/(\d+) \/ (\d+)/);
        const dividend = Number(divMatch[1]);
        const divisor = Number(divMatch[2]);
        expect([6, 7, 8, 9]).toContain(divisor);
        expect(q.answer).toBe(dividend % divisor);
        expect(q.answer).toBeLessThan(divisor);
      }
    });

    it('generates quotient questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MD-03', { questionFamilyId: 'QF_P3-MD-03_003' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('quotient');
        const divMatch = q.prompt.match(/(\d+) \/ (\d+)/);
        const dividend = Number(divMatch[1]);
        const divisor = Number(divMatch[2]);
        expect(q.answer).toBe(Math.floor(dividend / divisor));
      }
    });
  });

  // -------------------------------------------------------------------------
  // P3-MD-04: Multiply up to 3-digit by 1-digit
  // -------------------------------------------------------------------------

  describe('P3-MD-04: Long Multiplication', () => {
    it('generates no-carry multiplication (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MD-04', { questionFamilyId: 'QF_P3-MD-04_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P3-MD-04');
        const match = q.prompt.match(/(\d+) x (\d+) = \?/);
        expect(match).not.toBeNull();
        const a = Number(match[1]);
        const b = Number(match[2]);
        expect(a).toBeGreaterThanOrEqual(11);
        expect(b).toBeGreaterThanOrEqual(2);
        expect(q.answer).toBe(a * b);
      }
    });

    it('generates carry multiplication (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MD-04', { questionFamilyId: 'QF_P3-MD-04_002' });
        expect(q).not.toBeNull();
        const match = q.prompt.match(/(\d+) x (\d+) = \?/);
        const a = Number(match[1]);
        const b = Number(match[2]);
        // ones digit product should require carry
        expect((a % 10) * b).toBeGreaterThanOrEqual(10);
        expect(q.answer).toBe(a * b);
      }
    });

    it('generates 3-digit multiplication (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MD-04', { questionFamilyId: 'QF_P3-MD-04_003' });
        expect(q).not.toBeNull();
        const match = q.prompt.match(/(\d+) x (\d+) = \?/);
        const a = Number(match[1]);
        const b = Number(match[2]);
        expect(a).toBeGreaterThanOrEqual(100);
        expect(a).toBeLessThanOrEqual(399);
        expect(b).toBeGreaterThanOrEqual(2);
        expect(b).toBeLessThanOrEqual(9);
        expect(q.answer).toBe(a * b);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P3-MD-05: Divide up to 3-digit by 1-digit
  // -------------------------------------------------------------------------

  describe('P3-MD-05: Long Division', () => {
    it('generates 2-digit exact division (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MD-05', { questionFamilyId: 'QF_P3-MD-05_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P3-MD-05');
        const match = q.prompt.match(/(\d+) \/ (\d+) = \?/);
        const dividend = Number(match[1]);
        const divisor = Number(match[2]);
        expect(dividend).toBeLessThanOrEqual(99 * 9);
        expect(divisor).toBeGreaterThanOrEqual(2);
        expect(divisor).toBeLessThanOrEqual(9);
        expect(dividend % divisor).toBe(0);
        expect(q.answer).toBe(dividend / divisor);
      }
    });

    it('generates 3-digit exact division (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MD-05', { questionFamilyId: 'QF_P3-MD-05_002' });
        expect(q).not.toBeNull();
        const match = q.prompt.match(/(\d+) \/ (\d+) = \?/);
        const dividend = Number(match[1]);
        const divisor = Number(match[2]);
        expect(dividend).toBeGreaterThanOrEqual(100);
        expect(dividend).toBeLessThanOrEqual(999);
        expect(dividend % divisor).toBe(0);
        expect(q.answer).toBe(dividend / divisor);
        // quotient should not contain zero
        expect(String(q.answer)).not.toContain('0');
      }
    });

    it('generates zero-in-quotient division (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MD-05', { questionFamilyId: 'QF_P3-MD-05_003' });
        expect(q).not.toBeNull();
        const match = q.prompt.match(/(\d+) \/ (\d+) = \?/);
        const dividend = Number(match[1]);
        const divisor = Number(match[2]);
        expect(dividend % divisor).toBe(0);
        expect(q.answer).toBe(dividend / divisor);
        // quotient should have a zero in the tens place
        expect(String(q.answer)[1]).toBe('0');
      }
    });
  });

  // -------------------------------------------------------------------------
  // generateQuestionSet
  // -------------------------------------------------------------------------

  describe('generateQuestionSet', () => {
    it('returns the requested number of questions', () => {
      const set = generateQuestionSet('P3-MD-01', 5);
      expect(set).toHaveLength(5);
      set.forEach((q) => expect(q.skillId).toBe('P3-MD-01'));
    });

    it('defaults to 5 questions', () => {
      const set = generateQuestionSet('P3-MD-03');
      expect(set).toHaveLength(5);
    });
  });

  // -------------------------------------------------------------------------
  // generateDiagnosticSet
  // -------------------------------------------------------------------------

  describe('generateDiagnosticSet', () => {
    it('generates questions across all skills', () => {
      const skillIds = ['P3-MD-01', 'P3-MD-02', 'P3-MD-03', 'P3-MD-04', 'P3-MD-05'];
      const set = generateDiagnosticSet(skillIds, 2);
      expect(set).toHaveLength(10);
      const ids = new Set(set.map((q) => q.skillId));
      expect(ids.size).toBe(5);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases and cross-cutting concerns
  // -------------------------------------------------------------------------

  it('returns null for unknown skill', () => {
    expect(generateQuestion('FAKE-SKILL')).toBeNull();
    expect(generateQuestion('P3-MD-99')).toBeNull();
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
