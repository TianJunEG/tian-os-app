import mongoose from 'mongoose';

// A tokenised email invite for a parent/guardian to view a school student's
// progress. On acceptance it creates (or links) a parent account and a
// view-only StudentGuardian record against the school student. Mirrors the
// TutorInvite lifecycle so the two flows stay consistent.
const parentInviteSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true, index: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  invitedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, default: '', trim: true },
  schoolName: { type: String, default: '', trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired', 'revoked'],
    default: 'pending',
    index: true,
  },
  expiresAt: { type: Date, required: true, index: true },
  acceptedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  acceptedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

parentInviteSchema.index({ studentId: 1, email: 1 });
parentInviteSchema.index({ expiresAt: 1 });

export default mongoose.model('ParentInvite', parentInviteSchema);
