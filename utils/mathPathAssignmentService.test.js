import { beforeEach, describe, expect, it, vi } from 'vitest';

const assignmentCreate = vi.fn();
const assignmentFind = vi.fn();
const assignmentFindById = vi.fn();
const assignmentFindOne = vi.fn();
const diagnosticFindOne = vi.fn();
const attemptFind = vi.fn();
const paperFindById = vi.fn();
const studentFindById = vi.fn();
const startAdaptiveDiagnostic = vi.fn();

vi.mock('../models/mathpath/MathPathAssignment.js', () => ({
  default: {
    create: (...args) => assignmentCreate(...args),
    find: (...args) => assignmentFind(...args),
    findById: (...args) => assignmentFindById(...args),
    findOne: (...args) => assignmentFindOne(...args),
  },
}));

vi.mock('../models/mathpath/MathPathDiagnosticSession.js', () => ({
  default: { findOne: (...args) => diagnosticFindOne(...args) },
}));

vi.mock('../models/mathpath/MathPathAttempt.js', () => ({
  default: { find: (...args) => attemptFind(...args) },
}));

vi.mock('../models/mathpath/PaperAnalysis.js', () => ({
  default: { findById: (...args) => paperFindById(...args) },
}));

vi.mock('../models/Student.js', () => ({
  default: { findById: (...args) => studentFindById(...args) },
}));

vi.mock('../services/diagnostics/diagnosticRuntime.js', () => ({
  startAdaptiveDiagnostic: (...args) => startAdaptiveDiagnostic(...args),
}));

const service = await import('../services/mathpath/mathPathAssignmentService.js');

function createdAssignment(overrides = {}) {
  return {
    _id: 'assignment_1',
    studentId: 'student_1',
    skillIds: ['F015'],
    targetQuestionCount: 12,
    status: 'assigned',
    toObject() {
      return { _id: 'assignment_1', studentId: 'student_1', skillIds: ['F015'], targetQuestionCount: 12, status: 'assigned', ...overrides };
    },
    ...overrides,
  };
}

describe('mathPathAssignmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates an assignment from diagnostic weak skills', async () => {
    diagnosticFindOne.mockResolvedValueOnce({
      diagnosticSessionId: 'diag_1',
      studentId: 'student_1',
      status: 'completed',
      subjectId: 'math',
      domainId: 'fractions',
      result: { weakSkillIds: ['F015'] },
      perSkillSnapshot: [],
    });
    assignmentCreate.mockResolvedValueOnce(createdAssignment());

    const assignment = await service.createAssignmentFromDiagnostic({
      studentId: 'student_1',
      diagnosticSessionId: 'diag_1',
      assignedByUserId: 'adult_1',
      assignedByRole: 'parent',
    });

    expect(assignmentCreate).toHaveBeenCalledWith(expect.objectContaining({
      studentId: 'student_1',
      sourceType: 'diagnostic',
      sourceId: 'diag_1',
      skillIds: ['F015'],
      targetQuestionCount: 12,
    }));
    expect(assignment.id).toBe('assignment_1');
  });

  it('rejects diagnostic assignments when weak skills are empty', async () => {
    diagnosticFindOne.mockResolvedValueOnce({
      diagnosticSessionId: 'diag_1',
      studentId: 'student_1',
      status: 'completed',
      result: {},
      perSkillSnapshot: [{ skillId: 'F001', score: 90 }],
    });

    await expect(service.createAssignmentFromDiagnostic({
      studentId: 'student_1',
      diagnosticSessionId: 'diag_1',
      assignedByUserId: 'adult_1',
    })).rejects.toMatchObject({ status: 400 });
    expect(assignmentCreate).not.toHaveBeenCalled();
  });

  it('creates an assignment from reviewed paper analysis', async () => {
    const paper = {
      _id: 'paper_1',
      studentId: 'student_1',
      subjectId: 'math',
      domainId: 'fractions',
      status: 'reviewed',
      weakSkillIds: ['F019'],
      detectedQuestions: [],
      recommendedActions: [{ type: 'assign_practice', skillId: 'F019', status: 'pending_review' }],
      linkedPracticeAssignmentIds: [],
      save: vi.fn().mockResolvedValue(undefined),
    };
    paperFindById.mockResolvedValueOnce(paper);
    assignmentCreate.mockResolvedValueOnce(createdAssignment({ _id: 'assignment_2', skillIds: ['F019'] }));

    const assignment = await service.createAssignmentFromPaperAnalysis({
      paperAnalysisId: 'paper_1',
      assignedByUserId: 'adult_1',
      assignedByRole: 'tutor',
    });

    expect(assignmentCreate).toHaveBeenCalledWith(expect.objectContaining({
      sourceType: 'paper_analysis',
      sourceId: 'paper_1',
      skillIds: ['F019'],
    }));
    expect(paper.status).toBe('assigned');
    expect(paper.save).toHaveBeenCalled();
    expect(assignment.id).toBe('assignment_2');
  });

  it('updates progress from persisted attempts and recommends recheck at 80 percent with accuracy threshold', async () => {
    const assignment = {
      _id: 'assignment_1',
      studentId: 'student_1',
      targetQuestionCount: 10,
      status: 'in_progress',
      completion: { questionsAssigned: 10, questionsAttempted: 0, correctCount: 0, accuracy: 0 },
      recheck: {},
      save: vi.fn().mockResolvedValue(undefined),
      toObject() { return this; },
    };
    assignmentFindById
      .mockResolvedValueOnce(assignment)
      .mockResolvedValueOnce(assignment)
      .mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue(assignment),
      });
    attemptFind.mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue([
        ...Array.from({ length: 6 }, (_, i) => ({ attemptId: `a${i}`, correct: true })),
        ...Array.from({ length: 2 }, (_, i) => ({ attemptId: `b${i}`, correct: false })),
      ]),
    });

    const updated = await service.updateAssignmentProgress({ assignmentId: 'assignment_1' });

    expect(updated.completion.questionsAttempted).toBe(8);
    expect(updated.completion.accuracy).toBe(75);
    expect(assignment.recheck.recommended).toBe(true);
  });
});
