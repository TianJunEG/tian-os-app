import { afterEach, describe, expect, it, vi } from 'vitest';

const create = vi.fn();
const insertMany = vi.fn();

vi.mock('../models/LearningTelemetryEvent.js', () => ({
  default: {
    create: (...args) => create(...args),
    insertMany: (...args) => insertMany(...args),
    find: vi.fn(() => ({ lean: vi.fn(async () => []) })),
  },
  LEARNING_EVENT_TYPES: [
    'question_answered',
    'confidence_selected',
    'working_submitted',
  ],
}));

const {
  normalizeConfidence,
  recordLearningEvent,
  recordLearningEvents,
} = await import('../services/telemetry/learningTelemetryService.js');

describe('learning telemetry service', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('normalizes student reflection values into telemetry confidence codes', () => {
    expect(normalizeConfidence('i_know_this')).toBe('I_KNOW_THIS');
    expect(normalizeConfidence('not_sure')).toBe('IM_NOT_SURE');
    expect(normalizeConfidence('i_need_help')).toBe('I_DONT_KNOW');
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
});
