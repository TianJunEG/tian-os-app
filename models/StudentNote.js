// Personal study notes — one short note per concept "heading" per student.
// Keyed by heading (legacy Science Lab convention) so a single note follows
// the concept across every question variant that shares it. Multi-subject
// ready via `subjectKey`, even though the current UI is Science-only.
import mongoose from 'mongoose';

const studentNoteSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  subjectKey: { type: String, required: true, default: 'science' },
  topicName: { type: String, default: '' },
  heading: { type: String, required: true },
  text: { type: String, default: '', maxlength: 4000 },
}, { timestamps: true });

studentNoteSchema.index({ studentId: 1, subjectKey: 1, heading: 1 }, { unique: true });
studentNoteSchema.index({ studentId: 1, subjectKey: 1, updatedAt: -1 });

export default mongoose.model('StudentNote', studentNoteSchema);
