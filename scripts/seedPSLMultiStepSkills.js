import dotenv from 'dotenv';
dotenv.config();

if (process.env.NODE_ENV === "production") {
  console.error("Seed script: refusing to run in production (NODE_ENV=production).");
  process.exit(1);
}
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLSkill from '../models/psl/PSLSkill.js';

const MS_SKILLS = [
  // ── P3 ──────────────────────────────────────────────────────────────
  {
    skillId: 'psl-p3-ms-two-op-add-sub',
    name: 'Multi-step: add then subtract',
    description: 'Solve a two-operation problem that requires addition followed by subtraction (or vice-versa).',
    level: 'P3', heuristic: 'multi-step', structure: 'multiStep',
    difficulty: 1,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: [],
    commonMisconceptions: ['psl/wrong-operation', 'psl/skipped-step', 'psl/arithmetic-error'],
  },
  {
    skillId: 'psl-p3-ms-two-op-mul-add',
    name: 'Multi-step: multiply then add',
    description: 'Solve a two-operation problem that requires multiplication followed by addition.',
    level: 'P3', heuristic: 'multi-step', structure: 'multiStep',
    difficulty: 2,
    mathPathPrerequisites: ['mul-tables-6789'],
    pslPrerequisites: ['psl-p3-ms-two-op-add-sub'],
    commonMisconceptions: ['psl/wrong-operation', 'psl/skipped-step', 'psl/arithmetic-error'],
  },

  // ── P4 ──────────────────────────────────────────────────────────────
  {
    skillId: 'psl-p4-ms-three-op',
    name: 'Multi-step: 3 operations chain',
    description: 'Solve a problem requiring a chain of three arithmetic operations in sequence.',
    level: 'P4', heuristic: 'multi-step', structure: 'multiStep',
    difficulty: 2,
    mathPathPrerequisites: ['add-algo-4d', 'mul-tables-6789'],
    pslPrerequisites: ['psl-p3-ms-two-op-mul-add'],
    commonMisconceptions: ['psl/skipped-step', 'psl/wrong-operation', 'psl/arithmetic-error'],
  },
  {
    skillId: 'psl-p4-ms-money',
    name: 'Multi-step: money calculation with change',
    description: 'Solve a multi-step money problem involving purchase totals and change.',
    level: 'P4', heuristic: 'multi-step', structure: 'multiStep',
    difficulty: 2,
    mathPathPrerequisites: ['add-algo-4d', 'mul-tables-6789'],
    pslPrerequisites: ['psl-p3-ms-two-op-mul-add'],
    commonMisconceptions: ['psl/wrong-operation', 'psl/used-wrong-numbers', 'psl/arithmetic-error'],
  },

  // ── P5 ──────────────────────────────────────────────────────────────
  {
    skillId: 'psl-p5-ms-decimal-chain',
    name: 'Multi-step: chain with decimals',
    description: 'Solve a multi-step problem where intermediate values involve decimals.',
    level: 'P5', heuristic: 'multi-step', structure: 'multiStep',
    difficulty: 2,
    mathPathPrerequisites: ['dec-add-sub', 'dec-mul-div'],
    pslPrerequisites: ['psl-p4-ms-three-op'],
    commonMisconceptions: ['psl/decimal-alignment', 'psl/skipped-step', 'psl/arithmetic-error'],
  },
  {
    skillId: 'psl-p5-ms-fraction-chain',
    name: 'Multi-step: chain with fractions',
    description: 'Solve a multi-step problem where one or more steps involve fraction operations.',
    level: 'P5', heuristic: 'multi-step', structure: 'multiStep',
    difficulty: 3,
    mathPathPrerequisites: ['frac-add-sub-unlike', 'frac-of-set'],
    pslPrerequisites: ['psl-p5-ms-decimal-chain'],
    commonMisconceptions: ['psl/fraction-of-vs-subtract', 'psl/skipped-step', 'psl/arithmetic-error'],
  },

  // ── P6 ──────────────────────────────────────────────────────────────
  {
    skillId: 'psl-p6-ms-rate-time',
    name: 'Multi-step: rate × time calculations',
    description: 'Solve a multi-step problem involving speed/rate and time to find distance or amount.',
    level: 'P6', heuristic: 'multi-step', structure: 'multiStep',
    difficulty: 3,
    mathPathPrerequisites: ['dec-mul-div'],
    pslPrerequisites: ['psl-p5-ms-decimal-chain'],
    commonMisconceptions: ['psl/wrong-operation', 'psl/unit-mismatch', 'psl/arithmetic-error'],
  },
  {
    skillId: 'psl-p6-ms-discount-tax',
    name: 'Multi-step: discount then GST',
    description: 'Solve a multi-step problem involving percentage discount followed by GST calculation.',
    level: 'P6', heuristic: 'multi-step', structure: 'multiStep',
    difficulty: 3,
    mathPathPrerequisites: ['percent-of-qty'],
    pslPrerequisites: ['psl-p5-ms-decimal-chain'],
    commonMisconceptions: ['psl/percent-of-wrong-base', 'psl/skipped-step', 'psl/arithmetic-error'],
  },
];

async function seed() {
  await connectDB();
  let upserted = 0;
  for (const skill of MS_SKILLS) {
    await PSLSkill.findOneAndUpdate(
      { skillId: skill.skillId },
      { $set: skill },
      { upsert: true, new: true },
    );
    upserted++;
  }
  console.log(`Seeded ${upserted} PSL multi-step skills.`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
