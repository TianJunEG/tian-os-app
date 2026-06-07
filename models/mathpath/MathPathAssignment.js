import mongoose from 'mongoose';

export const MATHPATH_ASSIGNMENT_SOURCES = [
  'diagnostic',
  'paper_analysis',
  'tutor',
  'teacher',
  'parent',
  'system',
];

export const MATHPATH_ASSIGNMENT_STATUS = [
  'assigned',
  'in_progress',
  'completed',
  'cancelled',
];

const completionSchema = new mongoose.Schema(
  {
    questionsAssigned: { type: Number, default: 0, min: 0 },
    questionsAttempted: { type: Number, default: 0, min: 0 },
    correctCount: { type: Number, default: 0, min: 0 },
    accuracy: { type: Number, default: 0, min: 0, max: 100 },
    completedAt: { type: Date, default: null },
  },
  { _id: false }
);

const recheckSchema = new mongoose.Schema(
  {
    recommended: { type: Boolean, default: false },
    recommendedAt: { type: Date, default: null },
    diagnosticSessionId: { type: String, default: '', trim: true },
    reason: { type: String, default: '' },
  },
  { _id: false }
);

const stageHistorySchema = new mongoose.Schema(
  {
    stageId: { type: String, required: true, trim: true },
    completedAt: { type: Date, default: Date.now },
    evidenceType: { type: String, default: 'practice_progress', trim: true },
  },
  { _id: false }
);

const questionProgressSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true, trim: true },
    answered: { type: Boolean, default: false },
    correct: { type: Boolean, default: false },
    attempts: { type: Number, default: 0, min: 0 },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const masteryCheckProgressSchema = new mongoose.Schema(
  {
    attempted: { type: Number, default: 0, min: 0 },
    correctCount: { type: Number, default: 0, min: 0 },
    passed: { type: Boolean, default: false },
    updatedAt: { type: Date, default: null },
  },
  { _id: false }
);

const mathPathAssignmentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, index: true, trim: true },
    assignedByUserId: { type: String, required: true, index: true, trim: true },
    assignedByRole: { type: String, required: true, trim: true },
    sourceType: { type: String, enum: MATHPATH_ASSIGNMENT_SOURCES, required: true, index: true },
    sourceId: { type: String, required: true, index: true, trim: true },
    subjectId: { type: String, default: 'math', index: true, trim: true },
    domainId: { type: String, default: 'fractions', index: true, trim: true },
    title: { type: String, default: 'Fractions Recovery Pack', trim: true },
    description: { type: String, default: '' },
    skillIds: {
      type: [String],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: 'At least one skillId is required.',
      },
    },
    misconceptionIds: { type: [String], default: [], index: true },
    interventionIds: { type: [String], default: [] },
    evidenceSource: {
      sourceType: { type: String, default: '', trim: true },
      sourceId: { type: String, default: '', trim: true },
      studentExplanation: { type: String, default: '' },
      skillIds: { type: [String], default: [] },
    },
    guidedPracticeFlow: {
      misconceptionIds: { type: [String], default: [] },
      status: { type: String, default: '' },
      steps: { type: [mongoose.Schema.Types.Mixed], default: [] },
    },
    targetQuestionCount: { type: Number, default: 12, min: 1 },
    difficultyMix: {
      foundation: { type: Number, default: 0.4, min: 0, max: 1 },
      guided: { type: Number, default: 0.4, min: 0, max: 1 },
      mastery: { type: Number, default: 0.2, min: 0, max: 1 },
    },
    learningPathId: { type: String, default: '', index: true, trim: true },
    currentStage: { type: String, default: 'concept_introduction', trim: true },
    completedStages: { type: [String], default: [] },
    stageHistory: { type: [stageHistorySchema], default: [] },
    guidedPracticeProgress: { type: [questionProgressSchema], default: [] },
    independentPracticeProgress: { type: [questionProgressSchema], default: [] },
    masteryCheckProgress: { type: masteryCheckProgressSchema, default: () => ({}) },
    status: { type: String, enum: MATHPATH_ASSIGNMENT_STATUS, default: 'assigned', index: true },
    completion: { type: completionSchema, default: () => ({}) },
    recheck: { type: recheckSchema, default: () => ({}) },
  },
  { timestamps: true, collection: 'mathpath_assignments' }
);

mathPathAssignmentSchema.index({ studentId: 1, status: 1 });
mathPathAssignmentSchema.index({ sourceType: 1, sourceId: 1 });
mathPathAssignmentSchema.index({ studentId: 1, sourceType: 1, sourceId: 1 });
mathPathAssignmentSchema.index({ learningPathId: 1, currentStage: 1 });

export default mongoose.model('MathPathAssignment', mathPathAssignmentSchema);
