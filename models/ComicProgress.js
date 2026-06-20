import mongoose from 'mongoose';

const problemAttemptSchema = new mongoose.Schema({
  problemId: { type: String, required: true },
  correct: { type: Boolean, required: true },
  // Optional lightweight "scratchpad" working captured in the comic reader.
  // Vector strokes only (no rasterised image). The /complete route sanitises and
  // bounds this — whitelisted per-stroke fields, capped stroke/point counts and a
  // byte ceiling — so the document stays a few hundred KB at most, well under the
  // 16 MB BSON limit. No analysis runs on it yet — it is recall evidence a
  // teacher/parent review surface can consume later.
  workingStrokes: { type: mongoose.Schema.Types.Mixed },
}, { _id: false });

const comicProgressSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
  episodeId: { type: String, required: true },
  problems: [problemAttemptSchema],
  completedAt: { type: Date, default: Date.now },
}, { timestamps: true });

comicProgressSchema.index({ studentId: 1, episodeId: 1 }, { unique: true });

export default mongoose.model('ComicProgress', comicProgressSchema);
