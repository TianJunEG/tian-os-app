// Phase 2 foundation seed: populate the shared question bank for the Math skills
// created by seedFoundation.js. Rule-based (no AI). Idempotent: replaces only
// `source: 'seed'` Math questions.
//
//   node scripts/seedQuestions.js     (or: npm run seed:questions)
//
// Run AFTER seedFoundation.js (needs the Math subject/topic/skill map).
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Skill from '../models/Skill.js';
import Question from '../models/Question.js';
import { generateQuestionsForSkill } from '../utils/questionTemplates.js';

dotenv.config();
const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';
const PER_DIFFICULTY = 5;   // 5 × 3 difficulties = ~15 questions/skill

async function main() {
  await mongoose.connect(URI);

  const math = await Subject.findOne({ key: 'math' });
  if (!math) { console.error('No Math subject found — run `npm run seed:foundation` first.'); process.exit(1); }

  const topics = await Topic.find({ subjectId: math._id });
  const topicIds = topics.map((t) => t._id);
  const skills = await Skill.find({ topicId: { $in: topicIds } });
  if (!skills.length) { console.error('No Math skills found — run `npm run seed:foundation` first.'); process.exit(1); }

  const skillIds = skills.map((s) => s._id);
  const removed = await Question.deleteMany({ skillId: { $in: skillIds }, source: 'seed' });

  const topicLevel = Object.fromEntries(topics.map((t) => [String(t._id), t.moeLevel]));
  let inserted = 0;
  const skipped = [];
  for (const skill of skills) {
    const qs = generateQuestionsForSkill(skill.name, PER_DIFFICULTY);
    if (!qs.length) { skipped.push(skill.name); continue; }
    const docs = qs.map((q) => ({
      subjectId: math._id,
      topicId: skill.topicId,
      skillId: skill._id,
      moeLevel: skill.moeLevel || topicLevel[String(skill.topicId)] || '',
      difficulty: q.difficulty,
      type: q.type,
      stem: q.stem,
      choices: q.choices,
      answer: q.answer,
      workedSolution: q.workedSolution,
      misconceptionTag: q.misconceptionTag,
      source: 'seed',
    }));
    await Question.insertMany(docs);
    inserted += docs.length;
  }

  console.log('✅ Question bank seeded');
  console.log(`   Removed ${removed.deletedCount} old seed questions`);
  console.log(`   Inserted ${inserted} questions across ${skills.length - skipped.length} of ${skills.length} Math skills`);
  if (skipped.length) {
    console.log(`   ${skipped.length} skills have NO rule-based template (rely on authored/exam items):`);
    console.log(`     ${skipped.join(', ')}`);
  }
  await mongoose.disconnect();
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
