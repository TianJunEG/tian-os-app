import mongoose from 'mongoose';

const scaffoldStepSchema = new mongoose.Schema({
  stepId: String,
  prompt: String,
  expectedResponse: mongoose.Schema.Types.Mixed,
  choices: [mongoose.Schema.Types.Mixed],
  type: String,
}, { _id: false });

const problemSchema = new mongoose.Schema({
  problemId: { type: String, required: true },
  templateId: String,
  storyText: String,
  givenNumbers: [Number],
  correctAnswer: Number,
  barModelSpec: mongoose.Schema.Types.Mixed,
  scaffoldSteps: [scaffoldStepSchema],
  status: { type: String, enum: ['pending', 'inProgress', 'completed'], default: 'pending' },
}, { _id: false });

const summarySchema = new mongoose.Schema({
  totalProblems: { type: Number, default: 0 },
  completedProblems: { type: Number, default: 0 },
  fullMarks: { type: Number, default: 0 },
  partialCredit: { type: Number, default: 0 },
  misconceptionCounts: { type: mongoose.Schema.Types.Mixed, default: {} },
  averageTimeMs: { type: Number, default: 0 },
  overallScore: { type: Number, default: 0 },
}, { _id: false });

const pslSessionSchema = new mongoose.Schema({
  sessionId: { type: String, unique: true, required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  skillId: { type: String, required: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', default: null },
  status: {
    type: String,
    enum: ['notStarted', 'inProgress', 'completed', 'abandoned'],
    default: 'notStarted',
  },
  problems: [problemSchema],
  currentProblemIndex: { type: Number, default: 0 },
  summary: { type: summarySchema, default: () => ({}) },
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model('PSLSession', pslSessionSchema, 'psl_sessions');
