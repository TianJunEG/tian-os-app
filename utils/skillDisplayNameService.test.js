import { describe, expect, it } from 'vitest';
import { getSkillDisplayName, replaceSkillIdsForStudents } from '../services/mathpath/skillDisplayNameService.js';

describe('skillDisplayNameService', () => {
  it('returns student-safe labels instead of raw skill ids', () => {
    const display = getSkillDisplayName('F018');

    expect(display.shortStudentLabel).toBe('Adding fractions with different denominators');
    expect(display.shortStudentLabel).not.toContain('F018');
    expect(display.teacherLabel).toBe('Add Different Denominators');
    expect(display.teacherLabel).not.toContain('F018');
  });

  it('replaces raw skill ids in student-facing copy', () => {
    const text = replaceSkillIdsForStudents('F011 and F018 are ready for practice.');

    expect(text).toContain('Making equivalent fractions');
    expect(text).toContain('Adding fractions with different denominators');
    expect(text).not.toMatch(/\bF\d{3}\b/);
  });
});
