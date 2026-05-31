import mongoose from 'mongoose';

const SESSION_TYPES = ['diagnostic', 'warmup', 'practice', 'remediation', 'mastery_check'];

const sourceExampleSchema = new mongoose.Schema(
  {
    prompt: { type: String, required: true, trim: true },
    answer: { type: String, default: '', trim: true },
    workedSolution: { type: String, default: '', trim: true },
    skillId: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const variableRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, default: '', trim: true },
    min: { type: Number, default: null },
    max: { type: Number, default: null },
    step: { type: Number, default: 1 },
    values: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { _id: false }
);

const trainedQuestionPatternSchema = new mongoose.Schema(
  {
    patternId: { type: String, required: true, unique: true, trim: true },
    sourceQuestionIds: { type: [String], default: [] },
    sourceExamples: { type: [sourceExampleSchema], default: [] },
    inferredSkillIds: { type: [String], default: [] },
    domain: { type: String, default: 'fractions', trim: true },
    topic: { type: String, default: '', trim: true },
    subtopic: { type: String, default: '', trim: true },
    archetype: { type: String, required: true, trim: true },
    difficultyBand: { type: String, enum: ['easy', 'medium', 'hard', 'mixed'], default: 'mixed' },
    curriculumTags: { type: [String], default: [] },
    syllabusRefs: { type: [String], default: [] },
    questionTemplate: { type: String, required: true },
    variableRules: { type: [variableRuleSchema], default: [] },
    constraints: { type: [String], default: [] },
    answerType: { type: String, default: 'fraction', trim: true },
    answerCheckStrategy: { type: String, default: 'fraction_equivalence', trim: true },
    workedSolutionTemplate: { type: String, default: '' },
    misconceptionTags: { type: [String], default: [] },
    remediationSkillIds: { type: [String], default: [] },
    compatibleSessionTypes: { type: [String], enum: SESSION_TYPES, default: ['diagnostic', 'practice', 'remediation', 'mastery_check'] },
    worksheetCompatible: { type: Boolean, default: true },
    generatedVariantTarget: {
      total: { type: Number, default: 40 },
      easy: { type: Number, default: 10 },
      medium: { type: Number, default: 10 },
      hard: { type: Number, default: 10 },
      wordProblem: { type: Number, default: 5 },
      misconception: { type: Number, default: 5 },
    },
    qualityWarnings: { type: [String], default: [] },
    generatorVersion: { type: String, default: 'question-pattern-trainer-v1', trim: true },
    status: { type: String, enum: ['draft', 'approved', 'archived'], default: 'draft' },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'mathpath_trained_question_patterns' }
);

trainedQuestionPatternSchema.index({ domain: 1, inferredSkillIds: 1 });
trainedQuestionPatternSchema.index({ domain: 1, archetype: 1 });
trainedQuestionPatternSchema.index({ status: 1 });

export { SESSION_TYPES };

export default mongoose.model('TrainedQuestionPattern', trainedQuestionPatternSchema);
