import dotenv from 'dotenv';
dotenv.config();

if (process.env.NODE_ENV === "production") {
  console.error("Seed script: refusing to run in production (NODE_ENV=production).");
  process.exit(1);
}
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLSkill from '../models/psl/PSLSkill.js';

const skills = [
  {
    skillId: 'psl-p4-assumption-animals',
    name: 'Assumption – Animals & Legs',
    level: 'P4',
    structure: 'assumption',
    heuristic: 'assumption',
    description: 'Use the assumption method to solve problems about animals with different numbers of legs.',
    pslPrerequisites: ['psl-p4-gc-items-total'],
    operations: ['multiplication', 'subtraction', 'division'],
  },
  {
    skillId: 'psl-p4-assumption-items',
    name: 'Assumption – Items & Cost',
    level: 'P4',
    structure: 'assumption',
    heuristic: 'assumption',
    description: 'Use the assumption method to solve problems about items at different prices.',
    pslPrerequisites: ['psl-p4-assumption-animals'],
    operations: ['multiplication', 'subtraction', 'division'],
  },
  {
    skillId: 'psl-p5-assumption-coins',
    name: 'Assumption – Coins & Notes',
    level: 'P5',
    structure: 'assumption',
    heuristic: 'assumption',
    description: 'Use the assumption method to find how many of each type of coin or note.',
    pslPrerequisites: ['psl-p4-assumption-items'],
    operations: ['multiplication', 'subtraction', 'division'],
  },
  {
    skillId: 'psl-p5-assumption-scoring',
    name: 'Assumption – Scoring & Penalties',
    level: 'P5',
    structure: 'assumption',
    heuristic: 'assumption',
    description: 'Use the assumption method for quiz/contest scoring with marks gained and lost.',
    pslPrerequisites: ['psl-p5-assumption-coins'],
    operations: ['multiplication', 'subtraction', 'division'],
  },
  {
    skillId: 'psl-p5-assumption-transport',
    name: 'Assumption – Transport & Wheels',
    level: 'P5',
    structure: 'assumption',
    heuristic: 'assumption',
    description: 'Use the assumption method with vehicles and their wheels.',
    pslPrerequisites: ['psl-p4-assumption-animals'],
    operations: ['multiplication', 'subtraction', 'division'],
  },
  {
    skillId: 'psl-p6-assumption-advanced',
    name: 'Assumption – Advanced Mixed',
    level: 'P6',
    structure: 'assumption',
    heuristic: 'assumption',
    description: 'Apply the assumption method to complex real-world contexts.',
    pslPrerequisites: ['psl-p5-assumption-scoring', 'psl-p5-assumption-transport'],
    operations: ['multiplication', 'subtraction', 'division'],
  },
];

async function seed() {
  await connectDB();
  for (const s of skills) {
    await PSLSkill.updateOne({ skillId: s.skillId }, { $set: s }, { upsert: true });
  }
  console.log(`Seeded ${skills.length} assumption skills`);
  await mongoose.disconnect();
}
seed().catch((e) => { console.error(e); process.exit(1); });
