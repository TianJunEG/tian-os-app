import mongoose from 'mongoose';

const studentXPSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
    totalXP: { type: Number, default: 0, min: 0 },
    sourceTotals: { type: mongoose.Schema.Types.Mixed, default: {} },
    lastCalculatedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'student_xp' }
);

studentXPSchema.index({ totalXP: -1 });

export default mongoose.model('StudentXP', studentXPSchema);
