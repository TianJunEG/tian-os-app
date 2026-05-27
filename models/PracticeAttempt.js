import mongoose from 'mongoose';

// One answered question within a session. Feeds mastery updates and (on
// incorrect) mistake records.
const practiceAttemptSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'PracticeSession', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
  answer: { type: String, default: '' },
  correct: { type: Boolean, default: false },
  timeMs: { type: Number, default: null },
  hintsUsed: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Session completion reads every attempt for a session (practice + spelling).
practiceAttemptSchema.index({ sessionId: 1 });
// Analytics + worksheet recency read a student's attempts over a time window.
practiceAttemptSchema.index({ studentId: 1, createdAt: -1 });

export default mongoose.model('PracticeAttempt', practiceAttemptSchema);
