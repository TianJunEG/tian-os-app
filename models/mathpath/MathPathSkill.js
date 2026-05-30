import mongoose from 'mongoose';

const mathPathSkillSchema = new mongoose.Schema(
  {
    domainId: { type: String, required: true, trim: true },
    skillId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    strand: { type: String, default: '' },
    difficulty: { type: Number, min: 1, max: 5, default: 1 },
    singaporeLevel: { type: [String], default: [] },
    prerequisites: { type: [String], default: [] },
    dependents: { type: [String], default: [] },
    mastery: {
      minimumAccuracy: { type: Number, default: 90 },
      minimumQuestions: { type: Number, default: 20 },
    },
    fluency: {
      targetAccuracy: { type: Number, default: 90 },
      targetAverageSeconds: { type: Number, default: 20 },
    },
    retention: {
      reviewDays: { type: [Number], default: [3, 7, 30, 90] },
    },
    remediationTargets: { type: [String], default: [] },
    questionFamilies: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'mathpath_skills' }
);

mathPathSkillSchema.index({ domainId: 1, skillId: 1 }, { unique: true });
mathPathSkillSchema.index({ domainId: 1 });
mathPathSkillSchema.index({ singaporeLevel: 1 });

export default mongoose.model('MathPathSkill', mathPathSkillSchema);

