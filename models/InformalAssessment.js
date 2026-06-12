import mongoose from 'mongoose';
import crypto from 'crypto';

const questionSchema = new mongoose.Schema({
  questionId: { type: String, default: () => crypto.randomUUID() },
  skillId: { type: String, default: '' },
  // MathPath fields
  display: { type: String, default: '' },
  answer: { type: mongoose.Schema.Types.Mixed, default: null },
  kind: { type: String, default: '' },
  choices: { type: [String], default: [] },
  choice: { type: Boolean, default: false },
  decimal: { type: Boolean, default: false },
  // PSL fields
  storyText: { type: String, default: '' },
  correctAnswer: { type: Number, default: null },
  heuristic: { type: String, default: '' },
  structure: { type: String, default: '' },
}, { _id: false });

const informalAssessmentSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  module: { type: String, enum: ['MathPath', 'PSL'], required: true },
  subject: { type: String, default: 'Math' },
  skillIds: { type: [String], default: [] },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  questionCount: { type: Number, required: true, min: 1, max: 30 },
  timeLimitMinutes: { type: Number, default: null },
  dueDate: { type: Date, default: null },
  status: { type: String, enum: ['draft', 'assigned', 'closed'], default: 'draft' },
  questions: { type: [questionSchema], default: [] },
  assignedToType: { type: String, enum: ['class', 'group', 'student'], default: 'class' },
  assignedToId: { type: mongoose.Schema.Types.Mixed, default: null },
  resultsSummary: {
    totalAssigned: { type: Number, default: 0 },
    totalCompleted: { type: Number, default: 0 },
    averageScore: { type: Number, default: null },
  },
  assignedAt: { type: Date, default: null },
  closedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

informalAssessmentSchema.index({ classId: 1, status: 1 });
informalAssessmentSchema.index({ workspaceId: 1, createdByUserId: 1 });
informalAssessmentSchema.index({ createdAt: -1 });

export default mongoose.model('InformalAssessment', informalAssessmentSchema);
