import mongoose from 'mongoose';

export const LEARNING_EVENT_TYPES = [
  'session_started',
  'session_completed',
  'session_abandoned',
  'question_viewed',
  'question_answered',
  'question_skipped',
  'confidence_selected',
  'working_opened',
  'working_saved',
  'working_deleted',
  'working_submitted',
  'working_not_needed_declared',
  'practice_started',
  'practice_completed',
  'practice_abandoned',
  'diagnostic_started',
  'diagnostic_completed',
  'fluency_started',
  'fluency_completed',
  'skill_mastered',
  'mastery_test_started',
  'mastery_test_completed',
];

const learningTelemetryEventSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, trim: true, index: true },
    eventType: { type: String, required: true, trim: true, index: true },
    domain: { type: String, default: '', trim: true, index: true },
    subjectId: { type: String, default: '', trim: true },
    skillCode: { type: String, default: '', trim: true, index: true },
    questionId: { type: String, default: '', trim: true, index: true },
    sessionId: { type: String, default: '', trim: true, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'learning_telemetry_events' }
);

learningTelemetryEventSchema.index({ studentId: 1, timestamp: -1 });
learningTelemetryEventSchema.index({ domain: 1, skillCode: 1, eventType: 1 });
learningTelemetryEventSchema.index({ sessionId: 1, eventType: 1 });

export default mongoose.model('LearningTelemetryEvent', learningTelemetryEventSchema);
