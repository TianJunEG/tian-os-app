import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getSupportedSkillIds,
} from './p4FourOpsQuestionGenerator.js';
import { validateP4FourOpsSkillGraph, p4FourOpsSkillGraph } from './p4FourOpsSkillGraph.js';
import { validateP4FourOpsQuestionFamilies } from './p4FourOpsQuestionFamilies.js';

// ---------------------------------------------------------------------------
// Skill graph validation
// ---------------------------------------------------------------------------

describe('p4FourOpsSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP4FourOpsSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains 3 skills', () => {
    expect(p4FourOpsSkillGraph.skills).toHaveLength(3);
  });

  it('has correct domain metadata', () => {
    expect(p4FourOpsSkillGraph.domainId).toBe('p4-four-ops');
    expect(p4FourOpsSkillGraph.domainName).toBe('Primary 4 Four Operations');
  });
});

// ---------------------------------------------------------------------------
// Question families validation
// ---------------------------------------------------------------------------

describe('p4FourOpsQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP4FourOpsQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.totalQuestionFamilies).toBe(7);
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Generator: skill coverage
// ---------------------------------------------------------------------------

describe('p4FourOpsQuestionGenerator', () => {
  it('supports all 3 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(3);
    expect(ids).toContain('P4-FO-01');
    expect(ids).toContain('P4-FO-02');
    expect(ids).toContain('P4-FO-03');
  });

  // -------------------------------------------------------------------------
  // P4-FO-01: Multiply up to 4-digit by 1-digit
  // -------------------------------------------------------------------------

  describe('P4-FO-01: Multiply 4-digit by 1-digit', () => {
    it('generates standard multiplication questions (_001)', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P4-FO-01', { questionFamilyId: 'QF_P4-FO-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P4-FO-01');
        expect(q.answerType).toBe('number');
        const match = q.prompt.match(/(\d+) x (\d+) = \?/);
        expect(match).not.toBeNull();
        const a = Number(match[1]);
        const b = Number(match[2]);
        expect(a).toBeGreaterThanOrEqual(1000);
        expect(a).toBeLessThanOrEqual(9999);
        expect(b).toBeGreaterThanOrEqual(2);
        expect(b).toBeLessThanOrEqual(9);
        expect(q.answer).toBe(a * b);
      }
    });

    it('generates word context questions (_002)', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P4-FO-01', { questionFamilyId: 'QF_P4-FO-01_002' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P4-FO-01');
        expect(q.answerType).toBe('number');
        // Answer should be a product of a 4-digit and 1-digit number
        expect(q.answer).toBeGreaterThanOrEqual(1000 * 2);
        expect(q.answer).toBeLessThanOrEqual(9999 * 9);
        expect(q.solutionText.length).toBeGreaterThan(0);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P4-FO-02: Multiply up to 3-digit by 2-digit
  // -------------------------------------------------------------------------

  describe('P4-FO-02: Multiply 3-digit by 2-digit', () => {
    it('generates standard multiplication questions (_001)', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P4-FO-02', { questionFamilyId: 'QF_P4-FO-02_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P4-FO-02');
        expect(q.answerType).toBe('number');
        const match = q.prompt.match(/(\d+) x (\d+) = \?/);
        expect(match).not.toBeNull();
        const a = Number(match[1]);
        const b = Number(match[2]);
        expect(a).toBeGreaterThanOrEqual(100);
        expect(a).toBeLessThanOrEqual(999);
        expect(b).toBeGreaterThanOrEqual(11);
        expect(b).toBeLessThanOrEqual(99);
        expect(q.answer).toBe(a * b);
      }
    });

    it('generates word context questions (_002)', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P4-FO-02', { questionFamilyId: 'QF_P4-FO-02_002' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P4-FO-02');
        expect(q.answer).toBeGreaterThanOrEqual(100 * 11);
        expect(q.answer).toBeLessThanOrEqual(999 * 99);
        expect(q.solutionText.length).toBeGreaterThan(0);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P4-FO-03: Divide up to 4-digit by 1-digit
  // -------------------------------------------------------------------------

  describe('P4-FO-03: Divide 4-digit by 1-digit', () => {
    it('generates exact division questions (_001)', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P4-FO-03', { questionFamilyId: 'QF_P4-FO-03_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P4-FO-03');
        expect(q.answerType).toBe('number');
        const match = q.prompt.match(/(\d+) \/ (\d+) = \?/);
        expect(match).not.toBeNull();
        const dividend = Number(match[1]);
        const divisor = Number(match[2]);
        expect(divisor).toBeGreaterThanOrEqual(2);
        expect(divisor).toBeLessThanOrEqual(9);
        expect(dividend % divisor).toBe(0);
        expect(q.answer).toBe(dividend / divisor);
        expect(q.answer).toBeGreaterThanOrEqual(111);
        expect(q.answer).toBeLessThanOrEqual(1500);
      }
    });

    it('generates division with remainder questions (_002)', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P4-FO-03', { questionFamilyId: 'QF_P4-FO-03_002' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P4-FO-03');
        const match = q.prompt.match(/(\d+) \/ (\d+)/);
        expect(match).not.toBeNull();
        const dividend = Number(match[1]);
        const divisor = Number(match[2]);
        expect(divisor).toBeGreaterThanOrEqual(2);
        expect(divisor).toBeLessThanOrEqual(9);
        // Answer is the remainder
        const remainder = dividend % divisor;
        expect(q.answer).toBe(remainder);
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(q.answer).toBeLessThan(divisor);
        // Verify dividend is within range
        expect(dividend).toBeLessThanOrEqual(9999);
      }
    });

    it('generates word context division questions (_003)', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P4-FO-03', { questionFamilyId: 'QF_P4-FO-03_003' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P4-FO-03');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.solutionText.length).toBeGreaterThan(0);
      }
    });
  });

  // -------------------------------------------------------------------------
  // generateQuestionSet
  // -------------------------------------------------------------------------

  describe('generateQuestionSet', () => {
    it('returns the requested number of questions', () => {
      const set = generateQuestionSet('P4-FO-01', 5);
      expect(set).toHaveLength(5);
      set.forEach((q) => expect(q.skillId).toBe('P4-FO-01'));
    });

    it('defaults to 5 questions', () => {
      const set = generateQuestionSet('P4-FO-03');
      expect(set).toHaveLength(5);
    });
  });

  // -------------------------------------------------------------------------
  // generateDiagnosticSet
  // -------------------------------------------------------------------------

  describe('generateDiagnosticSet', () => {
    it('generates questions across all skills', () => {
      const skillIds = ['P4-FO-01', 'P4-FO-02', 'P4-FO-03'];
      const set = generateDiagnosticSet(skillIds, 2);
      expect(set).toHaveLength(6);
      const ids = new Set(set.map((q) => q.skillId));
      expect(ids.size).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases and cross-cutting concerns
  // -------------------------------------------------------------------------

  it('returns null for unknown skill', () => {
    expect(generateQuestion('FAKE-SKILL')).toBeNull();
    expect(generateQuestion('P4-FO-99')).toBeNull();
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

  it('every question has fluencyTargetSeconds and difficulty', () => {
    for (const skillId of getSupportedSkillIds()) {
      for (let i = 0; i < 3; i++) {
        const q = generateQuestion(skillId);
        expect(q.fluencyTargetSeconds).toBeGreaterThan(0);
        expect(q.difficulty).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
