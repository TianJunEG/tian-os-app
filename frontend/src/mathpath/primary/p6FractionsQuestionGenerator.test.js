import { describe, it, expect } from 'vitest';
import { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds } from './p6FractionsQuestionGenerator.js';
import { validateP6FractionsSkillGraph, p6FractionsSkillGraph } from './p6FractionsSkillGraph.js';
import { validateP6FractionsQuestionFamilies } from './p6FractionsQuestionFamilies.js';
import { getMisconception, getMisconceptionsForSkill, getAllMisconceptions } from './p6FractionsMisconceptionMap.js';

/* ================================================================
   Skill Graph
   ================================================================ */
describe('p6FractionsSkillGraph', () => {
  it('validates without errors', () => {
    const r = validateP6FractionsSkillGraph();
    expect(r.isValid).toBe(true);
    expect(r.errors).toHaveLength(0);
  });
  it('contains 3 skills', () => {
    expect(p6FractionsSkillGraph.skills).toHaveLength(3);
  });
  it('has correct skill IDs', () => {
    expect(p6FractionsSkillGraph.skillIds).toEqual(['P6-FR-01', 'P6-FR-02', 'P6-FR-03']);
  });
  it('skills have correct prerequisites', () => {
    const s1 = p6FractionsSkillGraph.skills.find((s) => s.id === 'P6-FR-01');
    const s2 = p6FractionsSkillGraph.skills.find((s) => s.id === 'P6-FR-02');
    const s3 = p6FractionsSkillGraph.skills.find((s) => s.id === 'P6-FR-03');
    expect(s1.prerequisites).toEqual(['P5-FR-03']);
    expect(s2.prerequisites).toEqual(['P6-FR-01']);
    expect(s3.prerequisites).toEqual(['P6-FR-02']);
  });
  it('difficulties are 4 or 5', () => {
    for (const s of p6FractionsSkillGraph.skills) {
      expect(s.difficulty).toBeGreaterThanOrEqual(4);
      expect(s.difficulty).toBeLessThanOrEqual(5);
    }
  });
});

/* ================================================================
   Question Families
   ================================================================ */
describe('p6FractionsQuestionFamilies', () => {
  it('validates without errors', () => {
    const r = validateP6FractionsQuestionFamilies();
    expect(r.isValid).toBe(true);
    expect(r.totalQuestionFamilies).toBe(9);
    expect(r.errors).toHaveLength(0);
  });
  it('has 3 families per skill', () => {
    const r = validateP6FractionsQuestionFamilies();
    expect(r.familiesPerSkill['P6-FR-01']).toBe(3);
    expect(r.familiesPerSkill['P6-FR-02']).toBe(3);
    expect(r.familiesPerSkill['P6-FR-03']).toBe(3);
  });
});

/* ================================================================
   Misconception Map
   ================================================================ */
describe('p6FractionsMisconceptionMap', () => {
  it('has 8 misconceptions', () => {
    expect(getAllMisconceptions()).toHaveLength(8);
  });
  it('retrieves each tag', () => {
    const tags = [
      'forgets_to_convert_mixed',
      'multiplies_denominators_for_addition',
      'wrong_reciprocal_in_division',
      'fraction_of_original_not_remainder',
      'treats_remainder_as_whole',
      'forgets_to_simplify',
      'wrong_common_denominator',
      'incorrect_mixed_to_improper',
    ];
    for (const tag of tags) {
      expect(getMisconception(tag)).not.toBeNull();
      expect(getMisconception(tag).tag).toBe(tag);
    }
  });
  it('returns misconceptions for each skill', () => {
    expect(getMisconceptionsForSkill('P6-FR-01').length).toBeGreaterThanOrEqual(1);
    expect(getMisconceptionsForSkill('P6-FR-02').length).toBeGreaterThanOrEqual(1);
    expect(getMisconceptionsForSkill('P6-FR-03').length).toBeGreaterThanOrEqual(1);
  });
  it('every misconception has required fields', () => {
    for (const m of getAllMisconceptions()) {
      expect(m.tag).toBeDefined();
      expect(m.label).toBeDefined();
      expect(m.description).toBeDefined();
      expect(m.remediationExplanation).toBeDefined();
      expect(m.recheckPattern).toBeDefined();
      expect(m.parentNote).toBeDefined();
      expect(m.relatedSkills.length).toBeGreaterThan(0);
    }
  });
});

/* ================================================================
   Question Generator
   ================================================================ */
describe('p6FractionsQuestionGenerator', () => {
  it('supports 3 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(3);
    expect(ids).toContain('P6-FR-01');
    expect(ids).toContain('P6-FR-02');
    expect(ids).toContain('P6-FR-03');
  });

  /* ---------- P6-FR-01: Complex Fraction Operations ---------- */
  describe('P6-FR-01: Complex Fraction Operations', () => {
    describe('_001: Mixed Number Multiplication', () => {
      it('generates valid questions (10 iterations)', () => {
        for (let i = 0; i < 10; i++) {
          const q = generateQuestion('P6-FR-01', { questionFamilyId: 'QF_P6-FR-01_001' });
          expect(q).not.toBeNull();
          expect(q.skillId).toBe('P6-FR-01');
          expect(q.answer).toBeGreaterThan(0);
          expect(q.answerType).toBe('number');
          expect(Number.isInteger(q.answer)).toBe(true);
          expect(q.prompt).toContain('×');
        }
      });
    });

    describe('_002: Fraction Division', () => {
      it('generates valid questions (10 iterations)', () => {
        for (let i = 0; i < 10; i++) {
          const q = generateQuestion('P6-FR-01', { questionFamilyId: 'QF_P6-FR-01_002' });
          expect(q).not.toBeNull();
          expect(q.skillId).toBe('P6-FR-01');
          expect(q.prompt).toContain('÷');
          // Answer is either a number or a fraction string
          if (q.answerType === 'number') {
            expect(q.answer).toBeGreaterThan(0);
            expect(Number.isInteger(q.answer)).toBe(true);
          } else {
            expect(typeof q.answer).toBe('string');
            // Must be a valid fraction "a/b" or a whole number string
            expect(q.answer).toMatch(/^\d+\/\d+$|^\d+$/);
          }
        }
      });
    });

    describe('_003: Mixed ÷ Fraction', () => {
      it('generates valid questions (10 iterations)', () => {
        for (let i = 0; i < 10; i++) {
          const q = generateQuestion('P6-FR-01', { questionFamilyId: 'QF_P6-FR-01_003' });
          expect(q).not.toBeNull();
          expect(q.skillId).toBe('P6-FR-01');
          expect(q.answer).toBeGreaterThan(0);
          expect(q.answerType).toBe('number');
          expect(Number.isInteger(q.answer)).toBe(true);
          expect(q.prompt).toContain('÷');
        }
      });
    });
  });

  /* ---------- P6-FR-02: Fraction Word Problems ---------- */
  describe('P6-FR-02: Fraction Word Problems', () => {
    describe('_001: Spend & Remainder', () => {
      it('generates valid questions (10 iterations)', () => {
        for (let i = 0; i < 10; i++) {
          const q = generateQuestion('P6-FR-02', { questionFamilyId: 'QF_P6-FR-02_001' });
          expect(q).not.toBeNull();
          expect(q.skillId).toBe('P6-FR-02');
          expect(q.answer).toBeGreaterThan(0);
          expect(q.answerType).toBe('number');
          expect(Number.isInteger(q.answer)).toBe(true);
          expect(q.prompt).toContain('remainder');
        }
      });
    });

    describe('_002: Share Among Friends', () => {
      it('generates valid questions (10 iterations)', () => {
        for (let i = 0; i < 10; i++) {
          const q = generateQuestion('P6-FR-02', { questionFamilyId: 'QF_P6-FR-02_002' });
          expect(q).not.toBeNull();
          expect(q.skillId).toBe('P6-FR-02');
          expect(q.answer).toBeGreaterThan(0);
          expect(q.answerType).toBe('number');
          expect(Number.isInteger(q.answer)).toBe(true);
          expect(q.prompt).toContain('remainder');
        }
      });
    });

    describe('_003: Two-Step Fraction of Quantity', () => {
      it('generates valid questions (10 iterations)', () => {
        for (let i = 0; i < 10; i++) {
          const q = generateQuestion('P6-FR-02', { questionFamilyId: 'QF_P6-FR-02_003' });
          expect(q).not.toBeNull();
          expect(q.skillId).toBe('P6-FR-02');
          expect(q.answer).toBeGreaterThan(0);
          expect(q.answerType).toBe('number');
          expect(Number.isInteger(q.answer)).toBe(true);
        }
      });
    });
  });

  /* ---------- P6-FR-03: Fraction of Remainder ---------- */
  describe('P6-FR-03: Fraction of Remainder', () => {
    describe('_001: Two-Step Remainder (sold/gave-away)', () => {
      it('generates valid questions (10 iterations)', () => {
        for (let i = 0; i < 10; i++) {
          const q = generateQuestion('P6-FR-03', { questionFamilyId: 'QF_P6-FR-03_001' });
          expect(q).not.toBeNull();
          expect(q.skillId).toBe('P6-FR-03');
          expect(q.answer).toBeGreaterThanOrEqual(0);
          expect(q.answerType).toBe('number');
          expect(Number.isInteger(q.answer)).toBe(true);
          expect(q.prompt).toContain('remainder');
        }
      });
    });

    describe('_002: Three-Step Remainder Chain', () => {
      it('generates valid questions (10 iterations)', () => {
        for (let i = 0; i < 10; i++) {
          const q = generateQuestion('P6-FR-03', { questionFamilyId: 'QF_P6-FR-03_002' });
          expect(q).not.toBeNull();
          expect(q.skillId).toBe('P6-FR-03');
          expect(q.answer).toBeGreaterThanOrEqual(0);
          expect(q.answerType).toBe('number');
          expect(Number.isInteger(q.answer)).toBe(true);
          expect(q.prompt).toContain('remainder');
        }
      });
    });

    describe('_003: Reverse — Find Original', () => {
      it('generates valid questions (10 iterations)', () => {
        for (let i = 0; i < 10; i++) {
          const q = generateQuestion('P6-FR-03', { questionFamilyId: 'QF_P6-FR-03_003' });
          expect(q).not.toBeNull();
          expect(q.skillId).toBe('P6-FR-03');
          expect(q.answer).toBeGreaterThan(0);
          expect(q.answerType).toBe('number');
          expect(Number.isInteger(q.answer)).toBe(true);
          expect(q.prompt).toContain('left');
        }
      });
      it('answer is always larger than leftover amount', () => {
        for (let i = 0; i < 10; i++) {
          const q = generateQuestion('P6-FR-03', { questionFamilyId: 'QF_P6-FR-03_003' });
          // Extract leftover from prompt: "$L left"
          const m = q.prompt.match(/\$(\d+) left/);
          expect(m).not.toBeNull();
          const leftover = Number(m[1]);
          expect(q.answer).toBeGreaterThan(leftover);
        }
      });
    });
  });

  /* ---------- Cross-cutting tests ---------- */
  describe('generateQuestionSet', () => {
    it('returns requested count', () => {
      const s = generateQuestionSet('P6-FR-01', 5);
      expect(s).toHaveLength(5);
    });
    it('returns requested count for each skill', () => {
      for (const skillId of getSupportedSkillIds()) {
        const s = generateQuestionSet(skillId, 7);
        expect(s).toHaveLength(7);
      }
    });
  });

  describe('generateDiagnosticSet', () => {
    it('covers all skills', () => {
      const s = generateDiagnosticSet(['P6-FR-01', 'P6-FR-02', 'P6-FR-03'], 2);
      expect(s).toHaveLength(6);
      expect(new Set(s.map((q) => q.skillId)).size).toBe(3);
    });
  });

  it('returns null for unknown skill', () => {
    expect(generateQuestion('FAKE')).toBeNull();
  });

  it('every question has unique questionId', () => {
    const ids = new Set();
    for (const s of getSupportedSkillIds()) {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion(s);
        expect(ids.has(q.questionId)).toBe(false);
        ids.add(q.questionId);
      }
    }
  });

  it('every question has misconceptionTraps', () => {
    for (const s of getSupportedSkillIds()) {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion(s);
        expect(q.misconceptionTraps).toBeDefined();
        expect(q.misconceptionTraps.length).toBeGreaterThan(0);
      }
    }
  });

  it('every question has solutionText', () => {
    for (const s of getSupportedSkillIds()) {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion(s);
        expect(q.solutionText).toBeDefined();
        expect(q.solutionText.length).toBeGreaterThan(0);
      }
    }
  });

  it('every question has instructionHint', () => {
    for (const s of getSupportedSkillIds()) {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion(s);
        expect(q.instructionHint).toBeDefined();
        expect(q.instructionHint.length).toBeGreaterThan(0);
      }
    }
  });

  it('every question has difficulty and fluencyTargetSeconds', () => {
    for (const s of getSupportedSkillIds()) {
      for (let i = 0; i < 3; i++) {
        const q = generateQuestion(s);
        expect(q.difficulty).toBeGreaterThanOrEqual(4);
        expect(q.fluencyTargetSeconds).toBeGreaterThan(0);
      }
    }
  });
});
