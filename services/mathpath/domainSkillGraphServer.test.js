import { describe, expect, it } from 'vitest';
import { hasDomainSkillGraph, getDomainSkillGraph } from './domainSkillGraphServer.js';

// All 15 MathPath domains must resolve a skill graph.
const COVERED_DOMAINS = [
  'fractions',
  'percentage', 'ratio', 'algebra', 'geometry', 'volume', 'decimals',
  'area_perimeter', 'circles', 'statistics', 'measurement', 'money', 'time',
  'number_sense', 'four_operations',
];

describe('domainSkillGraphServer', () => {
  it('covers all 15 skill-state domains including fractions', () => {
    for (const domainId of COVERED_DOMAINS) {
      expect(hasDomainSkillGraph(domainId), domainId).toBe(true);
      const g = getDomainSkillGraph(domainId);
      expect(g.totalSkills, domainId).toBeGreaterThan(0);
      expect(g.skillIds.length, domainId).toBe(g.totalSkills);
    }
  });

  it('resolves fractions skill names by F-code using parentName', () => {
    const g = getDomainSkillGraph('fractions');
    expect(g.totalSkills).toBe(26);
    expect(g.nameFor('F001')).toBe('Recognising fractions as equal parts');
    expect(g.nameFor('F010')).toBeTruthy();
    expect(g.nameFor('NOPE')).toBe('NOPE');
  });

  it('resolves friendly names by skill id and falls back to the raw id', () => {
    const g = getDomainSkillGraph('geometry');
    const first = g.skills[0];
    expect(g.nameFor(first.id)).toBe(first.name);
    expect(g.nameFor('NOPE_999')).toBe('NOPE_999');
  });

  it('returns an empty graph (not a throw) for unknown domains', () => {
    for (const domainId of ['totally_unknown', '']) {
      expect(hasDomainSkillGraph(domainId)).toBe(false);
      const g = getDomainSkillGraph(domainId);
      expect(g.hasGraph).toBe(false);
      expect(g.totalSkills).toBe(0);
      expect(g.nameFor('X1')).toBe('X1');
    }
  });
});
