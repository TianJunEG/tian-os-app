import { beforeEach, describe, expect, it, vi } from 'vitest';

const diagnosticFind = vi.fn();
const assignmentFind = vi.fn();
const paperFind = vi.fn();
const mistakeFind = vi.fn();
const getDiagnosticHistory = vi.fn();
const buildDiagnosticGrowth = vi.fn();

function leanResult(value) {
  return { lean: vi.fn().mockResolvedValue(value) };
}

vi.mock('../models/mathpath/MathPathDiagnosticSession.js', () => ({
  default: { find: (...args) => diagnosticFind(...args) },
}));

vi.mock('../models/mathpath/MathPathAssignment.js', () => ({
  default: { find: (...args) => assignmentFind(...args) },
}));

vi.mock('../models/mathpath/PaperAnalysis.js', () => ({
  default: { find: (...args) => paperFind(...args) },
}));

vi.mock('../models/mathpath/MathPathMistakeRecord.js', () => ({
  default: { find: (...args) => mistakeFind(...args) },
}));

vi.mock('../services/diagnostics/diagnosticGrowthService.js', () => ({
  getDiagnosticHistory: (...args) => getDiagnosticHistory(...args),
  buildDiagnosticGrowth: (...args) => buildDiagnosticGrowth(...args),
}));

const { getPilotDashboardMetrics } = await import('../services/mathpath/pilotDashboardMetricsService.js');

describe('pilotDashboardMetricsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('aggregates pilot diagnostic, assignment, paper and misconception metrics', async () => {
    diagnosticFind
      .mockReturnValueOnce(leanResult([
        { studentId: 'student_1', readinessScore: 40 },
        { studentId: 'student_2', readinessScore: 50 },
      ]))
      .mockReturnValueOnce(leanResult([
        { studentId: 'student_1', diagnosticPurpose: 'recheck', readinessScore: 80 },
      ]));
    assignmentFind.mockReturnValueOnce(leanResult([
      { studentId: 'student_1', status: 'completed' },
      { studentId: 'student_2', status: 'in_progress' },
    ]));
    paperFind.mockReturnValueOnce(leanResult([
      { studentId: 'student_1', status: 'reviewed' },
      { studentId: 'student_2', status: 'needs_review' },
    ]));
    mistakeFind.mockReturnValueOnce(leanResult([
      { mistakeCode: 'add_denominators', frequency: 3 },
      { mistakeCode: 'add_denominators', frequency: 2 },
      { mistakeCode: 'remainder_error', frequency: 1 },
    ]));
    getDiagnosticHistory.mockResolvedValue([]);
    buildDiagnosticGrowth
      .mockReturnValueOnce({ overallImprovement: 40 })
      .mockReturnValueOnce({ overallImprovement: 20 });

    const metrics = await getPilotDashboardMetrics();

    expect(metrics.studentsWithBaseline).toBe(2);
    expect(metrics.studentsWithRecheck).toBe(1);
    expect(metrics.recoveryPacksAssigned).toBe(2);
    expect(metrics.recoveryPacksCompleted).toBe(1);
    expect(metrics.averageReadinessImprovement).toBe(30);
    expect(metrics.papersUploaded).toBe(2);
    expect(metrics.papersReviewed).toBe(1);
    expect(metrics.topMisconceptions[0]).toEqual({ misconception: 'add_denominators', count: 5 });
  });
});
