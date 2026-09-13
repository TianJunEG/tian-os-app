import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const MOCK_STUDENT = { _id: 'student_1', workspaceId: 'workspace_1' };

const MathPathPracticeSession = {
  create: vi.fn(),
  findOne: vi.fn(),
};
const MathPathStudentSkillState = {
  find: vi.fn(() => ({ lean: vi.fn(async () => []) })),
  findOne: vi.fn(() => ({ lean: vi.fn(async () => null) })),
  findOneAndUpdate: vi.fn(async () => ({})),
};
const MathPathMistakeRecord = { findOneAndUpdate: vi.fn() };

vi.mock('../middleware/auth.js', () => ({
  protect: (req, _res, next) => { req.user = { id: 'user_1', role: 'student' }; next(); },
}));
vi.mock('../utils/studentContext.js', () => ({
  resolveStudent: vi.fn(async () => MOCK_STUDENT),
}));
vi.mock('../models/mathpath/MathPathPracticeSession.js', () => ({ default: MathPathPracticeSession }));
vi.mock('../models/mathpath/MathPathStudentSkillState.js', () => ({ default: MathPathStudentSkillState }));
vi.mock('../models/mathpath/MathPathMistakeRecord.js', () => ({ default: MathPathMistakeRecord }));

let router;

async function request(path, { method = 'GET', body = {}, params = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = { method: String(method).toUpperCase(), url: path, path, originalUrl: path, query: {}, body, headers: {}, params };
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(payload) { resolve({ status: this.statusCode, data: payload }); },
      send(payload) { resolve({ status: this.statusCode, data: payload }); },
    };
    router.handle(req, res, (err) => { if (err) reject(err); else resolve({ status: res.statusCode, data: null }); });
  });
}

describe('Circles retention routes', () => {
  beforeAll(async () => {
    const mod = await import('./mathpathCircles.js');
    router = mod.default;
  });

  afterEach(() => vi.clearAllMocks());

  it('GET /retention returns the upcoming/overdue/history buckets', async () => {
    MathPathStudentSkillState.find.mockReturnValueOnce({
      lean: vi.fn(async () => [
        { skillId: 'CI003', domainId: 'circles', fluentAt: '2026-01-01T00:00:00.000Z', fluencyLevel: 'gold', status: 'fluent', retentionStatus: 'reviewScheduled' },
      ]),
    });
    const res = await request('/retention', { method: 'GET' });
    expect(res.status).toBe(200);
    expect(res.data.domainId).toBe('circles');
    expect(res.data).toHaveProperty('upcomingReviews');
    expect(res.data).toHaveProperty('overdueReviews');
    expect(res.data).toHaveProperty('retentionHistory');
  });

  it('POST /retention/start builds + persists a review and strips answers', async () => {
    MathPathPracticeSession.create.mockResolvedValueOnce({ practiceSessionId: 'circlesretention_1' });
    const res = await request('/retention/start', { method: 'POST', body: { skillId: 'CI003', count: 4 } });
    expect(res.status).toBe(200);
    expect(res.data.domainId).toBe('circles');
    expect(res.data.skillId).toBe('CI003');
    expect(res.data.mode).toBe('retention');
    expect(res.data.questions.length).toBe(4);
    expect(res.data.questions.every((q) => q.answer === undefined && q.acceptedAnswers === undefined)).toBe(true);
    expect(MathPathPracticeSession.create).toHaveBeenCalledTimes(1);
  });

  it('POST /retention/start requires a skillId', async () => {
    const res = await request('/retention/start', { method: 'POST', body: {} });
    expect(res.status).toBe(400);
  });

  it('POST /retention/:id/submit scores the review and persists the schedule patch', async () => {
    const { buildCirclesRetentionReview } = await import('../services/mathpath/circlesRetentionService.js');
    const built = buildCirclesRetentionReview({ skillId: 'CI003', count: 4 });
    const session = {
      practiceSessionId: 'circlesretention_1',
      domainId: 'circles',
      status: 'inProgress',
      targetSkillId: 'CI003',
      questions: built.questions,
      save: vi.fn(async function save() { return this; }),
    };
    MathPathPracticeSession.findOne.mockResolvedValueOnce(session);
    MathPathStudentSkillState.findOne.mockReturnValueOnce({ lean: vi.fn(async () => ({ completedIntervalDays: [] })) });
    MathPathStudentSkillState.findOneAndUpdate.mockResolvedValueOnce({});

    const responses = built.questions.map((q) => ({ questionId: q.questionId, studentAnswer: q.answer.display ?? q.answer, timeTaken: 4 }));
    const res = await request('/retention/x/submit', { method: 'POST', body: { responses, intervalDays: 3 }, params: { practiceSessionId: 'circlesretention_1' } });

    expect(res.status).toBe(200);
    expect(res.data.mode).toBe('retention');
    expect(res.data.accuracy).toBe(100);
    expect(res.data.retained).toBe(true);
    expect(res.data.set.retentionStatus).toBe('retained');
    expect(session.save).toHaveBeenCalled();
    expect(MathPathStudentSkillState.findOneAndUpdate).toHaveBeenCalledTimes(1);
  });

  it('POST /retention/:id/submit 404s for an unknown session', async () => {
    MathPathPracticeSession.findOne.mockResolvedValueOnce(null);
    const res = await request('/retention/nope/submit', { method: 'POST', body: { responses: [] }, params: { practiceSessionId: 'nope' } });
    expect(res.status).toBe(404);
  });
});
