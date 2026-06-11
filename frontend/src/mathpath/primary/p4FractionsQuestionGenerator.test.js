import { describe, it, expect } from 'vitest';
import { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds } from './p4FractionsQuestionGenerator.js';
import { validateP4FractionsSkillGraph, p4FractionsSkillGraph } from './p4FractionsSkillGraph.js';
import { validateP4FractionsQuestionFamilies } from './p4FractionsQuestionFamilies.js';
import { getMisconception, getMisconceptionsForSkill, getAllMisconceptions } from './p4FractionsMisconceptionMap.js';

describe('p4FractionsSkillGraph', () => {
  it('validates without errors', () => { const r = validateP4FractionsSkillGraph(); expect(r.isValid).toBe(true); expect(r.errors).toHaveLength(0); });
  it('contains 3 skills', () => { expect(p4FractionsSkillGraph.skills).toHaveLength(3); });
  it('has correct skill IDs', () => { expect(p4FractionsSkillGraph.skillIds).toEqual(['P4-FR-01', 'P4-FR-02', 'P4-FR-03']); });
});

describe('p4FractionsQuestionFamilies', () => {
  it('validates without errors', () => { const r = validateP4FractionsQuestionFamilies(); expect(r.isValid).toBe(true); expect(r.totalQuestionFamilies).toBe(7); expect(r.errors).toHaveLength(0); });
});

describe('p4FractionsMisconceptionMap', () => {
  it('has 5 misconceptions', () => { expect(getAllMisconceptions()).toHaveLength(5); });
  it('retrieves by tag', () => {
    expect(getMisconception('multiplies_whole_but_forgets_numerator')).not.toBeNull();
    expect(getMisconception('divides_set_by_numerator_not_denominator')).not.toBeNull();
    expect(getMisconception('adds_unlike_numerators_directly')).not.toBeNull();
    expect(getMisconception('wrong_lcd')).not.toBeNull();
    expect(getMisconception('forgets_to_rename_both_fractions')).not.toBeNull();
  });
  it('returns misconceptions for each skill', () => {
    expect(getMisconceptionsForSkill('P4-FR-01').length).toBeGreaterThanOrEqual(1);
    expect(getMisconceptionsForSkill('P4-FR-02').length).toBeGreaterThanOrEqual(1);
    expect(getMisconceptionsForSkill('P4-FR-03').length).toBeGreaterThanOrEqual(1);
  });
});

describe('p4FractionsQuestionGenerator', () => {
  it('supports 3 skill IDs', () => { const ids = getSupportedSkillIds(); expect(ids).toHaveLength(3); expect(ids).toContain('P4-FR-01'); expect(ids).toContain('P4-FR-02'); expect(ids).toContain('P4-FR-03'); });

  describe('P4-FR-01: Mixed Number to Improper Fraction', () => {
    it('generates convert-to-improper (_001)', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P4-FR-01', { questionFamilyId: 'QF_P4-FR-01_001' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThan(0);
        expect(q.prompt).toContain('improper fraction');
        // Verify: answer = whole*denom + numer, so answer > denom
        expect(q.answerType).toBe('number');
      }
    });
    it('generates word-context (_002)', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P4-FR-01', { questionFamilyId: 'QF_P4-FR-01_002' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThan(0);
        expect(q.prompt).toContain('improper fraction');
      }
    });
    it('answer = whole*denom + numer is always correct', () => {
      for (let i = 0; i < 30; i++) {
        const q = generateQuestion('P4-FR-01', { questionFamilyId: 'QF_P4-FR-01_001' });
        // Parse from prompt: "Convert W N/D ..."
        const m = q.prompt.match(/(\d+)\s+(\d+)\/(\d+)/);
        expect(m).not.toBeNull();
        const whole = Number(m[1]), numer = Number(m[2]), denom = Number(m[3]);
        expect(q.answer).toBe(whole * denom + numer);
        expect(numer).toBeLessThan(denom);
        expect(denom).toBeLessThanOrEqual(12);
        expect(whole).toBeGreaterThanOrEqual(1);
        expect(whole).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('P4-FR-02: Fraction of a Set', () => {
    it('generates compute-fraction-of-set (_001)', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P4-FR-02', { questionFamilyId: 'QF_P4-FR-02_001' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThan(0);
        expect(Number.isInteger(q.answer)).toBe(true);
      }
    });
    it('generates word-context (_002)', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P4-FR-02', { questionFamilyId: 'QF_P4-FR-02_002' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThan(0);
        expect(Number.isInteger(q.answer)).toBe(true);
      }
    });
    it('answer = (numer/denom) * setSize is always integer', () => {
      for (let i = 0; i < 30; i++) {
        const q = generateQuestion('P4-FR-02', { questionFamilyId: 'QF_P4-FR-02_001' });
        const m = q.prompt.match(/(\d+)\/(\d+) of (\d+)/);
        expect(m).not.toBeNull();
        const numer = Number(m[1]), denom = Number(m[2]), setSize = Number(m[3]);
        expect(setSize % denom).toBe(0);
        expect(q.answer).toBe((numer / denom) * setSize);
        expect(denom).toBeGreaterThanOrEqual(2);
        expect(denom).toBeLessThanOrEqual(8);
      }
    });
  });

  describe('P4-FR-03: Add & Subtract Unlike Fractions', () => {
    it('generates add-unlike (_001)', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P4-FR-03', { questionFamilyId: 'QF_P4-FR-03_001' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThan(0);
        expect(q.prompt).toContain('+');
        expect(Number.isInteger(q.answer)).toBe(true);
      }
    });
    it('generates subtract-unlike (_002)', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P4-FR-03', { questionFamilyId: 'QF_P4-FR-03_002' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThan(0);
        expect(Number.isInteger(q.answer)).toBe(true);
      }
    });
    it('generates word-context (_003)', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P4-FR-03', { questionFamilyId: 'QF_P4-FR-03_003' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThan(0);
        expect(Number.isInteger(q.answer)).toBe(true);
      }
    });
    it('LCD is always ≤ 24', () => {
      for (let i = 0; i < 30; i++) {
        const q = generateQuestion('P4-FR-03', { questionFamilyId: 'QF_P4-FR-03_001' });
        const m = q.prompt.match(/\? \/ (\d+)/);
        expect(m).not.toBeNull();
        const lcd = Number(m[1]);
        expect(lcd).toBeLessThanOrEqual(24);
      }
    });
    it('addition answer is within bounds', () => {
      for (let i = 0; i < 30; i++) {
        const q = generateQuestion('P4-FR-03', { questionFamilyId: 'QF_P4-FR-03_001' });
        const m = q.prompt.match(/\? \/ (\d+)/);
        const lcd = Number(m[1]);
        expect(q.answer).toBeGreaterThan(0);
        expect(q.answer).toBeLessThanOrEqual(lcd);
      }
    });
    it('subtraction answer is positive', () => {
      for (let i = 0; i < 30; i++) {
        const q = generateQuestion('P4-FR-03', { questionFamilyId: 'QF_P4-FR-03_002' });
        expect(q.answer).toBeGreaterThan(0);
      }
    });
  });

  describe('generateQuestionSet', () => { it('returns requested count', () => { const s = generateQuestionSet('P4-FR-01', 5); expect(s).toHaveLength(5); }); });
  describe('generateDiagnosticSet', () => { it('covers all skills', () => { const s = generateDiagnosticSet(['P4-FR-01', 'P4-FR-02', 'P4-FR-03'], 2); expect(s).toHaveLength(6); expect(new Set(s.map((q) => q.skillId)).size).toBe(3); }); });

  it('returns null for unknown skill', () => { expect(generateQuestion('FAKE')).toBeNull(); });
  it('every question has unique questionId', () => { const ids = new Set(); for (const s of getSupportedSkillIds()) { for (let i = 0; i < 5; i++) { const q = generateQuestion(s); expect(ids.has(q.questionId)).toBe(false); ids.add(q.questionId); } } });
  it('every question has misconceptionTraps', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 5; i++) { const q = generateQuestion(s); expect(q.misconceptionTraps).toBeDefined(); expect(q.misconceptionTraps.length).toBeGreaterThan(0); } } });
  it('every question has solutionText', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 5; i++) { const q = generateQuestion(s); expect(q.solutionText).toBeDefined(); expect(q.solutionText.length).toBeGreaterThan(0); } } });
});
