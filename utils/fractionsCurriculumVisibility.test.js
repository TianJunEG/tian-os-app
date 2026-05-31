import { describe, it, expect } from 'vitest';
import { fractionCurriculumMappings } from '../frontend/src/mathpath/curriculum/fractionCurriculumMappings.js';
import { getVisibleSkillsForStudentLevel } from '../frontend/src/mathpath/curriculum/curriculumMappingSelectors.js';

describe('fractions curriculum mapping visibility', () => {
  it('keeps all F001-F026 mapped for SG MOE_PRIMARY_MATH_2021', () => {
    const ids = new Set(
      fractionCurriculumMappings
        .filter((row) => row.country === 'SG' && row.curriculum === 'MOE_PRIMARY_MATH_2021')
        .map((row) => row.frameworkSkillId)
    );
    for (let i = 1; i <= 26; i += 1) {
      const id = `F${String(i).padStart(3, '0')}`;
      expect(ids.has(id)).toBe(true);
    }
  });

  it('keeps SG taxonomy fields consistent across all 26 mapped skills', () => {
    const rows = fractionCurriculumMappings.filter(
      (row) => row.country === 'SG' && row.curriculum === 'MOE_PRIMARY_MATH_2021'
    );
    expect(rows.length).toBe(26);
    for (const row of rows) {
      expect(row.subject).toBe('Mathematics');
      expect(row.phase).toBe('Primary');
      expect(row.stream).toBe('Standard');
      expect(row.domain).toBe('fractions');
      expect(row.topic).toBe('Fractions');
      expect(row.strand).toBe('Number and Algebra');
      expect(row.subStrand).toBe('Fractions');
      expect(Boolean(row.introducedLevel)).toBe(true);
      expect(Boolean(row.masteryLevel)).toBe(true);
      expect(Array.isArray(row.levelBand)).toBe(true);
      expect(row.levelBand.length).toBeGreaterThan(0);
      expect(Boolean(row.syllabusRef || row.notes)).toBe(true);
    }
  });

  it('filters visible skills by Singapore level', () => {
    const p3 = getVisibleSkillsForStudentLevel({
      country: 'SG',
      curriculum: 'MOE_PRIMARY_MATH_2021',
      domain: 'fractions',
      studentLevel: 'P3',
    });
    const p6 = getVisibleSkillsForStudentLevel({
      country: 'SG',
      curriculum: 'MOE_PRIMARY_MATH_2021',
      domain: 'fractions',
      studentLevel: 'P6',
    });
    const p3Ids = new Set(p3.map((row) => row.frameworkSkillId));
    const p6Ids = new Set(p6.map((row) => row.frameworkSkillId));

    expect(p3Ids.has('F026')).toBe(false);
    expect(p6Ids.has('F026')).toBe(true);
    expect(p3Ids.size).toBeLessThanOrEqual(p6Ids.size);
  });
});
