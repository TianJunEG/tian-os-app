import mongoose from 'mongoose';

const mathPathSkillSchema = new mongoose.Schema(
  {
    domainId: { type: String, required: true, trim: true },
    skillId: { type: String, required: true, trim: true },
    universalSkillId: { type: String, default: '', trim: true },
    universalDomain: { type: String, default: 'fractions', trim: true },
    universalTitle: { type: String, default: '', trim: true },
    universalDescription: { type: String, default: '' },
    difficultyBand: { type: String, default: '', trim: true },
    questionTypes: { type: [String], default: [] },
    mistakeTypes: { type: [String], default: [] },
    pathwayOrder: { type: Number, min: 1, default: 1 },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    strand: { type: String, default: '' },
    difficulty: { type: Number, min: 1, max: 5, default: 1 },
    singaporeLevel: { type: [String], default: [] },
    introducedLevel: { type: String, default: '', trim: true },
    masteryLevel: { type: String, default: '', trim: true },
    curriculumMappings: {
      type: [{
        skillId: { type: String, default: '', trim: true },
        country: { type: String, default: '', trim: true },
        curriculum: { type: String, default: '', trim: true },
        subject: { type: String, default: '', trim: true },
        phase: { type: String, default: '', trim: true },
        level: { type: String, default: '', trim: true },
        stream: { type: String, default: '' },
        strand: { type: String, default: '', trim: true },
        subStrand: { type: String, default: '', trim: true },
        syllabusTopic: { type: String, default: '', trim: true },
        syllabusOutcome: { type: String, default: '' },
        introducedLevel: { type: String, default: '', trim: true },
        masteryLevel: { type: String, default: '', trim: true },
        levelBand: { type: [String], default: [] },
        sourceDocument: { type: String, default: '' },
        syllabusRef: { type: String, default: '' },
        notes: { type: String, default: '' },
      }],
      default: [],
    },
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
mathPathSkillSchema.index({ domainId: 1, universalSkillId: 1 });
mathPathSkillSchema.index({
  domainId: 1,
  'curriculumMappings.country': 1,
  'curriculumMappings.curriculum': 1,
  'curriculumMappings.levelBand': 1,
});

export default mongoose.model('MathPathSkill', mathPathSkillSchema);
