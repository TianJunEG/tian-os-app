import { describe, expect, it } from 'vitest';
import { buildPartnerMetricsFromData } from '../services/partners/partnerMetricsService.js';

describe('buildPartnerMetricsFromData', () => {
  it('aggregates partner student, recovery, diagnostic, paper, and improvement metrics', () => {
    const metrics = buildPartnerMetricsFromData({
      partner: { _id: 'p1' },
      memberships: [
        { userId: 'u1', status: 'active' },
        { userId: 'u2', status: 'removed' },
      ],
      studentLinks: [
        { studentId: 's1', status: 'active' },
        { studentId: 's2', status: 'active' },
      ],
      learningEvents: [
        { studentId: 's1', occurredAt: new Date() },
        { studentId: 'outside', occurredAt: new Date() },
      ],
      diagnostics: [
        { studentId: 's1', status: 'completed', diagnosticPurpose: 'baseline', isBaseline: true, diagnosticSessionId: 'b1', readinessScore: 40, completedAt: new Date('2026-01-01') },
        { studentId: 's1', status: 'completed', diagnosticPurpose: 'recheck', diagnosticSessionId: 'r1', readinessScore: 75, completedAt: new Date('2026-02-01'), assignedPracticeSkillIds: ['F015'] },
        { studentId: 's2', status: 'completed', diagnosticPurpose: 'baseline', isBaseline: true, diagnosticSessionId: 'b2', readinessScore: 50, completedAt: new Date('2026-01-02') },
      ],
      assignments: [
        { studentId: 's1', status: 'completed' },
        { studentId: 's2', status: 'in_progress' },
      ],
      paperAnalyses: [
        { studentId: 's2', weakSkillIds: ['F018'] },
      ],
    });

    expect(metrics.totalStudents).toBe(2);
    expect(metrics.staffCount).toBe(1);
    expect(metrics.activeStudents7d).toBe(1);
    expect(metrics.baselineDiagnosticsCompleted).toBe(2);
    expect(metrics.recoveryPacksAssigned).toBe(2);
    expect(metrics.recoveryPacksCompleted).toBe(1);
    expect(metrics.recheckCompletionRate).toBe(33);
    expect(metrics.averageReadinessImprovement).toBe(35);
    expect(metrics.papersUploaded).toBe(1);
    expect(metrics.studentsNeedingAttention).toBe(2);
  });
});
