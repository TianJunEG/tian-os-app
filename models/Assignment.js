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
    enum: ['not_started', 'started', 'in_progress', 'completed', 'skipped', 'expired', 'overdue'],
    default: 'not_started'
  },
  interventionId: { type: String, default: '' },
  interventionType: {
    type: String,
    enum: [
      '', 'practice_pack', 'worksheet', 'fluency_drill', 'retention_review',
      'heuristics_pack', 'exam_technique_pack', 'lifelab_activity',
      'tutor_session_recommendation', 'teacher_small_group_recommendation',
      'parent_home_support_activity', 'model_drawing_trainer', 'intervention_pack',
      'informal_assessment'
    ],
    default: ''
  },
  linkedMisconceptions: { type: [String], default: [] },
  priority: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
  assignedToType: { type: String, enum: ['student', 'group', 'class'], default: 'student' },
  assignedToId: { type: mongoose.Schema.Types.Mixed, default: null },
  templateId: { type: String, default: '' },
  playbookId: { type: String, default: '' },
  nextAction: { type: String, default: '' },
  schedule: {
    cadence: { type: String, enum: ['', 'daily', 'weekly', 'monthly', 'custom'], default: '' },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    customRule: { type: String, default: '' }
  },
  timestamps: {
    assignedAt: { type: Date, default: Date.now },
    startedAt: { type: Date, default: null },
    inProgressAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    skippedAt: { type: Date, default: null },
    expiredAt: { type: Date, default: null },
    overdueAt: { type: Date, default: null }
  },
  completionDate: { type: Date, default: null },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'PracticeSession', default: null },
  score: { type: Number, default: null },
  reassessmentOutcome: { type: mongoose.Schema.Types.Mixed, default: null },
  effectivenessSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
  notificationState: { type: mongoose.Schema.Types.Mixed, default: {} },
  aiPlanningContext: { type: mongoose.Schema.Types.Mixed, default: {} },
  feedbackSummary: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

assignmentSchema.index({ studentId: 1, status: 1 });
assignmentSchema.index({ workspaceId: 1 });
assignmentSchema.index({ interventionId: 1 });
assignmentSchema.index({ priority: 1, dueDate: 1 });

export default mongoose.model('Assignment', assignmentSchema);
