import { describe, it, expect } from 'vitest';
import { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds } from './p5GeometryQuestionGenerator.js';
import { validateP5GeometrySkillGraph, p5GeometrySkillGraph } from './p5GeometrySkillGraph.js';
import { validateP5GeometryQuestionFamilies } from './p5GeometryQuestionFamilies.js';

describe('p5GeometrySkillGraph', () => {
  it('validates without errors', () => { const r = validateP5GeometrySkillGraph(); expect(r.isValid).toBe(true); expect(r.errors).toHaveLength(0); });
  it('contains 3 skills', () => { expect(p5GeometrySkillGraph.skills).toHaveLength(3); });
});

describe('p5GeometryQuestionFamilies', () => {
  it('validates without errors', () => { const r = validateP5GeometryQuestionFamilies(); expect(r.isValid).toBe(true); expect(r.totalQuestionFamilies).toBe(9); expect(r.errors).toHaveLength(0); });
});

describe('p5GeometryQuestionGenerator', () => {
  it('supports 3 skill IDs', () => { const ids = getSupportedSkillIds(); expect(ids).toHaveLength(3); expect(ids).toContain('P5-GEO-01'); expect(ids).toContain('P5-GEO-02'); expect(ids).toContain('P5-GEO-03'); });

  describe('P5-GEO-01: Angles on Straight Line & at a Point', () => {
    it('generates angles-on-line questions (_001)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-GEO-01', { questionFamilyId: 'QF_P5-GEO-01_001' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(q.answer).toBeLessThan(180); expect(Number.isInteger(q.answer)).toBe(true); expect(q.prompt).toContain('straight line'); } });
    it('generates vertically-opposite questions (_002)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-GEO-01', { questionFamilyId: 'QF_P5-GEO-01_002' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(q.answer).toBeLessThanOrEqual(160); expect(Number.isInteger(q.answer)).toBe(true); expect(q.prompt).toContain('vertically opposite'); } });
    it('generates angles-at-a-point questions (_003)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-GEO-01', { questionFamilyId: 'QF_P5-GEO-01_003' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(q.answer).toBeLessThan(360); expect(Number.isInteger(q.answer)).toBe(true); expect(q.prompt).toContain('point'); } });
  });

  describe('P5-GEO-02: Triangle Angle Properties', () => {
    it('generates triangle-angle-sum questions (_001)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-GEO-02', { questionFamilyId: 'QF_P5-GEO-02_001' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(q.answer).toBeLessThan(180); expect(Number.isInteger(q.answer)).toBe(true); expect(q.prompt).toContain('triangle'); } });
    it('generates isosceles-triangle questions (_002)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-GEO-02', { questionFamilyId: 'QF_P5-GEO-02_002' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(q.answer).toBeLessThan(180); expect(Number.isInteger(q.answer)).toBe(true); expect(q.prompt).toContain('isosceles'); } });
    it('generates equilateral-triangle questions (_003)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-GEO-02', { questionFamilyId: 'QF_P5-GEO-02_003' }); expect(q).not.toBeNull(); expect(q.answer).toBe(60); expect(q.prompt.toLowerCase()).toContain('equilateral'); } });
  });

  describe('P5-GEO-03: Parallelogram & Quadrilateral Properties', () => {
    it('generates parallelogram-angle questions (_001)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-GEO-03', { questionFamilyId: 'QF_P5-GEO-03_001' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(q.answer).toBeLessThan(180); expect(Number.isInteger(q.answer)).toBe(true); expect(q.prompt).toContain('parallelogram'); } });
    it('generates rhombus-angle questions (_002)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-GEO-03', { questionFamilyId: 'QF_P5-GEO-03_002' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(q.answer).toBeLessThan(180); expect(Number.isInteger(q.answer)).toBe(true); expect(q.prompt).toContain('rhombus'); } });
    it('generates co-interior-angle questions (_003)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-GEO-03', { questionFamilyId: 'QF_P5-GEO-03_003' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); expect(q.answer).toBeLessThan(180); expect(Number.isInteger(q.answer)).toBe(true); expect(q.prompt).toContain('co-interior'); } });
  });

  describe('generateQuestionSet', () => { it('returns requested count', () => { const s = generateQuestionSet('P5-GEO-01', 5); expect(s).toHaveLength(5); }); });
  describe('generateDiagnosticSet', () => { it('covers all skills', () => { const s = generateDiagnosticSet(['P5-GEO-01', 'P5-GEO-02', 'P5-GEO-03'], 2); expect(s).toHaveLength(6); expect(new Set(s.map((q) => q.skillId)).size).toBe(3); }); });

  it('returns null for unknown skill', () => { expect(generateQuestion('FAKE')).toBeNull(); });
  it('every question has unique questionId', () => { const ids = new Set(); for (const s of getSupportedSkillIds()) { for (let i = 0; i < 5; i++) { const q = generateQuestion(s); expect(ids.has(q.questionId)).toBe(false); ids.add(q.questionId); } } });
  it('every question has misconceptionTraps', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 3; i++) { const q = generateQuestion(s); expect(q.misconceptionTraps).toBeDefined(); expect(q.misconceptionTraps.length).toBeGreaterThan(0); } } });
  it('every question has solutionText', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 3; i++) { const q = generateQuestion(s); expect(q.solutionText).toBeDefined(); expect(q.solutionText.length).toBeGreaterThan(0); } } });
  it('all answers are positive integers (degrees)', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 20; i++) { const q = generateQuestion(s); expect(q.answer).toBeGreaterThan(0); expect(Number.isInteger(q.answer)).toBe(true); } } });
});
