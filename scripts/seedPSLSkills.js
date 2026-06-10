import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLSkill from '../models/psl/PSLSkill.js';

const P3_SKILLS = [
  // Part-Whole (4)
  {
    skillId: 'psl-p3-bar-pw-find-whole',
    name: 'Bar model: find the whole',
    description: 'Use a part-whole bar model to find the total when all parts are given.',
    level: 'P3', heuristic: 'bar-model', structure: 'partWhole', unknownPosition: 'whole',
    difficulty: 1,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: [],
    commonMisconceptions: ['psl/missed-number', 'psl/wrong-operation'],
  },
  {
    skillId: 'psl-p3-bar-pw-find-part',
    name: 'Bar model: find a part',
    description: 'Use a part-whole bar model to find a missing part when the whole and one part are given.',
    level: 'P3', heuristic: 'bar-model', structure: 'partWhole', unknownPosition: 'part',
    difficulty: 1,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: [],
    commonMisconceptions: ['psl/wrong-operation', 'psl/used-wrong-numbers'],
  },
  {
    skillId: 'psl-p3-bar-pw-3parts',
    name: 'Bar model: 3-part whole',
    description: 'Use a bar model with three parts to find the missing quantity.',
    level: 'P3', heuristic: 'bar-model', structure: 'partWhole', unknownPosition: 'whole',
    difficulty: 2,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: ['psl-p3-bar-pw-find-whole'],
    commonMisconceptions: ['psl/missed-number', 'psl/included-irrelevant'],
  },
  {
    skillId: 'psl-p3-bar-pw-mul',
    name: 'Bar model: equal parts',
    description: 'Use a bar model with equal parts to find the total using multiplication.',
    level: 'P3', heuristic: 'bar-model', structure: 'partWhole', unknownPosition: 'whole',
    difficulty: 2,
    mathPathPrerequisites: ['mul-tables-6789', 'div-within-tables'],
    pslPrerequisites: ['psl-p3-bar-pw-find-whole'],
    commonMisconceptions: ['psl/wrong-operation', 'psl/arithmetic-error'],
  },

  // Comparison (4)
  {
    skillId: 'psl-p3-bar-comp-find-diff',
    name: 'Bar model: find the difference',
    description: 'Use a comparison bar model to find how much more or less one quantity is than another.',
    level: 'P3', heuristic: 'bar-model', structure: 'comparison', unknownPosition: 'difference',
    difficulty: 1,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: ['psl-p3-bar-pw-find-part'],
    commonMisconceptions: ['psl/wrong-model-type', 'psl/wrong-operation'],
  },
  {
    skillId: 'psl-p3-bar-comp-find-larger',
    name: 'Bar model: find the larger',
    description: 'Use a comparison bar model to find the larger quantity given the smaller and the difference.',
    level: 'P3', heuristic: 'bar-model', structure: 'comparison', unknownPosition: 'larger',
    difficulty: 2,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: ['psl-p3-bar-comp-find-diff'],
    commonMisconceptions: ['psl/wrong-unknown-position', 'psl/wrong-operation'],
  },
  {
    skillId: 'psl-p3-bar-comp-find-smaller',
    name: 'Bar model: find the smaller',
    description: 'Use a comparison bar model to find the smaller quantity given the larger and the difference.',
    level: 'P3', heuristic: 'bar-model', structure: 'comparison', unknownPosition: 'smaller',
    difficulty: 2,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: ['psl-p3-bar-comp-find-diff'],
    commonMisconceptions: ['psl/wrong-unknown-position', 'psl/confused-question'],
  },
  {
    skillId: 'psl-p3-bar-comp-total',
    name: 'Bar model: compare then total',
    description: 'Use a comparison model to find a quantity, then add both to find the total.',
    level: 'P3', heuristic: 'bar-model', structure: 'comparison', unknownPosition: 'larger',
    difficulty: 3,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: ['psl-p3-bar-comp-find-larger'],
    commonMisconceptions: ['psl/misread-unknown', 'psl/wrong-operation'],
  },

  // Two-Step (2)
  {
    skillId: 'psl-p3-twostep-pw-comp',
    name: 'Two-step: part-whole + comparison',
    description: 'Solve a two-step problem that combines part-whole and comparison reasoning.',
    level: 'P3', heuristic: 'bar-model', structure: 'twoStep', unknownPosition: 'difference',
    difficulty: 3,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: ['psl-p3-bar-pw-find-part', 'psl-p3-bar-comp-find-diff'],
    commonMisconceptions: ['psl/wrong-model-type', 'psl/used-wrong-numbers', 'psl/arithmetic-error'],
  },
  {
    skillId: 'psl-p3-twostep-comp-pw',
    name: 'Two-step: comparison + part-whole',
    description: 'Solve a two-step problem that combines comparison and part-whole reasoning.',
    level: 'P3', heuristic: 'bar-model', structure: 'twoStep', unknownPosition: 'whole',
    difficulty: 3,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: ['psl-p3-bar-comp-find-larger', 'psl-p3-bar-pw-find-whole'],
    commonMisconceptions: ['psl/wrong-model-type', 'psl/used-wrong-numbers', 'psl/arithmetic-error'],
  },
];

async function seed() {
  await connectDB();
  let upserted = 0;
  for (const skill of P3_SKILLS) {
    await PSLSkill.findOneAndUpdate(
      { skillId: skill.skillId },
      { $set: skill },
      { upsert: true, new: true },
    );
    upserted++;
  }
  console.log(`Seeded ${upserted} PSL skills.`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
