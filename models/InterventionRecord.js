import mongoose from 'mongoose';

// Tracks a student receiving extra support on a target skill/topic. Status moves
// needs_support → improving → stable → mastered as mastery changes.
const interventionRecordSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  teacherUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetSkillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', default: null },
  targetTopicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },
  startedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['needs_support', 'improving', 'stable', 'mastered'], default: 'needs_support' },
  notes: { type: String, default: '' },
  nextAction: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

interventionRecordSchema.index({ classId: 1, studentId: 1 });

export default mongoose.model('InterventionRecord', interventionRecordSchema);
