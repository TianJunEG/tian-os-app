import { describe, it, expect } from 'vitest';
import { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds } from './p5WordProbQuestionGenerator.js';
import { validateP5WordProbSkillGraph, p5WordProbSkillGraph } from './p5WordProbSkillGraph.js';
import { validateP5WordProbQuestionFamilies } from './p5WordProbQuestionFamilies.js';

describe('p5WordProbSkillGraph', () => {
  it('validates without errors', () => { const r = validateP5WordProbSkillGraph(); expect(r.isValid).toBe(true); expect(r.errors).toHaveLength(0); });
  it('contains 3 skills', () => { expect(p5WordProbSkillGraph.skills).toHaveLength(3); });
});

describe('p5WordProbQuestionFamilies', () => {
  it('validates without errors', () => { const r = validateP5WordProbQuestionFamilies(); expect(r.isValid).toBe(true); expect(r.totalQuestionFamilies).toBe(9); expect(r.errors).toHaveLength(0); });
});

describe('p5WordProbQuestionGenerator', () => {
  it('supports 3 skill IDs', () => { const ids = getSupportedSkillIds(); expect(ids).toHaveLength(3); expect(ids).toContain('P5-WP-01'); expect(ids).toContain('P5-WP-02'); expect(ids).toContain('P5-WP-03'); });

  describe('P5-WP-01: Multi-step Problems', () => {
    it('generates shopping problems (_001)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-WP-01', { questionFamilyId: 'QF_P5-WP-01_001' }); expect(q).not.toBeNull(); expect(typeof q.answer).toBe('number'); expect(q.answer).toBeGreaterThan(0); } });
    it('generates distribution problems (_002)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-WP-01', { questionFamilyId: 'QF_P5-WP-01_002' }); expect(q).not.toBeNull(); expect(typeof q.answer).toBe('number'); } });
    it('generates comparison problems (_003)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-WP-01', { questionFamilyId: 'QF_P5-WP-01_003' }); expect(q).not.toBeNull(); expect(typeof q.answer).toBe('number'); } });
  });

  describe('P5-WP-02: Before-After Problems', () => {
    it('generates gave-away problems (_001)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-WP-02', { questionFamilyId: 'QF_P5-WP-02_001' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); } });
    it('generates spent-some problems (_002)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-WP-02', { questionFamilyId: 'QF_P5-WP-02_002' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); } });
    it('generates received-more problems (_003)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-WP-02', { questionFamilyId: 'QF_P5-WP-02_003' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); } });
  });

  describe('P5-WP-03: Rate & Unit Cost', () => {
    it('generates unit cost problems (_001)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-WP-03', { questionFamilyId: 'QF_P5-WP-03_001' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); } });
    it('generates speed problems (_002)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-WP-03', { questionFamilyId: 'QF_P5-WP-03_002' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); } });
    it('generates total-from-rate problems (_003)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-WP-03', { questionFamilyId: 'QF_P5-WP-03_003' }); expect(q).not.toBeNull(); expect(q.answer).toBeGreaterThan(0); } });
  });

  describe('generateQuestionSet', () => { it('returns requested count', () => { const s = generateQuestionSet('P5-WP-01', 5); expect(s).toHaveLength(5); }); });
  describe('generateDiagnosticSet', () => { it('covers all skills', () => { const s = generateDiagnosticSet(['P5-WP-01', 'P5-WP-02', 'P5-WP-03'], 2); expect(s).toHaveLength(6); expect(new Set(s.map((q) => q.skillId)).size).toBe(3); }); });

  it('returns null for unknown skill', () => { expect(generateQuestion('FAKE')).toBeNull(); });
  it('every question has unique questionId', () => { const ids = new Set(); for (const s of getSupportedSkillIds()) { for (let i = 0; i < 5; i++) { const q = generateQuestion(s); expect(ids.has(q.questionId)).toBe(false); ids.add(q.questionId); } } });
  it('every question has misconceptionTraps', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 3; i++) { const q = generateQuestion(s); expect(q.misconceptionTraps).toBeDefined(); expect(q.misconceptionTraps.length).toBeGreaterThan(0); } } });
  it('every question has solutionText', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 3; i++) { const q = generateQuestion(s); expect(q.solutionText).toBeDefined(); expect(q.solutionText.length).toBeGreaterThan(0); } } });
});
