import { describe, expect, it } from 'vitest';
import { buildResetStudentStateDeletionPlan } from './mastery.js';

describe('reset demo student state deletion plan', () => {
  it('clears all pilot learning, telemetry, XP, working, and recent activity stores', () => {
    const plan = buildResetStudentStateDeletionPlan({
      studentId: 'student-string-id',
      studentObjectId: 'student-object-id',
      mathPathSessionIds: ['session-1', 'session-2'],
    });

    expect(plan.map((item) => item.key)).toEqual([
      'diagnostics',
      'attempts',
      'mistakes',
      'mistakeRecords',
      'skillStates',
      'sessions',
      'practiceAttempts',
      'masteryRecords',
      'mathPathPracticeSessions',
      'assessmentSessions',
      'workingSessions',
      'workingIntelligence',
      'telemetryEvents',
      'learningEvents',
      'xpRecords',
      'achievements',
      'fluencyRecords',
      'retentionReviews',
    ]);

    expect(plan.find((item) => item.key === 'telemetryEvents')?.query).toEqual({ studentId: 'student-string-id' });
    expect(plan.find((item) => item.key === 'learningEvents')?.query).toEqual({ studentId: 'student-object-id' });
    expect(plan.find((item) => item.key === 'xpRecords')?.query).toEqual({ studentId: 'student-object-id' });
    expect(plan.find((item) => item.key === 'practiceAttempts')?.query).toEqual({
      studentId: 'student-object-id',
      sessionId: { $in: ['session-1', 'session-2'] },
    });
  });
});
