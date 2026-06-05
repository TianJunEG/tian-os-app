import mongoose from 'mongoose';

const STATUS = ['notStarted', 'inProgress', 'completed', 'abandoned'];

const mathPathPracticeSessionSchema = new mongoose.Schema(
  {
    practiceSessionId: { type: String, required: true, trim: true },
    studentId: { type: String, required: true, trim: true },
    domainId: { type: String, required: true, trim: true },
    targetSkillId: { type: String, required: true, trim: true },
    targetQuestionFamilyIds: { type: [String], default: [] },
    workingSessionId: { type: String, default: '', trim: true },
    sessionGoal: { type: String, default: '' },
    estimatedQuestionCount: { type: Number, default: 0 },
    workingExpected: { type: Boolean, default: false },
    status: { type: String, enum: STATUS, default: 'notStarted' },
    questions: { type: [mongoose.Schema.Types.Mixed], default: [] },
    responses: { type: [mongoose.Schema.Types.Mixed], default: [] },
    summary: { type: mongoose.Schema.Types.Mixed, default: {} },
    lifecycleLog: { type: mongoose.Schema.Types.Mixed, default: {} },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'mathpath_practice_sessions' }
);

mathPathPracticeSessionSchema.index({ studentId: 1, domainId: 1 });
mathPathPracticeSessionSchema.index({ practiceSessionId: 1 }, { unique: true });
mathPathPracticeSessionSchema.index({ targetSkillId: 1 });
mathPathPracticeSessionSchema.index({ status: 1 });

export default mongoose.model('MathPathPracticeSession', mathPathPracticeSessionSchema);
