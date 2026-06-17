import { describe, it, expect } from 'vitest';
import {
  deriveParentPayload,
  availableDomainsFromMastery,
  domainLabel,
} from './parentDomainDashboardData.js';

// Phase 3 of parent-dashboard domain parity: the page filters mastery records by
// a selected domain and runs the (now domain-generic) pipeline.

const MASTERY = {
  records: [
    { skillId: 'oid1', skillName: 'Percentage Increase & Decrease', status: 'mastered', domainId: 'percentage' },
    { skillId: 'oid2', skillName: 'Reverse Percentage', status: 'weak', domainId: 'percentage' },
    { skillId: 'oid3', skillName: 'Equivalent Fractions', status: 'mastered', domainId: 'fractions' },
    { skillId: 'oid4', skillName: 'Add Like Fractions', status: 'mastered' }, // untagged -> counts for fractions
  ],
};

describe('availableDomainsFromMastery', () => {
  it('lists fractions plus any tagged domains present', () => {
    expect(availableDomainsFromMastery(MASTERY).sort()).toEqual(['fractions', 'percentage']);
  });
  it('always includes fractions even with no records', () => {
    expect(availableDomainsFromMastery({ records: [] })).toEqual(['fractions']);
  });
});

describe('domainLabel', () => {
  it('maps canonical IDs to friendly labels', () => {
    expect(domainLabel('percentage')).toBe('Percentage');
    expect(domainLabel('four_operations')).toBe('Operations');
    expect(domainLabel('whatever')).toBe('MathPath');
  });
});

describe('deriveParentPayload — per-domain filtering', () => {
  it('produces a percentage summary from only percentage records', () => {
    const summary = deriveParentPayload('s1', MASTERY, {}, 'percentage');
    expect(summary).toBeTruthy();
    expect(summary.domainId).toBe('percentage');
    expect(summary.masteryProgress.masteredSkills).toContain('Percentage Increase & Decrease');
    expect(summary.masteryProgress.weakSkills).toContain('Reverse Percentage');
    // Fraction skills must not leak into the percentage view.
    expect(summary.masteryProgress.masteredSkills).not.toContain('Equivalent Fractions');
  });

  it('produces a fractions summary including untagged records', () => {
    const summary = deriveParentPayload('s1', MASTERY, {}, 'fractions');
    expect(summary.domainId).toBe('fractions');
    expect(summary.masteryProgress.masteredSkills).toEqual(
      expect.arrayContaining(['Equivalent Fractions', 'Add Like Fractions'])
    );
    expect(summary.masteryProgress.masteredSkills).not.toContain('Percentage Increase & Decrease');
  });

  it('does not error and returns a dashboard for a domain with no records', () => {
    const summary = deriveParentPayload('s1', MASTERY, {}, 'circles');
    expect(summary).toBeTruthy();
    expect(summary.domainId).toBe('circles');
    expect(summary.masteryProgress.masteredSkills).toEqual([]);
  });
});
