import mongoose from 'mongoose';

const TYPES = ['baseline', 'progress', 'mastery', 'curriculum', 'mockPaper'];
const STATUS = ['notStarted', 'inProgress', 'submitted', 'marked', 'reviewed'];

const mathPathAssessmentSessionSchema = new mongoose.Schema(
  {
    assessmentSessionId: { type: String, required: true, trim: true },
    studentId: { type: String, required: true, trim: true },
    domainId: { type: String, required: true, trim: true },
    assessmentType: { type: String, enum: TYPES, required: true },
    mode: { type: String, default: '' },
    singaporeLevel: { type: String, default: '' },
    paperType: { type: String, default: '' },
    targetSkillIds: { type: [String], default: [] },
    targetQuestionFamilyIds: { type: [String], default: [] },
    totalMarks: { type: Number, default: 0 },
    timeLimitMinutes: { type: Number, default: 0 },
    calculatorAllowed: { type: Boolean, default: false },
    workingRequired: { type: Boolean, default: true },
    status: { type: String, enum: STATUS, default: 'notStarted' },
    result: { type: mongoose.Schema.Types.Mixed, default: {} },
    startedAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    markedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'mathpath_assessment_sessions' }
);

mathPathAssessmentSessionSchema.index({ studentId: 1, domainId: 1 });
mathPathAssessmentSessionSchema.index({ assessmentSessionId: 1 }, { unique: true });
mathPathAssessmentSessionSchema.index({ assessmentType: 1 });
mathPathAssessmentSessionSchema.index({ status: 1 });
mathPathAssessmentSessionSchema.index({ createdAt: -1 });

export default mongoose.model('MathPathAssessmentSession', mathPathAssessmentSessionSchema);

