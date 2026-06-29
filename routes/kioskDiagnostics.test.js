import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// 24-hex ids so mongoose.isValidObjectId() passes (the route validates studentId).
const AISHA = '507f1f77bcf86cd799439012';
const BEN = '507f1f77bcf86cd799439013';
const CDS_ID = '507f1f77bcf86cd799439011';

function makeSession(overrides = {}) {
  return {
    _id: CDS_ID,
    code: 'K7Q4MN',
    status: 'open',
    workspaceId: 'ws_1',
    subjectId: 'math',
    domainId: 'fractions',
    mode: 'core',
    studentLevel: 'P4',
    expiresAt: new Date(Date.now() + 3_600_000),
    roster: [
      { studentId: AISHA, name: 'Aisha', taken: false },
      { studentId: BEN, name: 'Ben', taken: true },
    ],
    ...overrides,
  };
}

const cds = { findOne: vi.fn(), findOneAndUpdate: vi.fn(), updateOne: vi.fn() };
const student = { findById: vi.fn() };
const mpds = { updateOne: vi.fn(), findOne: vi.fn() };
const startAdaptiveDiagnostic = vi.fn();
const answerAdaptiveDiagnostic = vi.fn();

vi.mock('../models/ClassDiagnosticSession.js', () => ({ default: cds }));
vi.mock('../models/Student.js', () => ({ default: student }));
vi.mock('../models/mathpath/MathPathDiagnosticSession.js', () => ({ default: mpds }));
vi.mock('../services/diagnostics/diagnosticRuntime.js', () => ({
  startAdaptiveDiagnostic: (...a) => startAdaptiveDiagnostic(...a),
  answerAdaptiveDiagnostic: (...a) => answerAdaptiveDiagnostic(...a),
}));

let router;

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = {
      method: String(method).toUpperCase(),
      url: path, path, originalUrl: path,
      query: {}, body: body || {}, headers, params: {},
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

describe('kiosk diagnostic routes', () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-kiosk-routes';
    router = (await import('./kioskDiagnostics.js')).default;
  });

  afterEach(() => vi.clearAllMocks());

  it('B1: returns minimal roster PII (name + id + taken only)', async () => {
    cds.findOne.mockResolvedValueOnce(makeSession());
    const res = await request('/sessions/K7Q4MN');
    expect(res.status).toBe(200);
    expect(res.data.domainId).toBe('fractions');
    expect(res.data.roster).toEqual([
      { studentId: AISHA, name: 'Aisha', taken: false },
      { studentId: BEN, name: 'Ben', taken: true },
    ]);
    // no workspace / level / studentLevel leaked
    expect(JSON.stringify(res.data)).not.toMatch(/ws_1|workspace/);
  });

  it('B1: 404 unknown code, 410 closed', async () => {
    cds.findOne.mockResolvedValueOnce(null);
    expect((await request('/sessions/NOPE')).status).toBe(404);
    cds.findOne.mockResolvedValueOnce(makeSession({ status: 'closed' }));
    expect((await request('/sessions/K7Q4MN')).status).toBe(410);
  });

  it('B2: 403 when the chosen name is not in the roster', async () => {
    cds.findOne.mockResolvedValueOnce(makeSession());
    const res = await request('/sessions/K7Q4MN/begin', { method: 'POST', body: { studentId: '507f1f77bcf86cd7994390ff' } });
    expect(res.status).toBe(403);
  });

  it('B2: 409 when the name is already taken', async () => {
    cds.findOne.mockResolvedValueOnce(makeSession());
    const res = await request('/sessions/K7Q4MN/begin', { method: 'POST', body: { studentId: BEN } });
    expect(res.status).toBe(409);
  });

  it('B2: success mints a kiosk token, starts the engine with replay disabled, and tags the session', async () => {
    cds.findOne.mockResolvedValueOnce(makeSession());
    student.findById.mockResolvedValueOnce({ _id: AISHA, workspaceId: 'ws_1', level: 'P4' });
    cds.findOneAndUpdate.mockResolvedValueOnce(makeSession()); // claim succeeds
    cds.updateOne.mockResolvedValue({});
    mpds.updateOne.mockResolvedValue({});
    startAdaptiveDiagnostic.mockResolvedValueOnce({
      sessionId: 'fractionsdiag_abc', currentQuestion: { questionId: 'q1' }, questions: [{ questionId: 'q1' }], progress: { answeredCount: 0 },
    });

    const res = await request('/sessions/K7Q4MN/begin', { method: 'POST', body: { studentId: AISHA } });
    expect(res.status).toBe(200);
    expect(typeof res.data.attemptToken).toBe('string');
    expect(res.data.sessionId).toBe('fractionsdiag_abc');
    // engine reuse: kiosk must disable replay + not pass a userId
    expect(startAdaptiveDiagnostic).toHaveBeenCalledWith(expect.objectContaining({
      domainId: 'fractions', enforceReplay: false, userId: '', diagnosticPurpose: 'baseline',
    }));
    // links the per-student diagnostic back to the class session for the live view
    expect(mpds.updateOne).toHaveBeenCalledWith(
      { diagnosticSessionId: 'fractionsdiag_abc' },
      { $set: { sourceType: 'kiosk', sourceId: CDS_ID } },
    );
  });

  it('B2: 403 on cross-workspace student', async () => {
    cds.findOne.mockResolvedValueOnce(makeSession());
    student.findById.mockResolvedValueOnce({ _id: AISHA, workspaceId: 'OTHER_WS', level: 'P4' });
    const res = await request('/sessions/K7Q4MN/begin', { method: 'POST', body: { studentId: AISHA } });
    expect(res.status).toBe(403);
  });

  it('B3: a token minted by begin authorises an answer; missing/mismatched tokens are rejected', async () => {
    // First mint a real token via begin.
    cds.findOne.mockResolvedValueOnce(makeSession());
    student.findById.mockResolvedValueOnce({ _id: AISHA, workspaceId: 'ws_1', level: 'P4' });
    cds.findOneAndUpdate.mockResolvedValueOnce(makeSession());
    cds.updateOne.mockResolvedValue({});
    mpds.updateOne.mockResolvedValue({});
    startAdaptiveDiagnostic.mockResolvedValueOnce({ sessionId: 'fractionsdiag_abc', currentQuestion: {}, questions: [], progress: {} });
    const begin = await request('/sessions/K7Q4MN/begin', { method: 'POST', body: { studentId: AISHA } });
    const token = begin.data.attemptToken;

    // missing token → 401
    expect((await request('/diagnostics/fractionsdiag_abc/answer', { method: 'POST', body: {} })).status).toBe(401);

    // token bound to fractionsdiag_abc used on a different sessionId → 403
    const mismatch = await request('/diagnostics/OTHER_SESSION/answer', { method: 'POST', body: {}, headers: { 'x-attempt-token': token } });
    expect(mismatch.status).toBe(403);

    // correct token + session → engine called
    student.findById.mockResolvedValueOnce({ _id: AISHA, workspaceId: 'ws_1' });
    answerAdaptiveDiagnostic.mockResolvedValueOnce({ isCorrect: true, sessionComplete: false, progress: {} });
    const ans = await request('/diagnostics/fractionsdiag_abc/answer', { method: 'POST', body: { questionId: 'q1', answer: '3/4' }, headers: { 'x-attempt-token': token } });
    expect(ans.status).toBe(200);
    expect(answerAdaptiveDiagnostic).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'fractionsdiag_abc' }));
  });
});
