import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// Open registration so register-route tests can exercise the full flow.
process.env.FEAT_OPEN_REGISTRATION = '1';

// Guards the email-normalisation fixes on the public auth routes:
//  - register lowercases the email before the duplicate check AND the save, so
//    case variants (John@X.com vs the stored john@x.com) don't slip past the
//    check and die on the unique index,
//  - a unique-index race still returns a clean 400 (not a 500 leaking E11000),
//  - login lowercases the email so a different-case entry still finds the
//    account (mobile keyboards auto-capitalise the first letter).

const saveMock = vi.fn(async () => {});
const findOneMock = vi.fn();

// User is used both as a constructor (new User({...})) and a static (User.findOne).
function User(doc) {
  Object.assign(this, doc);
  this._id = 'new_user_id';
  this.save = saveMock;
}
User.findOne = (...a) => findOneMock(...a);

vi.mock('../models/User.js', () => ({ default: User }));
vi.mock('../models/Student.js', () => ({ default: { findOne: () => ({ select: () => ({ sort: () => ({ lean: async () => null }) }) }) } }));
vi.mock('../models/Workspace.js', () => ({ default: { create: vi.fn(async (doc) => ({ _id: 'ws_id', ...doc })) } }));
vi.mock('../models/WorkspaceMember.js', () => ({ default: { create: vi.fn(async () => {}) } }));
vi.mock('../middleware/auth.js', () => ({
  protect: (_req, _res, next) => next(),
  getSignedToken: () => 'signed.jwt.token',
}));
vi.mock('../middleware/rateLimiter.js', () => ({ authRateLimit: (_req, _res, next) => next() }));
vi.mock('../utils/emailService.js', () => ({
  sendPasswordResetEmail: vi.fn(async () => {}),
  sendWelcomeEmail: vi.fn(async () => {}),
  appBaseUrl: () => 'http://localhost:3000',
}));

let router;

function request(path, { method = 'GET', body } = {}) {
  return new Promise((resolve, reject) => {
    const req = { method: method.toUpperCase(), url: path, path, originalUrl: path, query: {}, body: body || {}, headers: {}, params: {} };
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(payload) { resolve({ status: this.statusCode, data: payload }); },
      send(payload) { resolve({ status: this.statusCode, data: payload }); },
    };
    router.handle(req, res, (err) => (err ? reject(err) : resolve({ status: res.statusCode, data: null })));
  });
}

describe('auth routes — email normalisation', () => {
  beforeAll(async () => { router = (await import('./auth.js')).default; });
  afterEach(() => {
    vi.clearAllMocks();
    saveMock.mockImplementation(async () => {});
  });

  it('register lowercases the email before the duplicate check and the save', async () => {
    findOneMock.mockResolvedValueOnce(null); // no existing user
    const res = await request('/register', {
      method: 'POST',
      body: { name: 'Jo', email: 'John@X.com', password: 'secret1', role: 'parent' },
    });

    expect(res.status).toBe(201);
    // dup-check queried with the lowercased email, not the raw mixed-case input
    expect(findOneMock).toHaveBeenCalledWith({ email: 'john@x.com' });
    // user.save() is called twice: once to create the user, once to attach defaultWorkspace
    expect(saveMock).toHaveBeenCalledTimes(2);
    expect(res.data).toMatchObject({ success: true, token: 'signed.jwt.token', user: { email: 'john@x.com', role: 'parent' } });
  });

  it('register returns a clean 400 (not a 500) when the unique index trips on save', async () => {
    findOneMock.mockResolvedValueOnce(null); // check passes, but...
    saveMock.mockRejectedValueOnce(Object.assign(new Error('E11000 duplicate key'), { code: 11000 }));
    const res = await request('/register', {
      method: 'POST',
      body: { name: 'Jo', email: 'john@x.com', password: 'secret1', role: 'parent' },
    });

    expect(res.status).toBe(400);
    expect(res.data).toEqual({ error: 'User already exists with that email' });
  });

  it('register rejects an existing email with 400', async () => {
    findOneMock.mockResolvedValueOnce({ _id: 'existing' });
    const res = await request('/register', {
      method: 'POST',
      body: { name: 'Jo', email: 'john@x.com', password: 'secret1', role: 'parent' },
    });
    expect(res.status).toBe(400);
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('register rejects a role other than parent/tutor', async () => {
    const res = await request('/register', {
      method: 'POST',
      body: { name: 'Jo', email: 'a@b.com', password: 'secret1', role: 'admin' },
    });
    expect(res.status).toBe(400);
    expect(findOneMock).not.toHaveBeenCalled();
  });

  it('login lowercases the email so a different-case entry still finds the account', async () => {
    const user = {
      _id: 'u1', name: 'Jo', email: 'john@x.com', role: 'parent',
      comparePassword: vi.fn(async () => true),
      select: function () { return this; }, // .select('+password') returns the same doc
    };
    findOneMock.mockReturnValueOnce(user); // login awaits the chain result

    const res = await request('/login', {
      method: 'POST',
      body: { email: 'John@X.com', password: 'secret1' },
    });

    expect(findOneMock).toHaveBeenCalledWith({ email: 'john@x.com' });
    expect(res.status).toBe(200);
    expect(res.data).toMatchObject({ success: true, token: 'signed.jwt.token' });
  });
});
