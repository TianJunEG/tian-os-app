import mongoose from 'mongoose';

// Saved when an attempt is incorrect. Powers Mistake-to-Mastery review and
// drives parent/tutor/teacher remediation suggestions.
const mistakeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  questionId: { type: mongoose.Schema.Types.Mixed, required: true },
  sessionId: { type: String, default: '', trim: true },
  attemptId: { type: String, default: '', trim: true },
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', default: null },
  skillCode: { type: String, default: '', trim: true },
  module: { type: String, default: 'MathPath' },
  // Snapshot of the question so the review screen renders without a join even if
  // the question is later edited/removed.
  questionText: { type: String, default: '' },
  questionStem: { type: String, default: '' },
  workedSolution: { type: String, default: '' },
  studentAnswer: { type: String, default: '' },
  correctAnswer: { type: String, default: '' },
  answerCorrect: { type: Boolean, default: false },
  confidence: { type: String, default: '' },
  workingSubmitted: { type: Boolean, default: false },
  workingOnPaper: { type: Boolean, default: false },
  workingNotNeeded: { type: Boolean, default: false },
  workingSessionId: { type: String, default: '', trim: true },
  workingImage: { type: String, default: '' },
  workingStrokes: { type: [mongoose.Schema.Types.Mixed], default: [] },
  timeTaken: { type: Number, default: null },
  workingId: { type: String, default: '', trim: true },
  remediationId: { type: String, default: '', trim: true },
  workingPreviewImage: { type: String, default: '' },
  extractedWorkingText: { type: String, default: '' },
  workingInsight: { type: mongoose.Schema.Types.Mixed, default: null },
  workingAnalysisResult: { type: mongoose.Schema.Types.Mixed, default: null },
  workingQualityScore: { type: Number, default: null },
  workingQualityBand: {
    type: String,
    enum: ['EXCELLENT', 'GOOD', 'PARTIAL', 'INSUFFICIENT', ''],
    default: '',
  },
  timestamp: { type: Date, default: null },
  mistakeId: { type: String, default: '' },
  mistakeCategory: {
    type: String,
    enum: [
      'knowledge_gap',
      'conceptual_misconception',
      'procedure_error',
      'careless_error',
      'question_misread',
      'confidence_error',
      'fluency_deficit',
      'exam_technique_error',
      'working_evidence_deficit',
      '',
    ],
    default: '',
  },
  severity: {
    type: String,
    enum: ['minor', 'moderate', 'major', 'critical', ''],
    default: '',
  },
  mistakeType: {
    type: String,
    enum: ['concept_gap', 'calculation_error', 'careless', 'method_error', 'unknown'],
    default: 'unknown'
  },
  misconceptionTag: { type: String, default: '' },
  rootCauseMapping: { type: [String], default: [] },
  skillMapping: { type: [String], default: [] },
  firstOccurredAt: { type: Date, default: null },
  mostRecentOccurredAt: { type: Date, default: null },
  frequency: { type: Number, default: 1, min: 0 },
  attemptsSinceOccurrence: { type: Number, default: null },
  improvementTrend: {
    type: String,
    enum: ['improving', 'stable', 'worsening', 'insufficient_evidence', ''],
    default: '',
  },
  resolved: { type: Boolean, default: false },
  interventionPathway: { type: [mongoose.Schema.Types.Mixed], default: [] },
  nextAction: { type: String, default: '' },
  auditTrail: { type: [mongoose.Schema.Types.Mixed], default: [] },
  // Review status (Mistake-to-Mastery). `reviewed` kept for back-compat.
  reviewed: { type: Boolean, default: false },
  reviewedAt: { type: Date, default: null },
  reviewedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  source: {
    type: String,
    enum: ['diagnostic-incorrect', 'diagnostic-skipped', 'practice-incorrect', 'other'],
    default: 'other',
  },
  reviewSource: {
    type: String,
    enum: ['student', 'parent', 'tutor', 'teacher', null],
    default: null
  },
  // Set to 'resolved' once the underlying skill is mastered (derived, not manual).
  status: {
    type: String,
    enum: ['open', 'reviewed', 'resolved'],
    default: 'open'
  },
  createdAt: { type: Date, default: Date.now },
  occurredAt: { type: Date, default: Date.now }
});

mistakeSchema.index({ studentId: 1, occurredAt: -1 });
mistakeSchema.index({ studentId: 1, skillId: 1, status: 1 });
mistakeSchema.index({ attemptId: 1 });
mistakeSchema.index({ workingId: 1 });
mistakeSchema.index({ remediationId: 1 });

export default mongoose.model('Mistake', mistakeSchema);
