import mongoose from 'mongoose';

// Active "similar question" practice sessions. Previously these lived only in a
// module-level Map, which broke under horizontal scaling: a student who started a
// session on one instance and submitted to another got "session not found".
// Persisting here makes sessions instance-independent. Sessions are transient, so
// a TTL index expires them automatically a day after the last write.
const similarQuestionPracticeSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, trim: true },
    practiceSetId: { type: String, required: true, trim: true },
    studentId: { type: String, required: true, trim: true },
    domain: { type: String, default: 'fractions', trim: true },
    skillId: { type: String, default: '', trim: true },
    startedAt: { type: String, default: '' },
    completedAt: { type: String, default: null },
    status: { type: String, default: 'active', trim: true },
    // The picked questions and the accumulated responses/summary are read back at
    // submit time; their shape is owned by questionPatternTrainer, so store as-is.
    questions: { type: [mongoose.Schema.Types.Mixed], default: [] },
    responses: { type: [mongoose.Schema.Types.Mixed], default: [] },
    summary: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true, collection: 'mathpath_similar_question_practice_sessions' }
);

similarQuestionPracticeSessionSchema.index({ studentId: 1 });
// Auto-expire sessions 24h after their last update to keep the collection bounded.
similarQuestionPracticeSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.model('SimilarQuestionPracticeSession', similarQuestionPracticeSessionSchema);
