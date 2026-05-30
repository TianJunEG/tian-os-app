import mongoose from 'mongoose';

const QUESTION_CATEGORIES = [
  'diagnostic',
  'practice',
  'fluency',
  'assessment',
  'remediation',
  'challenge',
];

const generatedQuestionSchema = new mongoose.Schema(
  {
    domainId: { type: String, required: true, trim: true, default: 'fractions' },
    skillId: { type: String, required: true, trim: true },
    skillName: { type: String, default: '', trim: true },
    questionFamilyId: { type: String, required: true, trim: true },
    questionFamilyName: { type: String, default: '', trim: true },
    questionCategory: { type: String, enum: QUESTION_CATEGORIES, required: true },
    templateId: { type: String, required: true, trim: true },
    templateVersion: { type: String, default: 'v1', trim: true },
    generatorVersion: { type: String, default: 'fractions-content-generator-v1', trim: true },

    prompt: { type: String, required: true },
    answer: { type: mongoose.Schema.Types.Mixed, required: true },
    acceptedAnswers: { type: [String], default: [] },
    solutionSteps: { type: [String], default: [] },
    finalAnswer: { type: String, default: '' },
    explanation: { type: String, default: '' },
    misconceptionTags: { type: [String], default: [] },

    workingRequired: { type: Boolean, default: false },
    mentalMathEligible: { type: Boolean, default: false },
    difficultyLevel: { type: Number, min: 1, max: 5, default: 3 },
    estimatedSeconds: { type: Number, default: 20 },
    marks: { type: Number, default: 1 },

    fingerprint: { type: String, required: true, trim: true },
    sourceQuestionId: { type: String, default: '', trim: true },
    isActive: { type: Boolean, default: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'mathpath_generated_questions' }
);

generatedQuestionSchema.index({ domainId: 1, skillId: 1, questionCategory: 1 });
generatedQuestionSchema.index({ domainId: 1, questionFamilyId: 1, questionCategory: 1 });
generatedQuestionSchema.index({ domainId: 1, questionCategory: 1, difficultyLevel: 1 });
generatedQuestionSchema.index({ domainId: 1, fingerprint: 1 }, { unique: true });

export { QUESTION_CATEGORIES };

export default mongoose.model('GeneratedQuestion', generatedQuestionSchema);
