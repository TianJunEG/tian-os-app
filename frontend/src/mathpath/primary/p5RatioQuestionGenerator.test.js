import { describe, it, expect } from 'vitest';
import { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds } from './p5RatioQuestionGenerator.js';
import { validateP5RatioSkillGraph, p5RatioSkillGraph } from './p5RatioSkillGraph.js';
import { validateP5RatioQuestionFamilies } from './p5RatioQuestionFamilies.js';

describe('p5RatioSkillGraph', () => {
  it('validates without errors', () => { const r = validateP5RatioSkillGraph(); expect(r.isValid).toBe(true); expect(r.errors).toHaveLength(0); });
  it('contains 3 skills', () => { expect(p5RatioSkillGraph.skills).toHaveLength(3); });
});

describe('p5RatioQuestionFamilies', () => {
  it('validates without errors', () => { const r = validateP5RatioQuestionFamilies(); expect(r.isValid).toBe(true); expect(r.totalQuestionFamilies).toBe(9); expect(r.errors).toHaveLength(0); });
});

describe('p5RatioQuestionGenerator', () => {
  it('supports 3 skill IDs', () => { const ids = getSupportedSkillIds(); expect(ids).toHaveLength(3); expect(ids).toContain('P5-RAT-01'); expect(ids).toContain('P5-RAT-02'); expect(ids).toContain('P5-RAT-03'); });

  describe('P5-RAT-01: Ratio Concept & Equivalent Ratios', () => {
    it('generates simplify-ratio questions (_001)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-RAT-01', { questionFamilyId: 'QF_P5-RAT-01_001' }); expect(q).not.toBeNull(); expect(q.answerType).toBe('text'); expect(q.answer).toMatch(/^\d+ : \d+$/); expect(q.prompt).toContain('simplest form'); } });
    it('generates missing-term questions (_002)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-RAT-01', { questionFamilyId: 'QF_P5-RAT-01_002' }); expect(q).not.toBeNull(); expect(q.answerType).toBe('number'); expect(q.answer).toBeGreaterThan(0); expect(q.prompt).toContain('missing term'); } });
    it('generates express-as-ratio questions (_003)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-RAT-01', { questionFamilyId: 'QF_P5-RAT-01_003' }); expect(q).not.toBeNull(); expect(q.answerType).toBe('text'); expect(q.answer).toMatch(/^\d+ : \d+$/); expect(q.prompt).toContain('ratio'); } });
  });

  describe('P5-RAT-02: Ratio & Fraction Connection', () => {
    it('generates fraction-of-total questions (_001)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-RAT-02', { questionFamilyId: 'QF_P5-RAT-02_001' }); expect(q).not.toBeNull(); expect(q.answerType).toBe('text'); expect(q.answer).toMatch(/^\d+\/\d+$/); expect(q.prompt).toContain('fraction'); } });
    it('generates fraction-of-other questions (_002)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-RAT-02', { questionFamilyId: 'QF_P5-RAT-02_002' }); expect(q).not.toBeNull(); expect(q.answerType).toBe('text'); expect(q.answer).toMatch(/^\d+\/\d+$/); expect(q.prompt).toContain('fraction'); } });
    it('generates fraction-to-ratio questions (_003)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-RAT-02', { questionFamilyId: 'QF_P5-RAT-02_003' }); expect(q).not.toBeNull(); expect(q.answerType).toBe('text'); expect(q.answer).toMatch(/^\d+ : \d+$/); expect(q.prompt).toContain('ratio'); } });
  });

  describe('P5-RAT-03: Ratio Word Problems', () => {
    it('generates share-in-ratio questions (_001)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-RAT-03', { questionFamilyId: 'QF_P5-RAT-03_001' }); expect(q).not.toBeNull(); expect(q.answerType).toBe('number'); expect(q.answer).toBeGreaterThan(0); expect(q.prompt).toContain('share'); } });
    it('generates find-total questions (_002)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-RAT-03', { questionFamilyId: 'QF_P5-RAT-03_002' }); expect(q).not.toBeNull(); expect(q.answerType).toBe('number'); expect(q.answer).toBeGreaterThan(0); expect(q.prompt).toContain('altogether'); } });
    it('generates compare-quantities questions (_003)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-RAT-03', { questionFamilyId: 'QF_P5-RAT-03_003' }); expect(q).not.toBeNull(); expect(q.answerType).toBe('number'); expect(q.answer).toBeGreaterThan(0); expect(q.prompt).toContain('ratio'); } });
  });

  describe('generateQuestionSet', () => { it('returns requested count', () => { const s = generateQuestionSet('P5-RAT-01', 5); expect(s).toHaveLength(5); }); });
  describe('generateDiagnosticSet', () => { it('covers all skills', () => { const s = generateDiagnosticSet(['P5-RAT-01', 'P5-RAT-02', 'P5-RAT-03'], 2); expect(s).toHaveLength(6); expect(new Set(s.map((q) => q.skillId)).size).toBe(3); }); });

  it('returns null for unknown skill', () => { expect(generateQuestion('FAKE')).toBeNull(); });
  it('every question has unique questionId', () => { const ids = new Set(); for (const s of getSupportedSkillIds()) { for (let i = 0; i < 5; i++) { const q = generateQuestion(s); expect(ids.has(q.questionId)).toBe(false); ids.add(q.questionId); } } });
  it('every question has misconceptionTraps', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 3; i++) { const q = generateQuestion(s); expect(q.misconceptionTraps).toBeDefined(); expect(q.misconceptionTraps.length).toBeGreaterThan(0); } } });
  it('every question has solutionText', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 3; i++) { const q = generateQuestion(s); expect(q.solutionText).toBeDefined(); expect(q.solutionText.length).toBeGreaterThan(0); } } });
});
