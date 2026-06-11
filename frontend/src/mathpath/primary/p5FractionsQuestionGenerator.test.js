import { describe, it, expect } from 'vitest';
import { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds } from './p5FractionsQuestionGenerator.js';
import { validateP5FractionsSkillGraph, p5FractionsSkillGraph } from './p5FractionsSkillGraph.js';
import { validateP5FractionsQuestionFamilies } from './p5FractionsQuestionFamilies.js';

describe('p5FractionsSkillGraph', () => {
  it('validates without errors', () => { const r = validateP5FractionsSkillGraph(); expect(r.isValid).toBe(true); expect(r.errors).toHaveLength(0); });
  it('contains 3 skills', () => { expect(p5FractionsSkillGraph.skills).toHaveLength(3); });
});

describe('p5FractionsQuestionFamilies', () => {
  it('validates without errors', () => { const r = validateP5FractionsQuestionFamilies(); expect(r.isValid).toBe(true); expect(r.totalQuestionFamilies).toBe(9); expect(r.errors).toHaveLength(0); });
});

describe('p5FractionsQuestionGenerator', () => {
  it('supports 3 skill IDs', () => { const ids = getSupportedSkillIds(); expect(ids).toHaveLength(3); expect(ids).toContain('P5-FR-01'); expect(ids).toContain('P5-FR-02'); expect(ids).toContain('P5-FR-03'); });

  describe('P5-FR-01: Unlike Fractions Add/Sub', () => {
    it('generates add unlike fractions (_001)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-FR-01', { questionFamilyId: 'QF_P5-FR-01_001' }); expect(q).not.toBeNull(); expect(q.answer).toBeDefined(); expect(q.prompt).toContain('+'); } });
    it('generates subtract unlike fractions (_002)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-FR-01', { questionFamilyId: 'QF_P5-FR-01_002' }); expect(q).not.toBeNull(); expect(q.answer).toBeDefined(); expect(q.prompt).toContain('−'); } });
    it('generates mixed number add/sub (_003)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-FR-01', { questionFamilyId: 'QF_P5-FR-01_003' }); expect(q).not.toBeNull(); expect(q.answer).toBeDefined(); } });
  });

  describe('P5-FR-02: Fraction of Whole', () => {
    it('generates simple fraction of whole (_001)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-FR-02', { questionFamilyId: 'QF_P5-FR-02_001' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(q.prompt).toContain('of'); } });
    it('generates fraction of quantity (_002)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-FR-02', { questionFamilyId: 'QF_P5-FR-02_002' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(q.prompt).toContain('of'); } });
    it('generates mixed number times whole (_003)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-FR-02', { questionFamilyId: 'QF_P5-FR-02_003' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(q.prompt).toContain('×'); } });
  });

  describe('P5-FR-03: Fraction Multiply/Divide', () => {
    it('generates fraction × fraction (_001)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-FR-03', { questionFamilyId: 'QF_P5-FR-03_001' }); expect(q).not.toBeNull(); expect(q.answer).toBeDefined(); expect(q.prompt).toContain('×'); } });
    it('generates whole ÷ fraction (_002)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-FR-03', { questionFamilyId: 'QF_P5-FR-03_002' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(q.prompt).toContain('÷'); } });
    it('generates fraction ÷ whole (_003)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-FR-03', { questionFamilyId: 'QF_P5-FR-03_003' }); expect(q).not.toBeNull(); expect(q.answer).toBeDefined(); expect(q.prompt).toContain('÷'); } });
  });

  describe('generateQuestionSet', () => { it('returns requested count', () => { const s = generateQuestionSet('P5-FR-01', 5); expect(s).toHaveLength(5); }); });
  describe('generateDiagnosticSet', () => { it('covers all skills', () => { const s = generateDiagnosticSet(['P5-FR-01', 'P5-FR-02', 'P5-FR-03'], 2); expect(s).toHaveLength(6); expect(new Set(s.map((q) => q.skillId)).size).toBe(3); }); });

  it('returns null for unknown skill', () => { expect(generateQuestion('FAKE')).toBeNull(); });
  it('every question has unique questionId', () => { const ids = new Set(); for (const s of getSupportedSkillIds()) { for (let i = 0; i < 5; i++) { const q = generateQuestion(s); expect(ids.has(q.questionId)).toBe(false); ids.add(q.questionId); } } });
  it('every question has misconceptionTraps', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 3; i++) { const q = generateQuestion(s); expect(q.misconceptionTraps).toBeDefined(); expect(q.misconceptionTraps.length).toBeGreaterThan(0); } } });
  it('every question has solutionText', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 3; i++) { const q = generateQuestion(s); expect(q.solutionText).toBeDefined(); expect(q.solutionText.length).toBeGreaterThan(0); } } });
});
