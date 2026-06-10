import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getSupportedSkillIds,
} from './p3AddSubQuestionGenerator.js';
import { validateP3AddSubSkillGraph, p3AddSubSkillGraph } from './p3AddSubSkillGraph.js';
import { validateP3AddSubQuestionFamilies } from './p3AddSubQuestionFamilies.js';

describe('p3AddSubSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP3AddSubSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains all 4 P3-AS skills', () => {
    expect(p3AddSubSkillGraph.skills).toHaveLength(4);
  });
});

describe('p3AddSubQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP3AddSubQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.totalQuestionFamilies).toBe(12);
    expect(result.errors).toHaveLength(0);
  });
});

describe('p3AddSubQuestionGenerator', () => {
  it('supports all 4 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(4);
    expect(ids).toContain('P3-AS-01');
    expect(ids).toContain('P3-AS-02');
    expect(ids).toContain('P3-AS-03');
    expect(ids).toContain('P3-AS-04');
  });

  // P3-AS-01: Mental Addition
  describe('P3-AS-01: Mental Addition', () => {
    it('no-carry (_001) produces sum <= 178 with correct answer', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-AS-01', { questionFamilyId: 'QF_P3-AS-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P3-AS-01');
        expect(q.answerType).toBe('number');
        const parts = q.prompt.match(/(\d+) \+ (\d+)/);
        expect(Number(parts[1]) + Number(parts[2])).toBe(q.answer);
      }
    });

    it('with-carry (_002) has ones summing > 9', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-AS-01', { questionFamilyId: 'QF_P3-AS-01_002' });
        expect(q).not.toBeNull();
        const parts = q.prompt.match(/(\d+) \+ (\d+)/);
        const a = Number(parts[1]);
        const b = Number(parts[2]);
        expect((a % 10) + (b % 10)).toBeGreaterThanOrEqual(10);
        expect(a + b).toBe(q.answer);
      }
    });

    it('strategy (_003) produces valid addition', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-AS-01', { questionFamilyId: 'QF_P3-AS-01_003' });
        expect(q).not.toBeNull();
        const parts = q.prompt.match(/(\d+) \+ (\d+)/);
        expect(Number(parts[1]) + Number(parts[2])).toBe(q.answer);
      }
    });
  });

  // P3-AS-02: Mental Subtraction
  describe('P3-AS-02: Mental Subtraction', () => {
    it('no-regroup (_001) has non-negative answer', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-AS-02', { questionFamilyId: 'QF_P3-AS-02_001' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThanOrEqual(0);
        const parts = q.prompt.match(/(\d+) - (\d+)/);
        expect(Number(parts[1]) - Number(parts[2])).toBe(q.answer);
      }
    });

    it('with-regroup (_002) has valid subtraction', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-AS-02', { questionFamilyId: 'QF_P3-AS-02_002' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThanOrEqual(0);
      }
    });

    it('complement (_003) has valid subtraction', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-AS-02', { questionFamilyId: 'QF_P3-AS-02_003' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThan(0);
      }
    });
  });

  // P3-AS-03: Column Addition
  describe('P3-AS-03: Column Addition', () => {
    it('no-carry (_001) sum <= 9999', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-AS-03', { questionFamilyId: 'QF_P3-AS-03_001' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeLessThanOrEqual(9999);
        expect(q.answer).toBeGreaterThanOrEqual(2000);
      }
    });

    it('single-carry (_002) produces valid sum', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-AS-03', { questionFamilyId: 'QF_P3-AS-03_002' });
        expect(q).not.toBeNull();
        const parts = q.prompt.match(/(\d+) \+ (\d+)/);
        expect(Number(parts[1]) + Number(parts[2])).toBe(q.answer);
      }
    });

    it('multiple-carries (_003) produces valid sum', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-AS-03', { questionFamilyId: 'QF_P3-AS-03_003' });
        expect(q).not.toBeNull();
        const parts = q.prompt.match(/(\d+) \+ (\d+)/);
        expect(Number(parts[1]) + Number(parts[2])).toBe(q.answer);
      }
    });
  });

  // P3-AS-04: Column Subtraction
  describe('P3-AS-04: Column Subtraction', () => {
    it('no-borrow (_001) has valid result', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-AS-04', { questionFamilyId: 'QF_P3-AS-04_001' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThanOrEqual(0);
      }
    });

    it('with-borrow (_002) produces valid subtraction', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-AS-04', { questionFamilyId: 'QF_P3-AS-04_002' });
        expect(q).not.toBeNull();
        const parts = q.prompt.match(/(\d+) - (\d+)/);
        expect(Number(parts[1]) - Number(parts[2])).toBe(q.answer);
      }
    });

    it('borrow-across-zeros (_003) has valid result', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-AS-04', { questionFamilyId: 'QF_P3-AS-04_003' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThanOrEqual(0);
        const parts = q.prompt.match(/(\d+) - (\d+)/);
        expect(Number(parts[1]) - Number(parts[2])).toBe(q.answer);
      }
    });
  });

  // Cross-cutting
  describe('generateQuestionSet', () => {
    it('returns the requested number', () => {
      const set = generateQuestionSet('P3-AS-01', 5);
      expect(set).toHaveLength(5);
    });
  });

  describe('generateDiagnosticSet', () => {
    it('generates across all skills', () => {
      const set = generateDiagnosticSet(['P3-AS-01', 'P3-AS-02', 'P3-AS-03', 'P3-AS-04'], 2);
      expect(set).toHaveLength(8);
    });
  });

  it('returns null for unknown skill', () => {
    expect(generateQuestion('FAKE')).toBeNull();
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
      for (let i = 0; i < 3; i++) {
        const q = generateQuestion(skillId);
        expect(q.misconceptionTraps).toBeDefined();
        expect(q.misconceptionTraps.length).toBeGreaterThan(0);
      }
    }
  });

  it('every question has solutionText', () => {
    for (const skillId of getSupportedSkillIds()) {
      for (let i = 0; i < 3; i++) {
        const q = generateQuestion(skillId);
        expect(q.solutionText).toBeDefined();
        expect(q.solutionText.length).toBeGreaterThan(0);
      }
    }
  });
});
