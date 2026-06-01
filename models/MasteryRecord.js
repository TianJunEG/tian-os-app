import mongoose from 'mongoose';

// One record per student × skill. The single source of truth for mastery that
// every surface (student, parent, tutor, teacher) reads. Score 0–100 maps to a
// status; the mastery engine (Phase 2) updates it after each session.
//   0–39 needs_review · 40–69 learning · 70–100 mastered · (no record = not_started)
const masteryRecordSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  // The unit of mastery. For MathPath this is a Skill; for Spelling Practice it
  // is a spelling word list (the ref is advisory). `module`/`subject` keep the
  // surfaces separate so Math views never show spelling records and vice-versa.
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
  module: { type: String, default: 'MathPath' },
  subject: { type: String, default: 'Math' },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  score: { type: Number, default: 0, min: 0, max: 100 },
  status: {
    type: String,
    enum: ['not_started', 'needs_review', 'learning', 'mastered'],
    default: 'not_started'
  },
  masteryState: {
    type: String,
    enum: ['not_started', 'emerging', 'developing', 'secure', 'mastered', 'retained'],
    default: 'not_started'
  },
  masteryValidation: { type: mongoose.Schema.Types.Mixed, default: null },
  progressionHistory: { type: [mongoose.Schema.Types.Mixed], default: [] },
  retentionSchedule: { type: [mongoose.Schema.Types.Mixed], default: [] },
  attempts: { type: Number, default: 0 },
  // Fluency = speed + accuracy. We keep a rolling window of correct-attempt
  // response times to derive a median and a fluency status against the skill's
  // target (set by the domain spec). Lets the app trigger fluency drills, not
  // just remediation.
  recentTimesMs: { type: [Number], default: [] },
  medianTimeMs: { type: Number, default: null },
  fluencyStatus: { type: String, enum: ['unknown', 'effortful', 'developing', 'automatic'], default: 'unknown' },
  // Consecutive-correct streak (motivation + confidence signal).
  streak: { type: Number, default: 0 },
  bestStreak: { type: Number, default: 0 },
  // Rolling window of recent outcomes → consistency (steadiness) and confidence
  // (how trustworthy the mastery estimate is, given evidence + steadiness).
  recentOutcomes: { type: [Boolean], default: [] },
  consistency: { type: Number, default: 1 },
  confidence: { type: Number, default: 0 },
  lastPracticedAt: { type: Date, default: null }
});

masteryRecordSchema.index({ studentId: 1, skillId: 1 }, { unique: true });

export default mongoose.model('MasteryRecord', masteryRecordSchema);
