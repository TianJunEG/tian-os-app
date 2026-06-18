// Seed mixed-type (mcq + open_ended) Fraction questions so generated papers can
// actually render all PSLE booklets (Paper 1 Booklet A = MCQ, Booklet B = short
// answer, Paper 2 = open-ended) and so error-diagnosis papers have MCQ items
// carrying a misconception tag. The existing Fractions bank is entirely
// short_answer, which leaves the new sectioning/error-diagnosis logic with
// nothing to demonstrate live.
//
// Idempotent: all rows are tagged with a shared sourceRef and re-seeded via
// delete-then-insert, so re-running never duplicates.
//
//   node scripts/seedMixedTypeFractionQuestions.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Skill from '../models/Skill.js';
import Question from '../models/Question.js';

dotenv.config();

const SOURCE_REF = 'seed_mixed_type_fractions_v1';
const MOE_LEVEL = 'Primary 4';

// Question templates keyed by skill framework code. `fw` is resolved to a Skill
// at runtime so the script is portable across environments (no hardcoded ids).
const TEMPLATES = [
  {
    fw: 'F001',
    items: [
      { type: 'mcq', difficulty: 'easy', misconceptionTag: 'fr.parts-not-equal',
        stem: 'A shape is divided into 4 equal parts and 1 part is shaded. What fraction is shaded?',
        choices: ['1/4', '1/3', '4/1', '1/2'], answer: '1/4',
        workedSolution: '1 shaded part out of 4 equal parts = 1/4.',
        commonMistakes: ['Counting unequal parts as equal'] },
      { type: 'open_ended', difficulty: 'medium', misconceptionTag: 'fr.parts-not-equal',
        stem: 'Explain what the fraction 3/8 means using the idea of equal parts.',
        answer: '3 out of 8 equal parts',
        modelAnswer: 'The whole is split into 8 equal parts and we take 3 of them.',
        keyPoints: ['8 equal parts', '3 of them', 'whole split equally'] },
    ],
  },
  {
    fw: 'F002',
    items: [
      { type: 'mcq', difficulty: 'easy', misconceptionTag: 'fr.num-den-swap',
        stem: 'In the fraction 3/5, what is the denominator?',
        choices: ['5', '3', '8', '2'], answer: '5',
        workedSolution: 'The denominator is the bottom number: 5.',
        commonMistakes: ['Swapping numerator and denominator'] },
      { type: 'mcq', difficulty: 'medium', misconceptionTag: 'fr.num-den-swap',
        stem: 'Which fraction has 7 as its numerator?',
        choices: ['7/9', '9/7', '1/7', '7/7'], answer: '7/9',
        workedSolution: 'The numerator is the top number; 7/9 has numerator 7.' },
    ],
  },
  {
    fw: 'F003',
    items: [
      { type: 'open_ended', difficulty: 'medium', misconceptionTag: 'fr.whole-miscount',
        stem: 'A pizza is cut into 6 equal slices. You eat 2 slices. What fraction did you eat and what fraction is left? Explain.',
        answer: '2/6 eaten, 4/6 left',
        modelAnswer: 'Eaten 2 of 6 equal slices = 2/6; left 6 - 2 = 4 slices = 4/6.',
        keyPoints: ['2/6 eaten', '4/6 left', '6 equal slices'] },
      { type: 'mcq', difficulty: 'hard', misconceptionTag: 'fr.whole-miscount',
        stem: 'A ribbon is cut into 8 equal parts and 5 parts are used. What fraction of the ribbon is left?',
        choices: ['3/8', '5/8', '8/5', '3/5'], answer: '3/8',
        workedSolution: '8 - 5 = 3 parts left, out of 8 = 3/8.' },
    ],
  },
  {
    fw: 'F004',
    items: [
      { type: 'mcq', difficulty: 'easy', misconceptionTag: 'fr.unit-misid',
        stem: 'Which of these is a unit fraction?',
        choices: ['1/6', '2/6', '3/4', '5/8'], answer: '1/6',
        workedSolution: 'A unit fraction has a numerator of 1: 1/6.' },
      { type: 'open_ended', difficulty: 'hard', misconceptionTag: 'fr.unit-bigger-denom-bigger',
        stem: 'Order these unit fractions from largest to smallest: 1/2, 1/5, 1/3. Explain your reasoning.',
        answer: '1/2, 1/3, 1/5',
        modelAnswer: 'For unit fractions, a smaller denominator means a larger fraction, so 1/2 > 1/3 > 1/5.',
        keyPoints: ['1/2 largest', 'smaller denominator = larger', '1/5 smallest'] },
    ],
  },
  {
    fw: 'F005',
    items: [
      { type: 'mcq', difficulty: 'medium', misconceptionTag: 'fr.numberline-miscount',
        stem: 'A number line from 0 to 1 is divided into 4 equal parts. Which fraction is at the 3rd mark?',
        choices: ['3/4', '1/3', '4/3', '2/4'], answer: '3/4',
        workedSolution: '4 equal parts → each is 1/4; the 3rd mark is at 3/4.' },
      { type: 'open_ended', difficulty: 'medium', misconceptionTag: 'fr.numberline-miscount',
        stem: 'A number line from 0 to 1 is split into 5 equal parts. What fraction is at the 2nd mark? Explain.',
        answer: '2/5',
        modelAnswer: '5 equal parts → each is 1/5; the 2nd mark is at 2/5.',
        keyPoints: ['5 equal parts', '2nd mark', '2/5'] },
    ],
  },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tutor-match');

  const subject = await Subject.findOne({ key: 'math' });
  if (!subject) throw new Error('Math subject not found.');
  const topic = await Topic.findOne({ subjectId: subject._id, name: /^fractions$/i });
  if (!topic) throw new Error('Fractions topic not found.');

  const skills = await Skill.find({ topicId: topic._id });
  const byFw = new Map();
  for (const s of skills) {
    const fw = s.metadata?.frameworkCode || s.metadata?.mathPathSkillId;
    if (fw) byFw.set(fw, s);
  }

  const docs = [];
  for (const group of TEMPLATES) {
    const skill = byFw.get(group.fw);
    if (!skill) {
      console.warn(`  skip ${group.fw}: skill not found`);
      continue;
    }
    for (const item of group.items) {
      docs.push({
        subjectId: subject._id,
        topicId: topic._id,
        skillId: skill._id,
        frameworkSkillId: group.fw,
        officialSkillCode: group.fw,
        universalSkillSlug: skill.slug || '',
        questionCategory: 'assessment',
        moeLevel: MOE_LEVEL,
        difficulty: item.difficulty,
        type: item.type,
        stem: item.stem,
        choices: item.choices || [],
        answer: item.answer,
        workedSolution: item.workedSolution || '',
        modelAnswer: item.modelAnswer || '',
        keyPoints: item.keyPoints || [],
        commonMistakes: item.commonMistakes || [],
        misconceptionTag: item.misconceptionTag || '',
        source: 'authored',
        sourceRef: SOURCE_REF,
      });
    }
  }

  const removed = await Question.deleteMany({ sourceRef: SOURCE_REF });
  const inserted = await Question.insertMany(docs);

  const byType = inserted.reduce((acc, q) => ({ ...acc, [q.type]: (acc[q.type] || 0) + 1 }), {});
  console.log(`Removed ${removed.deletedCount} prior, inserted ${inserted.length} questions.`);
  console.log('By type:', byType);
  console.log('Skills covered:', [...new Set(inserted.map((q) => q.frameworkSkillId))].join(', '));

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
