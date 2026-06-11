import { describe, it, expect } from 'vitest';
import { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds } from './p6CirclesQuestionGenerator.js';
import { validateP6CirclesSkillGraph, p6CirclesSkillGraph } from './p6CirclesSkillGraph.js';
import { validateP6CirclesQuestionFamilies } from './p6CirclesQuestionFamilies.js';
import { getMisconception, getMisconceptionsForSkill, getAllMisconceptions } from './p6CirclesMisconceptionMap.js';

describe('p6CirclesSkillGraph', () => {
  it('validates without errors', () => { const r = validateP6CirclesSkillGraph(); expect(r.isValid).toBe(true); expect(r.errors).toHaveLength(0); });
  it('contains 3 skills', () => { expect(p6CirclesSkillGraph.skills).toHaveLength(3); });
  it('has correct skill IDs', () => { expect(p6CirclesSkillGraph.skillIds).toEqual(['P6-CIR-01', 'P6-CIR-02', 'P6-CIR-03']); });
  it('has correct prerequisite chain', () => {
    const s1 = p6CirclesSkillGraph.skills.find((s) => s.id === 'P6-CIR-01');
    const s2 = p6CirclesSkillGraph.skills.find((s) => s.id === 'P6-CIR-02');
    const s3 = p6CirclesSkillGraph.skills.find((s) => s.id === 'P6-CIR-03');
    expect(s1.prerequisites).toContain('P5-GEO-01');
    expect(s2.prerequisites).toContain('P6-CIR-01');
    expect(s3.prerequisites).toContain('P6-CIR-02');
  });
  it('has difficulty 4-5', () => {
    p6CirclesSkillGraph.skills.forEach((s) => {
      expect(s.difficulty).toBeGreaterThanOrEqual(4);
      expect(s.difficulty).toBeLessThanOrEqual(5);
    });
  });
});

describe('p6CirclesQuestionFamilies', () => {
  it('validates without errors', () => { const r = validateP6CirclesQuestionFamilies(); expect(r.isValid).toBe(true); expect(r.totalQuestionFamilies).toBe(9); expect(r.errors).toHaveLength(0); });
  it('has 3 families per skill', () => {
    const r = validateP6CirclesQuestionFamilies();
    Object.values(r.familiesPerSkill).forEach((count) => {
      expect(count).toBe(3);
    });
  });
});

describe('p6CirclesMisconceptionMap', () => {
  it('has 8 misconceptions', () => { expect(getAllMisconceptions()).toHaveLength(8); });
  it('retrieves by tag', () => {
    const tags = [
      'uses_diameter_as_radius', 'forgets_straight_edge_in_semicircle',
      'area_uses_diameter_not_radius', 'confuses_circumference_area_formulas',
      'wrong_fraction_for_quadrant', 'forgets_to_halve_for_semicircle',
      'pi_approximation_error', 'adds_full_circumference_to_semicircle',
    ];
    tags.forEach((tag) => {
      expect(getMisconception(tag)).not.toBeNull();
      expect(getMisconception(tag).tag).toBe(tag);
    });
  });
  it('returns misconceptions for each skill', () => {
    expect(getMisconceptionsForSkill('P6-CIR-01').length).toBeGreaterThanOrEqual(1);
    expect(getMisconceptionsForSkill('P6-CIR-02').length).toBeGreaterThanOrEqual(1);
    expect(getMisconceptionsForSkill('P6-CIR-03').length).toBeGreaterThanOrEqual(1);
  });
  it('every misconception has remediation fields', () => {
    getAllMisconceptions().forEach((m) => {
      expect(m.remediationExplanation).toBeDefined();
      expect(m.remediationExplanation.length).toBeGreaterThan(0);
      expect(m.visualScaffold).toBeDefined();
      expect(m.recheckPattern).toBeDefined();
      expect(m.parentNote).toBeDefined();
    });
  });
});

describe('p6CirclesQuestionGenerator', () => {
  it('supports 3 skill IDs', () => { const ids = getSupportedSkillIds(); expect(ids).toHaveLength(3); expect(ids).toContain('P6-CIR-01'); expect(ids).toContain('P6-CIR-02'); expect(ids).toContain('P6-CIR-03'); });

  describe('P6-CIR-01: Circumference of Circle', () => {
    it('circumference from diameter with pi=22/7 (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-CIR-01', { questionFamilyId: 'QF_P6-CIR-01_001' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('number');
        expect(q.prompt).toContain('diameter');
        expect(q.prompt).toContain('22/7');
        const m = q.prompt.match(/diameter (\d+) cm/);
        expect(m).not.toBeNull();
        const d = Number(m[1]);
        expect(d % 7).toBe(0);
        expect(q.answer).toBe((22 / 7) * d);
        expect(Number.isInteger(q.answer)).toBe(true);
      }
    });

    it('circumference from radius with pi=22/7 (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-CIR-01', { questionFamilyId: 'QF_P6-CIR-01_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('radius');
        expect(q.prompt).toContain('22/7');
        const m = q.prompt.match(/radius (\d+) cm/);
        expect(m).not.toBeNull();
        const r = Number(m[1]);
        expect(r % 7).toBe(0);
        expect(q.answer).toBe(2 * (22 / 7) * r);
        expect(Number.isInteger(q.answer)).toBe(true);
      }
    });

    it('circumference with pi=3.14 (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-CIR-01', { questionFamilyId: 'QF_P6-CIR-01_003' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('3.14');
        const m = q.prompt.match(/diameter (\d+) cm/);
        expect(m).not.toBeNull();
        const d = Number(m[1]);
        expect(q.answer).toBeCloseTo(3.14 * d, 5);
      }
    });
  });

  describe('P6-CIR-02: Area of Circle', () => {
    it('area from radius with pi=22/7 (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-CIR-02', { questionFamilyId: 'QF_P6-CIR-02_001' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('radius');
        expect(q.prompt).toContain('22/7');
        const m = q.prompt.match(/radius (\d+) cm/);
        expect(m).not.toBeNull();
        const r = Number(m[1]);
        expect(r % 7).toBe(0);
        expect(q.answer).toBe((22 / 7) * r * r);
        expect(Number.isInteger(q.answer)).toBe(true);
      }
    });

    it('area from diameter with pi=22/7 (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-CIR-02', { questionFamilyId: 'QF_P6-CIR-02_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('diameter');
        expect(q.prompt).toContain('22/7');
        const m = q.prompt.match(/diameter.*?(\d+) cm/);
        expect(m).not.toBeNull();
        const d = Number(m[1]);
        const r = d / 2;
        expect(r % 7).toBe(0);
        expect(q.answer).toBe((22 / 7) * r * r);
        expect(Number.isInteger(q.answer)).toBe(true);
      }
    });

    it('area with pi=3.14 (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-CIR-02', { questionFamilyId: 'QF_P6-CIR-02_003' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('3.14');
        const m = q.prompt.match(/radius (\d+) cm/);
        expect(m).not.toBeNull();
        const r = Number(m[1]);
        expect(q.answer).toBeCloseTo(3.14 * r * r, 5);
      }
    });
  });

  describe('P6-CIR-03: Composite Figures with Circles', () => {
    it('perimeter of semicircle (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-CIR-03', { questionFamilyId: 'QF_P6-CIR-03_001' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('semicircle');
        expect(q.prompt).toContain('22/7');
        const m = q.prompt.match(/diameter (\d+) cm/);
        expect(m).not.toBeNull();
        const d = Number(m[1]);
        expect(d % 7).toBe(0);
        const expected = (22 / 7) * d / 2 + d;
        expect(q.answer).toBe(expected);
        expect(Number.isInteger(q.answer)).toBe(true);
      }
    });

    it('area of quadrant (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-CIR-03', { questionFamilyId: 'QF_P6-CIR-03_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('quadrant');
        expect(q.prompt).toContain('22/7');
        const m = q.prompt.match(/radius (\d+) cm/);
        expect(m).not.toBeNull();
        const r = Number(m[1]);
        expect(r % 14).toBe(0); // multiples of 14 ensure integer quadrant area
        const expected = (22 / 7) * r * r / 4;
        expect(q.answer).toBe(expected);
        expect(Number.isInteger(q.answer)).toBe(true);
      }
    });

    it('composite square with semicircles (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-CIR-03', { questionFamilyId: 'QF_P6-CIR-03_003' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('square');
        expect(q.prompt).toContain('semicircle');
        expect(q.prompt).toContain('22/7');
        const m = q.prompt.match(/side (\d+) cm/);
        expect(m).not.toBeNull();
        const side = Number(m[1]);
        expect(side % 14).toBe(0); // multiples of 14 ensure integer answers
        if (q.prompt.toLowerCase().includes('perimeter')) {
          const expected = (22 / 7) * side + 2 * side;
          expect(q.answer).toBe(expected);
        } else {
          const r = side / 2;
          const expected = side * side + (22 / 7) * r * r;
          expect(q.answer).toBe(expected);
        }
        expect(Number.isInteger(q.answer)).toBe(true);
      }
    });
  });

  describe('generateQuestionSet', () => {
    it('returns requested count', () => { const s = generateQuestionSet('P6-CIR-01', 5); expect(s).toHaveLength(5); });
  });

  describe('generateDiagnosticSet', () => {
    it('covers all skills', () => { const s = generateDiagnosticSet(['P6-CIR-01', 'P6-CIR-02', 'P6-CIR-03'], 2); expect(s).toHaveLength(6); expect(new Set(s.map((q) => q.skillId)).size).toBe(3); });
  });

  it('returns null for unknown skill', () => { expect(generateQuestion('FAKE')).toBeNull(); });
  it('every question has unique questionId', () => { const ids = new Set(); for (const s of getSupportedSkillIds()) { for (let i = 0; i < 5; i++) { const q = generateQuestion(s); expect(ids.has(q.questionId)).toBe(false); ids.add(q.questionId); } } });
  it('every question has misconceptionTraps', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 5; i++) { const q = generateQuestion(s); expect(q.misconceptionTraps).toBeDefined(); expect(q.misconceptionTraps.length).toBeGreaterThan(0); } } });
  it('every question has solutionText', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 5; i++) { const q = generateQuestion(s); expect(q.solutionText).toBeDefined(); expect(q.solutionText.length).toBeGreaterThan(0); } } });
  it('all answers are positive numbers', () => { for (const s of getSupportedSkillIds()) { for (let i = 0; i < 10; i++) { const q = generateQuestion(s); expect(q.answer).toBeGreaterThan(0); expect(typeof q.answer).toBe('number'); } } });
});
