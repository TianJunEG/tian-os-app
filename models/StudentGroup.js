import mongoose from 'mongoose';

// A remediation group within a class. Members embedded as studentIds for MVP
// simplicity. `source` distinguishes rule-suggested vs teacher-edited.
const studentGroupSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  teacherUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  basis: { type: String, enum: ['weak_topic', 'skill_gap', 'completion', 'custom'], default: 'weak_topic' },
  targetSkillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', default: null },
  studentIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'Student', default: [] },
  createdAt: { type: Date, default: Date.now }
});

studentGroupSchema.index({ classId: 1 });

export default mongoose.model('StudentGroup', studentGroupSchema);
