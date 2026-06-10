import { describe, it, expect } from 'vitest';
import { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds } from './p4FactorsMultiplesQuestionGenerator.js';
import { validateP4FactorsMultiplesSkillGraph, p4FactorsMultiplesSkillGraph } from './p4FactorsMultiplesSkillGraph.js';
import { validateP4FactorsMultiplesQuestionFamilies } from './p4FactorsMultiplesQuestionFamilies.js';

describe('p4FactorsMultiplesSkillGraph', () => {
  it('validates without errors', () => { const r = validateP4FactorsMultiplesSkillGraph(); expect(r.isValid).toBe(true); expect(r.errors).toHaveLength(0); });
  it('contains 2 skills', () => { expect(p4FactorsMultiplesSkillGraph.skills).toHaveLength(2); });
});

describe('p4FactorsMultiplesQuestionFamilies', () => {
  it('validates without errors', () => { const r = validateP4FactorsMultiplesQuestionFamilies(); expect(r.isValid).toBe(true); expect(r.totalQuestionFamilies).toBe(6); expect(r.errors).toHaveLength(0); });
});

describe('p4FactorsMultiplesQuestionGenerator', () => {
  it('supports 2 skill IDs', () => { const ids = getSupportedSkillIds(); expect(ids).toHaveLength(2); expect(ids).toContain('P4-FM-01'); expect(ids).toContain('P4-FM-02'); });

  describe('P4-FM-01: Factors', () => {
    it('generates factor-count questions (_001)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P4-FM-01', { questionFamilyId: 'QF_P4-FM-01_001' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThanOrEqual(2); expect(q.prompt).toContain('factors'); } });
    it('generates common-factor-count (_002)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P4-FM-01', { questionFamilyId: 'QF_P4-FM-01_002' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThanOrEqual(1); expect(q.prompt).toContain('common factors'); } });
    it('generates HCF questions (_003)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P4-FM-01', { questionFamilyId: 'QF_P4-FM-01_003' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThanOrEqual(1); expect(q.prompt).toContain('greatest common factor'); } });
  });

  describe('P4-FM-02: Multiples', () => {
    it('generates Nth-multiple (_001)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P4-FM-02', { questionFamilyId: 'QF_P4-FM-02_001' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(q.prompt).toContain('multiple'); } });
    it('generates common-multiple-count (_002)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P4-FM-02', { questionFamilyId: 'QF_P4-FM-02_002' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThanOrEqual(1); expect(q.prompt).toContain('common multiples'); } });
    it('generates LCM questions (_003)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P4-FM-02', { questionFamilyId: 'QF_P4-FM-02_003' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(q.prompt).toContain('lowest common multiple'); } });
  });

  describe('generateQuestionSet', () => { it('returns requested count', () => { const s = generateQuestionSet('P4-FM-01', 5); expect(s).toHaveLength(5); }); });
  describe('generateDiagnosticSet', () => { it('covers all skills', () => { const s = generateDiagnosticSet(['P4-FM-01', 'P4-FM-02'], 2); expect(s).toHaveLength(4); expect(new Set(s.map((q) => q.skillId)).size).toBe(2); }); });

  it('returns null for unknown skill', () => { expect(generateQuestion('FAKE')).toBeNull(); });
  it('every question has unique questionId', () => { const ids = new Set(); for (const s of getSupportedSkillIds()) { for (let i = 0; i < 5; i++) { const q = generateQuestion(s); expect(ids.has(q.questionId)).toBe(false); ids.add(q.questionId); } } });
  it('every question has misconceptionTraps', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 3; i++) { const q = generateQuestion(s); expect(q.misconceptionTraps).toBeDefined(); expect(q.misconceptionTraps.length).toBeGreaterThan(0); } } });
  it('every question has solutionText', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 3; i++) { const q = generateQuestion(s); expect(q.solutionText).toBeDefined(); expect(q.solutionText.length).toBeGreaterThan(0); } } });
});
