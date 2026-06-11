import { describe, it, expect } from 'vitest';
import { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds } from './p5AreaVolQuestionGenerator.js';
import { validateP5AreaVolSkillGraph, p5AreaVolSkillGraph } from './p5AreaVolSkillGraph.js';
import { validateP5AreaVolQuestionFamilies } from './p5AreaVolQuestionFamilies.js';

describe('p5AreaVolSkillGraph', () => {
  it('validates without errors', () => { const r = validateP5AreaVolSkillGraph(); expect(r.isValid).toBe(true); expect(r.errors).toHaveLength(0); });
  it('contains 3 skills', () => { expect(p5AreaVolSkillGraph.skills).toHaveLength(3); });
});

describe('p5AreaVolQuestionFamilies', () => {
  it('validates without errors', () => { const r = validateP5AreaVolQuestionFamilies(); expect(r.isValid).toBe(true); expect(r.totalQuestionFamilies).toBe(9); expect(r.errors).toHaveLength(0); });
});

describe('p5AreaVolQuestionGenerator', () => {
  it('supports 3 skill IDs', () => { const ids = getSupportedSkillIds(); expect(ids).toHaveLength(3); expect(ids).toContain('P5-AV-01'); expect(ids).toContain('P5-AV-02'); expect(ids).toContain('P5-AV-03'); });

  describe('P5-AV-01: Triangle Area', () => {
    it('generates triangle area questions (_001)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-AV-01', { questionFamilyId: 'QF_P5-AV-01_001' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(Number.isInteger(q.answer)).toBe(true); expect(q.prompt).toContain('area'); } });
    it('generates find-missing-dimension questions (_002)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-AV-01', { questionFamilyId: 'QF_P5-AV-01_002' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(Number.isInteger(q.answer)).toBe(true); } });
    it('generates right-triangle area questions (_003)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-AV-01', { questionFamilyId: 'QF_P5-AV-01_003' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(Number.isInteger(q.answer)).toBe(true); expect(q.prompt).toContain('right-angled'); } });
  });

  describe('P5-AV-02: Volume of Cube & Cuboid', () => {
    it('generates cuboid volume questions (_001)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-AV-02', { questionFamilyId: 'QF_P5-AV-02_001' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(Number.isInteger(q.answer)).toBe(true); expect(q.prompt).toContain('cuboid'); } });
    it('generates cube volume questions (_002)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-AV-02', { questionFamilyId: 'QF_P5-AV-02_002' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(Number.isInteger(q.answer)).toBe(true); expect(q.prompt).toContain('cube'); } });
    it('generates find-missing-dimension questions (_003)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-AV-02', { questionFamilyId: 'QF_P5-AV-02_003' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(Number.isInteger(q.answer)).toBe(true); expect(q.prompt).toContain('volume'); } });
  });

  describe('P5-AV-03: Composite Figures', () => {
    it('generates L-shaped area questions (_001)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-AV-03', { questionFamilyId: 'QF_P5-AV-03_001' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(Number.isInteger(q.answer)).toBe(true); expect(q.prompt).toContain('L-shaped'); } });
    it('generates triangle-cut-out area questions (_002)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-AV-03', { questionFamilyId: 'QF_P5-AV-03_002' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(Number.isInteger(q.answer)).toBe(true); expect(q.prompt).toContain('cut out'); } });
    it('generates combined cuboid volume questions (_003)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-AV-03', { questionFamilyId: 'QF_P5-AV-03_003' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(Number.isInteger(q.answer)).toBe(true); expect(q.prompt).toContain('cuboid'); } });
  });

  describe('generateQuestionSet', () => { it('returns requested count', () => { const s = generateQuestionSet('P5-AV-01', 5); expect(s).toHaveLength(5); }); });
  describe('generateDiagnosticSet', () => { it('covers all skills', () => { const s = generateDiagnosticSet(['P5-AV-01', 'P5-AV-02', 'P5-AV-03'], 2); expect(s).toHaveLength(6); expect(new Set(s.map((q) => q.skillId)).size).toBe(3); }); });

  it('returns null for unknown skill', () => { expect(generateQuestion('FAKE')).toBeNull(); });
  it('every question has unique questionId', () => { const ids = new Set(); for (const s of getSupportedSkillIds()) { for (let i = 0; i < 5; i++) { const q = generateQuestion(s); expect(ids.has(q.questionId)).toBe(false); ids.add(q.questionId); } } });
  it('every question has misconceptionTraps', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 3; i++) { const q = generateQuestion(s); expect(q.misconceptionTraps).toBeDefined(); expect(q.misconceptionTraps.length).toBeGreaterThan(0); } } });
  it('every question has solutionText', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 3; i++) { const q = generateQuestion(s); expect(q.solutionText).toBeDefined(); expect(q.solutionText.length).toBeGreaterThan(0); } } });
  it('all answers are positive integers', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 20; i++) { const q = generateQuestion(s); expect(q.answer).toBeGreaterThan(0); expect(Number.isInteger(q.answer)).toBe(true); } } });
});
