import { describe, expect, it } from 'vitest';
import { hasDomainSkillGraph, getDomainSkillGraph } from './domainSkillGraphServer.js';

// Every non-fractions domain whose practice route writes MathPathStudentSkillState
// must resolve a skill graph, so the parent dashboard shows friendly names and a
// real "x of y" denominator instead of raw skill ids.
const COVERED_DOMAINS = [
  'percentage', 'ratio', 'algebra', 'geometry', 'volume', 'decimals',
  'area_perimeter', 'circles', 'statistics', 'measurement', 'money', 'time',
  'number_sense', 'four_operations',
];

describe('domainSkillGraphServer', () => {
  it('covers every non-fractions skill-state domain', () => {
    for (const domainId of COVERED_DOMAINS) {
      expect(hasDomainSkillGraph(domainId), domainId).toBe(true);
      const g = getDomainSkillGraph(domainId);
      expect(g.totalSkills, domainId).toBeGreaterThan(0);
      expect(g.skillIds.length, domainId).toBe(g.totalSkills);
    }
  });

  it('resolves friendly names by skill id and falls back to the raw id', () => {
    const g = getDomainSkillGraph('geometry');
    const first = g.skills[0];
    expect(g.nameFor(first.id)).toBe(first.name);
    expect(g.nameFor('NOPE_999')).toBe('NOPE_999');
  });

  it('returns an empty graph (not a throw) for fractions and unknown domains', () => {
    for (const domainId of ['fractions', 'totally_unknown', '']) {
      expect(hasDomainSkillGraph(domainId)).toBe(false);
      const g = getDomainSkillGraph(domainId);
      expect(g.hasGraph).toBe(false);
      expect(g.totalSkills).toBe(0);
      expect(g.nameFor('X1')).toBe('X1');
    }
  });
});
