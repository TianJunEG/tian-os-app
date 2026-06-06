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
    targetQuestionCount: { type: Number, default: 12, min: 1 },
    difficultyMix: {
      foundation: { type: Number, default: 0.4, min: 0, max: 1 },
      guided: { type: Number, default: 0.4, min: 0, max: 1 },
      mastery: { type: Number, default: 0.2, min: 0, max: 1 },
    },
    status: { type: String, enum: MATHPATH_ASSIGNMENT_STATUS, default: 'assigned', index: true },
    completion: { type: completionSchema, default: () => ({}) },
    recheck: { type: recheckSchema, default: () => ({}) },
  },
  { timestamps: true, collection: 'mathpath_assignments' }
);

mathPathAssignmentSchema.index({ studentId: 1, status: 1 });
mathPathAssignmentSchema.index({ sourceType: 1, sourceId: 1 });
mathPathAssignmentSchema.index({ studentId: 1, sourceType: 1, sourceId: 1 });

export default mongoose.model('MathPathAssignment', mathPathAssignmentSchema);
