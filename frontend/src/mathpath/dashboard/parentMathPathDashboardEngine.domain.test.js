import { describe, it, expect } from 'vitest';
import { resolveDomainSkillGraph, hasDomainSkillGraph } from './domainSkillGraphResolver.js';
import { buildParentMathPathSummary } from './parentMathPathDashboardEngine.js';

// Phase 1 of parent-dashboard domain parity: the engine resolves a per-domain
// skill graph + name lookup instead of hardcoding fractions.

describe('domainSkillGraphResolver', () => {
  it('resolves the percentage domain to the P6 percentage graph with name lookup', () => {
    const { skillGraph, getSkill } = resolveDomainSkillGraph('percentage');
    expect(skillGraph.skillIds).toContain('P6-PCT-01');
    expect(getSkill('P6-PCT-01')?.name).toBe('Percentage Increase & Decrease');
  });

  it('falls back to a safe empty graph for unmapped (lower-primary) domains', () => {
    expect(hasDomainSkillGraph('money')).toBe(false);
    const { skillGraph, getSkill } = resolveDomainSkillGraph('money');
    expect(skillGraph.skillIds).toEqual([]);
    expect(getSkill('anything')).toBeNull();
  });

  it('defaults unknown domains without throwing', () => {
    const { skillGraph } = resolveDomainSkillGraph('totally_made_up');
    expect(Array.isArray(skillGraph.skillIds)).toBe(true);
  });
});

describe('buildParentMathPathSummary — domain generic', () => {
  it('uses the percentage graph: real names, correct total, no raw skill codes', () => {
    const summary = buildParentMathPathSummary({
      studentId: 'p_pct',
      domainId: 'percentage',
      practiceState: {
        masteredSkillIds: ['P6-PCT-01', 'P6-PCT-02'],
        weakSkillIds: ['P6-PCT-03'],
      },
    });
    expect(summary.domainId).toBe('percentage');
    expect(summary.masteryProgress.totalSkills).toBe(3);
    expect(summary.masteryProgress.masteredSkills).toContain('Percentage Increase & Decrease');
    expect(summary.masteryProgress.weakSkills).toContain('Reverse Percentage');
    // ~66.7% of 3 mastered
    expect(summary.masteryProgress.percentageMastered).toBeCloseTo(66.7, 1);
    // No raw P6-PCT-* codes should leak into parent-facing fields.
    const leaked = JSON.stringify(summary.currentWeaknesses).match(/P6-PCT-\d{2}/);
    expect(leaked).toBeNull();
    expect(/P6-[A-Z]{2,5}-\d{2}/.test(summary.parentFriendlyNarrative)).toBe(false);
  });

  it('still works for fractions (default) without regression', () => {
    const summary = buildParentMathPathSummary({
      studentId: 'p_fr',
      domainId: 'fractions',
      practiceState: { masteredSkillIds: ['F001'], weakSkillIds: ['F010'] },
    });
    expect(summary.domainId).toBe('fractions');
    expect(summary.masteryProgress.totalSkills).toBeGreaterThan(0);
    // F010 should resolve to a human name, not the raw code.
    expect(summary.masteryProgress.weakSkills.some((s) => /^F\d{3}$/.test(s))).toBe(false);
  });
});
