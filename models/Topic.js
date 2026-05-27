import mongoose from 'mongoose';

// A topic groups skills (e.g. "Fractions"). Tagged to an MOE level for context,
// but mastery progression is adaptive per skill, not locked to a school level.
const topicSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  name: { type: String, required: true },
  moeLevel: { type: String, default: '' }, // e.g. "Primary 4"
  order: { type: Number, default: 0 }
});

topicSchema.index({ subjectId: 1, order: 1 });

export default mongoose.model('Topic', topicSchema);
