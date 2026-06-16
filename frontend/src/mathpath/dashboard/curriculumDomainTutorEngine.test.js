import { describe, it, expect } from 'vitest';
import { buildCurriculumDomainDashboard } from './curriculumDomainTutorEngine.js';

// Mock domain: a small percentage-like graph.
//   PCT01 (base) → PCT02 → PCT03
const SKILLS = {
  PCT01: { id: 'PCT01', name: 'Convert percentage to fraction', prerequisites: [] },
  PCT02: { id: 'PCT02', name: 'Find percentage of a quantity', prerequisites: ['PCT01'] },
  PCT03: { id: 'PCT03', name: 'Percentage increase and decrease', prerequisites: ['PCT02'] },
};
const MISCONCEPTIONS = {
  adds_percent_directly: { tag: 'adds_percent_directly', label: 'Adds the percentage directly to the value', description: 'desc', remediationExplanation: 'Multiply, do not add.' },
};

const resolvers = {
  domainKey: 'percentage',
  domainLabel: 'Percentage',
  domainIds: ['p6-percentage'],
  getSkill: (id) => SKILLS[id] || null,
  getSkillName: (id) => SKILLS[id]?.name || id,
  getPrerequisites: (id) => SKILLS[id]?.prerequisites || [],
  getRemediationTargets: () => [],
  getAllSkillIds: () => Object.keys(SKILLS),
  getMisconception: (tag) => MISCONCEPTIONS[tag] || null,
};

describe('buildCurriculumDomainDashboard', () => {
  it('returns an unavailable shell with no resolvers', () => {
    const out = buildCurriculumDomainDashboard({});
    expect(out.available).toBe(false);
    expect(out.rootCauses).toEqual([]);
    expect(out.interventionPriorities).toEqual([]);
  });

  it('summarises skill states (mastered / weak / accuracy)', () => {
    const out = buildCurriculumDomainDashboard({
      resolvers,
      skillStates: [
        { skillId: 'PCT01', status: 'fluent', attemptCount: 10, correctCount: 10 },
        { skillId: 'PCT02', status: 'weak', attemptCount: 8, correctCount: 3 },
        { skillId: 'PCT03', status: 'learning', attemptCount: 4, correctCount: 1 },
      ],
    });
    expect(out.available).toBe(true);
    expect(out.skillSummary.total).toBe(3);
    expect(out.skillSummary.mastered).toBe(1); // fluent
    // PCT02 (weak) and PCT03 (25% over 4 attempts) both weak
    expect(out.skillSummary.weak).toBe(2);
    expect(out.skillSummary.averageAccuracy).toBeGreaterThan(0);
  });

  it('builds a prerequisite chain and picks an un-secure root cause', () => {
    const out = buildCurriculumDomainDashboard({
      resolvers,
      skillStates: [
        { skillId: 'PCT01', status: 'weak', attemptCount: 5, correctCount: 1 },
        { skillId: 'PCT03', status: 'weak', attemptCount: 5, correctCount: 1 },
      ],
    });
    const rc = out.rootCauses.find((r) => r.weakSkillId === 'PCT03');
    expect(rc).toBeTruthy();
    // Chain should run base→…→target
    expect(rc.prerequisiteChain.map((c) => c.skillId)).toEqual(['PCT01', 'PCT02', 'PCT03']);
    // PCT01 is weak/un-secure so it should surface as the suspected root cause.
    expect(rc.suspectedRootCauseSkillId).toBe('PCT01');
    expect(rc.suspectedRootCauseName).toBe('Convert percentage to fraction');
  });

  it('clusters mistakes by misconception tag with frequency-based severity', () => {
    const out = buildCurriculumDomainDashboard({
      resolvers,
      skillStates: [{ skillId: 'PCT02', status: 'weak', attemptCount: 4, correctCount: 1 }],
      mistakes: [
        { skillCode: 'PCT02', misconceptionTag: 'adds_percent_directly' },
        { skillCode: 'PCT02', misconceptionTag: 'adds_percent_directly' },
        { skillCode: 'PCT02', misconceptionTag: 'adds_percent_directly' },
      ],
    });
    expect(out.mistakeClusters).toHaveLength(1);
    const cluster = out.mistakeClusters[0];
    expect(cluster.frequency).toBe(3);
    expect(cluster.severity).toBe('high');
    expect(cluster.name).toBe('Adds the percentage directly to the value');
    expect(cluster.remediation).toContain('Multiply');
    expect(cluster.affectedSkills).toContain('Find percentage of a quantity');
  });

  it('ignores mistakes outside the domain skill set', () => {
    const out = buildCurriculumDomainDashboard({
      resolvers,
      skillStates: [{ skillId: 'PCT02', status: 'weak', attemptCount: 4, correctCount: 1 }],
      mistakes: [{ skillCode: 'F010', misconceptionTag: 'fraction_thing' }],
    });
    expect(out.mistakeClusters).toHaveLength(0);
  });

  it('ranks high-severity issues first and recommends a focus', () => {
    const out = buildCurriculumDomainDashboard({
      resolvers,
      skillStates: [
        { skillId: 'PCT02', status: 'weak', attemptCount: 10, correctCount: 1 }, // ~10% → high
        { skillId: 'PCT03', status: 'needsReview', attemptCount: 6, correctCount: 3 }, // 50% → medium
      ],
    });
    expect(out.interventionPriorities[0].severity).toBe('high');
    expect(out.recommendedFocus).toBeTruthy();
    expect(out.recommendedFocus.suggestedAssignments.length).toBeGreaterThan(0);
  });
});
