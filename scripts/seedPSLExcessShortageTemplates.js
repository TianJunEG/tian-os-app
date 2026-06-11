import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLProblemTemplate from '../models/psl/PSLProblemTemplate.js';
import { strategyScaffold, makeTemplate } from './pslTemplateFactory.js';

// ─── Scaffold helpers ───────────────────────────────────────────────
const basicScaffold = () => strategyScaffold({
  understand: [
    'Distributing items with leftover or shortage',
    'Comparing prices of items',
    'Sharing items equally among friends',
    'Finding a pattern in numbers',
  ],
  questionChoices: [
    'How many groups or people are there',
    'How many items in total',
    'How many items per person',
    'The difference between excess and shortage',
  ],
  strategyChoices: [
    'Use excess-and-shortage formula: (excess + shortage) ÷ difference per person',
    'Draw a model and guess-and-check',
    'Use simultaneous equations',
    'Work backwards from the total',
  ],
  solveType: 'expression',
  solveSpec: { operation: '÷', expression: '({excess} + {shortage}) ÷ ({giveB} - {giveA})', answer: '{answer}' },
});

const bothExcessScaffold = () => strategyScaffold({
  understand: [
    'Distributing items with excess in both scenarios',
    'Comparing two equal groups',
    'Finding a total from parts',
    'Working backwards from a result',
  ],
  questionChoices: [
    'How many groups or people are there',
    'How many items in total',
    'The difference between the two excess amounts',
    'How many items per person',
  ],
  strategyChoices: [
    'Use both-excess formula: (larger excess − smaller excess) ÷ difference per person',
    'Draw a bar model comparing the two scenarios',
    'Use the average of the two excess amounts',
    'Multiply the two excess amounts together',
  ],
  solveType: 'expression',
  solveSpec: { operation: '÷', expression: '({excessA} - {excessB}) ÷ ({giveB} - {giveA})', answer: '{answer}' },
});

const equalShareScaffold = () => strategyScaffold({
  understand: [
    'Distributing items with leftover or shortage',
    'Comparing two quantities',
    'Finding a total from parts',
    'Working backwards from a result',
  ],
  questionChoices: [
    'How many items in total',
    'How many groups or people',
    'How many items per person',
    'The difference between excess and shortage',
  ],
  strategyChoices: [
    'Find the number of people first, then compute total items',
    'Draw a model and guess-and-check',
    'Use simultaneous equations',
    'Work backwards from the total',
  ],
  solveType: 'twoStep',
  solveSpec: {
    steps: [
      { operation: '÷', expression: '({excess} + {shortage}) ÷ ({giveB} - {giveA})', label: 'Find number of people' },
      { operation: '×+', expression: '{giveA} × {numPeople} + {excess}', label: 'Find total items' },
    ],
    answer: '{answer}',
  },
});

const groupingScaffold = () => strategyScaffold({
  understand: [
    'Arranging items in rows with excess or shortage',
    'Comparing two quantities',
    'Finding a total from parts',
    'Sharing items equally',
  ],
  questionChoices: [
    'How many rows or groups are there',
    'How many items in total',
    'How many items per row',
    'The difference between excess and shortage',
  ],
  strategyChoices: [
    'Use excess-and-shortage formula: (excess + shortage) ÷ difference per row',
    'Draw a model and guess-and-check',
    'Use simultaneous equations',
    'Work backwards from the total',
  ],
  solveType: 'expression',
  solveSpec: { operation: '÷', expression: '({excess} + {shortage}) ÷ ({perRowB} - {perRowA})', answer: '{answer}' },
});

// ─── Constraint presets ─────────────────────────────────────────────
const basicConstraints = {
  _generic: { giveA: { min: 3, max: 6 }, giveB: { min: 7, max: 12 }, excess: { min: 3, max: 15 }, shortage: { min: 3, max: 15 } },
  _computeStr: { diff: 'giveB - giveA', answer: '(excess + shortage) / (giveB - giveA)' },
  _integerKeys: ['answer'],
  answer: { min: 3 },
};

const bothExcessConstraints = {
  _generic: { giveA: { min: 3, max: 6 }, giveB: { min: 7, max: 12 }, excessA: { min: 10, max: 30 }, excessB: { min: 2, max: 9 } },
  _computeStr: { diff: 'giveB - giveA', answer: '(excessA - excessB) / (giveB - giveA)' },
  _integerKeys: ['answer'],
  answer: { min: 3 },
};

const equalShareConstraints = {
  _generic: { giveA: { min: 3, max: 6 }, giveB: { min: 7, max: 12 }, excess: { min: 4, max: 20 }, shortage: { min: 4, max: 20 } },
  _computeStr: { diff: 'giveB - giveA', numPeople: '(excess + shortage) / (giveB - giveA)', answer: 'giveA * ((excess + shortage) / (giveB - giveA)) + excess' },
  _integerKeys: ['numPeople', 'answer'],
  answer: { min: 15 },
};

const multiItemConstraints = {
  _generic: { giveA: { min: 2, max: 5 }, giveB: { min: 6, max: 10 }, excess: { min: 4, max: 18 }, shortage: { min: 4, max: 18 } },
  _computeStr: { diff: 'giveB - giveA', answer: '(excess + shortage) / (giveB - giveA)' },
  _integerKeys: ['answer'],
  answer: { min: 3 },
};

const groupingConstraints = {
  _generic: { perRowA: { min: 4, max: 8 }, perRowB: { min: 9, max: 15 }, excess: { min: 5, max: 20 }, shortage: { min: 5, max: 20 } },
  _computeStr: { diff: 'perRowB - perRowA', answer: '(excess + shortage) / (perRowB - perRowA)' },
  _integerKeys: ['answer'],
  answer: { min: 3 },
};

// ─── Templates ──────────────────────────────────────────────────────
const templates = [
  // ── P5 Basic (3) ──
  makeTemplate('psl-p5-es-basic-001', 'psl-p5-es-basic', 'excessShortage', {
    heuristic: 'excess-shortage',
    difficulty: 1,
    storyTemplate: 'A teacher has some stickers. If she gives {giveA} stickers to each student, she has {excess} left over. If she gives {giveB} stickers to each student, she is {shortage} short. How many students are there?',
    constraints: basicConstraints,
    scaffold: basicScaffold(),
  }),
  makeTemplate('psl-p5-es-basic-002', 'psl-p5-es-basic', 'excessShortage', {
    heuristic: 'excess-shortage',
    difficulty: 1,
    storyTemplate: 'Mrs Lim baked some cookies. If she packs {giveA} cookies into each goodie bag, she has {excess} cookies remaining. If she packs {giveB} cookies into each goodie bag, she is {shortage} cookies short. How many goodie bags does she need?',
    constraints: basicConstraints,
    scaffold: basicScaffold(),
  }),
  makeTemplate('psl-p5-es-basic-003', 'psl-p5-es-basic', 'excessShortage', {
    heuristic: 'excess-shortage',
    difficulty: 2,
    storyTemplate: 'A librarian is distributing assessment books. If she gives {giveA} books to each student, she has {excess} books left. If she gives {giveB} books to each student, she is {shortage} books short. How many students are there?',
    constraints: basicConstraints,
    scaffold: basicScaffold(),
  }),

  // ── P5 Both Excess (3) ──
  makeTemplate('psl-p5-es-both-excess-001', 'psl-p5-es-both-excess', 'excessShortage', {
    heuristic: 'excess-shortage',
    difficulty: 2,
    storyTemplate: 'Mr Tan has some oranges to pack for Chinese New Year. If he puts {giveA} oranges in each bag, he has {excessA} oranges left over. If he puts {giveB} oranges in each bag, he still has {excessB} oranges left over. How many bags does he have?',
    constraints: bothExcessConstraints,
    scaffold: bothExcessScaffold(),
  }),
  makeTemplate('psl-p5-es-both-excess-002', 'psl-p5-es-both-excess', 'excessShortage', {
    heuristic: 'excess-shortage',
    difficulty: 2,
    storyTemplate: 'A florist has some roses. If she puts {giveA} roses in each bouquet, she has {excessA} roses remaining. If she puts {giveB} roses in each bouquet, she has {excessB} roses remaining. How many bouquets can she make?',
    constraints: bothExcessConstraints,
    scaffold: bothExcessScaffold(),
  }),
  makeTemplate('psl-p5-es-both-excess-003', 'psl-p5-es-both-excess', 'excessShortage', {
    heuristic: 'excess-shortage',
    difficulty: 3,
    storyTemplate: 'Auntie May is packing mooncakes into boxes. If she packs {giveA} mooncakes per box, she has {excessA} extra mooncakes. If she packs {giveB} mooncakes per box, she has {excessB} extra mooncakes. How many boxes are there?',
    constraints: bothExcessConstraints,
    scaffold: bothExcessScaffold(),
  }),

  // ── P5 Equal Share (2) ──
  makeTemplate('psl-p5-es-equal-share-001', 'psl-p5-es-equal-share', 'excessShortage', {
    heuristic: 'excess-shortage',
    difficulty: 2,
    storyTemplate: 'A teacher has some sweets. If she gives {giveA} sweets to each pupil, she has {excess} sweets left over. If she gives {giveB} sweets to each pupil, she is {shortage} sweets short. How many sweets does the teacher have?',
    constraints: equalShareConstraints,
    scaffold: equalShareScaffold(),
  }),
  makeTemplate('psl-p5-es-equal-share-002', 'psl-p5-es-equal-share', 'excessShortage', {
    heuristic: 'excess-shortage',
    difficulty: 3,
    storyTemplate: 'Mr Wong bought some pencils for his class. If he gives {giveA} pencils to each student, he has {excess} pencils remaining. If he gives {giveB} pencils to each student, he is {shortage} pencils short. How many pencils did Mr Wong buy?',
    constraints: equalShareConstraints,
    scaffold: equalShareScaffold(),
  }),

  // ── P6 Multi-Item (3) ──
  makeTemplate('psl-p6-es-multi-item-001', 'psl-p6-es-multi-item', 'excessShortage', {
    heuristic: 'excess-shortage',
    difficulty: 3,
    storyTemplate: 'A shop owner is packing erasers and sharpeners into gift sets. If she puts {giveA} erasers in each set, she has {excess} erasers left over. If she puts {giveB} erasers in each set, she is {shortage} erasers short. How many gift sets is she preparing?',
    constraints: multiItemConstraints,
    scaffold: basicScaffold(),
  }),
  makeTemplate('psl-p6-es-multi-item-002', 'psl-p6-es-multi-item', 'excessShortage', {
    heuristic: 'excess-shortage',
    difficulty: 3,
    storyTemplate: 'Mrs Chen is distributing granola bars for Sports Day. If each team receives {giveA} bars, there are {excess} bars remaining. If each team receives {giveB} bars, there is a shortage of {shortage} bars. How many teams are participating?',
    constraints: multiItemConstraints,
    scaffold: basicScaffold(),
  }),
  makeTemplate('psl-p6-es-multi-item-003', 'psl-p6-es-multi-item', 'excessShortage', {
    heuristic: 'excess-shortage',
    difficulty: 4,
    storyTemplate: 'A caterer is packing curry puffs into boxes for a school event. If he packs {giveA} curry puffs per box, he has {excess} left over. If he packs {giveB} per box, he is {shortage} short. How many boxes does he have?',
    constraints: multiItemConstraints,
    scaffold: basicScaffold(),
  }),

  // ── P6 Combined (3) ──
  makeTemplate('psl-p6-es-combined-001', 'psl-p6-es-combined', 'excessShortage', {
    heuristic: 'excess-shortage',
    difficulty: 4,
    storyTemplate: 'Students are sharing markers for an art project. If each student takes {giveA} markers, there are {excess} markers left. If each student takes {giveB} markers, they are {shortage} markers short. How many students are in the class?',
    constraints: basicConstraints,
    scaffold: basicScaffold(),
  }),
  makeTemplate('psl-p6-es-combined-002', 'psl-p6-es-combined', 'excessShortage', {
    heuristic: 'excess-shortage',
    difficulty: 4,
    storyTemplate: 'A hawker is preparing satay sticks for a party. If each guest gets {giveA} sticks, there are {excess} sticks remaining. If each guest gets {giveB} sticks, the hawker is {shortage} sticks short. How many guests are expected?',
    constraints: basicConstraints,
    scaffold: basicScaffold(),
  }),
  makeTemplate('psl-p6-es-combined-003', 'psl-p6-es-combined', 'excessShortage', {
    heuristic: 'excess-shortage',
    difficulty: 4,
    storyTemplate: 'Mdm Lee bought badges for a school camp. If she gives {giveA} badges to each group, she has {excess} badges left. If she gives {giveB} badges to each group, she is {shortage} badges short. Find the number of groups.',
    constraints: {
      _generic: { giveA: { min: 4, max: 7 }, giveB: { min: 8, max: 14 }, excess: { min: 5, max: 20 }, shortage: { min: 5, max: 20 } },
      _computeStr: { diff: 'giveB - giveA', answer: '(excess + shortage) / (giveB - giveA)' },
      _integerKeys: ['answer'],
      answer: { min: 3 },
    },
    scaffold: basicScaffold(),
  }),

  // ── P6 Grouping (3) ──
  makeTemplate('psl-p6-es-grouping-001', 'psl-p6-es-grouping', 'excessShortage', {
    heuristic: 'excess-shortage',
    difficulty: 3,
    storyTemplate: 'Students are arranged in rows for a school photo. If there are {perRowA} students per row, there are {excess} extra students. If there are {perRowB} students per row, there is a shortage of {shortage} students. How many rows are there?',
    constraints: groupingConstraints,
    scaffold: groupingScaffold(),
  }),
  makeTemplate('psl-p6-es-grouping-002', 'psl-p6-es-grouping', 'excessShortage', {
    heuristic: 'excess-shortage',
    difficulty: 4,
    storyTemplate: 'Chairs are arranged in rows for a concert. If {perRowA} chairs are placed in each row, there are {excess} extra chairs. If {perRowB} chairs are placed in each row, {shortage} more chairs are needed. How many rows are there?',
    constraints: groupingConstraints,
    scaffold: groupingScaffold(),
  }),
  makeTemplate('psl-p6-es-grouping-003', 'psl-p6-es-grouping', 'excessShortage', {
    heuristic: 'excess-shortage',
    difficulty: 4,
    storyTemplate: 'Books are stacked on shelves in a library. If each shelf holds {perRowA} books, there are {excess} books left without a shelf. If each shelf holds {perRowB} books, {shortage} more books are needed to fill all shelves. How many shelves are there?',
    constraints: groupingConstraints,
    scaffold: groupingScaffold(),
  }),

  // ── P6 Word Problem (2) ──
  makeTemplate('psl-p6-es-word-problem-001', 'psl-p6-es-word-problem', 'excessShortage', {
    heuristic: 'excess-shortage',
    difficulty: 5,
    storyTemplate: 'A charity is distributing rice packets during Hari Raya. If each family receives {giveA} packets, there are {excess} packets remaining. If each family receives {giveB} packets, the charity needs {shortage} more packets. How many families will receive rice?',
    constraints: {
      _generic: { giveA: { min: 4, max: 8 }, giveB: { min: 9, max: 15 }, excess: { min: 6, max: 25 }, shortage: { min: 6, max: 25 } },
      _computeStr: { diff: 'giveB - giveA', answer: '(excess + shortage) / (giveB - giveA)' },
      _integerKeys: ['answer'],
      answer: { min: 3 },
    },
    scaffold: basicScaffold(),
  }),
  makeTemplate('psl-p6-es-word-problem-002', 'psl-p6-es-word-problem', 'excessShortage', {
    heuristic: 'excess-shortage',
    difficulty: 5,
    storyTemplate: 'A school is preparing goodie bags for National Day. If {giveA} items are placed in each bag, there are {excess} items left over. If {giveB} items are placed in each bag, {shortage} more items are needed. How many goodie bags are being prepared?',
    constraints: {
      _generic: { giveA: { min: 5, max: 8 }, giveB: { min: 10, max: 16 }, excess: { min: 8, max: 30 }, shortage: { min: 8, max: 30 } },
      _computeStr: { diff: 'giveB - giveA', answer: '(excess + shortage) / (giveB - giveA)' },
      _integerKeys: ['answer'],
      answer: { min: 3 },
    },
    scaffold: basicScaffold(),
  }),
];

// ─── Seed runner ────────────────────────────────────────────────────
async function seed() {
  await connectDB();
  console.log(`Seeding ${templates.length} excess-shortage templates …`);

  for (const t of templates) {
    await PSLProblemTemplate.findOneAndUpdate(
      { templateId: t.templateId },
      t,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    console.log(`  ✓ ${t.templateId}`);
  }

  console.log('Done.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
