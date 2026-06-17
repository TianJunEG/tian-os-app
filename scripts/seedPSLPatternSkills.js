import dotenv from 'dotenv';
dotenv.config();

if (process.env.NODE_ENV === "production") {
  console.error("Seed script: refusing to run in production (NODE_ENV=production).");
  process.exit(1);
}
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLSkill from '../models/psl/PSLSkill.js';

const PATTERN_SKILLS = [
  // ── P4 ──────────────────────────────────────────────────────────────
  {
    skillId: 'psl-p4-pat-constant-diff',
    name: 'Pattern: constant difference',
    description: 'Identify sequences with a fixed gap (e.g., +3, +3, +3) and find the next term.',
    level: 'P4', heuristic: 'pattern-recognition', structure: 'patternRecognition',
    difficulty: 1,
    mathPathPrerequisites: ['add-algo-4d', 'mul-tables-6789', 'div-within-tables'],
    pslPrerequisites: [],
    commonMisconceptions: ['psl/wrong-pattern-rule', 'psl/pattern-arithmetic-error', 'psl/wrong-nth-term', 'psl/arithmetic-error'],
  },
  {
    skillId: 'psl-p4-pat-repeated',
    name: 'Pattern: repeating pattern',
    description: 'Identify cyclic/repeating patterns and find the nth element.',
    level: 'P4', heuristic: 'pattern-recognition', structure: 'patternRecognition',
    difficulty: 2,
    mathPathPrerequisites: ['add-algo-4d', 'mul-tables-6789', 'div-within-tables'],
    pslPrerequisites: [],
    commonMisconceptions: ['psl/wrong-pattern-rule', 'psl/pattern-arithmetic-error', 'psl/wrong-nth-term', 'psl/arithmetic-error'],
  },

  // ── P5 ──────────────────────────────────────────────────────────────
  {
    skillId: 'psl-p5-pat-growing',
    name: 'Pattern: growing difference',
    description: 'Identify sequences where differences increase by a fixed amount each time (triangular-style) and find the next term.',
    level: 'P5', heuristic: 'pattern-recognition', structure: 'patternRecognition',
    difficulty: 2,
    mathPathPrerequisites: ['add-algo-4d', 'mul-tables-6789', 'div-within-tables'],
    pslPrerequisites: ['psl-p4-pat-constant-diff'],
    commonMisconceptions: ['psl/wrong-pattern-rule', 'psl/pattern-arithmetic-error', 'psl/wrong-nth-term', 'psl/arithmetic-error'],
  },
  {
    skillId: 'psl-p5-pat-multiply',
    name: 'Pattern: multiply pattern',
    description: 'Identify geometric-style sequences (×2, ×3, etc.) and find the next term.',
    level: 'P5', heuristic: 'pattern-recognition', structure: 'patternRecognition',
    difficulty: 2,
    mathPathPrerequisites: ['add-algo-4d', 'mul-tables-6789', 'div-within-tables'],
    pslPrerequisites: ['psl-p4-pat-constant-diff'],
    commonMisconceptions: ['psl/wrong-pattern-rule', 'psl/pattern-arithmetic-error', 'psl/wrong-nth-term', 'psl/arithmetic-error'],
  },
  {
    skillId: 'psl-p5-pat-nth-term',
    name: 'Pattern: find nth term',
    description: 'Given a pattern rule, compute the nth term directly without listing all terms.',
    level: 'P5', heuristic: 'pattern-recognition', structure: 'patternRecognition',
    difficulty: 3,
    mathPathPrerequisites: ['add-algo-4d', 'mul-tables-6789', 'div-within-tables'],
    pslPrerequisites: ['psl-p4-pat-constant-diff', 'psl-p5-pat-growing'],
    commonMisconceptions: ['psl/wrong-pattern-rule', 'psl/pattern-arithmetic-error', 'psl/wrong-nth-term', 'psl/arithmetic-error'],
  },

  // ── P6 ──────────────────────────────────────────────────────────────
  {
    skillId: 'psl-p6-pat-algebraic',
    name: 'Pattern: algebraic pattern',
    description: 'Express the nth term as a formula (e.g., 2n+1) and use it to find large-n values.',
    level: 'P6', heuristic: 'pattern-recognition', structure: 'patternRecognition',
    difficulty: 3,
    mathPathPrerequisites: ['add-algo-4d', 'mul-tables-6789', 'div-within-tables'],
    pslPrerequisites: ['psl-p5-pat-nth-term'],
    commonMisconceptions: ['psl/wrong-pattern-rule', 'psl/pattern-arithmetic-error', 'psl/wrong-nth-term', 'psl/arithmetic-error'],
  },
  {
    skillId: 'psl-p6-pat-two-variable',
    name: 'Pattern: two-variable pattern',
    description: 'Given a table of x,y values, find the relationship between them and determine a missing value.',
    level: 'P6', heuristic: 'pattern-recognition', structure: 'patternRecognition',
    difficulty: 3,
    mathPathPrerequisites: ['add-algo-4d', 'mul-tables-6789', 'div-within-tables'],
    pslPrerequisites: ['psl-p6-pat-algebraic'],
    commonMisconceptions: ['psl/wrong-pattern-rule', 'psl/pattern-arithmetic-error', 'psl/wrong-nth-term', 'psl/arithmetic-error'],
  },
];

async function seed() {
  await connectDB();
  let upserted = 0;
  for (const skill of PATTERN_SKILLS) {
    await PSLSkill.findOneAndUpdate(
      { skillId: skill.skillId },
      { $set: skill },
      { upsert: true, new: true },
    );
    upserted++;
  }
  console.log(`Seeded ${upserted} PSL pattern-recognition skills.`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
