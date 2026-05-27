import mongoose from 'mongoose';

// Links a guardian (parent user) to a student within a workspace. A parent may
// only see students they are a guardian of, scoped to their parent workspace.
const studentGuardianSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  guardianUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  relation: { type: String, default: 'parent' },
  createdAt: { type: Date, default: Date.now }
});

studentGuardianSchema.index({ guardianUserId: 1, workspaceId: 1 });

export default mongoose.model('StudentGuardian', studentGuardianSchema);
