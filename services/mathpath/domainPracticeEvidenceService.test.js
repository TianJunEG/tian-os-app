import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  attempts: {
    findOneAndUpdate: vi.fn(),
  },
  mistakes: {
    findOneAndUpdate: vi.fn(),
  },
  skills: {
    find: vi.fn(),
  },
  telemetry: {
    normalizeConfidence: vi.fn((value) => value || ''),
    recordLearningEvents: vi.fn(),
  },
}));

vi.mock('../../models/mathpath/MathPathAttempt.js', () => ({ default: mocks.attempts }));
vi.mock('../../models/Mistake.js', () => ({ default: mocks.mistakes }));
vi.mock('../../models/Skill.js', () => ({ default: mocks.skills }));
vi.mock('../telemetry/learningTelemetryService.js', () => mocks.telemetry);

const { persistDomainPracticeEvidence } = await import('./domainPracticeEvidenceService.js');

function chainableSkillsFind(docs) {
  return {
    select: () => ({
      lean: () => Promise.resolve(docs),
    }),
  };
}

describe('persistDomainPracticeEvidence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.skills.find.mockReturnValue(chainableSkillsFind([
      {
        _id: 'skill-object-1',
        slug: 'stat.tables',
        name: 'Read tables',
        metadata: { mathPathSkillId: 'STAT001', frameworkCode: 'STAT001' },
      },
    ]));
    mocks.attempts.findOneAndUpdate.mockImplementation((query, update) => Promise.resolve({
      ...update.$setOnInsert,
      _id: `attempt-row-${query.attemptId}`,
    }));
    mocks.mistakes.findOneAndUpdate.mockImplementation((query, update) => Promise.resolve({
      ...update.$setOnInsert,
      _id: `mistake-row-${query.attemptId}`,
    }));
  });

  it('persists attempts, shared mistakes, working evidence, skipped state, and domain metadata', async () => {
    const student = { _id: 'student-1', workspaceId: 'workspace-1' };
    const session = {
      practiceSessionId: 'session-1',
      questions: [
        {
          questionId: 'q1',
          skillId: 'STAT001',
          questionFamilyId: 'stat-table-read',
          prompt: 'Use the table to answer.',
          answer: { display: '6' },
          solutionSteps: ['Read the Monday row.', 'The value is 6.'],
        },
        {
          questionId: 'q2',
          skillId: 'STAT001',
          questionFamilyId: 'stat-table-read',
          prompt: 'Use the table to answer the next value.',
          answer: { display: '8' },
          solutionSteps: ['Read the Tuesday row.', 'The value is 8.'],
        },
      ],
    };
    const scored = {
      results: [
        { questionId: 'q1', skillId: 'STAT001', correct: false, studentAnswer: '5', misconceptionTag: 'table_reading' },
        { questionId: 'q2', skillId: 'STAT001', correct: false, studentAnswer: '', misconceptionTag: '' },
      ],
      accuracySummary: { total: 2, correct: 0, accuracyPercentage: 0 },
    };
    const responses = [
      {
        questionId: 'q1',
        answer: '5',
        confidence: 'i_know_this',
        fullscreenWorkingSubmitted: true,
        fullscreenWorkingImage: 'data:image/png;base64,abc',
        workingStrokes: [{ points: [{ x: 1, y: 2 }] }],
        workingSessionId: 'working-1',
      },
      {
        questionId: 'q2',
        answer: '',
        skipped: true,
        confidence: 'i_need_help',
      },
    ];

    const persisted = await persistDomainPracticeEvidence({
      student,
      domainId: 'statistics',
      session,
      scored,
      responses,
    });

    expect(persisted.attemptsPersisted).toBe(2);
    expect(persisted.sharedMistakesPersisted).toBe(2);
    expect(persisted.results[0].workedSolution).toContain('Read the Monday row.');
    expect(persisted.results[0].fullscreenWorkingSubmitted).toBe(true);
    expect(persisted.results[1].skipped).toBe(true);

    expect(mocks.attempts.findOneAndUpdate).toHaveBeenCalledTimes(2);
    expect(mocks.attempts.findOneAndUpdate.mock.calls[0][1].$setOnInsert).toMatchObject({
      domainId: 'statistics',
      questionId: 'q1',
      workingSubmitted: true,
      fullscreenWorkingSubmitted: true,
    });

    expect(mocks.mistakes.findOneAndUpdate).toHaveBeenCalledTimes(2);
    expect(mocks.mistakes.findOneAndUpdate.mock.calls[0][1].$setOnInsert).toMatchObject({
      domainId: 'statistics',
      skillId: 'skill-object-1',
      skillCode: 'STAT001',
      workedSolution: 'Read the Monday row.\nThe value is 6.',
      workingSubmitted: true,
      workingImage: 'data:image/png;base64,abc',
      misconceptionTag: 'table_reading',
    });
    expect(mocks.mistakes.findOneAndUpdate.mock.calls[1][1].$setOnInsert).toMatchObject({
      domainId: 'statistics',
      misconceptionTag: 'skipped_answer',
      source: 'practice-incorrect',
    });

    const events = mocks.telemetry.recordLearningEvents.mock.calls[0][0];
    expect(events.map((event) => event.eventType)).toEqual([
      'question_answered',
      'question_skipped',
      'practice_completed',
    ]);
    expect(events.every((event) => event.domain === 'statistics')).toBe(true);
  });
});
