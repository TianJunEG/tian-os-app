import mongoose from 'mongoose';

// A sticker a student has collected for their reward chart. Stickers are either
// auto-earned from progress (source 'auto', carrying a dedupeKey so the same
// milestone never awards twice) or handed out by a tutor/parent (source 'tutor'
// /'parent', with the awarding user + an optional note). Duplicates are expected
// — the chart is a growing collection.
const studentStickerSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  stickerCode: { type: String, required: true, trim: true },
  source: { type: String, enum: ['auto', 'tutor', 'parent'], default: 'tutor' },
  awardedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  note: { type: String, default: '', trim: true },
  // Idempotency key for auto awards (e.g. "hw:<noteId>"); empty for manual ones.
  dedupeKey: { type: String, default: '' },
  earnedAt: { type: Date, default: Date.now },
});

studentStickerSchema.index({ studentId: 1, earnedAt: -1 });
// One auto-award per milestone per student. Partial so manual awards (empty key)
// are never constrained and can repeat freely.
studentStickerSchema.index(
  { studentId: 1, dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $gt: '' } } },
);

export default mongoose.model('StudentSticker', studentStickerSchema);
