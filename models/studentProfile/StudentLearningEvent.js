import mongoose from 'mongoose';

const studentLearningEventSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    eventType: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    xpAwarded: { type: Number, default: 0, min: 0 },
    subjectId: { type: String, default: '', trim: true },
    domainId: { type: String, default: '', trim: true },
    skillId: { type: String, default: '', trim: true },
    occurredAt: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'student_learning_events' }
);

studentLearningEventSchema.index({ studentId: 1, occurredAt: -1 });
studentLearningEventSchema.index({ studentId: 1, eventType: 1 });

export default mongoose.model('StudentLearningEvent', studentLearningEventSchema);
