import mongoose from 'mongoose';

// Links a guardian (parent user) to a student within a workspace. A parent may
// only see students they are a guardian of, scoped to their parent workspace.
const studentGuardianSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  guardianUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  relation: { type: String, default: 'parent' },
  // Access level controls what the guardian can do. School-invited parents are
  // 'view_only' (read progress, no assign-practice); a parent who owns the
  // child in their own family workspace is 'full'. Premium Home upgrade is what
  // turns a view_only school link into full control.
  accessLevel: { type: String, enum: ['full', 'view_only'], default: 'full' },
  // How this guardian link was created — distinguishes a school email invite
  // (cross-workspace, view-only) from a parent's own family-workspace child.
  source: { type: String, enum: ['direct', 'school_invite'], default: 'direct' },
  createdAt: { type: Date, default: Date.now }
});

studentGuardianSchema.index({ guardianUserId: 1, workspaceId: 1 });

export default mongoose.model('StudentGuardian', studentGuardianSchema);
