import dotenv from 'dotenv';
dotenv.config();

if (process.env.NODE_ENV === "production") {
  console.error("Seed script: refusing to run in production (NODE_ENV=production).");
  process.exit(1);
}
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLSkill from '../models/psl/PSLSkill.js';

const P5_SKILLS = [
  // Fraction bar (3)
  {
    skillId: 'psl-p5-bar-frac-whole',
    name: 'Fraction bar: find total from fraction',
    description: 'Use a fraction bar model to find the whole when a fraction of the quantity is given.',
    level: 'P5', heuristic: 'bar-model', structure: 'fraction', unknownPosition: 'whole',
    difficulty: 1,
    mathPathPrerequisites: ['frac-of-set'],
    pslPrerequisites: [],
    commonMisconceptions: ['psl/wrong-operation', 'psl/fraction-invert'],
  },
  {
    skillId: 'psl-p5-bar-frac-part',
    name: 'Fraction bar: find a fraction of a quantity',
    description: 'Use a fraction bar model to find a fraction of a given total.',
    level: 'P5', heuristic: 'bar-model', structure: 'fraction', unknownPosition: 'part',
    difficulty: 1,
    mathPathPrerequisites: ['frac-of-set'],
    pslPrerequisites: [],
    commonMisconceptions: ['psl/wrong-operation', 'psl/used-wrong-numbers'],
  },
  {
    skillId: 'psl-p5-bar-frac-remainder',
    name: 'Fraction bar: find the remainder',
    description: 'Use a fraction bar model to find the remainder after a fraction is taken away.',
    level: 'P5', heuristic: 'bar-model', structure: 'fraction', unknownPosition: 'remainder',
    difficulty: 2,
    mathPathPrerequisites: ['frac-of-set'],
    pslPrerequisites: ['psl-p5-bar-frac-part'],
    commonMisconceptions: ['psl/wrong-operation', 'psl/forgot-remainder-step'],
  },

  // Ratio bar (2)
  {
    skillId: 'psl-p5-bar-ratio-share',
    name: 'Ratio bar: share in a given ratio',
    description: 'Use a ratio bar model to divide a total into parts according to a given ratio.',
    level: 'P5', heuristic: 'bar-model', structure: 'ratio', unknownPosition: 'part',
    difficulty: 2,
    mathPathPrerequisites: ['frac-of-set', 'div-within-tables'],
    pslPrerequisites: [],
    commonMisconceptions: ['psl/wrong-operation', 'psl/ratio-total-units'],
  },
  {
    skillId: 'psl-p5-bar-ratio-diff',
    name: 'Ratio bar: find difference given ratio and total',
    description: 'Use a ratio bar model to find the difference between two shares when ratio and total are given.',
    level: 'P5', heuristic: 'bar-model', structure: 'ratio', unknownPosition: 'difference',
    difficulty: 2,
    mathPathPrerequisites: ['frac-of-set', 'div-within-tables'],
    pslPrerequisites: ['psl-p5-bar-ratio-share'],
    commonMisconceptions: ['psl/wrong-operation', 'psl/ratio-total-units', 'psl/used-wrong-numbers'],
  },

  // Comparison multiplier (1)
  {
    skillId: 'psl-p5-bar-comp-multi',
    name: 'Comparison: N times as many',
    description: 'Use a comparison bar model to solve "N times as many" problems.',
    level: 'P5', heuristic: 'bar-model', structure: 'comparison', unknownPosition: 'larger',
    difficulty: 2,
    mathPathPrerequisites: ['mul-tables-6789'],
    pslPrerequisites: [],
    commonMisconceptions: ['psl/wrong-operation', 'psl/times-vs-more'],
  },

  // Two-Step (2)
  {
    skillId: 'psl-p5-bar-twostep-frac',
    name: 'Two-step: fraction then comparison',
    description: 'Solve a two-step problem that uses a fraction bar first, then a comparison.',
    level: 'P5', heuristic: 'bar-model', structure: 'twoStep', unknownPosition: 'difference',
    difficulty: 3,
    mathPathPrerequisites: ['frac-of-set'],
    pslPrerequisites: ['psl-p5-bar-frac-part', 'psl-p5-bar-frac-remainder'],
    commonMisconceptions: ['psl/wrong-model-type', 'psl/used-wrong-numbers', 'psl/arithmetic-error'],
  },
  {
    skillId: 'psl-p5-bar-twostep-ratio',
    name: 'Two-step: ratio then total/difference',
    description: 'Solve a two-step problem that uses ratio sharing, then finds total or difference.',
    level: 'P5', heuristic: 'bar-model', structure: 'twoStep', unknownPosition: 'whole',
    difficulty: 3,
    mathPathPrerequisites: ['frac-of-set', 'div-within-tables'],
    pslPrerequisites: ['psl-p5-bar-ratio-share', 'psl-p5-bar-ratio-diff'],
    commonMisconceptions: ['psl/wrong-model-type', 'psl/ratio-total-units', 'psl/arithmetic-error'],
  },
];

async function seed() {
  await connectDB();
  let upserted = 0;
  for (const skill of P5_SKILLS) {
    await PSLSkill.findOneAndUpdate(
      { skillId: skill.skillId },
      { $set: skill },
      { upsert: true, new: true },
    );
    upserted++;
  }
  console.log(`Seeded ${upserted} P5 PSL skills.`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
