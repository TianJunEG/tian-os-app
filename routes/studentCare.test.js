import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const studentFind = vi.fn();
const assignmentFind = vi.fn();
const paperFind = vi.fn();
const mistakeFind = vi.fn();
const resolveStudentMock = vi.fn();
const getDiagnosticHistoryMock = vi.fn();
const buildDiagnosticGrowthMock = vi.fn();
const buildParentRecommendationsMock = vi.fn();
const listPartnerStudentIdsForUserMock = vi.fn();

function chainResult(value) {
  return {
    sort: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(value),
  };
}

vi.mock('../middleware/auth.js', () => ({
  protect: (req, _res, next) => {
    req.user = req.mockUser || { id: 'care_1', role: 'student_care' };
    next();
  },
  resolveRoles: (u = {}) => new Set([u.role, ...(Array.isArray(u.roles) ? u.roles : [])].filter(Boolean)),
}));

vi.mock('../models/Student.js', () => ({
  default: { find: (...args) => studentFind(...args) },
}));

vi.mock('../models/mathpath/MathPathAssignment.js', () => ({
  default: { find: (...args) => assignmentFind(...args) },
}));

vi.mock('../models/mathpath/PaperAnalysis.js', () => ({
  default: { find: (...args) => paperFind(...args) },
}));

vi.mock('../models/mathpath/MathPathMistakeRecord.js', () => ({
  default: { find: (...args) => mistakeFind(...args) },
}));

vi.mock('../utils/studentContext.js', () => ({
  resolveStudent: (...args) => resolveStudentMock(...args),
}));

vi.mock('../services/diagnostics/diagnosticGrowthService.js', () => ({
  getDiagnosticHistory: (...args) => getDiagnosticHistoryMock(...args),
  buildDiagnosticGrowth: (...args) => buildDiagnosticGrowthMock(...args),
}));

vi.mock('../services/mathpath/parentRecommendationEngine.js', () => ({
  buildParentRecommendations: (...args) => buildParentRecommendationsMock(...args),
}));

vi.mock('../services/partners/partnerAccessService.js', () => ({
  listPartnerStudentIdsForUser: (...args) => listPartnerStudentIdsForUserMock(...args),
}));

let router;

async function request(path, { user, query = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = {
      method: 'GET',
      url: path,
      path,
      originalUrl: path,
      query,
      body: {},
      headers: {},
      params: {},
      mockUser: user,
      header(name) {
        return this.headers[String(name).toLowerCase()];
      },
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

describe('student care routes', () => {
  beforeAll(async () => {
    const mod = await import('./studentCare.js');
    router = mod.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
    listPartnerStudentIdsForUserMock.mockResolvedValue([]);
  });

  function mockDashboardData() {
    listPartnerStudentIdsForUserMock.mockResolvedValue([]);
    studentFind.mockReturnValue(chainResult([{ _id: 'student_1', name: 'Sarah', level: 'P4' }]));
    getDiagnosticHistoryMock.mockResolvedValue([{ diagnosticSessionId: 'diag_1', status: 'completed' }]);
    buildDiagnosticGrowthMock.mockReturnValue({
      latest: { diagnosticSessionId: 'diag_1', completedAt: '2026-06-06T00:00:00.000Z' },
      overallImprovement: 20,
      remainingWeakSkills: ['F019'],
    });
    assignmentFind.mockReturnValue(chainResult([
      {
        _id: 'assignment_1',
        studentId: 'student_1',
        title: 'Fractions Recovery Pack',
        status: 'in_progress',
        targetQuestionCount: 12,
        completion: { questionsAttempted: 4, accuracy: 75 },
        recheck: {},
      },
    ]));
    paperFind.mockReturnValue(chainResult([
      { _id: 'paper_1', studentId: 'student_1', status: 'needs_review', weakSkillIds: ['F019'], originalFilename: 'school-paper.pdf' },
    ]));
    mistakeFind.mockReturnValue(chainResult([]));
  }

  it('allows student care staff to load operational dashboard data', async () => {
    mockDashboardData();

    const res = await request('/dashboard');

    expect(res.status).toBe(200);
    expect(res.data.students).toEqual([{ studentId: 'student_1', name: 'Sarah', level: 'P4' }]);
    expect(res.data.homeworkQueue[0]).toMatchObject({ paperAnalysisId: 'paper_1', status: 'needs_review' });
    expect(res.data.recoveryPacks[0]).toMatchObject({ assignmentId: 'assignment_1', status: 'in_progress' });
  });

  it('limits partner student-care staff to partner-linked students', async () => {
    listPartnerStudentIdsForUserMock.mockResolvedValueOnce(['student_partner_1']);
    mockDashboardData();

    const res = await request('/dashboard', {
      user: { id: 'partner_care_1', role: 'student_care' },
    });

    expect(res.status).toBe(200);
    expect(studentFind).toHaveBeenCalledWith({ _id: { $in: ['student_partner_1'] } });
  });

  it('blocks non student-care users', async () => {
    const res = await request('/dashboard', { user: { id: 'student_user_1', role: 'student' } });

    expect(res.status).toBe(403);
    expect(studentFind).not.toHaveBeenCalled();
  });

  it('serves dedicated recovery pack and recheck queues', async () => {
    mockDashboardData();
    const recovery = await request('/recovery-packs');

    expect(recovery.status).toBe(200);
    expect(recovery.data.recoveryPacks).toHaveLength(1);

    mockDashboardData();
    assignmentFind.mockReturnValue(chainResult([
      {
        _id: 'assignment_2',
        studentId: 'student_1',
        title: 'Fractions Recovery Pack',
        status: 'completed',
        targetQuestionCount: 12,
        completion: { questionsAttempted: 12, accuracy: 84 },
        recheck: { recommended: true, recommendedAt: '2026-06-06T00:00:00.000Z' },
      },
    ]));
    const rechecks = await request('/rechecks');

    expect(rechecks.status).toBe(200);
    expect(rechecks.data.recheckQueue[0]).toMatchObject({ status: 'recheck_ready', studentName: 'Sarah' });
  });

  it('returns parent-friendly summaries for accessible students', async () => {
    resolveStudentMock.mockResolvedValueOnce({ _id: 'student_1', name: 'Sarah', level: 'P4' });
    getDiagnosticHistoryMock.mockResolvedValueOnce([]);
    buildDiagnosticGrowthMock.mockReturnValueOnce({ remainingWeakSkills: ['F019'], latest: null });
    assignmentFind.mockReturnValueOnce(chainResult([]));
    paperFind.mockReturnValueOnce(chainResult([]));
    mistakeFind.mockReturnValueOnce(chainResult([]));
    buildParentRecommendationsMock.mockReturnValueOnce([]);

    const res = await request('/students/student_1/parent-summary');

    expect(res.status).toBe(200);
    expect(res.data.summary).toMatchObject({
      studentId: 'student_1',
      studentName: 'Sarah',
      currentWeakSkills: ['F019'],
    });
    expect(res.data.summary.parentFriendlySummary).toContain('Current weak area: F019');
  });
});
