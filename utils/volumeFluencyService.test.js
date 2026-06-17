import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  getFluencyBenchmarks,
  computeConsistencyScore,
  classifyFluency,
  buildVolumeFluencyDrill,
  toClientFluencyQuestions,
  scoreVolumeFluencyDrill,
} from '../services/mathpath/volumeFluencyService.js';

describe('Volume fluency — benchmarks + classification', () => {
  it('derives bronze/silver/gold/platinum from a family target', () => {
    const b = getFluencyBenchmarks({ fluencyTargetSeconds: 10 });
    expect(b).toEqual({ bronze: 18, silver: 14, gold: 10, platinum: 7 });
  });

  it('classifies platinum/gold/silver/bronze and notReady by thresholds', () => {
    const benchmarks = { bronze: 18, silver: 14, gold: 10, platinum: 7 };
    expect(classifyFluency({ accuracy: 100, averageTime: 6, consistencyScore: 90, benchmarks, attemptsCount: 8 })).toBe('platinum');
    expect(classifyFluency({ accuracy: 93, averageTime: 9, consistencyScore: 78, benchmarks, attemptsCount: 8 })).toBe('gold');
    expect(classifyFluency({ accuracy: 89, averageTime: 13, consistencyScore: 66, benchmarks, attemptsCount: 8 })).toBe('silver');
    expect(classifyFluency({ accuracy: 86, averageTime: 17, consistencyScore: 56, benchmarks, attemptsCount: 8 })).toBe('bronze');
    // too few attempts or too slow / inaccurate → notReady
    expect(classifyFluency({ accuracy: 100, averageTime: 5, consistencyScore: 99, benchmarks, attemptsCount: 2 })).toBe('notReady');
    expect(classifyFluency({ accuracy: 70, averageTime: 5, consistencyScore: 99, benchmarks, attemptsCount: 8 })).toBe('notReady');
  });

  it('rewards stable, fast, accurate attempts with a higher consistency score', () => {
    const stable = computeConsistencyScore(
      [1, 2, 3, 4, 5].map(() => ({ correct: true, timeTaken: 8 })), 10,
    );
    const erratic = computeConsistencyScore(
      [{ correct: true, timeTaken: 2 }, { correct: false, timeTaken: 30 }, { correct: true, timeTaken: 25 }], 10,
    );
    expect(stable).toBeGreaterThan(erratic);
  });
});

describe('Volume fluency — drill building', () => {
  it('builds a timed drill for a skill with benchmarks and questions', () => {
    const drill = buildVolumeFluencyDrill({ skillId: 'VL002', count: 8 });
    expect(drill.domainId).toBe('volume');
    expect(drill.skillId).toBe('VL002');
    expect(drill.benchmarks.gold).toBeGreaterThan(0);
    expect(drill.questions).toHaveLength(8);
    expect(drill.questions.every((q) => q.skillId === 'VL002')).toBe(true);
    expect(new Set(drill.questions.map((q) => q.questionId)).size).toBe(8);
  });

  it('strips answers from the client copy', () => {
    const drill = buildVolumeFluencyDrill({ skillId: 'VL001', count: 4 });
    const client = toClientFluencyQuestions(drill.questions);
    expect(client.every((q) => q.answer === undefined && q.acceptedAnswers === undefined)).toBe(true);
    expect(client.every((q) => q.prompt && q.questionId)).toBe(true);
  });

  it('rejects an unknown skill', () => {
    expect(() => buildVolumeFluencyDrill({ skillId: 'ZZZ' })).toThrow();
  });
});

describe('Volume fluency — scoring', () => {
  it('awards a high band for fast, fully-correct answers', () => {
    const drill = buildVolumeFluencyDrill({ skillId: 'VL002', count: 8 });
    const fast = drill.questions.map((q) => ({ questionId: q.questionId, studentAnswer: q.answer.display, timeTaken: 3 }));
    const scored = scoreVolumeFluencyDrill({ skillId: 'VL002', questions: drill.questions, responses: fast });
    expect(scored.accuracy).toBe(100);
    expect(['gold', 'platinum', 'silver']).toContain(scored.band);
    expect(scored.averageTime).toBe(3);
  });

  it('returns notReady for slow or inaccurate drills', () => {
    const drill = buildVolumeFluencyDrill({ skillId: 'VL002', count: 8 });
    const slowWrong = drill.questions.map((q, i) => ({
      questionId: q.questionId,
      studentAnswer: i % 2 === 0 ? q.answer.display : 'wrong',
      timeTaken: 60,
    }));
    const scored = scoreVolumeFluencyDrill({ skillId: 'VL002', questions: drill.questions, responses: slowWrong });
    expect(scored.band).toBe('notReady');
    expect(scored.accuracy).toBeLessThan(80);
  });

  it('ignores responses for unknown question ids', () => {
    const drill = buildVolumeFluencyDrill({ skillId: 'VL001', count: 3 });
    const scored = scoreVolumeFluencyDrill({
      skillId: 'VL001',
      questions: drill.questions,
      responses: [{ questionId: 'nope', studentAnswer: '1', timeTaken: 5 }],
    });
    expect(scored.total).toBe(0);
    expect(scored.band).toBe('notReady');
  });
});

// ---------------------------------------------------------------------------
// Endpoint happy paths: drive the router directly with mocked auth + models.
// ---------------------------------------------------------------------------

const MOCK_STUDENT = { _id: 'student_1' };
const createdSessions = [];

const MathPathPracticeSession = {
  create: vi.fn(async (doc) => {
    const stored = {
      ...doc,
      summary: undefined,
      save: vi.fn(async function save() { return this; }),
    };
    createdSessions.push(stored);
    return stored;
  }),
  findOne: vi.fn(),
};
const MathPathStudentSkillState = {
  find: vi.fn(() => ({ lean: vi.fn(async () => []) })),
  findOne: vi.fn(() => ({ lean: vi.fn(async () => null) })),
  findOneAndUpdate: vi.fn(async () => ({})),
};
const MathPathMistakeRecord = {
  findOneAndUpdate: vi.fn(async () => ({})),
};

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
    const req = {
      method: String(method).toUpperCase(),
      url: path, path, originalUrl: path,
      query: {}, body, headers: {}, params,
    };
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(payload) { resolve({ status: this.statusCode, data: payload }); },
      send(payload) { resolve({ status: this.statusCode, data: payload }); },
    };
    router.handle(req, res, (err) => {
      if (err) reject(err);
      else resolve({ status: res.statusCode, data: null });
    });
  });
}

describe('Volume fluency — endpoints', () => {
  beforeAll(async () => {
    const mod = await import('../routes/mathpathVolume.js');
    router = mod.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
    createdSessions.length = 0;
  });

  it('POST /fluency/start builds + persists a drill and returns answer-stripped questions', async () => {
    const res = await request('/fluency/start', { method: 'POST', body: { skillId: 'VL002', count: 8 } });
    expect(res.status).toBe(200);
    expect(res.data.domainId).toBe('volume');
    expect(res.data.skillId).toBe('VL002');
    expect(res.data.benchmarks.gold).toBeGreaterThan(0);
    expect(res.data.questions).toHaveLength(8);
    expect(res.data.questions.every((q) => q.answer === undefined)).toBe(true);
    // Persisted full questions (with answers) under domainId 'volume'.
    expect(MathPathPracticeSession.create).toHaveBeenCalledTimes(1);
    const persisted = MathPathPracticeSession.create.mock.calls[0][0];
    expect(persisted.domainId).toBe('volume');
    expect(persisted.targetSkillId).toBe('VL002');
    expect(persisted.questions.every((q) => q.answer)).toBe(true);
  });

  it('POST /fluency/start rejects a missing skillId', async () => {
    const res = await request('/fluency/start', { method: 'POST', body: {} });
    expect(res.status).toBe(400);
    expect(res.data.error).toMatch(/skillId/);
  });

  it('POST /fluency/:id/submit scores the drill and persists fluencyLevel', async () => {
    const start = await request('/fluency/start', { method: 'POST', body: { skillId: 'VL002', count: 8 } });
    const sessionId = start.data.practiceSessionId;
    const stored = createdSessions[0];
    // The stored session carries the full questions (with answers).
    MathPathPracticeSession.findOne.mockResolvedValueOnce(stored);

    const responses = stored.questions.map((q) => ({ questionId: q.questionId, studentAnswer: q.answer.display, timeTaken: 3 }));
    const res = await request(`/fluency/${sessionId}/submit`, {
      method: 'POST',
      body: { responses },
      params: { practiceSessionId: sessionId },
    });

    expect(res.status).toBe(200);
    expect(res.data.domainId).toBe('volume');
    expect(res.data.mode).toBe('fluency');
    expect(res.data.accuracy).toBe(100);
    expect(res.data.persisted).toBe(true);
    expect(['silver', 'gold', 'platinum']).toContain(res.data.band);
    // Skill state persisted under domainId 'volume' with the band as fluencyLevel.
    expect(MathPathStudentSkillState.findOneAndUpdate).toHaveBeenCalledTimes(1);
    const [filter, update] = MathPathStudentSkillState.findOneAndUpdate.mock.calls[0];
    expect(filter).toMatchObject({ domainId: 'volume', skillId: 'VL002' });
    expect(update.$set.fluencyLevel).toBe(res.data.band);
    expect(stored.status).toBe('completed');
  });

  it('POST /fluency/:id/submit 404s for an unknown session', async () => {
    MathPathPracticeSession.findOne.mockResolvedValueOnce(null);
    const res = await request('/fluency/nope/submit', {
      method: 'POST', body: { responses: [] }, params: { practiceSessionId: 'nope' },
    });
    expect(res.status).toBe(404);
  });
});
