import mongoose from 'mongoose';

// A test-paper-style assessment: a fixed, ordered set of authored exam-style
// questions a student sits under (optional) time pressure and is marked on at
// the end — distinct from MathPath skill practice (adaptive, generated,
// per-question feedback) and PSL (guided heuristic scaffolding).
//
// Phase 1 design: questions are EMBEDDED here rather than referencing the
// shared Question collection. That keeps an authored paper self-contained (no
// Subject/Topic/Skill foreign keys to seed) and lets a real past-paper be
// authored as one document. Each embedded question still carries
// `frameworkSkillId` so a wrong answer routes to the right skill in the
// Mistake-to-Mastery review. Phase 2 can mirror these into the Question bank so
// the same items also surface as the MathPath "Challenging" tier.
const paperQuestionSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  section: { type: String, default: 'A' },              // A / B / C — display grouping
  paper: { type: Number, default: 1 },                  // 1 = Paper 1, 2 = Paper 2 (word problems)
  // Multi-part questions (e.g. Paper 2 "(a)…(b)…"): parts share a groupId and the
  // first part carries the shared groupIntro. Each part is still a normal scored
  // question (own order/marks/answer), so marking is unchanged.
  groupId: { type: String, default: '' },
  groupIntro: { type: String, default: '' },
  partLabel: { type: String, default: '' },             // 'a', 'b'
  marks: { type: Number, default: 1 },
  type: { type: String, enum: ['mcq', 'short_answer', 'shade_grid'], default: 'short_answer' },
  stem: { type: String, required: true },
  choices: { type: [String], default: [] },             // MCQ options
  answer: { type: String, required: true },             // canonical answer (never sent mid-paper)
  unit: { type: String, default: '' },                  // e.g. 'cm', '$'
  // Reading tolerance for "measure the angle" questions — accept the typed value
  // within ±tolerance degrees (reading off a screen is approximate). 0 = exact.
  tolerance: { type: Number, default: 0 },
  // Interactive shade-grid (symmetry): { rows, cols, preShaded: [[r,c]…], line }.
  // Student clicks empty cells to shade; answer = the cells they must add
  // (serialised sorted "r-c,r-c").
  grid: { type: mongoose.Schema.Types.Mixed, default: null },
  workedSolution: { type: String, default: '' },
  solutionSteps: { type: [String], default: [] },
  frameworkSkillId: { type: String, default: '' },      // skill tag for mistakes/analytics
  skillName: { type: String, default: '' },             // human label, e.g. 'Fractions of remainder'
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  diagram: { type: mongoose.Schema.Types.Mixed, default: null }, // same {kind,...} shape the SVG renderers read
}, { _id: false });

const testPaperSchema = new mongoose.Schema({
  paperCode: { type: String, required: true, unique: true },   // 'P5-MATH-MOCK-A'
  title: { type: String, required: true },                     // 'P5 Maths — Mid-Year Mock A'
  subject: { type: String, default: 'Mathematics' },
  level: { type: String, default: '' },                        // 'P5'
  // 'mock' = full mixed exam paper; 'challenge' = topic-scoped set of hard
  // questions (the KooBits-style "Challenging" tier — drill one topic's tough
  // problems, usually untimed). `topic` labels a challenge set's focus.
  category: { type: String, enum: ['mock', 'challenge'], default: 'mock' },
  topic: { type: String, default: '' },                        // 'Fractions' (challenge sets)
  durationMinutes: { type: Number, default: 0 },               // 0 = untimed
  description: { type: String, default: '' },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  tags: { type: [String], default: [] },                       // ['mock','mixed-topic','challenge']
  source: { type: String, default: 'authored' },
  sourceRef: { type: String, default: '' },                    // for bulk manage, e.g. 'TaoNan_P5_Prelim_2025'
  questions: { type: [paperQuestionSchema], default: [] },
  totalMarks: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

testPaperSchema.index({ status: 1, level: 1 });

// Keep totalMarks in sync with the embedded questions. Synchronous hook (no
// `next` param) — Mongoose runs it and proceeds; declaring an unused `next`
// threw "next is not a function" on save in this Mongoose version.
testPaperSchema.pre('save', function syncTotalMarks() {
  this.totalMarks = (this.questions || []).reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
});

export default mongoose.model('TestPaper', testPaperSchema);
