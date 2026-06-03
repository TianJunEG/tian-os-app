import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const MOCK_USER_ID = 'user_student_1';
const MOCK_STUDENT = { _id: 'student_1', name: 'Pilot Student', level: 'Primary 4' };

const getStudentProfileSummary = vi.fn();
const getStudentAchievements = vi.fn();
const getStudentLearningTimeline = vi.fn();

vi.mock('../middleware/auth.js', () => ({
  protect: (req, _res, next) => {
    req.user = { id: MOCK_USER_ID, role: 'student' };
    next();
  },
}));

vi.mock('../utils/studentContext.js', () => ({
  resolveStudent: vi.fn(async () => MOCK_STUDENT),
}));

vi.mock('../services/studentProfile/studentProfileService.js', () => ({
  getStudentProfileSummary: (...args) => getStudentProfileSummary(...args),
  getStudentAchievements: (...args) => getStudentAchievements(...args),
  getStudentLearningTimeline: (...args) => getStudentLearningTimeline(...args),
}));

let router;

async function request(path, { method = 'GET' } = {}) {
  return new Promise((resolve, reject) => {
    const req = {
      method: String(method || 'GET').toUpperCase(),
      url: path,
      path,
      originalUrl: path,
      query: {},
      body: {},
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

describe('student profile routes', () => {
  beforeAll(async () => {
    const mod = await import('./studentProfile.js');
    router = mod.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns a combined profile overview', async () => {
    getStudentProfileSummary.mockResolvedValueOnce({ xp: 120, currentDomain: 'Fractions' });
    getStudentAchievements.mockResolvedValueOnce([{ code: 'first_practice', unlocked: true }]);
    getStudentLearningTimeline.mockResolvedValueOnce([{ eventType: 'practice_completed', title: 'Completed Practice' }]);

    const res = await request('/');

    expect(res.status).toBe(200);
    expect(getStudentProfileSummary).toHaveBeenCalledWith(MOCK_STUDENT);
    expect(getStudentAchievements).toHaveBeenCalledWith(MOCK_STUDENT);
    expect(getStudentLearningTimeline).toHaveBeenCalledWith(MOCK_STUDENT);
    expect(res.data).toEqual({
      summary: { xp: 120, currentDomain: 'Fractions' },
      achievements: [{ code: 'first_practice', unlocked: true }],
      timeline: [{ eventType: 'practice_completed', title: 'Completed Practice' }],
    });
  });

  it('returns profile summary metrics', async () => {
    getStudentProfileSummary.mockResolvedValueOnce({
      xp: 1240,
      streak: 5,
      skillsMastered: 9,
      progress: { mastered: 9, total: 26 },
    });

    const res = await request('/summary');

    expect(res.status).toBe(200);
    expect(res.data.progress).toEqual({ mastered: 9, total: 26 });
  });

  it('returns achievements with locked and unlocked states', async () => {
    getStudentAchievements.mockResolvedValueOnce([
      { code: 'first_diagnostic', unlocked: true },
      { code: 'seven_day_streak', unlocked: false },
    ]);

    const res = await request('/achievements');

    expect(res.status).toBe(200);
    expect(res.data).toEqual([
      { code: 'first_diagnostic', unlocked: true },
      { code: 'seven_day_streak', unlocked: false },
    ]);
  });

  it('returns newest learning timeline events', async () => {
    getStudentLearningTimeline.mockResolvedValueOnce([
      { id: 'event_1', title: 'Completed Equivalent Fractions Practice', xpAwarded: 10 },
    ]);

    const res = await request('/timeline');

    expect(res.status).toBe(200);
    expect(res.data[0].xpAwarded).toBe(10);
  });
});
