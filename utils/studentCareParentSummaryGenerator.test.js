import { describe, expect, it } from 'vitest';
import { generateStudentCareParentSummary } from '../services/studentCare/studentCareParentSummaryGenerator.js';

describe('studentCareParentSummaryGenerator', () => {
  it('generates a concise parent communication summary', () => {
    const summary = generateStudentCareParentSummary({
      student: { _id: 'student_1', name: 'Sarah', level: 'P4' },
      assignments: [
        {
          _id: 'a1',
          title: 'Fractions Recovery Pack',
          status: 'completed',
          completion: { accuracy: 84, completedAt: '2026-06-06T00:00:00.000Z' },
          recheck: { recommended: true },
        },
      ],
      growth: { remainingWeakSkills: ['Fraction Word Problems'] },
      recommendations: [{ type: 'run_recheck', title: 'Run Recheck', reason: 'Recovery Pack completed.' }],
    });

    expect(summary.today.completedRecoveryPack.title).toBe('Fractions Recovery Pack');
    expect(summary.today.completedRecoveryPack.accuracy).toBe(84);
    expect(summary.today.recheckRecommended).toBe(true);
    expect(summary.weakArea).toBe('Fraction Word Problems');
    expect(summary.recommendedNextAction.type).toBe('run_recheck');
    expect(summary.parentCopy).toContain('Sarah completed Fractions Recovery Pack');
  });
});
