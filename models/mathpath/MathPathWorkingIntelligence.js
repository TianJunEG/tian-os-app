import mongoose from 'mongoose';

const REVIEW_STATUSES = ['pending', 'reviewed', 'corrected', 'verified', 'rejected', 'unreadable'];
const ANALYSIS_STATUSES = ['queued', 'processing', 'ocr_complete', 'needs_human_review', 'failed', 'ready_for_ai'];
const HUMAN_REVIEW_STATUSES = ['pending', 'reviewed', 'corrected', 'verified', 'rejected', 'unreadable'];

const confidenceSchema = new mongoose.Schema(
  {
    score: { type: Number, default: 0 },
    source: { type: String, default: 'heuristic' },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const extractedElementSchema = new mongoose.Schema(
  {
    value: { type: String, default: '' },
    normalized: { type: String, default: '' },
    type: { type: String, default: '' },
    confidence: { type: confidenceSchema, default: () => ({}) },
    boundingBox: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const workingStepSchema = new mongoose.Schema(
  {
    stepNumber: { type: Number, required: true },
    text: { type: String, default: '' },
    strokeIds: { type: [String], default: [] },
    extractedExpressions: { type: [extractedElementSchema], default: [] },
    confidence: { type: confidenceSchema, default: () => ({}) },
  },
  { _id: false }
);

const reviewCorrectionSchema = new mongoose.Schema(
  {
    reviewerUserId: { type: String, default: '' },
    reviewerRole: { type: String, default: '' },
    correctedOcrText: { type: String, default: '' },
    correctedSteps: { type: [workingStepSchema], default: [] },
    flags: { type: [String], default: [] },
    notes: { type: String, default: '' },
    reviewedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const workingTimelineEventSchema = new mongoose.Schema(
  {
    eventType: { type: String, default: 'stroke' },
    timestamp: { type: Date, default: null },
    strokeId: { type: String, default: '' },
    pageNumber: { type: Number, default: null },
    action: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const mathPathWorkingIntelligenceSchema = new mongoose.Schema(
  {
    workingId: { type: String, required: true, trim: true },
    workingSessionId: { type: String, required: true, trim: true },
    studentId: { type: String, required: true, trim: true },
    questionId: { type: String, default: '', trim: true },
    skillId: { type: String, default: '', trim: true },
    practiceSessionId: { type: String, default: null },
    assessmentSessionId: { type: String, default: null },
    workingCode: { type: String, default: '', trim: true },
    uploadType: { type: String, enum: ['paper', 'stylus', 'hybrid', 'unknown'], default: 'unknown' },
    rawImage: { type: String, default: '' },
    rawImages: { type: [String], default: [] },
    rawArchive: {
      fileUrls: { type: [String], default: [] },
      fileMetadata: { type: [mongoose.Schema.Types.Mixed], default: [] },
      canvasImage: { type: String, default: '' },
      strokeData: { type: Array, default: [] },
      digitalInkData: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    ocrOutput: {
      rawText: { type: String, default: '' },
      numbers: { type: [extractedElementSchema], default: [] },
      fractions: { type: [extractedElementSchema], default: [] },
      equations: { type: [extractedElementSchema], default: [] },
      symbols: { type: [extractedElementSchema], default: [] },
      units: { type: [extractedElementSchema], default: [] },
      labels: { type: [extractedElementSchema], default: [] },
      confidence: { type: confidenceSchema, default: () => ({}) },
    },
    detectedSteps: { type: [workingStepSchema], default: [] },
    timeline: { type: [workingTimelineEventSchema], default: [] },
    reviewStatus: { type: String, enum: REVIEW_STATUSES, default: 'pending' },
    analysisStatus: { type: String, enum: ANALYSIS_STATUSES, default: 'queued' },
    humanReviewStatus: { type: String, enum: HUMAN_REVIEW_STATUSES, default: 'pending' },
    reviewerUserId: { type: String, default: '' },
    reviewerRole: { type: String, default: '' },
    reviewCorrections: { type: [reviewCorrectionSchema], default: [] },
    datasetRecord: { type: mongoose.Schema.Types.Mixed, default: {} },
    qualityMetrics: {
      ocrSuccess: { type: Boolean, default: false },
      fractionExtractionSuccess: { type: Boolean, default: false },
      stepSegmentationSuccess: { type: Boolean, default: false },
      unreadable: { type: Boolean, default: false },
    },
    processing: {
      attempts: { type: Number, default: 0 },
      lastAttemptAt: { type: Date, default: null },
      nextRetryAt: { type: Date, default: null },
      error: { type: String, default: '' },
      cachedAt: { type: Date, default: null },
    },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'mathpath_working_intelligence' }
);

mathPathWorkingIntelligenceSchema.index({ workingId: 1 }, { unique: true });
mathPathWorkingIntelligenceSchema.index({ workingSessionId: 1, questionId: 1 });
mathPathWorkingIntelligenceSchema.index({ studentId: 1, skillId: 1 });
mathPathWorkingIntelligenceSchema.index({ reviewStatus: 1, analysisStatus: 1 });
mathPathWorkingIntelligenceSchema.index({ humanReviewStatus: 1 });

export default mongoose.model('MathPathWorkingIntelligence', mathPathWorkingIntelligenceSchema);

