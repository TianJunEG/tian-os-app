import { describe, expect, it } from 'vitest';
import { generateParentProgressReport } from '../services/mathpath/progressReportGenerator.js';

describe('progressReportGenerator', () => {
  it('generates a parent JSON progress report from growth and intervention evidence', () => {
    const report = generateParentProgressReport({
      student: { _id: 'student_1', name: 'Sarah', level: 'P4' },
      growth: {
        baseline: { diagnosticSessionId: 'd1', readinessScore: 42, completedAt: '2026-06-01' },
        latest: { diagnosticSessionId: 'd2', diagnosticPurpose: 'recheck', readinessScore: 78, completedAt: '2026-06-05' },
        overallImprovement: 36,
        remainingWeakSkills: ['F019'],
        history: [
          { diagnosticSessionId: 'd1', diagnosticPurpose: 'baseline', readinessScore: 42, completedAt: '2026-06-01' },
          { diagnosticSessionId: 'd2', diagnosticPurpose: 'recheck', readinessScore: 78, completedAt: '2026-06-05', assignmentId: 'a1' },
        ],
      },
      assignments: [{ _id: 'a1', title: 'Fractions Recovery Pack', status: 'completed', completion: { completedAt: '2026-06-04', accuracy: 80 }, skillIds: ['F015'] }],
      papers: [{ _id: 'p1', originalFilename: 'test.pdf', status: 'reviewed', weakSkillIds: ['F019'], reviewedAt: '2026-06-03' }],
      recommendations: [{ type: 'run_recheck', title: 'Run Recheck', reason: 'Ready', priority: 'high' }],
    });

    expect(report.student.name).toBe('Sarah');
    expect(report.baseline.readinessScore).toBe(42);
    expect(report.latestDiagnostic.readinessScore).toBe(78);
    expect(report.improvement).toBe(36);
    expect(report.recoveryPacksCompleted).toHaveLength(1);
    expect(report.rechecksCompleted).toHaveLength(1);
    expect(report.currentWeakSkills).toEqual(['F019']);
    expect(report.recommendedNextSteps[0].type).toBe('run_recheck');
  });
});
