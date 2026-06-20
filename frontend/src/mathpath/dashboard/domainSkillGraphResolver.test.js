import { describe, it, expect } from 'vitest';
import { resolveDomainSkillGraph } from './domainSkillGraphResolver.js';
import { operationsSkillGraph } from '../../../../shared/mathpath/operations/OperationsSkillGraph.js';

describe('resolveDomainSkillGraph', () => {
  it('maps four_operations to the canonical shared OP0xx graph (matches the backend resolver and student mastery records)', () => {
    const { skillGraph, getSkill } = resolveDomainSkillGraph('four_operations');
    // Same graph the practice/diagnostic engines record against — OP0xx ids,
    // not the retired P1-ADD-* aggregation.
    expect(skillGraph.skillIds).toContain('OP001');
    expect(skillGraph.skillIds).toEqual(operationsSkillGraph.skillIds);
    expect(skillGraph.skillIds.some((id) => /^P1-ADD-/.test(id))).toBe(false);
    expect(getSkill('OP001')?.name).toBeTruthy();
  });

  it('still resolves fractions and degrades gracefully for unknown domains', () => {
    expect(resolveDomainSkillGraph('fractions').skillGraph.skillIds.length).toBeGreaterThan(0);
    const unknown = resolveDomainSkillGraph('not_a_domain');
    expect(unknown.skillGraph.skillIds).toEqual([]);
    expect(unknown.getSkill('x')).toBeNull();
  });
});
