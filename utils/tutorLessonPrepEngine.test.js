import { describe, expect, it } from 'vitest';
import { buildTutorLessonPrepPreview } from '../services/mathpath/tutorLessonPrepEngine.js';

describe('tutorLessonPrepEngine', () => {
  it('summarises weak skills, mistakes, papers and lesson focus', () => {
    const preview = buildTutorLessonPrepPreview({
      student: { _id: 'student_1', name: 'Daniel', level: 'P5' },
      growth: { remainingWeakSkills: ['F023', 'F019'] },
      mistakes: [
        { skillId: 'F023', mistakeCode: 'fraction_remainder', frequency: 3, severity: 'high' },
        { skillId: 'F019', mistakeCode: 'unlike_denominator', frequency: 1, severity: 'medium' },
      ],
      papers: [{ _id: 'paper_1', originalFilename: 'WA2.pdf', status: 'reviewed', weakSkillIds: ['F023'], createdAt: '2026-06-05' }],
      assignments: [{ _id: 'assignment_1', title: 'Paper Recovery Pack', status: 'in_progress', completion: { questionsAttempted: 8 } }],
    });

    expect(preview.student.name).toBe('Daniel');
    expect(preview.weakSkills).toContain('F023');
    expect(preview.recentMistakes[0].frequency).toBe(3);
    expect(preview.recentPapers[0].title).toBe('WA2.pdf');
    expect(preview.activeRecoveryPack.assignmentId).toBe('assignment_1');
    expect(preview.estimatedLessonDurationMinutes).toBe(30);
  });
});
