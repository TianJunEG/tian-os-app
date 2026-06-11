import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLSkill from '../models/psl/PSLSkill.js';

const simultaneousSkills = [
  // ── P5 Skills (3) ──────────────────────────────────────────────
  {
    skillId: 'psl-p5-sim-basic',
    name: 'Simultaneous: basic elimination',
    description:
      'Two items, two conditions — find the cost of one item by eliminating the other. E.g., "3 pens + 2 erasers = $11, 1 pen + 2 erasers = $5, find cost of 1 pen."',
    level: 'P5',
    heuristic: 'simultaneous',
    structure: 'simultaneous',
    difficulty: 2,
    mathPathPrerequisites: ['mul-tables-6789', 'div-within-tables', 'add-algo-4d'],
    pslPrerequisites: [],
    commonMisconceptions: [
      'psl/wrong-equation',
      'psl/elimination-error',
      'psl/substitution-error',
      'psl/arithmetic-error',
    ],
  },
  {
    skillId: 'psl-p5-sim-substitution',
    name: 'Simultaneous: substitution',
    description:
      'One equation gives a direct relationship between two unknowns — substitute into the other equation to solve. E.g., "A pen costs twice as much as an eraser; 2 pens + 3 erasers = $14."',
    level: 'P5',
    heuristic: 'simultaneous',
    structure: 'simultaneous',
    difficulty: 2,
    mathPathPrerequisites: ['mul-tables-6789', 'div-within-tables', 'add-algo-4d'],
    pslPrerequisites: ['psl-p5-sim-basic'],
    commonMisconceptions: [
      'psl/wrong-equation',
      'psl/elimination-error',
      'psl/substitution-error',
      'psl/arithmetic-error',
    ],
  },
  {
    skillId: 'psl-p5-sim-sum-diff',
    name: 'Simultaneous: sum and difference',
    description:
      'Given the sum and difference of two unknowns, find each value. E.g., "Ali and Mei have $60 altogether. Ali has $12 more than Mei. How much does Ali have?"',
    level: 'P5',
    heuristic: 'simultaneous',
    structure: 'simultaneous',
    difficulty: 2,
    mathPathPrerequisites: ['mul-tables-6789', 'div-within-tables', 'add-algo-4d'],
    pslPrerequisites: [],
    commonMisconceptions: [
      'psl/wrong-equation',
      'psl/elimination-error',
      'psl/substitution-error',
      'psl/arithmetic-error',
    ],
  },

  // ── P6 Skills (5) ──────────────────────────────────────────────
  {
    skillId: 'psl-p6-sim-multiply-first',
    name: 'Simultaneous: make coefficients equal',
    description:
      'Need to multiply one or both equations by a constant before eliminating. The coefficients do not already match, so a scaling step is required first.',
    level: 'P6',
    heuristic: 'simultaneous',
    structure: 'simultaneous',
    difficulty: 2,
    mathPathPrerequisites: ['mul-tables-6789', 'div-within-tables', 'add-algo-4d'],
    pslPrerequisites: ['psl-p5-sim-basic'],
    commonMisconceptions: [
      'psl/wrong-equation',
      'psl/elimination-error',
      'psl/substitution-error',
      'psl/arithmetic-error',
    ],
  },
  {
    skillId: 'psl-p6-sim-three-items',
    name: 'Simultaneous: three-item',
    description:
      'Three unknowns reduced via given relationships to a two-equation solve. E.g., "A costs twice as much as B; 2A + 3B + 1C = $40 and 1A + 1B + 2C = $25."',
    level: 'P6',
    heuristic: 'simultaneous',
    structure: 'simultaneous',
    difficulty: 3,
    mathPathPrerequisites: ['mul-tables-6789', 'div-within-tables', 'add-algo-4d'],
    pslPrerequisites: ['psl-p5-sim-basic', 'psl-p5-sim-substitution'],
    commonMisconceptions: [
      'psl/wrong-equation',
      'psl/elimination-error',
      'psl/substitution-error',
      'psl/arithmetic-error',
    ],
  },
  {
    skillId: 'psl-p6-sim-age',
    name: 'Simultaneous: age problems',
    description:
      'Age-based simultaneous problems — "Ali is X years older than Mei, their ages sum to Y, find each age." Requires setting up two equations from the age relationship.',
    level: 'P6',
    heuristic: 'simultaneous',
    structure: 'simultaneous',
    difficulty: 2,
    mathPathPrerequisites: ['mul-tables-6789', 'div-within-tables', 'add-algo-4d'],
    pslPrerequisites: ['psl-p5-sim-sum-diff'],
    commonMisconceptions: [
      'psl/wrong-equation',
      'psl/elimination-error',
      'psl/substitution-error',
      'psl/arithmetic-error',
    ],
  },
  {
    skillId: 'psl-p6-sim-money',
    name: 'Simultaneous: money problems',
    description:
      'Coins or notes of two denominations — given the total count and total value, find how many of each denomination. E.g., "20 coins of 50¢ and $1, total value $15."',
    level: 'P6',
    heuristic: 'simultaneous',
    structure: 'simultaneous',
    difficulty: 3,
    mathPathPrerequisites: ['mul-tables-6789', 'div-within-tables', 'add-algo-4d'],
    pslPrerequisites: ['psl-p5-sim-basic', 'psl-p6-sim-multiply-first'],
    commonMisconceptions: [
      'psl/wrong-equation',
      'psl/elimination-error',
      'psl/substitution-error',
      'psl/arithmetic-error',
    ],
  },
  {
    skillId: 'psl-p6-sim-word',
    name: 'Simultaneous: word problem',
    description:
      'Exam-style multi-step word problems requiring simultaneous equation setup — involves reading comprehension, equation formulation, and solving in context.',
    level: 'P6',
    heuristic: 'simultaneous',
    structure: 'simultaneous',
    difficulty: 3,
    mathPathPrerequisites: ['mul-tables-6789', 'div-within-tables', 'add-algo-4d'],
    pslPrerequisites: ['psl-p5-sim-basic', 'psl-p6-sim-multiply-first'],
    commonMisconceptions: [
      'psl/wrong-equation',
      'psl/elimination-error',
      'psl/substitution-error',
      'psl/arithmetic-error',
    ],
  },
];

async function seed() {
  await connectDB();
  console.log('Seeding PSL Simultaneous skills …');

  for (const skill of simultaneousSkills) {
    await PSLSkill.findOneAndUpdate(
      { skillId: skill.skillId },
      skill,
      { upsert: true, new: true }
    );
    console.log(`  ✔ ${skill.skillId}`);
  }

  console.log(`Done — ${simultaneousSkills.length} skills upserted.`);
  await mongoose.connection.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
