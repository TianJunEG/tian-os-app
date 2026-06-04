import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const MOCK_STUDENT = { _id: 'student_1', workspaceId: 'workspace_1' };
const MOCK_SKILL = {
  _id: 'skill_1',
  name: 'Times tables',
  metadata: { fluencyType: 'timed', fluency: { targetSeconds: 10 } },
};
const recordLearningEvents = vi.fn();
const resolveFluencySkill = vi.fn();
const updateFluencyCompletionForSession = vi.fn();
const selectSimilarQuestions = vi.fn();

const PracticeSession = {
  create: vi.fn(),
  findById: vi.fn(),
};
const PracticeAttempt = {
  countDocuments: vi.fn(),
  create: vi.fn(),
};
const Question = {
  find: vi.fn(),
};
const Skill = {
  findById: vi.fn(),
};

vi.mock('../middleware/auth.js', () => ({
  protect: (req, _res, next) => {
    req.user = { id: 'user_1', role: 'student' };
    next();
  },
}));

vi.mock('../utils/studentContext.js', () => ({
  resolveStudent: vi.fn(async () => MOCK_STUDENT),
}));

vi.mock('../services/telemetry/learningTelemetryService.js', () => ({
  recordLearningEvents: (...args) => recordLearningEvents(...args),
}));

vi.mock('../services/fluency/fluencyCompletionService.js', () => ({
  resolveFluencySkill: (...args) => resolveFluencySkill(...args),
  skillCodeFor: () => 'times_tables',
  updateFluencyCompletionForSession: (...args) => updateFluencyCompletionForSession(...args),
}));

vi.mock('../utils/worksheetGen.js', () => ({
  selectSimilarQuestions: (...args) => selectSimilarQuestions(...args),
}));

vi.mock('../models/PracticeSession.js', () => ({ default: PracticeSession }));
vi.mock('../models/PracticeAttempt.js', () => ({ default: PracticeAttempt }));
vi.mock('../models/Question.js', () => ({ default: Question }));
vi.mock('../models/Skill.js', () => ({ default: Skill }));
vi.mock('../models/Assignment.js', () => ({ default: { findByIdAndUpdate: vi.fn() } }));
vi.mock('../models/FluencyRecord.js', () => ({ default: { find: vi.fn(() => ({ sort: vi.fn(() => ({ lean: vi.fn(async () => []) })) })) } }));
vi.mock('../models/RetentionReview.js', () => ({
  default: {
    findOne: vi.fn(async () => null),
    findOneAndUpdate: vi.fn(),
    find: vi.fn(() => ({ sort: vi.fn(() => ({ lean: vi.fn(async () => []) })) })),
  },
}));

let router;

async function request(path, { method = 'GET', body = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = {
      method: String(method).toUpperCase(),
      url: path,
      path,
      originalUrl: path,
      query: {},
      body,
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

describe('fluency route telemetry linkage', () => {
  beforeAll(async () => {
    const mod = await import('./fluency.js');
    router = mod.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('emits fluency_started when a fluency session starts', async () => {
    resolveFluencySkill.mockResolvedValueOnce(MOCK_SKILL);
    selectSimilarQuestions.mockResolvedValueOnce([
      { _id: 'q1', stem: '2 × 3 = ?', type: 'short_answer', choices: [], difficulty: 'medium', skillId: MOCK_SKILL._id },
      { _id: 'q2', stem: '4 × 3 = ?', type: 'short_answer', choices: [], difficulty: 'medium', skillId: MOCK_SKILL._id },
    ]);
    PracticeSession.create.mockResolvedValueOnce({
      _id: 'session_1',
      mode: 'fluency',
      feature: 'Fluency Practice',
    });
    recordLearningEvents.mockResolvedValueOnce([]);

    const res = await request('/session/start', {
      method: 'POST',
      body: { skillId: MOCK_SKILL._id, questionCount: 10 },
    });

    expect(res.status).toBe(200);
    const eventTypes = recordLearningEvents.mock.calls[0][0].map((event) => event.eventType);
    expect(eventTypes).toContain('session_started');
    expect(eventTypes).toContain('fluency_started');
    expect(recordLearningEvents.mock.calls[0][0]).toEqual(expect.arrayContaining([
      expect.objectContaining({
        eventType: 'fluency_started',
        studentId: MOCK_STUDENT._id,
        sessionId: 'session_1',
        metadata: expect.objectContaining({
          source: 'fluency',
          skillId: MOCK_SKILL._id,
          fluencyType: 'timed',
          questionCount: 2,
        }),
      }),
    ]));
  });

  it('emits completion telemetry after dedicated fluency completion', async () => {
    const session = {
      _id: 'session_2',
      status: 'active',
      mode: 'fluency',
      feature: 'Fluency Practice',
      skillIds: [MOCK_SKILL._id],
      save: vi.fn(async () => session),
    };
    PracticeSession.findById.mockResolvedValueOnce(session);
    Skill.findById.mockResolvedValueOnce(MOCK_SKILL);
    PracticeAttempt.countDocuments.mockResolvedValueOnce(0);
    updateFluencyCompletionForSession.mockResolvedValueOnce({
      metrics: { totalQuestions: 1, correctAnswers: 1, accuracy: 100, averageTimeSeconds: 5, fluencyScore: 95, fluencyStatus: 'fluent' },
      record: { _id: 'record_1' },
      retentionScheduled: true,
    });
    recordLearningEvents.mockResolvedValueOnce([]);

    const res = await request('/session/complete', {
      method: 'POST',
      body: { sessionId: session._id, attempts: [] },
    });

    expect(res.status).toBe(200);
    expect(session.save).toHaveBeenCalled();
    const eventTypes = recordLearningEvents.mock.calls[0][0].map((event) => event.eventType);
    expect(eventTypes).toEqual(['session_completed', 'fluency_completed']);
    expect(res.data.fluency.fluencyScore).toBe(95);
  });

  it('does not emit duplicate completion telemetry for already-completed sessions', async () => {
    const session = {
      _id: 'session_3',
      status: 'completed',
      mode: 'fluency',
      feature: 'Fluency Practice',
      skillIds: [MOCK_SKILL._id],
      save: vi.fn(),
    };
    PracticeSession.findById.mockResolvedValueOnce(session);
    Skill.findById.mockResolvedValueOnce(MOCK_SKILL);
    PracticeAttempt.countDocuments.mockResolvedValueOnce(1);
    updateFluencyCompletionForSession.mockResolvedValueOnce({
      metrics: { totalQuestions: 1, correctAnswers: 1, accuracy: 100, averageTimeSeconds: 5, fluencyScore: 95, fluencyStatus: 'fluent' },
      record: { _id: 'record_1' },
      retentionScheduled: false,
      alreadyRecorded: true,
    });

    const res = await request('/session/complete', {
      method: 'POST',
      body: { sessionId: session._id, attempts: [] },
    });

    expect(res.status).toBe(200);
    expect(session.save).not.toHaveBeenCalled();
    expect(recordLearningEvents).not.toHaveBeenCalled();
  });
});
