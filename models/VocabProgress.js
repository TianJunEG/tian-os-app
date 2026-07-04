import mongoose from 'mongoose';

// Cross-device save for the standalone Vocabulary Builder. Identity is the
// learner's email (proven via a magic link — see VocabMagicLink); there is no
// password and no User record. One row per (email, level group); `state` is the
// engine's serialisable progress object, stored verbatim so the shape can evolve
// without a schema migration.
const vocabProgressSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  group: { type: String, required: true, enum: ['upper', 'middle'] },
  state: { type: mongoose.Schema.Types.Mixed, default: null },
  updatedAt: { type: Date, default: Date.now },
});

vocabProgressSchema.index({ email: 1, group: 1 }, { unique: true });

export default mongoose.model('VocabProgress', vocabProgressSchema);
