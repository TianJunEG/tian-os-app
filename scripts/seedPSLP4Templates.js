import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLProblemTemplate from '../models/psl/PSLProblemTemplate.js';

const TEMPLATES = [
  // ══════════════════════════════════════════════════════════════════════
  //  PART-WHOLE: FIND THE WHOLE (addition, 4-digit)  — 3 templates
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-p4-pw-whole-01',
    skillId: 'psl-p4-bar-pw-find-whole', structure: 'partWhole', unknownPosition: 'whole',
    heuristic: 'bar-model',
    operations: ['addition'], difficulty: 2,
    contexts: [
      { setting: 'school library', entityA: 'English books', entityB: 'Chinese books', itemPlural: 'books', verb: 'has' },
      { setting: 'community centre', entityA: 'adults', entityB: 'children', itemPlural: 'members', verb: 'registered' },
      { setting: 'MRT station', entityA: 'passengers boarding', entityB: 'passengers alighting', itemPlural: 'passengers', verb: 'counted' },
    ],
    constraints: { partA: { min: 1000, max: 4500 }, partB: { min: 500, max: 4000 }, answer: { max: 8500 } },
    storyTemplate: 'The {setting} {verb} {partA} {entityA} and {partB} {entityB}. How many {itemPlural} are there altogether?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Combining two groups of items to find the total', 'Comparing two groups to find the difference', 'Taking away items from a group', 'Sharing items equally',
      ]},
      identify_info: { type: 'highlight', expected: ['{partA}', '{partB}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total number of {itemPlural}', 'How many more {entityA} than {entityB}', 'How many {entityA} are left', 'How many groups there are',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'expression', operation: 'addition', expression: '{partA} + {partB}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p4-pw-whole-02',
    skillId: 'psl-p4-bar-pw-find-whole', structure: 'partWhole', unknownPosition: 'whole',
    heuristic: 'bar-model',
    operations: ['addition'], difficulty: 2,
    contexts: [
      { setting: 'hawker centre', entityA: 'weekday customers', entityB: 'weekend customers', itemPlural: 'customers', verb: 'served' },
      { setting: 'school canteen', entityA: 'chicken rice sets', entityB: 'noodle sets', itemPlural: 'meals', verb: 'sold' },
    ],
    constraints: { partA: { min: 1200, max: 4800 }, partB: { min: 800, max: 3500 }, answer: { max: 8300 } },
    storyTemplate: '{nameA} {verb} {partA} {entityA} and {partB} {entityB} last month. How many {itemPlural} were there in total?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Counting two types of items together', 'Finding how many fewer of one type', 'Removing items from a collection', 'Dividing items into groups',
      ]},
      identify_info: { type: 'highlight', expected: ['{partA}', '{partB}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total number of {itemPlural}', 'How many {entityA} were left over', 'The difference between {entityA} and {entityB}', 'How many {entityB} are left',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'expression', operation: 'addition', expression: '{partA} + {partB}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p4-pw-whole-03',
    skillId: 'psl-p4-bar-pw-find-whole', structure: 'partWhole', unknownPosition: 'whole',
    heuristic: 'bar-model',
    operations: ['addition'], difficulty: 2,
    contexts: [
      { setting: 'HDB estate', entityA: '3-room flats', entityB: '4-room flats', itemPlural: 'flats', verb: 'has' },
      { setting: 'sports complex', entityA: 'morning visitors', entityB: 'afternoon visitors', itemPlural: 'visitors', verb: 'received' },
      { setting: 'primary school', entityA: 'boys', entityB: 'girls', itemPlural: 'pupils', verb: 'enrolled' },
    ],
    constraints: { partA: { min: 1500, max: 5000 }, partB: { min: 1000, max: 4500 }, answer: { max: 9500 } },
    storyTemplate: 'The {setting} {verb} {partA} {entityA} and {partB} {entityB}. How many {itemPlural} are there in all?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Adding two groups to find the total', 'Subtracting to find the remainder', 'Comparing two different quantities', 'Splitting a group into equal parts',
      ]},
      identify_info: { type: 'highlight', expected: ['{partA}', '{partB}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total number of {itemPlural}', 'How many more {entityA} than {entityB}', 'How many {entityA} were removed', 'How many each person gets',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'expression', operation: 'addition', expression: '{partA} + {partB}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-number', 'psl/included-irrelevant'], solve: ['psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  PART-WHOLE: FIND A PART (subtraction, 4-digit)  — 3 templates
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-p4-pw-part-01',
    skillId: 'psl-p4-bar-pw-find-part', structure: 'partWhole', unknownPosition: 'part',
    heuristic: 'bar-model',
    operations: ['subtraction'], difficulty: 2,
    contexts: [
      { setting: 'school', entityA: 'pupils', entityB: 'boys', entityC: 'girls', verb: 'has' },
      { setting: 'community centre', entityA: 'members', entityB: 'senior citizens', entityC: 'working adults', verb: 'has' },
    ],
    constraints: { whole: { min: 2000, max: 5000 }, partA: { min: 800, max: 3500 }, answer: { min: 200 } },
    storyTemplate: 'There are {whole} {entityA} in the {setting}. {partA} of them are {entityB}. How many {entityC} are there?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding a missing part when the total is known', 'Comparing two groups to find the difference', 'Adding two groups together', 'Sharing items equally among groups',
      ]},
      identify_info: { type: 'highlight', expected: ['{whole}', '{partA}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The number of {entityC}', 'The total number of {entityA}', 'How many more {entityB} than {entityC}', 'How many {entityB} were removed',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'expression', operation: 'subtraction', expression: '{whole} - {partA}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-unknown-position'], solve: ['psl/wrong-operation', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p4-pw-part-02',
    skillId: 'psl-p4-bar-pw-find-part', structure: 'partWhole', unknownPosition: 'part',
    heuristic: 'bar-model',
    operations: ['subtraction'], difficulty: 2,
    contexts: [
      { setting: 'warehouse', entityA: 'cartons of milk', verb: 'stored', verbPast: 'delivered to shops' },
      { setting: 'bookshop', entityA: 'books', verb: 'had', verbPast: 'sold during the sale' },
    ],
    constraints: { whole: { min: 2500, max: 5000 }, partA: { min: 1000, max: 3800 }, answer: { min: 300 } },
    storyTemplate: 'A {setting} {verb} {whole} {entityA}. {partA} of them were {verbPast}. How many {entityA} were left?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Starting with a total and removing some', 'Comparing what two places have', 'Adding what two places collected', 'Grouping items into equal sets',
      ]},
      identify_info: { type: 'highlight', expected: ['{whole}', '{partA}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many {entityA} are left', 'The total number of {entityA}', 'How many more {entityA} are needed', 'How many {entityA} each shop gets',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'expression', operation: 'subtraction', expression: '{whole} - {partA}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/wrong-operation'] },
  },
  {
    templateId: 'psl-tpl-p4-pw-part-03',
    skillId: 'psl-p4-bar-pw-find-part', structure: 'partWhole', unknownPosition: 'part',
    heuristic: 'bar-model',
    operations: ['subtraction'], difficulty: 2,
    contexts: [
      { setting: 'food drive', entityA: 'items', entityB: 'canned food', entityC: 'dry food packets', verb: 'collected' },
      { setting: 'stadium', entityA: 'spectators', entityB: 'adults', entityC: 'children', verb: 'attended' },
    ],
    constraints: { whole: { min: 3000, max: 5000 }, partA: { min: 1200, max: 4000 }, answer: { min: 400 } },
    storyTemplate: 'The {setting} {verb} {whole} {entityA} in total. {partA} of them were {entityB}. The rest were {entityC}. How many {entityC} were there?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding how many are in the remaining group', 'Adding the groups to find the total', 'Comparing the two groups', 'Sorting items into equal piles',
      ]},
      identify_info: { type: 'highlight', expected: ['{whole}', '{partA}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The number of {entityC}', 'The total number of {entityA}', 'How many more {entityB} than {entityC}', 'How many {entityA} each person gets',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'expression', operation: 'subtraction', expression: '{whole} - {partA}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-unknown-position'], solve: ['psl/wrong-operation'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  PART-WHOLE: 3-PART WHOLE (addition)  — 3 templates
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-p4-pw-3parts-01',
    skillId: 'psl-p4-bar-pw-3parts', structure: 'partWhole', unknownPosition: 'whole',
    heuristic: 'bar-model',
    operations: ['addition'], difficulty: 2,
    contexts: [
      { setting: 'school carnival', entityA: 'game tickets', entityB: 'food coupons', entityC: 'lucky draw tickets', itemPlural: 'tickets', verb: 'sold' },
      { setting: 'CC Fun Day', entityA: 'senior citizens', entityB: 'parents', entityC: 'children', itemPlural: 'residents', verb: 'attended' },
    ],
    constraints: { partA: { min: 500, max: 2500 }, partB: { min: 500, max: 2500 }, partC: { min: 300, max: 2000 }, answer: { max: 7000 } },
    storyTemplate: 'The {setting} {verb} {partA} {entityA}, {partB} {entityB} and {partC} {entityC}. How many {itemPlural} were there altogether?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Combining three groups to find the total', 'Finding the difference between three groups', 'Taking items away from a group', 'Sharing items among three people',
      ]},
      identify_info: { type: 'highlight', expected: ['{partA}', '{partB}', '{partC}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total number of {itemPlural}', 'How many more {entityA} than {entityC}', 'How many {entityB} are left', 'How many groups there are',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'expression', operation: 'addition', expression: '{partA} + {partB} + {partC}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p4-pw-3parts-02',
    skillId: 'psl-p4-bar-pw-3parts', structure: 'partWhole', unknownPosition: 'whole',
    heuristic: 'bar-model',
    operations: ['addition'], difficulty: 2,
    contexts: [
      { setting: 'HDB car park', entityA: 'cars', entityB: 'motorcycles', entityC: 'vans', itemPlural: 'vehicles', verb: 'parked' },
      { setting: 'Nature Reserve', entityA: 'hikers', entityB: 'cyclists', entityC: 'joggers', itemPlural: 'visitors', verb: 'welcomed' },
    ],
    constraints: { partA: { min: 600, max: 3000 }, partB: { min: 400, max: 2000 }, partC: { min: 200, max: 1500 }, answer: { max: 6500 } },
    storyTemplate: 'The {setting} {verb} {partA} {entityA}, {partB} {entityB} and {partC} {entityC} last week. How many {itemPlural} were there in total?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Adding three groups of items together', 'Comparing three different amounts', 'Removing items from three groups', 'Dividing items into three groups',
      ]},
      identify_info: { type: 'highlight', expected: ['{partA}', '{partB}', '{partC}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total number of {itemPlural}', 'Which group has the most', 'How many {entityA} are left', 'How many each person receives',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'expression', operation: 'addition', expression: '{partA} + {partB} + {partC}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-number', 'psl/included-irrelevant'], solve: ['psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p4-pw-3parts-03',
    skillId: 'psl-p4-bar-pw-3parts', structure: 'partWhole', unknownPosition: 'whole',
    heuristic: 'bar-model',
    operations: ['addition'], difficulty: 2,
    contexts: [
      { setting: 'National Library', entityA: 'fiction books', entityB: 'non-fiction books', entityC: 'reference books', itemPlural: 'books', verb: 'lent out' },
      { setting: 'polyclinic', entityA: 'morning patients', entityB: 'afternoon patients', entityC: 'evening patients', itemPlural: 'patients', verb: 'served' },
    ],
    constraints: { partA: { min: 800, max: 2800 }, partB: { min: 600, max: 2200 }, partC: { min: 400, max: 1800 }, answer: { max: 6800 } },
    storyTemplate: '{nameA} counted {partA} {entityA}, {partB} {entityB} and {partC} {entityC} at the {setting}. How many {itemPlural} were there in all?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Counting three categories together', 'Finding which category had the fewest', 'Taking away items from the shelf', 'Splitting items into piles',
      ]},
      identify_info: { type: 'highlight', expected: ['{partA}', '{partB}', '{partC}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total number of {itemPlural}', 'How many more {entityA} than {entityC}', 'How many {entityB} were returned', 'How many shelves were needed',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'expression', operation: 'addition', expression: '{partA} + {partB} + {partC}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  PART-WHOLE: MULTIPLICATION (2-digit × 2-digit)  — 3 templates
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-p4-pw-mul-01',
    skillId: 'psl-p4-bar-pw-mul', structure: 'partWhole', unknownPosition: 'whole',
    heuristic: 'bar-model',
    operations: ['multiplication'], difficulty: 2,
    contexts: [
      { setting: 'school hall', entityA: 'rows', entityA2: 'row', entityB: 'chairs', verb: 'arranged' },
      { setting: 'CC ballroom', entityA: 'tables', entityA2: 'table', entityB: 'seats', verb: 'set up' },
    ],
    constraints: { groups: { min: 12, max: 45 }, perGroup: { min: 12, max: 38 }, answer: { max: 1710 } },
    storyTemplate: 'The {setting} {verb} {groups} {entityA} of {entityB}. Each {entityA2} had {perGroup} {entityB}. How many {entityB} were there altogether?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding the total from equal groups', 'Comparing two amounts', 'Removing items from groups', 'Finding how many groups there are',
      ]},
      identify_info: { type: 'highlight', expected: ['{groups}', '{perGroup}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total number of {entityB}', 'How many {entityA} are needed', 'The difference between groups', 'How many {entityB} are left over',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'expression', operation: 'multiplication', expression: '{groups} × {perGroup}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-model-type'], solve: ['psl/wrong-operation', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p4-pw-mul-02',
    skillId: 'psl-p4-bar-pw-mul', structure: 'partWhole', unknownPosition: 'whole',
    heuristic: 'bar-model',
    operations: ['multiplication'], difficulty: 2,
    contexts: [
      { setting: 'factory', entityA: 'boxes', entityA2: 'box', entityB: 'mooncakes', verb: 'packed' },
      { setting: 'bakery', entityA: 'trays', entityA2: 'tray', entityB: 'pineapple tarts', verb: 'prepared' },
    ],
    constraints: { groups: { min: 15, max: 48 }, perGroup: { min: 12, max: 36 }, answer: { max: 1728 } },
    storyTemplate: 'A {setting} {verb} {perGroup} {entityB} in each of {groups} {entityA}. How many {entityB} were there in total?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Equal amounts in each group, finding the total', 'Removing items from containers', 'Comparing how much is in each container', 'Dividing items between friends',
      ]},
      identify_info: { type: 'highlight', expected: ['{perGroup}', '{groups}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total number of {entityB}', 'How many {entityA} are empty', 'The difference between the fullest and emptiest', 'How many {entityB} each person gets',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'expression', operation: 'multiplication', expression: '{groups} × {perGroup}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/wrong-operation', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p4-pw-mul-03',
    skillId: 'psl-p4-bar-pw-mul', structure: 'partWhole', unknownPosition: 'whole',
    heuristic: 'bar-model',
    operations: ['multiplication'], difficulty: 2,
    contexts: [
      { setting: 'bookshop', entityA: 'shelves', entityA2: 'shelf', entityB: 'books', verb: 'displayed' },
      { setting: 'sports store', entityA: 'racks', entityA2: 'rack', entityB: 'shuttlecocks', verb: 'stocked' },
    ],
    constraints: { groups: { min: 14, max: 42 }, perGroup: { min: 11, max: 35 }, answer: { max: 1470 } },
    storyTemplate: 'There are {groups} {entityA} in the {setting}. Each {entityA2} holds {perGroup} {entityB}. How many {entityB} are there in all?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Repeated equal groups that make a total', 'Taking away items from shelves', 'Comparing the number on each shelf', 'Sharing items among customers',
      ]},
      identify_info: { type: 'highlight', expected: ['{groups}', '{perGroup}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total number of {entityB}', 'How many empty spots are left', 'Which {entityA2} has the most', 'How many {entityA} are needed',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'expression', operation: 'multiplication', expression: '{groups} × {perGroup}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  COMPARISON: FIND THE DIFFERENCE (subtraction)  — 3 templates
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-p4-comp-diff-01',
    skillId: 'psl-p4-bar-comp-find-diff', structure: 'comparison', unknownPosition: 'difference',
    heuristic: 'bar-model',
    operations: ['subtraction'], difficulty: 2,
    contexts: [
      { setting: 'donation drive', entityA: 'items', verb: 'collected' },
      { setting: 'reading challenge', entityA: 'pages', verb: 'read' },
    ],
    constraints: { larger: { min: 2000, max: 5000 }, smaller: { min: 800, max: 4000 }, answer: { min: 200 } },
    storyTemplate: '{nameA} {verb} {larger} {entityA}. {nameB} {verb} {smaller} {entityA}. How many more {entityA} did {nameA} {verb} than {nameB}?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Comparing two amounts to find the difference', 'Combining two amounts to find the total', 'Removing some from a group', 'Sharing items equally',
      ]},
      identify_info: { type: 'highlight', expected: ['{larger}', '{smaller}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many more {nameA} has than {nameB}', 'The total for {nameA} and {nameB}', 'How many {entityA} are left', 'How many each person gets',
      ]},
      plan: { type: 'model', modelType: 'comparison', unknownPosition: 'difference' },
      solve: { type: 'expression', operation: 'subtraction', expression: '{larger} - {smaller}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-model-type'], solve: ['psl/wrong-operation'] },
  },
  {
    templateId: 'psl-tpl-p4-comp-diff-02',
    skillId: 'psl-p4-bar-comp-find-diff', structure: 'comparison', unknownPosition: 'difference',
    heuristic: 'bar-model',
    operations: ['subtraction'], difficulty: 2,
    contexts: [
      { setting: 'savings', entityA: 'cents', verb: 'saved' },
      { setting: 'step counter', entityA: 'steps', verb: 'walked' },
    ],
    constraints: { larger: { min: 1500, max: 4800 }, smaller: { min: 600, max: 3500 }, answer: { min: 300 } },
    storyTemplate: '{nameA} {verb} {larger} {entityA}. {nameB} {verb} {smaller} {entityA}. How many fewer {entityA} did {nameB} have than {nameA}?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Comparing what two people did', 'Adding what two people did together', 'One person giving to the other', 'Splitting equally between two people',
      ]},
      identify_info: { type: 'highlight', expected: ['{larger}', '{smaller}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many fewer {nameB} has than {nameA}', 'The total {entityA} for both', 'How many {entityA} {nameA} gave away', 'How many each person still has',
      ]},
      plan: { type: 'model', modelType: 'comparison', unknownPosition: 'difference' },
      solve: { type: 'expression', operation: 'subtraction', expression: '{larger} - {smaller}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/wrong-operation'] },
  },
  {
    templateId: 'psl-tpl-p4-comp-diff-03',
    skillId: 'psl-p4-bar-comp-find-diff', structure: 'comparison', unknownPosition: 'difference',
    heuristic: 'bar-model',
    operations: ['subtraction'], difficulty: 2,
    contexts: [
      { setting: 'school fundraiser', entityA: 'dollars', verb: 'raised' },
      { setting: 'MRT ridership', entityA: 'passengers', verb: 'recorded' },
      { setting: 'spelling bee', entityA: 'words', verb: 'spelt correctly' },
    ],
    constraints: { larger: { min: 1800, max: 5000 }, smaller: { min: 700, max: 3800 }, answer: { min: 250 } },
    storyTemplate: '{nameA} {verb} {larger} {entityA}. {nameB} {verb} {smaller} {entityA}. What is the difference between their amounts?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Comparing to find how much more one has', 'Adding to find the combined total', 'One person spending their amount', 'Sharing amounts between friends',
      ]},
      identify_info: { type: 'highlight', expected: ['{larger}', '{smaller}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The difference between the two amounts', 'The total amount they both have', 'How much {nameA} spent', 'How much each person needs to save more',
      ]},
      plan: { type: 'model', modelType: 'comparison', unknownPosition: 'difference' },
      solve: { type: 'expression', operation: 'subtraction', expression: '{larger} - {smaller}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-model-type'], solve: ['psl/wrong-operation'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  COMPARISON: FIND THE LARGER (addition)  — 3 templates
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-p4-comp-larger-01',
    skillId: 'psl-p4-bar-comp-find-larger', structure: 'comparison', unknownPosition: 'larger',
    heuristic: 'bar-model',
    operations: ['addition'], difficulty: 2,
    contexts: [
      { setting: 'savings account', entityA: 'dollars', verb: 'saved', comparison: 'more than' },
      { setting: 'stamp collection', entityA: 'stamps', verb: 'has', comparison: 'more than' },
    ],
    constraints: { smaller: { min: 1000, max: 3500 }, difference: { min: 300, max: 2000 }, answer: { max: 5500 } },
    storyTemplate: '{nameA} {verb} {smaller} {entityA}. {nameB} {verb} {difference} {comparison} {nameA}. How many {entityA} does {nameB} have?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding the larger amount using the smaller and the difference', 'Adding both amounts together', 'Finding how much was spent', 'Splitting between two people',
      ]},
      identify_info: { type: 'highlight', expected: ['{smaller}', '{difference}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many {entityA} {nameB} has', 'The total for both people', 'How many {nameA} gave away', 'The difference between them',
      ]},
      plan: { type: 'model', modelType: 'comparison', unknownPosition: 'larger' },
      solve: { type: 'expression', operation: 'addition', expression: '{smaller} + {difference}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-unknown-position'], solve: ['psl/wrong-operation'] },
  },
  {
    templateId: 'psl-tpl-p4-comp-larger-02',
    skillId: 'psl-p4-bar-comp-find-larger', structure: 'comparison', unknownPosition: 'larger',
    heuristic: 'bar-model',
    operations: ['addition'], difficulty: 2,
    contexts: [
      { setting: 'hawker centre', entityA: 'customers', verb: 'served', comparison: 'more than' },
      { setting: 'swimming complex', entityA: 'visitors', verb: 'had', comparison: 'more than' },
    ],
    constraints: { smaller: { min: 800, max: 3000 }, difference: { min: 200, max: 1500 }, answer: { max: 4500 } },
    storyTemplate: '{nameA} {verb} {smaller} {entityA} in January. {nameA} {verb} {difference} {comparison} that in February. How many {entityA} did {nameA} serve in February?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'One amount is more, and we need to find it', 'Finding how many were served altogether', 'Taking some away from a group', 'Finding the average between two months',
      ]},
      identify_info: { type: 'highlight', expected: ['{smaller}', '{difference}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many {entityA} were served in February', 'The total {entityA} for both months', 'How many {entityA} were turned away', 'The difference between the months',
      ]},
      plan: { type: 'model', modelType: 'comparison', unknownPosition: 'larger' },
      solve: { type: 'expression', operation: 'addition', expression: '{smaller} + {difference}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-unknown-position'], solve: ['psl/wrong-operation'] },
  },
  {
    templateId: 'psl-tpl-p4-comp-larger-03',
    skillId: 'psl-p4-bar-comp-find-larger', structure: 'comparison', unknownPosition: 'larger',
    heuristic: 'bar-model',
    operations: ['addition'], difficulty: 2,
    contexts: [
      { setting: 'NAPFA test', entityA: 'points', verb: 'scored', comparison: 'more than' },
      { setting: 'spelling test', entityA: 'marks', verb: 'got', comparison: 'more than' },
    ],
    constraints: { smaller: { min: 1200, max: 3800 }, difference: { min: 250, max: 1800 }, answer: { max: 5600 } },
    storyTemplate: '{nameB} {verb} {difference} {comparison} {nameA} in the {setting}. {nameA} {verb} {smaller} {entityA}. How many {entityA} did {nameB} get?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'One person scored more, and we need to find their total', 'Finding the combined score', 'Subtracting points as a penalty', 'Dividing points between teams',
      ]},
      identify_info: { type: 'highlight', expected: ['{difference}', '{smaller}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many {entityA} {nameB} got', 'The total for both people', 'How many {entityA} {nameA} lost', 'Who scored fewer {entityA}',
      ]},
      plan: { type: 'model', modelType: 'comparison', unknownPosition: 'larger' },
      solve: { type: 'expression', operation: 'addition', expression: '{smaller} + {difference}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/wrong-operation', 'psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  COMPARISON: FIND THE SMALLER (subtraction)  — 3 templates
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-p4-comp-smaller-01',
    skillId: 'psl-p4-bar-comp-find-smaller', structure: 'comparison', unknownPosition: 'smaller',
    heuristic: 'bar-model',
    operations: ['subtraction'], difficulty: 2,
    contexts: [
      { setting: 'mass', entityA: 'g', verb: 'weighs', comparison: 'lighter than' },
      { setting: 'distance', entityA: 'm', verb: 'is', comparison: 'shorter than' },
    ],
    constraints: { larger: { min: 2000, max: 5000 }, difference: { min: 300, max: 2000 }, answer: { min: 500 } },
    storyTemplate: '{nameA} {verb} {larger} {entityA}. {nameB} {verb} {difference} {comparison} {nameA}. How much does {nameB} weigh?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'One amount is less, and we need to find it', 'Adding both amounts together', 'Finding the average', 'Removing some from a total',
      ]},
      identify_info: { type: 'highlight', expected: ['{larger}', '{difference}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How much {nameB} has', 'The total for both', 'How much {nameA} lost', 'The difference between them',
      ]},
      plan: { type: 'model', modelType: 'comparison', unknownPosition: 'smaller' },
      solve: { type: 'expression', operation: 'subtraction', expression: '{larger} - {difference}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-unknown-position'], solve: ['psl/wrong-operation'] },
  },
  {
    templateId: 'psl-tpl-p4-comp-smaller-02',
    skillId: 'psl-p4-bar-comp-find-smaller', structure: 'comparison', unknownPosition: 'smaller',
    heuristic: 'bar-model',
    operations: ['subtraction'], difficulty: 2,
    contexts: [
      { setting: 'pocket money', entityA: 'cents', verb: 'has', comparison: 'fewer than' },
      { setting: 'sticker collection', entityA: 'stickers', verb: 'owns', comparison: 'fewer than' },
    ],
    constraints: { larger: { min: 1500, max: 4500 }, difference: { min: 400, max: 1800 }, answer: { min: 400 } },
    storyTemplate: '{nameA} {verb} {larger} {entityA}. {nameB} {verb} {difference} {comparison} {nameA}. How many {entityA} does {nameB} have?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding the smaller amount using the larger and the gap', 'Combining two collections', 'Giving items away', 'Sorting into groups',
      ]},
      identify_info: { type: 'highlight', expected: ['{larger}', '{difference}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many {entityA} {nameB} has', 'The total for both', 'How many {nameA} spent', 'How many more {nameA} needs to buy',
      ]},
      plan: { type: 'model', modelType: 'comparison', unknownPosition: 'smaller' },
      solve: { type: 'expression', operation: 'subtraction', expression: '{larger} - {difference}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-unknown-position'], solve: ['psl/wrong-operation'] },
  },
  {
    templateId: 'psl-tpl-p4-comp-smaller-03',
    skillId: 'psl-p4-bar-comp-find-smaller', structure: 'comparison', unknownPosition: 'smaller',
    heuristic: 'bar-model',
    operations: ['subtraction'], difficulty: 2,
    contexts: [
      { setting: 'jogging track', entityA: 'metres', verb: 'ran', comparison: 'less than' },
      { setting: 'book fair', entityA: 'books', verb: 'sold', comparison: 'fewer than' },
    ],
    constraints: { larger: { min: 1800, max: 5000 }, difference: { min: 350, max: 2200 }, answer: { min: 500 } },
    storyTemplate: '{nameA} {verb} {larger} {entityA}. {nameB} {verb} {difference} {comparison} {nameA}. How many {entityA} did {nameB} {verb}?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'One person did less, and we need to find how much', 'Adding what both people did', 'Finding who did the most', 'Splitting equally between both',
      ]},
      identify_info: { type: 'highlight', expected: ['{larger}', '{difference}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many {entityA} {nameB} {verb}', 'The total for both people', 'How many {entityA} are left', 'How many more {nameB} needs',
      ]},
      plan: { type: 'model', modelType: 'comparison', unknownPosition: 'smaller' },
      solve: { type: 'expression', operation: 'subtraction', expression: '{larger} - {difference}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/wrong-operation', 'psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  COMPARISON: COMPARE THEN TOTAL (two-step)  — 3 templates
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-p4-comp-total-01',
    skillId: 'psl-p4-bar-comp-total', structure: 'comparison', unknownPosition: 'larger',
    heuristic: 'bar-model',
    operations: ['addition'], difficulty: 2,
    contexts: [
      { setting: 'canteen', entityA: 'chicken rice sets', entityB: 'noodle sets', verb: 'sold', comparison: 'more' },
      { setting: 'charity bazaar', entityA: 'handmade cards', entityB: 'bookmarks', verb: 'sold', comparison: 'more' },
    ],
    constraints: { smaller: { min: 800, max: 3000 }, difference: { min: 200, max: 1500 }, answer: { max: 7500 } },
    storyTemplate: 'The {setting} {verb} {smaller} {entityA}. It {verb} {difference} {comparison} {entityB} than {entityA}. How many {entityA} and {entityB} were sold altogether?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'First finding a larger amount, then adding both to get a total', 'Just finding the difference between two groups', 'Subtracting to find what is left', 'Sharing items among friends',
      ]},
      identify_info: { type: 'highlight', expected: ['{smaller}', '{difference}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total for both items combined', 'Only how many {entityB} were sold', 'The difference between them', 'How many items are left',
      ]},
      plan: { type: 'model', modelType: 'comparison', unknownPosition: 'larger' },
      solve: { type: 'twoStep', steps: [
        { operation: 'addition', expression: '{smaller} + {difference}', label: 'Find the larger' },
        { operation: 'addition', expression: '{smaller} + {larger}', label: 'Find the total' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-model-type'], solve: ['psl/used-wrong-numbers', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p4-comp-total-02',
    skillId: 'psl-p4-bar-comp-total', structure: 'comparison', unknownPosition: 'larger',
    heuristic: 'bar-model',
    operations: ['addition'], difficulty: 2,
    contexts: [
      { setting: 'sports meet', entityA: 'Red House points', entityB: 'Blue House points', verb: 'scored', comparison: 'more' },
      { setting: 'recycling drive', entityA: 'plastic bottles', entityB: 'aluminium cans', verb: 'collected', comparison: 'more' },
    ],
    constraints: { smaller: { min: 600, max: 2500 }, difference: { min: 150, max: 1200 }, answer: { max: 6200 } },
    storyTemplate: '{nameA} {verb} {smaller} {entityA}. {nameB} {verb} {difference} {comparison} {entityB} than {nameA}. How many did they {verb} altogether?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Using a comparison to find one amount, then adding both', 'Only comparing two amounts', 'Giving away items from a total', 'Dividing items into groups',
      ]},
      identify_info: { type: 'highlight', expected: ['{smaller}', '{difference}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total for both people combined', 'Only {nameB}\'s amount', 'How many fewer {nameA} had', 'How many each person gives away',
      ]},
      plan: { type: 'model', modelType: 'comparison', unknownPosition: 'larger' },
      solve: { type: 'twoStep', steps: [
        { operation: 'addition', expression: '{smaller} + {difference}', label: 'Find the larger' },
        { operation: 'addition', expression: '{smaller} + {larger}', label: 'Find the total' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/used-wrong-numbers', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p4-comp-total-03',
    skillId: 'psl-p4-bar-comp-total', structure: 'comparison', unknownPosition: 'larger',
    heuristic: 'bar-model',
    operations: ['addition'], difficulty: 2,
    contexts: [
      { setting: 'walkathon', entityA: 'metres', entityB: 'metres', verb: 'walked', comparison: 'more' },
      { setting: 'food donation', entityA: 'cans', entityB: 'cans', verb: 'donated', comparison: 'more' },
    ],
    constraints: { smaller: { min: 1000, max: 3500 }, difference: { min: 300, max: 1800 }, answer: { max: 8800 } },
    storyTemplate: '{nameA} {verb} {smaller} {entityA}. {nameB} {verb} {difference} {comparison} {entityB} than {nameA}. How many {entityA} did they cover in total?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding the larger, then adding both amounts', 'Just finding who did more', 'Removing some from a group', 'Splitting a total into two',
      ]},
      identify_info: { type: 'highlight', expected: ['{smaller}', '{difference}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total for both people', '{nameB}\'s amount only', 'The difference between them', 'How many each did on average',
      ]},
      plan: { type: 'model', modelType: 'comparison', unknownPosition: 'larger' },
      solve: { type: 'twoStep', steps: [
        { operation: 'addition', expression: '{smaller} + {difference}', label: 'Find the larger' },
        { operation: 'addition', expression: '{smaller} + {larger}', label: 'Find the total' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-model-type'], solve: ['psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  TWO-STEP: MULTI-OPERATION  — 3 templates
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-p4-twostep-multi-01',
    skillId: 'psl-p4-twostep-multi-op', structure: 'twoStep', unknownPosition: 'whole',
    heuristic: 'bar-model',
    operations: ['multiplication', 'addition'], difficulty: 2,
    contexts: [
      { setting: 'school bookshop', entityA: 'notebooks', entityB: 'folders', verb: 'bought' },
    ],
    constraints: { groups: { min: 12, max: 30 }, perGroup: { min: 10, max: 25 }, extra: { min: 200, max: 1500 }, answer: { max: 2250 } },
    storyTemplate: '{nameA} {verb} {groups} packs of {entityA}. Each pack had {perGroup} {entityA}. {nameA} also {verb} {extra} {entityB}. How many items did {nameA} buy altogether?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding the total of equal groups, then adding another amount', 'Just finding the difference between two items', 'Sharing items equally among friends', 'Removing items from a total',
      ]},
      identify_info: { type: 'highlight', expected: ['{groups}', '{perGroup}', '{extra}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total number of items bought', 'How many packs of {entityA}', 'The difference between {entityA} and {entityB}', 'How many {entityB} are left',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'twoStep', steps: [
        { operation: 'multiplication', expression: '{groups} × {perGroup}', label: 'Find the total {entityA}' },
        { operation: 'addition', expression: '{product} + {extra}', label: 'Add the {entityB}' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-model-type'], solve: ['psl/used-wrong-numbers', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p4-twostep-multi-02',
    skillId: 'psl-p4-twostep-multi-op', structure: 'twoStep', unknownPosition: 'whole',
    heuristic: 'bar-model',
    operations: ['addition', 'subtraction'], difficulty: 2,
    contexts: [
      { setting: 'HDB void deck', entityA: 'chairs', entityB: 'tables', verb: 'set up' },
    ],
    constraints: { partA: { min: 800, max: 2500 }, partB: { min: 500, max: 2000 }, removed: { min: 200, max: 1000 }, answer: { min: 500 } },
    storyTemplate: 'For the CC event, {nameA} {verb} {partA} {entityA} and {partB} {entityB}. After some residents left, {removed} {entityA} were removed. How many {entityA} and {entityB} are left?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Adding two amounts, then taking some away', 'Comparing two different groups', 'Multiplying groups to find a total', 'Sharing items among residents',
      ]},
      identify_info: { type: 'highlight', expected: ['{partA}', '{partB}', '{removed}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many {entityA} and {entityB} are left', 'The total before any were removed', 'How many residents left', 'The difference between {entityA} and {entityB}',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'twoStep', steps: [
        { operation: 'addition', expression: '{partA} + {partB}', label: 'Find the total set up' },
        { operation: 'subtraction', expression: '{total} - {removed}', label: 'Subtract those removed' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/used-wrong-numbers', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p4-twostep-multi-03',
    skillId: 'psl-p4-twostep-multi-op', structure: 'twoStep', unknownPosition: 'whole',
    heuristic: 'bar-model',
    operations: ['subtraction', 'addition'], difficulty: 2,
    contexts: [
      { setting: 'hawker centre', entityA: 'bowls of laksa', entityB: 'plates of nasi lemak', verb: 'prepared' },
    ],
    constraints: { startA: { min: 1200, max: 3000 }, soldA: { min: 400, max: 2000 }, partB: { min: 500, max: 2000 }, answer: { max: 4600 } },
    storyTemplate: 'A {setting} {verb} {startA} {entityA}. After lunch, {soldA} {entityA} were sold. The stall also had {partB} {entityB}. How many dishes were left in all?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Removing some from one group, then combining with another group', 'Comparing two types of food', 'Finding the total prepared at the start', 'Dividing food among customers',
      ]},
      identify_info: { type: 'highlight', expected: ['{startA}', '{soldA}', '{partB}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total dishes left', 'How many {entityA} were sold', 'The difference between {entityA} and {entityB}', 'How many customers came',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'twoStep', steps: [
        { operation: 'subtraction', expression: '{startA} - {soldA}', label: 'Find remaining {entityA}' },
        { operation: 'addition', expression: '{remainingA} + {partB}', label: 'Add the {entityB}' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-model-type'], solve: ['psl/used-wrong-numbers', 'psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  TWO-STEP: FRACTION BAR  — 3 templates
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-p4-twostep-frac-01',
    skillId: 'psl-p4-twostep-fraction-bar', structure: 'twoStep', unknownPosition: 'part',
    heuristic: 'bar-model',
    operations: ['division', 'subtraction'], difficulty: 2,
    contexts: [
      { setting: 'library', entityA: 'books', verb: 'had', fraction: '1/4' },
    ],
    constraints: { whole: { min: 800, max: 4800 }, divisor: { value: 4 }, answer: { min: 200 } },
    storyTemplate: '{nameA} {verb} {whole} {entityA}. {nameA} gave {fraction} of them to the {setting}. How many {entityA} did {nameA} have left?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding a fraction of a total, then subtracting to find the remainder', 'Adding fractions together', 'Comparing two groups of books', 'Sharing books equally among classes',
      ]},
      identify_info: { type: 'highlight', expected: ['{whole}', '{fraction}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many {entityA} {nameA} has left', 'How many {entityA} were given away', 'The total number of {entityA}', 'How many friends received {entityA}',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'twoStep', steps: [
        { operation: 'division', expression: '{whole} ÷ {divisor}', label: 'Find the fraction given away' },
        { operation: 'subtraction', expression: '{whole} - {fractionPart}', label: 'Find the remainder' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/used-wrong-numbers', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p4-twostep-frac-02',
    skillId: 'psl-p4-twostep-fraction-bar', structure: 'twoStep', unknownPosition: 'part',
    heuristic: 'bar-model',
    operations: ['division', 'addition'], difficulty: 2,
    contexts: [
      { setting: 'bakery', entityA: 'cookies', entityB: 'extra cookies', verb: 'baked', fraction: '1/3' },
    ],
    constraints: { whole: { min: 600, max: 3600 }, divisor: { value: 3 }, extra: { min: 200, max: 1000 }, answer: { max: 2200 } },
    storyTemplate: '{nameA} {verb} {whole} {entityA}. {nameA} sold {fraction} of them. {nameA} then {verb} {extra} more {entityB}. How many {entityA} does {nameA} have now?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding a fraction that was sold, subtracting it, then adding more', 'Multiplying to find the total baked', 'Comparing two batches of cookies', 'Sharing cookies among friends',
      ]},
      identify_info: { type: 'highlight', expected: ['{whole}', '{fraction}', '{extra}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many {entityA} {nameA} has now', 'How many {entityA} were sold', 'The total baked from the start', 'How many friends received {entityA}',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'twoStep', steps: [
        { operation: 'division', expression: '{whole} ÷ {divisor}', label: 'Find the fraction sold' },
        { operation: 'subtraction', expression: '{whole} - {fractionPart}', label: 'Find remaining after selling' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/used-wrong-numbers', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p4-twostep-frac-03',
    skillId: 'psl-p4-twostep-fraction-bar', structure: 'twoStep', unknownPosition: 'part',
    heuristic: 'bar-model',
    operations: ['division', 'subtraction'], difficulty: 2,
    contexts: [
      { setting: 'school canteen', entityA: 'cups of drink', verb: 'prepared', fraction: '1/5' },
    ],
    constraints: { whole: { min: 1000, max: 5000 }, divisor: { value: 5 }, answer: { min: 200 } },
    storyTemplate: 'The {setting} {verb} {whole} {entityA}. By recess, {fraction} of them were sold. How many {entityA} were left after recess?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding a fraction that was sold, then subtracting from the whole', 'Comparing drinks between two stalls', 'Adding more drinks after recess', 'Dividing drinks equally among classes',
      ]},
      identify_info: { type: 'highlight', expected: ['{whole}', '{fraction}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many {entityA} were left after recess', 'How many {entityA} were sold', 'The total number of {entityA} prepared', 'How many students bought a drink',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'twoStep', steps: [
        { operation: 'division', expression: '{whole} ÷ {divisor}', label: 'Find the fraction sold' },
        { operation: 'subtraction', expression: '{whole} - {fractionPart}', label: 'Find the remainder' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/used-wrong-numbers', 'psl/arithmetic-error'] },
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
  console.log(`Seeded ${upserted} P4 PSL problem templates.`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
