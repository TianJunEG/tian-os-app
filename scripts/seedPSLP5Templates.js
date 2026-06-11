import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLProblemTemplate from '../models/psl/PSLProblemTemplate.js';

const TEMPLATES = [
  // ══════════════════════════════════════════════════════════════════════
  //  psl-p5-bar-frac-whole — Fraction of whole (find total)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-p5-frac-whole-01',
    skillId: 'psl-p5-bar-frac-whole', structure: 'partWhole', unknownPosition: 'whole',
    heuristic: 'bar-model', operations: ['multiplication'], difficulty: 3,
    contexts: [
      { setting: 'bakery', item: 'cookies', verb: 'ate', fracNum: '2', fracDen: '5' },
      { setting: 'school library', item: 'books', verb: 'borrowed', fracNum: '3', fracDen: '4' },
    ],
    constraints: { groups: { min: 3, max: 5 }, perGroup: { min: 20, max: 60 } },
    storyTemplate: '{nameA} {verb} {fracNum}/{fracDen} of the {item} in the {setting}. {nameA} {verb} {part} {item}. How many {item} were there altogether?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding the total when a fraction of it is known', 'Adding two groups of items together', 'Comparing two fractions', 'Subtracting a fraction from a whole',
      ]},
      identify_info: { type: 'highlight', expected: ['{fracNum}/{fracDen}', '{part}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total number of {item}', 'How many {item} are left', 'What fraction was not {verb}', 'How many more {item} {nameA} needs',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'expression', operation: 'multiplication', expression: '{groups} × {perGroup}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-fraction'], plan: ['psl/wrong-model-type'], solve: ['psl/fraction-denom-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p5-frac-whole-02',
    skillId: 'psl-p5-bar-frac-whole', structure: 'partWhole', unknownPosition: 'whole',
    heuristic: 'bar-model', operations: ['multiplication'], difficulty: 3,
    contexts: [
      { setting: 'hawker centre', item: 'plates of chicken rice', verb: 'sold', fracNum: '3', fracDen: '5' },
      { setting: 'MRT station', item: 'passengers', verb: 'alighted', fracNum: '2', fracDen: '3' },
    ],
    constraints: { groups: { min: 3, max: 5 }, perGroup: { min: 25, max: 50 } },
    storyTemplate: 'At a {setting}, {fracNum}/{fracDen} of the {item} were sold in the morning. {part} {item} were sold in the morning. How many {item} were there in total?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding the total from a known fraction', 'Comparing morning and afternoon sales', 'Finding the difference between two amounts', 'Sharing items equally among groups',
      ]},
      identify_info: { type: 'highlight', expected: ['{fracNum}/{fracDen}', '{part}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total number of {item}', 'How many were sold in the afternoon', 'The fraction sold in the afternoon', 'How many more were sold in the morning',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'expression', operation: 'multiplication', expression: '{groups} × {perGroup}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-fraction'], solve: ['psl/fraction-denom-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p5-frac-whole-03',
    skillId: 'psl-p5-bar-frac-whole', structure: 'partWhole', unknownPosition: 'whole',
    heuristic: 'bar-model', operations: ['multiplication'], difficulty: 3,
    contexts: [
      { setting: 'community centre', item: 'seats', verb: 'filled', fracNum: '4', fracDen: '5' },
      { setting: 'car park', item: 'lots', verb: 'occupied', fracNum: '3', fracDen: '4' },
    ],
    constraints: { groups: { min: 4, max: 5 }, perGroup: { min: 20, max: 60 } },
    storyTemplate: '{fracNum}/{fracDen} of the {item} at a {setting} were {verb}. {part} {item} were {verb}. Find the total number of {item} at the {setting}.',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Working out the total when a fraction is given', 'Subtracting to find how many are empty', 'Comparing full and empty seats', 'Dividing seats into equal groups',
      ]},
      identify_info: { type: 'highlight', expected: ['{fracNum}/{fracDen}', '{part}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total number of {item}', 'How many {item} are empty', 'The fraction that is empty', 'How many rows there are',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'expression', operation: 'multiplication', expression: '{groups} × {perGroup}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-model-type'], solve: ['psl/fraction-denom-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  psl-p5-bar-frac-part — Find fraction of a quantity
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-p5-frac-part-01',
    skillId: 'psl-p5-bar-frac-part', structure: 'partWhole', unknownPosition: 'part',
    heuristic: 'bar-model', operations: ['multiplication', 'division'], difficulty: 3,
    contexts: [
      { setting: 'school', item: 'students', verb: 'joined', activity: 'the art club', fracNum: '2', fracDen: '3' },
      { setting: 'supermarket', item: 'fruits', verb: 'were', activity: 'ripe', fracNum: '3', fracDen: '4' },
    ],
    constraints: { groups: { min: 2, max: 4 }, perGroup: { min: 15, max: 40 } },
    storyTemplate: 'There are {total} {item} in the {setting}. {fracNum}/{fracDen} of the {item} {verb} {activity}. How many {item} {verb} {activity}?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding a fraction of a known total', 'Adding two groups together', 'Finding the total from a fraction', 'Comparing two fractions',
      ]},
      identify_info: { type: 'highlight', expected: ['{total}', '{fracNum}/{fracDen}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The number of {item} that {verb} {activity}', 'The total number of {item}', 'The fraction that did not join', 'How many groups there are',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'expression', operation: 'multiplication', expression: '{total} ÷ {fracDen} × {fracNum}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-fraction'], solve: ['psl/fraction-denom-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p5-frac-part-02',
    skillId: 'psl-p5-bar-frac-part', structure: 'partWhole', unknownPosition: 'part',
    heuristic: 'bar-model', operations: ['multiplication', 'division'], difficulty: 3,
    contexts: [
      { setting: 'park', item: 'trees', verb: 'were', activity: 'rain trees', fracNum: '2', fracDen: '4' },
      { setting: 'bookshop', item: 'books', verb: 'were', activity: 'fiction', fracNum: '3', fracDen: '4' },
    ],
    constraints: { groups: { min: 2, max: 4 }, perGroup: { min: 20, max: 35 } },
    storyTemplate: 'A {setting} had {total} {item}. {fracNum}/{fracDen} of them {verb} {activity}. How many {item} {verb} {activity}?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding part of a collection using a fraction', 'Removing some items from a collection', 'Sharing items equally among friends', 'Comparing two collections of items',
      ]},
      identify_info: { type: 'highlight', expected: ['{total}', '{fracNum}/{fracDen}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many {item} {verb} {activity}', 'How many {item} in all', 'The fraction that are not {activity}', 'How many more {activity} than others',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'expression', operation: 'multiplication', expression: '{total} ÷ {fracDen} × {fracNum}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/fraction-denom-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p5-frac-part-03',
    skillId: 'psl-p5-bar-frac-part', structure: 'partWhole', unknownPosition: 'part',
    heuristic: 'bar-model', operations: ['multiplication', 'division'], difficulty: 3,
    contexts: [
      { setting: 'swimming pool', item: 'swimmers', verb: 'were', activity: 'children', fracNum: '3', fracDen: '4' },
      { setting: 'canteen', item: 'meals', verb: 'were', activity: 'vegetarian', fracNum: '2', fracDen: '3' },
    ],
    constraints: { groups: { min: 3, max: 4 }, perGroup: { min: 15, max: 40 } },
    storyTemplate: 'There were {total} {item} at the {setting}. {fracNum}/{fracDen} of them {verb} {activity}. Find the number of {item} that {verb} {activity}.',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Calculating a fraction of a total', 'Adding two amounts together', 'Finding the total from a fraction', 'Finding the difference between two groups',
      ]},
      identify_info: { type: 'highlight', expected: ['{total}', '{fracNum}/{fracDen}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The number of {activity} {item}', 'The total number of {item}', 'How many are not {activity}', 'The fraction of adults',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'expression', operation: 'multiplication', expression: '{total} ÷ {fracDen} × {fracNum}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-fraction'], solve: ['psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  psl-p5-bar-frac-remainder — Find remainder after fraction
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-p5-frac-rem-01',
    skillId: 'psl-p5-bar-frac-remainder', structure: 'partWhole', unknownPosition: 'part',
    heuristic: 'bar-model', operations: ['division', 'subtraction'], difficulty: 3,
    contexts: [
      { setting: 'party', item: 'balloons', verb: 'burst', fracNum: '2', fracDen: '3' },
      { setting: 'orchard', item: 'durians', verb: 'sold', fracNum: '3', fracDen: '5' },
    ],
    constraints: { groups: { min: 2, max: 3 }, perGroup: { min: 20, max: 50 } },
    storyTemplate: '{nameA} had {total} {item}. {fracNum}/{fracDen} of the {item} {verb}. How many {item} did {nameA} have left?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding what is left after a fraction is removed', 'Adding more items to a collection', 'Sharing items equally into groups', 'Comparing two different amounts',
      ]},
      identify_info: { type: 'highlight', expected: ['{total}', '{fracNum}/{fracDen}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many {item} are left', 'The total number of {item}', 'How many {item} {verb}', 'The fraction remaining',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'twoStep', steps: [
        { operation: 'division', expression: '{total} ÷ {fracDen} × {fracNum}', label: 'Find the fraction that {verb}' },
        { operation: 'subtraction', expression: '{total} - {fractionPart}', label: 'Find the remainder' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-model-type'], solve: ['psl/fraction-denom-error', 'psl/forgot-subtract'] },
  },
  {
    templateId: 'psl-tpl-p5-frac-rem-02',
    skillId: 'psl-p5-bar-frac-remainder', structure: 'partWhole', unknownPosition: 'part',
    heuristic: 'bar-model', operations: ['division', 'subtraction'], difficulty: 3,
    contexts: [
      { setting: 'school', item: 'markers', verb: 'were dried out', fracNum: '1', fracDen: '3' },
      { setting: 'farm', item: 'eggs', verb: 'were cracked', fracNum: '2', fracDen: '5' },
    ],
    constraints: { groups: { min: 2, max: 3 }, perGroup: { min: 25, max: 45 } },
    storyTemplate: 'A {setting} had {total} {item}. {fracNum}/{fracDen} of the {item} {verb}. How many {item} were still good?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Subtracting a fractional part to find the rest', 'Finding a fraction of a number', 'Adding items from two groups', 'Comparing good and bad items',
      ]},
      identify_info: { type: 'highlight', expected: ['{total}', '{fracNum}/{fracDen}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many {item} were still good', 'The total number of {item}', 'How many {item} {verb}', 'What fraction were good',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'twoStep', steps: [
        { operation: 'division', expression: '{total} ÷ {fracDen} × {fracNum}', label: 'Find the fraction that {verb}' },
        { operation: 'subtraction', expression: '{total} - {fractionPart}', label: 'Find the remainder' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/fraction-denom-error', 'psl/forgot-subtract'] },
  },
  {
    templateId: 'psl-tpl-p5-frac-rem-03',
    skillId: 'psl-p5-bar-frac-remainder', structure: 'partWhole', unknownPosition: 'part',
    heuristic: 'bar-model', operations: ['division', 'subtraction'], difficulty: 3,
    contexts: [
      { setting: 'warehouse', item: 'boxes', verb: 'were shipped out', fracNum: '2', fracDen: '3' },
      { setting: 'garden', item: 'plants', verb: 'wilted', fracNum: '1', fracDen: '2' },
    ],
    constraints: { groups: { min: 2, max: 3 }, perGroup: { min: 30, max: 50 } },
    storyTemplate: 'There were {total} {item} in the {setting}. {fracNum}/{fracDen} of them {verb}. How many {item} remained in the {setting}?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding the remainder after a fraction is taken away', 'Combining two groups of items', 'Splitting items into equal groups', 'Finding the larger of two groups',
      ]},
      identify_info: { type: 'highlight', expected: ['{total}', '{fracNum}/{fracDen}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many {item} remained', 'The total number of {item}', 'How many {item} {verb}', 'The fraction that remained',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'twoStep', steps: [
        { operation: 'division', expression: '{total} ÷ {fracDen} × {fracNum}', label: 'Find the fraction that {verb}' },
        { operation: 'subtraction', expression: '{total} - {fractionPart}', label: 'Find the remainder' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-model-type'], solve: ['psl/fraction-denom-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  psl-p5-bar-ratio-share — Share in a given ratio
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-p5-ratio-share-01',
    skillId: 'psl-p5-bar-ratio-share', structure: 'partWhole', unknownPosition: 'whole',
    heuristic: 'bar-model', operations: ['multiplication', 'addition'], difficulty: 3,
    contexts: [
      { setting: 'classroom', item: 'stickers', ratioA: '2', ratioB: '3' },
      { setting: 'bakery', item: 'mooncakes', ratioA: '3', ratioB: '5' },
    ],
    constraints: { groups: { min: 2, max: 5 }, perGroup: { min: 10, max: 30 } },
    storyTemplate: '{nameA} and {nameB} shared {total} {item} in the ratio {ratioA} : {ratioB}. How many {item} did {nameA} receive?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Sharing a total in a given ratio', 'Dividing items equally between two people', 'Comparing two collections', 'Finding the total from parts',
      ]},
      identify_info: { type: 'highlight', expected: ['{total}', '{ratioA} : {ratioB}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many {item} {nameA} received', 'The total number of {item}', 'The difference between their shares', 'The ratio of their shares',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'twoStep', steps: [
        { operation: 'division', expression: '{total} ÷ ({ratioA} + {ratioB})', label: 'Find the value of 1 unit' },
        { operation: 'multiplication', expression: '{perGroup} × {ratioA}', label: 'Find {nameA}\'s share' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-ratio'], plan: ['psl/wrong-model-type'], solve: ['psl/ratio-unit-error'] },
  },
  {
    templateId: 'psl-tpl-p5-ratio-share-02',
    skillId: 'psl-p5-bar-ratio-share', structure: 'partWhole', unknownPosition: 'whole',
    heuristic: 'bar-model', operations: ['multiplication', 'addition'], difficulty: 3,
    contexts: [
      { setting: 'canteen', item: 'curry puffs', ratioA: '3', ratioB: '4' },
      { setting: 'camp', item: 'tent pegs', ratioA: '2', ratioB: '5' },
    ],
    constraints: { groups: { min: 2, max: 5 }, perGroup: { min: 12, max: 28 } },
    storyTemplate: '{nameA} and {nameB} packed {total} {item} in the ratio {ratioA} : {ratioB}. How many {item} did {nameB} pack?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Dividing a total into a ratio between two people', 'Adding two amounts together', 'Comparing what two people brought', 'Taking items away from a total',
      ]},
      identify_info: { type: 'highlight', expected: ['{total}', '{ratioA} : {ratioB}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many {item} {nameB} packed', 'The total number of {item}', 'How many more {nameB} packed than {nameA}', 'The ratio in simplest form',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'twoStep', steps: [
        { operation: 'division', expression: '{total} ÷ ({ratioA} + {ratioB})', label: 'Find the value of 1 unit' },
        { operation: 'multiplication', expression: '{perGroup} × {ratioB}', label: 'Find {nameB}\'s share' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-ratio'], solve: ['psl/ratio-unit-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p5-ratio-share-03',
    skillId: 'psl-p5-bar-ratio-share', structure: 'partWhole', unknownPosition: 'whole',
    heuristic: 'bar-model', operations: ['multiplication', 'addition'], difficulty: 3,
    contexts: [
      { setting: 'art room', item: 'paint tubes', ratioA: '4', ratioB: '3' },
      { setting: 'sports store', item: 'shuttlecocks', ratioA: '5', ratioB: '2' },
    ],
    constraints: { groups: { min: 3, max: 5 }, perGroup: { min: 10, max: 25 } },
    storyTemplate: 'The {setting} divided {total} {item} between Class A and Class B in the ratio {ratioA} : {ratioB}. How many {item} did Class A get?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Sharing a total amount using a ratio', 'Subtracting items from a stock', 'Finding how many groups fit', 'Comparing prices of two items',
      ]},
      identify_info: { type: 'highlight', expected: ['{total}', '{ratioA} : {ratioB}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many {item} Class A received', 'The total number of {item}', 'How many more Class A got than Class B', 'The cost of each {item}',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'twoStep', steps: [
        { operation: 'division', expression: '{total} ÷ ({ratioA} + {ratioB})', label: 'Find the value of 1 unit' },
        { operation: 'multiplication', expression: '{perGroup} × {ratioA}', label: 'Find Class A\'s share' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/ratio-unit-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  psl-p5-bar-ratio-diff — Find difference given ratio
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-p5-ratio-diff-01',
    skillId: 'psl-p5-bar-ratio-diff', structure: 'comparison', unknownPosition: 'difference',
    heuristic: 'bar-model', operations: ['division', 'subtraction'], difficulty: 4,
    contexts: [
      { setting: 'savings', item: 'dollars', ratioA: '5', ratioB: '3' },
      { setting: 'stamp collection', item: 'stamps', ratioA: '7', ratioB: '4' },
    ],
    constraints: { groups: { min: 2, max: 4 }, perGroup: { min: 15, max: 35 } },
    storyTemplate: '{nameA} and {nameB} have {item} in the ratio {ratioA} : {ratioB}. {nameA} has {largerAmt} {item}. How many more {item} does {nameA} have than {nameB}?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding the difference between two amounts in a ratio', 'Adding two people\'s savings together', 'Finding the total amount saved', 'Sharing money equally',
      ]},
      identify_info: { type: 'highlight', expected: ['{ratioA} : {ratioB}', '{largerAmt}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many more {item} {nameA} has than {nameB}', 'The total number of {item}', 'How many {item} {nameB} has', 'The ratio in simplest form',
      ]},
      plan: { type: 'model', modelType: 'comparison', unknownPosition: 'difference' },
      solve: { type: 'twoStep', steps: [
        { operation: 'division', expression: '{largerAmt} ÷ {ratioA}', label: 'Find the value of 1 unit' },
        { operation: 'multiplication', expression: '{perGroup} × ({ratioA} - {ratioB})', label: 'Find the difference' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-model-type'], solve: ['psl/ratio-unit-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p5-ratio-diff-02',
    skillId: 'psl-p5-bar-ratio-diff', structure: 'comparison', unknownPosition: 'difference',
    heuristic: 'bar-model', operations: ['division', 'subtraction'], difficulty: 4,
    contexts: [
      { setting: 'reading challenge', item: 'books', ratioA: '4', ratioB: '3' },
      { setting: 'marble game', item: 'marbles', ratioA: '5', ratioB: '2' },
    ],
    constraints: { groups: { min: 2, max: 4 }, perGroup: { min: 18, max: 30 } },
    storyTemplate: 'The number of {item} {nameA} has to the number {nameB} has is {ratioA} : {ratioB}. If {nameB} has {smallerAmt} {item}, how many more {item} does {nameA} have?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Using a ratio to find how many more one person has', 'Finding the total between two people', 'Splitting items into equal groups', 'Subtracting one amount from another',
      ]},
      identify_info: { type: 'highlight', expected: ['{ratioA} : {ratioB}', '{smallerAmt}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many more {item} {nameA} has than {nameB}', 'The total number of {item}', 'How many {item} {nameA} has', 'The simplified ratio',
      ]},
      plan: { type: 'model', modelType: 'comparison', unknownPosition: 'difference' },
      solve: { type: 'twoStep', steps: [
        { operation: 'division', expression: '{smallerAmt} ÷ {ratioB}', label: 'Find the value of 1 unit' },
        { operation: 'multiplication', expression: '{perGroup} × ({ratioA} - {ratioB})', label: 'Find the difference' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/ratio-unit-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p5-ratio-diff-03',
    skillId: 'psl-p5-bar-ratio-diff', structure: 'comparison', unknownPosition: 'difference',
    heuristic: 'bar-model', operations: ['division', 'subtraction'], difficulty: 4,
    contexts: [
      { setting: 'bead-making', item: 'beads', ratioA: '6', ratioB: '4' },
      { setting: 'coin collection', item: 'coins', ratioA: '3', ratioB: '2' },
    ],
    constraints: { groups: { min: 3, max: 4 }, perGroup: { min: 15, max: 35 } },
    storyTemplate: '{nameA} and {nameB} collected {item} in the ratio {ratioA} : {ratioB}. {nameA} collected {largerAmt} {item}. Find the difference between their collections.',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Comparing two collections using a ratio', 'Combining two collections together', 'Finding the total across both collections', 'Sharing a collection equally',
      ]},
      identify_info: { type: 'highlight', expected: ['{ratioA} : {ratioB}', '{largerAmt}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The difference between their collections', 'The total number of {item}', 'How many {item} {nameB} has', 'How many groups they made',
      ]},
      plan: { type: 'model', modelType: 'comparison', unknownPosition: 'difference' },
      solve: { type: 'twoStep', steps: [
        { operation: 'division', expression: '{largerAmt} ÷ {ratioA}', label: 'Find the value of 1 unit' },
        { operation: 'multiplication', expression: '{perGroup} × ({ratioA} - {ratioB})', label: 'Find the difference' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-model-type'], solve: ['psl/ratio-unit-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  psl-p5-bar-comp-multi — "N times as many" comparison
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-p5-comp-multi-01',
    skillId: 'psl-p5-bar-comp-multi', structure: 'comparison', unknownPosition: 'larger',
    heuristic: 'bar-model', operations: ['multiplication'], difficulty: 3,
    contexts: [
      { setting: 'library', entityA: 'storybooks', entityB: 'comics' },
      { setting: 'garden', entityA: 'roses', entityB: 'orchids' },
    ],
    constraints: { smaller: { min: 30, max: 150 }, groups: { min: 2, max: 4 } },
    storyTemplate: '{nameA} has {smaller} {entityB}. {nameA} has {groups} times as many {entityA} as {entityB}. How many {entityA} does {nameA} have?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'One amount is a multiple of another', 'Adding two groups of items', 'Finding the difference between two groups', 'Sharing items between two people',
      ]},
      identify_info: { type: 'highlight', expected: ['{smaller}', '{groups} times'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The number of {entityA}', 'The total of {entityA} and {entityB}', 'How many more {entityA} than {entityB}', 'The number of {entityB}',
      ]},
      plan: { type: 'model', modelType: 'comparison', unknownPosition: 'larger' },
      solve: { type: 'expression', operation: 'multiplication', expression: '{smaller} × {groups}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-model-type'], solve: ['psl/wrong-operation', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p5-comp-multi-02',
    skillId: 'psl-p5-bar-comp-multi', structure: 'comparison', unknownPosition: 'larger',
    heuristic: 'bar-model', operations: ['multiplication'], difficulty: 3,
    contexts: [
      { setting: 'pet shop', entityA: 'guppies', entityB: 'goldfish' },
      { setting: 'car park', entityA: 'motorcycles', entityB: 'cars' },
    ],
    constraints: { smaller: { min: 40, max: 120 }, groups: { min: 2, max: 4 } },
    storyTemplate: 'A {setting} had {smaller} {entityB}. It had {groups} times as many {entityA} as {entityB}. How many {entityA} were there?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'One quantity being a multiple of another', 'Finding the sum of two quantities', 'Subtracting to find the remainder', 'Dividing items into equal groups',
      ]},
      identify_info: { type: 'highlight', expected: ['{smaller}', '{groups} times'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The number of {entityA}', 'The total number in the {setting}', 'How many fewer {entityB} there are', 'How many groups there are',
      ]},
      plan: { type: 'model', modelType: 'comparison', unknownPosition: 'larger' },
      solve: { type: 'expression', operation: 'multiplication', expression: '{smaller} × {groups}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/wrong-operation', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p5-comp-multi-03',
    skillId: 'psl-p5-bar-comp-multi', structure: 'comparison', unknownPosition: 'larger',
    heuristic: 'bar-model', operations: ['multiplication'], difficulty: 3,
    contexts: [
      { setting: 'food court', entityA: 'chicken wings', entityB: 'satay sticks' },
      { setting: 'craft shop', entityA: 'ribbons', entityB: 'buttons' },
    ],
    constraints: { smaller: { min: 35, max: 150 }, groups: { min: 3, max: 4 } },
    storyTemplate: '{nameA} bought {smaller} {entityB} from the {setting}. {nameA} bought {groups} times as many {entityA}. How many {entityA} did {nameA} buy?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Multiplying to find a larger quantity', 'Adding purchases together', 'Finding the change after buying', 'Splitting a purchase equally',
      ]},
      identify_info: { type: 'highlight', expected: ['{smaller}', '{groups} times'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The number of {entityA} bought', 'The total items bought', 'How much {nameA} spent', 'The difference between the two items',
      ]},
      plan: { type: 'model', modelType: 'comparison', unknownPosition: 'larger' },
      solve: { type: 'expression', operation: 'multiplication', expression: '{smaller} × {groups}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/wrong-operation'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  psl-p5-bar-twostep-frac — Fraction then comparison
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-p5-twostep-frac-01',
    skillId: 'psl-p5-bar-twostep-frac', structure: 'twoStep', unknownPosition: 'part',
    heuristic: 'bar-model', operations: ['division', 'subtraction'], difficulty: 4,
    contexts: [
      { setting: 'National Day celebration', entityA: 'red balloons', entityB: 'white balloons', fracNum: '3', fracDen: '4' },
      { setting: 'school fair', entityA: 'game tokens', entityB: 'food tokens', fracNum: '2', fracDen: '3' },
    ],
    constraints: { groups: { min: 2, max: 4 }, perGroup: { min: 20, max: 50 } },
    storyTemplate: '{nameA} had {total} {entityA}. {fracNum}/{fracDen} of them were used. {nameA} also had {otherAmt} {entityB}. How many more {entityB} than remaining {entityA} did {nameA} have?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding a fraction, then comparing with another amount', 'Adding fractions together', 'Sharing items in a ratio', 'Finding the total of two groups',
      ]},
      identify_info: { type: 'highlight', expected: ['{total}', '{fracNum}/{fracDen}', '{otherAmt}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many more {entityB} than remaining {entityA}', 'The total number of items', 'How many {entityA} were used', 'The fraction of {entityB}',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'twoStep', steps: [
        { operation: 'subtraction', expression: '{total} - ({total} ÷ {fracDen} × {fracNum})', label: 'Find remaining {entityA}' },
        { operation: 'subtraction', expression: '{otherAmt} - {remaining}', label: 'Find the difference' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/missed-step'], solve: ['psl/fraction-denom-error', 'psl/forgot-subtract'] },
  },
  {
    templateId: 'psl-tpl-p5-twostep-frac-02',
    skillId: 'psl-p5-bar-twostep-frac', structure: 'twoStep', unknownPosition: 'part',
    heuristic: 'bar-model', operations: ['division', 'subtraction'], difficulty: 4,
    contexts: [
      { setting: 'bakery', entityA: 'pineapple tarts', entityB: 'kueh lapis pieces', fracNum: '2', fracDen: '3' },
      { setting: 'market', entityA: 'prawns', entityB: 'crabs', fracNum: '3', fracDen: '5' },
    ],
    constraints: { groups: { min: 3, max: 4 }, perGroup: { min: 20, max: 45 } },
    storyTemplate: 'A {setting} made {total} {entityA}. {fracNum}/{fracDen} were sold in the morning. In the afternoon, the {setting} made {extraAmt} more {entityA}. How many {entityA} did the {setting} have at the end of the day?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding a remainder after selling a fraction, then adding more', 'Finding a fraction of a total', 'Comparing morning and afternoon sales', 'Dividing items equally between shifts',
      ]},
      identify_info: { type: 'highlight', expected: ['{total}', '{fracNum}/{fracDen}', '{extraAmt}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many {entityA} at the end of the day', 'How many were sold in the morning', 'The total made across both shifts', 'The fraction sold overall',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'twoStep', steps: [
        { operation: 'subtraction', expression: '{total} - ({total} ÷ {fracDen} × {fracNum})', label: 'Find unsold after morning' },
        { operation: 'addition', expression: '{remaining} + {extraAmt}', label: 'Add afternoon batch' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/missed-step'], solve: ['psl/fraction-denom-error'] },
  },
  {
    templateId: 'psl-tpl-p5-twostep-frac-03',
    skillId: 'psl-p5-bar-twostep-frac', structure: 'twoStep', unknownPosition: 'part',
    heuristic: 'bar-model', operations: ['division', 'multiplication', 'subtraction'], difficulty: 4,
    contexts: [
      { setting: 'warehouse', entityA: 'boxes of tissue', entityB: 'boxes of soap', fracNum: '1', fracDen: '4' },
      { setting: 'bookshop', entityA: 'English books', entityB: 'Chinese books', fracNum: '2', fracDen: '3' },
    ],
    constraints: { groups: { min: 2, max: 4 }, perGroup: { min: 25, max: 50 } },
    storyTemplate: '{nameA} had {total} {entityA}. {nameA} gave away {fracNum}/{fracDen} of them. {nameB} had {groups} times as many {entityA} as {nameA} had left. How many {entityA} did {nameB} have?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding a remainder after a fraction, then multiplying', 'Adding fractions of two amounts', 'Comparing fractions of different totals', 'Sharing items in a ratio',
      ]},
      identify_info: { type: 'highlight', expected: ['{total}', '{fracNum}/{fracDen}', '{groups} times'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many {entityA} {nameB} had', 'How many {entityA} {nameA} gave away', 'The total for both {nameA} and {nameB}', 'The fraction {nameB} had',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'twoStep', steps: [
        { operation: 'subtraction', expression: '{total} - ({total} ÷ {fracDen} × {fracNum})', label: 'Find what {nameA} had left' },
        { operation: 'multiplication', expression: '{remaining} × {groups}', label: 'Find {nameB}\'s amount' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/missed-step'], solve: ['psl/fraction-denom-error', 'psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  psl-p5-bar-twostep-ratio — Ratio then total
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-p5-twostep-ratio-01',
    skillId: 'psl-p5-bar-twostep-ratio', structure: 'twoStep', unknownPosition: 'whole',
    heuristic: 'bar-model', operations: ['division', 'multiplication', 'addition'], difficulty: 4,
    contexts: [
      { setting: 'sports day', entityA: 'red team points', entityB: 'blue team points', ratioA: '3', ratioB: '5' },
      { setting: 'bake sale', entityA: 'muffins', entityB: 'brownies', ratioA: '4', ratioB: '3' },
    ],
    constraints: { groups: { min: 3, max: 5 }, perGroup: { min: 10, max: 25 } },
    storyTemplate: 'The ratio of {entityA} to {entityB} is {ratioA} : {ratioB}. If the {entityB} amount is {knownAmt}, how many points were scored altogether?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Using a ratio to find individual parts, then the total', 'Adding two ratios together', 'Comparing two teams\' scores', 'Dividing points equally',
      ]},
      identify_info: { type: 'highlight', expected: ['{ratioA} : {ratioB}', '{knownAmt}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total points scored altogether', 'How many more points one team scored', 'The ratio in simplest form', 'How many {entityA} were scored',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'twoStep', steps: [
        { operation: 'division', expression: '{knownAmt} ÷ {ratioB}', label: 'Find the value of 1 unit' },
        { operation: 'multiplication', expression: '{perGroup} × ({ratioA} + {ratioB})', label: 'Find the total' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/missed-step'], solve: ['psl/ratio-unit-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p5-twostep-ratio-02',
    skillId: 'psl-p5-bar-twostep-ratio', structure: 'twoStep', unknownPosition: 'whole',
    heuristic: 'bar-model', operations: ['division', 'multiplication', 'addition'], difficulty: 4,
    contexts: [
      { setting: 'fruit stall', entityA: 'mangoes', entityB: 'rambutans', ratioA: '2', ratioB: '5' },
      { setting: 'toy shop', entityA: 'dolls', entityB: 'action figures', ratioA: '3', ratioB: '4' },
    ],
    constraints: { groups: { min: 3, max: 5 }, perGroup: { min: 12, max: 22 } },
    storyTemplate: '{nameA} bought {entityA} and {entityB} in the ratio {ratioA} : {ratioB}. {nameA} bought {knownAmt} {entityA}. After buying {extraAmt} more {entityB}, how many items did {nameA} have altogether?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Using a ratio to find quantities, then adding extra', 'Simplifying a ratio', 'Finding the difference between two groups', 'Sharing items between friends',
      ]},
      identify_info: { type: 'highlight', expected: ['{ratioA} : {ratioB}', '{knownAmt}', '{extraAmt}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total number of items after buying more', 'The original total before buying more', 'The new ratio after buying more', 'How many {entityB} were bought originally',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'twoStep', steps: [
        { operation: 'division', expression: '{knownAmt} ÷ {ratioA}', label: 'Find the value of 1 unit' },
        { operation: 'addition', expression: '{knownAmt} + ({perGroup} × {ratioB}) + {extraAmt}', label: 'Find the total' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/missed-step'], solve: ['psl/ratio-unit-error'] },
  },
  {
    templateId: 'psl-tpl-p5-twostep-ratio-03',
    skillId: 'psl-p5-bar-twostep-ratio', structure: 'twoStep', unknownPosition: 'whole',
    heuristic: 'bar-model', operations: ['division', 'multiplication', 'addition'], difficulty: 4,
    contexts: [
      { setting: 'campsite', entityA: 'boys', entityB: 'girls', ratioA: '5', ratioB: '3' },
      { setting: 'tuition centre', entityA: 'Primary pupils', entityB: 'Secondary pupils', ratioA: '4', ratioB: '3' },
    ],
    constraints: { groups: { min: 4, max: 5 }, perGroup: { min: 10, max: 20 } },
    storyTemplate: 'At a {setting}, the ratio of {entityA} to {entityB} was {ratioA} : {ratioB}. There were {knownAmt} {entityA}. {extraAdults} adults also attended. How many people were at the {setting} altogether?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding all people using a ratio and an extra group', 'Comparing boys and girls at a camp', 'Finding the difference between groups', 'Splitting campers into tents',
      ]},
      identify_info: { type: 'highlight', expected: ['{ratioA} : {ratioB}', '{knownAmt}', '{extraAdults}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total number of people', 'The number of {entityB}', 'The ratio of adults to children', 'How many tents are needed',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'twoStep', steps: [
        { operation: 'division', expression: '{knownAmt} ÷ {ratioA}', label: 'Find the value of 1 unit' },
        { operation: 'addition', expression: '{knownAmt} + ({perGroup} × {ratioB}) + {extraAdults}', label: 'Find the total' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/missed-step'], solve: ['psl/ratio-unit-error', 'psl/arithmetic-error'] },
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
  console.log(`Seeded ${upserted} P5 PSL problem templates.`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
