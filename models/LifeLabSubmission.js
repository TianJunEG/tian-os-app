import mongoose from 'mongoose';

// A student's response to an assigned LifeLab activity. Workspace-scoped.
// Evidence is a placeholder URL for MVP (no media pipeline yet).
const lifeLabSubmissionSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'LifeLabActivity', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', default: null },
  assignedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedByRole: { type: String, enum: ['teacher', 'tutor', 'parent', 'admin', 'student', ''], default: '' },
  targetType: { type: String, enum: ['class', 'group', 'student'], default: 'student' },
  dataRecorded: { type: String, default: '' },
  reflectionResponse: { type: String, default: '' },
  evidenceUrl: { type: String, default: '' },
  teacherFeedback: { type: String, default: '' },
  status: { type: String, enum: ['not_started', 'submitted', 'reviewed'], default: 'not_started' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

lifeLabSubmissionSchema.index({ classId: 1, activityId: 1 });
lifeLabSubmissionSchema.index({ studentId: 1, status: 1 });
lifeLabSubmissionSchema.index({ studentId: 1, createdAt: -1 });

export default mongoose.model('LifeLabSubmission', lifeLabSubmissionSchema);
