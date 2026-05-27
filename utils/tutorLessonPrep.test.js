import { describe, it, expect } from 'vitest';
import { buildLessonPrep } from './tutorLessonPrep.js';

describe('buildLessonPrep — rule-based tutor lesson prep', () => {
  it('focuses on the lowest-scoring attempted skill below mastery', () => {
    const prep = buildLessonPrep({ records: [
      { skillId: 'a', skillName: 'Adding unlike fractions', topicName: 'Fractions', score: 30, status: 'needs_review', attempts: 5 },
      { skillId: 'b', skillName: 'Equivalent fractions', topicName: 'Fractions', score: 60, status: 'learning', attempts: 4 },
    ] });
    expect(prep.focus.skillId).toBe('a');
    expect(prep.suggestedHomework.skillId).toBe('a');
    expect(prep.teachingSequence.length).toBe(4);
  });

  it('falls back to the most-mistaken skill when nothing is attempted-below', () => {
    const prep = buildLessonPrep({ records: [], mistakesBySkill: [{ skillId: 'x', skillName: 'Ratio', count: 4 }] });
    expect(prep.focus.skillId).toBe('x');
  });

  it('surfaces an overdue note', () => {
    const prep = buildLessonPrep({ records: [{ skillId: 'a', skillName: 'X', topicName: 'T', score: 20, status: 'needs_review', attempts: 3 }], overdueCount: 2 });
    expect(prep.notes.join(' ')).toMatch(/overdue/);
  });

  it('handles a student with no data', () => {
    const prep = buildLessonPrep({});
    expect(prep.focus).toBeNull();
    expect(prep.suggestedHomework).toBeNull();
  });
});
