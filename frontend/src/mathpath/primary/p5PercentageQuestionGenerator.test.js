import { describe, it, expect } from 'vitest';
import { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds } from './p5PercentageQuestionGenerator.js';
import { validateP5PercentageSkillGraph, p5PercentageSkillGraph } from './p5PercentageSkillGraph.js';
import { validateP5PercentageQuestionFamilies } from './p5PercentageQuestionFamilies.js';

describe('p5PercentageSkillGraph', () => {
  it('validates without errors', () => { const r = validateP5PercentageSkillGraph(); expect(r.isValid).toBe(true); expect(r.errors).toHaveLength(0); });
  it('contains 3 skills', () => { expect(p5PercentageSkillGraph.skills).toHaveLength(3); });
});

describe('p5PercentageQuestionFamilies', () => {
  it('validates without errors', () => { const r = validateP5PercentageQuestionFamilies(); expect(r.isValid).toBe(true); expect(r.totalQuestionFamilies).toBe(9); expect(r.errors).toHaveLength(0); });
});

describe('p5PercentageQuestionGenerator', () => {
  it('supports 3 skill IDs', () => { const ids = getSupportedSkillIds(); expect(ids).toHaveLength(3); expect(ids).toContain('P5-PCT-01'); expect(ids).toContain('P5-PCT-02'); expect(ids).toContain('P5-PCT-03'); });

  describe('P5-PCT-01: Percent ↔ Fraction/Decimal Conversion', () => {
    it('generates percent-to-fraction questions (_001)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-PCT-01', { questionFamilyId: 'QF_P5-PCT-01_001' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThanOrEqual(1); expect(q.prompt).toContain('fraction'); } });
    it('generates percent-to-decimal questions (_002)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-PCT-01', { questionFamilyId: 'QF_P5-PCT-01_002' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(q.answer).toBeLessThan(1); expect(q.prompt).toContain('decimal'); } });
    it('generates fraction/decimal-to-percent questions (_003)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-PCT-01', { questionFamilyId: 'QF_P5-PCT-01_003' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(q.answer).toBeLessThanOrEqual(100); expect(q.prompt).toContain('percentage'); } });
  });

  describe('P5-PCT-02: Find Percentage of a Quantity', () => {
    it('generates find-X%-of-Y questions (_001)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-PCT-02', { questionFamilyId: 'QF_P5-PCT-02_001' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(Number.isInteger(q.answer)).toBe(true); expect(q.prompt).toContain('% of'); } });
    it('generates what-percentage questions (_002)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-PCT-02', { questionFamilyId: 'QF_P5-PCT-02_002' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(q.answer).toBeLessThanOrEqual(100); expect(q.prompt).toContain('percentage'); } });
    it('generates find-the-whole questions (_003)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-PCT-02', { questionFamilyId: 'QF_P5-PCT-02_003' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(Number.isInteger(q.answer)).toBe(true); expect(q.prompt).toContain('number'); } });
  });

  describe('P5-PCT-03: Percentage Word Problems', () => {
    it('generates spending/saving word problems (_001)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-PCT-03', { questionFamilyId: 'QF_P5-PCT-03_001' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThanOrEqual(0); expect(Number.isInteger(q.answer)).toBe(true); expect(q.prompt).toContain('spent'); } });
    it('generates composition word problems (_002)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-PCT-03', { questionFamilyId: 'QF_P5-PCT-03_002' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(Number.isInteger(q.answer)).toBe(true); expect(q.prompt).toContain('rest'); } });
    it('generates discount/increase word problems (_003)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-PCT-03', { questionFamilyId: 'QF_P5-PCT-03_003' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(Number.isInteger(q.answer)).toBe(true); expect(q.prompt).toContain('sale price'); } });
  });

  describe('generateQuestionSet', () => { it('returns requested count', () => { const s = generateQuestionSet('P5-PCT-01', 5); expect(s).toHaveLength(5); }); });
  describe('generateDiagnosticSet', () => { it('covers all skills', () => { const s = generateDiagnosticSet(['P5-PCT-01', 'P5-PCT-02', 'P5-PCT-03'], 2); expect(s).toHaveLength(6); expect(new Set(s.map((q) => q.skillId)).size).toBe(3); }); });

  it('returns null for unknown skill', () => { expect(generateQuestion('FAKE')).toBeNull(); });
  it('every question has unique questionId', () => { const ids = new Set(); for (const s of getSupportedSkillIds()) { for (let i = 0; i < 5; i++) { const q = generateQuestion(s); expect(ids.has(q.questionId)).toBe(false); ids.add(q.questionId); } } });
  it('every question has misconceptionTraps', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 3; i++) { const q = generateQuestion(s); expect(q.misconceptionTraps).toBeDefined(); expect(q.misconceptionTraps.length).toBeGreaterThan(0); } } });
  it('every question has solutionText', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 3; i++) { const q = generateQuestion(s); expect(q.solutionText).toBeDefined(); expect(q.solutionText.length).toBeGreaterThan(0); } } });
});
