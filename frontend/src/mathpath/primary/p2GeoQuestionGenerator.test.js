import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getSupportedSkillIds,
} from './p2GeoQuestionGenerator.js';
import { validateP2GeoSkillGraph, p2GeoSkillGraph } from './p2GeoSkillGraph.js';
import { validateP2GeoQuestionFamilies } from './p2GeoQuestionFamilies.js';

const VALID_SOLIDS = ['cube', 'cuboid', 'cone', 'cylinder', 'sphere'];

// ---------------------------------------------------------------------------
// Skill graph validation
// ---------------------------------------------------------------------------

describe('p2GeoSkillGraph', () => {
  it('validates without errors', () => {
    const result = validateP2GeoSkillGraph();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('contains 1 P2-GEO skill', () => {
    expect(p2GeoSkillGraph.skills).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Question families validation
// ---------------------------------------------------------------------------

describe('p2GeoQuestionFamilies', () => {
  it('validates without errors', () => {
    const result = validateP2GeoQuestionFamilies();
    expect(result.isValid).toBe(true);
    expect(result.totalQuestionFamilies).toBe(2);
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

describe('p2GeoQuestionGenerator', () => {
  it('supports 1 skill ID', () => {
    const ids = getSupportedSkillIds();
    expect(ids).toHaveLength(1);
    expect(ids).toContain('P2-GEO-01');
  });

  // -------------------------------------------------------------------------
  // P2-GEO-01: Naming 3D Solids
  // -------------------------------------------------------------------------

  describe('P2-GEO-01: Naming 3D Solids', () => {
    it('generates everyday-object questions (_001)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-GEO-01', { questionFamilyId: 'QF_P2-GEO-01_001' });
        expect(q).not.toBeNull();
        expect(q.skillId).toBe('P2-GEO-01');
        expect(q.answerType).toBe('choice');
        expect(q.choices).toBeDefined();
        expect(q.choices.length).toBe(4);
        expect(q.choices).toContain(q.answer);
        expect(VALID_SOLIDS).toContain(q.answer);
        expect(q.prompt).toContain('look like');
      }
    });

    it('generates properties-to-solid questions (_002)', () => {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('P2-GEO-01', { questionFamilyId: 'QF_P2-GEO-01_002' });
        expect(q).not.toBeNull();
        expect(q.answerType).toBe('choice');
        expect(q.choices).toContain(q.answer);
        expect(VALID_SOLIDS).toContain(q.answer);
        expect(q.prompt).toContain('What 3D solid');
      }
    });
  });

  // -------------------------------------------------------------------------
  // Utility functions
  // -------------------------------------------------------------------------

  describe('generateQuestionSet', () => {
    it('returns the requested number', () => {
      const set = generateQuestionSet('P2-GEO-01', 5);
      expect(set).toHaveLength(5);
    });
  });

  describe('generateDiagnosticSet', () => {
    it('generates questions for the skill', () => {
      const set = generateDiagnosticSet(['P2-GEO-01'], 3);
      expect(set).toHaveLength(3);
    });
  });

  // -------------------------------------------------------------------------
  // Cross-cutting
  // -------------------------------------------------------------------------

  it('returns null for unknown skill', () => {
    expect(generateQuestion('FAKE')).toBeNull();
  });

  it('every question has a unique questionId', () => {
    const ids = new Set();
    for (let i = 0; i < 10; i++) {
      const q = generateQuestion('P2-GEO-01');
      expect(ids.has(q.questionId)).toBe(false);
      ids.add(q.questionId);
    }
  });

  it('every question has misconceptionTraps and solutionText', () => {
    for (let i = 0; i < 10; i++) {
      const q = generateQuestion('P2-GEO-01');
      expect(q.misconceptionTraps.length).toBeGreaterThan(0);
      expect(q.solutionText.length).toBeGreaterThan(0);
    }
  });

  it('every answer is a valid 3D solid name', () => {
    for (let i = 0; i < 20; i++) {
      const q = generateQuestion('P2-GEO-01');
      expect(VALID_SOLIDS).toContain(q.answer);
    }
  });

  it('choices always contain the answer', () => {
    for (let i = 0; i < 20; i++) {
      const q = generateQuestion('P2-GEO-01');
      expect(q.choices).toContain(q.answer);
    }
  });
});
