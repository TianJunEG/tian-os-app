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
  // Async marking status (Phase 1 WS3). 'idle' default so the synchronous path is
  // unaffected; the worker sets 'marking' → 'marked'/'failed'.
  markingStatus: { type: String, enum: ['idle', 'marking', 'marked', 'failed'], default: 'idle' },
  markingError: { type: String, default: '' },
  questions: [questionSchema]
}, { _id: false });

const worksheetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
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

  // Photo-flow async generation status (Phase 1 WS3). 'ready' is the default so
  // every existing/structured worksheet and the synchronous path are unaffected;
  // the background worker sets 'pending' → 'ready'/'failed'.
  generationStatus: {
    type: String,
    enum: ['pending', 'ready', 'failed'],
    default: 'ready',
  },
  generationError: { type: String, default: '' },

  // ── Structured generation (Phase 4 Worksheet Generator) ─────────────────
  // Additive: the legacy photo flow above is untouched. A generated worksheet
  // stores structured content first (never PDF-only).
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', default: null },
  generatedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  generatedByRole: { type: String, enum: ['student', 'parent', 'tutor', 'teacher', 'student_care', 'admin', 'system', null], default: null },
  topicIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'Topic', default: [] },
  skillIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'Skill', default: [] },
  sourceMode: {
    type: String,
    enum: [
      'photo',
      'recent_mistakes',
      'weak_skills',
      'diagnostic_results',
      'selected_topic',
      'recommended',
      'fluency',
      'retention',
      'custom',
      'mastery_check',
      'intervention',
      'session',
      'homework',
      'class',
      'group',
      'intervention_group',
      'diagnostic_intervention',
      'recovery_pack',
      'paper_analysis',
      'tutor_lesson',
      'student_care_intervention',
      'parent_support',
      'recheck',
      null
    ],
    default: null
  },
  worksheetType: {
    type: String,
    enum: [
      'recommended',
      'fluency',
      'retention',
      'custom',
      'mastery_check',
      'intervention',
      'session',
      'homework',
      'class',
      'group',
      'intervention_group',
      'recovery_worksheet',
      'practice_worksheet',
      'homework_worksheet',
      'tutor_lesson_worksheet',
      'recheck_worksheet',
      'parent_support_worksheet',
      null
    ],
    default: null,
  },
  domain: { type: String, default: 'fractions' },
  interventionSourceType: { type: String, default: '', trim: true },
  interventionSourceId: { type: String, default: '', trim: true },
  interventionRationale: { type: mongoose.Schema.Types.Mixed, default: null },
  generatedFor: { type: mongoose.Schema.Types.Mixed, default: null },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'adaptive'], default: 'medium' },
  questionCount: { type: Number, default: 10 },
  estimatedMinutes: { type: Number, default: 0 },
  includesSolutions: { type: Boolean, default: true },
  includesMistakeReview: { type: Boolean, default: false },
  // The assembled worksheet: { title, reviewSection: [...], questions: [{ n, stem, choices, answer, workedSolution, skillName, difficulty }] }
  generatedContent: { type: mongoose.Schema.Types.Mixed, default: null },
  answerKey: { type: [mongoose.Schema.Types.Mixed], default: [] },
  completion: {
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    accuracy: { type: Number, default: null },
    skillsImproved: { type: [String], default: [] },
    workingSubmitted: { type: Boolean, default: false },
  },
  assignedStatus: { type: String, enum: ['unassigned', 'assigned'], default: 'unassigned' },
  linkedAssignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', default: null },
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
worksheetSchema.index({ studentId: 1, createdAt: -1 });
worksheetSchema.index({ studentId: 1, sourceMode: 1, createdAt: -1 });
worksheetSchema.index({ linkedAssignmentId: 1 });

export default mongoose.model('Worksheet', worksheetSchema);
