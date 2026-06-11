import { describe, it, expect } from 'vitest';
import { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds } from './p5WholeNumbersQuestionGenerator.js';
import { validateP5WholeNumbersSkillGraph, p5WholeNumbersSkillGraph } from './p5WholeNumbersSkillGraph.js';
import { validateP5WholeNumbersQuestionFamilies } from './p5WholeNumbersQuestionFamilies.js';

describe('p5WholeNumbersSkillGraph', () => {
  it('validates without errors', () => { const r = validateP5WholeNumbersSkillGraph(); expect(r.isValid).toBe(true); expect(r.errors).toHaveLength(0); });
  it('contains 3 skills', () => { expect(p5WholeNumbersSkillGraph.skills).toHaveLength(3); });
});

describe('p5WholeNumbersQuestionFamilies', () => {
  it('validates without errors', () => { const r = validateP5WholeNumbersQuestionFamilies(); expect(r.isValid).toBe(true); expect(r.totalQuestionFamilies).toBe(9); expect(r.errors).toHaveLength(0); });
});

describe('p5WholeNumbersQuestionGenerator', () => {
  it('supports 3 skill IDs', () => { const ids = getSupportedSkillIds(); expect(ids).toHaveLength(3); expect(ids).toContain('P5-WN-01'); expect(ids).toContain('P5-WN-02'); expect(ids).toContain('P5-WN-03'); });

  describe('P5-WN-01: Place Value', () => {
    it('generates digit value questions (_001)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-WN-01', { questionFamilyId: 'QF_P5-WN-01_001' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThanOrEqual(0); expect(q.prompt).toContain('value'); } });
    it('generates word-to-numeral questions (_002)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-WN-01', { questionFamilyId: 'QF_P5-WN-01_002' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(q.prompt).toContain('numeral'); } });
    it('generates expanded form questions (_003)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-WN-01', { questionFamilyId: 'QF_P5-WN-01_003' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); } });
  });

  describe('P5-WN-02: Rounding', () => {
    it('rounds to nearest 1000 (_001)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-WN-02', { questionFamilyId: 'QF_P5-WN-02_001' }); expect(q).not.toBeNull(); expect(q.answer % 1000).toBe(0); } });
    it('rounds to nearest 10000 (_002)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-WN-02', { questionFamilyId: 'QF_P5-WN-02_002' }); expect(q).not.toBeNull(); expect(q.answer % 10000).toBe(0); } });
    it('estimates by rounding (_003)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-WN-02', { questionFamilyId: 'QF_P5-WN-02_003' }); expect(q).not.toBeNull(); expect(q.prompt).toContain('Estimate'); } });
  });

  describe('P5-WN-03: Order of Operations', () => {
    it('two-operation expressions (_001)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-WN-03', { questionFamilyId: 'QF_P5-WN-03_001' }); expect(q).not.toBeNull(); expect(typeof q.answer).toBe('number'); } });
    it('bracket expressions (_002)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-WN-03', { questionFamilyId: 'QF_P5-WN-03_002' }); expect(q).not.toBeNull(); expect(typeof q.answer).toBe('number'); } });
    it('three-operation expressions (_003)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-WN-03', { questionFamilyId: 'QF_P5-WN-03_003' }); expect(q).not.toBeNull(); expect(typeof q.answer).toBe('number'); } });
  });

  describe('generateQuestionSet', () => { it('returns requested count', () => { const s = generateQuestionSet('P5-WN-01', 5); expect(s).toHaveLength(5); }); });
  describe('generateDiagnosticSet', () => { it('covers all skills', () => { const s = generateDiagnosticSet(['P5-WN-01', 'P5-WN-02', 'P5-WN-03'], 2); expect(s).toHaveLength(6); expect(new Set(s.map((q) => q.skillId)).size).toBe(3); }); });

  it('returns null for unknown skill', () => { expect(generateQuestion('FAKE')).toBeNull(); });
  it('every question has unique questionId', () => { const ids = new Set(); for (const s of getSupportedSkillIds()) { for (let i = 0; i < 5; i++) { const q = generateQuestion(s); expect(ids.has(q.questionId)).toBe(false); ids.add(q.questionId); } } });
  it('every question has misconceptionTraps', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 3; i++) { const q = generateQuestion(s); expect(q.misconceptionTraps).toBeDefined(); expect(q.misconceptionTraps.length).toBeGreaterThan(0); } } });
  it('every question has solutionText', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 3; i++) { const q = generateQuestion(s); expect(q.solutionText).toBeDefined(); expect(q.solutionText.length).toBeGreaterThan(0); } } });
});
