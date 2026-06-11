import { describe, it, expect } from 'vitest';
import { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds } from './p5DecimalsQuestionGenerator.js';
import { validateP5DecimalsSkillGraph, p5DecimalsSkillGraph } from './p5DecimalsSkillGraph.js';
import { validateP5DecimalsQuestionFamilies } from './p5DecimalsQuestionFamilies.js';

describe('p5DecimalsSkillGraph', () => {
  it('validates without errors', () => { const r = validateP5DecimalsSkillGraph(); expect(r.isValid).toBe(true); expect(r.errors).toHaveLength(0); });
  it('contains 3 skills', () => { expect(p5DecimalsSkillGraph.skills).toHaveLength(3); });
});

describe('p5DecimalsQuestionFamilies', () => {
  it('validates without errors', () => { const r = validateP5DecimalsQuestionFamilies(); expect(r.isValid).toBe(true); expect(r.totalQuestionFamilies).toBe(9); expect(r.errors).toHaveLength(0); });
});

describe('p5DecimalsQuestionGenerator', () => {
  it('supports 3 skill IDs', () => { const ids = getSupportedSkillIds(); expect(ids).toHaveLength(3); expect(ids).toContain('P5-DEC-01'); expect(ids).toContain('P5-DEC-02'); expect(ids).toContain('P5-DEC-03'); });

  describe('P5-DEC-01: Place Value & Rounding', () => {
    it('generates digit-value questions (_001)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-DEC-01', { questionFamilyId: 'QF_P5-DEC-01_001' }); expect(q).not.toBeNull(); expect(q.prompt).toContain('value'); expect(typeof q.answer).toBe('number'); } });
    it('generates round-to-1dp questions (_002)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-DEC-01', { questionFamilyId: 'QF_P5-DEC-01_002' }); expect(q).not.toBeNull(); expect(q.prompt).toContain('1 decimal place'); expect(typeof q.answer).toBe('number'); } });
    it('generates round-to-2dp questions (_003)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-DEC-01', { questionFamilyId: 'QF_P5-DEC-01_003' }); expect(q).not.toBeNull(); expect(q.prompt).toContain('2 decimal places'); expect(typeof q.answer).toBe('number'); } });
  });

  describe('P5-DEC-02: Four Operations', () => {
    it('generates add/subtract questions (_001)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-DEC-02', { questionFamilyId: 'QF_P5-DEC-02_001' }); expect(q).not.toBeNull(); expect(q.prompt).toContain('Calculate'); expect(typeof q.answer).toBe('number'); expect(q.answer).toBeGreaterThan(0); } });
    it('generates multiply-decimal-by-whole questions (_002)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-DEC-02', { questionFamilyId: 'QF_P5-DEC-02_002' }); expect(q).not.toBeNull(); expect(q.prompt).toContain('×'); expect(typeof q.answer).toBe('number'); } });
    it('generates divide-decimal-by-whole questions (_003)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-DEC-02', { questionFamilyId: 'QF_P5-DEC-02_003' }); expect(q).not.toBeNull(); expect(q.prompt).toContain('÷'); expect(typeof q.answer).toBe('number'); expect(q.answer).toBeGreaterThan(0); } });
    it('produces exact decimal results (no floating-point drift)', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P5-DEC-02');
        if (typeof q.answer === 'number') {
          const s = String(q.answer);
          const decPart = s.includes('.') ? s.split('.')[1] : '';
          expect(decPart.length).toBeLessThanOrEqual(3);
        }
      }
    });
  });

  describe('P5-DEC-03: Fraction-Decimal Conversion', () => {
    it('generates fraction-to-decimal questions (_001)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-DEC-03', { questionFamilyId: 'QF_P5-DEC-03_001' }); expect(q).not.toBeNull(); expect(q.prompt).toContain('Convert'); expect(q.prompt).toContain('decimal'); expect(typeof q.answer).toBe('number'); } });
    it('generates decimal-to-fraction questions (_002)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-DEC-03', { questionFamilyId: 'QF_P5-DEC-03_002' }); expect(q).not.toBeNull(); expect(q.prompt).toContain('simplest form'); expect(q.answerType).toBe('text'); expect(q.answer).toContain('/'); } });
    it('generates mixed-conversion questions (_003)', () => { for (let i = 0; i < 10; i++) { const q = generateQuestion('P5-DEC-03', { questionFamilyId: 'QF_P5-DEC-03_003' }); expect(q).not.toBeNull(); expect(q.prompt).toContain('Convert'); } });
  });

  describe('generateQuestionSet', () => { it('returns requested count', () => { const s = generateQuestionSet('P5-DEC-01', 5); expect(s).toHaveLength(5); }); });
  describe('generateDiagnosticSet', () => { it('covers all skills', () => { const s = generateDiagnosticSet(['P5-DEC-01', 'P5-DEC-02', 'P5-DEC-03'], 2); expect(s).toHaveLength(6); expect(new Set(s.map((q) => q.skillId)).size).toBe(3); }); });

  it('returns null for unknown skill', () => { expect(generateQuestion('FAKE')).toBeNull(); });
  it('every question has unique questionId', () => { const ids = new Set(); for (const s of getSupportedSkillIds()) { for (let i = 0; i < 5; i++) { const q = generateQuestion(s); expect(ids.has(q.questionId)).toBe(false); ids.add(q.questionId); } } });
  it('every question has misconceptionTraps', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 3; i++) { const q = generateQuestion(s); expect(q.misconceptionTraps).toBeDefined(); expect(q.misconceptionTraps.length).toBeGreaterThan(0); } } });
  it('every question has solutionText', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 3; i++) { const q = generateQuestion(s); expect(q.solutionText).toBeDefined(); expect(q.solutionText.length).toBeGreaterThan(0); } } });
});
