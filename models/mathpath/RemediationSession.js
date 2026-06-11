import mongoose from 'mongoose';

export const REMEDIATION_STEPS = [
  'diagnose',
  'simplify',
  'reteach',
  'check_understanding',
  'original_complexity',
  'schedule_review',
];

export const REMEDIATION_SESSION_STATUS = ['active', 'completed', 'abandoned'];

const stepProgressSchema = new mongoose.Schema(
  {
    step: { type: String, enum: REMEDIATION_STEPS, required: true },
    status: { type: String, enum: ['not_started', 'in_progress', 'completed', 'skipped'], default: 'not_started' },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const prerequisiteEntrySchema = new mongoose.Schema(
  {
    skillId: { type: String, required: true, trim: true },
    skillName: { type: String, default: '', trim: true },
    assignmentId: { type: String, default: '', trim: true },
    status: { type: String, enum: ['pending', 'in_progress', 'mastered', 'skipped'], default: 'pending' },
    reason: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const reteachAttemptSchema = new mongoose.Schema(
  {
    attemptNumber: { type: Number, required: true, min: 1 },
    assignmentId: { type: String, required: true, trim: true },
    startedAt: { type: Date, default: Date.now },
    masteryPassed: { type: Boolean, default: false },
    failReason: { type: String, default: '', trim: true },
    prerequisiteRouted: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { _id: false }
);

const retentionEntrySchema = new mongoose.Schema(
  {
    skillId: { type: String, required: true, trim: true },
    retentionReviewId: { type: String, required: true, trim: true },
    intervalDays: { type: Number, required: true },
    scheduledDate: { type: Date, required: true },
  },
  { _id: false }
);

const remediationSessionSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, index: true, trim: true },
    diagnosticSessionId: { type: String, required: true, index: true, trim: true },
    subjectId: { type: String, default: 'math', trim: true },
    domainId: { type: String, default: 'fractions', trim: true },
    targetSkillIds: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one target skill is required.',
      },
    },
    misconceptionIds: { type: [String], default: [] },
    currentStep: { type: String, enum: REMEDIATION_STEPS, default: 'diagnose' },
    stepProgress: { type: [stepProgressSchema], default: [] },
    prerequisites: { type: [prerequisiteEntrySchema], default: [] },
    reteachAttempts: { type: [reteachAttemptSchema], default: [] },
    currentAssignmentId: { type: String, default: '', trim: true },
    retentionEntries: { type: [retentionEntrySchema], default: [] },
    status: { type: String, enum: REMEDIATION_SESSION_STATUS, default: 'active' },
    maxReteachAttempts: { type: Number, default: 3, min: 1 },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'remediation_sessions' }
);

remediationSessionSchema.index({ studentId: 1, status: 1 });
remediationSessionSchema.index({ studentId: 1, diagnosticSessionId: 1 }, { unique: true });
remediationSessionSchema.index({ currentAssignmentId: 1 });

export default mongoose.model('RemediationSession', remediationSessionSchema);
