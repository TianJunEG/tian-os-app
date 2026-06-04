import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const MOCK_USER_ID = 'user_student_1';
const MOCK_STUDENT = { _id: 'student_1', name: 'Pilot Student', level: 'Primary 4' };

const startAdaptiveDiagnostic = vi.fn();
const answerAdaptiveDiagnostic = vi.fn();
const getDiagnosticDomain = vi.fn();
const listDiagnosticDomains = vi.fn();

vi.mock('../middleware/auth.js', () => ({
  protect: (req, _res, next) => {
    req.user = { id: MOCK_USER_ID, role: 'student' };
    next();
  },
}));

vi.mock('../utils/studentContext.js', () => ({
  resolveStudent: vi.fn(async () => MOCK_STUDENT),
}));

vi.mock('../services/diagnostics/diagnosticRuntime.js', () => ({
  startAdaptiveDiagnostic: (...args) => startAdaptiveDiagnostic(...args),
  answerAdaptiveDiagnostic: (...args) => answerAdaptiveDiagnostic(...args),
}));

vi.mock('../services/diagnostics/diagnosticDomainRegistry.js', () => ({
  getDiagnosticDomain: (...args) => getDiagnosticDomain(...args),
  listDiagnosticDomains: (...args) => listDiagnosticDomains(...args),
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

describe('diagnostics routes registry contract', () => {
  beforeAll(async () => {
    const mod = await import('./diagnostics.js');
    router = mod.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('lists registered diagnostic domains', async () => {
    listDiagnosticDomains.mockReturnValueOnce([
      { subjectId: 'math', domainId: 'fractions', displayName: 'Fractions' },
    ]);

    const res = await request('/domains');

    expect(res.status).toBe(200);
    expect(res.data.domains).toEqual([
      { subjectId: 'math', domainId: 'fractions', displayName: 'Fractions' },
    ]);
  });

  it('starts a registry-backed diagnostic with explicit subject and domain', async () => {
    getDiagnosticDomain.mockReturnValueOnce({ subjectId: 'math', domainId: 'fractions' });
    startAdaptiveDiagnostic.mockResolvedValueOnce({
      sessionId: 'diag_1',
      subjectId: 'math',
      domainId: 'fractions',
      currentQuestion: { questionId: 'q1', skillId: 'F010' },
      progress: { answeredCount: 0, estimatedQuestionCount: 10, readinessScore: 0 },
    });

    const res = await request('/start', {
      method: 'POST',
      body: {
        subjectId: 'math',
        domainId: 'fractions',
        startSkillId: 'F010',
        requestedMode: 'core',
        studentLevel: 'P4',
        diagnosticPurpose: 'baseline',
      },
    });

    expect(res.status).toBe(200);
    expect(getDiagnosticDomain).toHaveBeenCalledWith({ subjectId: 'math', domainId: 'fractions' });
    expect(startAdaptiveDiagnostic).toHaveBeenCalledWith(expect.objectContaining({
      student: MOCK_STUDENT,
      userId: MOCK_USER_ID,
      subjectId: 'math',
      domainId: 'fractions',
      startSkillId: 'F010',
      requestedMode: 'core',
      studentLevel: 'P4',
      diagnosticPurpose: 'baseline',
    }));
    expect(res.data.currentQuestion).toEqual({ questionId: 'q1', skillId: 'F010' });
  });

  it('returns a clean error for unavailable diagnostic domains', async () => {
    const err = new Error('Diagnostic domain is not registered: science/forces');
    err.status = 404;
    err.code = 'DIAGNOSTIC_DOMAIN_NOT_FOUND';
    getDiagnosticDomain.mockImplementationOnce(() => {
      throw err;
    });

    const res = await request('/start', {
      method: 'POST',
      body: { subjectId: 'science', domainId: 'forces' },
    });

    expect(res.status).toBe(404);
    expect(res.data).toMatchObject({
      error: 'Diagnostic domain is not registered: science/forces',
      code: 'DIAGNOSTIC_DOMAIN_NOT_FOUND',
    });
    expect(startAdaptiveDiagnostic).not.toHaveBeenCalled();
  });

  it('submits answers through the generic adaptive diagnostic runtime', async () => {
    answerAdaptiveDiagnostic.mockResolvedValueOnce({
      isCorrect: false,
      decision: { decisionType: 'PREREQUISITE_PROBE', nextSkillId: 'T001' },
      nextQuestion: { questionId: 'q2', skillId: 'T001' },
      progress: { answeredCount: 1, estimatedQuestionCount: 10, readinessScore: 20 },
      sessionComplete: false,
      supportiveCopy: 'Let’s check a smaller step first.',
    });

    const body = {
      questionId: 'q1',
      answer: '0',
      confidence: 'not_sure',
      timeTakenMs: 42000,
      skipped: false,
      blankAnswer: false,
      workingSubmitted: false,
      attempts: 1,
    };
    const res = await request('/diag_1/answer', { method: 'POST', body });

    expect(res.status).toBe(200);
    expect(answerAdaptiveDiagnostic).toHaveBeenCalledWith({
      student: MOCK_STUDENT,
      sessionId: 'diag_1',
      body,
    });
    expect(res.data.decision.decisionType).toBe('PREREQUISITE_PROBE');
    expect(res.data.nextQuestion).toEqual({ questionId: 'q2', skillId: 'T001' });
  });
});
