import mongoose from 'mongoose';

// Links a user to a workspace they may enter. A teacher-tutor user has two
// memberships (one school workspace, one tutor workspace). Membership is the
// gate the server checks before serving any workspace-scoped data.
const workspaceMemberSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: {
    type: String,
    enum: ['parent', 'tutor', 'teacher', 'admin', 'student_care', 'school_admin'],
    required: true
  },
  status: { type: String, enum: ['active', 'invited', 'suspended'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

workspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

export default mongoose.model('WorkspaceMember', workspaceMemberSchema);
