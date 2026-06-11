import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getSupportedSkillIds,
} from './p2MoneyQuestionGenerator.js';
import { validateP2MoneySkillGraph, p2MoneySkillGraph } from './p2MoneySkillGraph.js';
import { validateP2MoneyQuestionFamilies } from './p2MoneyQuestionFamilies.js';

// ---------------------------------------------------------------------------
// Skill graph validation
// ---------------------------------------------------------------------------

describe('p2MoneySkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP2MoneySkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains all 3 P2-MON skills', () => {
    expect(p2MoneySkillGraph.skills).toHaveLength(3);
  });

  it('has correct prerequisite chain', () => {
    const mon01 = p2MoneySkillGraph.skills.find((s) => s.id === 'P2-MON-01');
    const mon02 = p2MoneySkillGraph.skills.find((s) => s.id === 'P2-MON-02');
    const mon03 = p2MoneySkillGraph.skills.find((s) => s.id === 'P2-MON-03');
    expect(mon01.prerequisites).toContain('P1-MON-03');
    expect(mon01.prerequisites).toContain('P1-MON-05');
    expect(mon02.prerequisites).toContain('P2-MON-01');
    expect(mon03.prerequisites).toContain('P2-MON-01');
  });
});

// ---------------------------------------------------------------------------
// Question families validation
// ---------------------------------------------------------------------------

describe('p2MoneyQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP2MoneyQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.totalQuestionFamilies).toBe(8);
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Generator: skill coverage
// ---------------------------------------------------------------------------

describe('p2MoneyQuestionGenerator', () => {
  it('supports all 3 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(3);
    expect(ids).toContain('P2-MON-01');
    expect(ids).toContain('P2-MON-02');
    expect(ids).toContain('P2-MON-03');
  });

  // -------------------------------------------------------------------------
  // P2-MON-01: Money — Dollars & Cents
  // -------------------------------------------------------------------------

  describe('P2-MON-01: Money — Dollars & Cents', () => {
    it('generates dollars-to-cents questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-MON-01', { questionFamilyId: 'QF_P2-MON-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P2-MON-01');
        expect(q.answerType).toBe('number');
        expect(q.prompt).toContain('cents');
        expect(q.answer).toBeGreaterThan(100);
        // Verify answer: parse the dollar amount from prompt
        const match = q.prompt.match(/\$(\d+)\.(\d+)/);
        expect(match).not.toBeNull();
        const expectedCents = Number(match[1]) * 100 + Number(match[2]);
        expect(q.answer).toBe(expectedCents);
      }
    });

    it('generates cents-to-dollars questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-MON-01', { questionFamilyId: 'QF_P2-MON-01_002' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('text');
        expect(q.prompt).toContain('cents');
        // Answer should be a valid dollar string
        expect(q.answer).toMatch(/^\$\d+\.\d{2}$/);
        // Verify: parse cents from the prompt
        const match = q.prompt.match(/(\d+) cents/);
        expect(match).not.toBeNull();
        const cents = Number(match[1]);
        expect(q.answer).toBe(`$${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`);
      }
    });

    it('generates mixed notation questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-MON-01', { questionFamilyId: 'QF_P2-MON-01_003' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('number');
        // Answer is dollar-part in cents: must be a multiple of 100
        expect(q.answer % 100).toBe(0);
        expect(q.answer).toBeGreaterThanOrEqual(200);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P2-MON-02: Counting Notes & Coins
  // -------------------------------------------------------------------------

  describe('P2-MON-02: Counting Notes & Coins', () => {
    it('generates notes-only questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-MON-02', { questionFamilyId: 'QF_P2-MON-02_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P2-MON-02');
        expect(q.answerType).toBe('text');
        expect(q.prompt).toContain('notes');
        // Answer should be a dollar string
        expect(q.answer).toMatch(/^\$\d+\.\d{2}$/);
        // Notes are whole dollars, so cents should be 00
        expect(q.answer).toMatch(/\.00$/);
      }
    });

    it('generates coins-only questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-MON-02', { questionFamilyId: 'QF_P2-MON-02_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('coins');
        expect(q.answer).toMatch(/^\$\d+\.\d{2}$/);
      }
    });

    it('generates notes-and-coins questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-MON-02', { questionFamilyId: 'QF_P2-MON-02_003' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('notes');
        expect(q.prompt).toContain('coins');
        expect(q.answer).toMatch(/^\$\d+\.\d{2}$/);
      }
    });

    it('notes-only totals are always whole dollar amounts', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P2-MON-02', { questionFamilyId: 'QF_P2-MON-02_001' });
        // Parse the answer
        const match = q.answer.match(/\$(\d+)\.(\d+)/);
        expect(Number(match[2])).toBe(0);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P2-MON-03: Comparing Amounts of Money
  // -------------------------------------------------------------------------

  describe('P2-MON-03: Comparing Amounts of Money', () => {
    it('generates compare-two-amounts questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-MON-03', { questionFamilyId: 'QF_P2-MON-03_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P2-MON-03');
        expect(q.answerType).toBe('mcq');
        expect(q.options).toBeDefined();
        expect(q.options.length).toBe(2);
        // The answer should match one of the options
        const optionValues = q.options.map((o) => o.value);
        expect(optionValues).toContain(q.answer);
        // Prompt contains greater or lesser
        expect(q.prompt).toMatch(/greater|lesser/);
      }
    });

    it('generates order-three-amounts questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-MON-03', { questionFamilyId: 'QF_P2-MON-03_002' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('mcq');
        expect(q.options).toBeDefined();
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        // The answer should match one of the options
        const optionValues = q.options.map((o) => o.value);
        expect(optionValues).toContain(q.answer);
        // Prompt contains direction
        expect(q.prompt).toMatch(/least to greatest|greatest to least/);
      }
    });

    it('compare answers are correct', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P2-MON-03', { questionFamilyId: 'QF_P2-MON-03_001' });
        // Parse the two amounts and the question word
        const amountMatches = q.prompt.match(/\$(\d+\.\d+)/g);
        expect(amountMatches).not.toBeNull();
        expect(amountMatches.length).toBe(2);
        const a = parseFloat(amountMatches[0].slice(1));
        const b = parseFloat(amountMatches[1].slice(1));
        const isGreater = q.prompt.includes('greater');
        const expected = isGreater ? Math.max(a, b) : Math.min(a, b);
        const answerVal = parseFloat(q.answer.slice(1));
        expect(answerVal).toBeCloseTo(expected, 2);
      }
    });
  });

  // -------------------------------------------------------------------------
  // generateQuestionSet
  // -------------------------------------------------------------------------

  describe('generateQuestionSet', () => {
    it('returns the requested number of questions', () => {
      const set = generateQuestionSet('P2-MON-01', 5);
      expect(set).toHaveLength(5);
      set.forEach((q) => expect(q.skillId).toBe('P2-MON-01'));
    });

    it('defaults to 5 questions', () => {
      const set = generateQuestionSet('P2-MON-02');
      expect(set).toHaveLength(5);
    });
  });

  // -------------------------------------------------------------------------
  // generateDiagnosticSet
  // -------------------------------------------------------------------------

  describe('generateDiagnosticSet', () => {
    it('generates questions across all skills', () => {
      const skillIds = ['P2-MON-01', 'P2-MON-02', 'P2-MON-03'];
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
    expect(generateQuestion('P2-MON-99')).toBeNull();
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

  it('all money string answers are well-formed', () => {
    for (const skillId of getSupportedSkillIds()) {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion(skillId);
        if (typeof q.answer === 'string' && q.answer.startsWith('$')) {
          expect(q.answer).toMatch(/^\$\d+\.\d{2}/);
        }
      }
    }
  });

  it('numeric answers have at most 2 decimal places', () => {
    for (const skillId of getSupportedSkillIds()) {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion(skillId);
        if (typeof q.answer === 'number') {
          const str = String(q.answer);
          if (str.includes('.')) {
            const decimals = str.split('.')[1];
            expect(decimals.length).toBeLessThanOrEqual(2);
          }
        }
      }
    }
  });

  it('MON-01 cents answers are always whole integers', () => {
    for (let i = 0; i < 20; i++) {
      const q = generateQuestion('P2-MON-01', { questionFamilyId: 'QF_P2-MON-01_001' });
      expect(Number.isInteger(q.answer)).toBe(true);
    }
  });
});
