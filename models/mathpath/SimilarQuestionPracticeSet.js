import mongoose from 'mongoose';

const generatedPracticeQuestionSchema = new mongoose.Schema(
  {
    variantId: { type: String, required: true, trim: true },
    prompt: { type: String, required: true },
    answer: { type: String, required: true, trim: true },
    acceptedAnswers: { type: [String], default: [] },
    workedSolution: { type: String, default: '' },
    solutionSteps: { type: [String], default: [] },
    skillId: { type: String, default: '', trim: true },
    questionFamilyId: { type: String, default: '', trim: true },
    questionCategory: { type: String, default: 'practice', trim: true },
    difficulty: { type: String, default: 'medium', trim: true },
    misconceptionTags: { type: [String], default: [] },
    remediationSkillIds: { type: [String], default: [] },
    worksheetCompatible: { type: Boolean, default: true },
    compatibleSessionTypes: { type: [String], default: [] },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const similarQuestionPracticeSetSchema = new mongoose.Schema(
  {
    practiceSetId: { type: String, required: true, unique: true, trim: true },
    patternId: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    subject: { type: String, default: 'Math', trim: true },
    domain: { type: String, default: 'fractions', trim: true },
    topic: { type: String, default: '', trim: true },
    skillId: { type: String, default: '', trim: true },
    skillName: { type: String, default: '', trim: true },
    level: { type: String, default: '', trim: true },
    curriculum: { type: String, default: '', trim: true },
    generatedQuestions: { type: [generatedPracticeQuestionSchema], default: [] },
    approved: { type: Boolean, default: false },
    approvedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    studentProgressState: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, collection: 'mathpath_similar_question_practice_sets' }
);

similarQuestionPracticeSetSchema.index({ patternId: 1 });
similarQuestionPracticeSetSchema.index({ domain: 1, skillId: 1 });
similarQuestionPracticeSetSchema.index({ approved: 1 });

export default mongoose.model('SimilarQuestionPracticeSet', similarQuestionPracticeSetSchema);
