import { beforeEach, describe, expect, it, vi } from 'vitest';

const findMock = vi.fn();
const assignmentFindOneMock = vi.fn();

vi.mock('../models/mathpath/MathPathDiagnosticSession.js', () => ({
  default: {
    find: (...args) => findMock(...args),
  },
}));

vi.mock('../models/mathpath/MathPathAssignment.js', () => ({
  default: {
    findOne: (...args) => assignmentFindOneMock(...args),
  },
}));

const {
  applyDiagnosticCompletionMetadata,
  buildDiagnosticGrowth,
  buildPerSkillSnapshot,
  getDiagnosticHistory,
  getDiagnosticGrowth,
} = await import('../services/diagnostics/diagnosticGrowthService.js');

function mockCompletedSessions(rows = []) {
  const lean = vi.fn().mockResolvedValue(rows);
  const sort = vi.fn().mockReturnValue({ lean });
  findMock.mockReturnValue({ sort });
  return { sort, lean };
}

describe('diagnostic growth service', () => {
  beforeEach(() => {
    findMock.mockReset();
    assignmentFindOneMock.mockReset();
  });

  it('marks the first completed diagnostic as the immutable baseline', async () => {
    mockCompletedSessions([]);
    const session = {
      diagnosticSessionId: 'diag_1',
      studentId: 'student_1',
      subjectId: 'math',
      domainId: 'fractions',
      isBaseline: false,
      baselineDiagnosticId: '',
      previousDiagnosticId: '',
    };

    await applyDiagnosticCompletionMetadata(session, { responses: [] });

    expect(session.isBaseline).toBe(true);
    expect(session.baselineDiagnosticId).toBe('diag_1');
    expect(session.previousDiagnosticId).toBe('');
  });

  it('links later diagnostics to the existing baseline and previous diagnostic', async () => {
    mockCompletedSessions([
      {
        diagnosticSessionId: 'diag_base',
        diagnosticPurpose: 'baseline',
        isBaseline: true,
        completedAt: new Date('2026-06-01T00:00:00.000Z'),
      },
      {
        diagnosticSessionId: 'diag_prev',
        diagnosticPurpose: 'recheck',
        isBaseline: false,
        completedAt: new Date('2026-06-03T00:00:00.000Z'),
      },
    ]);
    const session = {
      diagnosticSessionId: 'diag_latest',
      studentId: 'student_1',
      subjectId: 'math',
      domainId: 'fractions',
      isBaseline: true,
      baselineDiagnosticId: 'diag_latest',
      previousDiagnosticId: '',
    };

    await applyDiagnosticCompletionMetadata(session, { responses: [] });

    expect(session.isBaseline).toBe(false);
    expect(session.baselineDiagnosticId).toBe('diag_base');
    expect(session.previousDiagnosticId).toBe('diag_prev');
  });

  it('stores a per-skill snapshot with score, confidence, timing, working and evidence fields', () => {
    const snapshot = buildPerSkillSnapshot({
      responses: [
        {
          questionId: 'q1',
          skillId: 'F011',
          correct: true,
          confidence: 'i_know_this',
          timeTakenMs: 10000,
          workingSubmitted: true,
        },
        {
          questionId: 'q2',
          skillId: 'F011',
          correct: false,
          confidence: 'not_sure',
          timeTakenMs: 20000,
          workingSubmitted: false,
          detectedErrorTags: ['equivalence_scale_error'],
        },
      ],
      skillsByFrameworkId: new Map([['F011', { name: 'Generate Equivalent Fractions' }]]),
    });

    expect(snapshot).toEqual([
      expect.objectContaining({
        skillId: 'F011',
        skillName: 'Generate Equivalent Fractions',
        questionsAnswered: 2,
        correctCount: 1,
        score: 50,
        confidenceScore: 75,
        averageTimeTaken: 15,
        workingSubmittedRate: 50,
        misconceptionTags: ['equivalence_scale_error'],
        evidenceQuestionIds: ['q1', 'q2'],
      }),
    ]);
  });

  it('returns diagnostic history in chronological shape', async () => {
    mockCompletedSessions([
      {
        diagnosticSessionId: 'diag_base',
        diagnosticPurpose: 'baseline',
        attemptNumber: 1,
        isBaseline: true,
        completedAt: new Date('2026-06-01T00:00:00.000Z'),
        readinessScore: 42,
        result: { totalQuestions: 10, correctCount: 4, weakSkillIds: ['F015'] },
        perSkillSnapshot: [{ skillId: 'F015', score: 30 }],
      },
      {
        diagnosticSessionId: 'diag_recheck',
        diagnosticPurpose: 'recheck',
        attemptNumber: 2,
        isBaseline: false,
        baselineDiagnosticId: 'diag_base',
        previousDiagnosticId: 'diag_base',
        completedAt: new Date('2026-06-05T00:00:00.000Z'),
        readinessScore: 78,
        result: { totalQuestions: 10, correctCount: 8, masteredSkillIds: ['F011'] },
        perSkillSnapshot: [{ skillId: 'F011', score: 90 }],
      },
    ]);

    const history = await getDiagnosticHistory({ studentId: 'student_1', subjectId: 'math', domainId: 'fractions' });

    expect(history.map((item) => item.diagnosticSessionId)).toEqual(['diag_base', 'diag_recheck']);
    expect(history[0]).toMatchObject({
      diagnosticSessionId: 'diag_base',
      isBaseline: true,
      readinessScore: 42,
      totalQuestions: 10,
      correctCount: 4,
      weakSkillIds: ['F015'],
    });
  });

  it('calculates readiness and per-skill growth from baseline to latest diagnostic', () => {
    const growth = buildDiagnosticGrowth([
      {
        diagnosticSessionId: 'diag_base',
        isBaseline: true,
        readinessScore: 42,
        completedAt: '2026-06-01T00:00:00.000Z',
        perSkillSnapshot: [{ skillId: 'F011', skillName: 'Generate Equivalent Fractions', score: 25 }],
      },
      {
        diagnosticSessionId: 'diag_latest',
        isBaseline: false,
        readinessScore: 78,
        completedAt: '2026-06-05T00:00:00.000Z',
        weakSkillIds: ['F015'],
        perSkillSnapshot: [{ skillId: 'F011', skillName: 'Generate Equivalent Fractions', score: 80 }],
      },
    ]);

    expect(growth.overallImprovement).toBe(36);
    expect(growth.perSkillGrowth).toContainEqual(expect.objectContaining({
      skillId: 'F011',
      beforeScore: 25,
      currentScore: 80,
      improvement: 55,
      status: 'improved',
    }));
    expect(growth.remainingWeakSkills).toEqual(['F015']);
    expect(growth.recommendedActions[0]).toMatchObject({ type: 'assign_practice', skillId: 'F015' });
  });

  it('returns assignment-linked growth attribution when assignmentId is provided', async () => {
    mockCompletedSessions([
      {
        diagnosticSessionId: 'diag_base',
        isBaseline: true,
        readinessScore: 40,
        completedAt: new Date('2026-06-01T00:00:00.000Z'),
        perSkillSnapshot: [{ skillId: 'F015', skillName: 'Add Fractions', score: 30 }],
      },
      {
        diagnosticSessionId: 'diag_after',
        isBaseline: false,
        readinessScore: 75,
        completedAt: new Date('2026-06-05T00:00:00.000Z'),
        perSkillSnapshot: [{ skillId: 'F015', skillName: 'Add Fractions', score: 80 }],
      },
    ]);
    assignmentFindOneMock.mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue({
        _id: 'assignment_1',
        title: 'Fractions Recovery Pack',
        sourceType: 'diagnostic',
        sourceId: 'diag_base',
        skillIds: ['F015'],
        status: 'completed',
        createdAt: new Date('2026-06-02T00:00:00.000Z'),
        completion: { questionsAttempted: 12, correctCount: 9, accuracy: 75 },
      }),
    });

    const growth = await getDiagnosticGrowth({
      studentId: 'student_1',
      subjectId: 'math',
      domainId: 'fractions',
      assignmentId: 'assignment_1',
    });

    expect(growth.assignmentGrowth).toMatchObject({
      assignmentId: 'assignment_1',
      available: true,
      targetedSkillIds: ['F015'],
      improvementAfterAssignment: 35,
    });
    expect(growth.assignmentGrowth.targetedSkillGrowth[0]).toMatchObject({ skillId: 'F015', improvement: 50 });
  });
});
