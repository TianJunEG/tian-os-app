import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const resolveStudentMock = vi.fn();
const getDiagnosticHistoryMock = vi.fn();
const assignmentFindMock = vi.fn();
const paperAnalysisFindMock = vi.fn();
const mistakeFindMock = vi.fn();

vi.mock('../middleware/auth.js', () => ({
  protect: (req, _res, next) => {
    req.user = req.mockUser || { id: 'parent_1', role: 'parent' };
    next();
  },
}));

vi.mock('../utils/studentContext.js', () => ({
  resolveStudent: (...args) => resolveStudentMock(...args),
}));

vi.mock('../models/mathpath/MathPathAssignment.js', () => ({
  default: {
    find: (...args) => assignmentFindMock(...args),
  },
}));

vi.mock('../models/mathpath/PaperAnalysis.js', () => ({
  default: {
    find: (...args) => paperAnalysisFindMock(...args),
  },
}));

vi.mock('../models/mathpath/MathPathMistakeRecord.js', () => ({
  default: {
    find: (...args) => mistakeFindMock(...args),
  },
}));

vi.mock('../services/diagnostics/diagnosticGrowthService.js', () => ({
  buildDiagnosticGrowth: (history = []) => ({ history, overallImprovement: 0 }),
  getDiagnosticHistory: (...args) => getDiagnosticHistoryMock(...args),
}));

vi.mock('../services/mathpath/parentRecommendationEngine.js', () => ({
  buildParentRecommendations: vi.fn(() => []),
  buildSuccessCentreStory: vi.fn(() => ({ sections: [] })),
}));

vi.mock('../services/mathpath/tutorLessonPrepEngine.js', () => ({
  buildTutorLessonPrepPreview: vi.fn(() => ({ priorities: [] })),
}));

vi.mock('../services/mathpath/progressReportGenerator.js', () => ({
  generateParentProgressReport: vi.fn(() => ({ summary: 'Report' })),
}));

vi.mock('../services/mathpath/pilotDashboardMetricsService.js', () => ({
  getPilotDashboardMetrics: vi.fn(async () => ({})),
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

describe('MathPath Success Centre parent isolation', () => {
  beforeAll(async () => {
    const mod = await import('./mathpathSuccessCentre.js');
    router = mod.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('blocks parent success centre data for an unrelated child before loading evidence', async () => {
    resolveStudentMock.mockRejectedValueOnce({
      status: 403,
      message: 'No access to this student.',
    });

    const res = await request('/parent?studentId=unrelated_child');

    expect(res.status).toBe(403);
    expect(res.data.error).toBe('No access to this student.');
    expect(getDiagnosticHistoryMock).not.toHaveBeenCalled();
    expect(assignmentFindMock).not.toHaveBeenCalled();
    expect(paperAnalysisFindMock).not.toHaveBeenCalled();
    expect(mistakeFindMock).not.toHaveBeenCalled();
  });

  it('blocks parent progress reports for an unrelated child before loading evidence', async () => {
    resolveStudentMock.mockRejectedValueOnce({
      status: 403,
      message: 'No access to this student.',
    });

    const res = await request('/parent/report?studentId=unrelated_child');

    expect(res.status).toBe(403);
    expect(res.data.error).toBe('No access to this student.');
    expect(getDiagnosticHistoryMock).not.toHaveBeenCalled();
    expect(assignmentFindMock).not.toHaveBeenCalled();
    expect(paperAnalysisFindMock).not.toHaveBeenCalled();
    expect(mistakeFindMock).not.toHaveBeenCalled();
  });
});
