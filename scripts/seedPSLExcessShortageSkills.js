import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLSkill from '../models/psl/PSLSkill.js';

const excessShortageSkills = [
  // ── P5 Skills (3) ──────────────────────────────────────────────
  {
    skillId: 'psl-p5-es-basic',
    name: 'Excess & shortage: basic',
    description:
      'Straightforward excess-shortage problems: distribute items among people, one way gives an excess, the other gives a shortage. Find the number of items or people.',
    level: 'P5',
    heuristic: 'excess-shortage',
    structure: 'excessShortage',
    difficulty: 2,
    mathPathPrerequisites: ['mul-tables-6789', 'div-within-tables', 'add-algo-4d'],
    pslPrerequisites: [],
    commonMisconceptions: [
      'psl/confused-excess-shortage',
      'psl/wrong-operation',
      'psl/arithmetic-error',
      'psl/misidentified-unknown',
    ],
  },
  {
    skillId: 'psl-p5-es-both-excess',
    name: 'Excess & shortage: two excesses',
    description:
      'Both distributions give an excess (or both give a shortage). Use the difference between the two excess/shortage values to find the count.',
    level: 'P5',
    heuristic: 'excess-shortage',
    structure: 'excessShortage',
    difficulty: 2,
    mathPathPrerequisites: ['mul-tables-6789', 'div-within-tables', 'add-algo-4d'],
    pslPrerequisites: ['psl-p5-es-basic'],
    commonMisconceptions: [
      'psl/confused-excess-shortage',
      'psl/wrong-operation',
      'psl/arithmetic-error',
      'psl/misidentified-unknown',
    ],
  },
  {
    skillId: 'psl-p5-es-equal-share',
    name: 'Excess & shortage: equal distribution',
    description:
      'Find the amount each person gets when items are distributed equally. Combines excess-shortage reasoning with division.',
    level: 'P5',
    heuristic: 'excess-shortage',
    structure: 'excessShortage',
    difficulty: 3,
    mathPathPrerequisites: ['mul-tables-6789', 'div-within-tables', 'add-algo-4d'],
    pslPrerequisites: ['psl-p5-es-basic'],
    commonMisconceptions: [
      'psl/confused-excess-shortage',
      'psl/wrong-operation',
      'psl/arithmetic-error',
      'psl/misidentified-unknown',
    ],
  },

  // ── P6 Skills (4) ──────────────────────────────────────────────
  {
    skillId: 'psl-p6-es-multi-item',
    name: 'Excess & shortage: multiple items',
    description:
      'Excess-shortage problems involving two different item types. Requires tracking separate excess/shortage conditions for each item to solve.',
    level: 'P6',
    heuristic: 'excess-shortage',
    structure: 'excessShortage',
    difficulty: 2,
    mathPathPrerequisites: ['mul-tables-6789', 'div-within-tables', 'add-algo-4d'],
    pslPrerequisites: ['psl-p5-es-basic', 'psl-p5-es-both-excess'],
    commonMisconceptions: [
      'psl/confused-excess-shortage',
      'psl/wrong-operation',
      'psl/arithmetic-error',
      'psl/misidentified-unknown',
    ],
  },
  {
    skillId: 'psl-p6-es-combined',
    name: 'Excess & shortage: combined with other info',
    description:
      'Excess-shortage where an additional piece of information (e.g. total cost, a rate, a constraint) must be used alongside the excess/shortage relationship to find the final answer.',
    level: 'P6',
    heuristic: 'excess-shortage',
    structure: 'excessShortage',
    difficulty: 3,
    mathPathPrerequisites: ['mul-tables-6789', 'div-within-tables', 'add-algo-4d'],
    pslPrerequisites: ['psl-p5-es-basic'],
    commonMisconceptions: [
      'psl/confused-excess-shortage',
      'psl/wrong-operation',
      'psl/arithmetic-error',
      'psl/misidentified-unknown',
    ],
  },
  {
    skillId: 'psl-p6-es-grouping',
    name: 'Excess & shortage: grouping',
    description:
      'Distribute items into groups where different group sizes yield different remainder conditions. Apply excess-shortage logic to determine the number of groups or items.',
    level: 'P6',
    heuristic: 'excess-shortage',
    structure: 'excessShortage',
    difficulty: 3,
    mathPathPrerequisites: ['mul-tables-6789', 'div-within-tables', 'add-algo-4d'],
    pslPrerequisites: ['psl-p5-es-basic', 'psl-p5-es-both-excess'],
    commonMisconceptions: [
      'psl/confused-excess-shortage',
      'psl/wrong-operation',
      'psl/arithmetic-error',
      'psl/misidentified-unknown',
    ],
  },
  {
    skillId: 'psl-p6-es-word-problem',
    name: 'Excess & shortage: real-world context',
    description:
      'Exam-style multi-step word problems that require excess-shortage reasoning embedded within a realistic scenario. May combine with other heuristics or arithmetic steps.',
    level: 'P6',
    heuristic: 'excess-shortage',
    structure: 'excessShortage',
    difficulty: 3,
    mathPathPrerequisites: ['mul-tables-6789', 'div-within-tables', 'add-algo-4d'],
    pslPrerequisites: ['psl-p5-es-basic', 'psl-p6-es-combined'],
    commonMisconceptions: [
      'psl/confused-excess-shortage',
      'psl/wrong-operation',
      'psl/arithmetic-error',
      'psl/misidentified-unknown',
    ],
  },
];

async function seed() {
  await connectDB();
  console.log('Seeding PSL Excess & Shortage skills …');

  for (const skill of excessShortageSkills) {
    await PSLSkill.findOneAndUpdate(
      { skillId: skill.skillId },
      skill,
      { upsert: true, new: true }
    );
    console.log(`  ✔ ${skill.skillId}`);
  }

  console.log(`Done — ${excessShortageSkills.length} skills upserted.`);
  await mongoose.connection.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
