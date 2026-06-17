import dotenv from 'dotenv';
dotenv.config();

if (process.env.NODE_ENV === "production") {
  console.error("Seed script: refusing to run in production (NODE_ENV=production).");
  process.exit(1);
}
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLSkill from '../models/psl/PSLSkill.js';

const WB_SKILLS = [
  // ══════════════════════════════════════════════════════════════════════
  //  P3 — Work Backwards (2)
  // ══════════════════════════════════════════════════════════════════════
  {
    skillId: 'psl-p3-wb-one-step',
    name: 'Work backwards: single reverse operation',
    description: 'Given a final result and one operation, reverse it to find the starting value.',
    level: 'P3', heuristic: 'work-backwards', structure: 'workBackwards',
    difficulty: 1,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: [],
    commonMisconceptions: ['psl/wrong-operation', 'psl/confused-question'],
  },
  {
    skillId: 'psl-p3-wb-two-step',
    name: 'Work backwards: two reverse operations',
    description: 'Reverse two operations to find the starting value.',
    level: 'P3', heuristic: 'work-backwards', structure: 'workBackwards',
    difficulty: 2,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: ['psl-p3-wb-one-step'],
    commonMisconceptions: ['psl/wrong-operation', 'psl/reversed-steps'],
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P4 — Work Backwards (2)
  // ══════════════════════════════════════════════════════════════════════
  {
    skillId: 'psl-p4-wb-multi-op',
    name: 'Work backwards: mixed operations reverse',
    description: 'Reverse a sequence involving both addition and subtraction (or multiplication and division).',
    level: 'P4', heuristic: 'work-backwards', structure: 'workBackwards',
    difficulty: 2,
    mathPathPrerequisites: ['add-algo-4d', 'mul-tables-6789'],
    pslPrerequisites: ['psl-p3-wb-two-step'],
    commonMisconceptions: ['psl/wrong-operation', 'psl/reversed-steps', 'psl/arithmetic-error'],
  },
  {
    skillId: 'psl-p4-wb-chain',
    name: 'Work backwards: 3-step chain',
    description: 'Reverse three sequential operations to recover the starting value.',
    level: 'P4', heuristic: 'work-backwards', structure: 'workBackwards',
    difficulty: 3,
    mathPathPrerequisites: ['add-algo-4d', 'mul-tables-6789'],
    pslPrerequisites: ['psl-p4-wb-multi-op'],
    commonMisconceptions: ['psl/reversed-steps', 'psl/missed-number', 'psl/arithmetic-error'],
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P5 — Work Backwards (2)
  // ══════════════════════════════════════════════════════════════════════
  {
    skillId: 'psl-p5-wb-fraction',
    name: 'Work backwards: involving fractions',
    description: 'Reverse a fractional operation to find the original amount.',
    level: 'P5', heuristic: 'work-backwards', structure: 'workBackwards',
    difficulty: 3,
    mathPathPrerequisites: ['frac-of-set'],
    pslPrerequisites: ['psl-p4-wb-multi-op'],
    commonMisconceptions: ['psl/fraction-of-wrong-whole', 'psl/wrong-operation'],
  },
  {
    skillId: 'psl-p5-wb-two-person',
    name: 'Work backwards: shared between two people',
    description: 'Work backwards through a sharing or transfer scenario involving two people.',
    level: 'P5', heuristic: 'work-backwards', structure: 'workBackwards',
    difficulty: 3,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: ['psl-p4-wb-chain'],
    commonMisconceptions: ['psl/used-wrong-numbers', 'psl/reversed-steps', 'psl/arithmetic-error'],
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P6 — Work Backwards (2)
  // ══════════════════════════════════════════════════════════════════════
  {
    skillId: 'psl-p6-wb-percentage',
    name: 'Work backwards: involving percentages',
    description: 'Reverse a percentage increase or decrease to find the original amount.',
    level: 'P6', heuristic: 'work-backwards', structure: 'workBackwards',
    difficulty: 3,
    mathPathPrerequisites: ['pct-of-qty'],
    pslPrerequisites: ['psl-p5-wb-fraction'],
    commonMisconceptions: ['psl/percentage-of-wrong-base', 'psl/wrong-operation'],
  },
  {
    skillId: 'psl-p6-wb-complex',
    name: 'Work backwards: multi-step with mixed operations',
    description: 'Reverse a complex chain of mixed operations including multiplication and fractions.',
    level: 'P6', heuristic: 'work-backwards', structure: 'workBackwards',
    difficulty: 3,
    mathPathPrerequisites: ['add-algo-4d', 'mul-tables-6789', 'frac-of-set'],
    pslPrerequisites: ['psl-p5-wb-fraction', 'psl-p5-wb-two-person'],
    commonMisconceptions: ['psl/reversed-steps', 'psl/missed-number', 'psl/arithmetic-error'],
  },
];

async function seed() {
  await connectDB();
  let upserted = 0;
  for (const skill of WB_SKILLS) {
    await PSLSkill.findOneAndUpdate(
      { skillId: skill.skillId },
      { $set: skill },
      { upsert: true, new: true },
    );
    upserted++;
  }
  console.log(`Seeded ${upserted} PSL work-backwards skills.`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
