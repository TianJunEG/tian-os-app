// Seed the Science Adaptive Revision content into the shared Tian OS core by
// importing the legacy MOE-aligned question bank at data/p6Science.json
// (~2,600 questions across 44 topic+level pairs spanning Primary 3–6).
//
//   node scripts/seedScience.js     (or: npm run seed:science)
//
// Run AFTER seedFoundation.js. Idempotent: only touches Science content
// (Subject 'science' + its Topics/Skills + Questions tagged source='legacy-bank').
// Also removes the older 5-topic placeholder seed if present so the module
// shows only the real curriculum.
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Skill from '../models/Skill.js';
import Question from '../models/Question.js';
import { cleanupOrphanMastery } from './cleanupOrphanMastery.js';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';
const LEGACY = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/p6Science.json'), 'utf8'));

const LEVEL_NAME = { P3: 'Primary 3', P4: 'Primary 4', P5: 'Primary 5', P6: 'Primary 6' };
const LEVEL_ORDER = { P3: 0, P4: 1, P5: 2, P6: 3 };

// Names of the earlier placeholder topics that the rewritten seed needs to
// scrub out so the module surface shows only the real curriculum.
const PLACEHOLDER_TOPICS = ['Cycles', 'Systems', 'Energy', 'Interactions', 'Diversity'];

// Pull a tidy list of keyPoints out of the comma-separated keywords. These
// drive open-ended marking via utils/answerCheck.js → checkKeyPoints().
const keyPointsFrom = (kw) => String(kw || '')
  .split(/[,;]/)
  .map((k) => k.trim().toLowerCase())
  .filter((k) => k && k.length <= 40);

async function removePlaceholders(scienceId) {
  const olds = await Topic.find({ subjectId: scienceId, name: { $in: PLACEHOLDER_TOPICS } });
  if (!olds.length) return 0;
  const topicIds = olds.map((t) => t._id);
  const skills = await Skill.find({ topicId: { $in: topicIds } }).select('_id');
  const skillIds = skills.map((s) => s._id);
  await Question.deleteMany({ skillId: { $in: skillIds } });
  await Skill.deleteMany({ _id: { $in: skillIds } });
  await Topic.deleteMany({ _id: { $in: topicIds } });
  return olds.length;
}

async function main() {
  await mongoose.connect(URI);
  let science = await Subject.findOne({ key: 'science' });
  if (!science) science = await Subject.create({ key: 'science', name: 'Science', order: 1 });

  const removedPlaceholders = await removePlaceholders(science._id);

  // Group questions by (topic, level) — each pair becomes one Topic + one Skill.
  const groups = new Map();
  for (const q of LEGACY) {
    const key = `${q.level}::${q.topic}`;
    if (!groups.has(key)) groups.set(key, { level: q.level, topic: q.topic, qs: [] });
    groups.get(key).qs.push(q);
  }

  // Sort: level first (P3→P6), then topic alphabetically for stable Topic.order.
  const ordered = [...groups.values()].sort((a, b) =>
    (LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]) || a.topic.localeCompare(b.topic)
  );

  let topicCount = 0, skillCount = 0, qCount = 0;
  for (let i = 0; i < ordered.length; i++) {
    const g = ordered[i];
    const moeLevel = LEVEL_NAME[g.level] || g.level;

    let topic = await Topic.findOne({ subjectId: science._id, name: g.topic, moeLevel });
    if (!topic) topic = await Topic.create({ subjectId: science._id, name: g.topic, moeLevel, order: i });
    else { topic.order = i; await topic.save(); }
    topicCount++;

    let skill = await Skill.findOne({ topicId: topic._id, name: g.topic });
    if (!skill) { skill = await Skill.create({ topicId: topic._id, name: g.topic, moeLevel, order: 0 }); skillCount++; }

    // Clean the prior import for this skill so re-runs are idempotent.
    await Question.deleteMany({ skillId: skill._id, source: 'legacy-bank' });

    const docs = g.qs.map((q) => {
      const keyPoints = keyPointsFrom(q.keywords);
      return {
        subjectId: science._id, topicId: topic._id, skillId: skill._id, moeLevel,
        difficulty: 'medium',
        type: 'open_ended',
        stem: q.question,
        answer: q.answer,        // canonical answer (required by schema)
        modelAnswer: q.answer,   // shown after submission
        keyPoints,
        explanation: q.heading || '',
        workedSolution: q.answer,
        source: 'legacy-bank',
      };
    });
    if (docs.length) await Question.insertMany(docs);
    qCount += docs.length;
  }

  // Replacing the placeholder topics deletes their Skills, which leaves
  // MasteryRecord rows pointing at IDs that no longer exist. Sweep them up
  // here so the next ParentHome render isn't reporting phantom progress.
  const { orphans } = await cleanupOrphanMastery({ deleteOrphans: true, subject: 'Science' });

  console.log('✅ Science Adaptive Revision content seeded');
  if (removedPlaceholders) console.log(`   Removed ${removedPlaceholders} placeholder topic(s)`);
  console.log(`   Subject: Science · ${topicCount} topics (P3–P6), ${skillCount} new skills, ${qCount} questions imported`);
  if (orphans.length) console.log(`   Cleaned up ${orphans.length} orphan MasteryRecord(s) pointing at deleted skills`);
  await mongoose.disconnect();
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
