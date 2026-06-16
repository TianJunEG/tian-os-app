import { describe, it, expect } from 'vitest';
import { CURRICULUM_DOMAINS, getDomainResolvers, getSkillFromDomain } from './curriculumDomainIndex.js';

// Guards the System A namespace alignment: the tutor dashboard must resolve the
// same domainIds + skill ids that the live student practice flow
// (/api/mathpath/<domain>) writes to MathPathStudentSkillState.
describe('curriculumDomainIndex (System A namespace)', () => {
  it('exposes the eight curriculum tabs with System A domainIds', () => {
    const byKey = Object.fromEntries(CURRICULUM_DOMAINS.map((d) => [d.key, d.domainIds]));
    expect(byKey.percentage).toEqual(['percentages']);
    expect(byKey.money).toEqual(['money']);
    expect(byKey.volume).toEqual(['volume']);
    expect(byKey['ratio-rate']).toEqual(['ratioRate']); // ratio + rate are one System A domain
    expect(byKey.algebra).toEqual(['algebra']);
  });

  it('resolves System A skill ids to names', () => {
    const r = getDomainResolvers('percentage');
    expect(r.domainIds).toEqual(['percentages']);
    const ids = r.getAllSkillIds();
    expect(ids).toContain('P001');
    expect(r.getSkillName('P001')).not.toBe('P001'); // resolves to a human name
    expect(getSkillFromDomain('percentages', 'P001')?.id).toBe('P001');
  });

  it('returns null resolvers for an unknown domain key', () => {
    expect(getDomainResolvers('nope')).toBeNull();
  });

  it('resolves prerequisites within a System A domain', () => {
    const r = getDomainResolvers('volume');
    expect(r.getAllSkillIds()).toContain('VL001');
    expect(Array.isArray(r.getPrerequisites('VL001'))).toBe(true);
  });
});
