import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const MOCK_TOKEN = 'mock-jwt-token';
const MOCK_USER_ID = 'user_auth_1';

const mockUserSave = vi.fn();
const mockUserComparePassword = vi.fn();

let storedUsers = {};

vi.mock('../middleware/auth.js', () => ({
  protect: (req, _res, next) => {
    req.user = { id: MOCK_USER_ID, role: 'parent' };
    next();
  },
  getSignedToken: vi.fn(() => MOCK_TOKEN),
}));

vi.mock('../middleware/rateLimiter.js', () => ({
  authRateLimit: (_req, _res, next) => next(),
}));

vi.mock('../models/User.js', () => {
  function MockUser(data) {
    Object.assign(this, data, { _id: MOCK_USER_ID });
    this.save = mockUserSave;
    this.comparePassword = mockUserComparePassword;
  }
  MockUser.findOne = vi.fn();
  MockUser.findById = vi.fn();
  MockUser.findByIdAndUpdate = vi.fn();
  return { default: MockUser };
});

vi.mock('../utils/emailService.js', () => ({
  sendPasswordResetEmail: vi.fn(),
}));

let router;

async function request(path, { method = 'GET', body = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = {
      method: String(method).toUpperCase(),
      url: path,
      path,
      originalUrl: path,
      query: {},
      body,
      headers: {},
      params: {},
      header: () => undefined,
    };
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(payload) { resolve({ status: this.statusCode, data: payload }); },
      send(payload) { resolve({ status: this.statusCode, data: payload }); },
    };
    router.handle(req, res, (err) => {
      if (err) reject(err);
      else resolve({ status: res.statusCode, data: null });
    });
  });
}

beforeAll(async () => {
  const mod = await import('./auth.js');
  router = mod.default;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('POST /register', () => {
  it('rejects missing name', async () => {
    const res = await request('/register', {
      method: 'POST',
      body: { email: 'a@b.com', password: '123456', role: 'parent' },
    });
    expect(res.status).toBe(400);
    expect(res.data.errors).toBeDefined();
  });

  it('rejects short password', async () => {
    const res = await request('/register', {
      method: 'POST',
      body: { name: 'Test', email: 'a@b.com', password: '123', role: 'parent' },
    });
    expect(res.status).toBe(400);
  });

  it('rejects invalid role', async () => {
    const res = await request('/register', {
      method: 'POST',
      body: { name: 'Test', email: 'a@b.com', password: '123456', role: 'admin' },
    });
    expect(res.status).toBe(400);
  });

  it('rejects duplicate email', async () => {
    const { default: User } = await import('../models/User.js');
    User.findOne.mockResolvedValueOnce({ _id: 'existing' });
    mockUserSave.mockResolvedValueOnce();

    const res = await request('/register', {
      method: 'POST',
      body: { name: 'Test', email: 'dup@b.com', password: '123456', role: 'parent' },
    });
    expect(res.status).toBe(400);
    expect(res.data.error).toMatch(/already exists/i);
  });

  it('registers successfully and returns token', async () => {
    const { default: User } = await import('../models/User.js');
    User.findOne.mockResolvedValueOnce(null);
    mockUserSave.mockResolvedValueOnce();

    const res = await request('/register', {
      method: 'POST',
      body: { name: 'New User', email: 'new@b.com', password: '123456', role: 'tutor' },
    });
    expect(res.status).toBe(201);
    expect(res.data.success).toBe(true);
    expect(res.data.token).toBe(MOCK_TOKEN);
    expect(res.data.user.name).toBe('New User');
  });
});

describe('POST /login', () => {
  it('rejects missing password', async () => {
    const res = await request('/login', {
      method: 'POST',
      body: { email: 'a@b.com' },
    });
    expect(res.status).toBe(400);
  });

  it('rejects unknown email', async () => {
    const { default: User } = await import('../models/User.js');
    User.findOne.mockReturnValueOnce({ select: vi.fn().mockResolvedValueOnce(null) });

    const res = await request('/login', {
      method: 'POST',
      body: { email: 'nope@b.com', password: '123456' },
    });
    expect(res.status).toBe(401);
    expect(res.data.error).toMatch(/invalid credentials/i);
  });

  it('rejects wrong password', async () => {
    const { default: User } = await import('../models/User.js');
    const fakeUser = { _id: MOCK_USER_ID, name: 'Test', email: 'a@b.com', role: 'parent', comparePassword: vi.fn().mockResolvedValueOnce(false) };
    User.findOne.mockReturnValueOnce({ select: vi.fn().mockResolvedValueOnce(fakeUser) });

    const res = await request('/login', {
      method: 'POST',
      body: { email: 'a@b.com', password: 'wrong' },
    });
    expect(res.status).toBe(401);
  });

  it('rejects banned user', async () => {
    const { default: User } = await import('../models/User.js');
    const fakeUser = { _id: MOCK_USER_ID, name: 'Banned', email: 'a@b.com', role: 'parent', isBanned: true, comparePassword: vi.fn().mockResolvedValueOnce(true) };
    User.findOne.mockReturnValueOnce({ select: vi.fn().mockResolvedValueOnce(fakeUser) });

    const res = await request('/login', {
      method: 'POST',
      body: { email: 'a@b.com', password: '123456' },
    });
    expect(res.status).toBe(403);
    expect(res.data.error).toMatch(/suspended/i);
  });

  it('logs in successfully and returns token + user', async () => {
    const { default: User } = await import('../models/User.js');
    const fakeUser = { _id: MOCK_USER_ID, name: 'Active', email: 'a@b.com', role: 'tutor', isBanned: false, comparePassword: vi.fn().mockResolvedValueOnce(true), is_test_account: false, avatar: '', studentLevel: '' };
    User.findOne.mockReturnValueOnce({ select: vi.fn().mockResolvedValueOnce(fakeUser) });

    const res = await request('/login', {
      method: 'POST',
      body: { email: 'a@b.com', password: '123456' },
    });
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.token).toBe(MOCK_TOKEN);
    expect(res.data.user.role).toBe('tutor');
  });
});

describe('GET /me', () => {
  it('returns current user', async () => {
    const { default: User } = await import('../models/User.js');
    User.findById.mockResolvedValueOnce({ _id: MOCK_USER_ID, name: 'Me', role: 'parent' });

    const res = await request('/me');
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.user.name).toBe('Me');
  });
});

describe('POST /forgot-password', () => {
  it('returns success even for unknown email', async () => {
    const { default: User } = await import('../models/User.js');
    User.findOne.mockResolvedValueOnce(null);

    const res = await request('/forgot-password', {
      method: 'POST',
      body: { email: 'ghost@b.com' },
    });
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
  });

  it('rejects missing email', async () => {
    const res = await request('/forgot-password', {
      method: 'POST',
      body: {},
    });
    expect(res.status).toBe(400);
  });
});
