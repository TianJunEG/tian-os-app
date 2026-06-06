import mongoose from 'mongoose';

export const PAPER_ANALYSIS_UPLOAD_TYPES = [
  'blank_worksheet',
  'completed_unmarked',
  'marked_script',
  'corrections_working',
];

export const PAPER_ANALYSIS_STATUS = [
  'uploaded',
  'processing',
  'needs_review',
  'reviewed',
  'assigned',
  'failed',
];

const detectedQuestionSchema = new mongoose.Schema(
  {
    questionNumber: { type: String, default: '', trim: true },
    questionText: { type: String, default: '' },
    marks: { type: Number, default: null },
    detectedSkillIds: { type: [String], default: [] },
    studentAnswer: { type: String, default: '' },
    teacherMarkedCorrect: { type: Boolean, default: null },
    adultConfirmedCorrect: { type: Boolean, default: false },
    adultConfirmedWrong: { type: Boolean, default: false },
    workingEvidenceUrl: { type: String, default: '' },
    misconceptionTags: { type: [String], default: [] },
    confidence: { type: Number, default: 0, min: 0, max: 1 },
  },
  { _id: false }
);

const recommendedActionSchema = new mongoose.Schema(
  {
    type: { type: String, default: '', trim: true },
    skillId: { type: String, default: '', trim: true },
    reason: { type: String, default: '' },
    status: { type: String, default: 'pending_review', trim: true },
  },
  { _id: false }
);

const paperAnalysisSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, index: true, trim: true },
    uploadedByUserId: { type: String, required: true, index: true, trim: true },
    uploadedByRole: { type: String, required: true, trim: true },
    subjectId: { type: String, default: 'math', index: true, trim: true },
    domainId: { type: String, default: 'fractions', index: true, trim: true },
    uploadType: { type: String, enum: PAPER_ANALYSIS_UPLOAD_TYPES, required: true, index: true },
    sourceType: { type: String, default: 'adult_upload', trim: true },
    originalFilename: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    storageKey: { type: String, default: '' },
    pageCount: { type: Number, default: 1, min: 1 },
    status: { type: String, enum: PAPER_ANALYSIS_STATUS, default: 'needs_review', index: true },
    detectedQuestions: { type: [detectedQuestionSchema], default: [] },
    weakSkillIds: { type: [String], default: [] },
    recommendedActions: { type: [recommendedActionSchema], default: [] },
    linkedDiagnosticSessionId: { type: String, default: '', trim: true },
    linkedPracticeAssignmentIds: { type: [String], default: [] },
    reviewedAt: { type: Date, default: null },
    analysisNotes: { type: String, default: '' },
  },
  { timestamps: true, collection: 'mathpath_paper_analyses' }
);

paperAnalysisSchema.index({ studentId: 1, createdAt: -1 });
paperAnalysisSchema.index({ uploadedByUserId: 1, createdAt: -1 });
paperAnalysisSchema.index({ subjectId: 1, domainId: 1, status: 1 });

export default mongoose.model('PaperAnalysis', paperAnalysisSchema);
