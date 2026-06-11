import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getSupportedSkillIds,
} from './p4DecimalsQuestionGenerator.js';
import { validateP4DecimalsSkillGraph, p4DecimalsSkillGraph } from './p4DecimalsSkillGraph.js';
import { validateP4DecimalsQuestionFamilies } from './p4DecimalsQuestionFamilies.js';
import { getAllMisconceptions, getMisconceptionsForSkill, getRemediationForTag } from './p4DecimalsMisconceptionMap.js';

// ---------------------------------------------------------------------------
// Skill graph validation
// ---------------------------------------------------------------------------

describe('p4DecimalsSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP4DecimalsSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains 6 skills', () => {
    expect(p4DecimalsSkillGraph.skills).toHaveLength(6);
  });

  it('all skill IDs follow P4-DEC-XX format', () => {
    for (const skill of p4DecimalsSkillGraph.skills) {
      expect(skill.id).toMatch(/^P4-DEC-0[1-6]$/);
    }
  });
});

// ---------------------------------------------------------------------------
// Question families validation
// ---------------------------------------------------------------------------

describe('p4DecimalsQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP4DecimalsQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('has 14 total question families', () => {
    const result = validateP4DecimalsQuestionFamilies();
    expect(result.totalQuestionFamilies).toBe(14);
  });

  it('every skill has at least 2 families', () => {
    const result = validateP4DecimalsQuestionFamilies();
    for (const [skillId, count] of Object.entries(result.familiesPerSkill)) {
      expect(count, `${skillId} should have >= 2 families`).toBeGreaterThanOrEqual(2);
    }
  });
});

// ---------------------------------------------------------------------------
// Misconception map
// ---------------------------------------------------------------------------

describe('p4DecimalsMisconceptionMap', () => {
  it('has 5 misconceptions', () => {
    expect(getAllMisconceptions()).toHaveLength(5);
  });

  it('every misconception has remediation', () => {
    for (const m of getAllMisconceptions()) {
      const rem = getRemediationForTag(m.tag);
      expect(rem).not.toBeNull();
      expect(rem.explanation.length).toBeGreaterThan(0);
      expect(rem.parentNote.length).toBeGreaterThan(0);
    }
  });

  it('returns misconceptions for each skill', () => {
    for (const skill of p4DecimalsSkillGraph.skills) {
      const ms = getMisconceptionsForSkill(skill.id);
      expect(ms.length, `${skill.id} should have misconceptions`).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Question generator
// ---------------------------------------------------------------------------

describe('p4DecimalsQuestionGenerator', () => {
  it('supports 6 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(6);
    expect(ids).toContain('P4-DEC-01');
    expect(ids).toContain('P4-DEC-02');
    expect(ids).toContain('P4-DEC-03');
    expect(ids).toContain('P4-DEC-04');
    expect(ids).toContain('P4-DEC-05');
    expect(ids).toContain('P4-DEC-06');
  });

  // -------------------------------------------------------------------------
  // P4-DEC-01: Decimal Place Value
  // -------------------------------------------------------------------------

  describe('P4-DEC-01: Decimal Place Value', () => {
    it('generates words-to-decimal questions (_001)', () => {
      for (let i = 0; i < 15; i++) {
        const q = generateQuestion('P4-DEC-01', { questionFamilyId: 'QF_P4-DEC-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P4-DEC-01');
        expect(q.answerType).toBe('text');
        expect(q.prompt).toContain('Write');
        expect(parseFloat(q.answer)).not.toBeNaN();
      }
    });

    it('generates value-of-digit questions (_002)', () => {
      for (let i = 0; i < 15; i++) {
        const q = generateQuestion('P4-DEC-01', { questionFamilyId: 'QF_P4-DEC-01_002' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(1);
        expect(q.prompt).toContain('value');
      }
    });
  });

  // -------------------------------------------------------------------------
  // P4-DEC-02: Comparing Decimals
  // -------------------------------------------------------------------------

  describe('P4-DEC-02: Comparing Decimals', () => {
    it('generates which-is-greater questions (_001)', () => {
      for (let i = 0; i < 15; i++) {
        const q = generateQuestion('P4-DEC-02', { questionFamilyId: 'QF_P4-DEC-02_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P4-DEC-02');
        expect(q.answerType).toBe('text');
        expect(q.prompt).toContain('greater');
        const ansNum = parseFloat(q.answer);
        expect(ansNum).not.toBeNaN();
      }
    });

    it('generates order-ascending questions (_002)', () => {
      for (let i = 0; i < 15; i++) {
        const q = generateQuestion('P4-DEC-02', { questionFamilyId: 'QF_P4-DEC-02_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('ascending');
        // Answer should be comma-separated numbers in ascending order
        const nums = q.answer.split(', ').map(Number);
        for (let j = 1; j < nums.length; j++) {
          expect(nums[j]).toBeGreaterThan(nums[j - 1]);
        }
      }
    });
  });

  // -------------------------------------------------------------------------
  // P4-DEC-03: Rounding Decimals
  // -------------------------------------------------------------------------

  describe('P4-DEC-03: Rounding Decimals', () => {
    it('generates round-to-whole questions (_001)', () => {
      for (let i = 0; i < 15; i++) {
        const q = generateQuestion('P4-DEC-03', { questionFamilyId: 'QF_P4-DEC-03_001' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('nearest whole number');
        expect(Number.isInteger(q.answer)).toBe(true);
      }
    });

    it('generates round-to-1dp questions (_002)', () => {
      for (let i = 0; i < 15; i++) {
        const q = generateQuestion('P4-DEC-03', { questionFamilyId: 'QF_P4-DEC-03_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('1 decimal place');
        // Answer should have at most 1dp
        const parts = String(q.answer).split('.');
        if (parts.length === 2) expect(parts[1].length).toBeLessThanOrEqual(1);
      }
    });

    it('generates round-to-2dp questions (_003)', () => {
      for (let i = 0; i < 15; i++) {
        const q = generateQuestion('P4-DEC-03', { questionFamilyId: 'QF_P4-DEC-03_003' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('2 decimal places');
        const parts = String(q.answer).split('.');
        if (parts.length === 2) expect(parts[1].length).toBeLessThanOrEqual(2);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P4-DEC-04: Adding & Subtracting Decimals
  // -------------------------------------------------------------------------

  describe('P4-DEC-04: Adding & Subtracting Decimals', () => {
    it('generates add-decimals questions (_001)', () => {
      for (let i = 0; i < 15; i++) {
        const q = generateQuestion('P4-DEC-04', { questionFamilyId: 'QF_P4-DEC-04_001' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('+');
        expect(typeof q.answer).toBe('number');
        // Verify no FP artefacts: answer should have at most 3dp
        const parts = String(q.answer).split('.');
        if (parts.length === 2) expect(parts[1].length).toBeLessThanOrEqual(3);
      }
    });

    it('add-decimal answers are correct (spot-check)', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P4-DEC-04', { questionFamilyId: 'QF_P4-DEC-04_001' });
        // Extract operands from prompt "Calculate A + B"
        const match = q.prompt.match(/Calculate ([\d.]+) \+ ([\d.]+)/);
        if (match) {
          const a = parseFloat(match[1]);
          const b = parseFloat(match[2]);
          expect(Math.abs(q.answer - (a + b))).toBeLessThan(0.002);
        }
      }
    });

    it('generates subtract-decimals questions (_002)', () => {
      for (let i = 0; i < 15; i++) {
        const q = generateQuestion('P4-DEC-04', { questionFamilyId: 'QF_P4-DEC-04_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('−');
        expect(q.answer).toBeGreaterThan(0);
      }
    });

    it('generates word-context questions (_003)', () => {
      for (let i = 0; i < 15; i++) {
        const q = generateQuestion('P4-DEC-04', { questionFamilyId: 'QF_P4-DEC-04_003' });
        expect(q).not.toBeNull();
        expect(typeof q.answer).toBe('number');
        expect(q.answer).toBeGreaterThan(0);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P4-DEC-05: Multiply/Divide Decimals by 1-digit
  // -------------------------------------------------------------------------

  describe('P4-DEC-05: Multiply/Divide Decimals by 1-digit', () => {
    it('generates multiply-decimal questions (_001)', () => {
      for (let i = 0; i < 15; i++) {
        const q = generateQuestion('P4-DEC-05', { questionFamilyId: 'QF_P4-DEC-05_001' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('×');
        expect(typeof q.answer).toBe('number');
        // Verify correctness
        const match = q.prompt.match(/Calculate ([\d.]+) × (\d+)/);
        if (match) {
          const dec = parseFloat(match[1]);
          const mul = parseInt(match[2], 10);
          expect(Math.abs(q.answer - dec * mul)).toBeLessThan(0.002);
        }
      }
    });

    it('generates divide-decimal questions (_002)', () => {
      for (let i = 0; i < 15; i++) {
        const q = generateQuestion('P4-DEC-05', { questionFamilyId: 'QF_P4-DEC-05_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('÷');
        expect(typeof q.answer).toBe('number');
        // Verify exact division
        const match = q.prompt.match(/Calculate ([\d.]+) ÷ (\d+)/);
        if (match) {
          const dividend = parseFloat(match[1]);
          const divisor = parseInt(match[2], 10);
          expect(Math.abs(q.answer - dividend / divisor)).toBeLessThan(0.002);
        }
      }
    });

    it('divide always yields clean decimals (no repeating)', () => {
      for (let i = 0; i < 30; i++) {
        const q = generateQuestion('P4-DEC-05', { questionFamilyId: 'QF_P4-DEC-05_002' });
        const parts = String(q.answer).split('.');
        if (parts.length === 2) expect(parts[1].length).toBeLessThanOrEqual(3);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P4-DEC-06: Fraction → Decimal
  // -------------------------------------------------------------------------

  describe('P4-DEC-06: Fraction to Decimal', () => {
    it('generates convert-fraction-to-decimal questions (_001)', () => {
      for (let i = 0; i < 15; i++) {
        const q = generateQuestion('P4-DEC-06', { questionFamilyId: 'QF_P4-DEC-06_001' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('/');
        expect(typeof q.answer).toBe('number');
        expect(q.answer).toBeGreaterThan(0);
        expect(q.answer).toBeLessThanOrEqual(1);
        // Verify correctness
        const match = q.prompt.match(/Express (\d+)\/(\d+)/);
        if (match) {
          const numer = parseInt(match[1], 10);
          const denom = parseInt(match[2], 10);
          expect(Math.abs(q.answer - numer / denom)).toBeLessThan(0.002);
        }
      }
    });

    it('generates match-fraction-to-decimal questions (_002)', () => {
      for (let i = 0; i < 15; i++) {
        const q = generateQuestion('P4-DEC-06', { questionFamilyId: 'QF_P4-DEC-06_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('Choices');
        expect(q.answerType).toBe('text');
        // The correct answer should appear in the choices
        expect(q.prompt).toContain(q.answer);
      }
    });

    it('fraction denominators are factors of 10 or 100', () => {
      const validDenoms = new Set([2, 4, 5, 10, 20, 25, 50, 100]);
      for (let i = 0; i < 30; i++) {
        const q = generateQuestion('P4-DEC-06', { questionFamilyId: 'QF_P4-DEC-06_001' });
        const match = q.prompt.match(/Express (\d+)\/(\d+)/);
        if (match) {
          const denom = parseInt(match[2], 10);
          expect(validDenoms.has(denom), `${denom} should be a valid denominator`).toBe(true);
        }
      }
    });
  });

  // -------------------------------------------------------------------------
  // Cross-cutting tests
  // -------------------------------------------------------------------------

  describe('generateQuestionSet', () => {
    it('returns the requested number of questions', () => {
      for (const skillId of getSupportedSkillIds()) {
        const set = generateQuestionSet(skillId, 5);
        expect(set).toHaveLength(5);
        set.forEach((q) => expect(q.skillId).toBe(skillId));
      }
    });
  });

  describe('generateDiagnosticSet', () => {
    it('generates questions across all skills', () => {
      const allIds = getSupportedSkillIds();
      const set = generateDiagnosticSet(allIds, 2);
      expect(set).toHaveLength(allIds.length * 2);
      const skillIds = new Set(set.map((q) => q.skillId));
      expect(skillIds.size).toBe(allIds.length);
    });
  });

  it('returns null for unknown skill', () => {
    expect(generateQuestion('FAKE-SKILL')).toBeNull();
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

  it('no floating-point artefacts in numeric answers', () => {
    const numericSkills = ['P4-DEC-03', 'P4-DEC-04', 'P4-DEC-05', 'P4-DEC-06'];
    for (const skillId of numericSkills) {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion(skillId);
        if (q.answerType === 'number') {
          const str = String(q.answer);
          const parts = str.split('.');
          if (parts.length === 2) {
            expect(parts[1].length, `${skillId} answer ${q.answer} has too many dp`).toBeLessThanOrEqual(3);
          }
        }
      }
    }
  });
});
