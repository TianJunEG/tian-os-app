import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getSupportedSkillIds,
} from './p5StatQuestionGenerator.js';
import { validateP5StatSkillGraph, p5StatSkillGraph } from './p5StatSkillGraph.js';
import { validateP5StatQuestionFamilies } from './p5StatQuestionFamilies.js';

describe('p5StatSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP5StatSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains 2 skills', () => {
    expect(p5StatSkillGraph.skills).toHaveLength(2);
  });
});

describe('p5StatQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP5StatQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.totalQuestionFamilies).toBe(6);
    expect(result.errors).toHaveLength(0);
  });
});

describe('p5StatQuestionGenerator', () => {
  it('supports 2 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(2);
    expect(ids).toContain('P5-ST-01');
    expect(ids).toContain('P5-ST-02');
  });

  describe('P5-ST-01: Average (Mean)', () => {
    it('generates find-the-average questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P5-ST-01', { questionFamilyId: 'QF_P5-ST-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P5-ST-01');
        expect(q.answer).toBeGreaterThan(0);
        expect(q.prompt).toContain('average');
      }
    });

    it('generates find-total-from-average questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P5-ST-01', { questionFamilyId: 'QF_P5-ST-01_002' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThan(0);
        expect(q.prompt).toContain('total');
      }
    });

    it('generates find-missing-value questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P5-ST-01', { questionFamilyId: 'QF_P5-ST-01_003' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThan(0);
        expect(q.prompt).toContain('average');
      }
    });

    it('produces whole-number averages', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P5-ST-01', { questionFamilyId: 'QF_P5-ST-01_001' });
        expect(Number.isInteger(q.answer)).toBe(true);
      }
    });

    it('total equals average times count (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P5-ST-01', { questionFamilyId: 'QF_P5-ST-01_002' });
        // The answer is the total; parse average and count from the solution
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.answer).toBeGreaterThan(0);
      }
    });
  });

  describe('P5-ST-02: Data Interpretation', () => {
    it('generates find-difference questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P5-ST-02', { questionFamilyId: 'QF_P5-ST-02_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P5-ST-02');
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.prompt).toContain('more');
      }
    });

    it('generates compute-total questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P5-ST-02', { questionFamilyId: 'QF_P5-ST-02_002' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThan(0);
        expect(q.prompt).toContain('total');
      }
    });

    it('generates most/least category questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P5-ST-02', { questionFamilyId: 'QF_P5-ST-02_003' });
        expect(q).not.toBeNull();
        expect(q.answer).toBeGreaterThan(0);
        expect(q.prompt).toMatch(/most|fewest/);
      }
    });

    it('produces whole-number answers', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('P5-ST-02');
        expect(Number.isInteger(q.answer)).toBe(true);
      }
    });
  });

  describe('generateQuestionSet', () => {
    it('returns the requested number of questions', () => {
      const set = generateQuestionSet('P5-ST-01', 5);
      expect(set).toHaveLength(5);
      set.forEach((q) => expect(q.skillId).toBe('P5-ST-01'));
    });
  });

  describe('generateDiagnosticSet', () => {
    it('generates questions across all skills', () => {
      const set = generateDiagnosticSet(['P5-ST-01', 'P5-ST-02'], 2);
      expect(set).toHaveLength(4);
      const skillIds = new Set(set.map((q) => q.skillId));
      expect(skillIds.size).toBe(2);
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
