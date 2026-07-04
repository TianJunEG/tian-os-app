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

const cds = { findOne: vi.fn(), findOneAndUpdate: vi.fn(), updateOne: vi.fn(), findById: vi.fn() };
const student = { findById: vi.fn() };
const mpds = { updateOne: vi.fn(), findOne: vi.fn() };
const startAdaptiveDiagnostic = vi.fn();
const answerAdaptiveDiagnostic = vi.fn();

// Practice-mode collaborators.
const practiceSession = { create: vi.fn(), findById: vi.fn() };
const practiceAttempt = { create: vi.fn(), find: vi.fn() };
const question = { findById: vi.fn() };
const mistake = { create: vi.fn() };
const ensureQuestionsForSkills = vi.fn();
const clientQuestion = vi.fn((q) => ({ questionId: q._id, stem: q.stem, type: q.type, choices: q.choices || [] }));
const selectSimilarQuestions = vi.fn();
const isCorrectWithContext = vi.fn();
const recordAttempt = vi.fn();

vi.mock('../models/ClassDiagnosticSession.js', () => ({ default: cds }));
vi.mock('../models/Student.js', () => ({ default: student }));
vi.mock('../models/mathpath/MathPathDiagnosticSession.js', () => ({ default: mpds }));
vi.mock('../models/PracticeSession.js', () => ({ default: practiceSession }));
vi.mock('../models/PracticeAttempt.js', () => ({ default: practiceAttempt }));
vi.mock('../models/Question.js', () => ({ default: question }));
vi.mock('../models/Mistake.js', () => ({ default: mistake }));
vi.mock('./practice.js', () => ({
  ensureQuestionsForSkills: (...a) => ensureQuestionsForSkills(...a),
  clientQuestion: (...a) => clientQuestion(...a),
}));
vi.mock('../utils/worksheetGen.js', () => ({ selectSimilarQuestions: (...a) => selectSimilarQuestions(...a) }));
vi.mock('../utils/answerCheck.js', () => ({ isCorrectWithContext: (...a) => isCorrectWithContext(...a) }));
vi.mock('../utils/masteryEngine.js', () => ({ recordAttempt: (...a) => recordAttempt(...a) }));
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
      { ref: '0', name: 'Aisha', taken: false },
      { ref: '1', name: 'Ben', taken: true },
    ]);
    // no real student ObjectIds, workspace, or level leaked to the public endpoint
    expect(JSON.stringify(res.data)).not.toMatch(/ws_1|workspace/);
    expect(JSON.stringify(res.data)).not.toContain(AISHA);
  });

  it('B1: 404 unknown code, 410 closed', async () => {
    cds.findOne.mockResolvedValueOnce(null);
    expect((await request('/sessions/NOPE')).status).toBe(404);
    cds.findOne.mockResolvedValueOnce(makeSession({ status: 'closed' }));
    expect((await request('/sessions/K7Q4MN')).status).toBe(410);
  });

  it('B2: 400 on an out-of-range roster ref', async () => {
    cds.findOne.mockResolvedValueOnce(makeSession());
    const res = await request('/sessions/K7Q4MN/begin', { method: 'POST', body: { ref: '99' } });
    expect(res.status).toBe(400);
  });

  it('B2: 409 when the name is already taken', async () => {
    cds.findOne.mockResolvedValueOnce(makeSession());
    const res = await request('/sessions/K7Q4MN/begin', { method: 'POST', body: { ref: '1' } });
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

    const res = await request('/sessions/K7Q4MN/begin', { method: 'POST', body: { ref: '0' } });
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
    const res = await request('/sessions/K7Q4MN/begin', { method: 'POST', body: { ref: '0' } });
    expect(res.status).toBe(400);
  });

  it('B3: a token minted by begin authorises an answer; missing/mismatched tokens are rejected', async () => {
    // First mint a real token via begin.
    cds.findOne.mockResolvedValueOnce(makeSession());
    student.findById.mockResolvedValueOnce({ _id: AISHA, workspaceId: 'ws_1', level: 'P4' });
    cds.findOneAndUpdate.mockResolvedValueOnce(makeSession());
    cds.updateOne.mockResolvedValue({});
    mpds.updateOne.mockResolvedValue({});
    startAdaptiveDiagnostic.mockResolvedValueOnce({ sessionId: 'fractionsdiag_abc', currentQuestion: {}, questions: [], progress: {} });
    const begin = await request('/sessions/K7Q4MN/begin', { method: 'POST', body: { ref: '0' } });
    const token = begin.data.attemptToken;

    // missing token → 401
    expect((await request('/diagnostics/fractionsdiag_abc/answer', { method: 'POST', body: {} })).status).toBe(401);

    // token bound to fractionsdiag_abc used on a different sessionId → 403
    const mismatch = await request('/diagnostics/OTHER_SESSION/answer', { method: 'POST', body: {}, headers: { 'x-attempt-token': token } });
    expect(mismatch.status).toBe(403);

    // correct token + an OPEN parent session → engine called
    cds.findById.mockResolvedValueOnce(makeSession());
    student.findById.mockResolvedValueOnce({ _id: AISHA, workspaceId: 'ws_1' });
    answerAdaptiveDiagnostic.mockResolvedValueOnce({ isCorrect: true, sessionComplete: false, progress: {} });
    const ans = await request('/diagnostics/fractionsdiag_abc/answer', { method: 'POST', body: { questionId: 'q1', answer: '3/4' }, headers: { 'x-attempt-token': token } });
    expect(ans.status).toBe(200);
    expect(answerAdaptiveDiagnostic).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'fractionsdiag_abc' }));
  });

  it('B3: rejects answers once the parent class session is closed (even with a valid token)', async () => {
    cds.findOne.mockResolvedValueOnce(makeSession());
    student.findById.mockResolvedValueOnce({ _id: AISHA, workspaceId: 'ws_1', level: 'P4' });
    cds.findOneAndUpdate.mockResolvedValueOnce(makeSession());
    cds.updateOne.mockResolvedValue({});
    mpds.updateOne.mockResolvedValue({});
    startAdaptiveDiagnostic.mockResolvedValueOnce({ sessionId: 'fractionsdiag_xyz', currentQuestion: {}, questions: [], progress: {} });
    const begin = await request('/sessions/K7Q4MN/begin', { method: 'POST', body: { ref: '0' } });
    const token = begin.data.attemptToken;

    // teacher has since ended the check-in
    cds.findById.mockResolvedValueOnce(makeSession({ status: 'closed' }));
    const ans = await request('/diagnostics/fractionsdiag_xyz/answer', { method: 'POST', body: { questionId: 'q', answer: '1' }, headers: { 'x-attempt-token': token } });
    expect(ans.status).toBe(410);
    expect(answerAdaptiveDiagnostic).not.toHaveBeenCalled();
  });
});

// A practice-type class session.
function makePracticeSession(overrides = {}) {
  return makeSession({
    type: 'practice',
    domainId: 'numberSense',
    practiceConfig: { skillId: 'sk_add2', skillName: '2-digit addition', questionCount: 5 },
    ...overrides,
  });
}

describe('kiosk practice routes', () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-kiosk-routes';
    router = (await import('./kioskDiagnostics.js')).default;
  });

  afterEach(() => vi.clearAllMocks());

  // Mint a real attempt token via practice-begin (sid = the PracticeSession id).
  async function beginPractice() {
    cds.findOne.mockResolvedValueOnce(makePracticeSession());
    student.findById.mockResolvedValueOnce({ _id: AISHA, workspaceId: 'ws_1' });
    selectSimilarQuestions.mockResolvedValueOnce([
      { _id: 'q1', stem: '10 + 5', type: 'short_answer', choices: [], answer: '15', skillId: 'sk_add2' },
    ]);
    practiceSession.create.mockResolvedValueOnce({ _id: 'ps_123' });
    cds.updateOne.mockResolvedValue({});
    const res = await request('/sessions/K7Q4MN/practice-begin', { method: 'POST', body: { ref: '0' } });
    return { token: res.data.attemptToken, sessionId: res.data.sessionId, res };
  }

  it('GET /sessions/:code exposes type + skill name for practice, still no PII', async () => {
    cds.findOne.mockResolvedValueOnce(makePracticeSession());
    const res = await request('/sessions/K7Q4MN');
    expect(res.status).toBe(200);
    expect(res.data.type).toBe('practice');
    expect(res.data.practiceConfig).toEqual({ skillName: '2-digit addition', questionCount: 5 });
    // redo-friendly: names never report as taken for practice
    expect(res.data.roster.every((r) => r.taken === false)).toBe(true);
    expect(JSON.stringify(res.data)).not.toContain(AISHA);
    expect(JSON.stringify(res.data)).not.toContain('sk_add2'); // skillId is not leaked to students
  });

  it('practice-begin: 400 when the code is a diagnostic session', async () => {
    cds.findOne.mockResolvedValueOnce(makeSession()); // diagnostic
    const res = await request('/sessions/K7Q4MN/practice-begin', { method: 'POST', body: { ref: '0' } });
    expect(res.status).toBe(400);
  });

  it('practice-begin: builds the set, creates a PracticeSession, mints a token bound to it', async () => {
    const { res } = await beginPractice();
    expect(res.status).toBe(200);
    expect(typeof res.data.attemptToken).toBe('string');
    expect(res.data.sessionId).toBe('ps_123');
    expect(res.data.items).toHaveLength(1);
    expect(res.data.skillName).toBe('2-digit addition');
    expect(practiceSession.create).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'practice', feature: 'Class Practice Kiosk', skillIds: ['sk_add2'], status: 'active',
    }));
    // redo-friendly claim: matched by studentId, NOT gated on taken:false
    expect(cds.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ 'roster.studentId': AISHA }),
      expect.objectContaining({ $set: expect.objectContaining({ 'roster.$.practiceSessionId': 'ps_123' }) }),
    );
  });

  it('practice-begin: falls back to generating a bank when none are seeded', async () => {
    cds.findOne.mockResolvedValueOnce(makePracticeSession());
    student.findById.mockResolvedValueOnce({ _id: AISHA, workspaceId: 'ws_1' });
    selectSimilarQuestions.mockResolvedValueOnce([]); // nothing seeded
    ensureQuestionsForSkills.mockResolvedValueOnce([
      { _id: 'gq1', stem: '20 + 30', type: 'short_answer', choices: [] },
    ]);
    practiceSession.create.mockResolvedValueOnce({ _id: 'ps_gen' });
    cds.updateOne.mockResolvedValue({});
    const res = await request('/sessions/K7Q4MN/practice-begin', { method: 'POST', body: { ref: '0' } });
    expect(res.status).toBe(200);
    expect(ensureQuestionsForSkills).toHaveBeenCalledWith(['sk_add2'], expect.any(Number));
    expect(res.data.items).toHaveLength(1);
  });

  it('attempt: scores a wrong answer, persists it, and records a Mistake', async () => {
    const { token } = await beginPractice();

    cds.findById.mockResolvedValueOnce(makePracticeSession()); // parent still open
    student.findById.mockResolvedValueOnce({ _id: AISHA, workspaceId: 'ws_1' });
    question.findById.mockResolvedValueOnce({ _id: 'q1', answer: '15', stem: '10 + 5', skillId: 'sk_add2', misconceptionTag: '' });
    isCorrectWithContext.mockReturnValueOnce(false);

    const res = await request('/practice/ps_123/attempt', {
      method: 'POST', body: { questionId: 'q1', answer: '14' }, headers: { 'x-attempt-token': token },
    });
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ correct: false });
    expect(practiceAttempt.create).toHaveBeenCalled();
    expect(recordAttempt).toHaveBeenCalledWith(expect.objectContaining({ correct: false, module: 'MathPath' }));
    expect(mistake.create).toHaveBeenCalledWith(expect.objectContaining({ source: 'practice-incorrect', skillId: 'sk_add2' }));
    // must NOT leak the correct answer on the shared iPad
    expect(JSON.stringify(res.data)).not.toContain('15');
  });

  it('attempt: rejects a missing token (401) and a mismatched one (403)', async () => {
    const { token } = await beginPractice();
    expect((await request('/practice/ps_123/attempt', { method: 'POST', body: {} })).status).toBe(401);
    const mismatch = await request('/practice/OTHER/attempt', { method: 'POST', body: {}, headers: { 'x-attempt-token': token } });
    expect(mismatch.status).toBe(403);
  });

  it('complete: summarises the set and marks the roster slot done', async () => {
    const { token } = await beginPractice();

    cds.findById.mockResolvedValueOnce(makePracticeSession()); // parent open (loadAttempt)
    student.findById.mockResolvedValueOnce({ _id: AISHA, workspaceId: 'ws_1' });
    practiceAttempt.find.mockResolvedValueOnce([{ correct: true, timeMs: 1000 }, { correct: false, timeMs: 2000 }]);
    practiceSession.findById.mockResolvedValueOnce({ status: 'active', save: vi.fn().mockResolvedValue() });
    cds.updateOne.mockResolvedValue({});

    const res = await request('/practice/ps_123/complete', { method: 'POST', body: {}, headers: { 'x-attempt-token': token } });
    expect(res.status).toBe(200);
    expect(res.data.summary).toEqual({ total: 2, correct: 1, scorePct: 50 });
    expect(cds.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ 'roster.studentId': AISHA }),
      expect.objectContaining({ $set: expect.objectContaining({ 'roster.$.status': 'completed' }) }),
    );
  });
});
