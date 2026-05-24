import mongoose from 'mongoose';

// A normalised practice result from ANY learning app (Math Heuristics, MathPath, Science…).
// Apps POST these to /api/learning/result; the unified profile aggregates them by subject/topic.
// (Spelling keeps its own richer SpellingAttempt model and is folded in separately.)
const learningResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  source: { type: String, required: true },   // 'math-heuristics' | 'mathpath' | 'science' | …
  subject: { type: String, required: true },  // 'emath' | 'amath' | 'chem' | 'bio' | 'phys' | …
  topic: { type: String, default: '' },        // free-text topic/skill name
  accuracy: { type: Number, default: 0, min: 0, max: 100 },
  mastered: { type: Boolean, default: false },
  minutes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});
learningResultSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('LearningResult', learningResultSchema);
