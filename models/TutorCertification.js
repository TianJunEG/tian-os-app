import mongoose from 'mongoose';

// Tutor certification / training state for the certified-tutor route. MVP:
// seeded demo modules, no full LMS. One doc per tutor user.
const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  status: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' },
}, { _id: false });

const tutorCertificationSchema = new mongoose.Schema({
  tutorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  status: {
    type: String,
    enum: ['not_started', 'in_training', 'assessment_pending', 'interview_pending', 'approved', 'suspended'],
    default: 'in_training'
  },
  trainingModules: { type: [moduleSchema], default: [] },
  assessmentStatus: { type: String, enum: ['not_started', 'in_progress', 'passed', 'failed'], default: 'not_started' },
  interviewStatus: { type: String, enum: ['not_scheduled', 'scheduled', 'passed', 'failed'], default: 'not_scheduled' },
  approvedLevels: { type: [String], default: [] },
  approvedModules: { type: [String], default: [] },
  trainingFeeStatus: { type: String, enum: ['not_required', 'unpaid', 'paid', 'reimbursed'], default: 'not_required' },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('TutorCertification', tutorCertificationSchema);
