import mongoose from 'mongoose';

const retentionReviewSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    skillCode: { type: String, default: '', index: true },
    skillName: { type: String, default: '' },
    reviewDate: { type: Date, required: true },
    completed: { type: Boolean, default: false },
    retained: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'retention_risk'],
      default: 'scheduled',
    },
    intervalDays: { type: Number, default: 0 },
    metrics: { type: mongoose.Schema.Types.Mixed, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

retentionReviewSchema.index({ studentId: 1, reviewDate: 1 });
retentionReviewSchema.index({ studentId: 1, skillId: 1, intervalDays: 1 }, { unique: true });

export default mongoose.model('RetentionReview', retentionReviewSchema);
