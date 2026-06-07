import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const MOCK_USER_ID = 'user_student_1';
const MOCK_STUDENT = { _id: 'student_1', name: 'Pilot Student', level: 'Primary 4' };

const startAdaptiveDiagnostic = vi.fn();
const answerAdaptiveDiagnostic = vi.fn();
const getDiagnosticDomain = vi.fn();
const listDiagnosticDomains = vi.fn();
const getDiagnosticHistory = vi.fn();
const getDiagnosticGrowth = vi.fn();
const getStudentRecheckSummary = vi.fn();
const resolveStudentMock = vi.fn(async () => MOCK_STUDENT);

vi.mock('../middleware/auth.js', () => ({
  protect: (req, _res, next) => {
    req.user = { id: MOCK_USER_ID, role: 'student' };
    next();
  },
}));

vi.mock('../utils/studentContext.js', () => ({
  resolveStudent: (...args) => resolveStudentMock(...args),
}));

vi.mock('../services/diagnostics/diagnosticRuntime.js', () => ({
  startAdaptiveDiagnostic: (...args) => startAdaptiveDiagnostic(...args),
  answerAdaptiveDiagnostic: (...args) => answerAdaptiveDiagnostic(...args),
}));

vi.mock('../services/diagnostics/diagnosticDomainRegistry.js', () => ({
  getDiagnosticDomain: (...args) => getDiagnosticDomain(...args),
  listDiagnosticDomains: (...args) => listDiagnosticDomains(...args),
}));

vi.mock('../services/diagnostics/diagnosticGrowthService.js', () => ({
  getDiagnosticHistory: (...args) => getDiagnosticHistory(...args),
  getDiagnosticGrowth: (...args) => getDiagnosticGrowth(...args),
}));

vi.mock('../services/mathpath/studentRecheckSummaryService.js', () => ({
  getStudentRecheckSummary: (...args) => getStudentRecheckSummary(...args),
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
    resolveStudentMock.mockImplementation(async () => MOCK_STUDENT);
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

  it('returns chronological completed diagnostic history for the resolved student', async () => {
    getDiagnosticDomain.mockReturnValueOnce({ subjectId: 'math', domainId: 'fractions' });
    getDiagnosticHistory.mockResolvedValueOnce([
      { diagnosticSessionId: 'diag_1', attemptNumber: 1, isBaseline: true, readinessScore: 42 },
      { diagnosticSessionId: 'diag_2', attemptNumber: 2, isBaseline: false, readinessScore: 78 },
    ]);

    const res = await request('/history');

    expect(res.status).toBe(200);
    expect(getDiagnosticHistory).toHaveBeenCalledWith({
      studentId: MOCK_STUDENT._id,
      subjectId: 'math',
      domainId: 'fractions',
    });
    expect(res.data.history.map((item) => item.diagnosticSessionId)).toEqual(['diag_1', 'diag_2']);
  });

  it('blocks diagnostic history for an unrelated child before reading diagnostic data', async () => {
    resolveStudentMock.mockRejectedValueOnce({
      status: 403,
      message: 'No access to this student.',
    });

    const res = await request('/history?studentId=unrelated_child&subjectId=math&domainId=fractions');

    expect(res.status).toBe(403);
    expect(res.data.error).toBe('No access to this student.');
    expect(getDiagnosticHistory).not.toHaveBeenCalled();
  });

  it('returns diagnostic growth for the resolved student and domain', async () => {
    getDiagnosticDomain.mockReturnValueOnce({ subjectId: 'math', domainId: 'fractions' });
    getDiagnosticGrowth.mockResolvedValueOnce({
      baseline: { diagnosticSessionId: 'diag_1', readinessScore: 42 },
      latest: { diagnosticSessionId: 'diag_2', readinessScore: 78 },
      overallImprovement: 36,
      remainingWeakSkills: ['F015'],
      recommendedActions: [{ type: 'assign_practice', skillId: 'F015' }],
    });

    const res = await request('/growth');

    expect(res.status).toBe(200);
    expect(getDiagnosticGrowth).toHaveBeenCalledWith({
      studentId: MOCK_STUDENT._id,
      subjectId: 'math',
      domainId: 'fractions',
    });
    expect(res.data).toMatchObject({
      studentId: MOCK_STUDENT._id,
      subjectId: 'math',
      domainId: 'fractions',
      overallImprovement: 36,
    });
  });

  it('blocks diagnostic growth for an unrelated child before reading growth data', async () => {
    resolveStudentMock.mockRejectedValueOnce({
      status: 403,
      message: 'No access to this student.',
    });

    const res = await request('/growth?studentId=unrelated_child&subjectId=math&domainId=fractions');

    expect(res.status).toBe(403);
    expect(res.data.error).toBe('No access to this student.');
    expect(getDiagnosticGrowth).not.toHaveBeenCalled();
  });

  it('returns diagnostic history in the service order', async () => {
    getDiagnosticDomain.mockReturnValueOnce({ subjectId: 'math', domainId: 'fractions' });
    getDiagnosticHistory.mockResolvedValueOnce([
      { diagnosticSessionId: 'diag_1', attemptNumber: 1, completedAt: '2026-01-01T00:00:00.000Z' },
      { diagnosticSessionId: 'diag_2', attemptNumber: 2, completedAt: '2026-02-01T00:00:00.000Z' },
    ]);

    const res = await request('/history?studentId=student_1&subjectId=math&domainId=fractions');

    expect(res.status).toBe(200);
    expect(getDiagnosticHistory).toHaveBeenCalledWith({
      studentId: MOCK_STUDENT._id,
      subjectId: 'math',
      domainId: 'fractions',
    });
    expect(res.data.history.map((row) => row.diagnosticSessionId)).toEqual(['diag_1', 'diag_2']);
  });

  it('returns diagnostic growth payloads', async () => {
    getDiagnosticDomain.mockReturnValueOnce({ subjectId: 'math', domainId: 'fractions' });
    getDiagnosticGrowth.mockResolvedValueOnce({
      baseline: { diagnosticSessionId: 'diag_1', readinessScore: 42 },
      latest: { diagnosticSessionId: 'diag_2', readinessScore: 78 },
      overallImprovement: 36,
      perSkillGrowth: [],
      remainingWeakSkills: ['F015'],
      recommendedActions: [{ type: 'assign_practice', skillId: 'F015' }],
    });

    const res = await request('/growth?studentId=student_1&subjectId=math&domainId=fractions');

    expect(res.status).toBe(200);
    expect(res.data.overallImprovement).toBe(36);
    expect(res.data.recommendedActions[0]).toMatchObject({ skillId: 'F015' });
  });

  it('returns a student-facing recheck summary for a completed recheck', async () => {
    getDiagnosticDomain.mockReturnValueOnce({ subjectId: 'math', domainId: 'fractions' });
    getStudentRecheckSummary.mockResolvedValueOnce({
      title: 'Recovery Pack Recheck',
      encouragementMessage: 'Great work. Your practice is showing clear progress.',
      improvedSkills: [{ displayName: 'Adding fractions with different denominators', improvement: 37 }],
      stillNeedsWork: [],
      nextRecommendedAction: {
        label: 'Start Next Learning Path',
        reason: 'You are ready to keep building.',
      },
    });

    const res = await request('/recheck-summary/diag_recheck_1');

    expect(res.status).toBe(200);
    expect(getDiagnosticDomain).toHaveBeenCalledWith({ subjectId: 'math', domainId: 'fractions' });
    expect(getStudentRecheckSummary).toHaveBeenCalledWith({
      studentId: MOCK_STUDENT._id,
      diagnosticSessionId: 'diag_recheck_1',
      assignmentId: '',
      subjectId: 'math',
      domainId: 'fractions',
    });
    expect(res.data.summary.title).toBe('Recovery Pack Recheck');
    expect(JSON.stringify(res.data.summary)).not.toMatch(/\bF\d{3}\b/);
  });

  it('blocks recheck summaries for an unrelated child before reading recheck evidence', async () => {
    resolveStudentMock.mockRejectedValueOnce({
      status: 403,
      message: 'No access to this student.',
    });

    const res = await request('/recheck-summary/diag_recheck_1?studentId=unrelated_child');

    expect(res.status).toBe(403);
    expect(res.data.error).toBe('No access to this student.');
    expect(getStudentRecheckSummary).not.toHaveBeenCalled();
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

  it('returns a retryable error when the next diagnostic question cannot be generated', async () => {
    const err = new Error('We could not load the next diagnostic question. Please try again.');
    err.status = 409;
    err.code = 'DIAGNOSTIC_NEXT_QUESTION_FAILED';
    err.payload = {
      sessionId: 'diag_1',
      sessionComplete: false,
      completionReason: 'question_generation_failed',
      progress: {
        answeredCount: 1,
        estimatedQuestionCount: 10,
        questionsRemaining: 9,
        completionReason: 'question_generation_failed',
      },
    };
    answerAdaptiveDiagnostic.mockRejectedValueOnce(err);

    const res = await request('/diag_1/answer', {
      method: 'POST',
      body: {
        questionId: 'q1',
        answer: '0',
        confidence: 'not_sure',
        timeTakenMs: 42000,
      },
    });

    expect(res.status).toBe(409);
    expect(res.data).toMatchObject({
      code: 'DIAGNOSTIC_NEXT_QUESTION_FAILED',
      sessionComplete: false,
      completionReason: 'question_generation_failed',
    });
  });
});
