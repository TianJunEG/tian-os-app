// Seed structured addition & subtraction questions for P1/K2 students.
// Progression: +1 → +2 → +3 → +4 → +5 → mixed (same for subtraction).
// Each question shows a dot array in the stem so young students can count.
//
// Usage: railway run sh -c "NODE_ENV=development node scripts/seedOperationsProgressionQuestions.js"
// Safe to re-run (upserts by sourceRef).
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Subject from '../models/Subject.js';
import Skill from '../models/Skill.js';
import Question from '../models/Question.js';

dotenv.config();
if (process.env.NODE_ENV === 'production') {
  console.error('Run with NODE_ENV=development to bypass production guard.');
  process.exit(1);
}

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';

const dots = (n) => '⬤'.repeat(n);

function shuffle(arr) {
  return arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
}

function mcq(stem, answer, wrongOpts, solution, tag, difficulty = 'easy') {
  const ans = String(answer);
  const seen = new Set([ans]);
  const opts = [];
  for (const d of wrongOpts.map(String)) {
    if (!seen.has(d)) { seen.add(d); opts.push(d); }
  }
  return {
    type: 'mcq',
    stem,
    choices: shuffle([ans, ...opts.slice(0, 3)]),
    answer: ans,
    workedSolution: solution,
    misconceptionTag: tag,
    difficulty,
    subtype: 'diagnostic',
  };
}

// Build addition questions for a single step value (addend)
function additionForStep(step) {
  const qs = [];
  const max = step <= 2 ? 8 : 10;
  for (let a = 1; a + step <= max; a++) {
    const sum = a + step;
    const stem = `${dots(a)} + ${dots(step)} = ?\n${a} + ${step} = ?`;
    const wrong = [sum - 1, sum + 1, sum + 2].filter((n) => n >= 0 && n !== sum);
    qs.push(mcq(stem, sum, wrong, `Count on ${step}: ${a} + ${step} = ${sum}.`, 'add/count-all'));
  }
  return qs;
}

// Build mixed addition questions within 10
function additionMixed() {
  const qs = [];
  const pairs = [
    [3, 4], [2, 5], [4, 3], [1, 6], [5, 2], [2, 6], [3, 5], [4, 4],
    [1, 7], [2, 7], [3, 6], [1, 8], [4, 5], [6, 3], [5, 4], [7, 2],
    [6, 4], [8, 1], [9, 1], [7, 3],
  ];
  for (const [a, b] of pairs) {
    const sum = a + b;
    const stem = `${dots(a)} + ${dots(b)} = ?\n${a} + ${b} = ?`;
    const wrong = [sum - 1, sum + 1, sum - 2].filter((n) => n >= 0 && n !== sum);
    qs.push(mcq(stem, sum, wrong, `${a} + ${b} = ${sum}.`, 'add/count-all'));
  }
  return qs;
}

// Build subtraction questions for a single step value
function subtractionForStep(step) {
  const qs = [];
  for (let a = step; a <= step + 7; a++) {
    const diff = a - step;
    const stem = `${dots(a)} − ${dots(step)} = ?\n${a} − ${step} = ?`;
    const wrong = [diff + 1, diff - 1, diff + 2].filter((n) => n >= 0 && n !== diff);
    qs.push(mcq(stem, diff, wrong, `Start at ${a}, count back ${step}: ${a} − ${step} = ${diff}.`, 'sub/count-back'));
  }
  return qs;
}

// Build mixed subtraction questions within 10
function subtractionMixed() {
  const qs = [];
  const pairs = [
    [7, 3], [8, 2], [6, 4], [9, 5], [10, 3], [8, 5], [7, 4], [6, 3],
    [9, 4], [10, 6], [8, 3], [7, 5], [10, 4], [9, 2], [6, 5], [10, 7],
    [8, 6], [9, 7], [10, 8], [9, 6],
  ];
  for (const [a, b] of pairs) {
    const diff = a - b;
    const stem = `${dots(a)} − ${dots(b)} = ?\n${a} − ${b} = ?`;
    const wrong = [diff + 1, diff - 1, diff + 2].filter((n) => n >= 0 && n !== diff);
    qs.push(mcq(stem, diff, wrong, `${a} − ${b} = ${diff}.`, 'sub/count-back'));
  }
  return qs;
}

// All batches: label → question generator
const ADD_BATCHES = [
  { label: '+1', qs: additionForStep(1) },
  { label: '+2', qs: additionForStep(2) },
  { label: '+3', qs: additionForStep(3) },
  { label: '+4', qs: additionForStep(4) },
  { label: '+5', qs: additionForStep(5) },
  { label: 'mixed', qs: additionMixed() },
];

const SUB_BATCHES = [
  { label: '-1', qs: subtractionForStep(1) },
  { label: '-2', qs: subtractionForStep(2) },
  { label: '-3', qs: subtractionForStep(3) },
  { label: '-4', qs: subtractionForStep(4) },
  { label: '-5', qs: subtractionForStep(5) },
  { label: 'mixed', qs: subtractionMixed() },
];

async function upsertBatch(batches, skill, mathSubject) {
  let created = 0; let updated = 0;
  for (const { label, qs } of batches) {
    for (let i = 0; i < qs.length; i++) {
      const sourceRef = `ops-seed-${skill.slug}-${label}-${i}`;
      const doc = {
        sourceRef,
        skillId: skill._id,
        source: 'seed',
        subjectId: mathSubject._id,
        topicId: skill.topicId,
        moeLevel: skill.metadata?.levelTag || 'Primary 1',
        ...qs[i],
      };
      const existing = await Question.findOne({ sourceRef, skillId: skill._id });
      if (existing) { await Question.updateOne({ _id: existing._id }, { $set: doc }); updated++; }
      else { await Question.create(doc); created++; }
    }
    console.log(`  ${skill.slug} ${label}: ${qs.length} questions`);
  }
  return { created, updated };
}

async function main() {
  await mongoose.connect(URI);
  const mathSubject = await Subject.findOne({ key: 'math' });
  if (!mathSubject) { console.error('Math subject not found — run seed:foundation first.'); process.exit(1); }

  let totalCreated = 0; let totalUpdated = 0;

  const addSkill = await Skill.findOne({ slug: 'op.add.facts', domain: 'Operations' });
  if (addSkill) {
    const { created, updated } = await upsertBatch(ADD_BATCHES, addSkill, mathSubject);
    totalCreated += created; totalUpdated += updated;
  } else {
    console.warn('⚠  op.add.facts not found — run seed:domains first');
  }

  const subSkill = await Skill.findOne({ slug: 'op.sub.facts', domain: 'Operations' });
  if (subSkill) {
    const { created, updated } = await upsertBatch(SUB_BATCHES, subSkill, mathSubject);
    totalCreated += created; totalUpdated += updated;
  } else {
    console.warn('⚠  op.sub.facts not found — run seed:domains first');
  }

  console.log(`\nDone. Created: ${totalCreated}  Updated: ${totalUpdated}`);
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
