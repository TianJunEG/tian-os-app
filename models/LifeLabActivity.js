import mongoose from 'mongoose';

// A real-life Math/Science applied-learning activity. Library activities
// (isLibrary, no workspace) are seeded and reusable; teachers may also create
// workspace-scoped ones. Subject is Math or Science only (MVP).
const lifeLabActivitySchema = new mongoose.Schema({
  libraryKey: { type: String, default: '', index: true },
  title: { type: String, required: true },
  subject: { type: String, enum: ['Math', 'Science'], required: true },
  level: {
    type: String,
    enum: ['Primary', 'Lower Secondary', 'Primary Math', 'Primary Science', 'Lower Secondary Math', 'Lower Secondary Science', ''],
    default: ''
  },
  estimatedDuration: { type: String, default: '' },
  activityType: { type: String, enum: ['home', 'group', 'holiday', 'math_journal', 'parent_home'], default: 'home' },
  topic: { type: String, default: '' },
  realLifeContext: { type: String, default: '' },
  learningObjectives: { type: [String], default: [] },
  instructions: { type: String, default: '' },
  steps: { type: [String], default: [] },
  materials: { type: [String], default: [] },
  dataRecording: { type: String, default: '' },        // what to record
  reflectionQuestions: { type: [String], default: [] },
  evidencePrompt: { type: String, default: 'Optional: add a photo, sketch, table, or short note as evidence.' },
  primaryE21cc: { type: [String], default: [] },
  secondaryE21cc: { type: [String], default: [] },
  teacherNotes: { type: String, default: '' },
  isLibrary: { type: Boolean, default: false },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', default: null },
  createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('LifeLabActivity', lifeLabActivitySchema);
