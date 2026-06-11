import { describe, it, expect, vi, beforeEach } from 'vitest';

const SESSION_DATA = {
  sessionId: 'sess-1',
  studentId: 'student-1',
  skillId: 'psl-p3-bar-pw-find-whole',
  workspaceId: 'ws-1',
  status: 'inProgress',
  currentProblemIndex: 0,
  problems: [
    {
      problemId: 'prob-1',
      templateId: 'tpl-1',
      storyText: 'Wei Ling has 25 apples. Jun Hao has 30 apples. How many in total?',
      givenNumbers: [25, 30],
      correctAnswer: 55,
      status: 'pending',
      scaffoldSteps: [
        { stepId: 'understand', type: 'mc', prompt: 'What is this story about?', expectedResponse: { correctIndex: 0 }, choices: ['Buying fruit', 'School'] },
        { stepId: 'identify_info', type: 'highlight', prompt: 'Tap the numbers.', expectedResponse: { numbers: [25, 30] } },
        { stepId: 'identify_question', type: 'mc', prompt: 'What to find?', expectedResponse: { correctIndex: 0 }, choices: ['The total', 'The difference'] },
        { stepId: 'plan', type: 'model', prompt: 'Which model?', expectedResponse: { modelType: 'partWhole', unknownPosition: 'whole' } },
        { stepId: 'solve', type: 'expression', prompt: 'Write the sentence.', expectedResponse: { operation: 'addition', answer: 55 } },
        { stepId: 'check', type: 'reasonableness', prompt: 'Is it reasonable?', expectedResponse: { reasonable: true } },
      ],
    },
  ],
  summary: { totalProblems: 1 },
};

function makeSession(overrides = {}) {
  const s = JSON.parse(JSON.stringify({ ...SESSION_DATA, ...overrides }));
  s.save = vi.fn().mockResolvedValue(undefined);
  return s;
}

let findOneSessionResult = null;
let findAttemptsResult = [];
let findOneAttemptResult = null;
let findOneSkillResult = null;
let createdLearningResult = null;
let createdMistakes = [];
let recordedAttempts = [];

vi.mock('../../models/psl/PSLSession.js', () => ({
  default: {
    findOne: vi.fn(() => findOneSessionResult),
    create: vi.fn((data) => ({ ...data, save: vi.fn() })),
  },
}));

vi.mock('../../models/psl/PSLAttempt.js', () => {
  const AttemptClass = vi.fn(function (data) {
    Object.assign(this, data);
    this.steps = data.steps || [];
    this.save = vi.fn().mockResolvedValue(undefined);
  });
  AttemptClass.findOne = vi.fn(() => {
    const val = findOneAttemptResult;
    return { lean: () => Promise.resolve(val), then: (fn) => Promise.resolve(val).then(fn) };
  });
  AttemptClass.find = vi.fn(() => ({ lean: () => Promise.resolve(findAttemptsResult) }));
  return { default: AttemptClass };
});

vi.mock('../../models/psl/PSLSkill.js', () => ({
  default: { findOne: vi.fn(() => ({ lean: () => Promise.resolve(findOneSkillResult) })) },
}));

vi.mock('../../models/Mistake.js', () => ({
  default: { create: vi.fn((data) => { createdMistakes.push(data); return Promise.resolve(data); }) },
}));

vi.mock('../../models/LearningResult.js', () => ({
  default: { create: vi.fn((data) => { createdLearningResult = data; return Promise.resolve(data); }) },
}));

vi.mock('../../utils/masteryEngine.js', () => ({
  recordAttempt: vi.fn((data) => { recordedAttempts.push(data); return Promise.resolve(); }),
}));

vi.mock('./problemGenerator.js', () => ({
  generateProblemsForSession: vi.fn(() => Promise.resolve(SESSION_DATA.problems)),
}));

import { submitStep, completeSession, completeProblem } from './sessionOrchestrator.js';

beforeEach(() => {
  vi.clearAllMocks();
  createdLearningResult = null;
  createdMistakes = [];
  recordedAttempts = [];
  findOneSessionResult = null;
  findAttemptsResult = [];
  findOneAttemptResult = null;
  findOneSkillResult = { _id: 'skill-obj-id', name: 'Bar model: find the whole', skillId: 'psl-p3-bar-pw-find-whole' };
});

describe('submitStep', () => {
  it('evaluates a correct understand step', async () => {
    const session = makeSession();
    findOneSessionResult = session;
    findOneAttemptResult = null;

    const result = await submitStep({
      sessionId: 'sess-1',
      problemId: 'prob-1',
      stepId: 'understand',
      response: { selectedIndex: 0 },
    });

    expect(result.correct).toBe(true);
    expect(result.score).toBe(1);
    expect(result.feedback).toBe('Well done!');
  });

  it('evaluates a wrong step with misconception tag', async () => {
    const session = makeSession();
    findOneSessionResult = session;
    findOneAttemptResult = null;

    const result = await submitStep({
      sessionId: 'sess-1',
      problemId: 'prob-1',
      stepId: 'identify_question',
      response: { selectedIndex: 2 },
    });

    expect(result.correct).toBe(false);
    expect(result.misconceptionTag).toBe('psl/confused-question');
  });

  it('throws for unknown session', async () => {
    findOneSessionResult = null;
    await expect(submitStep({
      sessionId: 'nope',
      problemId: 'prob-1',
      stepId: 'understand',
      response: {},
    })).rejects.toThrow('Session not found');
  });

  it('throws for unknown problem', async () => {
    const session = makeSession();
    findOneSessionResult = session;

    await expect(submitStep({
      sessionId: 'sess-1',
      problemId: 'nope',
      stepId: 'understand',
      response: {},
    })).rejects.toThrow('Problem not found');
  });
});

describe('completeSession', () => {
  it('computes summary from attempts', async () => {
    const session = makeSession();
    findOneSessionResult = session;
    findAttemptsResult = [
      { overallCorrect: true, overallScore: 1, totalTimeMs: 30000, steps: [] },
    ];

    const result = await completeSession('sess-1');

    expect(result.summary.totalProblems).toBe(1);
    expect(result.summary.completedProblems).toBe(1);
    expect(result.summary.fullMarks).toBe(1);
    expect(result.summary.overallScore).toBe(1);
    expect(session.status).toBe('completed');
    expect(session.completedAt).toBeInstanceOf(Date);
  });

  it('counts misconceptions in summary', async () => {
    const session = makeSession();
    findOneSessionResult = session;
    findAttemptsResult = [
      {
        overallCorrect: false,
        overallScore: 0.5,
        totalTimeMs: 45000,
        steps: [
          { stepId: 'plan', misconceptionTag: 'psl/wrong-model-type' },
          { stepId: 'solve', misconceptionTag: 'psl/arithmetic-error' },
          { stepId: 'solve', misconceptionTag: 'psl/arithmetic-error' },
        ],
      },
    ];

    const result = await completeSession('sess-1');

    expect(result.summary.misconceptionCounts).toEqual({
      'psl/wrong-model-type': 1,
      'psl/arithmetic-error': 2,
    });
  });

  it('creates a LearningResult', async () => {
    const session = makeSession();
    findOneSessionResult = session;
    findAttemptsResult = [
      { overallCorrect: true, overallScore: 0.9, totalTimeMs: 120000, steps: [] },
    ];

    await completeSession('sess-1');

    expect(createdLearningResult).not.toBeNull();
    expect(createdLearningResult.user).toBe('student-1');
    expect(createdLearningResult.source).toBe('psl');
    expect(createdLearningResult.subject).toBe('emath');
    expect(createdLearningResult.topic).toBe('Bar model: find the whole');
    expect(createdLearningResult.accuracy).toBe(90);
    expect(createdLearningResult.mastered).toBe(true);
  });

  it('LearningResult mastered is false below 85%', async () => {
    const session = makeSession();
    findOneSessionResult = session;
    findAttemptsResult = [
      { overallCorrect: false, overallScore: 0.6, totalTimeMs: 60000, steps: [] },
    ];

    await completeSession('sess-1');

    expect(createdLearningResult.mastered).toBe(false);
    expect(createdLearningResult.accuracy).toBe(60);
  });

  it('throws for unknown session', async () => {
    findOneSessionResult = null;
    await expect(completeSession('nope')).rejects.toThrow('Session not found');
  });
});

describe('completeProblem', () => {
  it('advances to next problem', async () => {
    const session = makeSession();
    session.problems.push({ ...session.problems[0], problemId: 'prob-2', status: 'pending' });
    findOneSessionResult = session;
    findOneAttemptResult = { overallCorrect: true, overallScore: 1, totalTimeMs: 20000, steps: [] };

    const result = await completeProblem({ sessionId: 'sess-1', problemId: 'prob-1' });

    expect(result.completed).toBe(true);
    expect(result.hasNextProblem).toBe(true);
    expect(result.nextProblem).toBeTruthy();
    expect(session.currentProblemIndex).toBe(1);
  });

  it('records mastery attempt', async () => {
    const session = makeSession();
    findOneSessionResult = session;
    findOneAttemptResult = { overallCorrect: true, overallScore: 1, totalTimeMs: 20000, steps: [] };

    await completeProblem({ sessionId: 'sess-1', problemId: 'prob-1' });

    expect(recordedAttempts).toHaveLength(1);
    expect(recordedAttempts[0].module).toBe('PSL');
    expect(recordedAttempts[0].correct).toBe(true);
  });

  it('creates Mistake records for wrong steps', async () => {
    const session = makeSession();
    findOneSessionResult = session;
    findOneAttemptResult = {
      overallCorrect: false,
      overallScore: 0.5,
      totalTimeMs: 30000,
      steps: [
        { stepId: 'understand', correct: true, score: 1 },
        { stepId: 'plan', correct: false, score: 0, misconceptionTag: 'psl/wrong-model-type', response: { modelType: 'comparison' } },
      ],
    };

    await completeProblem({ sessionId: 'sess-1', problemId: 'prob-1' });

    expect(createdMistakes).toHaveLength(1);
    expect(createdMistakes[0].module).toBe('PSL');
    expect(createdMistakes[0].misconceptionTag).toBe('psl/wrong-model-type');
  });

  it('no next problem when session is done', async () => {
    const session = makeSession();
    findOneSessionResult = session;
    findOneAttemptResult = { overallCorrect: true, overallScore: 1, totalTimeMs: 20000, steps: [] };

    const result = await completeProblem({ sessionId: 'sess-1', problemId: 'prob-1' });

    expect(result.hasNextProblem).toBe(false);
    expect(result.nextProblem).toBeNull();
  });
});
