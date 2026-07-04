import mongoose from 'mongoose';

// A single-use, short-lived sign-in token for the Vocabulary Builder magic-link
// flow. Only the SHA-256 hash of the token is stored — the raw token lives only
// in the emailed link. `usedAt` enforces single use; the TTL index purges
// expired links automatically so the collection stays small.
const vocabMagicLinkSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  tokenHash: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true },
  usedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

// Auto-delete once expired (expireAfterSeconds: 0 uses the expiresAt value).
vocabMagicLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('VocabMagicLink', vocabMagicLinkSchema);
