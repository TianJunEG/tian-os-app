import mongoose from 'mongoose';

const fluencyRecordSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    skillCode: { type: String, default: '', index: true },
    skillName: { type: String, default: '' },
    totalQuestions: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    averageTimeSeconds: { type: Number, default: null },
    confidenceAverage: { type: Number, default: 0 },
    workingSubmissionRate: { type: Number, default: 0 },
    fluencyScore: { type: Number, default: 0 },
    fluencyStatus: {
      type: String,
      enum: ['not_fluent', 'developing', 'fluent'],
      default: 'not_fluent',
    },
    history: { type: [mongoose.Schema.Types.Mixed], default: [] },
    becameFluentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

fluencyRecordSchema.index({ studentId: 1, skillId: 1 }, { unique: true });
fluencyRecordSchema.index({ studentId: 1, fluencyStatus: 1 });

export default mongoose.model('FluencyRecord', fluencyRecordSchema);
