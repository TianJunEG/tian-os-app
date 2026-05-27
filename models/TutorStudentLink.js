import mongoose from 'mongoose';

// Assigns a student to a tutor within the tutor's workspace. A tutor only sees
// students linked here — and only inside the tutor workspace, never school data.
const tutorStudentLinkSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  tutorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  focusArea: { type: String, default: 'MathPath' },
  status: { type: String, enum: ['active', 'paused', 'ended'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

tutorStudentLinkSchema.index({ tutorUserId: 1, workspaceId: 1 });
tutorStudentLinkSchema.index({ workspaceId: 1, studentId: 1 }, { unique: true });

export default mongoose.model('TutorStudentLink', tutorStudentLinkSchema);
