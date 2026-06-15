import mongoose from 'mongoose';

export const LEARNING_PATH_STATUS = ['draft', 'active', 'archived'];

export const LEARNING_PATH_STAGE_TYPES = [
  'concept_introduction',
  'visual_understanding',
  'worked_example',
  'guided_practice',
  'independent_practice',
  'mastery_check',
  'recheck_ready',
];

const learningPathStageSchema = new mongoose.Schema(
  {
    stageId: { type: String, required: true, trim: true },
    stageType: { type: String, enum: LEARNING_PATH_STAGE_TYPES, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    order: { type: Number, required: true, min: 1 },
    required: { type: Boolean, default: true },
    criteria: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  },
  { _id: false }
);

const masteryCriteriaSchema = new mongoose.Schema(
  {
    minAccuracy: { type: Number, default: 75, min: 0, max: 100 },
    minStageCompletion: { type: Number, default: 1, min: 0, max: 1 },
    requiresMisconceptionResolved: { type: Boolean, default: true },
    requiresConfidenceImproved: { type: Boolean, default: false },
    requiresMasteryCheck: { type: Boolean, default: true },
  },
  { _id: false }
);

const learningPathSchema = new mongoose.Schema(
  {
    learningPathId: { type: String, required: true, unique: true, index: true, trim: true },
    subjectId: { type: String, default: 'math', index: true, trim: true },
    domainId: { type: String, default: 'fractions', index: true, trim: true },
    skillId: { type: String, required: true, index: true, trim: true },
    misconceptionId: { type: String, default: '', index: true, trim: true },
    title: { type: String, required: true, trim: true },
    stages: {
      type: [learningPathStageSchema],
      default: () => [],
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: 'At least one learning path stage is required.',
      },
    },
    masteryCriteria: { type: masteryCriteriaSchema, default: () => ({}) },
    status: { type: String, enum: LEARNING_PATH_STATUS, default: 'active', index: true },
  },
  { timestamps: true, collection: 'mathpath_learning_paths' }
);

learningPathSchema.index({ subjectId: 1, domainId: 1, skillId: 1, misconceptionId: 1 });

export default mongoose.model('LearningPath', learningPathSchema);
