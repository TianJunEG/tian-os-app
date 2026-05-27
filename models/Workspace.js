import mongoose from 'mongoose';

// A workspace is the data boundary a user operates inside. Role controls which
// features exist; workspace controls which students/records are visible.
// School (teacher) data and private-tutoring data live in separate workspaces
// and must never mix unless explicitly linked. See master spec §4.
const workspaceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['parent', 'tutor', 'teacher', 'school', 'admin'],
    required: true
  },
  name: { type: String, required: true, trim: true },
  // The role exercised inside this workspace (drives available features).
  role: {
    type: String,
    enum: ['parent', 'tutor', 'teacher', 'admin'],
    required: true
  },
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', default: null },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Workspace', workspaceSchema);
