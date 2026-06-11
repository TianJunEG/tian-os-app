import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLSkill from '../models/psl/PSLSkill.js';

const P4_SKILLS = [
  // Part-Whole (4)
  {
    skillId: 'psl-p4-bar-pw-find-whole',
    name: 'Bar model: find the whole (4-digit)',
    description: 'Use a part-whole bar model to find the total when all parts are given, working with 4-digit numbers.',
    level: 'P4', heuristic: 'bar-model', structure: 'partWhole', unknownPosition: 'whole',
    difficulty: 1,
    mathPathPrerequisites: ['P4-WN-01'],
    pslPrerequisites: [],
    commonMisconceptions: ['psl/missed-number', 'psl/wrong-operation'],
  },
  {
    skillId: 'psl-p4-bar-pw-find-part',
    name: 'Bar model: find a part (4-digit)',
    description: 'Use a part-whole bar model to find a missing part when the whole and one part are given, with 4-digit numbers.',
    level: 'P4', heuristic: 'bar-model', structure: 'partWhole', unknownPosition: 'part',
    difficulty: 1,
    mathPathPrerequisites: ['P4-WN-01'],
    pslPrerequisites: [],
    commonMisconceptions: ['psl/wrong-operation', 'psl/used-wrong-numbers'],
  },
  {
    skillId: 'psl-p4-bar-pw-3parts',
    name: 'Bar model: 3-part whole (larger numbers)',
    description: 'Use a bar model with three parts to find the missing quantity, working with numbers in the thousands.',
    level: 'P4', heuristic: 'bar-model', structure: 'partWhole', unknownPosition: 'whole',
    difficulty: 2,
    mathPathPrerequisites: ['P4-WN-01'],
    pslPrerequisites: ['psl-p4-bar-pw-find-whole'],
    commonMisconceptions: ['psl/missed-number', 'psl/included-irrelevant'],
  },
  {
    skillId: 'psl-p4-bar-pw-mul',
    name: 'Bar model: equal parts (2-digit × 2-digit)',
    description: 'Use a bar model with equal parts to find the total using 2-digit by 2-digit multiplication.',
    level: 'P4', heuristic: 'bar-model', structure: 'partWhole', unknownPosition: 'whole',
    difficulty: 2,
    mathPathPrerequisites: ['P4-WN-01'],
    pslPrerequisites: ['psl-p4-bar-pw-find-whole'],
    commonMisconceptions: ['psl/wrong-operation', 'psl/arithmetic-error'],
  },

  // Comparison (4)
  {
    skillId: 'psl-p4-bar-comp-find-diff',
    name: 'Bar model: find the difference (4-digit)',
    description: 'Use a comparison bar model to find how much more or less one quantity is than another, using 4-digit numbers.',
    level: 'P4', heuristic: 'bar-model', structure: 'comparison', unknownPosition: 'difference',
    difficulty: 1,
    mathPathPrerequisites: ['P4-WN-01'],
    pslPrerequisites: ['psl-p4-bar-pw-find-part'],
    commonMisconceptions: ['psl/wrong-model-type', 'psl/wrong-operation'],
  },
  {
    skillId: 'psl-p4-bar-comp-find-larger',
    name: 'Bar model: find the larger quantity',
    description: 'Use a comparison bar model to find the larger quantity given the smaller and the difference, with larger numbers.',
    level: 'P4', heuristic: 'bar-model', structure: 'comparison', unknownPosition: 'larger',
    difficulty: 2,
    mathPathPrerequisites: ['P4-WN-01'],
    pslPrerequisites: ['psl-p4-bar-comp-find-diff'],
    commonMisconceptions: ['psl/wrong-unknown-position', 'psl/wrong-operation'],
  },
  {
    skillId: 'psl-p4-bar-comp-find-smaller',
    name: 'Bar model: find the smaller quantity',
    description: 'Use a comparison bar model to find the smaller quantity given the larger and the difference, with larger numbers.',
    level: 'P4', heuristic: 'bar-model', structure: 'comparison', unknownPosition: 'smaller',
    difficulty: 2,
    mathPathPrerequisites: ['P4-WN-01'],
    pslPrerequisites: ['psl-p4-bar-comp-find-diff'],
    commonMisconceptions: ['psl/wrong-unknown-position', 'psl/confused-question'],
  },
  {
    skillId: 'psl-p4-bar-comp-total',
    name: 'Bar model: compare then total (harder)',
    description: 'Use a comparison model to find a quantity, then add both to find the total, with 4-digit numbers.',
    level: 'P4', heuristic: 'bar-model', structure: 'comparison', unknownPosition: 'larger',
    difficulty: 3,
    mathPathPrerequisites: ['P4-WN-01'],
    pslPrerequisites: ['psl-p4-bar-comp-find-larger'],
    commonMisconceptions: ['psl/misread-unknown', 'psl/wrong-operation'],
  },

  // Two-Step (2)
  {
    skillId: 'psl-p4-twostep-multi-op',
    name: 'Two-step: mixed operations (×/÷ then +/−)',
    description: 'Solve a two-step problem that uses multiplication or division in the first step, then addition or subtraction.',
    level: 'P4', heuristic: 'bar-model', structure: 'twoStep', unknownPosition: 'whole',
    difficulty: 3,
    mathPathPrerequisites: ['P4-WN-01'],
    pslPrerequisites: ['psl-p4-bar-pw-mul', 'psl-p4-bar-pw-find-whole'],
    commonMisconceptions: ['psl/wrong-model-type', 'psl/used-wrong-numbers', 'psl/arithmetic-error'],
  },
  {
    skillId: 'psl-p4-twostep-fraction-bar',
    name: 'Two-step: fraction of quantity bar model',
    description: 'Use a bar model to find a fraction of a quantity, then solve a follow-up step.',
    level: 'P4', heuristic: 'bar-model', structure: 'twoStep', unknownPosition: 'part',
    difficulty: 3,
    mathPathPrerequisites: ['P4-WN-01'],
    pslPrerequisites: ['psl-p4-bar-pw-find-part', 'psl-p4-bar-comp-find-diff'],
    commonMisconceptions: ['psl/wrong-model-type', 'psl/used-wrong-numbers', 'psl/arithmetic-error'],
  },
];

async function seed() {
  await connectDB();
  let upserted = 0;
  for (const skill of P4_SKILLS) {
    await PSLSkill.findOneAndUpdate(
      { skillId: skill.skillId },
      { $set: skill },
      { upsert: true, new: true },
    );
    upserted++;
  }
  console.log(`Seeded ${upserted} P4 PSL skills.`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
