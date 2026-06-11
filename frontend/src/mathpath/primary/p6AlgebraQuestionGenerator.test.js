import { describe, it, expect } from 'vitest';
import { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds } from './p6AlgebraQuestionGenerator.js';
import { validateP6AlgebraSkillGraph, p6AlgebraSkillGraph } from './p6AlgebraSkillGraph.js';
import { validateP6AlgebraQuestionFamilies } from './p6AlgebraQuestionFamilies.js';

describe('p6AlgebraSkillGraph', () => {
  it('validates without errors', () => { const r = validateP6AlgebraSkillGraph(); expect(r.isValid).toBe(true); expect(r.errors).toHaveLength(0); });
  it('contains 3 skills', () => { expect(p6AlgebraSkillGraph.skills).toHaveLength(3); });
});

describe('p6AlgebraQuestionFamilies', () => {
  it('validates without errors', () => { const r = validateP6AlgebraQuestionFamilies(); expect(r.isValid).toBe(true); expect(r.totalQuestionFamilies).toBe(9); expect(r.errors).toHaveLength(0); });
});

describe('p6AlgebraQuestionGenerator', () => {
  it('supports 3 skill IDs', () => { const ids = getSupportedSkillIds(); expect(ids).toHaveLength(3); expect(ids).toContain('P6-ALG-01'); expect(ids).toContain('P6-ALG-02'); expect(ids).toContain('P6-ALG-03'); });

  describe('P6-ALG-01: Forming Algebraic Expressions', () => {
    it('generates simple expression questions (_001)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P6-ALG-01', { questionFamilyId: 'QF_P6-ALG-01_001' }); expect(q).not.toBeNull(); expect(typeof q.answer).toBe('string'); expect(q.answer.length).toBeGreaterThan(0); expect(q.answerType).toBe('text'); } });
    it('generates simplify-like-terms questions (_002)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P6-ALG-01', { questionFamilyId: 'QF_P6-ALG-01_002' }); expect(q).not.toBeNull(); expect(typeof q.answer).toBe('string'); expect(q.prompt.toLowerCase()).toContain('simplify'); } });
    it('generates multi-part expression questions (_003)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P6-ALG-01', { questionFamilyId: 'QF_P6-ALG-01_003' }); expect(q).not.toBeNull(); expect(typeof q.answer).toBe('string'); expect(q.answer.length).toBeGreaterThan(0); } });
  });

  describe('P6-ALG-02: Solving Linear Equations', () => {
    it('generates one-step equation questions (_001)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P6-ALG-02', { questionFamilyId: 'QF_P6-ALG-02_001' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(Number.isInteger(q.answer)).toBe(true); expect(q.prompt.toLowerCase()).toContain('solve'); } });
    it('generates two-step equation questions (_002)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P6-ALG-02', { questionFamilyId: 'QF_P6-ALG-02_002' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(Number.isInteger(q.answer)).toBe(true); } });
    it('generates bracket equation questions (_003)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P6-ALG-02', { questionFamilyId: 'QF_P6-ALG-02_003' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(Number.isInteger(q.answer)).toBe(true); expect(q.prompt).toContain('('); } });
  });

  describe('P6-ALG-03: Algebraic Word Problems', () => {
    it('generates single-unknown word problems (_001)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P6-ALG-03', { questionFamilyId: 'QF_P6-ALG-03_001' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(Number.isInteger(q.answer)).toBe(true); } });
    it('generates before-and-after word problems (_002)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P6-ALG-03', { questionFamilyId: 'QF_P6-ALG-03_002' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(Number.isInteger(q.answer)).toBe(true); } });
    it('generates comparison word problems (_003)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P6-ALG-03', { questionFamilyId: 'QF_P6-ALG-03_003' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(Number.isInteger(q.answer)).toBe(true); } });
  });

  describe('generateQuestionSet', () => { it('returns requested count', () => { const s = generateQuestionSet('P6-ALG-01', 5); expect(s).toHaveLength(5); }); });
  describe('generateDiagnosticSet', () => { it('covers all skills', () => { const s = generateDiagnosticSet(['P6-ALG-01', 'P6-ALG-02', 'P6-ALG-03'], 2); expect(s).toHaveLength(6); expect(new Set(s.map((q) => q.skillId)).size).toBe(3); }); });

  it('returns null for unknown skill', () => { expect(generateQuestion('FAKE')).toBeNull(); });
  it('every question has unique questionId', () => { const ids = new Set(); for (const s of getSupportedSkillIds()) { for (let i = 0; i < 5; i++) { const q = generateQuestion(s); expect(ids.has(q.questionId)).toBe(false); ids.add(q.questionId); } } });
  it('every question has misconceptionTraps', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 3; i++) { const q = generateQuestion(s); expect(q.misconceptionTraps).toBeDefined(); expect(q.misconceptionTraps.length).toBeGreaterThan(0); } } });
  it('every question has solutionText', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 3; i++) { const q = generateQuestion(s); expect(q.solutionText).toBeDefined(); expect(q.solutionText.length).toBeGreaterThan(0); } } });
});
