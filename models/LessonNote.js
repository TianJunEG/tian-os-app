import mongoose from 'mongoose';

// Tutor's record of a lesson. Scoped to the tutor workspace + student. The
// parentSummary is saved but only *sent* once messaging exists (MVP: stored,
// surfaced in the tutor's view of the student).
const lessonNoteSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  tutorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subjectId: { type: String, default: 'math', trim: true },
  domainId: { type: String, default: 'fractions', trim: true },
  lessonDate: { type: Date, default: Date.now },
  focusSkillIds: { type: [String], default: [] },
  notes: { type: String, default: '' },
  nextAction: { type: String, default: '' },
  covered: { type: String, default: '' },
  didWell: { type: String, default: '' },
  struggledWith: { type: String, default: '' },
  misconceptions: { type: String, default: '' },
  homeworkAssigned: { type: String, default: '' },
  nextRecommendation: { type: String, default: '' },
  parentSummary: { type: String, default: '' },
  parentUpdateStatus: { type: String, enum: ['draft', 'sent'], default: 'draft' },
  createdAt: { type: Date, default: Date.now }
});

lessonNoteSchema.index({ studentId: 1, createdAt: -1 });
lessonNoteSchema.index({ tutorUserId: 1, workspaceId: 1, createdAt: -1 });

export default mongoose.model('LessonNote', lessonNoteSchema);
