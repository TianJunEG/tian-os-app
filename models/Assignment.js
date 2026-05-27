import mongoose from 'mongoose';

// Targeted work assigned to a student (Phase 3 wires parent/tutor/teacher
// creation + the student completion flow). MVP: only MathPath assignments are
// fully functional; other modules are reserved.
const assignmentSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  assignedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedByRole: { type: String, enum: ['parent', 'tutor', 'teacher', 'system'], required: true },
  module: {
    type: String,
    enum: [
      'MathPath', 'Fluency Practice', 'Mistake-to-Mastery', 'Mastery Worksheet',
      'Spelling Practice', 'Science Adaptive Revision', 'LifeLab'
    ],
    default: 'MathPath'
  },
  subject: { type: String, default: 'Math' },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },
  skillIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'Skill', default: [] },
  questionCount: { type: Number, default: 10 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  dueDate: { type: Date, default: null },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'overdue'],
    default: 'not_started'
  },
  completionDate: { type: Date, default: null },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'PracticeSession', default: null },
  score: { type: Number, default: null },
  feedbackSummary: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

assignmentSchema.index({ studentId: 1, status: 1 });
assignmentSchema.index({ workspaceId: 1 });

export default mongoose.model('Assignment', assignmentSchema);
