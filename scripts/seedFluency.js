// Seed the MathPath Fluency feature content: a "Number Fluency" topic with 5
// fluency skill groups + their questions. Idempotent. Fluency is a FEATURE of
// MathPath, not a separate app — these are ordinary Skills/Questions, just
// grouped under one topic the fluency UI reads from.
//
//   node scripts/seedFluency.js     (or: npm run seed:fluency)
//
// Run AFTER seedFoundation.js.
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Skill from '../models/Skill.js';
import Question from '../models/Question.js';
import { generateQuestionsForSkill } from '../utils/questionTemplates.js';

dotenv.config();

if (process.env.NODE_ENV === "production") {
  console.error("Seed script: refusing to run in production (NODE_ENV=production).");
  process.exit(1);
}
const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';

export const FLUENCY_TOPIC = 'Number Fluency';
export const FLUENCY_SKILLS = [
  'Times tables',
  'Mental addition and subtraction',
  'Equivalent fractions',     // fluency variant (vertical fraction display in UI)
  'Decimal place value',
  'Percentage basics',
];
const PER_DIFFICULTY = 4;     // 5 skills × 4 × 3 = 60 questions (well over the 20 min)

async function main() {
  await mongoose.connect(URI);

  const math = await Subject.findOne({ key: 'math' });
  if (!math) { console.error('No Math subject — run `npm run seed:foundation` first.'); process.exit(1); }

  let topic = await Topic.findOne({ subjectId: math._id, name: FLUENCY_TOPIC });
  if (!topic) topic = await Topic.create({ subjectId: math._id, name: FLUENCY_TOPIC, moeLevel: 'Primary 4', order: 99 });

  let skillCount = 0, qCount = 0;
  for (let i = 0; i < FLUENCY_SKILLS.length; i++) {
    const name = FLUENCY_SKILLS[i];
    let skill = await Skill.findOne({ topicId: topic._id, name });
    const fluencyMetadata = {
      ...(skill?.metadata || {}),
      fluencyType: 'timed',
      fluency: {
        targetSeconds: skill?.metadata?.fluency?.targetSeconds || 10,
        targetAccuracy: skill?.metadata?.fluency?.targetAccuracy || 90,
      },
    };
    if (!skill) {
      skill = await Skill.create({ topicId: topic._id, name, moeLevel: 'Primary 4', order: i, metadata: fluencyMetadata });
      skillCount++;
    } else {
      skill.metadata = fluencyMetadata;
      await skill.save();
    }

    await Question.deleteMany({ skillId: skill._id, source: 'seed' });
    const qs = generateQuestionsForSkill(name, PER_DIFFICULTY);
    await Question.insertMany(qs.map((q) => ({
      subjectId: math._id, topicId: topic._id, skillId: skill._id, moeLevel: 'Primary 4',
      difficulty: q.difficulty, type: q.type, stem: q.stem, choices: q.choices, answer: q.answer,
      workedSolution: q.workedSolution, misconceptionTag: q.misconceptionTag, source: 'seed',
    })));
    qCount += qs.length;
  }

  console.log('✅ MathPath Fluency content seeded');
  console.log(`   Topic: "${FLUENCY_TOPIC}" · ${FLUENCY_SKILLS.length} fluency skills (${skillCount} new) · ${qCount} questions`);
  await mongoose.disconnect();
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
