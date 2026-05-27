import { describe, it, expect } from 'vitest';
import { buildSuggestedGroups } from './teacherGrouping.js';

describe('buildSuggestedGroups — rule-based remediation grouping', () => {
  it('groups students who share a weakest skill below the threshold', () => {
    const groups = buildSuggestedGroups({ students: [
      { studentId: 'a', name: 'A', weakSkills: [{ skillId: 's1', skillName: 'Fractions', score: 20 }] },
      { studentId: 'b', name: 'B', weakSkills: [{ skillId: 's1', skillName: 'Fractions', score: 30 }] },
      { studentId: 'c', name: 'C', weakSkills: [{ skillId: 's2', skillName: 'Ratio', score: 35 }] },
    ] });
    const fractions = groups.find((g) => g.targetSkillId === 's1');
    expect(fractions.students.length).toBe(2);
    expect(fractions.name).toMatch(/Fractions/);
  });

  it('excludes students with no weak skill below 40', () => {
    const groups = buildSuggestedGroups({ students: [
      { studentId: 'a', name: 'A', weakSkills: [{ skillId: 's1', skillName: 'X', score: 70 }] },
    ] });
    expect(groups.length).toBe(0);
  });

  it('sorts larger groups first', () => {
    const groups = buildSuggestedGroups({ students: [
      { studentId: 'a', name: 'A', weakSkills: [{ skillId: 's1', skillName: 'X', score: 20 }] },
      { studentId: 'b', name: 'B', weakSkills: [{ skillId: 's1', skillName: 'X', score: 25 }] },
      { studentId: 'c', name: 'C', weakSkills: [{ skillId: 's2', skillName: 'Y', score: 30 }] },
    ] });
    expect(groups[0].targetSkillId).toBe('s1');
  });
});
