import dotenv from 'dotenv';
dotenv.config();

if (process.env.NODE_ENV === "production") {
  console.error("Seed script: refusing to run in production (NODE_ENV=production).");
  process.exit(1);
}
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLSkill from '../models/psl/PSLSkill.js';

const dataInterpSkills = [
  // ── P4 (3 skills, difficulty 1–2) ──────────────────────────────
  {
    skillId: 'psl-p4-di-table-read',
    name: 'Data: read a table',
    description:
      'Extract and compute from a table (sum, difference). Students read values from rows/columns and perform basic arithmetic to answer questions.',
    level: 'P4',
    heuristic: 'data-interpretation',
    structure: 'dataInterpretation',
    difficulty: 1,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: [],
    commonMisconceptions: [
      'psl/misread-data',
      'psl/wrong-operation',
      'psl/arithmetic-error',
    ],
  },
  {
    skillId: 'psl-p4-di-bar-chart',
    name: 'Data: bar chart',
    description:
      'Read bar chart values, compare or compute totals. Students identify bar heights, find differences between categories, and calculate combined amounts.',
    level: 'P4',
    heuristic: 'data-interpretation',
    structure: 'dataInterpretation',
    difficulty: 1,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: ['psl-p4-di-table-read'],
    commonMisconceptions: [
      'psl/misread-data',
      'psl/wrong-operation',
      'psl/arithmetic-error',
    ],
  },
  {
    skillId: 'psl-p4-di-line-graph',
    name: 'Data: line graph',
    description:
      'Read trend data from a line graph, find increase or decrease. Students trace data points over time and compute changes between periods.',
    level: 'P4',
    heuristic: 'data-interpretation',
    structure: 'dataInterpretation',
    difficulty: 2,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: ['psl-p4-di-bar-chart'],
    commonMisconceptions: [
      'psl/misread-data',
      'psl/wrong-operation',
      'psl/arithmetic-error',
      'psl/used-wrong-numbers',
    ],
  },

  // ── P5 (3 skills, difficulty 2–3) ──────────────────────────────
  {
    skillId: 'psl-p5-di-average',
    name: 'Data: average from data',
    description:
      'Compute mean from a dataset, use it to answer questions. Students sum values and divide by the count, then apply the average in context.',
    level: 'P5',
    heuristic: 'data-interpretation',
    structure: 'dataInterpretation',
    difficulty: 2,
    mathPathPrerequisites: ['add-algo-4d', 'div-within-tables'],
    pslPrerequisites: ['psl-p4-di-table-read'],
    commonMisconceptions: [
      'psl/misread-data',
      'psl/wrong-operation',
      'psl/arithmetic-error',
      'psl/used-wrong-numbers',
    ],
  },
  {
    skillId: 'psl-p5-di-pie-chart',
    name: 'Data: pie chart fractions',
    description:
      'Read fraction-based pie chart, compute actual values. Students interpret fractional slices and multiply by the total to find concrete amounts.',
    level: 'P5',
    heuristic: 'data-interpretation',
    structure: 'dataInterpretation',
    difficulty: 2,
    mathPathPrerequisites: ['frac-proper-add', 'mul-tables-6789'],
    pslPrerequisites: ['psl-p4-di-bar-chart'],
    commonMisconceptions: [
      'psl/misread-data',
      'psl/wrong-operation',
      'psl/arithmetic-error',
      'psl/used-wrong-numbers',
    ],
  },
  {
    skillId: 'psl-p5-di-two-step',
    name: 'Data: two-step data problem',
    description:
      'Combine readings from a table or chart with an arithmetic step. Students extract relevant data and chain two operations to reach the answer.',
    level: 'P5',
    heuristic: 'data-interpretation',
    structure: 'dataInterpretation',
    difficulty: 3,
    mathPathPrerequisites: ['add-algo-4d', 'mul-tables-6789'],
    pslPrerequisites: ['psl-p5-di-average', 'psl-p5-di-pie-chart'],
    commonMisconceptions: [
      'psl/misread-data',
      'psl/wrong-operation',
      'psl/arithmetic-error',
      'psl/used-wrong-numbers',
    ],
  },

  // ── P6 (2 skills, difficulty 2–3) ──────────────────────────────
  {
    skillId: 'psl-p6-di-rate',
    name: 'Data: rate from data',
    description:
      'Extract rate info from data, apply to new scenario. Students identify a unit rate from a table or chart and use it to predict or calculate for different quantities.',
    level: 'P6',
    heuristic: 'data-interpretation',
    structure: 'dataInterpretation',
    difficulty: 2,
    mathPathPrerequisites: ['div-within-tables', 'mul-tables-6789'],
    pslPrerequisites: ['psl-p5-di-two-step'],
    commonMisconceptions: [
      'psl/misread-data',
      'psl/wrong-operation',
      'psl/arithmetic-error',
      'psl/used-wrong-numbers',
    ],
  },
  {
    skillId: 'psl-p6-di-multi-source',
    name: 'Data: combine data sources',
    description:
      'Cross-reference two tables or charts to answer a question. Students pull values from multiple data representations and synthesise them into a single solution.',
    level: 'P6',
    heuristic: 'data-interpretation',
    structure: 'dataInterpretation',
    difficulty: 3,
    mathPathPrerequisites: ['add-algo-4d', 'mul-tables-6789', 'div-within-tables'],
    pslPrerequisites: ['psl-p6-di-rate'],
    commonMisconceptions: [
      'psl/misread-data',
      'psl/wrong-operation',
      'psl/arithmetic-error',
      'psl/used-wrong-numbers',
    ],
  },
];

async function seed() {
  await connectDB();
  console.log('Seeding PSL data-interpretation skills …');

  for (const skill of dataInterpSkills) {
    await PSLSkill.findOneAndUpdate(
      { skillId: skill.skillId },
      skill,
      { upsert: true, new: true }
    );
    console.log(`  ✔ ${skill.skillId}`);
  }

  console.log(`Done — ${dataInterpSkills.length} data-interpretation skills seeded.`);
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
