import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLProblemTemplate from '../models/psl/PSLProblemTemplate.js';

const TEMPLATES = [
  // ══════════════════════════════════════════════════════════════════════
  //  psl-p6-bar-pct-find — Find percentage of a quantity
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-p6-pct-find-01',
    skillId: 'psl-p6-bar-pct-find', structure: 'partWhole', unknownPosition: 'part',
    heuristic: 'bar-model', operations: ['multiplication', 'division'], difficulty: 4,
    contexts: [
      { setting: 'primary school', item: 'students', verb: 'wore', detail: 'spectacles' },
      { setting: 'tuition centre', item: 'pupils', verb: 'signed up for', detail: 'the science enrichment class' },
    ],
    constraints: { valA: { min: 100, max: 500 }, valB: { min: 10, max: 40 } },
    storyTemplate: 'There are {valA} {item} in the {setting}. {valB}% of them {verb} {detail}. How many {item} {verb} {detail}?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding a percentage of a total', 'Adding two groups together', 'Comparing two percentages', 'Finding the total from a percentage',
      ]},
      identify_info: { type: 'highlight', expected: ['{valA}', '{valB}%'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The number of {item} that {verb} {detail}', 'The total number of {item}', 'The percentage that did not', 'How many more {item} there are',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'expression', operation: 'multiplication', expression: '{valB}% × {valA}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-percentage'], plan: ['psl/wrong-model-type'], solve: ['psl/percentage-conversion-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p6-pct-find-02',
    skillId: 'psl-p6-bar-pct-find', structure: 'partWhole', unknownPosition: 'part',
    heuristic: 'bar-model', operations: ['multiplication', 'division'], difficulty: 4,
    contexts: [
      { setting: 'hawker centre', item: 'stalls', verb: 'sold', detail: 'local breakfast dishes' },
      { setting: 'shopping mall', item: 'shops', verb: 'offered', detail: 'a National Day discount' },
    ],
    constraints: { valA: { min: 100, max: 500 }, valB: { min: 10, max: 40 } },
    storyTemplate: 'A {setting} has {valA} {item}. {valB}% of the {item} {verb} {detail}. How many {item} {verb} {detail}?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding a percentage of a given amount', 'Subtracting a percentage from a total', 'Comparing two totals', 'Finding the total when the part is known',
      ]},
      identify_info: { type: 'highlight', expected: ['{valA}', '{valB}%'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The number of {item} that {verb} {detail}', 'The total number of {item}', 'The percentage that did not', 'The difference between two groups',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'expression', operation: 'multiplication', expression: '{valB}% × {valA}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-percentage'], solve: ['psl/percentage-conversion-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p6-pct-find-03',
    skillId: 'psl-p6-bar-pct-find', structure: 'partWhole', unknownPosition: 'part',
    heuristic: 'bar-model', operations: ['multiplication', 'division'], difficulty: 4,
    contexts: [
      { setting: 'community club', item: 'members', verb: 'participated in', detail: 'the Hari Raya celebration' },
      { setting: 'sports complex', item: 'visitors', verb: 'used', detail: 'the swimming pool' },
    ],
    constraints: { valA: { min: 100, max: 500 }, valB: { min: 10, max: 40 } },
    storyTemplate: '{valA} {item} visited a {setting}. {valB}% of the {item} {verb} {detail}. Find the number of {item} who {verb} {detail}.',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Calculating a percentage of a known number', 'Dividing visitors into equal groups', 'Finding the total from a percentage', 'Comparing two events',
      ]},
      identify_info: { type: 'highlight', expected: ['{valA}', '{valB}%'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The number who {verb} {detail}', 'The total number of {item}', 'The remaining percentage', 'How many did not participate',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'expression', operation: 'multiplication', expression: '{valB}% × {valA}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/percentage-conversion-error', 'psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  psl-p6-bar-pct-whole — Find the whole given a percentage
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-p6-pct-whole-01',
    skillId: 'psl-p6-bar-pct-whole', structure: 'partWhole', unknownPosition: 'whole',
    heuristic: 'bar-model', operations: ['division', 'multiplication'], difficulty: 4,
    contexts: [
      { setting: 'bookshop', item: 'books', verb: 'were', detail: 'Chinese storybooks' },
      { setting: 'NTUC FairPrice', item: 'items', verb: 'were', detail: 'on promotion' },
    ],
    constraints: { valA: { min: 20, max: 150 }, valB: { min: 20, max: 50 } },
    storyTemplate: '{valB}% of the {item} in a {setting} {verb} {detail}. There were {valA} such {item}. How many {item} were there altogether?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding the total when a percentage is known', 'Subtracting to find a remainder', 'Comparing two percentages', 'Finding a percentage of a total',
      ]},
      identify_info: { type: 'highlight', expected: ['{valB}%', '{valA}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total number of {item}', 'The number not on promotion', 'The difference between two groups', 'The percentage remaining',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'expression', operation: 'division', expression: '{valA} ÷ {valB}% × 100%', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-percentage'], plan: ['psl/wrong-model-type'], solve: ['psl/percentage-conversion-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p6-pct-whole-02',
    skillId: 'psl-p6-bar-pct-whole', structure: 'partWhole', unknownPosition: 'whole',
    heuristic: 'bar-model', operations: ['division', 'multiplication'], difficulty: 4,
    contexts: [
      { setting: 'MRT station', item: 'commuters', verb: 'were', detail: 'students' },
      { setting: 'National Library', item: 'visitors', verb: 'were', detail: 'children' },
    ],
    constraints: { valA: { min: 20, max: 150 }, valB: { min: 20, max: 50 } },
    storyTemplate: '{valB}% of the {item} at a {setting} {verb} {detail}. If there were {valA} {detail}, find the total number of {item}.',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding the whole from a given percentage', 'Comparing two groups of commuters', 'Finding the percentage of adults', 'Adding parts to get the total',
      ]},
      identify_info: { type: 'highlight', expected: ['{valB}%', '{valA}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total number of {item}', 'The number of adults', 'The percentage of adults', 'How many more adults than children',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'expression', operation: 'division', expression: '{valA} ÷ {valB}% × 100%', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-model-type'], solve: ['psl/percentage-conversion-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p6-pct-whole-03',
    skillId: 'psl-p6-bar-pct-whole', structure: 'partWhole', unknownPosition: 'whole',
    heuristic: 'bar-model', operations: ['division', 'multiplication'], difficulty: 4,
    contexts: [
      { setting: 'school canteen', item: 'meals', verb: 'were', detail: 'vegetarian options' },
      { setting: 'HDB void deck', item: 'residents', verb: 'attended', detail: 'the Deepavali gathering' },
    ],
    constraints: { valA: { min: 20, max: 150 }, valB: { min: 20, max: 50 } },
    storyTemplate: '{valA} {item} at a {setting} {verb} {detail}. This was {valB}% of all the {item}. What was the total number of {item}?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Working out the total given a known percentage', 'Subtracting one group from another', 'Finding a fraction of a set', 'Sharing items equally',
      ]},
      identify_info: { type: 'highlight', expected: ['{valA}', '{valB}%'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total number of {item}', 'The number that did not attend', 'The percentage remaining', 'The difference between two groups',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'expression', operation: 'division', expression: '{valA} ÷ {valB}% × 100%', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/percentage-conversion-error', 'psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  psl-p6-bar-ratio-3way — Three-quantity ratio
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-p6-ratio-3way-01',
    skillId: 'psl-p6-bar-ratio-3way', structure: 'partWhole', unknownPosition: 'whole',
    heuristic: 'bar-model', operations: ['multiplication', 'addition'], difficulty: 5,
    contexts: [
      { setting: 'bakery', itemA: 'kaya puffs', itemB: 'curry puffs', itemC: 'sardine puffs', ratioA: '2', ratioB: '3', ratioC: '5' },
      { setting: 'fruit stall', itemA: 'mangoes', itemB: 'rambutans', itemC: 'durians', ratioA: '1', ratioB: '4', ratioC: '3' },
    ],
    constraints: { groups: { min: 2, max: 4 }, perGroup: { min: 5, max: 15 } },
    storyTemplate: 'The ratio of {itemA} to {itemB} to {itemC} at a {setting} is {ratioA} : {ratioB} : {ratioC}. If there are {knownAmt} {itemA}, how many pastries are there altogether?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Using a three-part ratio to find the total', 'Adding three different amounts', 'Comparing three items', 'Dividing items into equal groups',
      ]},
      identify_info: { type: 'highlight', expected: ['{ratioA} : {ratioB} : {ratioC}', '{knownAmt}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total number of items', 'The number of {itemB}', 'The difference between {itemA} and {itemC}', 'The ratio of {itemA} to {itemC}',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'twoStep', steps: [
        { operation: 'division', expression: '{knownAmt} ÷ {ratioA}', label: 'Find the value of 1 unit' },
        { operation: 'multiplication', expression: '{perGroup} × ({ratioA} + {ratioB} + {ratioC})', label: 'Find the total' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-ratio-term'], plan: ['psl/wrong-model-type'], solve: ['psl/ratio-unit-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p6-ratio-3way-02',
    skillId: 'psl-p6-bar-ratio-3way', structure: 'partWhole', unknownPosition: 'whole',
    heuristic: 'bar-model', operations: ['multiplication', 'addition'], difficulty: 5,
    contexts: [
      { setting: 'art class', itemA: 'red beads', itemB: 'blue beads', itemC: 'yellow beads', ratioA: '3', ratioB: '2', ratioC: '4' },
      { setting: 'canteen', itemA: 'chicken rice', itemB: 'nasi lemak', itemC: 'mee goreng', ratioA: '5', ratioB: '3', ratioC: '2' },
    ],
    constraints: { groups: { min: 2, max: 4 }, perGroup: { min: 5, max: 15 } },
    storyTemplate: '{nameA} bought {itemA}, {itemB} and {itemC} in the ratio {ratioA} : {ratioB} : {ratioC}. {nameA} bought {knownAmt} {itemB}. How many items did {nameA} buy in all?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Using a three-part ratio to find the total', 'Comparing prices of three items', 'Splitting items equally among friends', 'Subtracting to find a remainder',
      ]},
      identify_info: { type: 'highlight', expected: ['{ratioA} : {ratioB} : {ratioC}', '{knownAmt}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total number of items bought', 'The cost of the items', 'The number of {itemA}', 'The difference between two items',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'twoStep', steps: [
        { operation: 'division', expression: '{knownAmt} ÷ {ratioB}', label: 'Find the value of 1 unit' },
        { operation: 'multiplication', expression: '{perGroup} × ({ratioA} + {ratioB} + {ratioC})', label: 'Find the total' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-ratio-term'], solve: ['psl/ratio-unit-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p6-ratio-3way-03',
    skillId: 'psl-p6-bar-ratio-3way', structure: 'partWhole', unknownPosition: 'whole',
    heuristic: 'bar-model', operations: ['multiplication', 'addition'], difficulty: 5,
    contexts: [
      { setting: 'library', itemA: 'English books', itemB: 'Chinese books', itemC: 'Malay books', ratioA: '4', ratioB: '3', ratioC: '1' },
      { setting: 'kopitiam', itemA: 'kopi', itemB: 'teh', itemC: 'milo', ratioA: '5', ratioB: '2', ratioC: '3' },
    ],
    constraints: { groups: { min: 2, max: 4 }, perGroup: { min: 5, max: 15 } },
    storyTemplate: 'A {setting} has {itemA}, {itemB} and {itemC} in the ratio {ratioA} : {ratioB} : {ratioC}. There are {knownAmt} {itemC}. Find the total number of items in the {setting}.',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding the total using a three-part ratio', 'Sharing items among three groups', 'Finding the greatest quantity', 'Comparing two ratios',
      ]},
      identify_info: { type: 'highlight', expected: ['{ratioA} : {ratioB} : {ratioC}', '{knownAmt}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total number of items', 'The number of {itemA}', 'The difference between {itemA} and {itemC}', 'How many more {itemA} than {itemB}',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'twoStep', steps: [
        { operation: 'division', expression: '{knownAmt} ÷ {ratioC}', label: 'Find the value of 1 unit' },
        { operation: 'multiplication', expression: '{perGroup} × ({ratioA} + {ratioB} + {ratioC})', label: 'Find the total' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/ratio-unit-error', 'psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  psl-p6-bar-ratio-change — Ratio with change (before/after)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-p6-ratio-change-01',
    skillId: 'psl-p6-bar-ratio-change', structure: 'comparison', unknownPosition: 'difference',
    heuristic: 'bar-model', operations: ['multiplication', 'subtraction'], difficulty: 5,
    contexts: [
      { setting: 'savings account', itemA: '{nameA}', itemB: '{nameB}', action: 'saved', currency: '$' },
      { setting: 'marble collection', itemA: '{nameA}', itemB: '{nameB}', action: 'collected', currency: '' },
    ],
    constraints: { valA: { min: 3, max: 6 }, valB: { min: 2, max: 4 }, perGroup: { min: 10, max: 25 } },
    storyTemplate: 'The ratio of {itemA}\'s {setting} to {itemB}\'s {setting} was {valA} : {valB}. After {itemA} gave {currency}{transfer} to {itemB}, they had the same amount. How much did each person have at first?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'A ratio that changes after a transfer', 'Splitting money equally between two people', 'Finding the total of two amounts', 'Comparing prices of two items',
      ]},
      identify_info: { type: 'highlight', expected: ['{valA} : {valB}', '{transfer}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The original amounts each person had', 'The final amounts after the transfer', 'The total of both amounts', 'The ratio after the transfer',
      ]},
      plan: { type: 'model', modelType: 'comparison', unknownPosition: 'difference' },
      solve: { type: 'twoStep', steps: [
        { operation: 'subtraction', expression: '{valA} − {valB}', label: 'Find the difference in units' },
        { operation: 'division', expression: '{transfer} ÷ difference units ÷ 2', label: 'Find the value of 1 unit' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-ratio-term'], plan: ['psl/wrong-model-type'], solve: ['psl/ratio-unit-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p6-ratio-change-02',
    skillId: 'psl-p6-bar-ratio-change', structure: 'comparison', unknownPosition: 'difference',
    heuristic: 'bar-model', operations: ['multiplication', 'subtraction'], difficulty: 5,
    contexts: [
      { setting: 'sticker collection', itemA: '{nameA}', itemB: '{nameB}', action: 'had stickers', currency: '' },
      { setting: 'pocket money', itemA: '{nameA}', itemB: '{nameB}', action: 'had', currency: '$' },
    ],
    constraints: { valA: { min: 3, max: 6 }, valB: { min: 2, max: 4 }, perGroup: { min: 10, max: 25 } },
    storyTemplate: 'The ratio of the number of {setting} {itemA} had to {itemB}\'s was {valA} : {valB}. After {itemB} received {currency}{added} more, the ratio became {newRatioA} : {newRatioB}. How many did {itemA} have?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'A ratio that changes after items are added', 'Sharing items equally', 'Finding the total of two collections', 'Removing items from a group',
      ]},
      identify_info: { type: 'highlight', expected: ['{valA} : {valB}', '{added}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The original number one person had', 'The total number of items', 'The new ratio', 'The number added',
      ]},
      plan: { type: 'model', modelType: 'comparison', unknownPosition: 'difference' },
      solve: { type: 'twoStep', steps: [
        { operation: 'subtraction', expression: 'New units for {itemB} − old units for {itemB}', label: 'Find the units gained' },
        { operation: 'division', expression: '{added} ÷ gained units', label: 'Find the value of 1 unit' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-model-type'], solve: ['psl/ratio-unit-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p6-ratio-change-03',
    skillId: 'psl-p6-bar-ratio-change', structure: 'comparison', unknownPosition: 'difference',
    heuristic: 'bar-model', operations: ['multiplication', 'subtraction'], difficulty: 5,
    contexts: [
      { setting: 'pencil case', itemA: '{nameA}', itemB: '{nameB}', action: 'had pencils', currency: '' },
      { setting: 'piggy bank', itemA: '{nameA}', itemB: '{nameB}', action: 'had coins', currency: '' },
    ],
    constraints: { valA: { min: 3, max: 6 }, valB: { min: 2, max: 4 }, perGroup: { min: 10, max: 25 } },
    storyTemplate: '{itemA} and {itemB} had {setting} items in the ratio {valA} : {valB}. {itemA} gave {gave} items to {itemB}. Now {itemB} has twice as many as {itemA}. How many did each have at first?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'A ratio that changes after items are given away', 'Dividing items into two groups', 'Adding two amounts together', 'Finding a fraction of a number',
      ]},
      identify_info: { type: 'highlight', expected: ['{valA} : {valB}', '{gave}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The original amounts each person had', 'The new amounts after giving', 'The total number of items', 'The new ratio',
      ]},
      plan: { type: 'model', modelType: 'comparison', unknownPosition: 'difference' },
      solve: { type: 'twoStep', steps: [
        { operation: 'subtraction', expression: '{valA} − {valB}', label: 'Find the difference in units' },
        { operation: 'division', expression: 'Use the transfer to find 1 unit', label: 'Find the value of 1 unit' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/ratio-unit-error', 'psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  psl-p6-bar-units — Units and parts (grouping)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-p6-units-01',
    skillId: 'psl-p6-bar-units', structure: 'partWhole', unknownPosition: 'part',
    heuristic: 'bar-model', operations: ['multiplication', 'division'], difficulty: 4,
    contexts: [
      { setting: 'class', item: 'pupils', groupLabel: 'groups', activity: 'a science project' },
      { setting: 'CCA session', item: 'students', groupLabel: 'teams', activity: 'the relay race' },
    ],
    constraints: { groups: { min: 3, max: 7 }, perGroup: { min: 8, max: 25 } },
    storyTemplate: 'A {setting} had {total} {item}. They were divided equally into {groups} {groupLabel} for {activity}. How many {item} were in each {groupLabel}?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Dividing a total equally into groups', 'Multiplying to find a total', 'Comparing two groups', 'Finding a percentage of a number',
      ]},
      identify_info: { type: 'highlight', expected: ['{total}', '{groups}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The number in each group', 'The total number of {item}', 'The number of groups', 'The difference between groups',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'expression', operation: 'division', expression: '{total} ÷ {groups}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-model-type'], solve: ['psl/division-direction-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p6-units-02',
    skillId: 'psl-p6-bar-units', structure: 'partWhole', unknownPosition: 'part',
    heuristic: 'bar-model', operations: ['multiplication', 'division'], difficulty: 4,
    contexts: [
      { setting: 'warehouse', item: 'boxes', groupLabel: 'shelves', activity: 'storage' },
      { setting: 'kindergarten', item: 'crayons', groupLabel: 'packets', activity: 'an art activity' },
    ],
    constraints: { groups: { min: 3, max: 7 }, perGroup: { min: 8, max: 25 } },
    storyTemplate: 'A {setting} packed {total} {item} equally into {groups} {groupLabel} for {activity}. How many {item} were in each {groupLabel}?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Sharing items equally among groups', 'Finding the total number of items', 'Comparing the sizes of groups', 'Adding items to each group',
      ]},
      identify_info: { type: 'highlight', expected: ['{total}', '{groups}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The number of {item} per {groupLabel}', 'The total number of {item}', 'The number of {groupLabel}', 'How many {item} are left over',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'expression', operation: 'division', expression: '{total} ÷ {groups}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/division-direction-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p6-units-03',
    skillId: 'psl-p6-bar-units', structure: 'partWhole', unknownPosition: 'part',
    heuristic: 'bar-model', operations: ['multiplication', 'division'], difficulty: 4,
    contexts: [
      { setting: 'charity drive', item: 'donated items', groupLabel: 'bags', activity: 'distribution' },
      { setting: 'sports day', item: 'bottles of water', groupLabel: 'cooler boxes', activity: 'the event' },
    ],
    constraints: { groups: { min: 3, max: 7 }, perGroup: { min: 8, max: 25 } },
    storyTemplate: 'During a {setting}, {total} {item} were packed equally into {groups} {groupLabel} for {activity}. Find the number of {item} in each {groupLabel}.',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Dividing items equally into groups', 'Finding how many groups are needed', 'Multiplying groups by items', 'Combining items from all groups',
      ]},
      identify_info: { type: 'highlight', expected: ['{total}', '{groups}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The number of {item} in each {groupLabel}', 'The total number of {item}', 'How many {groupLabel} are needed', 'How many {item} are left',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'expression', operation: 'division', expression: '{total} ÷ {groups}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/division-direction-error', 'psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  psl-p6-bar-algebra — Algebraic bar model (units approach)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-p6-algebra-01',
    skillId: 'psl-p6-bar-algebra', structure: 'partWhole', unknownPosition: 'part',
    heuristic: 'bar-model', operations: ['multiplication', 'subtraction', 'division'], difficulty: 5,
    contexts: [
      { setting: 'bookshop', itemA: 'fiction books', itemB: 'non-fiction books' },
      { setting: 'toy shop', itemA: 'toy cars', itemB: 'toy planes' },
    ],
    constraints: { valA: { min: 2, max: 5 }, valB: { min: 10, max: 40 } },
    storyTemplate: '{nameA} has {valA} times as many {itemA} as {itemB}. {nameA} has {valB} more {itemA} than {itemB}. How many {itemA} does {nameA} have?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Using a multiplier and difference to find a quantity', 'Adding two groups of items', 'Finding a fraction of a collection', 'Comparing prices of items',
      ]},
      identify_info: { type: 'highlight', expected: ['{valA} times', '{valB} more'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The number of {itemA}', 'The total number of items', 'The number of {itemB}', 'The ratio of {itemA} to {itemB}',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'twoStep', steps: [
        { operation: 'subtraction', expression: '{valA} units − 1 unit = ({valA} − 1) units', label: 'Find the difference in units' },
        { operation: 'division', expression: '{valB} ÷ ({valA} − 1)', label: 'Find the value of 1 unit' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-multiplier'], plan: ['psl/wrong-model-type'], solve: ['psl/algebra-unit-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p6-algebra-02',
    skillId: 'psl-p6-bar-algebra', structure: 'partWhole', unknownPosition: 'part',
    heuristic: 'bar-model', operations: ['multiplication', 'subtraction', 'division'], difficulty: 5,
    contexts: [
      { setting: 'zoo', itemA: 'monkeys', itemB: 'parrots' },
      { setting: 'garden', itemA: 'orchids', itemB: 'sunflowers' },
    ],
    constraints: { valA: { min: 2, max: 5 }, valB: { min: 10, max: 40 } },
    storyTemplate: 'A {setting} has {valA} times as many {itemA} as {itemB}. There are {valB} fewer {itemB} than {itemA}. How many {itemB} are there?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Using a multiplier and difference to find quantities', 'Sharing animals equally', 'Finding a fraction of a group', 'Comparing two different zoos',
      ]},
      identify_info: { type: 'highlight', expected: ['{valA} times', '{valB} fewer'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The number of {itemB}', 'The total animals', 'The number of {itemA}', 'The difference between them',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'twoStep', steps: [
        { operation: 'subtraction', expression: '{valA} − 1 = difference in units', label: 'Find the difference in units' },
        { operation: 'division', expression: '{valB} ÷ ({valA} − 1)', label: 'Find 1 unit (= number of {itemB})' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-multiplier'], solve: ['psl/algebra-unit-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p6-algebra-03',
    skillId: 'psl-p6-bar-algebra', structure: 'partWhole', unknownPosition: 'part',
    heuristic: 'bar-model', operations: ['multiplication', 'addition', 'division'], difficulty: 5,
    contexts: [
      { setting: 'HDB flat', itemA: 'adults', itemB: 'children' },
      { setting: 'sports carnival', itemA: 'boys', itemB: 'girls' },
    ],
    constraints: { valA: { min: 2, max: 5 }, valB: { min: 10, max: 40 } },
    storyTemplate: 'At a {setting}, the number of {itemA} is {valA} times the number of {itemB}. There are {total} people altogether. How many {itemB} are there?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding a quantity when the total and multiplier are known', 'Comparing two groups by subtraction', 'Finding a percentage of a group', 'Dividing people into equal teams',
      ]},
      identify_info: { type: 'highlight', expected: ['{valA} times', '{total}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The number of {itemB}', 'The number of {itemA}', 'The total number of people', 'The ratio of {itemA} to {itemB}',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'twoStep', steps: [
        { operation: 'addition', expression: '{valA} + 1 = total units', label: 'Find the total units' },
        { operation: 'division', expression: '{total} ÷ ({valA} + 1)', label: 'Find the value of 1 unit' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/algebra-unit-error', 'psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  psl-p6-bar-twostep-pct — Two-step percentage problem
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-p6-twostep-pct-01',
    skillId: 'psl-p6-bar-twostep-pct', structure: 'twoStep', unknownPosition: 'part',
    heuristic: 'bar-model', operations: ['multiplication', 'subtraction'], difficulty: 6,
    contexts: [
      { setting: 'department store', item: 'dresses', event: 'a Great Singapore Sale', currency: '$' },
      { setting: 'electronics shop', item: 'laptops', event: 'a clearance sale', currency: '$' },
    ],
    constraints: { valA: { min: 100, max: 400 }, valB: { min: 10, max: 30 } },
    storyTemplate: 'A {item} at a {setting} costs {currency}{valA}. During {event}, the price is reduced by {valB}%. What is the sale price of the {item}?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding the final price after a percentage discount', 'Increasing a price by a percentage', 'Comparing prices of two items', 'Finding the percentage saved',
      ]},
      identify_info: { type: 'highlight', expected: ['{currency}{valA}', '{valB}%'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The sale price after the discount', 'The original price', 'The total cost of multiple items', 'The percentage increase',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'twoStep', steps: [
        { operation: 'multiplication', expression: '{valB}% × {valA}', label: 'Find the discount amount' },
        { operation: 'subtraction', expression: '{valA} − discount', label: 'Find the sale price' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-percentage'], plan: ['psl/missed-step'], solve: ['psl/percentage-conversion-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p6-twostep-pct-02',
    skillId: 'psl-p6-bar-twostep-pct', structure: 'twoStep', unknownPosition: 'part',
    heuristic: 'bar-model', operations: ['multiplication', 'addition'], difficulty: 6,
    contexts: [
      { setting: 'restaurant', item: 'meal', event: 'GST increase', currency: '$' },
      { setting: 'tuition centre', item: 'monthly fee', event: 'a fee revision', currency: '$' },
    ],
    constraints: { valA: { min: 100, max: 400 }, valB: { min: 10, max: 30 } },
    storyTemplate: 'A {item} at a {setting} costs {currency}{valA}. After {event}, the price increased by {valB}%. What is the new price?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding the new price after a percentage increase', 'Reducing a price by a percentage', 'Finding the original price from a new price', 'Calculating GST separately',
      ]},
      identify_info: { type: 'highlight', expected: ['{currency}{valA}', '{valB}%'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The new price after the increase', 'The amount of the increase only', 'The original price', 'The percentage decrease',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'twoStep', steps: [
        { operation: 'multiplication', expression: '{valB}% × {valA}', label: 'Find the increase amount' },
        { operation: 'addition', expression: '{valA} + increase', label: 'Find the new price' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/missed-step'], solve: ['psl/percentage-conversion-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p6-twostep-pct-03',
    skillId: 'psl-p6-bar-twostep-pct', structure: 'twoStep', unknownPosition: 'part',
    heuristic: 'bar-model', operations: ['multiplication', 'subtraction', 'multiplication'], difficulty: 6,
    contexts: [
      { setting: 'furniture shop', item: 'sofa set', event: 'a Members\' Day sale', currency: '$' },
      { setting: 'optical shop', item: 'pair of spectacles', event: 'a school holiday promotion', currency: '$' },
    ],
    constraints: { valA: { min: 100, max: 400 }, valB: { min: 10, max: 30 } },
    storyTemplate: 'A {item} costs {currency}{valA}. A {setting} offers a {valB}% discount. {nameA} buys 3 of them. How much does {nameA} pay in total?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding the total cost after a discount on multiple items', 'Finding the discount for one item only', 'Comparing prices at two shops', 'Calculating change received',
      ]},
      identify_info: { type: 'highlight', expected: ['{currency}{valA}', '{valB}%', '3'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total amount paid for 3 items', 'The discount for 1 item', 'The sale price of 1 item only', 'The percentage saved overall',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'twoStep', steps: [
        { operation: 'multiplication', expression: '{valB}% × {valA}', label: 'Find the discount per item' },
        { operation: 'subtraction', expression: '{valA} − discount', label: 'Find the sale price of 1 item' },
        { operation: 'multiplication', expression: 'sale price × 3', label: 'Find the total cost' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/missed-step'], solve: ['psl/percentage-conversion-error', 'psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  psl-p6-bar-twostep-ratio — Two-step ratio problem
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-p6-twostep-ratio-01',
    skillId: 'psl-p6-bar-twostep-ratio', structure: 'twoStep', unknownPosition: 'part',
    heuristic: 'bar-model', operations: ['division', 'multiplication', 'addition'], difficulty: 6,
    contexts: [
      { setting: 'bookshop', itemA: 'English books', itemB: 'Chinese books', extra: 'comic books' },
      { setting: 'food court', itemA: 'chicken rice stalls', itemB: 'noodle stalls', extra: 'drink stalls' },
    ],
    constraints: { valA: { min: 2, max: 5 }, valB: { min: 3, max: 6 }, perGroup: { min: 8, max: 20 } },
    storyTemplate: 'The ratio of {itemA} to {itemB} in a {setting} is {valA} : {valB}. There are {knownAmt} {itemA}. There are also {extraAmt} {extra}. How many items are there altogether?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Using a ratio and an extra group to find the total', 'Comparing three groups using a ratio', 'Finding a fraction of a collection', 'Splitting items equally',
      ]},
      identify_info: { type: 'highlight', expected: ['{valA} : {valB}', '{knownAmt}', '{extraAmt}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total number of items', 'The number of {itemB} only', 'The ratio including {extra}', 'The difference between {itemA} and {itemB}',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'twoStep', steps: [
        { operation: 'division', expression: '{knownAmt} ÷ {valA}', label: 'Find the value of 1 unit' },
        { operation: 'multiplication', expression: '{perGroup} × {valB}', label: 'Find the number of {itemB}' },
        { operation: 'addition', expression: '{knownAmt} + {itemB count} + {extraAmt}', label: 'Find the total' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-ratio-term'], plan: ['psl/missed-step'], solve: ['psl/ratio-unit-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p6-twostep-ratio-02',
    skillId: 'psl-p6-bar-twostep-ratio', structure: 'twoStep', unknownPosition: 'part',
    heuristic: 'bar-model', operations: ['division', 'multiplication', 'subtraction'], difficulty: 6,
    contexts: [
      { setting: 'class', itemA: 'boys', itemB: 'girls', action: 'joined', event: 'the class outing' },
      { setting: 'swimming club', itemA: 'juniors', itemB: 'seniors', action: 'signed up for', event: 'the competition' },
    ],
    constraints: { valA: { min: 2, max: 5 }, valB: { min: 3, max: 6 }, perGroup: { min: 8, max: 20 } },
    storyTemplate: 'The ratio of {itemA} to {itemB} in a {setting} is {valA} : {valB}. There are {total} pupils altogether. {absent} {itemA} were absent. How many {itemA} {action} {event}?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Using a ratio and total to find a group, then subtracting absentees', 'Comparing boys and girls', 'Finding the ratio of those present', 'Sharing pupils into groups',
      ]},
      identify_info: { type: 'highlight', expected: ['{valA} : {valB}', '{total}', '{absent}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The number of {itemA} who {action} {event}', 'The total number of pupils', 'The number of {itemB}', 'The new ratio after absences',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'twoStep', steps: [
        { operation: 'division', expression: '{total} ÷ ({valA} + {valB})', label: 'Find the value of 1 unit' },
        { operation: 'multiplication', expression: '{perGroup} × {valA}', label: 'Find the total number of {itemA}' },
        { operation: 'subtraction', expression: '{itemA count} − {absent}', label: 'Subtract absentees' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/missed-step'], solve: ['psl/ratio-unit-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-p6-twostep-ratio-03',
    skillId: 'psl-p6-bar-twostep-ratio', structure: 'twoStep', unknownPosition: 'part',
    heuristic: 'bar-model', operations: ['division', 'multiplication', 'addition'], difficulty: 6,
    contexts: [
      { setting: 'market', itemA: 'apples', itemB: 'oranges', extra: 'pears' },
      { setting: 'container', itemA: 'red marbles', itemB: 'blue marbles', extra: 'green marbles' },
    ],
    constraints: { valA: { min: 2, max: 5 }, valB: { min: 3, max: 6 }, perGroup: { min: 8, max: 20 } },
    storyTemplate: 'The ratio of {itemA} to {itemB} is {valA} : {valB}. There are {knownAmt} {itemB}. {nameA} adds {extraAmt} {extra} to the {setting}. How many fruits are in the {setting} now?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Using a ratio to find a quantity, then adding extra items', 'Comparing three types of fruit', 'Finding a missing ratio term', 'Dividing fruits equally',
      ]},
      identify_info: { type: 'highlight', expected: ['{valA} : {valB}', '{knownAmt}', '{extraAmt}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total number of fruits now', 'The number of {itemA} only', 'The new ratio', 'The number of {extra} needed',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'twoStep', steps: [
        { operation: 'division', expression: '{knownAmt} ÷ {valB}', label: 'Find the value of 1 unit' },
        { operation: 'multiplication', expression: '{perGroup} × {valA}', label: 'Find the number of {itemA}' },
        { operation: 'addition', expression: '{itemA count} + {knownAmt} + {extraAmt}', label: 'Find the total' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/ratio-unit-error', 'psl/arithmetic-error'] },
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
  console.log(`Seeded ${upserted} P6 PSL problem templates.`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
