import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getSupportedSkillIds,
} from './p2TimeQuestionGenerator.js';
import { validateP2TimeSkillGraph, p2TimeSkillGraph } from './p2TimeSkillGraph.js';
import { validateP2TimeQuestionFamilies } from './p2TimeQuestionFamilies.js';

// ---------------------------------------------------------------------------
// Skill graph validation
// ---------------------------------------------------------------------------

describe('p2TimeSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP2TimeSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains 1 P2-TM skill', () => {
    expect(p2TimeSkillGraph.skills).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Question families validation
// ---------------------------------------------------------------------------

describe('p2TimeQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP2TimeQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.totalQuestionFamilies).toBe(3);
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

describe('p2TimeQuestionGenerator', () => {
  it('supports 1 skill ID', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(1);
    expect(ids).toContain('P2-TM-01');
  });

  // -------------------------------------------------------------------------
  // P2-TM-01: Telling Time to 5 Minutes
  // -------------------------------------------------------------------------

  describe('P2-TM-01: Telling Time to 5 Minutes', () => {
    it('generates read-from-description questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-TM-01', { questionFamilyId: 'QF_P2-TM-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P2-TM-01');
        expect(q.answerType).toBe('choice');
        expect(q.choices).toBeDefined();
        expect(q.choices.length).toBe(4);
        // Answer should be h:mm where mm is a multiple of 5
        const match = q.answer.match(/^(\d+):(\d{2})$/);
        expect(match).not.toBeNull();
        expect(Number(match[2]) % 5).toBe(0);
        // Answer must be among choices
        expect(q.choices).toContain(q.answer);
        expect(q.prompt).toContain('hour hand');
        expect(q.prompt).toContain('minute hand');
      }
    });

    it('generates words-to-digital questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-TM-01', { questionFamilyId: 'QF_P2-TM-01_002' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('choice');
        expect(q.choices).toContain(q.answer);
        // Answer should be h:mm format
        const match = q.answer.match(/^(\d+):(\d{2})$/);
        expect(match).not.toBeNull();
        expect(Number(match[2]) % 5).toBe(0);
      }
    });

    it('generates what-time-will-it-be questions (_003)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-TM-01', { questionFamilyId: 'QF_P2-TM-01_003' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('choice');
        expect(q.choices).toContain(q.answer);
        expect(q.prompt).toContain('minutes');
        // Answer should be valid time
        const match = q.answer.match(/^(\d+):(\d{2})$/);
        expect(match).not.toBeNull();
        const hour = Number(match[1]);
        const min = Number(match[2]);
        expect(hour).toBeGreaterThanOrEqual(1);
        expect(hour).toBeLessThanOrEqual(12);
        expect(min).toBeGreaterThanOrEqual(0);
        expect(min).toBeLessThanOrEqual(55);
      }
    });
  });

  // -------------------------------------------------------------------------
  // generateQuestionSet & generateDiagnosticSet
  // -------------------------------------------------------------------------

  describe('generateQuestionSet', () => {
    it('returns the requested number of questions', () => {
      const set = generateQuestionSet('P2-TM-01', 5);
      expect(set).toHaveLength(5);
      set.forEach((q) => expect(q.skillId).toBe('P2-TM-01'));
    });
  });

  describe('generateDiagnosticSet', () => {
    it('generates questions for the skill', () => {
      const set = generateDiagnosticSet(['P2-TM-01'], 3);
      expect(set).toHaveLength(3);
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
