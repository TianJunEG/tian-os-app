import mongoose from 'mongoose';

// Fast triage of a physical worksheet stack: the teacher flips through stapled
// papers and taps one status per student. Coarse-but-quick — the weak group then
// flows into deeper analysis/practice. One session = one worksheet set.
export const QUICK_MARK_STATUSES = ['not_done', 'all_correct', 'penmanship', 'one_slip', 'many_mistakes'];

const quickMarkEntrySchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  name: { type: String, required: true }, // snapshot
  status: { type: String, enum: QUICK_MARK_STATUSES, default: 'not_done' },
  note: { type: String, default: '' },
  photoUrl: { type: String, default: '' }, // optional snap of the child's pages
  markedAt: { type: Date, default: null },
}, { _id: false });

const quickMarkSessionSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  teacherUserId: { type: String, required: true },
  title: { type: String, default: '' }, // e.g. "Fractions WS 3"
  status: { type: String, enum: ['open', 'archived'], default: 'open' },
  marks: { type: [quickMarkEntrySchema], default: [] },
}, { timestamps: true, collection: 'quick_mark_sessions' });

quickMarkSessionSchema.index({ classId: 1, createdAt: -1 });
quickMarkSessionSchema.index({ workspaceId: 1, teacherUserId: 1 });

export default mongoose.model('QuickMarkSession', quickMarkSessionSchema);
