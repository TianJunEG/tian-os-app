import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getSupportedSkillIds,
} from './p2AddSubQuestionGenerator.js';
import { validateP2AddSubSkillGraph, p2AddSubSkillGraph } from './p2AddSubSkillGraph.js';
import { validateP2AddSubQuestionFamilies } from './p2AddSubQuestionFamilies.js';

describe('p2AddSubSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP2AddSubSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains all 4 P2-AS skills', () => {
    expect(p2AddSubSkillGraph.skills).toHaveLength(4);
  });
});

describe('p2AddSubQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP2AddSubQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.totalQuestionFamilies).toBe(12);
    expect(result.errors).toHaveLength(0);
  });
});

describe('p2AddSubQuestionGenerator', () => {
  it('supports all 4 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(4);
    expect(ids).toContain('P2-AS-01');
    expect(ids).toContain('P2-AS-02');
    expect(ids).toContain('P2-AS-03');
    expect(ids).toContain('P2-AS-04');
  });

  // P2-AS-01: Mental Addition (3-digit + ones/tens/hundreds)
  describe('P2-AS-01: Mental Addition', () => {
    it('add ones (_001) produces sum <= 999 with correct answer', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P2-AS-01', { questionFamilyId: 'QF_P2-AS-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P2-AS-01');
        expect(q.answerType).toBe('number');
        const parts = q.prompt.match(/(\d+) \+ (\d+)/);
        const a = Number(parts[1]);
        const b = Number(parts[2]);
        expect(a).toBeGreaterThanOrEqual(100);
        expect(a).toBeLessThanOrEqual(999);
        expect(b).toBeGreaterThanOrEqual(1);
        expect(b).toBeLessThanOrEqual(9);
        expect(a + b).toBe(q.answer);
        expect(q.answer).toBeLessThanOrEqual(999);
      }
    });

    it('add tens (_002) adds a multiple of 10', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P2-AS-01', { questionFamilyId: 'QF_P2-AS-01_002' });
        expect(q).not.toBeNull();
        const parts = q.prompt.match(/(\d+) \+ (\d+)/);
        const a = Number(parts[1]);
        const b = Number(parts[2]);
        expect(a).toBeGreaterThanOrEqual(100);
        expect(b % 10).toBe(0);
        expect(b).toBeGreaterThanOrEqual(10);
        expect(b).toBeLessThanOrEqual(90);
        expect(a + b).toBe(q.answer);
        expect(q.answer).toBeLessThanOrEqual(999);
      }
    });

    it('add hundreds (_003) adds a multiple of 100', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P2-AS-01', { questionFamilyId: 'QF_P2-AS-01_003' });
        expect(q).not.toBeNull();
        const parts = q.prompt.match(/(\d+) \+ (\d+)/);
        const a = Number(parts[1]);
        const b = Number(parts[2]);
        expect(a).toBeGreaterThanOrEqual(100);
        expect(b % 100).toBe(0);
        expect(b).toBeGreaterThanOrEqual(100);
        expect(b).toBeLessThanOrEqual(800);
        expect(a + b).toBe(q.answer);
        expect(q.answer).toBeLessThanOrEqual(999);
      }
    });
  });

  // P2-AS-02: Mental Subtraction (3-digit - ones/tens/hundreds)
  describe('P2-AS-02: Mental Subtraction', () => {
    it('subtract ones (_001) has non-negative answer', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P2-AS-02', { questionFamilyId: 'QF_P2-AS-02_001' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThanOrEqual(0);
        const parts = q.prompt.match(/(\d+) - (\d+)/);
        const a = Number(parts[1]);
        const b = Number(parts[2]);
        expect(a).toBeGreaterThanOrEqual(100);
        expect(b).toBeGreaterThanOrEqual(1);
        expect(b).toBeLessThanOrEqual(9);
        expect(a - b).toBe(q.answer);
      }
    });

    it('subtract tens (_002) subtracts a multiple of 10', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P2-AS-02', { questionFamilyId: 'QF_P2-AS-02_002' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThanOrEqual(0);
        const parts = q.prompt.match(/(\d+) - (\d+)/);
        const a = Number(parts[1]);
        const b = Number(parts[2]);
        expect(a).toBeGreaterThanOrEqual(100);
        expect(b % 10).toBe(0);
        expect(b).toBeGreaterThanOrEqual(10);
        expect(a - b).toBe(q.answer);
      }
    });

    it('subtract hundreds (_003) subtracts a multiple of 100, result >= 100', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P2-AS-02', { questionFamilyId: 'QF_P2-AS-02_003' });
        expect(q).not.toBeNull();
        const parts = q.prompt.match(/(\d+) - (\d+)/);
        const a = Number(parts[1]);
        const b = Number(parts[2]);
        expect(a).toBeGreaterThanOrEqual(200);
        expect(b % 100).toBe(0);
        expect(b).toBeGreaterThanOrEqual(100);
        expect(a - b).toBe(q.answer);
        expect(q.answer).toBeGreaterThanOrEqual(100);
      }
    });
  });

  // P2-AS-03: Addition within 1000
  describe('P2-AS-03: Column Addition within 1000', () => {
    it('no-regroup (_001) sum <= 999', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P2-AS-03', { questionFamilyId: 'QF_P2-AS-03_001' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeLessThanOrEqual(999);
        expect(q.answer).toBeGreaterThanOrEqual(200);
        const parts = q.prompt.match(/(\d+) \+ (\d+)/);
        expect(Number(parts[1]) + Number(parts[2])).toBe(q.answer);
      }
    });

    it('with-regroup (_002) produces valid sum', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P2-AS-03', { questionFamilyId: 'QF_P2-AS-03_002' });
        expect(q).not.toBeNull();
        const parts = q.prompt.match(/(\d+) \+ (\d+)/);
        expect(Number(parts[1]) + Number(parts[2])).toBe(q.answer);
        expect(q.answer).toBeLessThanOrEqual(999);
      }
    });

    it('word context (_003) produces valid addition', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-AS-03', { questionFamilyId: 'QF_P2-AS-03_003' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThan(0);
        expect(q.answer).toBeLessThanOrEqual(999);
        expect(q.prompt.length).toBeGreaterThan(20); // word problem
      }
    });
  });

  // P2-AS-04: Subtraction within 1000
  describe('P2-AS-04: Column Subtraction within 1000', () => {
    it('no-borrow (_001) has valid result', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P2-AS-04', { questionFamilyId: 'QF_P2-AS-04_001' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThanOrEqual(0);
        const parts = q.prompt.match(/(\d+) - (\d+)/);
        expect(Number(parts[1]) - Number(parts[2])).toBe(q.answer);
      }
    });

    it('with-borrow (_002) produces valid subtraction', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P2-AS-04', { questionFamilyId: 'QF_P2-AS-04_002' });
        expect(q).not.toBeNull();
        const parts = q.prompt.match(/(\d+) - (\d+)/);
        expect(Number(parts[1]) - Number(parts[2])).toBe(q.answer);
        expect(q.answer).toBeGreaterThanOrEqual(0);
      }
    });

    it('word context (_003) produces valid subtraction', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-AS-04', { questionFamilyId: 'QF_P2-AS-04_003' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.prompt.length).toBeGreaterThan(20); // word problem
      }
    });
  });

  // Cross-cutting
  describe('generateQuestionSet', () => {
    it('returns the requested number', () => {
      const set = generateQuestionSet('P2-AS-01', 5);
      expect(set).toHaveLength(5);
    });
  });

  describe('generateDiagnosticSet', () => {
    it('generates across all skills', () => {
      const set = generateDiagnosticSet(['P2-AS-01', 'P2-AS-02', 'P2-AS-03', 'P2-AS-04'], 2);
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
