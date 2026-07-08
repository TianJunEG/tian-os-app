import mongoose from 'mongoose';

// Lightweight analytics events for the standalone Vocabulary Builder, so we can
// measure the things that decide whether the product is worth monetising:
// engagement/retention (does a learner come back?), depth (words mastered), and
// — via the cold-word probe — genuine transfer to unseen words. Keyed by an
// anonymous client id (so the whole top-of-funnel is measurable, not just
// signed-in users); `email` is attached only when the learner has signed in, so
// anonymous sessions can later be stitched to an identity.
const vocabEventSchema = new mongoose.Schema({
  clientId: { type: String, required: true, index: true },
  email: { type: String, default: null, lowercase: true, trim: true, index: true },
  sessionId: { type: String, default: null },
  type: { type: String, required: true, index: true },
  group: { type: String, default: null },
  data: { type: mongoose.Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now, index: true },
});

export default mongoose.model('VocabEvent', vocabEventSchema);
