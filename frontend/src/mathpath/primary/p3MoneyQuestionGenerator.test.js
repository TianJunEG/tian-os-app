import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getSupportedSkillIds,
} from './p3MoneyQuestionGenerator.js';
import { validateP3MoneySkillGraph, p3MoneySkillGraph } from './p3MoneySkillGraph.js';
import { validateP3MoneyQuestionFamilies } from './p3MoneyQuestionFamilies.js';

// ---------------------------------------------------------------------------
// Skill graph validation
// ---------------------------------------------------------------------------

describe('p3MoneySkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP3MoneySkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains all 2 P3-MON skills', () => {
    expect(p3MoneySkillGraph.skills).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Question families validation
// ---------------------------------------------------------------------------

describe('p3MoneyQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP3MoneyQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.totalQuestionFamilies).toBe(7);
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Generator: skill coverage
// ---------------------------------------------------------------------------

describe('p3MoneyQuestionGenerator', () => {
  it('supports all 2 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(2);
    expect(ids).toContain('P3-MON-01');
    expect(ids).toContain('P3-MON-02');
  });

  // -------------------------------------------------------------------------
  // P3-MON-01: Adding & Subtracting Money
  // -------------------------------------------------------------------------

  describe('P3-MON-01: Adding & Subtracting Money', () => {
    it('generates add no-carry questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MON-01', { questionFamilyId: 'QF_P3-MON-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P3-MON-01');
        expect(q.answerType).toBe('number');
        expect(q.prompt).toContain('+');
        // Answer should be a valid dollar amount
        expect(q.answer).toBeGreaterThan(0);
        // Verify arithmetic: parse the two amounts from the prompt
        const match = q.prompt.match(/\$(\d+\.\d+) \+ \$(\d+\.\d+)/);
        expect(match).not.toBeNull();
        const expected = Number((parseFloat(match[1]) + parseFloat(match[2])).toFixed(2));
        expect(q.answer).toBeCloseTo(expected, 2);
      }
    });

    it('generates add with-carry questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MON-01', { questionFamilyId: 'QF_P3-MON-01_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('+');
        // Cents should carry: parse and check
        const match = q.prompt.match(/\$(\d+)\.(\d+) \+ \$(\d+)\.(\d+)/);
        expect(match).not.toBeNull();
        const cents1 = Number(match[2]);
        const cents2 = Number(match[4]);
        expect(cents1 + cents2).toBeGreaterThanOrEqual(100);
      }
    });

    it('generates subtract no-borrow questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MON-01', { questionFamilyId: 'QF_P3-MON-01_003' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('-');
        expect(q.answer).toBeGreaterThan(0);
        const match = q.prompt.match(/\$(\d+\.\d+) - \$(\d+\.\d+)/);
        expect(match).not.toBeNull();
        const expected = Number((parseFloat(match[1]) - parseFloat(match[2])).toFixed(2));
        expect(q.answer).toBeCloseTo(expected, 2);
      }
    });

    it('generates subtract with-borrow questions (_004)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MON-01', { questionFamilyId: 'QF_P3-MON-01_004' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('-');
        // Cents of first should be less than cents of second (borrow needed)
        const match = q.prompt.match(/\$(\d+)\.(\d+) - \$(\d+)\.(\d+)/);
        expect(match).not.toBeNull();
        expect(Number(match[2])).toBeLessThan(Number(match[4]));
        expect(q.answer).toBeGreaterThan(0);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P3-MON-02: Making Change
  // -------------------------------------------------------------------------

  describe('P3-MON-02: Making Change', () => {
    it('generates whole-dollar-note change questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MON-02', { questionFamilyId: 'QF_P3-MON-02_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P3-MON-02');
        expect(q.prompt).toContain('change');
        expect(q.answer).toBeGreaterThan(0);
        // Should mention a note ($5, $10, or $50)
        expect(q.prompt).toMatch(/\$(5\.00|10\.00|50\.00) note/);
      }
    });

    it('generates exact-amount change questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MON-02', { questionFamilyId: 'QF_P3-MON-02_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('change');
        expect(q.answer).toBeGreaterThan(0);
      }
    });

    it('generates multi-item change questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MON-02', { questionFamilyId: 'QF_P3-MON-02_003' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('and a');
        expect(q.prompt).toContain('change');
        expect(q.answer).toBeGreaterThan(0);
        expect(q.solutionText).toContain('Total cost');
      }
    });
  });

  // -------------------------------------------------------------------------
  // generateQuestionSet
  // -------------------------------------------------------------------------

  describe('generateQuestionSet', () => {
    it('returns the requested number of questions', () => {
      const set = generateQuestionSet('P3-MON-01', 5);
      expect(set).toHaveLength(5);
      set.forEach((q) => expect(q.skillId).toBe('P3-MON-01'));
    });

    it('defaults to 5 questions', () => {
      const set = generateQuestionSet('P3-MON-02');
      expect(set).toHaveLength(5);
    });
  });

  // -------------------------------------------------------------------------
  // generateDiagnosticSet
  // -------------------------------------------------------------------------

  describe('generateDiagnosticSet', () => {
    it('generates questions across all skills', () => {
      const skillIds = ['P3-MON-01', 'P3-MON-02'];
      const set = generateDiagnosticSet(skillIds, 2);
      expect(set).toHaveLength(4);
      const ids = new Set(set.map((q) => q.skillId));
      expect(ids.size).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases and cross-cutting concerns
  // -------------------------------------------------------------------------

  it('returns null for unknown skill', () => {
    expect(generateQuestion('FAKE-SKILL')).toBeNull();
    expect(generateQuestion('P3-MON-99')).toBeNull();
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

  it('all money answers have at most 2 decimal places', () => {
    for (const skillId of getSupportedSkillIds()) {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion(skillId);
        const str = String(q.answer);
        if (str.includes('.')) {
          const decimals = str.split('.')[1];
          expect(decimals.length).toBeLessThanOrEqual(2);
        }
      }
    }
  });
});
