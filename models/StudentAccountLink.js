import mongoose from 'mongoose';

// Governs a CONSENTED cross-context link between an existing student account and
// a tutor. Identity is shared (one Student); visibility is per-context and
// bounded by sharedScopes. The operational object the tutor routes check remains
// TutorStudentLink; this record authorises creating it against a pre-existing
// student and records guardian consent. See TUTOR_DASHBOARD_ARCHITECTURE.md §5.
//
// Primary-math phase: consent is ALWAYS by a guardian (no student self-consent);
// the tutor's default scope is the student's math progress + mastery (NOT the
// school teacher's notes).
export const LINK_CONTEXTS = ['school', 'tutor', 'parent'];
export const LINK_STATUSES = ['requested', 'consent_pending', 'active', 'revoked', 'expired'];
export const DEFAULT_SHARED_SCOPES = ['progress:math:read', 'mastery:math:read'];

const studentAccountLinkSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    studentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    fromContext: { type: String, enum: LINK_CONTEXTS, default: 'school' },
    toContext: { type: String, enum: LINK_CONTEXTS, default: 'tutor' },
    tutorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    organisationId: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerOrganisation', default: null },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', default: null }, // tutor workspace gaining access
    status: { type: String, enum: LINK_STATUSES, default: 'consent_pending', index: true },
    sharedScopes: { type: [String], default: DEFAULT_SHARED_SCOPES },
    requestedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    consentByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    consentAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'student_account_links' }
);

// One pending/active tutor link per (tutor, student, workspace).
studentAccountLinkSchema.index({ tutorUserId: 1, studentId: 1, workspaceId: 1 });

export default mongoose.model('StudentAccountLink', studentAccountLinkSchema);
