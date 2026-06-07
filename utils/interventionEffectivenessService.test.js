import { describe, expect, it } from 'vitest';
import { calculateInterventionEffectiveness } from '../services/mathpath/interventionEffectivenessService.js';

describe('interventionEffectivenessService', () => {
  it('calculates completion, improvement, success and repeated failure by skill', () => {
    const report = calculateInterventionEffectiveness({
      assignments: [
        {
          _id: 'assignment_1',
          sourceType: 'diagnostic',
          sourceId: 'diag_1',
          status: 'completed',
          skillIds: ['F018'],
          completion: { accuracy: 82 },
        },
        {
          _id: 'assignment_2',
          sourceType: 'diagnostic',
          sourceId: 'diag_2',
          status: 'completed',
          skillIds: ['F019'],
          completion: { accuracy: 60 },
        },
      ],
      diagnostics: [
        {
          diagnosticSessionId: 'diag_1',
          perSkillSnapshot: [{ skillId: 'F018', score: 35 }],
        },
        {
          diagnosticPurpose: 'recheck',
          assignmentId: 'assignment_1',
          perSkillSnapshot: [{ skillId: 'F018', score: 82 }],
        },
        {
          diagnosticSessionId: 'diag_2',
          perSkillSnapshot: [{ skillId: 'F019', score: 44 }],
        },
        {
          diagnosticPurpose: 'recheck',
          assignmentId: 'assignment_2',
          perSkillSnapshot: [{ skillId: 'F019', score: 58 }],
        },
      ],
    });

    const f018 = report.perSkill.find((row) => row.skillId === 'F018');
    const f019 = report.perSkill.find((row) => row.skillId === 'F019');

    expect(report.recoveryPackCompletionRate).toBe(100);
    expect(f018.recheckSuccessRate).toBe(100);
    expect(f018.improvementRate).toBe(47);
    expect(f019.repeatedFailureRate).toBe(100);
    expect(f019.unresolvedMisconceptions.length).toBeGreaterThan(0);
  });
});
