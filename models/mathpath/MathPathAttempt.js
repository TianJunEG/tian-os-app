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
    answer: { type: String, default: '' },
    answerCorrect: { type: Boolean, default: false },
    timestamp: { type: Date, default: null },
    studentAnswer: { type: String, default: '' },
    correctAnswer: { type: String, default: '' },
    correct: { type: Boolean, default: false },
    timeTaken: { type: Number, default: null },
    timeSpentSeconds: { type: Number, default: null },
    rawTimeSeconds: { type: Number, default: null },
    effectiveAnswerTimeSeconds: { type: Number, default: null },
    totalQuestionTimeSeconds: { type: Number, default: null },
    reviewTimeSeconds: { type: Number, default: null },
    skillTimingSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    examQuestionType: { type: String, default: '' },
    cognitiveDemandLevel: { type: Number, default: null },
    estimatedMarks: { type: Number, default: null },
    methodScore: { type: Number, default: null },
    finalAnswerScore: { type: Number, default: null },
    workingQualityScore: { type: Number, default: null },
    workingQualityIndicators: { type: mongoose.Schema.Types.Mixed, default: null },
    examTechniqueIndicators: { type: [String], default: [] },
    heuristicTags: { type: [String], default: [] },
    reasoningBreakdown: { type: mongoose.Schema.Types.Mixed, default: null },
    confidence: { type: String, default: '' },
    confidenceLevel: { type: String, default: '' },
    reflection: { type: String, default: '' },
    helpRequested: { type: Boolean, default: false },
    confidenceCalibration: { type: String, default: '' },
    possibleMisconception: { type: Boolean, default: false },
    skipped: { type: Boolean, default: false },
    timedOut: { type: Boolean, default: false },
    questionStartedAt: { type: Date, default: null },
    questionEndedAt: { type: Date, default: null },
    attemptNumber: { type: Number, default: 1 },
    workingExpected: { type: Boolean, default: false },
    workingUploaded: { type: Boolean, default: false },
    workingSubmitted: { type: Boolean, default: false },
    workingSubmittedAt: { type: Date, default: null },
    workingImage: { type: String, default: '' },
    workingStrokes: { type: Array, default: [] },
    workingNotNeeded: { type: Boolean, default: false },
    workingRequirementLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', ''], default: '' },
    fullscreenWorkingImage: { type: String, default: '' },
    fullscreenWorkingStrokes: { type: Array, default: [] },
    fullscreenWorkingSubmitted: { type: Boolean, default: false },
    fullscreenWorkingSubmittedAt: { type: Date, default: null },
    workingEvidence: { type: Array, default: [] },
    workingCode: { type: String, default: '' },
    workingSessionId: { type: String, default: '' },
    workingDecision: { type: String, default: '' },
    workingReason: { type: String, default: '' },
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
