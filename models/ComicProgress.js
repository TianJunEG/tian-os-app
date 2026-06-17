import mongoose from 'mongoose';

const problemAttemptSchema = new mongoose.Schema({
  problemId: { type: String, required: true },
  correct: { type: Boolean, required: true },
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
