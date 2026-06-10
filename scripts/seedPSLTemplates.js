import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLProblemTemplate from '../models/psl/PSLProblemTemplate.js';

const NAMES = ['Wei Ling', 'Jun Hao', 'Ravi', 'Siti', 'Mei Xin', 'Arun', 'Farah', 'Zhi Hao', 'Priya', 'Ahmad'];

const TEMPLATES = [
  // ── Part-Whole: Find the whole ─────────────────────────────────
  {
    templateId: 'psl-tpl-pw-whole-01',
    skillId: 'psl-p3-bar-pw-find-whole', structure: 'partWhole', unknownPosition: 'whole',
    operations: ['addition'], difficulty: 1,
    contexts: [
      { setting: 'market', entityA: 'red apples', entityB: 'green apples', itemPlural: 'apples', verb: 'bought' },
      { setting: 'school', entityA: 'fiction books', entityB: 'non-fiction books', itemPlural: 'books', verb: 'borrowed' },
      { setting: 'park', entityA: 'boys', entityB: 'girls', itemPlural: 'children', verb: 'counted' },
    ],
    constraints: { partA: { min: 20, max: 150 }, partB: { min: 20, max: 150 }, answer: { max: 300 } },
    storyTemplate: '{nameA} {verb} {partA} {entityA}. {nameA} also {verb} {partB} {entityB}. How many {itemPlural} did {nameA} {verb} altogether?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0 },
      identify_info: { type: 'highlight', expected: ['{partA}', '{partB}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0 },
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'expression', operation: 'addition', expression: '{partA} + {partB}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: {
      identify_info: ['psl/missed-number', 'psl/included-irrelevant'],
      plan: ['psl/wrong-model-type'],
      solve: ['psl/arithmetic-error'],
    },
  },
  {
    templateId: 'psl-tpl-pw-whole-02',
    skillId: 'psl-p3-bar-pw-find-whole', structure: 'partWhole', unknownPosition: 'whole',
    operations: ['addition'], difficulty: 1,
    contexts: [
      { setting: 'bakery', entityA: 'chocolate cakes', entityB: 'vanilla cakes', itemPlural: 'cakes', verb: 'baked' },
      { setting: 'garden', entityA: 'roses', entityB: 'sunflowers', itemPlural: 'flowers', verb: 'planted' },
    ],
    constraints: { partA: { min: 30, max: 200 }, partB: { min: 30, max: 200 }, answer: { max: 400 } },
    storyTemplate: 'A {setting} had {partA} {entityA} and {partB} {entityB}. How many {itemPlural} were there altogether?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0 },
      identify_info: { type: 'highlight', expected: ['{partA}', '{partB}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0 },
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'expression', operation: 'addition', expression: '{partA} + {partB}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error'] },
  },

  // ── Part-Whole: Find a part ────────────────────────────────────
  {
    templateId: 'psl-tpl-pw-part-01',
    skillId: 'psl-p3-bar-pw-find-part', structure: 'partWhole', unknownPosition: 'part',
    operations: ['subtraction'], difficulty: 1,
    contexts: [
      { setting: 'school', entityA: 'students', entityB: 'boys', entityC: 'girls', verb: 'are' },
      { setting: 'library', entityA: 'books', entityB: 'English books', entityC: 'Chinese books', verb: 'are' },
    ],
    constraints: { whole: { min: 50, max: 300 }, partA: { min: 20, max: 200 }, answer: { min: 10 } },
    storyTemplate: 'There {verb} {whole} {entityA} in the {setting}. {partA} of them {verb} {entityB}. How many {entityC} {verb} there?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0 },
      identify_info: { type: 'highlight', expected: ['{whole}', '{partA}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0 },
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'expression', operation: 'subtraction', expression: '{whole} - {partA}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-unknown-position'], solve: ['psl/wrong-operation', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-pw-part-02',
    skillId: 'psl-p3-bar-pw-find-part', structure: 'partWhole', unknownPosition: 'part',
    operations: ['subtraction'], difficulty: 1,
    contexts: [
      { setting: 'shop', entityA: 'stickers', verb: 'had', verbPast: 'gave away' },
      { setting: 'farm', entityA: 'eggs', verb: 'collected', verbPast: 'sold' },
    ],
    constraints: { whole: { min: 40, max: 250 }, partA: { min: 15, max: 180 }, answer: { min: 10 } },
    storyTemplate: '{nameA} {verb} {whole} {entityA}. {nameA} {verbPast} {partA} of them. How many {entityA} did {nameA} have left?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0 },
      identify_info: { type: 'highlight', expected: ['{whole}', '{partA}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0 },
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'expression', operation: 'subtraction', expression: '{whole} - {partA}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/wrong-operation'] },
  },

  // ── Part-Whole: 3-part whole ───────────────────────────────────
  {
    templateId: 'psl-tpl-pw-3parts-01',
    skillId: 'psl-p3-bar-pw-3parts', structure: 'partWhole', unknownPosition: 'whole',
    operations: ['addition'], difficulty: 2,
    contexts: [
      { setting: 'canteen', entityA: 'chicken rice', entityB: 'noodles', entityC: 'fried rice', itemPlural: 'meals', verb: 'sold' },
      { setting: 'art class', entityA: 'red beads', entityB: 'blue beads', entityC: 'yellow beads', itemPlural: 'beads', verb: 'used' },
    ],
    constraints: { partA: { min: 15, max: 100 }, partB: { min: 15, max: 100 }, partC: { min: 15, max: 100 }, answer: { max: 300 } },
    storyTemplate: 'The {setting} {verb} {partA} {entityA}, {partB} {entityB} and {partC} {entityC}. How many {itemPlural} were {verb} altogether?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0 },
      identify_info: { type: 'highlight', expected: ['{partA}', '{partB}', '{partC}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0 },
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'expression', operation: 'addition', expression: '{partA} + {partB} + {partC}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error'] },
  },

  // ── Part-Whole: Equal parts (multiplication) ───────────────────
  {
    templateId: 'psl-tpl-pw-mul-01',
    skillId: 'psl-p3-bar-pw-mul', structure: 'partWhole', unknownPosition: 'whole',
    operations: ['multiplication'], difficulty: 2,
    contexts: [
      { setting: 'party', entityA: 'bags', entityB: 'sweets', verb: 'packed' },
      { setting: 'classroom', entityA: 'rows', entityB: 'chairs', verb: 'arranged' },
    ],
    constraints: { groups: { min: 3, max: 9 }, perGroup: { min: 3, max: 9 }, answer: { max: 81 } },
    storyTemplate: '{nameA} {verb} {groups} {entityA} of {entityB}. Each {entityA2} had {perGroup} {entityB}. How many {entityB} were there altogether?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0 },
      identify_info: { type: 'highlight', expected: ['{groups}', '{perGroup}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0 },
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'expression', operation: 'multiplication', expression: '{groups} × {perGroup}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-model-type'], solve: ['psl/wrong-operation', 'psl/arithmetic-error'] },
  },

  // ── Comparison: Find the difference ────────────────────────────
  {
    templateId: 'psl-tpl-comp-diff-01',
    skillId: 'psl-p3-bar-comp-find-diff', structure: 'comparison', unknownPosition: 'difference',
    operations: ['subtraction'], difficulty: 1,
    contexts: [
      { setting: 'market', entityA: 'mangoes', entityB: 'oranges', verb: 'sold' },
      { setting: 'school', entityA: 'stickers', entityB: 'stickers', verb: 'collected' },
    ],
    constraints: { larger: { min: 50, max: 250 }, smaller: { min: 20, max: 200 }, answer: { min: 10 } },
    storyTemplate: '{nameA} {verb} {larger} {entityA}. {nameB} {verb} {smaller} {entityB}. How many more {entityA} did {nameA} {verb} than {nameB}?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0 },
      identify_info: { type: 'highlight', expected: ['{larger}', '{smaller}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0 },
      plan: { type: 'model', modelType: 'comparison', unknownPosition: 'difference' },
      solve: { type: 'expression', operation: 'subtraction', expression: '{larger} - {smaller}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-model-type'], solve: ['psl/wrong-operation'] },
  },
  {
    templateId: 'psl-tpl-comp-diff-02',
    skillId: 'psl-p3-bar-comp-find-diff', structure: 'comparison', unknownPosition: 'difference',
    operations: ['subtraction'], difficulty: 1,
    contexts: [
      { setting: 'swimming', entityA: 'laps', verb: 'swam' },
      { setting: 'reading', entityA: 'pages', verb: 'read' },
    ],
    constraints: { larger: { min: 30, max: 200 }, smaller: { min: 10, max: 150 }, answer: { min: 5 } },
    storyTemplate: '{nameA} {verb} {larger} {entityA}. {nameB} {verb} {smaller} {entityA}. How many fewer {entityA} did {nameB} {verb} than {nameA}?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0 },
      identify_info: { type: 'highlight', expected: ['{larger}', '{smaller}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0 },
      plan: { type: 'model', modelType: 'comparison', unknownPosition: 'difference' },
      solve: { type: 'expression', operation: 'subtraction', expression: '{larger} - {smaller}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/wrong-operation'] },
  },

  // ── Comparison: Find the larger ────────────────────────────────
  {
    templateId: 'psl-tpl-comp-larger-01',
    skillId: 'psl-p3-bar-comp-find-larger', structure: 'comparison', unknownPosition: 'larger',
    operations: ['addition'], difficulty: 2,
    contexts: [
      { setting: 'savings', entityA: 'dollars', verb: 'saved', comparison: 'more than' },
      { setting: 'collection', entityA: 'stamps', verb: 'has', comparison: 'more than' },
    ],
    constraints: { smaller: { min: 30, max: 200 }, difference: { min: 10, max: 100 }, answer: { max: 300 } },
    storyTemplate: '{nameA} {verb} {smaller} {entityA}. {nameB} {verb} {difference} {comparison} {nameA}. How many {entityA} does {nameB} have?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0 },
      identify_info: { type: 'highlight', expected: ['{smaller}', '{difference}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0 },
      plan: { type: 'model', modelType: 'comparison', unknownPosition: 'larger' },
      solve: { type: 'expression', operation: 'addition', expression: '{smaller} + {difference}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-unknown-position'], solve: ['psl/wrong-operation'] },
  },

  // ── Comparison: Find the smaller ───────────────────────────────
  {
    templateId: 'psl-tpl-comp-smaller-01',
    skillId: 'psl-p3-bar-comp-find-smaller', structure: 'comparison', unknownPosition: 'smaller',
    operations: ['subtraction'], difficulty: 2,
    contexts: [
      { setting: 'height', entityA: 'cm', verb: 'is', comparison: 'shorter than' },
      { setting: 'mass', entityA: 'kg', verb: 'weighs', comparison: 'less than' },
    ],
    constraints: { larger: { min: 50, max: 250 }, difference: { min: 10, max: 80 }, answer: { min: 10 } },
    storyTemplate: '{nameA} {verb} {larger} {entityA}. {nameB} {verb} {difference} {comparison} {nameA}. How many {entityA} does {nameB} have?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0 },
      identify_info: { type: 'highlight', expected: ['{larger}', '{difference}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0 },
      plan: { type: 'model', modelType: 'comparison', unknownPosition: 'smaller' },
      solve: { type: 'expression', operation: 'subtraction', expression: '{larger} - {difference}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-unknown-position'], solve: ['psl/wrong-operation'] },
  },

  // ── Comparison: Compare then total ─────────────────────────────
  {
    templateId: 'psl-tpl-comp-total-01',
    skillId: 'psl-p3-bar-comp-total', structure: 'comparison', unknownPosition: 'larger',
    operations: ['addition'], difficulty: 3,
    contexts: [
      { setting: 'fruit stall', entityA: 'apples', entityB: 'oranges', verb: 'sold', comparison: 'more' },
      { setting: 'library', entityA: 'books', entityB: 'magazines', verb: 'returned', comparison: 'more' },
    ],
    constraints: { smaller: { min: 30, max: 150 }, difference: { min: 10, max: 60 }, answer: { max: 400 } },
    storyTemplate: '{nameA} {verb} {smaller} {entityA}. {nameB} {verb} {difference} {comparison} {entityB} than {nameA}. How many {entityA} and {entityB} did they {verb} altogether?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0 },
      identify_info: { type: 'highlight', expected: ['{smaller}', '{difference}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0 },
      plan: { type: 'model', modelType: 'comparison', unknownPosition: 'larger' },
      solve: { type: 'twoStep', steps: [
        { operation: 'addition', expression: '{smaller} + {difference}', label: 'Find the larger' },
        { operation: 'addition', expression: '{smaller} + {larger}', label: 'Find the total' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-model-type'], solve: ['psl/used-wrong-numbers', 'psl/arithmetic-error'] },
  },

  // ── Two-Step: part-whole + comparison ──────────────────────────
  {
    templateId: 'psl-tpl-twostep-pw-comp-01',
    skillId: 'psl-p3-twostep-pw-comp', structure: 'twoStep', unknownPosition: 'difference',
    operations: ['subtraction'], difficulty: 3,
    contexts: [
      { setting: 'sports day', entityA: 'red team', entityB: 'blue team', entityC: 'yellow team', itemPlural: 'points', verb: 'scored' },
    ],
    constraints: { whole: { min: 100, max: 300 }, partA: { min: 30, max: 150 }, partB: { min: 30, max: 150 }, answer: { min: 5 } },
    storyTemplate: '{entityA} and {entityB} {verb} {whole} {itemPlural} altogether. {entityA} {verb} {partA} {itemPlural}. How many more {itemPlural} did one team score than the other?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0 },
      identify_info: { type: 'highlight', expected: ['{whole}', '{partA}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0 },
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'twoStep', steps: [
        { operation: 'subtraction', expression: '{whole} - {partA}', label: 'Find the other part' },
        { operation: 'subtraction', expression: '{partA} - {partB}', label: 'Find the difference' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-model-type'], solve: ['psl/used-wrong-numbers', 'psl/arithmetic-error'] },
  },

  // ── Two-Step: comparison + part-whole ──────────────────────────
  {
    templateId: 'psl-tpl-twostep-comp-pw-01',
    skillId: 'psl-p3-twostep-comp-pw', structure: 'twoStep', unknownPosition: 'whole',
    operations: ['addition'], difficulty: 3,
    contexts: [
      { setting: 'bookshop', entityA: 'English books', entityB: 'Chinese books', verb: 'bought', comparison: 'more' },
    ],
    constraints: { smaller: { min: 20, max: 120 }, difference: { min: 10, max: 60 }, answer: { max: 300 } },
    storyTemplate: '{nameA} {verb} {smaller} {entityA}. {nameA} {verb} {difference} {comparison} {entityB} than {entityA}. How many books did {nameA} buy altogether?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0 },
      identify_info: { type: 'highlight', expected: ['{smaller}', '{difference}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0 },
      plan: { type: 'model', modelType: 'comparison', unknownPosition: 'larger' },
      solve: { type: 'twoStep', steps: [
        { operation: 'addition', expression: '{smaller} + {difference}', label: 'Find the larger' },
        { operation: 'addition', expression: '{smaller} + {larger}', label: 'Find the total' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-model-type'], solve: ['psl/used-wrong-numbers', 'psl/arithmetic-error'] },
  },
];

async function seed() {
  await connectDB();
  let upserted = 0;
  for (const tpl of TEMPLATES) {
    await PSLProblemTemplate.findOneAndUpdate(
      { templateId: tpl.templateId },
      { $set: tpl },
      { upsert: true, new: true },
    );
    upserted++;
  }
  console.log(`Seeded ${upserted} PSL problem templates.`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
