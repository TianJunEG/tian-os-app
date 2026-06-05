import mongoose from 'mongoose';
import {
  PAPER_REVIEW_CONFIDENCE_LEVELS,
  PAPER_REVIEW_EVIDENCE_LEVELS,
  PAPER_UPLOAD_STATUS,
  PAPER_WORKING_DECLARATIONS,
} from './MathPathPaperUpload.js';

const extractedQuestionSchema = new mongoose.Schema(
  {
    questionNumber: { type: String, required: true, trim: true },
    questionText: { type: String, default: '' },
    marks: { type: Number, default: 0, min: 0 },
    pageNumber: { type: Number, default: 0, min: 0 },
    cropUrl: { type: String, default: '' },
    extractionConfidence: { type: Number, default: 0, min: 0, max: 1 },
    needsManualReview: { type: Boolean, default: false },
  },
  { _id: false }
);

const extractedAnswerSchema = new mongoose.Schema(
  {
    questionNumber: { type: String, required: true, trim: true },
    studentAnswer: { type: String, default: '' },
    correctAnswer: { type: String, default: '' },
    marksAwarded: { type: Number, default: null },
    extractionConfidence: { type: Number, default: 0, min: 0, max: 1 },
    needsManualReview: { type: Boolean, default: false },
  },
  { _id: false }
);

const extractedWorkingSchema = new mongoose.Schema(
  {
    questionNumber: { type: String, required: true, trim: true },
    workingAvailable: { type: Boolean, default: false },
    workingImageCropUrl: { type: String, default: '' },
    ocrText: { type: String, default: '' },
    methodAnalysis: { type: mongoose.Schema.Types.Mixed, default: {} },
    missingSteps: { type: [String], default: [] },
    calculationSlips: { type: [String], default: [] },
    modelMethodIssues: { type: [String], default: [] },
    extractionConfidence: { type: Number, default: 0, min: 0, max: 1 },
  },
  { _id: false }
);

const mappedSkillSchema = new mongoose.Schema(
  {
    questionNumber: { type: String, required: true, trim: true },
    domain: { type: String, default: 'fractions' },
    topic: { type: String, default: '' },
    microSkill: { type: String, default: '' },
    confidenceScore: { type: Number, default: 0, min: 0, max: 1 },
    needsManualReview: { type: Boolean, default: false },
  },
  { _id: false }
);

const mappedWordStructureSchema = new mongoose.Schema(
  {
    questionNumber: { type: String, required: true, trim: true },
    wordStructure: { type: String, default: '' },
    wordMicroSkill: { type: String, default: '' },
    modelType: { type: String, default: '' },
    confidenceScore: { type: Number, default: 0, min: 0, max: 1 },
    needsManualReview: { type: Boolean, default: false },
  },
  { _id: false }
);

const detectedMistakeSchema = new mongoose.Schema(
  {
    questionNumber: { type: String, required: true, trim: true },
    studentAnswer: { type: String, default: '' },
    correctAnswer: { type: String, default: '' },
    answerCorrect: { type: Boolean, default: false },
    workingAvailable: { type: Boolean, default: false },
    likelyMistakeType: { type: String, default: '' },
    likelyMisconception: { type: String, default: '' },
    evidence: { type: [String], default: [] },
    needsManualReview: { type: Boolean, default: false },
  },
  { _id: false }
);

const remediationPlanItemSchema = new mongoose.Schema(
  {
    questionNumber: { type: String, default: '' },
    skill: { type: String, default: '' },
    misconception: { type: String, default: '' },
    recommendedAction: { type: String, default: '' },
    recommendedAsset: { type: String, default: '' },
    estimatedMinutes: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const mathPathPaperReviewSessionSchema = new mongoose.Schema(
  {
    reviewId: { type: String, required: true, unique: true, index: true, trim: true },
    paperId: { type: String, required: true, index: true, trim: true },
    studentId: { type: String, required: true, index: true, trim: true },
    status: { type: String, enum: PAPER_UPLOAD_STATUS, default: 'uploaded', index: true },
    evidenceLevel: { type: String, enum: PAPER_REVIEW_EVIDENCE_LEVELS, default: 'LEVEL_1', index: true },
    hasQuestionPaper: { type: Boolean, default: true },
    hasMarkedPaper: { type: Boolean, default: false },
    hasAnswers: { type: Boolean, default: false },
    hasWorking: { type: Boolean, default: false },
    confidenceLevel: { type: String, enum: PAPER_REVIEW_CONFIDENCE_LEVELS, default: 'LOW', index: true },
    workingDeclaration: { type: String, enum: PAPER_WORKING_DECLARATIONS, default: 'unknown' },
    reviewQuality: { type: mongoose.Schema.Types.Mixed, default: {} },
    evidenceLimitations: { type: [String], default: [] },
    workingAnalysisEnabled: { type: Boolean, default: false },
    extractedQuestions: { type: [extractedQuestionSchema], default: [] },
    extractedAnswers: { type: [extractedAnswerSchema], default: [] },
    extractedWorking: { type: [extractedWorkingSchema], default: [] },
    mappedSkills: { type: [mappedSkillSchema], default: [] },
    mappedWordStructures: { type: [mappedWordStructureSchema], default: [] },
    detectedMistakes: { type: [detectedMistakeSchema], default: [] },
    remediationPlan: { type: [remediationPlanItemSchema], default: [] },
    parentSummary: { type: mongoose.Schema.Types.Mixed, default: {} },
    tutorSummary: { type: mongoose.Schema.Types.Mixed, default: {} },
    extractionErrorMessage: { type: String, default: '' },
    mappingWarningMessage: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now, index: true },
    completedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: false, updatedAt: true }, collection: 'mathpath_paper_review_sessions' }
);

mathPathPaperReviewSessionSchema.index({ studentId: 1, createdAt: -1 });
mathPathPaperReviewSessionSchema.index({ paperId: 1, status: 1 });

export default mongoose.model('MathPathPaperReviewSession', mathPathPaperReviewSessionSchema);
