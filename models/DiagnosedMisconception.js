import mongoose from 'mongoose';

// A misconception the AI diagnosed from a photo of marked work (the worksheet
// generator's analyze step). One row per diagnosed misconception, logged against
// the student it was found for, so a parent/tutor can see a child's recurring
// conceptual gaps over time — and so they can be aggregated across students into
// a "common mistakes" view.
//
// This is distinct from MathPath's Mistake model (which records a wrong answer to
// a specific bank Question within a workspace). The photo flow identifies a child
// by a linked User (legacy `linkedTo` relationship), has no workspace, and yields
// free-text root-cause misconceptions — so it gets its own lightweight store.
const diagnosedMisconceptionSchema = new mongoose.Schema({
  // The parent/tutor who uploaded the work (always present).
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // The child the work belongs to, if a linked student was selected (else null;
  // studentName still records who it was for).
  studentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  studentName: { type: String, default: '' },
  worksheetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worksheet', default: null },

  subject: { type: String, default: 'Math' },
  topic: { type: String, default: '' },
  // The diagnosed misconception itself.
  title: { type: String, required: true },
  description: { type: String, default: '' },
  evidence: { type: String, default: '' },
  // Skills the worksheet flagged to reinforce (worksheet-level context).
  skills: { type: [String], default: [] },
  // A normalised key for cross-student aggregation (lowercased title; topic-scoped).
  normalizedKey: { type: String, default: '', index: true },

  source: { type: String, default: 'worksheet-photo' },
  status: { type: String, enum: ['open', 'reviewed', 'resolved'], default: 'open' },
  createdAt: { type: Date, default: Date.now }
});

// A parent/tutor reads their own (optionally one child's); a student reads theirs.
diagnosedMisconceptionSchema.index({ ownerUserId: 1, createdAt: -1 });
diagnosedMisconceptionSchema.index({ studentUserId: 1, createdAt: -1 });

export default mongoose.model('DiagnosedMisconception', diagnosedMisconceptionSchema);
