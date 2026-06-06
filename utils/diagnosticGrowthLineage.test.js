import { beforeEach, describe, expect, it, vi } from 'vitest';

const findMock = vi.fn();

vi.mock('../models/mathpath/MathPathDiagnosticSession.js', () => ({
  default: {
    find: (...args) => findMock(...args),
  },
}));

const { resolveDiagnosticLineage } = await import('../services/diagnostics/diagnosticGrowthService.js');

function mockCompletedSessions(rows) {
  findMock.mockReturnValueOnce({
    sort: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue(rows),
    }),
  });
}

describe('diagnostic growth lineage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks the first diagnostic as baseline', async () => {
    mockCompletedSessions([]);

    await expect(resolveDiagnosticLineage({
      studentId: 'student_1',
      subjectId: 'math',
      domainId: 'fractions',
      diagnosticSessionId: 'diag_1',
    })).resolves.toMatchObject({
      baselineDiagnosticId: 'diag_1',
      previousDiagnosticId: '',
      attemptNumber: 1,
      isBaseline: true,
    });
  });

  it('links later diagnostics to the original baseline and previous diagnostic', async () => {
    mockCompletedSessions([
      { diagnosticSessionId: 'diag_1', isBaseline: true, completedAt: new Date('2026-01-01') },
      { diagnosticSessionId: 'diag_2', isBaseline: false, completedAt: new Date('2026-02-01') },
    ]);

    await expect(resolveDiagnosticLineage({
      studentId: 'student_1',
      subjectId: 'math',
      domainId: 'fractions',
      diagnosticSessionId: 'diag_3',
    })).resolves.toMatchObject({
      baselineDiagnosticId: 'diag_1',
      previousDiagnosticId: 'diag_2',
      attemptNumber: 3,
      isBaseline: false,
    });
  });
});
