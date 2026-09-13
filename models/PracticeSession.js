import mongoose from 'mongoose';

// A single sitting of practice. Phase 2 (MathPath) populates summary on end.
const practiceSessionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  module: { type: String, default: 'MathPath' },
  // MathPath sub-feature this session belongs to (e.g. 'Fluency Practice',
  // 'Mistake-to-Mastery'). null = core MathPath practice.
  feature: { type: String, default: null },
  mode: {
    type: String,
    enum: ['independent', 'guided', 'fluency', 'diagnostic', 'warmup', 'practice', 'remediation', 'mastery_check', 'story'],
    default: 'independent',
  },
  skillIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'Skill', default: [] },
  // Ordered question list for a FIXED set (e.g. the kiosk practice walk), so a
  // mid-set page refresh can rehydrate the exact same items in the same order.
  questionIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'Question', default: [] },
  // Spelling Practice: the human-readable word-list name the student practised,
  // persisted so per-list analytics (LearningResult.topic) don't collapse to
  // the generic 'spelling' topic. null for non-spelling sessions.
  listTitle: { type: String, default: null },
  // Set when this session was launched from an assignment.
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', default: null },
  status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date, default: null },
  summary: {
    total: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    scorePct: { type: Number, default: 0 },
    avgTimeMs: { type: Number, default: null },
    fluencyScore: { type: Number, default: null },
    fluencyStatus: { type: String, default: '' }
  }
}, { timestamps: true });

practiceSessionSchema.index({ studentId: 1, startedAt: -1 });
practiceSessionSchema.index({ workspaceId: 1, studentId: 1 });

export default mongoose.model('PracticeSession', practiceSessionSchema);
