import mongoose from 'mongoose';

const elpathProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  module: { type: String, required: true, enum: ['cloze', 'vocab'] },
  state: { type: mongoose.Schema.Types.Mixed, default: null },
  updatedAt: { type: Date, default: Date.now },
});

elpathProgressSchema.index({ userId: 1, module: 1 }, { unique: true });

export default mongoose.model('ELPathProgress', elpathProgressSchema);
