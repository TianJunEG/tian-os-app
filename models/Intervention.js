import mongoose from 'mongoose';

const interventionSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
  interventionId: { type: String, required: true },
  type: {
    type: String,
    enum: [
      'practice_pack', 'worksheet', 'fluency_drill', 'retention_review',
      'heuristics_pack', 'exam_technique_pack', 'lifelab_activity',
      'tutor_session_recommendation', 'teacher_small_group_recommendation',
      'parent_home_support_activity', 'model_drawing_trainer', 'intervention_pack'
    ],
    required: true
  },
  title: { type: String, default: '' },
  linkedSkillIds: { type: [String], default: [] },
  linkedMisconceptions: { type: [String], default: [] },
  priority: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
  status: {
    type: String,
    enum: ['recommended', 'assigned', 'started', 'in_progress', 'completed', 'skipped', 'expired', 'mastered'],
    default: 'recommended'
  },
  source: { type: String, enum: ['diagnostic', 'mistake', 'practice', 'fluency', 'retention', 'exam', 'help_request', 'manual'], default: 'diagnostic' },
  sourceId: { type: String, default: '' },
  templateId: { type: String, default: '' },
  playbookId: { type: String, default: '' },
  workflow: { type: [String], default: [] },
  nextAction: { type: String, default: '' },
  assignmentIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'Assignment', default: [] },
  effectivenessHistory: { type: [mongoose.Schema.Types.Mixed], default: [] },
  aiReadyContext: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

interventionSchema.index({ workspaceId: 1, studentId: 1, status: 1 });
interventionSchema.index({ workspaceId: 1, interventionId: 1 }, { unique: true });
interventionSchema.index({ priority: 1, type: 1 });

export default mongoose.model('Intervention', interventionSchema);
