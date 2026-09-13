import mongoose from 'mongoose';

// One teacher-initiated, in-class diagnostic session. Students join on a shared
// classroom iPad by scanning a QR / entering a short code, pick their own name,
// and take the EXISTING adaptive diagnostic. Each attempt is a normal
// MathPathDiagnosticSession linked back here via sourceType:'kiosk'/sourceId, so
// results flow into Mistakes review + Recommended Practice for the real student
// with no extra work. The roster snapshot + per-student progress live inline so
// the teacher can watch live and so we can enforce one-attempt-per-name without a
// second collection.
const rosterEntrySchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  name: { type: String, required: true },               // snapshot — the only PII the kiosk exposes
  taken: { type: Boolean, default: false },             // one-attempt guard (diagnostic only; practice allows redo)
  diagnosticSessionId: { type: String, default: '' },   // the MathPathDiagnosticSession code, once begun (diagnostic)
  practiceSessionId: { type: String, default: '' },     // the latest PracticeSession _id, once begun (practice)
  attemptTokenJti: { type: String, default: '' },       // bound token id (for optional revocation)
  status: { type: String, enum: ['not_started', 'in_progress', 'completed', 'abandoned'], default: 'not_started' },
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
}, { _id: false });

const classDiagnosticSessionSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  teacherUserId: { type: String, required: true },
  code: { type: String, required: true, uppercase: true, trim: true }, // short join code (carried in the QR)
  subjectId: { type: String, default: 'math' },
  domainId: { type: String, required: true },
  // 'diagnostic' = adaptive assessment (default, unchanged); 'practice' = a fixed
  // set of questions on one skill. Additive with a safe default so existing
  // sessions read back as diagnostics.
  type: { type: String, enum: ['diagnostic', 'practice'], default: 'diagnostic' },
  // Only set when type==='practice': the single skill + how many questions to serve.
  practiceConfig: {
    skillId: { type: String, default: '' },
    skillName: { type: String, default: '' },
    questionCount: { type: Number, default: 10 },
  },
  mode: { type: String, enum: ['basic', 'core', 'full'], default: 'core' },
  studentLevel: { type: String, default: '' },
  status: { type: String, enum: ['open', 'closed', 'expired'], default: 'open' },
  roster: { type: [rosterEntrySchema], default: [] },
  expiresAt: { type: Date, required: true }, // hard cutoff for the unauthenticated kiosk endpoints
}, { timestamps: true, collection: 'class_diagnostic_sessions' });

classDiagnosticSessionSchema.index({ code: 1 }, { unique: true });
classDiagnosticSessionSchema.index({ classId: 1, status: 1 });
classDiagnosticSessionSchema.index({ workspaceId: 1, teacherUserId: 1 });

export default mongoose.model('ClassDiagnosticSession', classDiagnosticSessionSchema);
