import mongoose from 'mongoose';

// The shared question bank. Every module (MathPath, Fluency, Mistake-to-Mastery,
// Worksheet Generator) draws from this one collection — questions are tagged by
// skill + topic + subject + MOE level + difficulty so any surface can assemble a
// targeted set. Phase-2 foundation: seeded rule-based for Math first.
const questionSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
  moeLevel: { type: String, default: '' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  type: { type: String, enum: ['mcq', 'short_answer', 'open_ended'], default: 'short_answer' },
  stem: { type: String, required: true },
  choices: { type: [String], default: [] },      // for mcq
  answer: { type: String, required: true },       // mcq/short answer; for open_ended a short canonical answer
  workedSolution: { type: String, default: '' },
  // Open-ended (Science) support: model answer + the key points/keywords a good
  // answer must contain (used for MVP keyword-based marking).
  modelAnswer: { type: String, default: '' },
  keyPoints: { type: [String], default: [] },
  explanation: { type: String, default: '' },
  commonMistakes: { type: [String], default: [] },
  // Misconception this item is good at surfacing/diagnosing (slug). Optional.
  misconceptionTag: { type: String, default: '' },
  source: { type: String, default: 'seed' },       // seed | authored | generated
  // Provenance for authored items lifted from a specific paper, e.g.
  // 'P6_TaoNan_Prelim_2025'. Lets an ingest seed delete+reinsert just its own
  // questions (idempotent) without touching template/seed items.
  sourceRef: { type: String, default: '' },
  // Figure support: many exam items depend on a diagram (number line, pie/bar/
  // line graph, geometry figure). `figureUrl` is a served asset path; until the
  // image is produced it may be blank while `figureAlt` describes what's needed.
  hasFigure: { type: Boolean, default: false },
  figureUrl: { type: String, default: '' },
  figureAlt: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

questionSchema.index({ skillId: 1, difficulty: 1 });
questionSchema.index({ topicId: 1 });

export default mongoose.model('Question', questionSchema);
