import mongoose from 'mongoose';

export const INTERVENTION_ACTIONS = [
  'assign_recovery_pack',
  'generate_worksheet',
  'run_recheck',
  'review_working',
  'tutor_support',
  'continue_practice',
  'advance_skill',
];

export const INTERVENTION_RECOMMENDATION_STATUS = [
  'generated',
  'accepted',
  'rejected',
  'ignored',
  'superseded',
];

const interventionRecommendationSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    subjectId: { type: String, default: 'math', trim: true },
    domainId: { type: String, default: 'fractions', trim: true },
    interventionAction: { type: String, enum: INTERVENTION_ACTIONS, required: true },
    recommendationSource: { type: String, default: 'intervention_intelligence_engine', trim: true },
    priorityScore: { type: Number, default: 0, min: 0, max: 100 },
    confidence: { type: Number, default: 0, min: 0, max: 1 },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    status: { type: String, enum: INTERVENTION_RECOMMENDATION_STATUS, default: 'generated' },
    isReady: { type: Boolean, default: false },
    recommendationPayload: { type: mongoose.Schema.Types.Mixed, default: {} },
    supportingEvidence: { type: mongoose.Schema.Types.Mixed, default: {} },
    reasons: { type: [String], default: [] },
    targetSkillIds: { type: [String], default: [] },
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'MathPathAssignment', default: null },
    paperAnalysisId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaperAnalysis', default: null },
    generatedBySystem: { type: Boolean, default: true },
    acceptedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    outcome: {
      recordedAt: { type: Date, default: null },
      outcomeType: { type: String, enum: ['unknown', 'improved', 'stable', 'declined', 'neutral'], default: 'unknown' },
      metricDelta: { type: Number, default: null },
      notes: { type: String, default: '' },
      supportingEvidence: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

interventionRecommendationSchema.index({ studentId: 1, createdAt: -1 });
interventionRecommendationSchema.index({ studentId: 1, interventionAction: 1, status: 1 });
interventionRecommendationSchema.index({ subjectId: 1, domainId: 1, status: 1 });
interventionRecommendationSchema.index({ interventionAction: 1, status: 1 });

export default mongoose.model('InterventionRecommendation', interventionRecommendationSchema);
