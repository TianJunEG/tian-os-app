import mongoose from 'mongoose';

const misconceptionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  evidence: { type: String }
}, { _id: false });

const questionSchema = new mongoose.Schema({
  prompt: { type: String, required: true },
  answer: { type: String, required: true },
  workedSolution: { type: String },
  targetsMisconception: { type: String },
  difficulty: {
    type: String,
    enum: ['easier', 'similar', 'harder'],
    default: 'similar'
  },
  // Filled in when the student's answer is marked
  studentResponseType: { type: String, enum: ['text', 'image'] },
  studentResponse: { type: String },
  correct: { type: Boolean, default: null },
  feedback: { type: String },
  markedAt: { type: Date }
}, { _id: false });

const practiceSessionSchema = new mongoose.Schema({
  sessionNumber: { type: Number, required: true },
  scheduledFor: { type: Date, required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  marked: { type: Boolean, default: false },
  score: { type: Number, default: null },
  questions: [questionSchema]
}, { _id: false });

const worksheetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    trim: true,
    maxlength: [100, 'Student name cannot exceed 100 characters']
  },
  subject: {
    type: String,
    default: 'Math'
  },
  topic: {
    type: String
  },
  gradeLevel: {
    type: String
  },
  sourceImageUrl: {
    type: String
  },
  overallSummary: {
    type: String
  },
  misconceptions: [misconceptionSchema],
  skillsToReinforce: [String],
  practiceSessions: [practiceSessionSchema],
  // Denormalized for cheap due-list rendering
  nextDueAt: {
    type: Date,
    default: null
  },
  sessionsTotal: {
    type: Number,
    default: 0
  },
  sessionsCompleted: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

worksheetSchema.index({ userId: 1, createdAt: -1 });
worksheetSchema.index({ userId: 1, nextDueAt: 1 });

export default mongoose.model('Worksheet', worksheetSchema);
