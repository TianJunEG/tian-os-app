import { describe, expect, it } from 'vitest';
import { buildWeakGroupsFromEvidence } from '../services/teacher/weakGroupEngine.js';

const students = [
  { _id: 's1', name: 'Ari' },
  { _id: 's2', name: 'Bea' },
  { _id: 's3', name: 'Chen' },
];

describe('buildWeakGroupsFromEvidence', () => {
  it('groups students by weak skill from diagnostic snapshots', () => {
    const groups = buildWeakGroupsFromEvidence({
      students,
      diagnostics: [
        {
          studentId: 's1',
          perSkillSnapshot: [{ skillId: 'F015', skillName: 'Add Fractions', score: 42, questionsAnswered: 3 }],
        },
        {
          studentId: 's2',
          resultPayload: { weakSkillIds: ['F015'] },
        },
      ],
    });

    const group = groups.find((item) => item.skillId === 'F015');
    expect(group.studentIds).toEqual(['s1', 's2']);
    expect(group.priority).toBe('medium');
    expect(group.evidenceTypes).toContain('diagnostic');
  });

  it('groups repeated misconception evidence under the matching skill', () => {
    const groups = buildWeakGroupsFromEvidence({
      students,
      mistakes: [
        { studentId: 's1', skillId: 'F018', mistakeCode: 'wrong_denominator', mistakeName: 'Wrong denominator', severity: 'high', frequency: 2 },
        { studentId: 's2', skillId: 'F018', mistakeCode: 'wrong_denominator', mistakeName: 'Wrong denominator', severity: 'medium', frequency: 1 },
      ],
    });

    const group = groups.find((item) => item.skillId === 'F018');
    expect(group.students.map((student) => student.name)).toEqual(['Ari', 'Bea']);
    expect(group.misconceptionTags).toContain('wrong_denominator');
    expect(group.priority).toBe('high');
  });

  it('raises priority when paper analysis confirms weak questions', () => {
    const groups = buildWeakGroupsFromEvidence({
      students,
      paperAnalyses: [
        {
          studentId: 's3',
          weakSkillIds: ['F025'],
          detectedQuestions: [
            { adultConfirmedWrong: true, detectedSkillIds: ['F025'], misconceptionTags: ['wrong_whole'] },
          ],
        },
      ],
    });

    const group = groups.find((item) => item.skillId === 'F025');
    expect(group.priority).toBe('high');
    expect(group.evidenceTypes).toContain('paper_analysis');
    expect(group.misconceptionTags).toContain('wrong_whole');
  });

  it('includes completed recovery packs that are ready for recheck', () => {
    const groups = buildWeakGroupsFromEvidence({
      students,
      assignments: [
        {
          studentId: 's1',
          skillIds: ['F023'],
          status: 'completed',
          completion: { accuracy: 82 },
          recheck: { recommended: true },
        },
      ],
    });

    const group = groups.find((item) => item.skillId === 'F023');
    expect(group.evidenceTypes).toContain('recovery_pack');
    expect(group.evidenceSummary).toMatch(/1 student/);
  });

  it('sorts high-priority groups first', () => {
    const groups = buildWeakGroupsFromEvidence({
      students,
      diagnostics: [{ studentId: 's1', resultPayload: { weakSkillIds: ['F011'] } }],
      paperAnalyses: [{ studentId: 's2', weakSkillIds: ['F026'] }],
    });

    expect(groups[0].skillId).toBe('F026');
    expect(groups[0].priority).toBe('high');
  });
});
