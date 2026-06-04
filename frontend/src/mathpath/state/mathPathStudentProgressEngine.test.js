import { describe, expect, it } from 'vitest';
import { buildStudentProgressState } from './mathPathStudentProgressEngine';
import { fractionSkillGraph } from '../fractions/fractionSkillGraph';

describe('mathPathStudentProgressEngine recommendations', () => {
  it('advances from a newly mastered current skill to the next unmastered skill', () => {
    const state = buildStudentProgressState({
      studentId: 'student-1',
      diagnosticResult: { diagnosticCompleted: true, recommendedStartingSkillId: 'F006' },
      practiceState: {
        currentSkillId: 'F006',
        masteredSkillIds: ['F006'],
      },
    });

    expect(state.currentSkill).toBe('F007');
    expect(state.nextRecommendedAction).toMatchObject({
      action: 'continuePractice',
      skillId: 'F007',
      source: 'nextUnmasteredSkill',
    });
    expect(state.nextRecommendedAction.explanation).toMatch(/F006|secure|next unmastered/i);
  });

  it('prioritises retention review skills with an explainable reason', () => {
    const state = buildStudentProgressState({
      studentId: 'student-1',
      diagnosticResult: { diagnosticCompleted: true, recommendedStartingSkillId: 'F006' },
      practiceState: { currentSkillId: 'F006', masteredSkillIds: ['F006', 'F007'] },
      retentionState: { skillsDueForReview: ['F006'] },
    });

    expect(state.currentSkill).toBe('F006');
    expect(state.nextRecommendedAction).toMatchObject({
      action: 'completeRetentionReview',
      skillId: 'F006',
      source: 'retention',
      explanation: 'Review due today.',
    });
  });

  it('prioritises remediation skills over new learning', () => {
    const state = buildStudentProgressState({
      studentId: 'student-1',
      diagnosticResult: { diagnosticCompleted: true, recommendedStartingSkillId: 'F006' },
      practiceState: {
        currentSkillId: 'F006',
        masteredSkillIds: ['F006'],
        weakSkillIds: ['F008'],
      },
    });

    expect(state.currentSkill).toBe('F008');
    expect(state.nextRecommendedAction).toMatchObject({
      action: 'followRemediationPlan',
      skillId: 'F008',
      source: 'remediation',
    });
  });

  it('selects the next unmastered skill after completed prerequisites', () => {
    const state = buildStudentProgressState({
      studentId: 'student-1',
      diagnosticResult: { diagnosticCompleted: true, recommendedStartingSkillId: 'F001' },
      practiceState: {
        currentSkillId: 'F001',
        masteredSkillIds: ['F001', 'F002', 'F003'],
      },
    });

    expect(state.currentSkill).toBe('F004');
    expect(state.nextRecommendedAction.skillId).toBe('F004');
  });

  it('moves to mastery check after the full pathway is secure', () => {
    const state = buildStudentProgressState({
      studentId: 'student-1',
      diagnosticResult: { diagnosticCompleted: true, recommendedStartingSkillId: 'F026' },
      practiceState: {
        currentSkillId: 'F026',
        masteredSkillIds: fractionSkillGraph.skillIds,
        fluentSkillIds: fractionSkillGraph.skillIds,
      },
      retentionState: { retainedSkillIds: fractionSkillGraph.skillIds },
    });

    expect(state.nextRecommendedAction).toMatchObject({
      action: 'attemptAssessment',
      source: 'completedPathway',
    });
    expect(state.nextRecommendedAction.explanation).toMatch(/All fraction skills are secure/i);
  });
});
