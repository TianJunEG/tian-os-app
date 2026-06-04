import mongoose from 'mongoose';

// The learner record. A student belongs to the workspace that owns the
// relationship (a private student in a tutor/parent workspace; a school student
// in a teacher workspace). The same child may exist as two separate Student
// records across workspaces — they are isolated unless explicitly linked.
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  level: { type: String, default: '' }, // e.g. "Primary 4", "Secondary 1"
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  // Optional link to a User account if the student logs in themselves.
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  profile: {
    mainFocus: { type: String, default: 'MathPath' },
    modulesUsed: { type: [String], default: ['MathPath'] },
    studentVisualMode: { type: String, enum: ['lower_primary', 'upper_primary', 'secondary'], default: 'upper_primary' },
    pilotProfile: { type: String, default: '' },
    pilotDescription: { type: String, default: '' }
  },
  createdAt: { type: Date, default: Date.now }
});

studentSchema.index({ workspaceId: 1 });

export default mongoose.model('Student', studentSchema);
