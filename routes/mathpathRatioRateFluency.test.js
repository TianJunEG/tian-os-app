import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const MOCK_STUDENT = { _id: 'student_ratio_1' };

let storedSession = null;
const PracticeSession = {
  create: vi.fn(async (doc) => {
    storedSession = {
      ...doc,
      save: vi.fn(async function save() { return this; }),
    };
    return storedSession;
  }),
  findOne: vi.fn(async () => storedSession),
};
const StudentSkillState = {
  find: vi.fn(() => ({ lean: vi.fn(async () => []) })),
  findOneAndUpdate: vi.fn(async () => ({})),
};
const MistakeRecord = { findOneAndUpdate: vi.fn(async () => ({})) };

vi.mock('../middleware/auth.js', () => ({
  protect: (req, _res, next) => { req.user = { id: 'user_1', role: 'student' }; next(); },
}));
vi.mock('../utils/studentContext.js', () => ({
  resolveStudent: vi.fn(async () => MOCK_STUDENT),
}));
vi.mock('../models/mathpath/MathPathPracticeSession.js', () => ({ default: PracticeSession }));
vi.mock('../models/mathpath/MathPathStudentSkillState.js', () => ({ default: StudentSkillState }));
vi.mock('../models/mathpath/MathPathMistakeRecord.js', () => ({ default: MistakeRecord }));
vi.mock('../services/mathpath/heuristicBridge.js', () => ({
  skillHasPSLContent: () => false,
  getHeuristicForSkill: () => null,
}));

let router;

async function request(path, { method = 'GET', body = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = { method: String(method).toUpperCase(), url: path, path, originalUrl: path, query: {}, body, headers: {}, params: {} };
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(payload) { resolve({ status: this.statusCode, data: payload }); },
      send(payload) { resolve({ status: this.statusCode, data: payload }); },
    };
    router.handle(req, res, (err) => { if (err) reject(err); else resolve({ status: res.statusCode, data: null }); });
  });
}

describe('Ratio fluency endpoints', () => {
  beforeAll(async () => {
    const mod = await import('./mathpathRatioRate.js');
    router = mod.default;
  });

  afterEach(() => { vi.clearAllMocks(); storedSession = null; });

  it('starts a fluency drill and returns answer-stripped questions', async () => {
    const res = await request('/fluency/start', { method: 'POST', body: { skillId: 'R001', count: 6 } });
    expect(res.status).toBe(200);
    expect(res.data.domainId).toBe('ratio');
    expect(res.data.skillId).toBe('R001');
    expect(res.data.benchmarks.gold).toBeGreaterThan(0);
    expect(res.data.questions).toHaveLength(6);
    expect(res.data.questions.every((q) => q.answer === undefined && q.acceptedAnswers === undefined)).toBe(true);
    expect(PracticeSession.create).toHaveBeenCalledOnce();
    expect(storedSession.domainId).toBe('ratio');
  });

  it('rejects a start with no skillId', async () => {
    const res = await request('/fluency/start', { method: 'POST', body: {} });
    expect(res.status).toBe(400);
  });

  it('scores a submitted drill into a fluency band and persists it', async () => {
    await request('/fluency/start', { method: 'POST', body: { skillId: 'R001', count: 6 } });
    const responses = storedSession.questions.map((q) => ({ questionId: q.questionId, studentAnswer: q.acceptedAnswers[0], timeTaken: 3 }));
    const res = await request(`/fluency/${storedSession.practiceSessionId}/submit`, { method: 'POST', body: { responses } });
    expect(res.status).toBe(200);
    expect(res.data.mode).toBe('fluency');
    expect(res.data.domainId).toBe('ratio');
    expect(res.data.accuracy).toBe(100);
    expect(['gold', 'platinum', 'silver']).toContain(res.data.band);
    expect(StudentSkillState.findOneAndUpdate).toHaveBeenCalled();
    const [filter] = StudentSkillState.findOneAndUpdate.mock.calls[0];
    expect(filter.domainId).toBe('ratio');
    expect(filter.skillId).toBe('R001');
  });
});
