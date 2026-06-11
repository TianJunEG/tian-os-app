import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLSkill from '../models/psl/PSLSkill.js';

const GC_SKILLS = [
  // ── P4 ──────────────────────────────────────────────────────────────
  {
    skillId: 'psl-p4-gc-sum-diff',
    name: 'Guess & check: given sum and difference',
    description: 'Use supposition to find two unknowns when their sum and difference are given.',
    level: 'P4', heuristic: 'guess-check', structure: 'guessCheck',
    difficulty: 2,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: [],
    commonMisconceptions: ['psl/wrong-operation', 'psl/forgot-halving', 'psl/used-wrong-numbers'],
  },
  {
    skillId: 'psl-p4-gc-items-total',
    name: 'Guess & check: two item types with total',
    description: 'Use guess-and-check to find quantities of two item types given their total cost and count.',
    level: 'P4', heuristic: 'guess-check', structure: 'guessCheck',
    difficulty: 2,
    mathPathPrerequisites: ['add-algo-4d', 'mul-tables-6789'],
    pslPrerequisites: [],
    commonMisconceptions: ['psl/wrong-operation', 'psl/used-wrong-numbers', 'psl/arithmetic-error'],
  },

  // ── P5 ──────────────────────────────────────────────────────────────
  {
    skillId: 'psl-p5-gc-coins',
    name: 'Guess & check: coin/note combinations',
    description: 'Use guess-and-check to find the number of each coin/note denomination given total value and total count.',
    level: 'P5', heuristic: 'guess-check', structure: 'guessCheck',
    difficulty: 3,
    mathPathPrerequisites: ['mul-tables-6789', 'add-algo-4d'],
    pslPrerequisites: ['psl-p4-gc-items-total'],
    commonMisconceptions: ['psl/wrong-operation', 'psl/used-wrong-numbers', 'psl/arithmetic-error'],
  },
  {
    skillId: 'psl-p5-gc-ages',
    name: 'Guess & check: age-related conditions',
    description: 'Use supposition to find ages that satisfy two given conditions (sum and ratio or difference).',
    level: 'P5', heuristic: 'guess-check', structure: 'guessCheck',
    difficulty: 3,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: ['psl-p4-gc-sum-diff'],
    commonMisconceptions: ['psl/forgot-halving', 'psl/used-wrong-numbers', 'psl/arithmetic-error'],
  },

  // ── P6 ──────────────────────────────────────────────────────────────
  {
    skillId: 'psl-p6-gc-simultaneous',
    name: 'Supposition: two conditions',
    description: 'Use the supposition method to solve a problem with two simultaneous conditions.',
    level: 'P6', heuristic: 'guess-check', structure: 'guessCheck',
    difficulty: 3,
    mathPathPrerequisites: ['add-algo-4d', 'mul-tables-6789'],
    pslPrerequisites: ['psl-p5-gc-coins'],
    commonMisconceptions: ['psl/wrong-assumption', 'psl/wrong-operation', 'psl/arithmetic-error'],
  },
  {
    skillId: 'psl-p6-gc-excess-short',
    name: 'Supposition: excess and shortage method',
    description: 'Use excess-and-shortage reasoning to find an unknown when distribution leads to leftover or deficit.',
    level: 'P6', heuristic: 'guess-check', structure: 'guessCheck',
    difficulty: 3,
    mathPathPrerequisites: ['add-algo-4d', 'mul-tables-6789'],
    pslPrerequisites: ['psl-p6-gc-simultaneous'],
    commonMisconceptions: ['psl/wrong-assumption', 'psl/excess-shortage-mix', 'psl/arithmetic-error'],
  },
];

async function seed() {
  await connectDB();
  let upserted = 0;
  for (const skill of GC_SKILLS) {
    await PSLSkill.findOneAndUpdate(
      { skillId: skill.skillId },
      { $set: skill },
      { upsert: true, new: true },
    );
    upserted++;
  }
  console.log(`Seeded ${upserted} PSL guess-check skills.`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
