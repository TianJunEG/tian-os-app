import mongoose from 'mongoose';
import { COGNITIVE_LEVELS, DIAGRAM_TYPES } from './AssessmentBlueprint.js';

export const UPLOADED_ASSESSMENT_STATUS = ['uploaded', 'processing', 'completed', 'deleted', 'failed'];
export const UPLOADED_ASSESSMENT_OWNER_TYPES = ['parent', 'tutor', 'teacher', 'admin'];
export const QUESTION_STYLES = [
  'mcq',
  'short_answer',
  'open_ended',
  'word_problem',
  'multi_step',
  'diagram',
  'graph',
  'table',
  'mixed',
  'school-style',
];
export const QUESTION_DIFFICULTIES = ['easy', 'medium', 'hard', 'mixed'];

const logEntrySchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    stage: { type: String, default: '' },
    message: { type: String, default: '' },
    details: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const questionMetadataSchema = new mongoose.Schema(
  {
    topic: { type: String, default: '' },
    skill: { type: String, default: '' },
    marks: { type: Number, default: 0, min: 0 },
    difficulty: { type: String, enum: QUESTION_DIFFICULTIES, default: 'mixed' },
    questionStyle: { type: String, enum: QUESTION_STYLES, default: 'mixed' },
    diagramType: { type: String, enum: [...DIAGRAM_TYPES, 'none'], default: 'none' },
    cognitiveLevel: { type: String, enum: COGNITIVE_LEVELS, default: 'Procedural' },
  },
  { _id: false }
);

const diagramMetadataSchema = new mongoose.Schema(
  {
    diagramType: { type: String, enum: DIAGRAM_TYPES, required: true },
    count: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const uploadedAssessmentSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ownerType: { type: String, enum: UPLOADED_ASSESSMENT_OWNER_TYPES, required: true, index: true },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', default: null, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null, index: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', default: null, index: true },
    fileName: { type: String, required: true, trim: true },
    fileMimeType: { type: String, default: '' },
    fileSizeBytes: { type: Number, default: 0, min: 0 },
    uploadDate: { type: Date, default: Date.now, index: true },
    status: { type: String, enum: UPLOADED_ASSESSMENT_STATUS, default: 'uploaded', index: true },
    consentAccepted: { type: Boolean, default: false },
    analysisStartedAt: { type: Date, default: null },
    analysisCompletedAt: { type: Date, default: null },
    deleteCompletedAt: { type: Date, default: null },
    deletionVerified: { type: Boolean, default: false },
    processingLogs: { type: [logEntrySchema], default: [] },
    extractedAssessmentType: { type: String, default: '' },
    extractedDurationMinutes: { type: Number, default: 0, min: 0 },
    extractedCalculatorAllowed: { type: Boolean, default: false },
    extractedTotalMarks: { type: Number, default: 0, min: 0 },
    extractedSectionCount: { type: Number, default: 0, min: 0 },
    extractedQuestionCount: { type: Number, default: 0, min: 0 },
    extractedTopicDistribution: { type: [mongoose.Schema.Types.Mixed], default: [] },
    extractedDifficultyProfile: { type: mongoose.Schema.Types.Mixed, default: {} },
    extractedQuestionStyles: { type: [mongoose.Schema.Types.Mixed], default: [] },
    questionMetadata: { type: [questionMetadataSchema], default: [] },
    diagramMetadata: { type: [diagramMetadataSchema], default: [] },
    blueprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'AssessmentBlueprint', default: null, index: true },
    errorMessage: { type: String, default: '' },
  },
  { timestamps: true, collection: 'mathpath_uploaded_assessments' }
);

uploadedAssessmentSchema.index({ ownerId: 1, uploadDate: -1 });
uploadedAssessmentSchema.index({ ownerType: 1, status: 1, uploadDate: -1 });
uploadedAssessmentSchema.index({ workspaceId: 1, status: 1, uploadDate: -1 });
uploadedAssessmentSchema.index({ deleteCompletedAt: 1 });

export default mongoose.model('UploadedAssessment', uploadedAssessmentSchema);
