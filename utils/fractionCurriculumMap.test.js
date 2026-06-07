import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  FRACTION_CANONICAL_SKILL_ROWS,
  getCanonicalFractionSkill,
} from '../frontend/src/mathpath/curriculum/fractionCanonicalSkillMap.js';
import {
  fractionCurriculumMappings,
  getFractionCurriculumMappingByFrameworkId,
} from '../frontend/src/mathpath/curriculum/fractionCurriculumMappings.js';
import {
  fractionUniversalSkills,
  getUniversalSkillByFrameworkId,
} from '../frontend/src/mathpath/curriculum/fractionUniversalSkills.js';
import { fractionSkillGraph } from '../frontend/src/mathpath/fractions/fractionSkillGraph.js';
import { fractionQuestionFamilies } from '../frontend/src/mathpath/fractions/fractionQuestionFamilies.js';
import { getSkillDisplayName, replaceSkillIdsForStudents } from '../services/mathpath/skillDisplayNameService.js';

const EXPECTED_IDS = Array.from({ length: 26 }, (_, index) => `F${String(index + 1).padStart(3, '0')}`);
const RAW_F_CODE = /\bF\d{3}\b/;

describe('Fractions canonical curriculum map', () => {
  it('defines exactly F001-F026 with one canonical slug and friendly labels', () => {
    expect(FRACTION_CANONICAL_SKILL_ROWS.map((row) => row.frameworkSkillId)).toEqual(EXPECTED_IDS);
    expect(new Set(FRACTION_CANONICAL_SKILL_ROWS.map((row) => row.slug)).size).toBe(26);

    for (const row of FRACTION_CANONICAL_SKILL_ROWS) {
      expect(row.slug).toMatch(/^fractions\./);
      expect(row.displayName).toBeTruthy();
      expect(row.studentName).toBeTruthy();
      expect(row.parentName).toBeTruthy();
      expect(row.levelBand.length).toBeGreaterThan(0);
      expect(row.questionFamilies.length).toBeGreaterThan(0);
      expect(row.studentName).not.toMatch(RAW_F_CODE);
      expect(row.parentName).not.toMatch(RAW_F_CODE);
    }
  });

  it('aligns canonical, universal, curriculum, and active skill graph meanings', () => {
    expect(fractionSkillGraph.skillIds).toEqual(EXPECTED_IDS);
    expect(fractionUniversalSkills.map((row) => row.frameworkSkillId)).toEqual(EXPECTED_IDS);
    expect(fractionCurriculumMappings.map((row) => row.frameworkSkillId)).toEqual(EXPECTED_IDS);

    for (const skill of fractionSkillGraph.skills) {
      const canonical = getCanonicalFractionSkill(skill.id);
      const universal = getUniversalSkillByFrameworkId(skill.id);
      const mapping = getFractionCurriculumMappingByFrameworkId(skill.id);

      expect(canonical).toBeTruthy();
      expect(universal).toMatchObject({
        frameworkSkillId: skill.id,
        skillId: canonical.slug,
        title: canonical.displayName,
      });
      expect(mapping).toMatchObject({
        frameworkSkillId: skill.id,
        skillId: canonical.slug,
        title: canonical.displayName,
        parentName: canonical.parentName,
        studentName: canonical.studentName,
      });
      expect(mapping.prerequisites).toEqual(skill.prerequisites);
      expect(mapping.questionFamilies).toEqual(skill.questionFamilies);
    }
  });

  it('keeps all question families mapped to valid canonical F-codes', () => {
    const canonicalIds = new Set(EXPECTED_IDS);
    for (const family of fractionQuestionFamilies) {
      expect(canonicalIds.has(family.skillId)).toBe(true);
      expect(family.id).toContain(family.skillId);
    }
  });

  it('uses friendly student and parent labels instead of raw F-code labels', () => {
    for (const id of EXPECTED_IDS) {
      const labels = getSkillDisplayName(id);
      expect(labels.shortStudentLabel).not.toMatch(RAW_F_CODE);
      expect(labels.parentLabel).not.toMatch(RAW_F_CODE);
      expect(labels.teacherLabel).not.toMatch(RAW_F_CODE);
    }
    expect(replaceSkillIdsForStudents('Practise F018 and F023 next.')).toBe(
      'Practise Adding fractions with different denominators and Solving fraction word problems next.'
    );
  });

  it('does not show raw F-code story labels in student-facing Story Mode source copy', () => {
    const source = fs.readFileSync('frontend/src/pages/student/mathpath/FractionsStoryModeSession.jsx', 'utf8');
    expect(source).not.toContain('Story Mode currently supports F025 and F026');
    expect(source).not.toContain('Start F025 Story');
    expect(source).not.toContain('Start F026 Story');
    expect(source).not.toContain('{story.skillId} ·');
  });
});
