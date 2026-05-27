import mongoose from 'mongoose';

// A school class, owned by a teacher inside a school (teacher) workspace.
const classSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  teacherUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  level: { type: String, default: '' },
  modules: { type: [String], default: ['MathPath'] },
  academicYear: { type: String, default: '' },
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

classSchema.index({ workspaceId: 1, teacherUserId: 1 });

export default mongoose.model('Class', classSchema);
