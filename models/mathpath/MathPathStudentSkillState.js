import mongoose from 'mongoose';

const STATUS = ['notStarted', 'learning', 'accurate', 'fluent', 'retained', 'needsReview', 'weak', 'forgotten'];
const FLUENCY = ['notReady', 'bronze', 'silver', 'gold', 'platinum'];
const RETENTION = ['reviewScheduled', 'retained', 'needsReview', 'forgotten'];

const mathPathStudentSkillStateSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, trim: true },
    domainId: { type: String, required: true, trim: true },
    skillId: { type: String, required: true, trim: true },
    status: { type: String, enum: STATUS, default: 'notStarted' },
    accuracy: { type: Number, default: 0 },
    averageTime: { type: Number, default: null },
    medianTime: { type: Number, default: null },
    attemptCount: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    fluencyLevel: { type: String, enum: FLUENCY, default: 'notReady' },
    retentionStatus: { type: String, enum: RETENTION, default: 'reviewScheduled' },
    lastPractisedAt: { type: Date, default: null },
    lastReviewedAt: { type: Date, default: null },
    nextReviewDate: { type: Date, default: null },
    masteredAt: { type: Date, default: null },
    fluentAt: { type: Date, default: null },
    retainedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: false, updatedAt: true }, collection: 'mathpath_student_skill_states' }
);

mathPathStudentSkillStateSchema.index({ studentId: 1, domainId: 1, skillId: 1 }, { unique: true });
mathPathStudentSkillStateSchema.index({ studentId: 1, domainId: 1 });
mathPathStudentSkillStateSchema.index({ nextReviewDate: 1 });
mathPathStudentSkillStateSchema.index({ status: 1 });

export default mongoose.model('MathPathStudentSkillState', mathPathStudentSkillStateSchema);

