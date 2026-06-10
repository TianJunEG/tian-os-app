import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// Regression guard for view-only enforcement on Recovery Pack / assignment write
// routes: the mutating routes must resolve the student with { write: true } (so a
// view-only guardian is rejected), while reads must not require write.
const MOCK_STUDENT = { _id: 'student_1' };
const resolveStudentMock = vi.fn(async () => MOCK_STUDENT);
const getAssignmentById = vi.fn(async () => ({ id: 'a1', studentId: 'student_1' }));
const updateAssignmentProgress = vi.fn(async () => ({ id: 'a1' }));
const updateRecoveryPackTeachingProgress = vi.fn(async () => ({ id: 'rp1' }));
const createRecheckForAssignment = vi.fn(async () => ({ created: true }));
const evaluateRecheckRecommendation = vi.fn(async () => ({ ready: true }));
const getRecoveryPackTeachingFlow = vi.fn(async () => ({}));

vi.mock('../middleware/auth.js', () => ({
  protect: (req, _res, next) => { req.user = { id: 'u1', role: 'parent' }; next(); },
}));
vi.mock('../utils/studentContext.js', () => ({
  resolveStudent: (...args) => resolveStudentMock(...args),
}));
vi.mock('../models/mathpath/PaperAnalysis.js', () => ({ default: { findById: vi.fn() } }));
vi.mock('../services/mathpath/mathPathAssignmentService.js', () => ({
  createAssignmentFromDiagnostic: vi.fn(),
  createAssignmentFromPaperAnalysis: vi.fn(),
  createRecheckForAssignment: (...a) => createRecheckForAssignment(...a),
  evaluateRecheckRecommendation: (...a) => evaluateRecheckRecommendation(...a),
  getAssignmentById: (...a) => getAssignmentById(...a),
  getStudentAssignments: vi.fn(),
  resolveAssignedByRole: vi.fn(() => 'parent'),
  updateAssignmentProgress: (...a) => updateAssignmentProgress(...a),
}));
vi.mock('../services/mathpath/recoveryPackTeachingFlowService.js', () => ({
  getRecoveryPackTeachingFlow: (...a) => getRecoveryPackTeachingFlow(...a),
  updateRecoveryPackTeachingProgress: (...a) => updateRecoveryPackTeachingProgress(...a),
}));

let router;

async function request(path, { method = 'GET', body } = {}) {
  return new Promise((resolve, reject) => {
    const req = {
      method: String(method).toUpperCase(),
      url: path, path, originalUrl: path,
      query: {}, body: body || {}, headers: {}, params: {},
    };
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(payload) { resolve({ status: this.statusCode, data: payload }); },
      send(payload) { resolve({ status: this.statusCode, data: payload }); },
    };
    router.handle(req, res, (err) => (err ? reject(err) : resolve({ status: res.statusCode, data: null })));
  });
}

function lastWriteOption() {
  return resolveStudentMock.mock.calls.at(-1)?.[2];
}

describe('mathpathAssignments view-only write enforcement', () => {
  beforeAll(async () => {
    router = (await import('./mathpathAssignments.js')).default;
  });
  afterEach(() => {
    vi.clearAllMocks();
    resolveStudentMock.mockImplementation(async () => MOCK_STUDENT);
    getAssignmentById.mockImplementation(async () => ({ id: 'a1', studentId: 'student_1' }));
  });

  it('PATCH /:id/progress resolves the student for write', async () => {
    await request('/a1/progress', { method: 'PATCH', body: { attempt: {} } });
    expect(lastWriteOption()).toEqual({ write: true });
  });

  it('PATCH /:id/teaching-progress resolves the student for write', async () => {
    await request('/a1/teaching-progress', { method: 'PATCH', body: { stageId: 's1' } });
    expect(lastWriteOption()).toEqual({ write: true });
  });

  it('POST /:id/create-recheck resolves the student for write', async () => {
    await request('/a1/create-recheck', { method: 'POST', body: {} });
    expect(lastWriteOption()).toEqual({ write: true });
  });

  it('GET /:id does not require write (view-only guardians may read)', async () => {
    await request('/a1', { method: 'GET' });
    expect(lastWriteOption()).toEqual({ write: false });
  });
});
