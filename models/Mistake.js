import mongoose from 'mongoose';

// Saved when an attempt is incorrect. Powers Mistake-to-Mastery review and
// drives parent/tutor/teacher remediation suggestions.
const mistakeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
  module: { type: String, default: 'MathPath' },
  // Snapshot of the question so the review screen renders without a join even if
  // the question is later edited/removed.
  questionStem: { type: String, default: '' },
  workedSolution: { type: String, default: '' },
  studentAnswer: { type: String, default: '' },
  correctAnswer: { type: String, default: '' },
  mistakeType: {
    type: String,
    enum: ['concept_gap', 'calculation_error', 'careless', 'method_error', 'unknown'],
    default: 'unknown'
  },
  misconceptionTag: { type: String, default: '' },
  // Review status (Mistake-to-Mastery). `reviewed` kept for back-compat.
  reviewed: { type: Boolean, default: false },
  reviewedAt: { type: Date, default: null },
  reviewedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  source: {
    type: String,
    enum: ['diagnostic-incorrect', 'diagnostic-skipped', 'practice-incorrect', 'other'],
    default: 'other',
  },
  reviewSource: {
    type: String,
    enum: ['student', 'parent', 'tutor', 'teacher', null],
    default: null
  },
  // Set to 'resolved' once the underlying skill is mastered (derived, not manual).
  status: {
    type: String,
    enum: ['open', 'reviewed', 'resolved'],
    default: 'open'
  },
  occurredAt: { type: Date, default: Date.now }
});

mistakeSchema.index({ studentId: 1, occurredAt: -1 });
mistakeSchema.index({ studentId: 1, skillId: 1, status: 1 });

export default mongoose.model('Mistake', mistakeSchema);
