import mongoose from 'mongoose';

const stepResultSchema = new mongoose.Schema({
  stepId: { type: String, required: true },
  response: mongoose.Schema.Types.Mixed,
  correct: { type: Boolean, default: false },
  partial: { type: Boolean, default: false },
  score: { type: Number, default: 0, min: 0, max: 1 },
  misconceptionTag: { type: String, default: '' },
  feedback: { type: String, default: '' },
  hintUsed: { type: Boolean, default: false },
  hintsUsed: { type: Number, default: 0 },
  retried: { type: Boolean, default: false },
  timeSpentMs: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now },
}, { _id: false });

const pslAttemptSchema = new mongoose.Schema({
  attemptId: { type: String, unique: true, required: true },
  sessionId: { type: String, required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  skillId: { type: String, required: true },
  problemId: { type: String, required: true },
  steps: [stepResultSchema],
  overallCorrect: { type: Boolean, default: false },
  overallScore: { type: Number, default: 0, min: 0, max: 1 },
  totalTimeMs: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('PSLAttempt', pslAttemptSchema, 'psl_attempts');
