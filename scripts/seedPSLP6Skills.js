import dotenv from 'dotenv';
dotenv.config();

if (process.env.NODE_ENV === "production") {
  console.error("Seed script: refusing to run in production (NODE_ENV=production).");
  process.exit(1);
}
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLSkill from '../models/psl/PSLSkill.js';

const P6_SKILLS = [
  // Percentage bar (2)
  {
    skillId: 'psl-p6-bar-pct-find',
    name: 'Percentage bar: find percentage of quantity',
    description: 'Use a percentage bar model to find a percentage of a given quantity.',
    level: 'P6', heuristic: 'bar-model', structure: 'percentage', unknownPosition: 'part',
    difficulty: 1,
    mathPathPrerequisites: ['pct-of-qty'],
    pslPrerequisites: [],
    commonMisconceptions: ['psl/wrong-operation', 'psl/pct-decimal-error'],
  },
  {
    skillId: 'psl-p6-bar-pct-whole',
    name: 'Percentage bar: find whole from percentage',
    description: 'Use a percentage bar model to find the whole when a percentage and its value are given.',
    level: 'P6', heuristic: 'bar-model', structure: 'percentage', unknownPosition: 'whole',
    difficulty: 2,
    mathPathPrerequisites: ['pct-of-qty'],
    pslPrerequisites: ['psl-p6-bar-pct-find'],
    commonMisconceptions: ['psl/wrong-operation', 'psl/pct-decimal-error', 'psl/fraction-invert'],
  },

  // Ratio bar (2)
  {
    skillId: 'psl-p6-bar-ratio-3way',
    name: 'Ratio bar: three-way ratio sharing',
    description: 'Use a ratio bar model to share a quantity among three parties in a given ratio.',
    level: 'P6', heuristic: 'bar-model', structure: 'ratio', unknownPosition: 'part',
    difficulty: 2,
    mathPathPrerequisites: ['frac-of-set', 'div-within-tables'],
    pslPrerequisites: [],
    commonMisconceptions: ['psl/ratio-total-units', 'psl/wrong-operation'],
  },
  {
    skillId: 'psl-p6-bar-ratio-change',
    name: 'Ratio bar: ratio after change',
    description: 'Use a ratio bar model to find quantities after a transfer, addition, or removal changes the ratio.',
    level: 'P6', heuristic: 'bar-model', structure: 'ratio', unknownPosition: 'part',
    difficulty: 3,
    mathPathPrerequisites: ['frac-of-set', 'div-within-tables'],
    pslPrerequisites: ['psl-p6-bar-ratio-3way'],
    commonMisconceptions: ['psl/ratio-total-units', 'psl/used-wrong-numbers', 'psl/forgot-remainder-step'],
  },

  // Units / parts (1)
  {
    skillId: 'psl-p6-bar-units',
    name: 'Units/parts: find value of one unit',
    description: 'Use a bar model to find the value of one unit when a relationship between units is given.',
    level: 'P6', heuristic: 'bar-model', structure: 'units', unknownPosition: 'unit',
    difficulty: 2,
    mathPathPrerequisites: ['div-within-tables'],
    pslPrerequisites: [],
    commonMisconceptions: ['psl/wrong-operation', 'psl/used-wrong-numbers'],
  },

  // Algebra bar (1)
  {
    skillId: 'psl-p6-bar-algebra',
    name: 'Algebra bar: unknown quantity',
    description: 'Use a bar model with an unknown to set up and solve an algebraic relationship.',
    level: 'P6', heuristic: 'bar-model', structure: 'algebra', unknownPosition: 'unknown',
    difficulty: 3,
    mathPathPrerequisites: ['algebra-expr'],
    pslPrerequisites: ['psl-p6-bar-units'],
    commonMisconceptions: ['psl/wrong-operation', 'psl/used-wrong-numbers', 'psl/algebra-setup'],
  },

  // Two-Step (2)
  {
    skillId: 'psl-p6-bar-twostep-pct',
    name: 'Two-step: percentage then difference/total',
    description: 'Solve a two-step problem involving percentage and then finding a difference or total.',
    level: 'P6', heuristic: 'bar-model', structure: 'twoStep', unknownPosition: 'difference',
    difficulty: 3,
    mathPathPrerequisites: ['pct-of-qty'],
    pslPrerequisites: ['psl-p6-bar-pct-find', 'psl-p6-bar-pct-whole'],
    commonMisconceptions: ['psl/wrong-model-type', 'psl/pct-decimal-error', 'psl/arithmetic-error'],
  },
  {
    skillId: 'psl-p6-bar-twostep-ratio',
    name: 'Two-step: ratio then multi-step',
    description: 'Solve a two-step problem that uses ratio sharing, then a further calculation.',
    level: 'P6', heuristic: 'bar-model', structure: 'twoStep', unknownPosition: 'whole',
    difficulty: 3,
    mathPathPrerequisites: ['frac-of-set', 'div-within-tables'],
    pslPrerequisites: ['psl-p6-bar-ratio-3way'],
    commonMisconceptions: ['psl/wrong-model-type', 'psl/ratio-total-units', 'psl/arithmetic-error'],
  },
];

async function seed() {
  await connectDB();
  let upserted = 0;
  for (const skill of P6_SKILLS) {
    await PSLSkill.findOneAndUpdate(
      { skillId: skill.skillId },
      { $set: skill },
      { upsert: true, new: true },
    );
    upserted++;
  }
  console.log(`Seeded ${upserted} P6 PSL skills.`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
