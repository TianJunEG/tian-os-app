import mongoose from 'mongoose';

export const PAPER_UPLOAD_TYPES = [
  'school_test',
  'worksheet',
  'topical_test',
  'weighted_assessment',
  'exam_paper',
];

export const PAPER_UPLOAD_STATUS = [
  'uploaded',
  'extracting',
  'needs_review',
  'mapped',
  'analysed',
  'remediation_ready',
  'failed',
];

export const PAPER_REVIEW_EVIDENCE_LEVELS = ['LEVEL_1', 'LEVEL_2', 'LEVEL_3'];
export const PAPER_REVIEW_CONFIDENCE_LEVELS = ['LOW', 'MEDIUM', 'HIGH'];
export const PAPER_WORKING_DECLARATIONS = [
  'working_uploaded',
  'working_exists_unavailable',
  'no_working_used',
  'unknown',
];

const mathPathPaperUploadSchema = new mongoose.Schema(
  {
    paperId: { type: String, required: true, unique: true, index: true, trim: true },
    studentId: { type: String, required: true, index: true, trim: true },
    uploadedBy: { type: String, required: true, index: true, trim: true },
    paperType: { type: String, enum: PAPER_UPLOAD_TYPES, required: true, index: true },
    level: { type: String, enum: ['P4', 'P5', 'P6'], required: true, index: true },
    subject: { type: String, enum: ['math'], default: 'math', index: true },
    topicFocus: { type: [String], default: [] },
    fileUrls: { type: [String], default: [] },
    uploadedAt: { type: Date, default: Date.now, index: true },
    status: { type: String, enum: PAPER_UPLOAD_STATUS, default: 'uploaded', index: true },
    evidenceLevel: { type: String, enum: PAPER_REVIEW_EVIDENCE_LEVELS, default: 'LEVEL_1', index: true },
    hasQuestionPaper: { type: Boolean, default: true },
    hasMarkedPaper: { type: Boolean, default: false },
    hasAnswers: { type: Boolean, default: false },
    hasWorking: { type: Boolean, default: false },
    confidenceLevel: { type: String, enum: PAPER_REVIEW_CONFIDENCE_LEVELS, default: 'LOW', index: true },
    workingDeclaration: { type: String, enum: PAPER_WORKING_DECLARATIONS, default: 'unknown' },
    errorMessage: { type: String, default: '' },
    manualReviewRequired: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'mathpath_paper_uploads' }
);

mathPathPaperUploadSchema.index({ studentId: 1, uploadedAt: -1 });
mathPathPaperUploadSchema.index({ uploadedBy: 1, uploadedAt: -1 });
mathPathPaperUploadSchema.index({ level: 1, subject: 1, paperType: 1 });

export default mongoose.model('MathPathPaperUpload', mathPathPaperUploadSchema);
