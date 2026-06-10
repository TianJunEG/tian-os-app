import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getSupportedSkillIds,
} from './p2WordProbQuestionGenerator.js';
import { validateP2WordProbSkillGraph, p2WordProbSkillGraph } from './p2WordProbSkillGraph.js';
import { validateP2WordProbQuestionFamilies } from './p2WordProbQuestionFamilies.js';

describe('p2WordProbSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP2WordProbSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains all 2 P2-WP skills', () => {
    expect(p2WordProbSkillGraph.skills).toHaveLength(2);
  });
});

describe('p2WordProbQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP2WordProbQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.totalQuestionFamilies).toBe(5);
    expect(result.errors).toHaveLength(0);
  });
});

describe('p2WordProbQuestionGenerator', () => {
  it('supports all 2 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(2);
    expect(ids).toContain('P2-WP-01');
    expect(ids).toContain('P2-WP-02');
  });

  // -------------------------------------------------------------------------
  // P2-WP-01: Comparing Two Quantities
  // -------------------------------------------------------------------------

  describe('P2-WP-01: Comparing Two Quantities', () => {
    it('generates find-larger-quantity questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-WP-01', { questionFamilyId: 'QF_P2-WP-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P2-WP-01');
        expect(q.answerType).toBe('number');
        expect(q.prompt).toContain('more');
        // Verify: answer = base + diff (answer > base)
        const baseMatch = q.prompt.match(/has (\d+)/);
        const diffMatch = q.prompt.match(/(\d+) more/);
        if (baseMatch && diffMatch) {
          expect(q.answer).toBe(Number(baseMatch[1]) + Number(diffMatch[1]));
        }
      }
    });

    it('generates find-smaller-quantity questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-WP-01', { questionFamilyId: 'QF_P2-WP-01_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('fewer');
        // Verify: answer = base - diff
        const baseMatch = q.prompt.match(/has (\d+)/);
        const diffMatch = q.prompt.match(/(\d+) fewer/);
        if (baseMatch && diffMatch) {
          expect(q.answer).toBe(Number(baseMatch[1]) - Number(diffMatch[1]));
        }
        expect(q.answer).toBeGreaterThan(0);
      }
    });

    it('generates find-difference questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-WP-01', { questionFamilyId: 'QF_P2-WP-01_003' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('How many more');
        expect(q.answer).toBeGreaterThan(0);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P2-WP-02: Equal Groups
  // -------------------------------------------------------------------------

  describe('P2-WP-02: Equal Groups', () => {
    it('generates find-total questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-WP-02', { questionFamilyId: 'QF_P2-WP-02_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P2-WP-02');
        expect(q.prompt).toContain('altogether');
        expect(q.answer).toBeGreaterThan(0);
        // Answer should be groups * perGroup
        expect(q.answer).toBeLessThanOrEqual(60); // max 6 * 10
      }
    });

    it('generates find-number-of-groups questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-WP-02', { questionFamilyId: 'QF_P2-WP-02_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('How many');
        expect(q.answer).toBeGreaterThanOrEqual(2);
        expect(q.answer).toBeLessThanOrEqual(6);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Utility functions
  // -------------------------------------------------------------------------

  describe('generateQuestionSet', () => {
    it('returns the requested number', () => {
      const set = generateQuestionSet('P2-WP-01', 5);
      expect(set).toHaveLength(5);
    });
  });

  describe('generateDiagnosticSet', () => {
    it('covers all skills', () => {
      const set = generateDiagnosticSet(['P2-WP-01', 'P2-WP-02'], 2);
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

  it('uses Singapore names', () => {
    const sgNames = ['Ali', 'Ben', 'Mei', 'Siti', 'Raj', 'Tom', 'Lily', 'Sarah', 'John', 'Mary'];
    for (let i = 0; i < 20; i++) {
      const q = generateQuestion('P2-WP-01');
      const hasName = sgNames.some((n) => q.prompt.includes(n));
      expect(hasName).toBe(true);
    }
  });

  it('uses specified item nouns', () => {
    const items = ['stickers', 'marbles', 'pencils', 'books', 'sweets', 'erasers', 'apples', 'oranges'];
    for (let i = 0; i < 20; i++) {
      const q = generateQuestion('P2-WP-01');
      const hasItem = items.some((item) => q.prompt.includes(item));
      expect(hasItem).toBe(true);
    }
  });
});
