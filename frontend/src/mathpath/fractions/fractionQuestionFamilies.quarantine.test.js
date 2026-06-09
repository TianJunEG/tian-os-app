import { describe, it, expect } from 'vitest';
import {
  fractionQuestionFamilies,
  getQuestionFamiliesBySkill,
  getAllQuestionFamiliesBySkill,
  getQuarantinedFamilies,
  getQuarantinedFamilyIds,
  isQuarantinedFamily,
  getQuestionFamily,
} from './fractionQuestionFamilies';
import { fractionSkillGraph } from './fractionSkillGraph';
import { generateFractionQuestion } from './fractionQuestionGenerator';

// Sprint 3: the 12 families flagged incorrect by the integrity audit that are still
// live in source (the 2 F015 "like-denominator addition" families were already removed).
const EXPECTED_QUARANTINED = [
  'QF_F011_005', 'QF_F012_004', 'QF_F013_005', 'QF_F014_005',
  'QF_F017_004', 'QF_F018_005', 'QF_F018_006', 'QF_F021_005',
  'QF_F022_005', 'QF_F023_005', 'QF_F025_005', 'QF_F026_005',
];

describe('Fractions question-family quarantine (Sprint 3)', () => {
  it('quarantines exactly the 12 audited families', () => {
    expect(getQuarantinedFamilyIds().sort()).toEqual([...EXPECTED_QUARANTINED].sort());
    expect(getQuarantinedFamilies()).toHaveLength(EXPECTED_QUARANTINED.length);
    getQuarantinedFamilies().forEach((f) => {
      expect(f.quarantined).toBe(true);
      expect(f.quarantineReason).toBeTruthy();
    });
  });

  it('withholds quarantined families from the active selection path', () => {
    EXPECTED_QUARANTINED.forEach((id) => {
      expect(isQuarantinedFamily(id)).toBe(true);
      const skillId = getQuestionFamily(id).skillId;
      expect(getQuestionFamiliesBySkill(skillId).map((f) => f.id)).not.toContain(id);
      // ...but the full/audit list still includes it.
      expect(getAllQuestionFamiliesBySkill(skillId).map((f) => f.id)).toContain(id);
    });
  });

  it('records remap targets for cross-skill families and pure-removal for out-of-scope', () => {
    expect(getQuestionFamily('QF_F011_005').canonicalSkillId).toBe('F007');
    expect(getQuestionFamily('QF_F012_004').canonicalSkillId).toBe('F008');
    expect(getQuestionFamily('QF_F018_006').canonicalSkillId).toBe('F019');
    // Out-of-scope items keep their own skill id (removed, not remapped).
    expect(getQuestionFamily('QF_F013_005').canonicalSkillId).toBe('F013');
  });

  it('keeps every fraction skill with at least one active family', () => {
    fractionSkillGraph.skillIds.forEach((skillId) => {
      expect(getQuestionFamiliesBySkill(skillId).length).toBeGreaterThan(0);
    });
  });

  it('no active family is quarantined', () => {
    fractionQuestionFamilies
      .filter((f) => !f.quarantined)
      .forEach((f) => expect(isQuarantinedFamily(f.id)).toBe(false));
  });

  it('propagates the quarantine flag onto generated questions', () => {
    const quarantined = generateFractionQuestion({ skillId: 'F018', questionFamilyId: 'QF_F018_006', difficulty: 4, variant: 1, mode: 'practice' });
    expect(quarantined.quarantined).toBe(true);
    expect(quarantined.canonicalSkillId).toBe('F019');

    const active = generateFractionQuestion({ skillId: 'F018', questionFamilyId: 'QF_F018_001', difficulty: 3, variant: 1, mode: 'practice' });
    expect(active.quarantined).toBe(false);
  });
});
