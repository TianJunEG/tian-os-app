import mongoose from 'mongoose';

const SESSION_TYPES = ['diagnostic', 'practice', 'fluency', 'retention', 'assessment'];

const mathPathAttemptSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, trim: true },
    domainId: { type: String, required: true, trim: true },
    skillId: { type: String, required: true, trim: true },
    questionFamilyId: { type: String, required: true, trim: true },
    questionId: { type: String, required: true, trim: true },
    sessionId: { type: String, required: true, trim: true },
    sessionType: { type: String, enum: SESSION_TYPES, required: true },
    studentAnswer: { type: String, default: '' },
    correctAnswer: { type: String, default: '' },
    correct: { type: Boolean, default: false },
    timeTaken: { type: Number, default: null },
    confidence: { type: String, default: '' },
    attemptNumber: { type: Number, default: 1 },
    workingExpected: { type: Boolean, default: false },
    workingUploaded: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'mathpath_attempts' }
);

mathPathAttemptSchema.index({ studentId: 1, domainId: 1 });
mathPathAttemptSchema.index({ studentId: 1, skillId: 1 });
mathPathAttemptSchema.index({ questionFamilyId: 1 });
mathPathAttemptSchema.index({ sessionId: 1 });
mathPathAttemptSchema.index({ createdAt: -1 });

export default mongoose.model('MathPathAttempt', mathPathAttemptSchema);

