import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getSupportedSkillIds,
} from './p3MeasTimeQuestionGenerator.js';
import { validateP3MeasTimeSkillGraph, p3MeasTimeSkillGraph } from './p3MeasTimeSkillGraph.js';
import { validateP3MeasTimeQuestionFamilies } from './p3MeasTimeQuestionFamilies.js';

// ---------------------------------------------------------------------------
// Skill graph validation
// ---------------------------------------------------------------------------

describe('p3MeasTimeSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP3MeasTimeSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains all 4 P3-MT skills', () => {
    expect(p3MeasTimeSkillGraph.skills).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// Question families validation
// ---------------------------------------------------------------------------

describe('p3MeasTimeQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP3MeasTimeQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.totalQuestionFamilies).toBe(12);
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

describe('p3MeasTimeQuestionGenerator', () => {
  it('supports all 4 skill IDs', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(4);
    expect(ids).toContain('P3-MT-01');
    expect(ids).toContain('P3-MT-02');
    expect(ids).toContain('P3-MT-03');
    expect(ids).toContain('P3-MT-04');
  });

  // -------------------------------------------------------------------------
  // P3-MT-01: Compound Units
  // -------------------------------------------------------------------------

  describe('P3-MT-01: Compound Units', () => {
    it('generates m & cm → cm (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MT-01', { questionFamilyId: 'QF_P3-MT-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P3-MT-01');
        expect(q.prompt).toContain('m');
        expect(q.prompt).toContain('cm');
        // Verify arithmetic
        const match = q.prompt.match(/(\d+) m (\d+) cm/);
        expect(match).not.toBeNull();
        expect(q.answer).toBe(Number(match[1]) * 100 + Number(match[2]));
      }
    });

    it('generates kg & g → g (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MT-01', { questionFamilyId: 'QF_P3-MT-01_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('kg');
        expect(q.prompt).toContain(' g');
        const match = q.prompt.match(/(\d+) kg (\d+) g/);
        expect(match).not.toBeNull();
        expect(q.answer).toBe(Number(match[1]) * 1000 + Number(match[2]));
      }
    });

    it('generates km/m or L/mL conversions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MT-01', { questionFamilyId: 'QF_P3-MT-01_003' });
        expect(q).not.toBeNull();
        // Should be either km & m or L & mL
        const isKm = q.prompt.includes('km');
        const isL = q.prompt.includes(' L ');
        expect(isKm || isL).toBe(true);
        expect(q.answer).toBeGreaterThan(0);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P3-MT-02: Telling Time
  // -------------------------------------------------------------------------

  describe('P3-MT-02: Telling Time', () => {
    it('generates exact-five-minute time (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MT-02', { questionFamilyId: 'QF_P3-MT-02_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P3-MT-02');
        expect(q.answerType).toBe('text');
        // Answer should be h:mm where mm is a multiple of 5
        const match = q.answer.match(/^(\d+):(\d{2})$/);
        expect(match).not.toBeNull();
        expect(Number(match[2]) % 5).toBe(0);
      }
    });

    it('generates between-numbers time (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MT-02', { questionFamilyId: 'QF_P3-MT-02_002' });
        expect(q).not.toBeNull();
        const match = q.answer.match(/^(\d+):(\d{2})$/);
        expect(match).not.toBeNull();
        // Minutes should NOT be a multiple of 5
        expect(Number(match[2]) % 5).not.toBe(0);
      }
    });

    it('generates past/to questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MT-02', { questionFamilyId: 'QF_P3-MT-02_003' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(q.answer).toBeLessThanOrEqual(30);
        expect(q.prompt).toMatch(/past|to/);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P3-MT-03: 24-Hour Clock
  // -------------------------------------------------------------------------

  describe('P3-MT-03: 24-Hour Clock', () => {
    it('generates a.m. to 24h conversion (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MT-03', { questionFamilyId: 'QF_P3-MT-03_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P3-MT-03');
        expect(q.prompt).toContain('a.m.');
        // Answer should be HH:MM with leading zero
        expect(q.answer).toMatch(/^\d{2}:\d{2}$/);
        const hour = Number(q.answer.split(':')[0]);
        expect(hour).toBeLessThanOrEqual(11);
      }
    });

    it('generates p.m. to 24h conversion (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MT-03', { questionFamilyId: 'QF_P3-MT-03_002' });
        expect(q).not.toBeNull();
        expect(q.prompt).toContain('p.m.');
        const hour = Number(q.answer.split(':')[0]);
        expect(hour).toBeGreaterThanOrEqual(13);
        expect(hour).toBeLessThanOrEqual(23);
      }
    });

    it('generates 24h to 12h conversion (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MT-03', { questionFamilyId: 'QF_P3-MT-03_003' });
        expect(q).not.toBeNull();
        expect(q.answer).toMatch(/a\.m\.|p\.m\./);
      }
    });
  });

  // -------------------------------------------------------------------------
  // P3-MT-04: Duration
  // -------------------------------------------------------------------------

  describe('P3-MT-04: Duration', () => {
    it('generates duration-between-times questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MT-04', { questionFamilyId: 'QF_P3-MT-04_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P3-MT-04');
        expect(q.answerType).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(15);
        expect(q.answer).toBeLessThanOrEqual(120);
        expect(q.prompt).toContain('minutes');
      }
    });

    it('generates end-time questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MT-04', { questionFamilyId: 'QF_P3-MT-04_002' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('text');
        expect(q.answer).toMatch(/^\d+:\d{2}$/);
        expect(q.prompt).toContain('minutes');
      }
    });

    it('generates start-time questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P3-MT-04', { questionFamilyId: 'QF_P3-MT-04_003' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('text');
        expect(q.answer).toMatch(/^\d+:\d{2}$/);
        expect(q.prompt).toContain('start');
      }
    });
  });

  // -------------------------------------------------------------------------
  // generateQuestionSet & generateDiagnosticSet
  // -------------------------------------------------------------------------

  describe('generateQuestionSet', () => {
    it('returns the requested number of questions', () => {
      const set = generateQuestionSet('P3-MT-01', 5);
      expect(set).toHaveLength(5);
      set.forEach((q) => expect(q.skillId).toBe('P3-MT-01'));
    });
  });

  describe('generateDiagnosticSet', () => {
    it('generates questions across all skills', () => {
      const skillIds = ['P3-MT-01', 'P3-MT-02', 'P3-MT-03', 'P3-MT-04'];
      const set = generateDiagnosticSet(skillIds, 2);
      expect(set).toHaveLength(8);
      const ids = new Set(set.map((q) => q.skillId));
      expect(ids.size).toBe(4);
    });
  });

  // -------------------------------------------------------------------------
  // Cross-cutting
  // -------------------------------------------------------------------------

  it('returns null for unknown skill', () => {
    expect(generateQuestion('FAKE-SKILL')).toBeNull();
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
