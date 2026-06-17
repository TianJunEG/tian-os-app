import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const MOCK_STUDENT = { _id: 'student_1', workspaceId: 'workspace_1' };
const MathPathPracticeSession = { create: vi.fn(), findOne: vi.fn() };
const MathPathStudentSkillState = {
  find: vi.fn(() => ({ lean: vi.fn(async () => []) })),
  findOneAndUpdate: vi.fn(async () => ({})),
};

vi.mock('../middleware/auth.js', () => ({ protect: (req, _res, next) => { req.user = { id: 'user_1', role: 'student' }; next(); } }));
vi.mock('../utils/studentContext.js', () => ({ resolveStudent: vi.fn(async () => MOCK_STUDENT) }));
vi.mock('../models/mathpath/MathPathPracticeSession.js', () => ({ default: MathPathPracticeSession }));
vi.mock('../models/mathpath/MathPathStudentSkillState.js', () => ({ default: MathPathStudentSkillState }));
vi.mock('../models/mathpath/MathPathMistakeRecord.js', () => ({ default: { findOneAndUpdate: vi.fn() } }));
vi.mock('../services/mathpath/curriculumAttemptWriter.js', () => ({ writeCurriculumAttempts: vi.fn(async () => {}) }));
vi.mock('../services/mathpath/domainMistakePersistence.js', () => ({ persistDomainPracticeMistakes: vi.fn(async () => {}) }));

let router;

async function request(path, { method = 'GET', body = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = { method: String(method).toUpperCase(), url: path, path, originalUrl: path, query: {}, body, headers: {}, params: {} };
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(payload) { resolve({ status: this.statusCode, data: payload }); },
    };
    router.handle(req, res, (err) => { if (err) reject(err); else resolve({ status: res.statusCode, data: null }); });
  });
}

describe('Circles fluency routes', () => {
  beforeAll(async () => { const mod = await import('./mathpathCircles.js'); router = mod.default; });
  afterEach(() => vi.clearAllMocks());

  it('POST /fluency/start builds a drill and strips answers', async () => {
    MathPathPracticeSession.create.mockResolvedValueOnce({});
    const res = await request('/fluency/start', { method: 'POST', body: { skillId: 'CI001', count: 4 } });
    expect(res.status).toBe(200);
    expect(res.data.domainId).toBe('circles');
    expect(res.data.skillId).toBe('CI001');
    expect(res.data.mode).toBe('fluency');
    expect(res.data).toHaveProperty('benchmarks');
    expect(res.data.questions.every((q) => q.answer === undefined)).toBe(true);
  });

  it('POST /fluency/start requires skillId', async () => {
    const res = await request('/fluency/start', { method: 'POST', body: {} });
    expect(res.status).toBe(400);
  });

  it('POST /fluency/:id/submit scores and returns fluencyLevel', async () => {
    const { buildCirclesFluencyDrill } = await import('../services/mathpath/circlesFluencyService.js');
    const drill = buildCirclesFluencyDrill({ skillId: 'CI001', count: 4 });
    const session = { ...drill, targetSkillId: 'CI001', status: 'inProgress', toObject() { return { ...this }; }, save: vi.fn(async function () { return this; }) };
    MathPathPracticeSession.findOne.mockResolvedValueOnce(session);
    const answers = drill.questions.map((q) => q.answer?.display ?? q.answer);
    const res = await request('/fluency/x/submit', { method: 'POST', body: { answers, timingsSeconds: drill.questions.map(() => 10) } });
    expect(res.status).toBe(200);
    expect(res.data.mode).toBe('fluency');
    expect(res.data).toHaveProperty('fluencyLevel');
    expect(res.data.accuracy).toBe(100);
  });

  it('POST /fluency/:id/submit 404s for unknown session', async () => {
    MathPathPracticeSession.findOne.mockResolvedValueOnce(null);
    const res = await request('/fluency/nope/submit', { method: 'POST', body: {} });
    expect(res.status).toBe(404);
  });
});
