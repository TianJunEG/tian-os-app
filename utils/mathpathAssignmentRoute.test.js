import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const resolveStudentMock = vi.fn();
const createFromDiagnosticMock = vi.fn();
const getStudentAssignmentsMock = vi.fn();
const getAssignmentByIdMock = vi.fn();
const getRecoveryPackTeachingFlowMock = vi.fn();

vi.mock('../middleware/auth.js', () => ({
  protect: (req, _res, next) => {
    req.user = req.mockUser || { id: 'adult_1', role: 'parent' };
    next();
  },
}));

vi.mock('../models/mathpath/PaperAnalysis.js', () => ({
  default: { findById: vi.fn() },
}));

vi.mock('../utils/studentContext.js', () => ({
  resolveStudent: (...args) => resolveStudentMock(...args),
}));

vi.mock('../services/mathpath/mathPathAssignmentService.js', () => ({
  createAssignmentFromDiagnostic: (...args) => createFromDiagnosticMock(...args),
  createAssignmentFromPaperAnalysis: vi.fn(),
  createRecheckForAssignment: vi.fn(),
  evaluateRecheckRecommendation: vi.fn(),
  getAssignmentById: (...args) => getAssignmentByIdMock(...args),
  getStudentAssignments: (...args) => getStudentAssignmentsMock(...args),
  resolveAssignedByRole: () => 'parent',
  updateAssignmentProgress: vi.fn(),
}));

vi.mock('../services/mathpath/recoveryPackTeachingFlowService.js', () => ({
  getRecoveryPackTeachingFlow: (...args) => getRecoveryPackTeachingFlowMock(...args),
  updateRecoveryPackTeachingProgress: vi.fn(),
}));

let router;

async function request(path, { method = 'GET', body, user } = {}) {
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
      mockUser: user,
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
    };
    router.handle(req, res, (err) => {
      if (err) reject(err);
      else resolve({ status: res.statusCode, data: null });
    });
  });
}

describe('MathPath assignment routes', () => {
  beforeAll(async () => {
    const mod = await import('../routes/mathpathAssignments.js');
    router = mod.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('creates a diagnostic recovery pack for an authorized adult', async () => {
    resolveStudentMock.mockResolvedValueOnce({ _id: 'student_1' });
    createFromDiagnosticMock.mockResolvedValueOnce({ id: 'assignment_1', skillIds: ['F015'] });

    const res = await request('/from-diagnostic', {
      method: 'POST',
      body: { studentId: 'student_1', diagnosticSessionId: 'diag_1' },
    });

    expect(res.status).toBe(201);
    expect(createFromDiagnosticMock).toHaveBeenCalledWith(expect.objectContaining({
      studentId: 'student_1',
      diagnosticSessionId: 'diag_1',
    }));
  });

  it('blocks diagnostic recovery pack creation for an unrelated child', async () => {
    resolveStudentMock.mockRejectedValueOnce({
      status: 403,
      message: 'No access to this student.',
    });

    const res = await request('/from-diagnostic', {
      method: 'POST',
      body: { studentId: 'unrelated_child', diagnosticSessionId: 'diag_1' },
    });

    expect(res.status).toBe(403);
    expect(res.data.error).toBe('No access to this student.');
    expect(createFromDiagnosticMock).not.toHaveBeenCalled();
  });

  it('allows a student to create a Recovery Pack from their own diagnostic', async () => {
    resolveStudentMock.mockResolvedValueOnce({ _id: 'student_1' });
    createFromDiagnosticMock.mockResolvedValueOnce({ id: 'assignment_1', skillIds: ['F015'] });

    const res = await request('/from-diagnostic', {
      method: 'POST',
      user: { id: 'student_user_1', role: 'student' },
      body: { studentId: 'student_1', diagnosticSessionId: 'diag_1' },
    });

    expect(res.status).toBe(201);
    expect(createFromDiagnosticMock).toHaveBeenCalledWith(expect.objectContaining({
      studentId: 'student_1',
      diagnosticSessionId: 'diag_1',
    }));
  });

  it('allows student care staff to create a diagnostic Recovery Pack for an accessible student', async () => {
    resolveStudentMock.mockResolvedValueOnce({ _id: 'student_1' });
    createFromDiagnosticMock.mockResolvedValueOnce({ id: 'assignment_1', skillIds: ['F019'] });

    const res = await request('/from-diagnostic', {
      method: 'POST',
      user: { id: 'care_1', role: 'student_care' },
      body: { studentId: 'student_1', diagnosticSessionId: 'diag_1' },
    });

    expect(res.status).toBe(201);
    expect(createFromDiagnosticMock).toHaveBeenCalledWith(expect.objectContaining({
      studentId: 'student_1',
      diagnosticSessionId: 'diag_1',
    }));
  });

  it('blocks student paper-analysis assignment', async () => {
    const res = await request('/from-paper-analysis', {
      method: 'POST',
      user: { id: 'student_user_1', role: 'student' },
      body: { paperAnalysisId: 'paper_1' },
    });

    expect(res.status).toBe(403);
  });

  it('lists student recovery packs', async () => {
    resolveStudentMock.mockResolvedValueOnce({ _id: 'student_1' });
    getStudentAssignmentsMock.mockResolvedValueOnce([{ id: 'assignment_1', title: 'Fractions Recovery Pack' }]);

    const res = await request('/');

    expect(res.status).toBe(200);
    expect(res.data.assignments).toEqual([{ id: 'assignment_1', title: 'Fractions Recovery Pack' }]);
  });

  it('blocks assignment lists for an unrelated child', async () => {
    resolveStudentMock.mockRejectedValueOnce({
      status: 403,
      message: 'No access to this student.',
    });

    const res = await request('/?studentId=unrelated_child');

    expect(res.status).toBe(403);
    expect(res.data.error).toBe('No access to this student.');
    expect(getStudentAssignmentsMock).not.toHaveBeenCalled();
  });

  it('blocks recovery-pack teaching flow when the assignment belongs to an unrelated child', async () => {
    getAssignmentByIdMock.mockResolvedValueOnce({
      id: 'assignment_1',
      studentId: 'unrelated_child',
    });
    resolveStudentMock.mockRejectedValueOnce({
      status: 403,
      message: 'No access to this student.',
    });

    const res = await request('/assignment_1/teaching-flow');

    expect(res.status).toBe(403);
    expect(res.data.error).toBe('No access to this student.');
    expect(getRecoveryPackTeachingFlowMock).not.toHaveBeenCalled();
  });
});
