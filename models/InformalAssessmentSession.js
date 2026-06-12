import mongoose from 'mongoose';

const attemptSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  answer: { type: mongoose.Schema.Types.Mixed, default: null },
  correct: { type: Boolean, default: false },
  timeMs: { type: Number, default: null },
}, { _id: false });

const informalAssessmentSessionSchema = new mongoose.Schema({
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'InformalAssessment', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', default: null },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'submitted', 'expired'],
    default: 'not_started',
  },
  attempts: { type: [attemptSchema], default: [] },
  score: { type: Number, default: null },
  correctCount: { type: Number, default: 0 },
  totalCount: { type: Number, default: 0 },
  startedAt: { type: Date, default: null },
  submittedAt: { type: Date, default: null },
  timeSpentMs: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now },
});

informalAssessmentSessionSchema.index({ assessmentId: 1, studentId: 1 }, { unique: true });
informalAssessmentSessionSchema.index({ studentId: 1, status: 1 });
informalAssessmentSessionSchema.index({ assessmentId: 1, status: 1 });

export default mongoose.model('InformalAssessmentSession', informalAssessmentSessionSchema);
