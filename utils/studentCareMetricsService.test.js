import { describe, expect, it } from 'vitest';
import { buildStudentCareMetrics } from '../services/studentCare/studentCareMetricsService.js';

describe('studentCareMetricsService', () => {
  it('aggregates operational Student Care metrics', () => {
    const metrics = buildStudentCareMetrics({
      students: [{ _id: 's1' }, { _id: 's2' }],
      assignments: [
        { _id: 'a1', status: 'completed' },
        { _id: 'a2', status: 'in_progress' },
      ],
      diagnosticGrowth: [
        { overallImprovement: 30, latest: { diagnosticPurpose: 'recheck' } },
        { overallImprovement: 10, latest: { diagnosticPurpose: 'baseline' } },
      ],
      papers: [
        { _id: 'p1', status: 'reviewed' },
        { _id: 'p2', status: 'needs_review' },
      ],
    });

    expect(metrics).toEqual({
      studentsSupported: 2,
      recoveryPacksAssigned: 2,
      recoveryPacksCompleted: 1,
      rechecksCompleted: 1,
      averageReadinessImprovement: 20,
      papersUploaded: 2,
      papersReviewed: 1,
    });
  });
});
