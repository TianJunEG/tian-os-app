import mongoose from 'mongoose';

const tutorInviteSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true, index: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  tutorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tutorName: { type: String, required: true, trim: true },
  focusArea: { type: String, default: 'MathPath', trim: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired', 'revoked'],
    default: 'pending',
    index: true,
  },
  expiresAt: { type: Date, required: true, index: true },
  acceptedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  acceptedStudentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
  acceptedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

tutorInviteSchema.index({ tutorUserId: 1, workspaceId: 1 });
tutorInviteSchema.index({ expiresAt: 1 });

export default mongoose.model('TutorInvite', tutorInviteSchema);

