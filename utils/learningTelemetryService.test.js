import { afterEach, describe, expect, it, vi } from 'vitest';

const create = vi.fn();
const insertMany = vi.fn();
const find = vi.fn(() => ({ lean: vi.fn(async () => []) }));

vi.mock('../models/LearningTelemetryEvent.js', () => ({
  default: {
    create: (...args) => create(...args),
    insertMany: (...args) => insertMany(...args),
    find: (...args) => find(...args),
  },
  LEARNING_EVENT_TYPES: [
    'session_started',
    'session_completed',
    'session_abandoned',
    'question_viewed',
    'question_answered',
    'question_skipped',
    'confidence_selected',
    'working_submitted',
    'working_not_needed_declared',
    'diagnostic_completed',
    'skill_mastered',
    'recommendation_selected',
  ],
}));

const {
  normalizeConfidence,
  aggregateConfidenceBuckets,
  getStudentAnalytics,
  getPilotAnalytics,
  recordLearningEvent,
  recordLearningEvents,
} = await import('../services/telemetry/learningTelemetryService.js');

describe('learning telemetry service', () => {
  afterEach(() => {
    vi.clearAllMocks();
    find.mockImplementation(() => ({ lean: vi.fn(async () => []) }));
  });

  it('normalizes student reflection values into telemetry confidence codes', () => {
    expect(normalizeConfidence('i_know_this')).toBe('I_KNOW_THIS');
    expect(normalizeConfidence('not_sure')).toBe('IM_NOT_SURE');
    expect(normalizeConfidence('i_need_help')).toBe('I_DONT_KNOW');
  });

  it('aggregates confidence against correctness into six dashboard buckets', () => {
    const buckets = aggregateConfidenceBuckets([
      { metadata: { confidence: 'i_know_this', answerCorrect: true } },
      { metadata: { confidence: 'i_know_this', answerCorrect: false } },
      { metadata: { confidence: "I'm not sure", answerCorrect: true } },
      { metadata: { confidence: 'not_sure', answerCorrect: false } },
      { metadata: { confidence: "I don't know", answerCorrect: true } },
      { metadata: { confidence: 'i_need_help', answerCorrect: false } },
    ]);

    expect(buckets).toEqual({
      confidentCorrect: 1,
      confidentIncorrect: 1,
      unsureCorrect: 1,
      unsureIncorrect: 1,
      needsHelpCorrect: 1,
      needsHelpIncorrect: 1,
    });
  });

  it('records valid learning events with generic fields', async () => {
    create.mockResolvedValueOnce({ _id: 'event_1' });

    await recordLearningEvent({
      studentId: 'student_1',
      eventType: 'question_answered',
      domain: 'fractions',
      skillCode: 'F006',
      questionId: 'q1',
      sessionId: 's1',
      metadata: { answerCorrect: false, confidence: 'I_KNOW_THIS' },
    });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      studentId: 'student_1',
      eventType: 'question_answered',
      domain: 'fractions',
      skillCode: 'F006',
      questionId: 'q1',
      sessionId: 's1',
      metadata: { answerCorrect: false, confidence: 'I_KNOW_THIS' },
    }));
  });

  it('records event batches without accepting unknown event types', async () => {
    insertMany.mockResolvedValueOnce([]);

    await recordLearningEvents([
      { studentId: 'student_1', eventType: 'working_submitted', domain: 'fractions' },
      { studentId: 'student_1', eventType: 'unknown_event', domain: 'fractions' },
    ]);

    expect(insertMany).toHaveBeenCalledWith([
      expect.objectContaining({ eventType: 'working_submitted' }),
    ], { ordered: false });
  });

  it('returns student confidence buckets and empty states from analytics', async () => {
    const answered = [
      { studentId: 's1', eventType: 'question_answered', sessionId: 'p1', skillCode: 'F001', timestamp: new Date(), metadata: { answerCorrect: true, workingSubmitted: true, confidence: 'I_KNOW_THIS' } },
      { studentId: 's1', eventType: 'question_answered', sessionId: 'p1', skillCode: 'F001', timestamp: new Date(), metadata: { answerCorrect: false, confidence: 'I_KNOW_THIS' } },
      { studentId: 's1', eventType: 'question_answered', sessionId: 'p1', skillCode: 'F001', timestamp: new Date(), metadata: { answerCorrect: true, confidence: 'IM_NOT_SURE' } },
    ];
    find.mockImplementation((query = {}) => ({
      lean: vi.fn(async () => {
        if (query.eventType === 'question_answered') return answered;
        return [];
      }),
    }));

    const analytics = await getStudentAnalytics({ studentId: 's1', days: 7 });

    expect(analytics.questionsAnswered).toBe(3);
    expect(analytics.accuracyRate).toBe(67);
    expect(analytics.confidenceBuckets).toMatchObject({
      confidentCorrect: 1,
      confidentIncorrect: 1,
      unsureCorrect: 1,
    });
    expect(analytics.emptyStates.confidenceInsight).toBe('');
  });

  it('summarizes pilot QA metrics and telemetry coverage', async () => {
    const events = [
      { studentId: 's1', eventType: 'session_started', sessionId: 'p1', timestamp: new Date(), metadata: {} },
      { studentId: 's1', eventType: 'question_viewed', sessionId: 'p1', questionId: 'q1', timestamp: new Date(), metadata: {} },
      { studentId: 's1', eventType: 'question_answered', sessionId: 'p1', skillCode: 'F001', timestamp: new Date(), metadata: { answerCorrect: true, workingSubmitted: true, confidence: 'I_KNOW_THIS' } },
      { studentId: 's1', eventType: 'question_skipped', sessionId: 'p1', skillCode: 'F002', timestamp: new Date(), metadata: { skipped: true } },
      { studentId: 's1', eventType: 'confidence_selected', sessionId: 'p1', timestamp: new Date(), metadata: { confidence: 'I_KNOW_THIS' } },
      { studentId: 's1', eventType: 'working_submitted', sessionId: 'p1', timestamp: new Date(), metadata: {} },
      { studentId: 's1', eventType: 'working_not_needed_declared', sessionId: 'p1', timestamp: new Date(), metadata: {} },
      { studentId: 's1', eventType: 'session_completed', sessionId: 'p1', timestamp: new Date(), metadata: { sessionLengthSeconds: 120 } },
      { studentId: 's1', eventType: 'diagnostic_completed', sessionId: 'd1', timestamp: new Date(), metadata: {} },
      { studentId: 's1', eventType: 'skill_mastered', skillCode: 'F001', timestamp: new Date(), metadata: {} },
    ];
    find.mockImplementation((query = {}) => ({
      lean: vi.fn(async () => events.filter((event) => !query.eventType || event.eventType === query.eventType)),
    }));

    const analytics = await getPilotAnalytics({ days: 7, domain: 'fractions' });

    expect(analytics.pilotMetrics.practiceSessions).toBe(1);
    expect(analytics.pilotMetrics.diagnosticCompletions).toBe(1);
    expect(analytics.pilotMetrics.questionsAnswered).toBe(1);
    expect(analytics.mostActiveStudents[0]).toMatchObject({ studentId: 's1', events: 10 });
    expect(analytics.telemetryCoverage.missingEvents).toEqual([]);
  });
});
