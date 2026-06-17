import dotenv from 'dotenv';
dotenv.config();

if (process.env.NODE_ENV === "production") {
  console.error("Seed script: refusing to run in production (NODE_ENV=production).");
  process.exit(1);
}
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLSkill from '../models/psl/PSLSkill.js';

const RATIO_SKILLS = [
  // ── P4 (3 skills, difficulty 1–2) ──
  {
    skillId: 'psl-p4-ratio-simple',
    name: 'Ratio: equal sharing',
    description: 'Split a total into 2 parts given a ratio (e.g., 3:2).',
    level: 'P4',
    heuristic: 'ratio',
    structure: 'ratio',
    difficulty: 1,
    mathPathPrerequisites: ['mul-tables-6789', 'div-within-tables'],
    pslPrerequisites: [],
    commonMisconceptions: [
      'psl/wrong-ratio-order',
      'psl/forgot-total-parts',
      'psl/arithmetic-error',
    ],
  },
  {
    skillId: 'psl-p4-ratio-find-total',
    name: 'Ratio: find total from parts',
    description: 'Given a ratio and one part\'s value, find the total.',
    level: 'P4',
    heuristic: 'ratio',
    structure: 'ratio',
    difficulty: 1,
    mathPathPrerequisites: ['mul-tables-6789', 'div-within-tables'],
    pslPrerequisites: ['psl-p4-ratio-simple'],
    commonMisconceptions: [
      'psl/forgot-total-parts',
      'psl/wrong-operation',
      'psl/arithmetic-error',
    ],
  },
  {
    skillId: 'psl-p4-ratio-compare',
    name: 'Ratio: compare quantities',
    description: 'Given a ratio and total, find how much more one part has than the other.',
    level: 'P4',
    heuristic: 'ratio',
    structure: 'ratio',
    difficulty: 2,
    mathPathPrerequisites: ['mul-tables-6789', 'div-within-tables'],
    pslPrerequisites: ['psl-p4-ratio-simple', 'psl-p4-ratio-find-total'],
    commonMisconceptions: [
      'psl/wrong-ratio-order',
      'psl/forgot-total-parts',
      'psl/wrong-operation',
      'psl/arithmetic-error',
    ],
  },

  // ── P5 (3 skills, difficulty 2–3) ──
  {
    skillId: 'psl-p5-ratio-3way',
    name: 'Ratio: three-way split',
    description: 'Divide a quantity among 3 parties in a given ratio.',
    level: 'P5',
    heuristic: 'ratio',
    structure: 'ratio',
    difficulty: 2,
    mathPathPrerequisites: ['mul-tables-6789', 'div-within-tables'],
    pslPrerequisites: ['psl-p4-ratio-simple', 'psl-p4-ratio-compare'],
    commonMisconceptions: [
      'psl/forgot-total-parts',
      'psl/wrong-operation',
      'psl/arithmetic-error',
    ],
  },
  {
    skillId: 'psl-p5-ratio-change',
    name: 'Ratio: changed ratio',
    description: 'The ratio changes after an event; find new or original amounts.',
    level: 'P5',
    heuristic: 'ratio',
    structure: 'ratio',
    difficulty: 3,
    mathPathPrerequisites: ['mul-tables-6789', 'div-within-tables'],
    pslPrerequisites: ['psl-p5-ratio-3way'],
    commonMisconceptions: [
      'psl/wrong-ratio-order',
      'psl/forgot-total-parts',
      'psl/wrong-operation',
      'psl/arithmetic-error',
    ],
  },
  {
    skillId: 'psl-p5-ratio-fraction',
    name: 'Ratio: ratio to fraction',
    description: 'Express one part as a fraction of the whole and compute the value.',
    level: 'P5',
    heuristic: 'ratio',
    structure: 'ratio',
    difficulty: 2,
    mathPathPrerequisites: ['mul-tables-6789', 'div-within-tables', 'frac-proper-add'],
    pslPrerequisites: ['psl-p4-ratio-find-total', 'psl-p5-ratio-3way'],
    commonMisconceptions: [
      'psl/forgot-total-parts',
      'psl/wrong-operation',
      'psl/ratio-fraction-confusion',
      'psl/arithmetic-error',
    ],
  },

  // ── P6 (3 skills, difficulty 2–3) ──
  {
    skillId: 'psl-p6-ratio-multi-step',
    name: 'Ratio: multi-step ratio',
    description: 'Combine ratio reasoning with another operation (e.g., difference, then ratio split).',
    level: 'P6',
    heuristic: 'ratio',
    structure: 'ratio',
    difficulty: 2,
    mathPathPrerequisites: ['mul-tables-6789', 'div-within-tables', 'ratio-simplify'],
    pslPrerequisites: ['psl-p5-ratio-change', 'psl-p5-ratio-fraction'],
    commonMisconceptions: [
      'psl/wrong-operation',
      'psl/forgot-total-parts',
      'psl/arithmetic-error',
    ],
  },
  {
    skillId: 'psl-p6-ratio-percent',
    name: 'Ratio: ratio & percentage',
    description: 'Convert between ratio and percentage in word problems.',
    level: 'P6',
    heuristic: 'ratio',
    structure: 'ratio',
    difficulty: 3,
    mathPathPrerequisites: ['mul-tables-6789', 'div-within-tables', 'frac-proper-add', 'ratio-simplify'],
    pslPrerequisites: ['psl-p5-ratio-fraction', 'psl-p6-ratio-multi-step'],
    commonMisconceptions: [
      'psl/wrong-operation',
      'psl/ratio-percent-confusion',
      'psl/arithmetic-error',
    ],
  },
  {
    skillId: 'psl-p6-ratio-unchanged',
    name: 'Ratio: unchanged quantity',
    description: 'One quantity stays constant while the ratio changes; find the other quantity.',
    level: 'P6',
    heuristic: 'ratio',
    structure: 'ratio',
    difficulty: 3,
    mathPathPrerequisites: ['mul-tables-6789', 'div-within-tables', 'ratio-simplify'],
    pslPrerequisites: ['psl-p5-ratio-change', 'psl-p6-ratio-multi-step'],
    commonMisconceptions: [
      'psl/wrong-ratio-order',
      'psl/forgot-total-parts',
      'psl/unchanged-qty-confusion',
      'psl/arithmetic-error',
    ],
  },
];

async function seed() {
  await connectDB();
  let upserted = 0;
  for (const skill of RATIO_SKILLS) {
    await PSLSkill.findOneAndUpdate(
      { skillId: skill.skillId },
      { $set: skill },
      { upsert: true, new: true }
    );
    upserted++;
  }
  console.log(`Seeded ${upserted} PSL ratio skills.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
