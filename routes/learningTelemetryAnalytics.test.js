import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const MOCK_STUDENT = { _id: 'student_1', name: 'Pilot Student' };
const getStudentAnalytics = vi.fn();
const getPilotAnalytics = vi.fn();
const getPilotInterventionMetrics = vi.fn();
const getPilotInterventionSummary = vi.fn();
const getQuestionQualityAudit = vi.fn();
const getQuestionVisualQualityAudit = vi.fn();
const getDiagnosticValidationReport = vi.fn();
const getRecoveryPackQualityReport = vi.fn();
const getInterventionEffectivenessReport = vi.fn();
const getRecoveryPackAssetReport = vi.fn();
const recordLearningEvent = vi.fn();

vi.mock('../middleware/auth.js', () => ({
  protect: (req, _res, next) => {
    req.user = { id: 'user_1', role: req.headers?.role || 'admin' };
    next();
  },
  authorize: (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'forbidden' });
    next();
  },
}));

vi.mock('../utils/studentContext.js', () => ({
  resolveStudent: vi.fn(async () => MOCK_STUDENT),
}));

vi.mock('../services/telemetry/learningTelemetryService.js', () => ({
  getStudentAnalytics: (...args) => getStudentAnalytics(...args),
  getPilotAnalytics: (...args) => getPilotAnalytics(...args),
  recordLearningEvent: (...args) => recordLearningEvent(...args),
}));

vi.mock('../services/mathpath/pilotInterventionMetricsService.js', () => ({
  getPilotInterventionMetrics: (...args) => getPilotInterventionMetrics(...args),
  getPilotInterventionSummary: (...args) => getPilotInterventionSummary(...args),
}));

vi.mock('../services/mathpath/questionQualityAuditService.js', () => ({
  getQuestionQualityAudit: (...args) => getQuestionQualityAudit(...args),
}));

vi.mock('../services/mathpath/visualQualityAuditService.js', () => ({
  getQuestionVisualQualityAudit: (...args) => getQuestionVisualQualityAudit(...args),
}));

vi.mock('../services/mathpath/diagnosticValidationEngine.js', () => ({
  getDiagnosticValidationReport: (...args) => getDiagnosticValidationReport(...args),
}));

vi.mock('../services/mathpath/recoveryPackQualityService.js', () => ({
  getRecoveryPackQualityReport: (...args) => getRecoveryPackQualityReport(...args),
}));

vi.mock('../services/mathpath/interventionEffectivenessService.js', () => ({
  getInterventionEffectivenessReport: (...args) => getInterventionEffectivenessReport(...args),
}));

vi.mock('../services/mathpath/recoveryPackAssetService.js', () => ({
  getRecoveryPackAssetReport: (...args) => getRecoveryPackAssetReport(...args),
}));

async function loadRouter(path) {
  const mod = await import(path);
  return mod.default;
}

async function request(router, path, { method = 'GET', query = {}, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = {
      method: String(method || 'GET').toUpperCase(),
      url: path,
      path,
      originalUrl: path,
      query,
      body: {},
      headers,
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

describe('learning telemetry analytics routes', () => {
  let studentRouter;
  let pilotRouter;
  let telemetryRouter;

  beforeAll(async () => {
    studentRouter = await loadRouter('./studentAnalytics.js');
    pilotRouter = await loadRouter('./pilotAnalytics.js');
    telemetryRouter = await loadRouter('./telemetry.js');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns analytics for the resolved student', async () => {
    getStudentAnalytics.mockResolvedValueOnce({ questionsAnswered: 8, overconfidenceRate: 13 });

    const res = await request(studentRouter, '/analytics', { query: { days: 14 } });

    expect(res.status).toBe(200);
    expect(getStudentAnalytics).toHaveBeenCalledWith({ studentId: 'student_1', days: 14 });
    expect(res.data).toEqual({ questionsAnswered: 8, overconfidenceRate: 13 });
  });

  it('returns admin pilot analytics', async () => {
    getPilotAnalytics.mockResolvedValueOnce({
      pilotMetrics: { activeStudents: 5, completionRate: 80 },
      overconfidence: { overconfidenceRate: 10 },
    });

    const res = await request(pilotRouter, '/pilot-analytics', { query: { days: 30, domain: 'fractions' } });

    expect(res.status).toBe(200);
    expect(getPilotAnalytics).toHaveBeenCalledWith({ days: 30, domain: 'fractions' });
    expect(res.data.pilotMetrics.activeStudents).toBe(5);
  });

  it('blocks pilot analytics for non-admin users', async () => {
    const res = await request(pilotRouter, '/pilot-analytics', { headers: { role: 'student' } });

    expect(res.status).toBe(403);
    expect(getPilotAnalytics).not.toHaveBeenCalled();
  });

  it('returns admin intervention metrics', async () => {
    getPilotInterventionMetrics.mockResolvedValueOnce({
      funnel: { totalStudents: 5, studentsWithMeasuredImprovement: 3 },
      assignments: { assignmentCompletionRate: 80 },
    });

    const res = await request(pilotRouter, '/pilot/intervention-metrics', {
      query: { from: '2026-06-01', to: '2026-06-06', cohortId: 'pilot-a', domainId: 'fractions' },
    });

    expect(res.status).toBe(200);
    expect(getPilotInterventionMetrics).toHaveBeenCalledWith({
      from: '2026-06-01',
      to: '2026-06-06',
      cohortId: 'pilot-a',
      subjectId: 'math',
      domainId: 'fractions',
    });
    expect(res.data.assignments.assignmentCompletionRate).toBe(80);
  });

  it('returns exportable intervention summary JSON', async () => {
    getPilotInterventionSummary.mockResolvedValueOnce({
      pilotSize: 5,
      averageReadinessGain: 24,
    });

    const res = await request(pilotRouter, '/pilot/intervention-summary', {
      query: { subjectId: 'math', domainId: 'fractions' },
    });

    expect(res.status).toBe(200);
    expect(getPilotInterventionSummary).toHaveBeenCalledWith({
      from: undefined,
      to: undefined,
      cohortId: undefined,
      subjectId: 'math',
      domainId: 'fractions',
    });
    expect(res.data.pilotSize).toBe(5);
  });

  it('blocks intervention metrics for non-admin users', async () => {
    const res = await request(pilotRouter, '/pilot/intervention-metrics', { headers: { role: 'student' } });

    expect(res.status).toBe(403);
    expect(getPilotInterventionMetrics).not.toHaveBeenCalled();
  });

  it('returns admin question quality audit', async () => {
    getQuestionQualityAudit.mockResolvedValueOnce({
      totalQuestions: 26,
      averageQualityScore: 72,
      missingDiagrams: [],
    });

    const res = await request(pilotRouter, '/question-quality', {
      query: { domainId: 'fractions', limit: 100 },
    });

    expect(res.status).toBe(200);
    expect(getQuestionQualityAudit).toHaveBeenCalledWith({ domainId: 'fractions', limit: 100 });
    expect(res.data.averageQualityScore).toBe(72);
  });

  it('returns admin question visual quality audit', async () => {
    getQuestionVisualQualityAudit.mockResolvedValueOnce({
      totalQuestions: 26,
      visualCoveragePercent: 64,
      skillsMissingVisuals: [],
    });

    const res = await request(pilotRouter, '/question-visual-quality', {
      query: { domainId: 'fractions', limit: 100 },
    });

    expect(res.status).toBe(200);
    expect(getQuestionVisualQualityAudit).toHaveBeenCalledWith({ domainId: 'fractions', limit: 100 });
    expect(res.data.visualCoveragePercent).toBe(64);
  });

  it('returns admin diagnostic validation report', async () => {
    getDiagnosticValidationReport.mockResolvedValueOnce({
      sessionCount: 2,
      confidenceDistribution: { high: 1, medium: 1, low: 0 },
      falsePositives: [],
    });

    const res = await request(pilotRouter, '/diagnostic-validation', {
      query: { subjectId: 'math', domainId: 'fractions', limit: 25 },
    });

    expect(res.status).toBe(200);
    expect(getDiagnosticValidationReport).toHaveBeenCalledWith({
      studentId: undefined,
      subjectId: 'math',
      domainId: 'fractions',
      limit: 25,
    });
    expect(res.data.sessionCount).toBe(2);
  });

  it('returns admin remediation quality report', async () => {
    getRecoveryPackQualityReport.mockResolvedValueOnce({
      assignmentCount: 3,
      averageQualityScore: 78,
      lowQualityRecoveryPacks: [],
    });
    getInterventionEffectivenessReport.mockResolvedValueOnce({
      recheckSuccessRate: 67,
      strongestInterventions: [],
    });

    const res = await request(pilotRouter, '/remediation-quality', {
      query: { domainId: 'fractions', limit: 50 },
    });

    expect(res.status).toBe(200);
    expect(getRecoveryPackQualityReport).toHaveBeenCalledWith({
      studentId: undefined,
      domainId: 'fractions',
      limit: 50,
    });
    expect(getInterventionEffectivenessReport).toHaveBeenCalledWith({
      studentId: undefined,
      domainId: 'fractions',
      limit: 50,
    });
    expect(res.data.effectiveness.recheckSuccessRate).toBe(67);
  });

  it('returns admin Recovery Pack asset report', async () => {
    getRecoveryPackAssetReport.mockResolvedValueOnce({
      assetCoveragePercent: 100,
      missingWorkedExamples: [],
    });

    const res = await request(pilotRouter, '/recovery-pack-assets', {
      query: { domainId: 'fractions', limit: 50 },
    });

    expect(res.status).toBe(200);
    expect(getRecoveryPackAssetReport).toHaveBeenCalledWith({
      domainId: 'fractions',
      limit: 50,
    });
    expect(res.data.assetCoveragePercent).toBe(100);
  });

  it('blocks question quality audit for non-admin users', async () => {
    const res = await request(pilotRouter, '/question-quality', { headers: { role: 'student' } });

    expect(res.status).toBe(403);
    expect(getQuestionQualityAudit).not.toHaveBeenCalled();
  });

  it('records generic frontend telemetry events', async () => {
    recordLearningEvent.mockResolvedValueOnce({ _id: 'event_1' });
    const req = {
      method: 'POST',
      url: '/events',
      path: '/events',
      originalUrl: '/events',
      query: {},
      body: {
        studentId: 'student_1',
        eventType: 'mastery_test_started',
        domain: 'fractions',
        sessionId: 'assess_1',
        metadata: { assessmentType: 'mastery' },
      },
      headers: {},
      params: {},
    };
    const res = await new Promise((resolve, reject) => {
      const response = {
        statusCode: 200,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(payload) {
          resolve({ status: this.statusCode, data: payload });
        },
      };
      telemetryRouter.handle(req, response, (err) => {
        if (err) reject(err);
        else resolve({ status: response.statusCode, data: null });
      });
    });

    expect(res.status).toBe(201);
    expect(recordLearningEvent).toHaveBeenCalledWith(expect.objectContaining({
      studentId: 'student_1',
      eventType: 'mastery_test_started',
      domain: 'fractions',
      sessionId: 'assess_1',
    }));
  });
});
