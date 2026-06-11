import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLSkill from '../models/psl/PSLSkill.js';

const BA_SKILLS = [
  // ══════════════════════════════════════════════════════════════════════
  //  P3 — Before-After (2)
  // ══════════════════════════════════════════════════════════════════════
  {
    skillId: 'psl-p3-ba-add',
    name: 'Before-after: gain/increase',
    description: 'Given an initial amount and a gain, find the final amount using a before-after diagram.',
    level: 'P3', heuristic: 'before-after', structure: 'beforeAfter',
    difficulty: 1,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: [],
    commonMisconceptions: ['psl/wrong-operation', 'psl/missed-number'],
  },
  {
    skillId: 'psl-p3-ba-sub',
    name: 'Before-after: lose/decrease',
    description: 'Given an initial amount and a loss, find the final amount using a before-after diagram.',
    level: 'P3', heuristic: 'before-after', structure: 'beforeAfter',
    difficulty: 1,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: [],
    commonMisconceptions: ['psl/wrong-operation', 'psl/used-wrong-numbers'],
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P4 — Before-After (2)
  // ══════════════════════════════════════════════════════════════════════
  {
    skillId: 'psl-p4-ba-multi-change',
    name: 'Before-after: multiple changes',
    description: 'Track two or more changes to an initial amount to find the final amount.',
    level: 'P4', heuristic: 'before-after', structure: 'beforeAfter',
    difficulty: 2,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: ['psl-p3-ba-add', 'psl-p3-ba-sub'],
    commonMisconceptions: ['psl/missed-number', 'psl/wrong-operation', 'psl/arithmetic-error'],
  },
  {
    skillId: 'psl-p4-ba-find-change',
    name: 'Before-after: find the change amount',
    description: 'Given the initial and final amounts, find how much was gained or lost.',
    level: 'P4', heuristic: 'before-after', structure: 'beforeAfter',
    difficulty: 2,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: ['psl-p3-ba-add'],
    commonMisconceptions: ['psl/wrong-operation', 'psl/confused-question'],
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P5 — Before-After (2)
  // ══════════════════════════════════════════════════════════════════════
  {
    skillId: 'psl-p5-ba-fraction-change',
    name: 'Before-after: fractional change',
    description: 'Apply a fractional increase or decrease to an initial amount to find the result.',
    level: 'P5', heuristic: 'before-after', structure: 'beforeAfter',
    difficulty: 2,
    mathPathPrerequisites: ['frac-of-set'],
    pslPrerequisites: ['psl-p4-ba-find-change'],
    commonMisconceptions: ['psl/wrong-operation', 'psl/fraction-of-wrong-whole'],
  },
  {
    skillId: 'psl-p5-ba-two-events',
    name: 'Before-after: two sequential events',
    description: 'Track an amount through two separate events to find the final result.',
    level: 'P5', heuristic: 'before-after', structure: 'beforeAfter',
    difficulty: 3,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: ['psl-p4-ba-multi-change'],
    commonMisconceptions: ['psl/missed-number', 'psl/wrong-operation', 'psl/used-wrong-numbers'],
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P6 — Before-After (2)
  // ══════════════════════════════════════════════════════════════════════
  {
    skillId: 'psl-p6-ba-percentage-change',
    name: 'Before-after: percentage increase/decrease',
    description: 'Apply a percentage increase or decrease to an initial amount.',
    level: 'P6', heuristic: 'before-after', structure: 'beforeAfter',
    difficulty: 3,
    mathPathPrerequisites: ['pct-of-qty'],
    pslPrerequisites: ['psl-p5-ba-fraction-change'],
    commonMisconceptions: ['psl/wrong-operation', 'psl/percentage-of-wrong-base'],
  },
  {
    skillId: 'psl-p6-ba-multi-party',
    name: 'Before-after: multiple parties transfer',
    description: 'Track transfers between multiple people using before-after reasoning.',
    level: 'P6', heuristic: 'before-after', structure: 'beforeAfter',
    difficulty: 3,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: ['psl-p5-ba-two-events'],
    commonMisconceptions: ['psl/used-wrong-numbers', 'psl/missed-number', 'psl/arithmetic-error'],
  },
];

async function seed() {
  await connectDB();
  let upserted = 0;
  for (const skill of BA_SKILLS) {
    await PSLSkill.findOneAndUpdate(
      { skillId: skill.skillId },
      { $set: skill },
      { upsert: true, new: true },
    );
    upserted++;
  }
  console.log(`Seeded ${upserted} PSL before-after skills.`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
