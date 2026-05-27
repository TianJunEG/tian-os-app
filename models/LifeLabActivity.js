import mongoose from 'mongoose';

// A real-life Math/Science applied-learning activity. Library activities
// (isLibrary, no workspace) are seeded and reusable; teachers may also create
// workspace-scoped ones. Subject is Math or Science only (MVP).
const lifeLabActivitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, enum: ['Math', 'Science'], required: true },
  activityType: { type: String, enum: ['home', 'group', 'holiday', 'math_journal', 'parent_home'], default: 'home' },
  topic: { type: String, default: '' },
  realLifeContext: { type: String, default: '' },
  instructions: { type: String, default: '' },
  materials: { type: [String], default: [] },
  dataRecording: { type: String, default: '' },        // what to record
  reflectionQuestions: { type: [String], default: [] },
  isLibrary: { type: Boolean, default: false },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', default: null },
  createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('LifeLabActivity', lifeLabActivitySchema);
