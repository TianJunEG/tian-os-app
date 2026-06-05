import mongoose from 'mongoose';

const MODES = ['basic', 'core', 'full'];
const STATUS = ['notStarted', 'inProgress', 'completed'];

const mathPathDiagnosticSessionSchema = new mongoose.Schema(
  {
    diagnosticSessionId: { type: String, required: true, trim: true },
    studentId: { type: String, required: true, trim: true },
    subjectId: { type: String, default: 'math', trim: true },
    domainId: { type: String, required: true, trim: true },
    domainVersion: { type: String, default: '', trim: true },
    mode: { type: String, enum: MODES, default: 'core' },
    studentLevel: { type: String, default: '' },
    targetSkillIds: { type: [String], default: [] },
    targetQuestionFamilyIds: { type: [String], default: [] },
    status: { type: String, enum: STATUS, default: 'notStarted' },
    currentSkillId: { type: String, default: '', trim: true },
    currentQuestionId: { type: String, default: '', trim: true },
    currentDecision: { type: mongoose.Schema.Types.Mixed, default: null },
    decisionHistory: { type: [mongoose.Schema.Types.Mixed], default: [] },
    assignedPracticeSkillIds: { type: [String], default: [] },
    readinessScore: { type: Number, default: 0 },
    completionReason: { type: String, default: '', trim: true },
    lifecycleLog: { type: mongoose.Schema.Types.Mixed, default: {} },
    metadataGaps: { type: [String], default: [] },
    adaptiveState: { type: mongoose.Schema.Types.Mixed, default: {} },
    result: { type: mongoose.Schema.Types.Mixed, default: {} },
    resultPayload: { type: mongoose.Schema.Types.Mixed, default: {} },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'mathpath_diagnostic_sessions' }
);

mathPathDiagnosticSessionSchema.index({ studentId: 1, domainId: 1 });
mathPathDiagnosticSessionSchema.index({ diagnosticSessionId: 1 }, { unique: true });
mathPathDiagnosticSessionSchema.index({ status: 1 });

export default mongoose.model('MathPathDiagnosticSession', mathPathDiagnosticSessionSchema);
