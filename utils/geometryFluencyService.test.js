import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  getFluencyBenchmarks,
  computeConsistencyScore,
  classifyFluency,
  buildGeometryFluencyDrill,
  toClientFluencyQuestions,
  scoreGeometryFluencyDrill,
} from '../services/mathpath/geometryFluencyService.js';

describe('Geometry fluency — benchmarks + classification', () => {
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

describe('Geometry fluency — drill building', () => {
  it('builds a timed drill for a skill with benchmarks and questions', () => {
    const drill = buildGeometryFluencyDrill({ skillId: 'GE002', count: 8 });
    expect(drill.domainId).toBe('geometry');
    expect(drill.skillId).toBe('GE002');
    expect(drill.benchmarks.gold).toBeGreaterThan(0);
    expect(drill.questions).toHaveLength(8);
    expect(drill.questions.every((q) => q.skillId === 'GE002')).toBe(true);
    expect(new Set(drill.questions.map((q) => q.questionId)).size).toBe(8);
  });

  it('preserves the visual question shape (answer object + prompt)', () => {
    const drill = buildGeometryFluencyDrill({ skillId: 'GE001', count: 4 });
    expect(drill.questions.every((q) => q.prompt && q.answer && q.answer.display !== undefined)).toBe(true);
  });

  it('strips answers from the client copy', () => {
    const drill = buildGeometryFluencyDrill({ skillId: 'GE003', count: 4 });
    const client = toClientFluencyQuestions(drill.questions);
    expect(client.every((q) => q.answer === undefined && q.acceptedAnswers === undefined && q.solutionSteps === undefined)).toBe(true);
    expect(client.every((q) => q.prompt && q.questionId)).toBe(true);
  });

  it('rejects an unknown skill', () => {
    expect(() => buildGeometryFluencyDrill({ skillId: 'ZZZ' })).toThrow();
  });
});

describe('Geometry fluency — scoring', () => {
  it('awards a high band for fast, fully-correct answers', () => {
    const drill = buildGeometryFluencyDrill({ skillId: 'GE001', count: 8 });
    const fast = drill.questions.map((q) => ({ questionId: q.questionId, studentAnswer: q.answer.display, timeTaken: 2 }));
    const scored = scoreGeometryFluencyDrill({ skillId: 'GE001', questions: drill.questions, responses: fast });
    expect(scored.accuracy).toBe(100);
    expect(['gold', 'platinum', 'silver']).toContain(scored.band);
    expect(scored.averageTime).toBe(2);
  });

  it('returns notReady for slow or inaccurate drills', () => {
    const drill = buildGeometryFluencyDrill({ skillId: 'GE002', count: 8 });
    const slowWrong = drill.questions.map((q, i) => ({
      questionId: q.questionId,
      studentAnswer: i % 2 === 0 ? q.answer.display : 'definitely-wrong-zzz',
      timeTaken: 90,
    }));
    const scored = scoreGeometryFluencyDrill({ skillId: 'GE002', questions: drill.questions, responses: slowWrong });
    expect(scored.band).toBe('notReady');
    expect(scored.accuracy).toBeLessThan(80);
  });

  it('ignores responses for unknown question ids', () => {
    const drill = buildGeometryFluencyDrill({ skillId: 'GE001', count: 3 });
    const scored = scoreGeometryFluencyDrill({
      skillId: 'GE001',
      questions: drill.questions,
      responses: [{ questionId: 'nope', studentAnswer: '1', timeTaken: 5 }],
    });
    expect(scored.total).toBe(0);
    expect(scored.band).toBe('notReady');
  });
});

// ---- Endpoint happy paths (router-level, models mocked) ----

const MOCK_STUDENT = { _id: 'student_geo_1' };

const MathPathPracticeSession = {
  create: vi.fn(),
  findOne: vi.fn(),
};
const MathPathStudentSkillState = {
  find: vi.fn(),
  findOne: vi.fn(() => ({ lean: vi.fn(async () => null) })),
  findOneAndUpdate: vi.fn(),
};
const MathPathMistakeRecord = {
  findOneAndUpdate: vi.fn(),
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

describe('Geometry fluency — endpoints', () => {
  beforeAll(async () => {
    const mod = await import('../routes/mathpathGeometry.js');
    router = mod.default;
  });

  afterEach(() => { vi.clearAllMocks(); });

  it('POST /fluency/start builds a drill, persists a session, returns answer-stripped questions', async () => {
    let persisted = null;
    MathPathPracticeSession.create.mockImplementationOnce(async (doc) => { persisted = doc; return doc; });

    const res = await request('/fluency/start', { method: 'POST', body: { skillId: 'GE001', count: 6 } });

    expect(res.status).toBe(200);
    expect(res.data.domainId).toBe('geometry');
    expect(res.data.skillId).toBe('GE001');
    expect(res.data.benchmarks.gold).toBeGreaterThan(0);
    expect(res.data.questions).toHaveLength(6);
    // client copy is answer-stripped
    expect(res.data.questions.every((q) => q.answer === undefined && q.acceptedAnswers === undefined)).toBe(true);
    // persisted copy keeps full answers under the practice domainId
    expect(persisted.domainId).toBe('geometry');
    expect(persisted.questions.every((q) => q.answer && q.answer.display !== undefined)).toBe(true);
    expect(persisted.practiceSessionId).toMatch(/^geometryfluency_/);
  });

  it('POST /fluency/start rejects a missing skillId', async () => {
    const res = await request('/fluency/start', { method: 'POST', body: {} });
    expect(res.status).toBe(400);
  });

  it('POST /fluency/:id/submit scores the drill and persists fluencyLevel under domainId geometry', async () => {
    // First build a real drill to get a valid persisted question set.
    const drill = buildGeometryFluencyDrill({ skillId: 'GE001', count: 6 });
    const session = {
      practiceSessionId: 'geometryfluency_test',
      domainId: 'geometry',
      targetSkillId: 'GE001',
      questions: drill.questions,
      status: 'inProgress',
      summary: null,
      save: vi.fn(async function save() { return this; }),
    };
    MathPathPracticeSession.findOne.mockResolvedValueOnce(session);
    let skillUpdate = null;
    MathPathStudentSkillState.findOneAndUpdate.mockImplementationOnce(async (filter, update) => {
      skillUpdate = { filter, update }; return {};
    });

    const responses = drill.questions.map((q) => ({ questionId: q.questionId, studentAnswer: q.answer.display, timeTaken: 2 }));
    const res = await request('/fluency/geometryfluency_test/submit', {
      method: 'POST', params: { practiceSessionId: 'geometryfluency_test' }, body: { responses },
    });

    expect(res.status).toBe(200);
    expect(res.data.domainId).toBe('geometry');
    expect(res.data.mode).toBe('fluency');
    expect(res.data.accuracy).toBe(100);
    expect(res.data.persisted).toBe(true);
    expect(skillUpdate.filter).toMatchObject({ domainId: 'geometry', skillId: 'GE001' });
    expect(skillUpdate.update.$set.fluencyLevel).toBe(res.data.band);
    expect(session.save).toHaveBeenCalled();
    expect(session.status).toBe('completed');
  });

  it('POST /fluency/:id/submit returns 404 when the session is missing', async () => {
    MathPathPracticeSession.findOne.mockResolvedValueOnce(null);
    const res = await request('/fluency/missing/submit', {
      method: 'POST', params: { practiceSessionId: 'missing' }, body: { responses: [] },
    });
    expect(res.status).toBe(404);
  });
});
