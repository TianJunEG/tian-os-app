import mongoose from 'mongoose';

const SEVERITY = ['low', 'medium', 'high'];

const mathPathMistakeRecordSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, trim: true },
    domainId: { type: String, required: true, trim: true },
    mistakeCode: { type: String, required: true, trim: true },
    mistakeName: { type: String, default: '' },
    skillId: { type: String, default: '' },
    questionFamilyId: { type: String, default: '' },
    frequency: { type: Number, default: 1 },
    severity: { type: String, enum: SEVERITY, default: 'low' },
    evidence: { type: mongoose.Schema.Types.Mixed, default: [] },
    remediationSkillIds: { type: [String], default: [] },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'mathpath_mistake_records' }
);

mathPathMistakeRecordSchema.index({ studentId: 1, domainId: 1 });
mathPathMistakeRecordSchema.index({ studentId: 1, mistakeCode: 1 });
mathPathMistakeRecordSchema.index({ skillId: 1 });
mathPathMistakeRecordSchema.index({ severity: 1 });

export default mongoose.model('MathPathMistakeRecord', mathPathMistakeRecordSchema);

