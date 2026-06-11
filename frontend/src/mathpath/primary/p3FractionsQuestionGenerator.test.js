import { describe, it, expect } from 'vitest';
import { p3FractionsSkillGraph, validateP3FractionsSkillGraph } from './p3FractionsSkillGraph.js';
import { validateP3FractionsQuestionFamilies, getQuestionFamiliesBySkill } from './p3FractionsQuestionFamilies.js';
import { generateQuestion, generateQuestionSet, generateDiagnosticSet } from './p3FractionsQuestionGenerator.js';

// ---------------------------------------------------------------------------
// Skill graph
// ---------------------------------------------------------------------------

describe('p3FractionsSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP3FractionsSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains 2 P3-FR skills', () => {
    expect(p3FractionsSkillGraph.skills).toHaveLength(2);
    expect(p3FractionsSkillGraph.skillIds.every((id) => id.startsWith('P3-FR'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Question families
// ---------------------------------------------------------------------------

describe('p3FractionsQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP3FractionsQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Question generator
// ---------------------------------------------------------------------------

describe('p3FractionsQuestionGenerator', () => {
  const allSkillIds = p3FractionsSkillGraph.skillIds;

  it('supports 2 skill IDs', () => {
    expect(allSkillIds).toHaveLength(2);
  });

  // ── P3-FR-01: Equivalent Fractions ─────────────────────────────────────
  describe('P3-FR-01: Equivalent Fractions', () => {
    it('generates find-missing-numerator questions (_001)', () => {
      const families = getQuestionFamiliesBySkill('P3-FR-01');
      const fam001 = families.find((f) => f.id.endsWith('_001'));
      expect(fam001).toBeTruthy();
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P3-FR-01', { questionFamilyId: fam001.id });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P3-FR-01');
        expect(q.prompt).toContain('?/');
        expect(typeof q.answer).toBe('number');
        expect(q.answer).toBeGreaterThan(0);
        expect(q.answer).toBeLessThanOrEqual(12);
      }
    });

    it('generates find-missing-denominator questions (_002)', () => {
      const families = getQuestionFamiliesBySkill('P3-FR-01');
      const fam002 = families.find((f) => f.id.endsWith('_002'));
      expect(fam002).toBeTruthy();
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P3-FR-01', { questionFamilyId: fam002.id });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P3-FR-01');
        expect(q.prompt).toContain('/?');
        expect(typeof q.answer).toBe('number');
        expect(q.answer).toBeGreaterThan(0);
        expect(q.answer).toBeLessThanOrEqual(12);
      }
    });

    it('generates are-these-equivalent choice questions (_003)', () => {
      const families = getQuestionFamiliesBySkill('P3-FR-01');
      const fam003 = families.find((f) => f.id.endsWith('_003'));
      expect(fam003).toBeTruthy();
      let yesCount = 0;
      let noCount = 0;
      for (let i = 0; i < 40; i++) {
        const q = generateQuestion('P3-FR-01', { questionFamilyId: fam003.id });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P3-FR-01');
        expect(q.answerType).toBe('choice');
        expect(q.choices).toHaveLength(2);
        expect(['Yes', 'No']).toContain(q.answer);
        if (q.answer === 'Yes') yesCount++;
        else noCount++;
      }
      // Both answer types should appear in 40 trials
      expect(yesCount).toBeGreaterThan(0);
      expect(noCount).toBeGreaterThan(0);
    });
  });

  // ── P3-FR-02: Add & Subtract Related Fractions ─────────────────────────
  describe('P3-FR-02: Add & Subtract Related Fractions', () => {
    it('generates add-related-fractions questions (_001)', () => {
      const families = getQuestionFamiliesBySkill('P3-FR-02');
      const fam001 = families.find((f) => f.id.endsWith('_001'));
      expect(fam001).toBeTruthy();
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P3-FR-02', { questionFamilyId: fam001.id });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P3-FR-02');
        expect(q.prompt).toContain('+');
        expect(q.prompt).toContain('?/');
        expect(typeof q.answer).toBe('number');
        expect(q.answer).toBeGreaterThan(0);
        expect(q.answer).toBeLessThanOrEqual(12);
      }
    });

    it('generates subtract-related-fractions questions (_002)', () => {
      const families = getQuestionFamiliesBySkill('P3-FR-02');
      const fam002 = families.find((f) => f.id.endsWith('_002'));
      expect(fam002).toBeTruthy();
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P3-FR-02', { questionFamilyId: fam002.id });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P3-FR-02');
        expect(q.answer).toBeGreaterThan(0);
      }
    });

    it('generates word-context questions (_003)', () => {
      const families = getQuestionFamiliesBySkill('P3-FR-02');
      const fam003 = families.find((f) => f.id.endsWith('_003'));
      expect(fam003).toBeTruthy();
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P3-FR-02', { questionFamilyId: fam003.id });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P3-FR-02');
        expect(typeof q.answer).toBe('number');
      }
    });
  });

  // ── Shared contract ─────────────────────────────────────────────────────

  it('generateQuestionSet returns the requested number', () => {
    for (const skillId of allSkillIds) {
      const set = generateQuestionSet(skillId, 8);
      expect(set).toHaveLength(8);
    }
  });

  it('generateDiagnosticSet covers all skills', () => {
    const set = generateDiagnosticSet(allSkillIds, 3);
    const coveredSkills = new Set(set.map((q) => q.skillId));
    for (const skillId of allSkillIds) {
      expect(coveredSkills.has(skillId)).toBe(true);
    }
  });

  it('returns null for unknown skill', () => {
    expect(generateQuestion('P3-FR-99')).toBeNull();
  });

  it('every question has a unique questionId', () => {
    const ids = new Set();
    for (const skillId of allSkillIds) {
      const set = generateQuestionSet(skillId, 10);
      set.forEach((q) => {
        expect(ids.has(q.questionId)).toBe(false);
        ids.add(q.questionId);
      });
    }
  });

  it('every question has misconceptionTraps and solutionText', () => {
    for (const skillId of allSkillIds) {
      const set = generateQuestionSet(skillId, 8);
      set.forEach((q) => {
        expect(Array.isArray(q.misconceptionTraps)).toBe(true);
        expect(q.misconceptionTraps.length).toBeGreaterThan(0);
        expect(typeof q.solutionText).toBe('string');
        expect(q.solutionText.length).toBeGreaterThan(0);
      });
    }
  });

  it('uses Singapore names in word problems', () => {
    const names = ['Ali', 'Ben', 'Mei', 'Siti', 'Raj', 'Tom', 'Lily', 'Sarah', 'John', 'Mary'];
    const families = getQuestionFamiliesBySkill('P3-FR-02');
    const fam003 = families.find((f) => f.id.endsWith('_003'));
    for (let i = 0; i < 20; i++) {
      const q = generateQuestion('P3-FR-02', { questionFamilyId: fam003.id });
      const hasName = names.some((n) => q.prompt.includes(n));
      expect(hasName).toBe(true);
    }
  });

  it('denominators never exceed 12', () => {
    for (const skillId of allSkillIds) {
      const set = generateQuestionSet(skillId, 30);
      set.forEach((q) => {
        // Extract denominators from prompt
        const denomMatches = q.prompt.match(/\/(\d+)/g) || [];
        denomMatches.forEach((m) => {
          const denom = parseInt(m.slice(1), 10);
          expect(denom).toBeLessThanOrEqual(12);
        });
      });
    }
  });
});
