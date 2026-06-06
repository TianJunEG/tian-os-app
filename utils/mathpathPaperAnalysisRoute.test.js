import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const findByIdMock = vi.fn();
const resolveStudentMock = vi.fn();
const createAssignmentFromPaperAnalysisMock = vi.fn();
const getStudentAssignmentsMock = vi.fn();
const createRecheckForAssignmentMock = vi.fn();

vi.mock('../middleware/auth.js', () => ({
  protect: (req, _res, next) => {
    req.user = { id: 'adult_1', role: 'parent' };
    next();
  },
}));

vi.mock('../models/mathpath/PaperAnalysis.js', () => ({
  default: {
    findById: (...args) => findByIdMock(...args),
  },
}));

vi.mock('../models/Student.js', () => ({
  default: {
    findById: vi.fn(),
  },
}));

vi.mock('../models/User.js', () => ({
  default: {
    findOne: vi.fn(),
  },
}));

vi.mock('../utils/studentContext.js', () => ({
  resolveStudent: (...args) => resolveStudentMock(...args),
}));

vi.mock('../services/mathpath/mathPathAssignmentService.js', () => ({
  createAssignmentFromPaperAnalysis: (...args) => createAssignmentFromPaperAnalysisMock(...args),
  createRecheckForAssignment: (...args) => createRecheckForAssignmentMock(...args),
  getStudentAssignments: (...args) => getStudentAssignmentsMock(...args),
}));

let router;

async function request(path, { method = 'GET', body } = {}) {
  return new Promise((resolve, reject) => {
    const req = {
      method: String(method || 'GET').toUpperCase(),
      url: path,
      path,
      originalUrl: path,
      query: {},
      body: body || {},
      headers: {},
      params: {},
    };
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        resolve({ status: this.statusCode, data: payload });
      },
      send(payload) {
        resolve({ status: this.statusCode, data: payload });
      },
    };
    router.handle(req, res, (err) => {
      if (err) reject(err);
      else resolve({ status: res.statusCode, data: null });
    });
  });
}

describe('mathpath paper analysis routes', () => {
  beforeAll(async () => {
    const mod = await import('../routes/mathpathPaperAnalysis.js');
    router = mod.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('allows adult review to confirm wrong questions and rebuild weak-skill recommendations', async () => {
    const doc = {
      _id: 'analysis_1',
      studentId: 'student_1',
      detectedQuestions: [],
      weakSkillIds: [],
      recommendedActions: [],
      save: vi.fn().mockResolvedValue(undefined),
    };
    findByIdMock.mockResolvedValueOnce(doc);
    resolveStudentMock.mockResolvedValueOnce({ _id: 'student_1' });

    const res = await request('/analysis_1/review', {
      method: 'PATCH',
      body: {
        detectedQuestions: [
          {
            questionNumber: '1',
            questionText: 'Add 1/3 and 1/6.',
            detectedSkillIds: ['F015'],
            adultConfirmedWrong: true,
          },
        ],
      },
    });

    expect(res.status).toBe(200);
    expect(doc.status).toBe('reviewed');
    expect(doc.reviewedAt).toBeInstanceOf(Date);
    expect(doc.weakSkillIds).toEqual(['F015']);
    expect(doc.recommendedActions).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'assign_practice', skillId: 'F015', status: 'pending_review' }),
    ]));
    expect(doc.save).toHaveBeenCalled();
  });

  it('creates a Recovery Pack when paper-analysis weak skills are confirmed', async () => {
    const doc = {
      _id: 'analysis_1',
      studentId: 'student_1',
      status: 'reviewed',
      weakSkillIds: ['F015'],
      detectedQuestions: [],
      recommendedActions: [
        { type: 'assign_practice', skillId: 'F015', reason: 'Confirmed wrong question', status: 'pending_review' },
      ],
      save: vi.fn().mockResolvedValue(undefined),
    };
    findByIdMock.mockResolvedValueOnce(doc);
    resolveStudentMock.mockResolvedValueOnce({ _id: 'student_1' });
    createAssignmentFromPaperAnalysisMock.mockResolvedValueOnce({
      id: 'assignment_1',
      skillIds: ['F015'],
    });

    const res = await request('/analysis_1/assign-practice', { method: 'POST' });

    expect(res.status).toBe(201);
    expect(res.data).toMatchObject({
      analysisId: 'analysis_1',
      assigned: true,
      assignmentId: 'assignment_1',
    });
    expect(createAssignmentFromPaperAnalysisMock).toHaveBeenCalledWith({
      paperAnalysisId: 'analysis_1',
      assignedByUserId: 'adult_1',
      assignedByRole: 'parent',
    });
  });
});
