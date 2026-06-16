import { describe, it, expect } from 'vitest';
import { buildTeacherNarration } from './teacherMascotNarration';

describe('buildTeacherNarration', () => {
  it('summarises the class with on-track / support / extension counts', () => {
    const { body } = buildTeacherNarration(
      { totalStudents: 24, studentsOnTrack: 18, studentsNeedingSupport: 6, studentsReadyForExtension: 4 },
      { className: 'P4 Jasmine', needsAttentionCount: 3 },
    );
    expect(body).toContain('P4 Jasmine');
    expect(body).toContain('18 of 24 on track');
    expect(body).toContain('6 need support');
    expect(body).toContain('3 students flagged');
  });

  it('singularises a single flagged student', () => {
    const { body } = buildTeacherNarration(
      { totalStudents: 10, studentsOnTrack: 9, studentsNeedingSupport: 1 },
      { className: 'Class A', needsAttentionCount: 1 },
    );
    expect(body).toContain('1 student flagged');
    expect(body).not.toContain('1 students');
  });

  it('handles an empty class without inventing numbers', () => {
    const { body } = buildTeacherNarration({ totalStudents: 0 }, { className: 'New class' });
    expect(body).toContain('No MathPath activity');
    expect(body).toContain('New class');
  });

  it('omits the flagged line when none are flagged', () => {
    const { body } = buildTeacherNarration(
      { totalStudents: 5, studentsOnTrack: 5 },
      { className: 'Class B', needsAttentionCount: 0 },
    );
    expect(body).not.toMatch(/flagged/);
  });
});
