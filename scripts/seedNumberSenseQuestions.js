// Seed diagnostic-ready questions for the Number Sense domain.
// Generates ~10 concrete MCQ/short-answer questions per P1-P4 skill so the
// adaptive diagnostic can serve a full session without running out of items.
//
// Usage: node scripts/seedNumberSenseQuestions.js
// Safe to re-run: upserts by a stable questionId, never duplicates.
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Subject from '../models/Subject.js';
import Skill from '../models/Skill.js';
import Question from '../models/Question.js';

dotenv.config();

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';
const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function shuffle(arr) {
  return arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(p => p[1]);
}

function mcq(stem, answer, distractors, solution, tag, difficulty = 'easy') {
  const ans = String(answer);
  const seen = new Set([ans]);
  const opts = [];
  for (const d of distractors.map(String)) {
    if (!seen.has(d)) { seen.add(d); opts.push(d); }
  }
  // fill to 3 distractors if needed
  const n = Number(answer);
  for (let delta = 1; opts.length < 3 && delta < 20; delta++) {
    for (const c of [n + delta, n - delta]) {
      const s = String(c);
      if (c >= 0 && !seen.has(s)) { seen.add(s); opts.push(s); }
      if (opts.length >= 3) break;
    }
  }
  return { type: 'mcq', stem, choices: shuffle([ans, ...opts.slice(0, 3)]), answer: ans, workedSolution: solution, misconceptionTag: tag, difficulty, subtype: 'diagnostic' };
}

function short(stem, answer, solution, tag, difficulty = 'easy') {
  return { type: 'short_answer', stem, choices: [], answer: String(answer), workedSolution: solution, misconceptionTag: tag, difficulty, subtype: 'diagnostic' };
}

// Generate a bank of questions per skill slug
function questionsFor(slug) {
  switch (slug) {
    case 'ns.count.to-20': {
      const qs = [];
      for (let n = 1; n <= 18; n++) {
        qs.push(mcq(`What number comes after ${n}?`, n + 1, [n - 1, n + 2, n + 3], `Count on one: ${n} → ${n + 1}.`, 'count/skip-number'));
      }
      // teen vs -ty confusion
      qs.push(mcq('Which number is thirteen?', 13, [30, 31, 14], 'Thirteen = 13. Thirty = 30.', 'count/teen-ty'));
      qs.push(mcq('Which number is fifteen?', 15, [50, 51, 14], 'Fifteen = 15. Fifty = 50.', 'count/teen-ty'));
      return qs;
    }
    case 'ns.count.to-100': {
      const qs = [];
      // across decade boundaries
      for (const n of [9, 19, 29, 39, 49, 59, 69, 79, 89, 99]) {
        if (n < 100) qs.push(short(`What number comes after ${n}?`, n + 1, `Count on: ${n} → ${n + 1}.`, 'count/decade-boundary'));
      }
      for (let n = 20; n <= 90; n += 10) {
        qs.push(mcq(`Count on: ${n - 1}, ${n}, ___`, n + 1, [n - 1, n + 2, n + 10], `After ${n} comes ${n + 1}.`, 'count/decade-boundary'));
      }
      return qs;
    }
    case 'ns.count.skip': {
      const qs = [];
      for (let a = 0; a <= 16; a += 2) qs.push(short(`Skip count by 2s: ${a}, ${a + 2}, ___`, a + 4, `Add 2 each time: ${a + 4}.`, 'count/lose-step'));
      for (let a = 0; a <= 40; a += 5) qs.push(short(`Skip count by 5s: ${a}, ${a + 5}, ___`, a + 10, `Add 5 each time: ${a + 10}.`, 'count/lose-step'));
      for (let a = 0; a <= 80; a += 10) qs.push(short(`Skip count by 10s: ${a}, ${a + 10}, ___`, a + 20, `Add 10 each time: ${a + 20}.`, 'count/lose-step'));
      return qs;
    }
    case 'ns.count.to-1000': {
      const qs = [];
      for (const n of [99, 199, 299, 399, 499, 599, 699, 799, 899, 999]) {
        if (n < 1000) qs.push(short(`What is 1 more than ${n}?`, n + 1, `${n} + 1 = ${n + 1}.`, 'count/hundred-boundary'));
      }
      for (let n = 101; n <= 200; n += 11) {
        qs.push(mcq(`What number comes after ${n}?`, n + 1, [n - 1, n + 2, n + 10], `${n} + 1 = ${n + 1}.`, 'count/hundred-boundary'));
      }
      return qs;
    }
    case 'ns.pv.tens-ones': {
      const qs = [];
      for (const n of [12, 23, 34, 45, 56, 67, 78, 89, 35, 41, 52, 63]) {
        const tens = Math.floor(n / 10);
        const ones = n % 10;
        qs.push(mcq(`In the number ${n}, what is the value of the tens digit?`, tens * 10,
          [tens, ones, ones * 10], `The tens digit is ${tens}. Its value is ${tens} × 10 = ${tens * 10}.`, 'pv/digit-vs-value'));
        qs.push(short(`How many tens are in ${n}?`, tens, `${n} = ${tens} tens and ${ones} ones.`, 'pv/digit-vs-value'));
      }
      return qs;
    }
    case 'ns.pv.3-digit': {
      const qs = [];
      for (let h = 1; h <= 9; h++) {
        for (const [t, o] of [[0, 5], [3, 0], [2, 7]]) {
          const n = h * 100 + t * 10 + o;
          qs.push(short(`Write the number: ${h} hundreds, ${t} tens and ${o} ones.`, n,
            `${h} × 100 + ${t} × 10 + ${o} = ${n}.`, 'pv/zero-placeholder', 'medium'));
        }
      }
      return qs;
    }
    case 'ns.compare.to-100': {
      const qs = [];
      const pairs = [[12, 21], [34, 43], [55, 66], [78, 87], [9, 90], [41, 14], [63, 36], [50, 5], [17, 71], [29, 92]];
      for (const [a, b] of pairs) {
        qs.push(mcq(`Which is greater: ${a} or ${b}?`, Math.max(a, b), [Math.min(a, b)], `Compare tens first: ${Math.max(a, b)} > ${Math.min(a, b)}.`, 'compare/leading-digit'));
        qs.push(mcq(`Which is smaller: ${a} or ${b}?`, Math.min(a, b), [Math.max(a, b)], `${Math.min(a, b)} < ${Math.max(a, b)}.`, 'compare/leading-digit'));
      }
      return qs;
    }
    case 'ns.order.to-100': {
      const qs = [];
      const sets = [[3, 17, 9], [22, 5, 31], [45, 12, 38], [61, 7, 54], [80, 23, 47], [99, 1, 50]];
      for (const set of sets) {
        const asc = [...set].sort((a, b) => a - b).join(', ');
        qs.push(short(`Arrange from smallest to largest: ${set.join(', ')}`, asc, `Smallest first: ${asc}.`, 'order/local-not-global'));
      }
      return qs;
    }
    case 'ns.pattern.skip': {
      const qs = [];
      for (const k of [2, 5, 10]) {
        for (let a = 0; a <= 20; a += k * 2) {
          qs.push(short(`Next term: ${a}, ${a + k}, ${a + 2 * k}, ___`, a + 3 * k,
            `Step is +${k}. Next = ${a + 2 * k} + ${k} = ${a + 3 * k}.`, 'pattern/step-drift'));
        }
      }
      return qs;
    }
    case 'ns.round.10-100': {
      const qs = [];
      for (const n of [14, 16, 23, 27, 35, 42, 48, 51, 64, 79, 83, 97]) {
        const r10 = Math.round(n / 10) * 10;
        qs.push(mcq(`Round ${n} to the nearest 10.`, r10, [r10 - 10, r10 + 10, n], `${n} rounds to ${r10}.`, 'round/wrong-boundary', 'medium'));
      }
      for (const n of [123, 148, 250, 372, 451, 499, 550, 678, 750, 801]) {
        const r100 = Math.round(n / 100) * 100;
        qs.push(mcq(`Round ${n} to the nearest 100.`, r100, [r100 - 100, r100 + 100, n], `${n} rounds to ${r100}.`, 'round/wrong-boundary', 'medium'));
      }
      return qs;
    }
    default:
      return [];
  }
}

async function main() {
  await mongoose.connect(URI);

  const SEEDED_SLUGS = [
    'ns.count.to-20', 'ns.count.to-100', 'ns.count.skip', 'ns.count.to-1000',
    'ns.pv.tens-ones', 'ns.pv.3-digit',
    'ns.compare.to-100', 'ns.order.to-100',
    'ns.pattern.skip', 'ns.round.10-100',
  ];

  const mathSubject = await Subject.findOne({ key: 'math' });
  if (!mathSubject) { console.error('Math subject not found — run seed:foundation first.'); process.exit(1); }

  let created = 0, updated = 0;

  for (const slug of SEEDED_SLUGS) {
    const skill = await Skill.findOne({ slug, domain: 'Number Sense' });
    if (!skill) { console.warn(`  ⚠  Skill not found: ${slug} — run npm run seed:domains first`); continue; }

    const bank = questionsFor(slug);
    for (let i = 0; i < bank.length; i++) {
      const q = bank[i];
      const sourceRef = `ns-seed-${slug}-${i}`;
      const doc = {
        sourceRef,
        skillId: skill._id,
        source: 'seed',
        subjectId: mathSubject._id,
        topicId: skill.topicId,
        moeLevel: skill.metadata?.levelTag || 'Primary 1',
        ...q,
      };
      const existing = await Question.findOne({ sourceRef, skillId: skill._id });
      if (existing) {
        await Question.updateOne({ _id: existing._id }, { $set: doc });
        updated++;
      } else {
        await Question.create(doc);
        created++;
      }
    }
    console.log(`  ✅ ${slug} — ${bank.length} questions`);
  }

  console.log(`\nDone. Created: ${created}  Updated: ${updated}`);
  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
