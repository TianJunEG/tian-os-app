import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getSupportedSkillIds,
} from './p6PercentageQuestionGenerator.js';
import { validateP6PercentageSkillGraph, p6PercentageSkillGraph } from './p6PercentageSkillGraph.js';
import { validateP6PercentageQuestionFamilies } from './p6PercentageQuestionFamilies.js';
import { getAllMisconceptions, getMisconceptionsForSkill, getRemediationForTag } from './p6PercentageMisconceptionMap.js';

// ---------------------------------------------------------------------------
// Skill graph validation
// ---------------------------------------------------------------------------

describe('p6PercentageSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP6PercentageSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains 3 skills', () => {
    expect(p6PercentageSkillGraph.skills).toHaveLength(3);
  });

  it('all skill IDs follow P6-PCT-XX format', () => {
    for (const skill of p6PercentageSkillGraph.skills) {
      expect(skill.id).toMatch(/^P6-PCT-0[1-3]$/);
    }
  });

  it('prerequisites are correctly wired', () => {
    const byId = new Map(p6PercentageSkillGraph.skills.map((s) => [s.id, s]));
    expect(byId.get('P6-PCT-01').prerequisites).toEqual(['P5-PCT-03']);
    expect(byId.get('P6-PCT-02').prerequisites).toEqual(['P6-PCT-01']);
    expect(byId.get('P6-PCT-03').prerequisites).toEqual(['P6-PCT-01']);
  });

  it('difficulties are 4-5', () => {
    for (const skill of p6PercentageSkillGraph.skills) {
      expect(skill.difficulty).toBeGreaterThanOrEqual(4);
      expect(skill.difficulty).toBeLessThanOrEqual(5);
    }
  });
});

// ---------------------------------------------------------------------------
// Question families validation
// ---------------------------------------------------------------------------

describe('p6PercentageQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP6PercentageQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('has 9 total question families', () => {
    const result = validateP6PercentageQuestionFamilies();
    expect(result.totalQuestionFamilies).toBe(9);
  });

  it('every skill has exactly 3 families', () => {
    const result = validateP6PercentageQuestionFamilies();
    for (const [skillId, count] of Object.entries(result.familiesPerSkill)) {
      expect(count, `${skillId} should have 3 families`).toBe(3);
    }
  });
});

// ---------------------------------------------------------------------------
// Misconception map
// ---------------------------------------------------------------------------

describe('p6PercentageMisconceptionMap', () => {
  it('has 8 misconceptions', () => {
    expect(getAllMisconceptions()).toHaveLength(8);
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
    for (const skill of p6PercentageSkillGraph.skills) {
      const ms = getMisconceptionsForSkill(skill.id);
      expect(ms.length, `${skill.id} should have misconceptions`).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Question generator
// ---------------------------------------------------------------------------

describe('p6PercentageQuestionGenerator', () => {
  it('supports 3 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(3);
    expect(ids).toContain('P6-PCT-01');
    expect(ids).toContain('P6-PCT-02');
    expect(ids).toContain('P6-PCT-03');
  });

  // -------------------------------------------------------------------------
  // P6-PCT-01: Percentage Increase & Decrease
  // -------------------------------------------------------------------------

  describe('P6-PCT-01: Percentage Increase & Decrease', () => {
    it('generates percentage increase questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-PCT-01', { questionFamilyId: 'QF_P6-PCT-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P6-PCT-01');
        expect(q.answerType).toBe('number');
        expect(q.prompt).toContain('increased');
        expect(q.answer).toBeGreaterThan(0);
        // Answer should be greater than the base price (increase)
        const match = q.prompt.match(/\$(\d+)/);
        if (match) {
          expect(q.answer).toBeGreaterThan(Number(match[1]));
        }
      }
    });

    it('generates percentage decrease questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-PCT-01', { questionFamilyId: 'QF_P6-PCT-01_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('decreased');
        expect(q.answer).toBeGreaterThan(0);
        // Answer should be less than the base price (decrease)
        const match = q.prompt.match(/\$(\d+)/);
        if (match) {
          expect(q.answer).toBeLessThan(Number(match[1]));
        }
      }
    });

    it('generates word problem questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-PCT-01', { questionFamilyId: 'QF_P6-PCT-01_003' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThan(0);
        expect(q.prompt).toMatch(/\$\d+/);
        expect(q.prompt).toMatch(/\d+%/);
      }
    });

    it('answers are always whole numbers', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-PCT-01');
        expect(Number.isInteger(q.answer), `Answer ${q.answer} should be a whole number`).toBe(true);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P6-PCT-02: Discount & GST
  // -------------------------------------------------------------------------

  describe('P6-PCT-02: Discount & GST', () => {
    it('generates single discount questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-PCT-02', { questionFamilyId: 'QF_P6-PCT-02_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P6-PCT-02');
        expect(q.prompt).toContain('sale');
        expect(q.answer).toBeGreaterThan(0);
        // Sale price should be less than original
        const match = q.prompt.match(/\$(\d+)/);
        if (match) {
          expect(q.answer).toBeLessThan(Number(match[1]));
        }
      }
    });

    it('generates GST questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-PCT-02', { questionFamilyId: 'QF_P6-PCT-02_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('GST');
        expect(q.prompt).toContain('9%');
        expect(q.answer).toBeGreaterThan(0);
        // Total with GST should be more than price before GST
        const match = q.prompt.match(/\$(\d+)/);
        if (match) {
          expect(q.answer).toBeGreaterThan(Number(match[1]));
        }
      }
    });

    it('generates discount-then-GST questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-PCT-02', { questionFamilyId: 'QF_P6-PCT-02_003' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('discount');
        expect(q.prompt).toContain('GST');
        expect(q.answer).toBeGreaterThan(0);
      }
    });

    it('GST answers have at most 2 decimal places', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-PCT-02', { questionFamilyId: 'QF_P6-PCT-02_002' });
        const parts = String(q.answer).split('.');
        if (parts.length === 2) {
          expect(parts[1].length).toBeLessThanOrEqual(2);
        }
      }
    });
  });

  // -------------------------------------------------------------------------
  // P6-PCT-03: Reverse Percentage
  // -------------------------------------------------------------------------

  describe('P6-PCT-03: Reverse Percentage', () => {
    it('generates reverse increase questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-PCT-03', { questionFamilyId: 'QF_P6-PCT-03_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P6-PCT-03');
        expect(q.prompt).toContain('increase');
        expect(q.answer).toBeGreaterThan(0);
        // Original should be less than the given final value (after increase)
        const match = q.prompt.match(/\$(\d+)/);
        if (match) {
          expect(q.answer).toBeLessThan(Number(match[1]));
        }
      }
    });

    it('generates reverse decrease questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-PCT-03', { questionFamilyId: 'QF_P6-PCT-03_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('discount');
        expect(q.answer).toBeGreaterThan(0);
        // Original should be more than the given final value (after discount)
        const match = q.prompt.match(/\$(\d+)/);
        if (match) {
          expect(q.answer).toBeGreaterThan(Number(match[1]));
        }
      }
    });

    it('generates reverse word problem questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-PCT-03', { questionFamilyId: 'QF_P6-PCT-03_003' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThan(0);
        expect(q.prompt).toMatch(/\$\d+/);
        expect(q.prompt).toMatch(/\d+%/);
      }
    });

    it('reverse percentage answers are always whole numbers', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-PCT-03');
        expect(Number.isInteger(q.answer), `Answer ${q.answer} should be a whole number`).toBe(true);
      }
    });

    it('reverse percentage: verify answer correctness for increase', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-PCT-03', { questionFamilyId: 'QF_P6-PCT-03_001' });
        // Extract percentage and final value
        const pctMatch = q.prompt.match(/(\d+)% increase/);
        const valMatch = q.prompt.match(/\$(\d+)/);
        if (pctMatch && valMatch) {
          const pct = Number(pctMatch[1]);
          const finalVal = Number(valMatch[1]);
          const original = q.answer;
          // Verify: original * (100 + pct) / 100 == finalVal
          expect(original * (100 + pct) / 100).toBeCloseTo(finalVal, 2);
        }
      }
    });

    it('reverse percentage: verify answer correctness for decrease', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-PCT-03', { questionFamilyId: 'QF_P6-PCT-03_002' });
        // Extract percentage and final value
        const pctMatch = q.prompt.match(/(\d+)% discount/);
        const valMatch = q.prompt.match(/\$(\d+)/);
        if (pctMatch && valMatch) {
          const pct = Number(pctMatch[1]);
          const finalVal = Number(valMatch[1]);
          const original = q.answer;
          // Verify: original * (100 - pct) / 100 == finalVal
          expect(original * (100 - pct) / 100).toBeCloseTo(finalVal, 2);
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

  it('every question has instructionHint', () => {
    for (const skillId of getSupportedSkillIds()) {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion(skillId);
        expect(q.instructionHint).toBeDefined();
        expect(q.instructionHint.length).toBeGreaterThan(0);
      }
    }
  });

  it('all numeric answers are positive', () => {
    for (const skillId of getSupportedSkillIds()) {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion(skillId);
        if (q.answerType === 'number') {
          expect(q.answer, `${skillId} answer should be positive, got ${q.answer}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('no floating-point artefacts in numeric answers', () => {
    for (const skillId of getSupportedSkillIds()) {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion(skillId);
        if (q.answerType === 'number') {
          const str = String(q.answer);
          const parts = str.split('.');
          if (parts.length === 2) {
            expect(parts[1].length, `${skillId} answer ${q.answer} has too many dp`).toBeLessThanOrEqual(2);
          }
        }
      }
    }
  });

  it('uses SGD ($) in all prompts', () => {
    for (const skillId of getSupportedSkillIds()) {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion(skillId);
        expect(q.prompt).toContain('$');
      }
    }
  });
});
