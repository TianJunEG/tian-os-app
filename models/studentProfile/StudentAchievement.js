import mongoose from 'mongoose';

const studentAchievementSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    code: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'badge' },
    category: { type: String, default: 'learning' },
    unlockedAt: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'student_achievements' }
);

studentAchievementSchema.index({ studentId: 1, code: 1 }, { unique: true });
studentAchievementSchema.index({ studentId: 1, unlockedAt: -1 });

export default mongoose.model('StudentAchievement', studentAchievementSchema);
