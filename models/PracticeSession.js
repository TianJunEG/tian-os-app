import mongoose from 'mongoose';

// A single sitting of practice. Phase 2 (MathPath) populates summary on end.
const practiceSessionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  module: { type: String, default: 'MathPath' },
  // MathPath sub-feature this session belongs to (e.g. 'Fluency Practice',
  // 'Mistake-to-Mastery'). null = core MathPath practice.
  feature: { type: String, default: null },
  mode: { type: String, enum: ['independent', 'guided', 'fluency'], default: 'independent' },
  skillIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'Skill', default: [] },
  // Set when this session was launched from an assignment.
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', default: null },
  status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date, default: null },
  summary: {
    total: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    scorePct: { type: Number, default: 0 }
  }
});

export default mongoose.model('PracticeSession', practiceSessionSchema);
