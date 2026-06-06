import { describe, expect, it } from 'vitest';
import { buildTutorLessonPrep, buildTutorLessonPrepPreview } from '../services/mathpath/tutorLessonPrepEngine.js';

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

  it('prioritises repeated misconceptions, paper findings and low assignment accuracy', () => {
    const prep = buildTutorLessonPrep({
      student: { _id: 'student_1', name: 'Daniel', level: 'P5' },
      growth: {
        baseline: { readinessScore: 42 },
        latest: { readinessScore: 61 },
        overallImprovement: 19,
        remainingWeakSkills: ['F019'],
        perSkillGrowth: [{ skillId: 'F023', improvement: 0, status: 'no_change' }],
      },
      mistakes: [
        { _id: 'm1', skillId: 'F023', mistakeCode: 'fraction_remainder', frequency: 4, severity: 'high' },
      ],
      papers: [
        {
          _id: 'paper_1',
          originalFilename: 'WA2.pdf',
          status: 'reviewed',
          weakSkillIds: ['F023'],
          detectedQuestions: [{ misconceptionTags: ['uses_original_quantity'] }],
        },
      ],
      assignments: [
        {
          _id: 'assignment_1',
          title: 'Paper Recovery Pack',
          status: 'completed',
          skillIds: ['F023'],
          completion: { questionsAttempted: 12, questionsAssigned: 12, accuracy: 58 },
          recheck: { recommended: true },
        },
      ],
      workings: [
        { workingId: 'work_1', skillId: 'F023', procedureAnalysis: { detectedIssue: 'uses original instead of remainder' } },
      ],
    });

    expect(prep.studentSummary.name).toBe('Daniel');
    expect(prep.recommendedLessonFocus[0].skillId).toBe('F023');
    expect(prep.recommendedLessonFocus[0].why).toEqual(expect.arrayContaining([
      'Same misconception or mistake appears repeatedly.',
      'School paper review confirmed this weak skill.',
      'Recovery Pack accuracy is below 70%.',
    ]));
    expect(prep.recentPaperFindings[0].weakSkillIds).toContain('F023');
    expect(prep.recheckReadiness.ready).toBe(true);
    expect(prep.suggestedHomework.skillIds).toContain('F023');
    expect(prep.suggestedLessonFlow).toHaveLength(5);
  });
});
