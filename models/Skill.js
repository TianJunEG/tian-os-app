import mongoose from 'mongoose';

// The atomic unit of mastery. Skills form a prerequisite graph that powers
// placement, recommendations, and remediation (master spec §9 "skill map").
const skillSchema = new mongoose.Schema({
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  name: { type: String, required: true },
  // Stable identifier for a skill, independent of name/topic (e.g. 'op.mult.facts').
  // Domain seeds key on this; legacy skills leave it ''.
  slug: { type: String, default: '', index: true },
  // Curriculum domain this skill belongs to (e.g. 'Number Sense', 'Operations').
  domain: { type: String, default: '' },
  moeLevel: { type: String, default: '' },
  // Prerequisite chain — which skills should be secure before this one.
  prerequisiteSkillIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'Skill', default: [] },
  order: { type: Number, default: 0 },
  // Rich, engine-readable spec carried by domain seeds. Backward-compatible bag:
  //   { levelTag, masteryType, fluencyType, fluency:{targetSeconds,targetAccuracy},
  //     misconceptions:[{tag,label}], practiceModes:[…], remediation:{…},
  //     questionStructures:[{mode,type,difficulty,stem,answerRule,misconceptionTag}] }
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
});

skillSchema.index({ topicId: 1, order: 1 });

export default mongoose.model('Skill', skillSchema);
