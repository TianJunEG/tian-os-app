import mongoose from 'mongoose';

const mathPathQuestionFamilySchema = new mongoose.Schema(
  {
    domainId: { type: String, required: true, trim: true },
    skillId: { type: String, required: true, trim: true },
    questionFamilyId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    difficulty: { type: Number, min: 1, max: 5, default: 1 },
    recommendedQuestionCount: { type: Number, default: 20 },
    fluencyBenchmarks: {
      bronze: { type: Number, default: 30 },
      silver: { type: Number, default: 20 },
      gold: { type: Number, default: 12 },
      platinum: { type: Number, default: 8 },
    },
    masteryTargetAccuracy: { type: Number, default: 90 },
    mentalMathEligible: { type: Boolean, default: false },
    workingRequired: { type: Boolean, default: true },
    misconceptionTags: { type: [String], default: [] },
    assessmentRelevant: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'mathpath_question_families' }
);

mathPathQuestionFamilySchema.index({ domainId: 1, questionFamilyId: 1 }, { unique: true });
mathPathQuestionFamilySchema.index({ skillId: 1 });
mathPathQuestionFamilySchema.index({ mentalMathEligible: 1 });
mathPathQuestionFamilySchema.index({ workingRequired: 1 });

export default mongoose.model('MathPathQuestionFamily', mathPathQuestionFamilySchema);

