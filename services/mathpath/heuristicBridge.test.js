import { describe, it, expect } from 'vitest';
import {
  getHeuristicForSkill,
  hasPSLContent,
  skillHasPSLContent,
  getPSLTemplateQuery,
  getHintsForSkillStep,
  SLUG_TO_HEURISTIC,
} from './heuristicBridge.js';

describe('heuristicBridge', () => {
  describe('getHeuristicForSkill', () => {
    it('returns bar-model for bar-model-tagged skills', () => {
      expect(getHeuristicForSkill('op.model-drawing')).toBe('bar-model');
      expect(getHeuristicForSkill('fr.word-problems')).toBe('bar-model');
      expect(getHeuristicForSkill('pct.of-quantity')).toBe('bar-model');
      expect(getHeuristicForSkill('mon.word-problems')).toBe('bar-model');
    });

    it('returns before-after for before-after skills', () => {
      expect(getHeuristicForSkill('rr.before-after')).toBe('before-after');
      expect(getHeuristicForSkill('pct.before-after')).toBe('before-after');
    });

    it('returns ratio for ratio/rate skills', () => {
      expect(getHeuristicForSkill('rr.divide')).toBe('ratio');
      expect(getHeuristicForSkill('rr.proportion')).toBe('ratio');
      expect(getHeuristicForSkill('vol.water-rate')).toBe('ratio');
    });

    it('returns work-backwards for pct.find-whole', () => {
      expect(getHeuristicForSkill('pct.find-whole')).toBe('work-backwards');
    });

    it('returns null for skills with no heuristic tag', () => {
      expect(getHeuristicForSkill('fr.equivalent')).toBeNull();
      expect(getHeuristicForSkill('dec.place-value')).toBeNull();
      expect(getHeuristicForSkill('unknown.slug')).toBeNull();
    });
  });

  describe('hasPSLContent', () => {
    it('returns true for seeded heuristics', () => {
      expect(hasPSLContent('bar-model')).toBe(true);
      expect(hasPSLContent('before-after')).toBe(true);
      expect(hasPSLContent('ratio')).toBe(true);
      expect(hasPSLContent('work-backwards')).toBe(true);
      expect(hasPSLContent('guess-check')).toBe(true);
    });

    it('returns false for unknown heuristics', () => {
      expect(hasPSLContent('not-a-heuristic')).toBe(false);
      expect(hasPSLContent('')).toBe(false);
    });
  });

  describe('skillHasPSLContent', () => {
    it('returns true for skills with seeded PSL content', () => {
      expect(skillHasPSLContent('rr.divide')).toBe(true);
      expect(skillHasPSLContent('pct.find-whole')).toBe(true);
      expect(skillHasPSLContent('fr.word-problems')).toBe(true);
    });

    it('returns false for skills with no heuristic tag', () => {
      expect(skillHasPSLContent('fr.simplify')).toBe(false);
      expect(skillHasPSLContent('unknown.slug')).toBe(false);
    });
  });

  describe('getPSLTemplateQuery', () => {
    it('returns a query object for a tagged skill with PSL content', () => {
      expect(getPSLTemplateQuery('rr.before-after', 'Primary 6')).toEqual({
        heuristic: 'before-after',
        level: 'Primary 6',
      });
      expect(getPSLTemplateQuery('pct.of-quantity', 'Primary 5')).toEqual({
        heuristic: 'bar-model',
        level: 'Primary 5',
      });
    });

    it('returns null for untagged skills', () => {
      expect(getPSLTemplateQuery('fr.simplify', 'Primary 4')).toBeNull();
    });
  });

  describe('getHintsForSkillStep', () => {
    it('returns a hint result for a skill with a heuristic tag', () => {
      const result = getHintsForSkillStep('rr.divide', 'plan', 0);
      expect(result).toHaveProperty('hint');
      expect(result).toHaveProperty('exhausted');
      expect(result.exhausted).toBe(false);
      expect(result.hint).not.toBeNull();
    });

    it('returns a generic hint result for a skill with no heuristic tag', () => {
      const result = getHintsForSkillStep('dec.place-value', 'plan', 0);
      expect(result).toHaveProperty('hint');
      expect(result.hint).not.toBeNull();
    });
  });

  describe('SLUG_TO_HEURISTIC index completeness', () => {
    it('has entries for all three heuristic categories', () => {
      const values = Object.values(SLUG_TO_HEURISTIC);
      expect(values).toContain('bar-model');
      expect(values).toContain('before-after');
      expect(values).toContain('ratio');
      expect(values).toContain('work-backwards');
    });

    it('all heuristic values are PSL-seeded', () => {
      for (const [slug, h] of Object.entries(SLUG_TO_HEURISTIC)) {
        expect(hasPSLContent(h), `${slug} → '${h}' has no PSL seed`).toBe(true);
      }
    });
  });
});
