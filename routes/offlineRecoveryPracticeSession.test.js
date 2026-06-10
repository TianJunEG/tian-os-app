import { describe, expect, it } from 'vitest';
import { buildOfflineRecoveryPracticeSessionFields } from './mastery.js';

describe('buildOfflineRecoveryPracticeSessionFields (backend-down fallback persistence)', () => {
  it('builds a persistable session from a self-contained payload', () => {
    const fields = buildOfflineRecoveryPracticeSessionFields({
      practiceSessionId: 'fracpractice_123',
      studentId: 'student_1',
      body: {
        targetSkillId: 'F016',
        targetQuestionFamilyIds: ['QF_F016_001'],
        assignmentId: 'assign_1',
        questions: [
          { questionId: 'q1', skillId: 'F016' },
          { questionId: 'q2', skillId: 'F016' },
        ],
      },
    });

    expect(fields).toMatchObject({
      practiceSessionId: 'fracpractice_123',
      studentId: 'student_1',
      domainId: 'fractions',
      targetSkillId: 'F016',
      targetQuestionFamilyIds: ['QF_F016_001'],
      sessionGoal: 'offline_recovery',
      estimatedQuestionCount: 2,
      assignmentId: 'assign_1',
      status: 'inProgress',
    });
    expect(fields.questions).toHaveLength(2);
  });

  it('falls back to the first question skill when targetSkillId is omitted', () => {
    const fields = buildOfflineRecoveryPracticeSessionFields({
      practiceSessionId: 'fracpractice_456',
      studentId: 'student_1',
      body: { questions: [{ questionId: 'q1', skillId: 'F010' }] },
    });
    expect(fields.targetSkillId).toBe('F010');
    expect(fields.assignmentId).toBe('');
  });

  it('returns null when there are no questions (stays a 404)', () => {
    expect(buildOfflineRecoveryPracticeSessionFields({
      practiceSessionId: 'x',
      studentId: 'student_1',
      body: { targetSkillId: 'F016', questions: [] },
    })).toBeNull();
  });

  it('returns null when no skill can be resolved', () => {
    expect(buildOfflineRecoveryPracticeSessionFields({
      practiceSessionId: 'x',
      studentId: 'student_1',
      body: { questions: [{ questionId: 'q1' }] },
    })).toBeNull();
  });

  it('returns null for an empty/missing body', () => {
    expect(buildOfflineRecoveryPracticeSessionFields({ practiceSessionId: 'x', studentId: 's' })).toBeNull();
  });
});
