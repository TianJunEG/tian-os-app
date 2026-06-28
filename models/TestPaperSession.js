import mongoose from 'mongoose';

// One student's sitting of a TestPaper. The full question snapshot (incl.
// answers) is stored server-side so marking is resilient to the paper being
// edited mid-sitting, and so the client is never sent answers before the paper
// is submitted (exam integrity). Marking happens once, at submission.
const sittingQuestionSchema = new mongoose.Schema({
  order: Number,
  section: String,
  marks: Number,
  type: String,
  stem: String,
  choices: [String],
  answer: String,             // server-only until submission
  unit: String,
  workedSolution: String,
  solutionSteps: [String],
  frameworkSkillId: String,
  skillName: String,
  difficulty: String,
  diagram: mongoose.Schema.Types.Mixed,
}, { _id: false });

const sittingAnswerSchema = new mongoose.Schema({
  order: Number,
  answer: { type: String, default: '' },
  correct: { type: Boolean, default: false },
  marksAwarded: { type: Number, default: 0 },
  timeMs: { type: Number, default: null },
  // Working / scratchpad evidence so a teacher can see the student showed their
  // working (image is a PNG data URL captured from the working canvas).
  workingSubmitted: { type: Boolean, default: false },
  workingImage: { type: String, default: '' },
}, { _id: false });

const testPaperSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  paperCode: { type: String, required: true },
  paperTitle: { type: String, default: '' },
  level: { type: String, default: '' },
  durationMinutes: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  status: { type: String, enum: ['inProgress', 'completed', 'abandoned'], default: 'inProgress' },
  questions: { type: [sittingQuestionSchema], default: [] },
  answers: { type: [sittingAnswerSchema], default: [] },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  summary: {
    totalMarks: { type: Number, default: 0 },
    marksAwarded: { type: Number, default: 0 },
    scorePct: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 0 },
    durationUsedSec: { type: Number, default: 0 },
  },
}, { timestamps: true });

testPaperSessionSchema.index({ studentId: 1, paperCode: 1, status: 1 });
testPaperSessionSchema.index({ studentId: 1, startedAt: -1 });

export default mongoose.model('TestPaperSession', testPaperSessionSchema);
