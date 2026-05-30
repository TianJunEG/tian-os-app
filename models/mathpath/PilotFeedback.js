import mongoose from 'mongoose';

const FEEDBACK_TYPES = ['student', 'parent', 'tutor', 'teacher', 'founder', 'bug'];
const SEVERITY_LEVELS = ['critical', 'high', 'medium', 'low'];
const FEEDBACK_STATUS = ['open', 'reviewed', 'resolved'];

const bugReportSchema = new mongoose.Schema(
  {
    category: { type: String, default: '' },
    severity: { type: String, enum: SEVERITY_LEVELS, default: 'medium' },
    description: { type: String, default: '' },
    screenshotUrl: { type: String, default: '' },
    reportedBy: { type: String, default: '' },
    fixed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const pilotFeedbackSchema = new mongoose.Schema(
  {
    pilotId: { type: String, default: 'fractions-pilot-v1' },
    domainId: { type: String, required: true, default: 'fractions' },
    feedbackType: { type: String, enum: FEEDBACK_TYPES, required: true },

    // Who submitted this feedback/bug.
    respondentId: { type: String, default: '' },
    respondentRole: { type: String, default: '' },

    // Optional scoping for per-student/per-class context.
    studentId: { type: String, default: '' },
    classId: { type: String, default: '' },

    // 1-5 scale responses (flexible map to support role-specific questions).
    ratings: { type: Map, of: Number, default: {} },
    overallRating: { type: Number, min: 1, max: 5, default: null },

    // Open text responses keyed by question id.
    responses: { type: Map, of: String, default: {} },
    notes: { type: String, default: '' },

    // Optional bug payload (used when feedbackType === 'bug').
    bugReport: { type: bugReportSchema, default: undefined },

    status: { type: String, enum: FEEDBACK_STATUS, default: 'open' },
  },
  { timestamps: true, collection: 'mathpath_pilot_feedback' }
);

pilotFeedbackSchema.index({ pilotId: 1, domainId: 1, feedbackType: 1 });
pilotFeedbackSchema.index({ studentId: 1, createdAt: -1 });
pilotFeedbackSchema.index({ classId: 1, createdAt: -1 });
pilotFeedbackSchema.index({ status: 1, createdAt: -1 });
pilotFeedbackSchema.index({ 'bugReport.severity': 1, createdAt: -1 });

export default mongoose.model('PilotFeedback', pilotFeedbackSchema);

