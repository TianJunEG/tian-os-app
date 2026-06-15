import mongoose from 'mongoose';

// Enrolment of a student into a class (school roster). Workspace-scoped.
const classStudentSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  status: { type: String, enum: ['active', 'transferred', 'archived'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

classStudentSchema.index({ classId: 1, studentId: 1 }, { unique: true });
classStudentSchema.index({ classId: 1, status: 1 });

export default mongoose.model('ClassStudent', classStudentSchema);
