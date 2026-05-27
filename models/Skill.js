import mongoose from 'mongoose';

// The atomic unit of mastery. Skills form a prerequisite graph that powers
// placement, recommendations, and remediation (master spec §9 "skill map").
const skillSchema = new mongoose.Schema({
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  name: { type: String, required: true },
  moeLevel: { type: String, default: '' },
  // Prerequisite chain — which skills should be secure before this one.
  prerequisiteSkillIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'Skill', default: [] },
  order: { type: Number, default: 0 }
});

skillSchema.index({ topicId: 1, order: 1 });

export default mongoose.model('Skill', skillSchema);
