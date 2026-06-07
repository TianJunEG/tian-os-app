import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const studentGuardianFindMock = vi.fn();
const studentGuardianFindOneMock = vi.fn();
const studentFindMock = vi.fn();
const studentFindByIdMock = vi.fn();
const userFindByIdMock = vi.fn();

function emptyQuery() {
  return {
    sort: () => ({
      limit: async () => [],
    }),
  };
}

vi.mock('../middleware/auth.js', () => ({
  protect: (req, _res, next) => {
    req.user = { id: 'parent_1', role: 'parent' };
    next();
  },
}));

vi.mock('../models/SpellingAttempt.js', () => ({
  default: {
    find: vi.fn(() => emptyQuery()),
  },
}));

vi.mock('../models/LearningResult.js', () => ({
  default: {
    find: vi.fn(() => emptyQuery()),
    create: vi.fn(),
  },
}));

vi.mock('../models/User.js', () => ({
  default: {
    findById: (...args) => userFindByIdMock(...args),
  },
}));

vi.mock('../models/Student.js', () => ({
  default: {
    find: (...args) => studentFindMock(...args),
    findById: (...args) => studentFindByIdMock(...args),
  },
}));

vi.mock('../models/StudentGuardian.js', () => ({
  default: {
    find: (...args) => studentGuardianFindMock(...args),
    findOne: (...args) => studentGuardianFindOneMock(...args),
  },
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
    };
    router.handle(req, res, (err) => {
      if (err) reject(err);
      else resolve({ status: res.statusCode, data: null });
    });
  });
}

describe('legacy learning children guardian isolation', () => {
  beforeAll(async () => {
    const mod = await import('./learning.js');
    router = mod.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns only StudentGuardian-linked children from /children', async () => {
    studentGuardianFindMock.mockResolvedValueOnce([
      { studentId: 'child_1', guardianUserId: 'parent_1' },
    ]);
    studentFindMock.mockResolvedValueOnce([
      { _id: 'child_1', name: 'Child One', level: 'Primary 4' },
    ]);

    const res = await request('/children');

    expect(res.status).toBe(200);
    expect(studentGuardianFindMock).toHaveBeenCalledWith({ guardianUserId: 'parent_1' });
    expect(studentFindMock).toHaveBeenCalledWith({ _id: { $in: ['child_1'] } });
    expect(res.data.children).toEqual([
      expect.objectContaining({ id: 'child_1', studentId: 'child_1', name: 'Child One' }),
    ]);
    expect(userFindByIdMock).not.toHaveBeenCalled();
  });

  it('does not allow embedded User.children to bypass StudentGuardian for child profiles', async () => {
    studentGuardianFindOneMock.mockResolvedValueOnce(null);

    const res = await request('/children/unrelated_child/profile');

    expect(res.status).toBe(404);
    expect(res.data.error).toBe('Child not found for this account');
    expect(studentFindByIdMock).not.toHaveBeenCalled();
  });
});
