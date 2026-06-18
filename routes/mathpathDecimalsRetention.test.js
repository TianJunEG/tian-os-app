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

describe('Decimals retention routes', () => {
  beforeAll(async () => { const mod = await import('./mathpathDecimals.js'); router = mod.default; });
  afterEach(() => vi.clearAllMocks());

  it('GET /retention returns domainId and buckets', async () => {
    MathPathStudentSkillState.find.mockReturnValueOnce({
      lean: vi.fn(async () => [{ skillId: 'D001', domainId: 'decimals', fluentAt: '2026-01-01T00:00:00.000Z', fluencyLevel: 'gold', status: 'fluent', retentionStatus: 'reviewScheduled' }]),
    });
    const res = await request('/retention', { method: 'GET' });
    expect(res.status).toBe(200);
    expect(res.data.domainId).toBe('decimals');
    expect(res.data).toHaveProperty('upcomingReviews');
    expect(res.data).toHaveProperty('overdueReviews');
    expect(res.data).toHaveProperty('retentionHistory');
  });

  it('POST /retention/start builds a review and strips answers', async () => {
    MathPathPracticeSession.create.mockResolvedValueOnce({});
    const res = await request('/retention/start', { method: 'POST', body: { skillId: 'D001' } });
    expect(res.status).toBe(200);
    expect(res.data.domainId).toBe('decimals');
    expect(res.data.mode).toBe('retention');
    expect(res.data.questions.every((q) => q.answer === undefined)).toBe(true);
  });

  it('POST /retention/start requires skillId', async () => {
    const res = await request('/retention/start', { method: 'POST', body: {} });
    expect(res.status).toBe(400);
  });

  it('POST /retention/:id/submit scores and persists', async () => {
    const { buildDecimalsRetentionReview } = await import('../services/mathpath/decimalsRetentionService.js');
    const built = buildDecimalsRetentionReview({ skillId: 'D001' });
    const session = { ...built, targetSkillId: 'D001', status: 'inProgress', toObject() { return { ...this }; }, save: vi.fn(async function () { return this; }) };
    MathPathPracticeSession.findOne.mockResolvedValueOnce(session);
    const responses = built.questions.map((q) => ({ questionId: q.questionId, studentAnswer: String(q.answer?.display ?? q.answer ?? ''), timeTaken: 5 }));
    const res = await request('/retention/x/submit', { method: 'POST', body: { responses } });
    expect(res.status).toBe(200);
    expect(res.data.mode).toBe('retention');
    expect(res.data.retained).toBe(true);
    expect(session.save).toHaveBeenCalled();
  });

  it('POST /retention/:id/submit 404s for unknown session', async () => {
    MathPathPracticeSession.findOne.mockResolvedValueOnce(null);
    const res = await request('/retention/nope/submit', { method: 'POST', body: {} });
    expect(res.status).toBe(404);
  });
});
