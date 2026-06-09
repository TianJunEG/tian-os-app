import mongoose from 'mongoose';

// A shareable code/link that lets a student or teacher self-enrol into a class,
// for ad-hoc additions after (or instead of) a bulk roster import. Workspace-scoped.
const classJoinCodeSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
  code: { type: String, required: true, uppercase: true, trim: true },
  createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, default: null },
  maxUses: { type: Number, default: null, min: 1 }, // null = unlimited
  usedCount: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['active', 'revoked'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
});

classJoinCodeSchema.index({ code: 1 }, { unique: true });

export default mongoose.model('ClassJoinCode', classJoinCodeSchema);
