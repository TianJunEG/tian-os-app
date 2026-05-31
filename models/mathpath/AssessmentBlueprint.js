import mongoose from 'mongoose';

export const ASSESSMENT_BLUEPRINT_STATUS = ['draft', 'active', 'archived'];
export const BLUEPRINT_QUESTION_TYPES = [
  'mcq',
  'short_answer',
  'open_ended',
  'word_problem',
  'multi_step',
  'diagram',
  'graph',
  'table',
  'mixed',
];
export const COGNITIVE_LEVELS = ['Recall', 'Procedural', 'Application', 'ComplexApplication'];
export const DIAGRAM_TYPES = [
  'number_line',
  'fraction_model',
  'fraction_circle',
  'equal_groups',
  'arrays',
  'picture_collections',
  'place_value_blocks',
  'bar_graph',
  'picture_graph',
  'table',
  'shape_library',
  'shape_composition',
  'dot_grid',
  'clock',
  'length_measurement',
  'comparison_models',
  'angle',
  'cube_stack',
  'pie_chart',
  'line_graph',
];

const MIX_KEYS = ['beginner', 'basic', 'standard', 'advanced', 'challenge', 'easy', 'medium', 'hard'];

const mixSchema = new mongoose.Schema(
  MIX_KEYS.reduce((shape, key) => ({ ...shape, [key]: { type: Number, default: 0, min: 0 } }), {}),
  { _id: false }
);

const cognitiveMixSchema = new mongoose.Schema({
  Recall: { type: Number, default: 0, min: 0 },
  Procedural: { type: Number, default: 0, min: 0 },
  Application: { type: Number, default: 0, min: 0 },
  ComplexApplication: { type: Number, default: 0, min: 0 },
}, { _id: false });

const sectionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  marks: { type: Number, required: true, min: 0 },
  questionCount: { type: Number, required: true, min: 0 },
  questionTypes: { type: [String], enum: BLUEPRINT_QUESTION_TYPES, default: [] },
  difficultyMix: { type: mixSchema, default: () => ({}) },
  cognitiveMix: { type: cognitiveMixSchema, default: () => ({}) },
}, { _id: false });

const topicSchema = new mongoose.Schema({
  topic: { type: String, required: true, trim: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },
  domainId: { type: String, default: 'fractions', trim: true },
  skillIds: { type: [String], default: [] },
  marks: { type: Number, required: true, min: 0 },
  weightage: { type: Number, required: true, min: 0 },
  difficulty: { type: String, enum: ['beginner', 'basic', 'standard', 'advanced', 'challenge', 'mixed'], default: 'mixed' },
  difficultyMix: { type: mixSchema, default: () => ({}) },
  diagramTypes: { type: [String], enum: DIAGRAM_TYPES, default: [] },
}, { _id: false });

const questionMetadataSchema = new mongoose.Schema({
  topic: { type: String, default: '' },
  skill: { type: String, default: '' },
  marks: { type: Number, default: 0 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'mixed'], default: 'mixed' },
  questionStyle: { type: String, default: '' },
  cognitiveLevel: { type: String, enum: COGNITIVE_LEVELS, default: 'Procedural' },
}, { _id: false });

const assessmentBlueprintSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  level: { type: String, required: true, trim: true },
  subject: { type: String, required: true, default: 'Math', trim: true },
  school: { type: String, default: '', trim: true },
  assessmentType: { type: String, default: '', trim: true },
  durationMinutes: { type: Number, required: true, min: 0 },
  totalMarks: { type: Number, required: true, min: 0 },
  calculatorAllowed: { type: Boolean, default: false },
  timed: { type: Boolean, default: true },
  status: { type: String, enum: ASSESSMENT_BLUEPRINT_STATUS, default: 'draft' },
  sections: { type: [sectionSchema], default: [] },
  topics: { type: [topicSchema], default: [] },
  requiredDiagramTypes: { type: [String], enum: DIAGRAM_TYPES, default: [] },
  questionMetadata: { type: [questionMetadataSchema], default: [] },
  sourceType: { type: String, enum: ['manual', 'uploadDerived', 'schoolProfileDerived'], default: 'manual' },
  blueprintVersion: { type: Number, default: 1, min: 1 },
  parentBlueprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'AssessmentBlueprint', default: null },
  versionGroupId: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', default: null },
  archivedAt: { type: Date, default: null },
}, { timestamps: true, collection: 'mathpath_assessment_blueprints' });

assessmentBlueprintSchema.index({ subject: 1, level: 1, school: 1, assessmentType: 1 });
assessmentBlueprintSchema.index({ createdByUserId: 1, createdAt: -1 });
assessmentBlueprintSchema.index({ workspaceId: 1, status: 1, updatedAt: -1 });
assessmentBlueprintSchema.index({ versionGroupId: 1, blueprintVersion: -1 });
assessmentBlueprintSchema.index({ status: 1, updatedAt: -1 });

assessmentBlueprintSchema.pre('save', function syncCreatedBy(next) {
  if (!this.createdBy && this.createdByUserId) this.createdBy = this.createdByUserId;
  if (!this.createdByUserId && this.createdBy) this.createdByUserId = this.createdBy;
  if (!this.versionGroupId) this.versionGroupId = String(this.parentBlueprintId || this._id || '');
  next();
});

export default mongoose.model('AssessmentBlueprint', assessmentBlueprintSchema);
