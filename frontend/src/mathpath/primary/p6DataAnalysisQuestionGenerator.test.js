import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getSupportedSkillIds,
} from './p6DataAnalysisQuestionGenerator.js';
import { validateP6DataAnalysisSkillGraph, p6DataAnalysisSkillGraph } from './p6DataAnalysisSkillGraph.js';
import { validateP6DataAnalysisQuestionFamilies } from './p6DataAnalysisQuestionFamilies.js';

// ---------------------------------------------------------------------------
// Skill graph validation
// ---------------------------------------------------------------------------

describe('p6DataAnalysisSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP6DataAnalysisSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains exactly 2 P6-DA skills', () => {
    expect(p6DataAnalysisSkillGraph.skills).toHaveLength(2);
    expect(p6DataAnalysisSkillGraph.skills[0].id).toBe('P6-DA-01');
    expect(p6DataAnalysisSkillGraph.skills[1].id).toBe('P6-DA-02');
  });

  it('has correct prerequisites', () => {
    const s1 = p6DataAnalysisSkillGraph.skills[0];
    const s2 = p6DataAnalysisSkillGraph.skills[1];
    expect(s1.prerequisites).toContain('P5-ST-01');
    expect(s2.prerequisites).toContain('P5-ST-02');
  });

  it('has difficulty 3-4', () => {
    for (const skill of p6DataAnalysisSkillGraph.skills) {
      expect(skill.difficulty).toBeGreaterThanOrEqual(3);
      expect(skill.difficulty).toBeLessThanOrEqual(4);
    }
  });
});

// ---------------------------------------------------------------------------
// Question families validation
// ---------------------------------------------------------------------------

describe('p6DataAnalysisQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP6DataAnalysisQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.totalQuestionFamilies).toBe(6);
    expect(result.errors).toHaveLength(0);
  });

  it('has 3 families per skill', () => {
    const result = validateP6DataAnalysisQuestionFamilies();
    expect(result.familiesPerSkill['P6-DA-01']).toBe(3);
    expect(result.familiesPerSkill['P6-DA-02']).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Generator: skill coverage
// ---------------------------------------------------------------------------

describe('p6DataAnalysisQuestionGenerator', () => {
  it('supports exactly 2 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(2);
    expect(ids).toContain('P6-DA-01');
    expect(ids).toContain('P6-DA-02');
  });

  // -------------------------------------------------------------------------
  // P6-DA-01: Pie Charts
  // -------------------------------------------------------------------------

  describe('P6-DA-01: Pie Charts', () => {
    it('generates quantity-from-fraction questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-DA-01', { questionFamilyId: 'QF_P6-DA-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P6-DA-01');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThan(0);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.prompt).toMatch(/pie chart/i);
        expect(q.solutionText).toBeDefined();
        expect(q.solutionText.length).toBeGreaterThan(0);
      }
    });

    it('generates quantity-from-percentage questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-DA-01', { questionFamilyId: 'QF_P6-DA-01_002' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P6-DA-01');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThan(0);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.prompt).toMatch(/%/);
        expect(q.solutionText).toBeDefined();
      }
    });

    it('generates find-percentage questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-DA-01', { questionFamilyId: 'QF_P6-DA-01_003' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P6-DA-01');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThan(0);
        expect(q.answer).toBeLessThanOrEqual(100);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.prompt).toMatch(/percentage/i);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P6-DA-02: Average & Data Interpretation
  // -------------------------------------------------------------------------

  describe('P6-DA-02: Average & Data Interpretation', () => {
    it('generates calculate-average questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-DA-02', { questionFamilyId: 'QF_P6-DA-02_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P6-DA-02');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(50);
        expect(q.answer).toBeLessThanOrEqual(100);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.prompt).toMatch(/average/i);
        expect(q.solutionText).toMatch(/Average/);
      }
    });

    it('generates find-missing-value questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-DA-02', { questionFamilyId: 'QF_P6-DA-02_002' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P6-DA-02');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(3);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.prompt).toMatch(/average/i);
        expect(q.prompt).toContain('?');
        expect(q.solutionText).toMatch(/Missing/);
      }
    });

    it('generates interpret-table questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P6-DA-02', { questionFamilyId: 'QF_P6-DA-02_003' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P6-DA-02');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThan(0);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.prompt).toMatch(/table/i);
      }
    });
  });

  // -------------------------------------------------------------------------
  // generateQuestionSet
  // -------------------------------------------------------------------------

  describe('generateQuestionSet', () => {
    it('returns the requested number of questions', () => {
      const set = generateQuestionSet('P6-DA-01', 5);
      expect(set).toHaveLength(5);
      set.forEach((q) => expect(q.skillId).toBe('P6-DA-01'));
    });

    it('defaults to 5 questions', () => {
      const set = generateQuestionSet('P6-DA-02');
      expect(set).toHaveLength(5);
    });
  });

  // -------------------------------------------------------------------------
  // generateDiagnosticSet
  // -------------------------------------------------------------------------

  describe('generateDiagnosticSet', () => {
    it('generates questions across all skills', () => {
      const skills = ['P6-DA-01', 'P6-DA-02'];
      const set = generateDiagnosticSet(skills, 3);
      expect(set).toHaveLength(6);
      const skillIds = new Set(set.map((q) => q.skillId));
      expect(skillIds.size).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases and cross-cutting concerns
  // -------------------------------------------------------------------------

  it('returns null for unknown skill', () => {
    expect(generateQuestion('FAKE-SKILL')).toBeNull();
    expect(generateQuestion('P6-DA-99')).toBeNull();
  });

  it('every question has a unique questionId', () => {
    const ids = new Set();
    for (const skillId of getSupportedSkillIds()) {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion(skillId);
        expect(ids.has(q.questionId)).toBe(false);
        ids.add(q.questionId);
      }
    }
  });

  it('every question has misconceptionTraps', () => {
    for (const skillId of getSupportedSkillIds()) {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion(skillId);
        expect(q.misconceptionTraps).toBeDefined();
        expect(q.misconceptionTraps.length).toBeGreaterThan(0);
      }
    }
  });

  it('every question has solutionText', () => {
    for (const skillId of getSupportedSkillIds()) {
      for (let i = 0; i < 5; i++) {
        const q = generateQuestion(skillId);
        expect(q.solutionText).toBeDefined();
        expect(q.solutionText.length).toBeGreaterThan(0);
      }
    }
  });
});
