import mongoose from 'mongoose';

const outcomeTrackingSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, trim: true },
    domainId: { type: String, required: true, trim: true, default: 'fractions' },
    baselineDate: { type: Date, default: Date.now },
    latestUpdatedAt: { type: Date, default: Date.now },

    // Mastery metrics
    masteredSkillsStart: { type: Number, default: 0, min: 0 },
    masteredSkillsCurrent: { type: Number, default: 0, min: 0 },

    // Fluency metrics
    fluentSkillsStart: { type: Number, default: 0, min: 0 },
    fluentSkillsCurrent: { type: Number, default: 0, min: 0 },

    // Retention metrics
    retainedSkillsStart: { type: Number, default: 0, min: 0 },
    retainedSkillsCurrent: { type: Number, default: 0, min: 0 },

    // Assessment metrics
    baselineAssessmentScore: { type: Number, default: null },
    latestAssessmentScore: { type: Number, default: null },
    bestAssessmentScore: { type: Number, default: null },

    // Readiness metrics
    baselineReadinessScore: { type: Number, default: null },
    latestReadinessScore: { type: Number, default: null },

    // Activity metrics
    totalPracticeSessions: { type: Number, default: 0, min: 0 },
    totalQuestionsAnswered: { type: Number, default: 0, min: 0 },
    totalWorkingUploads: { type: Number, default: 0, min: 0 },

    // Calculated outcomes
    masteryGain: { type: Number, default: 0 },
    fluencyGain: { type: Number, default: 0 },
    retentionGain: { type: Number, default: 0 },
    assessmentGain: { type: Number, default: null },
    readinessGain: { type: Number, default: null },
  },
  { timestamps: true, collection: 'mathpath_outcome_tracking' }
);

outcomeTrackingSchema.index({ studentId: 1, domainId: 1 }, { unique: true });
outcomeTrackingSchema.index({ domainId: 1, latestUpdatedAt: -1 });
outcomeTrackingSchema.index({ latestUpdatedAt: -1 });

export default mongoose.model('OutcomeTracking', outcomeTrackingSchema);
