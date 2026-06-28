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
  marks: { type: Number, default: 1 },
  type: { type: String, enum: ['mcq', 'short_answer'], default: 'short_answer' },
  stem: { type: String, required: true },
  choices: { type: [String], default: [] },             // MCQ options
  answer: { type: String, required: true },             // canonical answer (never sent mid-paper)
  unit: { type: String, default: '' },                  // e.g. 'cm', '$'
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

// Keep totalMarks in sync with the embedded questions.
testPaperSchema.pre('save', function syncTotalMarks(next) {
  this.totalMarks = (this.questions || []).reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
  next();
});

export default mongoose.model('TestPaper', testPaperSchema);
