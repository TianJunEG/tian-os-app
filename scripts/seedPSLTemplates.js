import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLProblemTemplate from '../models/psl/PSLProblemTemplate.js';

const NAMES = ['Wei Ling', 'Jun Hao', 'Ravi', 'Siti', 'Mei Xin', 'Arun', 'Farah', 'Zhi Hao', 'Priya', 'Ahmad'];

// Helper: standard scaffold for part-whole find-whole (addition)
function pwWholeScaffold(understandChoices, questionChoices) {
  return {
    understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: understandChoices },
    identify_info: { type: 'highlight', expected: ['{partA}', '{partB}'] },
    identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: questionChoices },
    plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
    solve: { type: 'expression', operation: 'addition', expression: '{partA} + {partB}', answer: '{answer}' },
    check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
  };
}

// Helper: standard scaffold for part-whole find-part (subtraction)
function pwPartScaffold(understandChoices, questionChoices) {
  return {
    understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: understandChoices },
    identify_info: { type: 'highlight', expected: ['{whole}', '{partA}'] },
    identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: questionChoices },
    plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
    solve: { type: 'expression', operation: 'subtraction', expression: '{whole} - {partA}', answer: '{answer}' },
    check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
  };
}

// Helper: comparison find-diff scaffold
function compDiffScaffold(understandChoices, questionChoices) {
  return {
    understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: understandChoices },
    identify_info: { type: 'highlight', expected: ['{larger}', '{smaller}'] },
    identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: questionChoices },
    plan: { type: 'model', modelType: 'comparison', unknownPosition: 'difference' },
    solve: { type: 'expression', operation: 'subtraction', expression: '{larger} - {smaller}', answer: '{answer}' },
    check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
  };
}

const TEMPLATES = [
  // ══════════════════════════════════════════════════════════════════════
  //  PART-WHOLE: FIND THE WHOLE  (4 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-pw-whole-01',
    skillId: 'psl-p3-bar-pw-find-whole', heuristic: 'bar-model', structure: 'partWhole', unknownPosition: 'whole',
    operations: ['addition'], difficulty: 1,
    contexts: [
      { setting: 'market', entityA: 'red apples', entityB: 'green apples', itemPlural: 'apples', verb: 'bought' },
      { setting: 'school', entityA: 'fiction books', entityB: 'non-fiction books', itemPlural: 'books', verb: 'borrowed' },
      { setting: 'park', entityA: 'boys', entityB: 'girls', itemPlural: 'children', verb: 'counted' },
    ],
    constraints: { partA: { min: 20, max: 150 }, partB: { min: 20, max: 150 }, answer: { max: 300 } },
    storyTemplate: '{nameA} {verb} {partA} {entityA}. {nameA} also {verb} {partB} {entityB}. How many {itemPlural} did {nameA} {verb} altogether?',
    scaffold: pwWholeScaffold(
      ['Combining two groups of items to find the total', 'Comparing two groups to find the difference', 'Taking away items from a group', 'Sharing items equally'],
      ['The total number of {itemPlural}', 'How many more {entityA} than {entityB}', 'How many {entityA} are left', 'How many groups there are'],
    ),
    misconceptions: { identify_info: ['psl/missed-number', 'psl/included-irrelevant'], plan: ['psl/wrong-model-type'], solve: ['psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-pw-whole-02',
    skillId: 'psl-p3-bar-pw-find-whole', heuristic: 'bar-model', structure: 'partWhole', unknownPosition: 'whole',
    operations: ['addition'], difficulty: 1,
    contexts: [
      { setting: 'bakery', entityA: 'chocolate cakes', entityB: 'vanilla cakes', itemPlural: 'cakes', verb: 'baked' },
      { setting: 'garden', entityA: 'roses', entityB: 'sunflowers', itemPlural: 'flowers', verb: 'planted' },
    ],
    constraints: { partA: { min: 30, max: 200 }, partB: { min: 30, max: 200 }, answer: { max: 400 } },
    storyTemplate: 'A {setting} had {partA} {entityA} and {partB} {entityB}. How many {itemPlural} were there altogether?',
    scaffold: pwWholeScaffold(
      ['Counting two types of items together', 'Finding how many fewer of one type', 'Removing items from a collection', 'Dividing items into groups'],
      ['The total number of {itemPlural}', 'How many {entityA} were sold', 'The difference between {entityA} and {entityB}', 'How many {entityB} are left'],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-pw-whole-03',
    skillId: 'psl-p3-bar-pw-find-whole', heuristic: 'bar-model', structure: 'partWhole', unknownPosition: 'whole',
    operations: ['addition'], difficulty: 1,
    contexts: [
      { setting: 'canteen', entityA: 'chicken rice sets', entityB: 'noodle sets', itemPlural: 'meals', verb: 'sold' },
      { setting: 'pet shop', entityA: 'goldfish', entityB: 'guppies', itemPlural: 'fish', verb: 'has' },
      { setting: 'bus stop', entityA: 'adults', entityB: 'children', itemPlural: 'people', verb: 'were waiting' },
    ],
    constraints: { partA: { min: 15, max: 120 }, partB: { min: 15, max: 120 }, answer: { max: 240 } },
    storyTemplate: 'The {setting} {verb} {partA} {entityA} and {partB} {entityB}. How many {itemPlural} were there in all?',
    scaffold: pwWholeScaffold(
      ['Adding two groups to find the total', 'Subtracting to find the remainder', 'Comparing two different quantities', 'Splitting a group into equal parts'],
      ['The total number of {itemPlural}', 'How many more {entityA} than {entityB}', 'How many {entityA} were left', 'How many each person gets'],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-pw-whole-04',
    skillId: 'psl-p3-bar-pw-find-whole', heuristic: 'bar-model', structure: 'partWhole', unknownPosition: 'whole',
    operations: ['addition'], difficulty: 1,
    contexts: [
      { setting: 'classroom', entityA: 'coloured pencils', entityB: 'markers', itemPlural: 'drawing tools', verb: 'had' },
      { setting: 'sports day', entityA: 'medals', entityB: 'trophies', itemPlural: 'prizes', verb: 'won' },
    ],
    constraints: { partA: { min: 25, max: 180 }, partB: { min: 25, max: 180 }, answer: { max: 360 } },
    storyTemplate: '{nameA} {verb} {partA} {entityA} and {partB} {entityB}. How many {itemPlural} did {nameA} have altogether?',
    scaffold: pwWholeScaffold(
      ['Combining two types to find the total', 'Finding how many more of one type', 'Giving away some items', 'Arranging items in rows'],
      ['The total number of {itemPlural}', 'How many {entityA} {nameA} gave away', 'The difference between the two types', 'How many were in each group'],
    ),
    misconceptions: { identify_info: ['psl/included-irrelevant'], solve: ['psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  PART-WHOLE: FIND A PART  (4 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-pw-part-01',
    skillId: 'psl-p3-bar-pw-find-part', heuristic: 'bar-model', structure: 'partWhole', unknownPosition: 'part',
    operations: ['subtraction'], difficulty: 1,
    contexts: [
      { setting: 'school', entityA: 'students', entityB: 'boys', entityC: 'girls', verb: 'are' },
      { setting: 'library', entityA: 'books', entityB: 'English books', entityC: 'Chinese books', verb: 'are' },
    ],
    constraints: { whole: { min: 50, max: 300 }, partA: { min: 20, max: 200 }, answer: { min: 10 } },
    storyTemplate: 'There {verb} {whole} {entityA} in the {setting}. {partA} of them {verb} {entityB}. How many {entityC} {verb} there?',
    scaffold: pwPartScaffold(
      ['Finding a missing part when the total is known', 'Comparing two groups to find the difference', 'Adding two groups together', 'Sharing items equally among groups'],
      ['The number of {entityC}', 'The total number of {entityA}', 'How many more {entityB} than {entityC}', 'How many {entityB} were removed'],
    ),
    misconceptions: { plan: ['psl/wrong-unknown-position'], solve: ['psl/wrong-operation', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-pw-part-02',
    skillId: 'psl-p3-bar-pw-find-part', heuristic: 'bar-model', structure: 'partWhole', unknownPosition: 'part',
    operations: ['subtraction'], difficulty: 1,
    contexts: [
      { setting: 'shop', entityA: 'stickers', verb: 'had', verbPast: 'gave away' },
      { setting: 'farm', entityA: 'eggs', verb: 'collected', verbPast: 'sold' },
    ],
    constraints: { whole: { min: 40, max: 250 }, partA: { min: 15, max: 180 }, answer: { min: 10 } },
    storyTemplate: '{nameA} {verb} {whole} {entityA}. {nameA} {verbPast} {partA} of them. How many {entityA} did {nameA} have left?',
    scaffold: pwPartScaffold(
      ['Starting with a total and removing some', 'Comparing what two people have', 'Adding what two people collected', 'Grouping items into equal sets'],
      ['How many {entityA} are left', 'The total number of {entityA}', 'How many more {entityA} {nameA} needs', 'How many {nameA} gave to each person'],
    ),
    misconceptions: { solve: ['psl/wrong-operation'] },
  },
  {
    templateId: 'psl-tpl-pw-part-03',
    skillId: 'psl-p3-bar-pw-find-part', heuristic: 'bar-model', structure: 'partWhole', unknownPosition: 'part',
    operations: ['subtraction'], difficulty: 1,
    contexts: [
      { setting: 'party', entityA: 'balloons', verb: 'had', verbPast: 'burst' },
      { setting: 'aquarium', entityA: 'fish', verb: 'had', verbPast: 'gave to a friend' },
    ],
    constraints: { whole: { min: 30, max: 200 }, partA: { min: 10, max: 150 }, answer: { min: 5 } },
    storyTemplate: '{nameA} {verb} {whole} {entityA}. {partA} of the {entityA} {verbPast}. How many {entityA} were left?',
    scaffold: pwPartScaffold(
      ['Starting with a total and some are removed', 'Finding the total of two groups', 'Comparing amounts between two people', 'Dividing into equal parts'],
      ['How many {entityA} are left', 'How many {entityA} there were at the start', 'The difference between what two people had', 'How many groups of {entityA}'],
    ),
    misconceptions: { solve: ['psl/wrong-operation', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-pw-part-04',
    skillId: 'psl-p3-bar-pw-find-part', heuristic: 'bar-model', structure: 'partWhole', unknownPosition: 'part',
    operations: ['subtraction'], difficulty: 2,
    contexts: [
      { setting: 'supermarket', entityA: 'items', entityB: 'fruits', entityC: 'vegetables', verb: 'bought' },
      { setting: 'sports meet', entityA: 'participants', entityB: 'runners', entityC: 'swimmers', verb: 'signed up' },
    ],
    constraints: { whole: { min: 60, max: 350 }, partA: { min: 30, max: 250 }, answer: { min: 15 } },
    storyTemplate: '{nameA} {verb} {whole} {entityA}. {partA} of them were {entityB}. The rest were {entityC}. How many {entityC} did {nameA} buy?',
    scaffold: pwPartScaffold(
      ['Finding how many are in the remaining group', 'Adding the groups to find the total', 'Comparing the two groups', 'Sorting items into equal piles'],
      ['The number of {entityC}', 'The total number of {entityA}', 'How many more {entityB} than {entityC}', 'How many {entityA} each person gets'],
    ),
    misconceptions: { plan: ['psl/wrong-unknown-position'], solve: ['psl/wrong-operation'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  PART-WHOLE: 3-PART WHOLE  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-pw-3parts-01',
    skillId: 'psl-p3-bar-pw-3parts', heuristic: 'bar-model', structure: 'partWhole', unknownPosition: 'whole',
    operations: ['addition'], difficulty: 2,
    contexts: [
      { setting: 'canteen', entityA: 'chicken rice', entityB: 'noodles', entityC: 'fried rice', itemPlural: 'meals', verb: 'sold' },
      { setting: 'art class', entityA: 'red beads', entityB: 'blue beads', entityC: 'yellow beads', itemPlural: 'beads', verb: 'used' },
    ],
    constraints: { partA: { min: 15, max: 100 }, partB: { min: 15, max: 100 }, partC: { min: 15, max: 100 }, answer: { max: 300 } },
    storyTemplate: 'The {setting} {verb} {partA} {entityA}, {partB} {entityB} and {partC} {entityC}. How many {itemPlural} were {verb} altogether?',
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
    templateId: 'psl-tpl-pw-3parts-02',
    skillId: 'psl-p3-bar-pw-3parts', heuristic: 'bar-model', structure: 'partWhole', unknownPosition: 'whole',
    operations: ['addition'], difficulty: 2,
    contexts: [
      { setting: 'birthday party', entityA: 'P3 students', entityB: 'P4 students', entityC: 'P5 students', itemPlural: 'students', verb: 'invited' },
      { setting: 'stationery shop', entityA: 'pens', entityB: 'pencils', entityC: 'erasers', itemPlural: 'items', verb: 'bought' },
    ],
    constraints: { partA: { min: 10, max: 80 }, partB: { min: 10, max: 80 }, partC: { min: 10, max: 80 }, answer: { max: 240 } },
    storyTemplate: '{nameA} {verb} {partA} {entityA}, {partB} {entityB} and {partC} {entityC}. How many {itemPlural} did {nameA} {verb} in total?',
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
    templateId: 'psl-tpl-pw-3parts-03',
    skillId: 'psl-p3-bar-pw-3parts', heuristic: 'bar-model', structure: 'partWhole', unknownPosition: 'whole',
    operations: ['addition'], difficulty: 2,
    contexts: [
      { setting: 'hawker centre', entityA: 'laksa', entityB: 'satay', entityC: 'roti prata', itemPlural: 'dishes', verb: 'ordered' },
      { setting: 'zoo', entityA: 'birds', entityB: 'mammals', entityC: 'reptiles', itemPlural: 'animals', verb: 'saw' },
    ],
    constraints: { partA: { min: 12, max: 90 }, partB: { min: 12, max: 90 }, partC: { min: 12, max: 90 }, answer: { max: 270 } },
    storyTemplate: 'On a field trip, the class {verb} {partA} {entityA}, {partB} {entityB} and {partC} {entityC}. How many {itemPlural} did they see altogether?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Counting three categories together', 'Finding which category had the fewest', 'Taking away animals from the zoo', 'Splitting animals into cages',
      ]},
      identify_info: { type: 'highlight', expected: ['{partA}', '{partB}', '{partC}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total number of {itemPlural} seen', 'How many more {entityA} than {entityC}', 'How many {entityB} were left behind', 'How many cages were needed',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'expression', operation: 'addition', expression: '{partA} + {partB} + {partC}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  PART-WHOLE: EQUAL PARTS (MULTIPLICATION)  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-pw-mul-01',
    skillId: 'psl-p3-bar-pw-mul', heuristic: 'bar-model', structure: 'partWhole', unknownPosition: 'whole',
    operations: ['multiplication'], difficulty: 2,
    contexts: [
      { setting: 'party', entityA: 'bags', entityA2: 'bag', entityB: 'sweets', verb: 'packed' },
      { setting: 'classroom', entityA: 'rows', entityA2: 'row', entityB: 'chairs', verb: 'arranged' },
    ],
    constraints: { groups: { min: 3, max: 9 }, perGroup: { min: 3, max: 9 }, answer: { max: 81 } },
    storyTemplate: '{nameA} {verb} {groups} {entityA} of {entityB}. Each {entityA2} had {perGroup} {entityB}. How many {entityB} were there altogether?',
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
    templateId: 'psl-tpl-pw-mul-02',
    skillId: 'psl-p3-bar-pw-mul', heuristic: 'bar-model', structure: 'partWhole', unknownPosition: 'whole',
    operations: ['multiplication'], difficulty: 2,
    contexts: [
      { setting: 'bookshop', entityA: 'shelves', entityA2: 'shelf', entityB: 'books', verb: 'placed' },
      { setting: 'car park', entityA: 'floors', entityA2: 'floor', entityB: 'cars', verb: 'parked on' },
    ],
    constraints: { groups: { min: 4, max: 8 }, perGroup: { min: 4, max: 9 }, answer: { max: 72 } },
    storyTemplate: 'There are {groups} {entityA} in the {setting}. Each {entityA2} holds {perGroup} {entityB}. How many {entityB} are there in all?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Repeated equal groups that make a total', 'Taking away items from shelves', 'Comparing the number on each shelf', 'Sharing books among students',
      ]},
      identify_info: { type: 'highlight', expected: ['{groups}', '{perGroup}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total number of {entityB}', 'How many empty spots are left', 'Which {entityA2} has the most', 'How many {entityA} are needed',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'expression', operation: 'multiplication', expression: '{groups} × {perGroup}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/wrong-operation', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-pw-mul-03',
    skillId: 'psl-p3-bar-pw-mul', heuristic: 'bar-model', structure: 'partWhole', unknownPosition: 'whole',
    operations: ['multiplication'], difficulty: 2,
    contexts: [
      { setting: 'kitchen', entityA: 'trays', entityA2: 'tray', entityB: 'cookies', verb: 'baked' },
      { setting: 'garden', entityA: 'pots', entityA2: 'pot', entityB: 'seeds', verb: 'planted' },
    ],
    constraints: { groups: { min: 3, max: 9 }, perGroup: { min: 3, max: 8 }, answer: { max: 72 } },
    storyTemplate: '{nameA} {verb} {perGroup} {entityB} in each of {groups} {entityA}. How many {entityB} did {nameA} {verb} altogether?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Equal amounts in each group, finding the total', 'Removing items from containers', 'Comparing how much is in each container', 'Dividing items between friends',
      ]},
      identify_info: { type: 'highlight', expected: ['{perGroup}', '{groups}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total number of {entityB}', 'How many {entityA} are empty', 'The difference between the fullest and emptiest', 'How many {entityB} each friend gets',
      ]},
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'whole' },
      solve: { type: 'expression', operation: 'multiplication', expression: '{groups} × {perGroup}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  COMPARISON: FIND THE DIFFERENCE  (4 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-comp-diff-01',
    skillId: 'psl-p3-bar-comp-find-diff', heuristic: 'bar-model', structure: 'comparison', unknownPosition: 'difference',
    operations: ['subtraction'], difficulty: 1,
    contexts: [
      { setting: 'market', entityA: 'mangoes', entityB: 'oranges', verb: 'sold' },
      { setting: 'school', entityA: 'stickers', entityB: 'stickers', verb: 'collected' },
    ],
    constraints: { larger: { min: 50, max: 250 }, smaller: { min: 20, max: 200 }, answer: { min: 10 } },
    storyTemplate: '{nameA} {verb} {larger} {entityA}. {nameB} {verb} {smaller} {entityB}. How many more {entityA} did {nameA} {verb} than {nameB}?',
    scaffold: compDiffScaffold(
      ['Comparing two amounts to find the difference', 'Combining two amounts to find the total', 'Removing some from a group', 'Sharing items equally'],
      ['How many more {nameA} has than {nameB}', 'The total for {nameA} and {nameB}', 'How many {entityA} are left', 'How many each person gets'],
    ),
    misconceptions: { plan: ['psl/wrong-model-type'], solve: ['psl/wrong-operation'] },
  },
  {
    templateId: 'psl-tpl-comp-diff-02',
    skillId: 'psl-p3-bar-comp-find-diff', heuristic: 'bar-model', structure: 'comparison', unknownPosition: 'difference',
    operations: ['subtraction'], difficulty: 1,
    contexts: [
      { setting: 'swimming', entityA: 'laps', verb: 'swam' },
      { setting: 'reading', entityA: 'pages', verb: 'read' },
    ],
    constraints: { larger: { min: 30, max: 200 }, smaller: { min: 10, max: 150 }, answer: { min: 5 } },
    storyTemplate: '{nameA} {verb} {larger} {entityA}. {nameB} {verb} {smaller} {entityA}. How many fewer {entityA} did {nameB} {verb} than {nameA}?',
    scaffold: compDiffScaffold(
      ['Comparing what two people did', 'Adding what two people did together', 'One person giving to the other', 'Splitting equally between two people'],
      ['How many fewer {nameB} has than {nameA}', 'The total {entityA} for both', 'How many {entityA} {nameA} gave away', 'How many each person still has'],
    ),
    misconceptions: { solve: ['psl/wrong-operation'] },
  },
  {
    templateId: 'psl-tpl-comp-diff-03',
    skillId: 'psl-p3-bar-comp-find-diff', heuristic: 'bar-model', structure: 'comparison', unknownPosition: 'difference',
    operations: ['subtraction'], difficulty: 1,
    contexts: [
      { setting: 'savings', entityA: 'dollars', verb: 'saved' },
      { setting: 'spelling test', entityA: 'words', verb: 'spelt correctly' },
    ],
    constraints: { larger: { min: 40, max: 180 }, smaller: { min: 15, max: 140 }, answer: { min: 8 } },
    storyTemplate: '{nameA} {verb} {larger} {entityA}. {nameB} {verb} {smaller} {entityA}. What is the difference between their amounts?',
    scaffold: compDiffScaffold(
      ['Comparing to find how much more one has', 'Adding to find the combined total', 'One person spending their savings', 'Sharing savings between friends'],
      ['The difference between the two amounts', 'The total amount they both have', 'How much {nameA} spent', 'How much each person needs to save more'],
    ),
    misconceptions: { plan: ['psl/wrong-model-type'], solve: ['psl/wrong-operation'] },
  },
  {
    templateId: 'psl-tpl-comp-diff-04',
    skillId: 'psl-p3-bar-comp-find-diff', heuristic: 'bar-model', structure: 'comparison', unknownPosition: 'difference',
    operations: ['subtraction'], difficulty: 2,
    contexts: [
      { setting: 'weight', entityA: 'kg', verb: 'weighs' },
      { setting: 'height', entityA: 'cm', verb: 'is' },
    ],
    constraints: { larger: { min: 100, max: 300 }, smaller: { min: 60, max: 250 }, answer: { min: 10 } },
    storyTemplate: '{nameA} {verb} {larger} {entityA}. {nameB} {verb} {smaller} {entityA}. How much heavier is {nameA} than {nameB}?',
    scaffold: compDiffScaffold(
      ['Comparing two measurements', 'Adding two measurements together', 'Reducing one measurement', 'Finding the average of two measurements'],
      ['How much more {nameA} has', 'Their combined measurement', 'How much {nameB} needs to grow', 'The average measurement'],
    ),
    misconceptions: { plan: ['psl/wrong-model-type'], solve: ['psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  COMPARISON: FIND THE LARGER  (4 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-comp-larger-01',
    skillId: 'psl-p3-bar-comp-find-larger', heuristic: 'bar-model', structure: 'comparison', unknownPosition: 'larger',
    operations: ['addition'], difficulty: 2,
    contexts: [
      { setting: 'savings', entityA: 'dollars', verb: 'saved', comparison: 'more than' },
      { setting: 'collection', entityA: 'stamps', verb: 'has', comparison: 'more than' },
    ],
    constraints: { smaller: { min: 30, max: 200 }, difference: { min: 10, max: 100 }, answer: { max: 300 } },
    storyTemplate: '{nameA} {verb} {smaller} {entityA}. {nameB} {verb} {difference} {comparison} {nameA}. How many {entityA} does {nameB} have?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding the larger amount using the smaller and the difference', 'Adding both people\'s amounts together', 'Finding how much was spent', 'Splitting between two people',
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
    templateId: 'psl-tpl-comp-larger-02',
    skillId: 'psl-p3-bar-comp-find-larger', heuristic: 'bar-model', structure: 'comparison', unknownPosition: 'larger',
    operations: ['addition'], difficulty: 2,
    contexts: [
      { setting: 'baking', entityA: 'muffins', verb: 'baked', comparison: 'more than' },
      { setting: 'gardening', entityA: 'plants', verb: 'grew', comparison: 'more than' },
    ],
    constraints: { smaller: { min: 20, max: 150 }, difference: { min: 8, max: 80 }, answer: { max: 230 } },
    storyTemplate: '{nameA} {verb} {smaller} {entityA}. {nameB} {verb} {difference} {comparison} {nameA}. How many {entityA} did {nameB} {verb}?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'One person has more, and we need to find their amount', 'Finding how many were made altogether', 'Taking some away from a group', 'Finding the average between two people',
      ]},
      identify_info: { type: 'highlight', expected: ['{smaller}', '{difference}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many {entityA} {nameB} {verb}', 'The total {entityA} for both', 'How many {entityA} were eaten', 'The difference between them',
      ]},
      plan: { type: 'model', modelType: 'comparison', unknownPosition: 'larger' },
      solve: { type: 'expression', operation: 'addition', expression: '{smaller} + {difference}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-unknown-position'], solve: ['psl/wrong-operation'] },
  },
  {
    templateId: 'psl-tpl-comp-larger-03',
    skillId: 'psl-p3-bar-comp-find-larger', heuristic: 'bar-model', structure: 'comparison', unknownPosition: 'larger',
    operations: ['addition'], difficulty: 2,
    contexts: [
      { setting: 'race', entityA: 'points', verb: 'scored', comparison: 'more than' },
      { setting: 'test', entityA: 'marks', verb: 'got', comparison: 'more than' },
    ],
    constraints: { smaller: { min: 25, max: 160 }, difference: { min: 5, max: 60 }, answer: { max: 220 } },
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
  //  COMPARISON: FIND THE SMALLER  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-comp-smaller-01',
    skillId: 'psl-p3-bar-comp-find-smaller', heuristic: 'bar-model', structure: 'comparison', unknownPosition: 'smaller',
    operations: ['subtraction'], difficulty: 2,
    contexts: [
      { setting: 'height', entityA: 'cm', verb: 'is', comparison: 'shorter than' },
      { setting: 'mass', entityA: 'kg', verb: 'weighs', comparison: 'less than' },
    ],
    constraints: { larger: { min: 50, max: 250 }, difference: { min: 10, max: 80 }, answer: { min: 10 } },
    storyTemplate: '{nameA} {verb} {larger} {entityA}. {nameB} {verb} {difference} {comparison} {nameA}. How many {entityA} does {nameB} have?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'One person has less, and we need to find their amount', 'Adding both amounts together', 'Finding the average', 'Removing some from a total',
      ]},
      identify_info: { type: 'highlight', expected: ['{larger}', '{difference}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many {entityA} {nameB} has', 'The total for both', 'How many {entityA} {nameA} lost', 'The difference between them',
      ]},
      plan: { type: 'model', modelType: 'comparison', unknownPosition: 'smaller' },
      solve: { type: 'expression', operation: 'subtraction', expression: '{larger} - {difference}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-unknown-position'], solve: ['psl/wrong-operation'] },
  },
  {
    templateId: 'psl-tpl-comp-smaller-02',
    skillId: 'psl-p3-bar-comp-find-smaller', heuristic: 'bar-model', structure: 'comparison', unknownPosition: 'smaller',
    operations: ['subtraction'], difficulty: 2,
    contexts: [
      { setting: 'pocket money', entityA: 'dollars', verb: 'has', comparison: 'fewer than' },
      { setting: 'marble collection', entityA: 'marbles', verb: 'owns', comparison: 'fewer than' },
    ],
    constraints: { larger: { min: 40, max: 200 }, difference: { min: 8, max: 70 }, answer: { min: 10 } },
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
    templateId: 'psl-tpl-comp-smaller-03',
    skillId: 'psl-p3-bar-comp-find-smaller', heuristic: 'bar-model', structure: 'comparison', unknownPosition: 'smaller',
    operations: ['subtraction'], difficulty: 2,
    contexts: [
      { setting: 'running', entityA: 'metres', verb: 'ran', comparison: 'less than' },
      { setting: 'book fair', entityA: 'books', verb: 'bought', comparison: 'fewer than' },
    ],
    constraints: { larger: { min: 60, max: 280 }, difference: { min: 12, max: 90 }, answer: { min: 15 } },
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
  //  COMPARISON: COMPARE THEN TOTAL  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-comp-total-01',
    skillId: 'psl-p3-bar-comp-total', heuristic: 'bar-model', structure: 'comparison', unknownPosition: 'larger',
    operations: ['addition'], difficulty: 3,
    contexts: [
      { setting: 'fruit stall', entityA: 'apples', entityB: 'oranges', verb: 'sold', comparison: 'more' },
      { setting: 'library', entityA: 'books', entityB: 'magazines', verb: 'returned', comparison: 'more' },
    ],
    constraints: { smaller: { min: 30, max: 150 }, difference: { min: 10, max: 60 }, answer: { max: 400 } },
    storyTemplate: '{nameA} {verb} {smaller} {entityA}. {nameB} {verb} {difference} {comparison} {entityB} than {nameA}. How many {entityA} and {entityB} did they {verb} altogether?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'First finding a larger amount, then adding both to get a total', 'Just finding the difference between two groups', 'Subtracting to find what\'s left', 'Sharing items among friends',
      ]},
      identify_info: { type: 'highlight', expected: ['{smaller}', '{difference}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total for both {nameA} and {nameB}', 'Only how many {nameB} has', 'The difference between them', 'How many items are left',
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
    templateId: 'psl-tpl-comp-total-02',
    skillId: 'psl-p3-bar-comp-total', heuristic: 'bar-model', structure: 'comparison', unknownPosition: 'larger',
    operations: ['addition'], difficulty: 3,
    contexts: [
      { setting: 'fundraiser', entityA: 'tickets', entityB: 'tickets', verb: 'sold', comparison: 'more' },
      { setting: 'craft fair', entityA: 'bracelets', entityB: 'necklaces', verb: 'made', comparison: 'more' },
    ],
    constraints: { smaller: { min: 20, max: 120 }, difference: { min: 8, max: 50 }, answer: { max: 300 } },
    storyTemplate: '{nameA} {verb} {smaller} {entityA}. {nameB} {verb} {difference} {comparison} {entityB} than {nameA}. How many did they {verb} altogether?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Using a comparison to find one amount, then adding both', 'Only comparing two amounts', 'Giving away items from a total', 'Dividing items into groups',
      ]},
      identify_info: { type: 'highlight', expected: ['{smaller}', '{difference}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total for both people combined', 'Only {nameB}\'s amount', 'How many fewer {nameA} made', 'How many each person gives away',
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
    templateId: 'psl-tpl-comp-total-03',
    skillId: 'psl-p3-bar-comp-total', heuristic: 'bar-model', structure: 'comparison', unknownPosition: 'larger',
    operations: ['addition'], difficulty: 3,
    contexts: [
      { setting: 'PE lesson', entityA: 'sit-ups', entityB: 'sit-ups', verb: 'did', comparison: 'more' },
      { setting: 'food drive', entityA: 'cans', entityB: 'cans', verb: 'donated', comparison: 'more' },
    ],
    constraints: { smaller: { min: 25, max: 130 }, difference: { min: 10, max: 55 }, answer: { max: 320 } },
    storyTemplate: '{nameA} {verb} {smaller} {entityA}. {nameB} {verb} {difference} {comparison} {entityB} than {nameA}. How many {entityA} did they do in total?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding the larger, then adding both amounts', 'Just finding who did more', 'Removing some from a group', 'Splitting a total into two'],
      },
      identify_info: { type: 'highlight', expected: ['{smaller}', '{difference}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total for both people', '{nameB}\'s amount only', 'The difference between them', 'How many each did on average'],
      },
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
  //  TWO-STEP: PART-WHOLE + COMPARISON  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-twostep-pw-comp-01',
    skillId: 'psl-p3-twostep-pw-comp', heuristic: 'bar-model', structure: 'twoStep', unknownPosition: 'difference',
    operations: ['subtraction'], difficulty: 3,
    contexts: [
      { setting: 'sports day', entityA: 'Red team', entityB: 'Blue team', itemPlural: 'points', verb: 'scored' },
    ],
    constraints: { whole: { min: 100, max: 300 }, partA: { min: 30, max: 150 }, answer: { min: 5 } },
    storyTemplate: '{entityA} and {entityB} {verb} {whole} {itemPlural} altogether. {entityA} {verb} {partA} {itemPlural}. How many more {itemPlural} did one team score than the other?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding a missing part, then comparing the two parts', 'Just adding the scores together', 'Removing points from a team', 'Sharing points equally'],
      },
      identify_info: { type: 'highlight', expected: ['{whole}', '{partA}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many more one team scored than the other', 'The total points for both teams', 'How many points were deducted', 'How many points each player scored'],
      },
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'twoStep', steps: [
        { operation: 'subtraction', expression: '{whole} - {partA}', label: 'Find the other part' },
        { operation: 'subtraction', expression: '{partA} - {partB}', label: 'Find the difference' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-model-type'], solve: ['psl/used-wrong-numbers', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-twostep-pw-comp-02',
    skillId: 'psl-p3-twostep-pw-comp', heuristic: 'bar-model', structure: 'twoStep', unknownPosition: 'difference',
    operations: ['subtraction'], difficulty: 3,
    contexts: [
      { setting: 'bake sale', entityA: 'Class 3A', entityB: 'Class 3B', itemPlural: 'cookies', verb: 'sold' },
    ],
    constraints: { whole: { min: 80, max: 250 }, partA: { min: 25, max: 130 }, answer: { min: 5 } },
    storyTemplate: '{entityA} and {entityB} {verb} {whole} {itemPlural} in total. {entityA} {verb} {partA} {itemPlural}. How many more {itemPlural} did one class sell than the other?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding one class\'s sales from the total, then comparing', 'Just adding both classes\' sales', 'Finding how many cookies are left over', 'Sharing cookies equally'],
      },
      identify_info: { type: 'highlight', expected: ['{whole}', '{partA}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The difference in {itemPlural} sold by each class', 'The total {itemPlural} sold', 'How many {itemPlural} each student sold', 'How many {itemPlural} were unsold'],
      },
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'twoStep', steps: [
        { operation: 'subtraction', expression: '{whole} - {partA}', label: 'Find the other part' },
        { operation: 'subtraction', expression: '{partA} - {partB}', label: 'Find the difference' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/used-wrong-numbers', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-twostep-pw-comp-03',
    skillId: 'psl-p3-twostep-pw-comp', heuristic: 'bar-model', structure: 'twoStep', unknownPosition: 'difference',
    operations: ['subtraction'], difficulty: 3,
    contexts: [
      { setting: 'reading challenge', entityA: '{nameA}', entityB: '{nameB}', itemPlural: 'pages', verb: 'read' },
    ],
    constraints: { whole: { min: 90, max: 280 }, partA: { min: 30, max: 140 }, answer: { min: 5 } },
    storyTemplate: '{nameA} and {nameB} {verb} {whole} {itemPlural} altogether. {nameA} {verb} {partA} {itemPlural}. How many more {itemPlural} did one person read than the other?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Using the total to find one part, then finding the difference', 'Just combining both amounts', 'Finding how many pages are left in the book', 'Splitting pages equally'],
      },
      identify_info: { type: 'highlight', expected: ['{whole}', '{partA}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many more {itemPlural} one person read', 'The total {itemPlural} read', 'How many {itemPlural} are in the book', 'How many {itemPlural} each read per day'],
      },
      plan: { type: 'model', modelType: 'partWhole', unknownPosition: 'part' },
      solve: { type: 'twoStep', steps: [
        { operation: 'subtraction', expression: '{whole} - {partA}', label: 'Find the other part' },
        { operation: 'subtraction', expression: '{partA} - {partB}', label: 'Find the difference' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-model-type'], solve: ['psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  TWO-STEP: COMPARISON + PART-WHOLE  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-twostep-comp-pw-01',
    skillId: 'psl-p3-twostep-comp-pw', heuristic: 'bar-model', structure: 'twoStep', unknownPosition: 'whole',
    operations: ['addition'], difficulty: 3,
    contexts: [
      { setting: 'bookshop', entityA: 'English books', entityB: 'Chinese books', verb: 'bought', comparison: 'more' },
    ],
    constraints: { smaller: { min: 20, max: 120 }, difference: { min: 10, max: 60 }, answer: { max: 300 } },
    storyTemplate: '{nameA} {verb} {smaller} {entityA}. {nameA} {verb} {difference} {comparison} {entityB} than {entityA}. How many books did {nameA} buy altogether?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Using a comparison to find one amount, then adding to find the total', 'Just comparing two groups', 'Removing items from a shelf', 'Sharing books between friends'],
      },
      identify_info: { type: 'highlight', expected: ['{smaller}', '{difference}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total number of books', 'Only how many {entityB}', 'The difference between the two types', 'How many books were returned'],
      },
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
    templateId: 'psl-tpl-twostep-comp-pw-02',
    skillId: 'psl-p3-twostep-comp-pw', heuristic: 'bar-model', structure: 'twoStep', unknownPosition: 'whole',
    operations: ['addition'], difficulty: 3,
    contexts: [
      { setting: 'fruit shop', entityA: 'mangoes', entityB: 'durians', verb: 'bought', comparison: 'more' },
    ],
    constraints: { smaller: { min: 15, max: 100 }, difference: { min: 8, max: 50 }, answer: { max: 250 } },
    storyTemplate: '{nameA} {verb} {smaller} {entityA}. {nameA} {verb} {difference} {comparison} {entityB} than {entityA}. How many fruits did {nameA} buy in all?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding the bigger group first, then adding both groups', 'Only finding the difference', 'Taking fruits out of a basket', 'Splitting fruits equally'],
      },
      identify_info: { type: 'highlight', expected: ['{smaller}', '{difference}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total number of fruits', 'Only the number of {entityB}', 'How many fruits were eaten', 'The difference between the two fruits'],
      },
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
    templateId: 'psl-tpl-twostep-comp-pw-03',
    skillId: 'psl-p3-twostep-comp-pw', heuristic: 'bar-model', structure: 'twoStep', unknownPosition: 'whole',
    operations: ['addition'], difficulty: 3,
    contexts: [
      { setting: 'donation drive', entityA: 'shirts', entityB: 'pants', verb: 'collected', comparison: 'more' },
    ],
    constraints: { smaller: { min: 18, max: 110 }, difference: { min: 6, max: 45 }, answer: { max: 270 } },
    storyTemplate: 'The {setting} {verb} {smaller} {entityA}. They {verb} {difference} {comparison} {entityB} than {entityA}. How many clothing items did they collect altogether?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Using a comparison to find one amount, then getting the total', 'Finding the difference between donations', 'Giving clothing away', 'Sorting clothes into piles'],
      },
      identify_info: { type: 'highlight', expected: ['{smaller}', '{difference}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The total number of clothing items', 'Only the number of {entityB}', 'How many items were given away', 'The difference between {entityA} and {entityB}'],
      },
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
  //  H2: FIND A PATTERN — LINEAR SEQUENCE (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-h2-linear-01',
    skillId: 'psl-p3-pattern-linear', structure: null, heuristic: 'find-pattern',
    operations: ['addition'], difficulty: 1,
    contexts: [{ setting: 'number pattern', verb: 'starts' }],
    constraints: { start: { min: 1, max: 9 }, step: { options: [2, 3, 5, 10] }, targetPos: { min: 6, max: 8 } },
    storyTemplate: 'Look at the pattern: {term1}, {term2}, {term3}, {term4}, … What is the {ordTarget} number?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this problem asking you to do?', correctIndex: 0, choices: [
        'Find a number further along in a pattern', 'Add all the numbers together', 'Find the difference between two numbers', 'Arrange numbers from smallest to largest',
      ]},
      identify_info: { type: 'highlight', expected: ['{term1}', '{term2}', '{term3}', '{term4}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The {ordTarget} number in the pattern', 'The sum of all numbers', 'How many numbers are in the pattern', 'The smallest number',
      ]},
      plan: { type: 'table_setup', prompt: 'Set up a table to organise the pattern.', columns: ['Position', 'Value'], knownRows: [[1, '{term1}'], [2, '{term2}'], [3, '{term3}'], [4, '{term4}']], requiredCount: 2 },
      solve: { type: 'find_rule', prompt: 'Complete the table and find the {ordTarget} term.', columns: ['Position', 'Value'], knownRows: [[1, '{term1}'], [2, '{term2}'], [3, '{term3}'], [4, '{term4}']], targetPosition: '{targetPos}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Does your answer fit the pattern? Check that each step adds the same amount.' },
    },
    misconceptions: { solve: ['psl/wrong-rule', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-h2-linear-02',
    skillId: 'psl-p3-pattern-linear', structure: null, heuristic: 'find-pattern',
    operations: ['addition'], difficulty: 1,
    contexts: [{ setting: 'growing collection', verb: 'adds' }],
    constraints: { start: { min: 2, max: 12 }, step: { min: 3, max: 10 }, targetPos: { min: 8, max: 12 } },
    storyTemplate: '{nameA} saves stickers. After week 1 there are {term1}, week 2 there are {term2}, week 3 there are {term3}, week 4 there are {term4}. How many stickers after week {targetPos}?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this problem about?', correctIndex: 0, choices: [
        'Finding how a collection grows each week', 'Sharing stickers equally', 'Comparing two collections', 'Finding the total given away',
      ]},
      identify_info: { type: 'highlight', expected: ['{term1}', '{term2}', '{term3}', '{term4}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The number of stickers after week {targetPos}', 'How many stickers were given away', 'The difference between week 1 and week 4', 'The total across all weeks',
      ]},
      plan: { type: 'table_setup', prompt: 'Set up a table with weeks and sticker counts.', columns: ['Week', 'Stickers'], knownRows: [[1, '{term1}'], [2, '{term2}'], [3, '{term3}'], [4, '{term4}']], requiredCount: 2 },
      solve: { type: 'find_rule', prompt: 'Extend the table to week {targetPos}.', columns: ['Week', 'Stickers'], knownRows: [[1, '{term1}'], [2, '{term2}'], [3, '{term3}'], [4, '{term4}']], targetPosition: '{targetPos}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Check: the sticker count should increase by the same amount each week.' },
    },
    misconceptions: { solve: ['psl/wrong-rule', 'psl/off-by-one'] },
  },
  {
    templateId: 'psl-tpl-h2-linear-03',
    skillId: 'psl-p3-pattern-linear', structure: null, heuristic: 'find-pattern',
    operations: ['addition', 'subtraction'], difficulty: 1,
    contexts: [{ setting: 'decreasing pattern', verb: 'starts' }],
    constraints: { start: { min: 50, max: 100 }, step: { options: [-3, -5, -7, -10] }, targetPos: { min: 7, max: 10 } },
    storyTemplate: 'A number pattern goes: {term1}, {term2}, {term3}, {term4}, … What is the {ordTarget} number?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What do you notice about this pattern?', correctIndex: 0, choices: [
        'The numbers are decreasing by a fixed amount', 'The numbers are increasing', 'The numbers are all even', 'The numbers are random',
      ]},
      identify_info: { type: 'highlight', expected: ['{term1}', '{term2}', '{term3}', '{term4}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The {ordTarget} number in the decreasing pattern', 'Why the pattern is decreasing', 'The sum of the pattern', 'The average of the numbers',
      ]},
      plan: { type: 'table_setup', prompt: 'Set up a table to track the pattern.', columns: ['Position', 'Value'], knownRows: [[1, '{term1}'], [2, '{term2}'], [3, '{term3}'], [4, '{term4}']], requiredCount: 2 },
      solve: { type: 'find_rule', prompt: 'Find the rule and the {ordTarget} term.', columns: ['Position', 'Value'], knownRows: [[1, '{term1}'], [2, '{term2}'], [3, '{term3}'], [4, '{term4}']], targetPosition: '{targetPos}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Check: subtract the step from each term to confirm the pattern continues.' },
    },
    misconceptions: { solve: ['psl/wrong-rule', 'psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  H2: FIND A PATTERN — SHAPE PATTERN (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-h2-shape-01',
    skillId: 'psl-p3-pattern-geometric', structure: null, heuristic: 'find-pattern',
    operations: ['multiplication', 'addition'], difficulty: 2,
    contexts: [{ setting: 'matchstick squares', verb: 'builds' }],
    constraints: { multiplier: 3, constant: 1, targetPos: { min: 5, max: 12 } },
    storyTemplate: '{nameA} builds squares in a row with matchsticks. 1 square needs 4 sticks, 2 squares need 7, 3 need 10. How many matchsticks for {targetPos} squares?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this problem about?', correctIndex: 0, choices: [
        'Finding how many matchsticks are needed for more squares', 'Counting the total number of squares', 'Dividing matchsticks equally', 'Finding the area of squares',
      ]},
      identify_info: { type: 'highlight', expected: ['4', '7', '10'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'Matchsticks needed for {targetPos} squares', 'How many squares can be made with 30 sticks', 'The length of one matchstick', 'How many sticks are shared between squares',
      ]},
      plan: { type: 'table_setup', prompt: 'Set up a table of squares vs matchsticks.', columns: ['Squares', 'Matchsticks'], knownRows: [[1, 4], [2, 7], [3, 10]], requiredCount: 2 },
      solve: { type: 'find_rule', prompt: 'Find the rule and work out sticks for {targetPos} squares.', columns: ['Squares', 'Matchsticks'], knownRows: [[1, 4], [2, 7], [3, 10]], targetPosition: '{targetPos}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Check: each new square adds 3 sticks. Rule is 3n + 1.' },
    },
    misconceptions: { solve: ['psl/wrong-rule', 'psl/off-by-one'] },
  },
  {
    templateId: 'psl-tpl-h2-shape-02',
    skillId: 'psl-p3-pattern-geometric', structure: null, heuristic: 'find-pattern',
    operations: ['multiplication', 'addition'], difficulty: 2,
    contexts: [{ setting: 'matchstick triangles', verb: 'arranges' }],
    constraints: { multiplier: 2, constant: 1, targetPos: { min: 6, max: 15 } },
    storyTemplate: '{nameA} arranges triangles in a row with matchsticks. 1 triangle uses 3 sticks, 2 use 5, 3 use 7. How many matchsticks for {targetPos} triangles?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this problem about?', correctIndex: 0, choices: [
        'Finding matchsticks needed for a row of triangles', 'Counting triangles', 'Finding the perimeter of a triangle', 'Splitting sticks into equal groups',
      ]},
      identify_info: { type: 'highlight', expected: ['3', '5', '7'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'Matchsticks needed for {targetPos} triangles', 'How many triangles can be made', 'The size of each triangle', 'The number of shared sides',
      ]},
      plan: { type: 'table_setup', prompt: 'Set up a table of triangles vs matchsticks.', columns: ['Triangles', 'Matchsticks'], knownRows: [[1, 3], [2, 5], [3, 7]], requiredCount: 2 },
      solve: { type: 'find_rule', prompt: 'Find the rule and work out sticks for {targetPos} triangles.', columns: ['Triangles', 'Matchsticks'], knownRows: [[1, 3], [2, 5], [3, 7]], targetPosition: '{targetPos}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Check: each new triangle adds 2 sticks. Rule is 2n + 1.' },
    },
    misconceptions: { solve: ['psl/wrong-rule', 'psl/off-by-one'] },
  },
  {
    templateId: 'psl-tpl-h2-shape-03',
    skillId: 'psl-p3-pattern-geometric', structure: null, heuristic: 'find-pattern',
    operations: ['multiplication'], difficulty: 2,
    contexts: [{ setting: 'dot pattern', verb: 'draws' }],
    constraints: { multiplier: 4, constant: 0, targetPos: { min: 8, max: 15 } },
    storyTemplate: '{nameA} draws a cross pattern with dots. Pattern 1 has 4 dots, pattern 2 has 8, pattern 3 has 12. How many dots in pattern {targetPos}?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this problem about?', correctIndex: 0, choices: [
        'Finding how many dots in a growing pattern', 'Drawing cross shapes', 'Comparing dot sizes', 'Counting the number of patterns',
      ]},
      identify_info: { type: 'highlight', expected: ['4', '8', '12'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The number of dots in pattern {targetPos}', 'How many patterns fit on a page', 'The size of each dot', 'The total dots across all patterns',
      ]},
      plan: { type: 'table_setup', prompt: 'Set up a table of pattern number vs dots.', columns: ['Pattern', 'Dots'], knownRows: [[1, 4], [2, 8], [3, 12]], requiredCount: 2 },
      solve: { type: 'find_rule', prompt: 'Find the rule and work out dots for pattern {targetPos}.', columns: ['Pattern', 'Dots'], knownRows: [[1, 4], [2, 8], [3, 12]], targetPosition: '{targetPos}', answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Check: each pattern adds 4 dots. Rule is 4n.' },
    },
    misconceptions: { solve: ['psl/wrong-rule', 'psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  H3: SUBSTITUTION — SAME COEFFICIENT (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-h3-same-01',
    skillId: 'psl-p3-sub-same-coeff', structure: null, heuristic: 'substitution',
    operations: ['addition', 'subtraction'], difficulty: 1,
    contexts: [{ setting: 'fruit shop', verb: 'buys' }],
    constraints: { applePrice: { min: 3, max: 12 }, orangePrice: { min: 2, max: 9 } },
    storyTemplate: '2 apples and 1 orange cost ${totalA}. 2 apples and 3 oranges cost ${totalB}. Find the cost of 1 orange.',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this problem about?', correctIndex: 0, choices: [
        'Finding prices using two pieces of information', 'Adding fruit prices', 'Comparing two shops', 'Sharing fruit equally',
      ]},
      identify_info: { type: 'highlight', expected: ['${totalA}', '${totalB}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The cost of 1 orange', 'The total cost of fruit', 'How many fruits were bought', 'The cost of all apples',
      ]},
      plan: { type: 'equation_setup', prompt: 'Which variable can you eliminate by subtracting?', equations: ['2 apples + 1 orange = ${totalA}', '2 apples + 3 oranges = ${totalB}'], variables: ['apples', 'oranges'] },
      solve: { type: 'eliminate', prompt: 'Subtract equation 1 from equation 2 to eliminate apples.', steps: ['Subtract: ({totalB} − {totalA}) = 2 oranges', 'So 1 orange = ...'], variables: ['orange', 'apple'], answer: '{orangePrice}' },
      check: { type: 'reasonableness', prompt: 'Check: 2 × apple + 1 × {orangePrice} = ${totalA}? 2 × apple + 3 × {orangePrice} = ${totalB}?' },
    },
    misconceptions: { solve: ['psl/wrong-elimination', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-h3-same-02',
    skillId: 'psl-p3-sub-same-coeff', structure: null, heuristic: 'substitution',
    operations: ['addition', 'subtraction'], difficulty: 1,
    contexts: [{ setting: 'stationery shop', verb: 'buys' }],
    constraints: { rulerPrice: { min: 2, max: 6 }, penPrice: { min: 1.5, max: 3 } },
    storyTemplate: '2 rulers and 3 pens cost ${totalA}. 4 rulers and 3 pens cost ${totalB}. Find the cost of 1 ruler.',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this problem about?', correctIndex: 0, choices: [
        'Finding prices by comparing two purchases', 'Counting stationery items', 'Sharing pens equally', 'Finding the total stationery',
      ]},
      identify_info: { type: 'highlight', expected: ['${totalA}', '${totalB}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The cost of 1 ruler', 'The total number of items', 'The cost of all pens', 'How many rulers were bought',
      ]},
      plan: { type: 'equation_setup', prompt: 'Which variable has the same coefficient in both equations?', equations: ['2 rulers + 3 pens = ${totalA}', '4 rulers + 3 pens = ${totalB}'], variables: ['rulers', 'pens'] },
      solve: { type: 'eliminate', prompt: 'Subtract to eliminate pens (same coefficient: 3).', steps: ['Subtract: ({totalB} − {totalA}) = 2 rulers', 'So 1 ruler = ...'], variables: ['ruler', 'pen'], answer: '{rulerPrice}' },
      check: { type: 'reasonableness', prompt: 'Check: 2 × {rulerPrice} + 3 × pen = ${totalA}?' },
    },
    misconceptions: { solve: ['psl/wrong-elimination', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-h3-same-03',
    skillId: 'psl-p3-sub-same-coeff', structure: null, heuristic: 'substitution',
    operations: ['addition', 'subtraction'], difficulty: 1,
    contexts: [{ setting: 'bakery', verb: 'buys' }],
    constraints: { cakePrice: { min: 3, max: 10 }, muffinPrice: { min: 2, max: 5 } },
    storyTemplate: '1 cake and 2 muffins cost ${totalA}. 1 cake and 5 muffins cost ${totalB}. Find the cost of 1 muffin.',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this problem about?', correctIndex: 0, choices: [
        'Finding bakery prices from two orders', 'Counting cakes', 'Sharing muffins equally', 'Comparing bakeries',
      ]},
      identify_info: { type: 'highlight', expected: ['${totalA}', '${totalB}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The cost of 1 muffin', 'The total cost', 'The number of cakes', 'The cost of the cake',
      ]},
      plan: { type: 'equation_setup', prompt: 'Which variable can you eliminate?', equations: ['1 cake + 2 muffins = ${totalA}', '1 cake + 5 muffins = ${totalB}'], variables: ['cake', 'muffins'] },
      solve: { type: 'eliminate', prompt: 'Subtract to eliminate cakes.', steps: ['Subtract: ({totalB} − {totalA}) = 3 muffins', 'So 1 muffin = ...'], variables: ['muffin', 'cake'], answer: '{muffinPrice}' },
      check: { type: 'reasonableness', prompt: 'Check: cake + 2 × {muffinPrice} = ${totalA}?' },
    },
    misconceptions: { solve: ['psl/wrong-elimination', 'psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  H3: SUBSTITUTION — SCALING NEEDED (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-h3-scale-01',
    skillId: 'psl-p3-sub-scale', structure: null, heuristic: 'substitution',
    operations: ['multiplication', 'subtraction'], difficulty: 2,
    contexts: [{ setting: 'clothing shop', verb: 'buys' }],
    constraints: { shortsPrice: { min: 4, max: 15 }, topPrice: { min: 5, max: 18 } },
    storyTemplate: '3 shorts and 2 tops cost ${totalA}. 5 shorts and 4 tops cost ${totalB}. Find the cost of 1 top.',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this problem about?', correctIndex: 0, choices: [
        'Finding clothing prices from two orders', 'Counting clothes', 'Comparing two shops', 'Sharing clothes equally',
      ]},
      identify_info: { type: 'highlight', expected: ['${totalA}', '${totalB}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The cost of 1 top', 'The total spending', 'How many items were bought', 'The cost of 1 shorts',
      ]},
      plan: { type: 'equation_setup', prompt: 'Neither variable has matching coefficients. Which should you eliminate?', equations: ['3 shorts + 2 tops = ${totalA}', '5 shorts + 4 tops = ${totalB}'], variables: ['shorts', 'tops'] },
      solve: { type: 'eliminate', prompt: 'Double equation 1 (6 shorts + 4 tops), then subtract equation 2.', steps: ['2 × eq1: 6 shorts + 4 tops = ${doubledA}', 'Subtract eq2: 1 short = ${doubledA} − ${totalB}', 'Back-substitute to find 1 top'], variables: ['top', 'shorts'], answer: '{topPrice}' },
      check: { type: 'reasonableness', prompt: 'Check: 3 × shorts + 2 × {topPrice} = ${totalA}?' },
    },
    misconceptions: { solve: ['psl/wrong-scale-factor', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-h3-scale-02',
    skillId: 'psl-p3-sub-scale', structure: null, heuristic: 'substitution',
    operations: ['multiplication', 'subtraction'], difficulty: 2,
    contexts: [{ setting: 'toy shop', verb: 'buys' }],
    constraints: { carPrice: { min: 3, max: 8 }, dollPrice: { min: 5, max: 12 } },
    storyTemplate: '2 toy cars and 1 doll cost ${totalA}. 3 toy cars and 2 dolls cost ${totalB}. Find the cost of 1 doll.',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this problem about?', correctIndex: 0, choices: [
        'Finding toy prices from two purchases', 'Counting toys', 'Sharing toys', 'Comparing toy shops',
      ]},
      identify_info: { type: 'highlight', expected: ['${totalA}', '${totalB}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The cost of 1 doll', 'The total cost of toys', 'How many toys were bought', 'The cost of 1 car',
      ]},
      plan: { type: 'equation_setup', prompt: 'How can you make the coefficients match?', equations: ['2 cars + 1 doll = ${totalA}', '3 cars + 2 dolls = ${totalB}'], variables: ['cars', 'dolls'] },
      solve: { type: 'eliminate', prompt: 'Multiply equation 1 by 2, then subtract equation 2 to eliminate dolls.', steps: ['2 × eq1: 4 cars + 2 dolls = ${doubledA}', 'Subtract eq2: 1 car = ${doubledA} − ${totalB}', 'Substitute back for 1 doll'], variables: ['doll', 'car'], answer: '{dollPrice}' },
      check: { type: 'reasonableness', prompt: 'Check: 2 × car + {dollPrice} = ${totalA}?' },
    },
    misconceptions: { solve: ['psl/wrong-scale-factor', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-h3-scale-03',
    skillId: 'psl-p3-sub-scale', structure: null, heuristic: 'substitution',
    operations: ['multiplication', 'subtraction'], difficulty: 2,
    contexts: [{ setting: 'food stall', verb: 'buys' }],
    constraints: { burgerPrice: { min: 4, max: 10 }, drinkPrice: { min: 2, max: 5 } },
    storyTemplate: '3 burgers and 1 drink cost ${totalA}. 2 burgers and 3 drinks cost ${totalB}. Find the cost of 1 drink.',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this problem about?', correctIndex: 0, choices: [
        'Finding food prices from two orders', 'Counting items ordered', 'Comparing food stalls', 'Sharing the bill',
      ]},
      identify_info: { type: 'highlight', expected: ['${totalA}', '${totalB}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The cost of 1 drink', 'The total bill', 'How many items were ordered', 'The cost of 1 burger',
      ]},
      plan: { type: 'equation_setup', prompt: 'Which variable will you eliminate? What scaling do you need?', equations: ['3 burgers + 1 drink = ${totalA}', '2 burgers + 3 drinks = ${totalB}'], variables: ['burgers', 'drinks'] },
      solve: { type: 'eliminate', prompt: 'Multiply equation 1 by 3, then subtract equation 2 to eliminate drinks.', steps: ['3 × eq1: 9 burgers + 3 drinks = ${tripledA}', 'Subtract eq2: 7 burgers = ${tripledA} − ${totalB}', 'Find 1 burger, then substitute for 1 drink'], variables: ['drink', 'burger'], answer: '{drinkPrice}' },
      check: { type: 'reasonableness', prompt: 'Check: 3 × burger + {drinkPrice} = ${totalA}? 2 × burger + 3 × {drinkPrice} = ${totalB}?' },
    },
    misconceptions: { solve: ['psl/wrong-scale-factor', 'psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  H4: MAKE A LIST — SINGLE CONDITION (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-h4-simple-01',
    skillId: 'psl-p3-list-simple', structure: null, heuristic: 'make-list',
    operations: ['multiplication'], difficulty: 1,
    contexts: [{ setting: 'number puzzle', verb: 'is' }],
    constraints: { answer: { options: [15, 25, 35, 45, 55, 65, 75, 85, 95] }, rangeSpread: { min: 3, max: 4 } },
    storyTemplate: 'I am a number between {lo} and {hi}. I am odd and a multiple of 5. What number am I?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this problem about?', correctIndex: 0, choices: [
        'Finding a number that meets specific conditions', 'Adding numbers together', 'Finding the biggest number', 'Dividing numbers',
      ]},
      identify_info: { type: 'highlight', expected: ['{lo}', '{hi}', 'odd', 'multiple of 5'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The number that satisfies all conditions', 'The range of numbers', 'How many multiples of 5 exist', 'The sum of all odd numbers',
      ]},
      plan: { type: 'list_candidates', prompt: 'What conditions must the answer satisfy?', conditions: ['Between {lo} and {hi}', 'Odd number', 'Multiple of 5'], showRange: true },
      solve: { type: 'list_check', prompt: 'List the multiples of 5 in range, then keep only the odd one.', conditions: ['Between {lo} and {hi}', 'Odd', 'Multiple of 5'], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is {answer} between {lo} and {hi}? Is it odd? Is it a multiple of 5?' },
    },
    misconceptions: { solve: ['psl/missed-candidate', 'psl/wrong-condition'] },
  },
  {
    templateId: 'psl-tpl-h4-simple-02',
    skillId: 'psl-p3-list-simple', structure: null, heuristic: 'make-list',
    operations: ['multiplication'], difficulty: 1,
    contexts: [{ setting: 'number puzzle', verb: 'is' }],
    constraints: { answer: { options: [14, 28, 42, 56, 70, 84, 98] }, rangeSpread: { min: 5, max: 6 } },
    storyTemplate: 'I am a number between {lo} and {hi}. I am even and a multiple of 7. What number am I?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this problem about?', correctIndex: 0, choices: [
        'Finding a number that meets multiple conditions', 'Multiplying two numbers', 'Finding all even numbers', 'Comparing numbers',
      ]},
      identify_info: { type: 'highlight', expected: ['{lo}', '{hi}', 'even', 'multiple of 7'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The even multiple of 7 in the range', 'All multiples of 7', 'The largest even number', 'The sum of the range',
      ]},
      plan: { type: 'list_candidates', prompt: 'What conditions must the answer satisfy?', conditions: ['Between {lo} and {hi}', 'Even number', 'Multiple of 7'], showRange: true },
      solve: { type: 'list_check', prompt: 'List multiples of 7 in range, keep the even one.', conditions: ['Between {lo} and {hi}', 'Even', 'Multiple of 7'], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is {answer} even? Is it divisible by 7? Is it in range?' },
    },
    misconceptions: { solve: ['psl/missed-candidate', 'psl/wrong-condition'] },
  },
  {
    templateId: 'psl-tpl-h4-simple-03',
    skillId: 'psl-p3-list-simple', structure: null, heuristic: 'make-list',
    operations: ['multiplication'], difficulty: 1,
    contexts: [{ setting: 'locker puzzle', verb: 'is' }],
    constraints: { answer: { options: [12, 18, 24, 30, 36] }, rangeSpread: { min: 4, max: 6 } },
    storyTemplate: 'A locker number between {lo} and {hi} is a multiple of both 3 and {secondFactor}. What is the locker number?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this problem about?', correctIndex: 0, choices: [
        'Finding a number that is a common multiple', 'Counting lockers', 'Finding the difference between lockers', 'Ordering locker numbers',
      ]},
      identify_info: { type: 'highlight', expected: ['{lo}', '{hi}', '3', '{secondFactor}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The locker number that is a multiple of both', 'How many lockers there are', 'The smallest multiple', 'The sum of all locker numbers',
      ]},
      plan: { type: 'list_candidates', prompt: 'What conditions must the answer satisfy?', conditions: ['Between {lo} and {hi}', 'Multiple of 3', 'Multiple of {secondFactor}'], showRange: true },
      solve: { type: 'list_check', prompt: 'List common multiples in range.', conditions: ['Between {lo} and {hi}', 'Multiple of 3', 'Multiple of {secondFactor}'], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is {answer} divisible by both 3 and {secondFactor}?' },
    },
    misconceptions: { solve: ['psl/missed-candidate'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  H4: MAKE A LIST — MULTIPLE CONDITIONS (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-h4-multi-01',
    skillId: 'psl-p3-list-multi', structure: null, heuristic: 'make-list',
    operations: ['division'], difficulty: 2,
    contexts: [{ setting: 'remainder puzzle', verb: 'is' }],
    constraints: { divisor1: { options: [5, 6, 7] }, divisor2: { options: [4, 8, 9] } },
    storyTemplate: 'A number between {lo} and {hi} leaves remainder {rem1} when divided by {div1}, and remainder {rem2} when divided by {div2}. Find it.',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this problem about?', correctIndex: 0, choices: [
        'Finding a number with specific remainders', 'Dividing two numbers', 'Finding the quotient', 'Comparing remainders',
      ]},
      identify_info: { type: 'highlight', expected: ['{lo}', '{hi}', '{rem1}', '{div1}', '{rem2}', '{div2}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The number with both specified remainders', 'The remainder when dividing', 'The quotient of division', 'The largest number in range',
      ]},
      plan: { type: 'list_candidates', prompt: 'What conditions must the answer satisfy?', conditions: ['Between {lo} and {hi}', 'Remainder {rem1} when ÷ {div1}', 'Remainder {rem2} when ÷ {div2}'], showRange: true },
      solve: { type: 'list_check', prompt: 'List numbers with remainder {rem1} on ÷{div1}, then check ÷{div2}.', conditions: ['Remainder {rem1} when ÷ {div1}', 'Remainder {rem2} when ÷ {div2}'], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Check: {answer} ÷ {div1} gives remainder {rem1}? {answer} ÷ {div2} gives remainder {rem2}?' },
    },
    misconceptions: { solve: ['psl/missed-candidate', 'psl/forgot-condition'] },
  },
  {
    templateId: 'psl-tpl-h4-multi-02',
    skillId: 'psl-p3-list-multi', structure: null, heuristic: 'make-list',
    operations: ['multiplication', 'division'], difficulty: 2,
    contexts: [{ setting: 'marble jar', verb: 'holds' }],
    constraints: { stackA: 8, stackB: 9 },
    storyTemplate: 'A jar holds between {lo} and {hi} marbles. In stacks of {stackA} there are {extraA} left over. In stacks of {stackB} it is {shortB} short of a full stack. How many marbles?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this problem about?', correctIndex: 0, choices: [
        'Finding a number that fits two stacking conditions', 'Counting marbles', 'Sharing marbles equally', 'Comparing two jars',
      ]},
      identify_info: { type: 'highlight', expected: ['{lo}', '{hi}', '{stackA}', '{extraA}', '{stackB}', '{shortB}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The number of marbles in the jar', 'How many stacks can be made', 'The leftover marbles', 'The size of each stack',
      ]},
      plan: { type: 'list_candidates', prompt: 'What conditions must the answer satisfy?', conditions: ['Between {lo} and {hi}', '{extraA} left over in stacks of {stackA}', '{shortB} short of a full stack of {stackB}'], showRange: true },
      solve: { type: 'list_check', prompt: 'List numbers that are {extraA} more than a multiple of {stackA}, then check the second condition.', conditions: ['{extraA} more than a multiple of {stackA}', '{shortB} short of a multiple of {stackB}'], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Check: {answer} ÷ {stackA} has remainder {extraA}? {answer} + {shortB} is a multiple of {stackB}?' },
    },
    misconceptions: { solve: ['psl/missed-candidate', 'psl/forgot-condition'] },
  },
  {
    templateId: 'psl-tpl-h4-multi-03',
    skillId: 'psl-p3-list-multi', structure: null, heuristic: 'make-list',
    operations: ['multiplication'], difficulty: 2,
    contexts: [{ setting: 'common multiple', verb: 'is' }],
    constraints: { factorA: { options: [8, 10, 12] }, factorB: { options: [12, 15, 9] } },
    storyTemplate: 'Find the number between {lo} and {hi} that is a multiple of both {factorA} and {factorB}.',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this problem about?', correctIndex: 0, choices: [
        'Finding a common multiple in a range', 'Multiplying two numbers', 'Finding the largest multiple', 'Adding multiples',
      ]},
      identify_info: { type: 'highlight', expected: ['{lo}', '{hi}', '{factorA}', '{factorB}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The common multiple in the given range', 'The product of the two numbers', 'All multiples of {factorA}', 'The smallest multiple',
      ]},
      plan: { type: 'list_candidates', prompt: 'What conditions must the answer satisfy?', conditions: ['Between {lo} and {hi}', 'Multiple of {factorA}', 'Multiple of {factorB}'], showRange: true },
      solve: { type: 'list_check', prompt: 'List multiples of {factorA}, check which are also multiples of {factorB}.', conditions: ['Multiple of {factorA}', 'Multiple of {factorB}', 'In range {lo}–{hi}'], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Check: is {answer} ÷ {factorA} a whole number? Is {answer} ÷ {factorB} a whole number?' },
    },
    misconceptions: { solve: ['psl/missed-candidate'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  H5: GUESS AND CHECK — COINS (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-h5-coins-01',
    skillId: 'psl-p3-guess-coins', structure: null, heuristic: 'guess-check',
    operations: ['addition', 'multiplication'], difficulty: 1,
    contexts: [{ setting: 'piggy bank', verb: 'has' }],
    constraints: { tenCent: { min: 2, max: 6 }, fiveCent: { min: 2, max: 6 } },
    storyTemplate: 'A piggy bank holds only 10-cent and 5-cent coins — {totalCoins} coins worth {totalValue} cents in all. How many 10-cent coins are there?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this problem about?', correctIndex: 0, choices: [
        'Finding how many of each coin type there are', 'Counting total coins', 'Finding the value of one coin', 'Sharing coins equally',
      ]},
      identify_info: { type: 'highlight', expected: ['{totalCoins}', '{totalValue}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The number of 10-cent coins', 'The total value', 'The number of coins altogether', 'The value of one coin',
      ]},
      plan: { type: 'guess_setup', prompt: 'What conditions must your answer satisfy?', constraints: ['The total number of coins is {totalCoins}', 'The total value is {totalValue} cents'] },
      solve: { type: 'guess_table', prompt: 'Guess the number of 10¢ coins and check.', columns: ['10¢ coins', '5¢ coins', 'Total value'], maxGuesses: 5, answer: '{tenCent}' },
      check: { type: 'reasonableness', prompt: 'Check: {tenCent} ten-cent + {fiveCent} five-cent = {totalCoins} coins and {totalValue} cents?' },
    },
    misconceptions: { solve: ['psl/random-guess', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-h5-coins-02',
    skillId: 'psl-p3-guess-coins', structure: null, heuristic: 'guess-check',
    operations: ['addition', 'multiplication'], difficulty: 1,
    contexts: [{ setting: 'coin jar', verb: 'contains' }],
    constraints: { twentyCent: { min: 3, max: 8 }, tenCent: { min: 3, max: 8 } },
    storyTemplate: 'A jar {verb} 20-cent and 10-cent coins — {totalCoins} coins worth {totalValue} cents. How many 20-cent coins are there?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this problem about?', correctIndex: 0, choices: [
        'Finding the mix of two coin types', 'Adding up all the coins', 'Comparing two jars', 'Finding the biggest coin',
      ]},
      identify_info: { type: 'highlight', expected: ['{totalCoins}', '{totalValue}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The number of 20-cent coins', 'The total number of coins', 'The value of one coin', 'How many cents are left over',
      ]},
      plan: { type: 'guess_setup', prompt: 'What conditions must your answer satisfy?', constraints: ['The total number of coins is {totalCoins}', 'The total value is {totalValue} cents'] },
      solve: { type: 'guess_table', prompt: 'Guess the number of 20¢ coins and check.', columns: ['20¢ coins', '10¢ coins', 'Total value'], maxGuesses: 5, answer: '{twentyCent}' },
      check: { type: 'reasonableness', prompt: 'Verify: {twentyCent} × 20 + {tenCent} × 10 = {totalValue}?' },
    },
    misconceptions: { solve: ['psl/random-guess', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-h5-coins-03',
    skillId: 'psl-p3-guess-coins', structure: null, heuristic: 'guess-check',
    operations: ['addition', 'multiplication'], difficulty: 1,
    contexts: [{ setting: 'wallet', verb: 'has' }],
    constraints: { fiftyCent: { min: 2, max: 6 }, twentyCent: { min: 2, max: 8 } },
    storyTemplate: '{nameA} {verb} only 50-cent and 20-cent coins — {totalCoins} coins worth ${totalDollars} in total. How many 50-cent coins does {nameA} have?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this problem about?', correctIndex: 0, choices: [
        'Finding how many of each coin type', 'Counting all coins', 'Sharing money equally', 'Comparing coin sizes',
      ]},
      identify_info: { type: 'highlight', expected: ['{totalCoins}', '{totalDollars}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The number of 50-cent coins', 'The total amount of money', 'The number of 20-cent coins', 'How much each coin is worth',
      ]},
      plan: { type: 'guess_setup', prompt: 'What conditions must be satisfied?', constraints: ['Total coins = {totalCoins}', 'Total value = ${totalDollars}'] },
      solve: { type: 'guess_table', prompt: 'Guess the number of 50¢ coins and check.', columns: ['50¢ coins', '20¢ coins', 'Total value'], maxGuesses: 5, answer: '{fiftyCent}' },
      check: { type: 'reasonableness', prompt: 'Check: {fiftyCent} × 50¢ + {twentyCent} × 20¢ = ${totalDollars}?' },
    },
    misconceptions: { solve: ['psl/random-guess', 'psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  H5: GUESS AND CHECK — ANIMALS (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-h5-animals-01',
    skillId: 'psl-p3-guess-animals', structure: null, heuristic: 'guess-check',
    operations: ['addition', 'multiplication'], difficulty: 2,
    contexts: [{ setting: 'farm', verb: 'has' }],
    constraints: { chickens: { min: 4, max: 12 }, rabbits: { min: 3, max: 9 } },
    storyTemplate: 'A {setting} {verb} chickens and rabbits — {totalHeads} heads and {totalLegs} legs in all. How many rabbits are there?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this problem about?', correctIndex: 0, choices: [
        'Finding the number of each animal', 'Counting total animals', 'Comparing chickens and rabbits', 'Finding the number of legs on one animal',
      ]},
      identify_info: { type: 'highlight', expected: ['{totalHeads}', '{totalLegs}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The number of rabbits', 'The total number of legs', 'The total number of heads', 'The difference between chickens and rabbits',
      ]},
      plan: { type: 'guess_setup', prompt: 'What conditions must be satisfied?', constraints: ['Total heads (animals) = {totalHeads}', 'Total legs = {totalLegs} (chickens have 2, rabbits have 4)'] },
      solve: { type: 'guess_table', prompt: 'Guess the number of rabbits and check the leg count.', columns: ['Rabbits', 'Chickens', 'Total legs'], maxGuesses: 5, answer: '{rabbits}' },
      check: { type: 'reasonableness', prompt: 'Check: {rabbits} × 4 + {chickens} × 2 = {totalLegs} legs, and {rabbits} + {chickens} = {totalHeads} heads?' },
    },
    misconceptions: { solve: ['psl/random-guess', 'psl/forgot-constraint'] },
  },
  {
    templateId: 'psl-tpl-h5-animals-02',
    skillId: 'psl-p3-guess-animals', structure: null, heuristic: 'guess-check',
    operations: ['addition', 'multiplication'], difficulty: 2,
    contexts: [{ setting: 'pet shop', verb: 'has' }],
    constraints: { spiders: { min: 2, max: 6 }, beetles: { min: 3, max: 8 } },
    storyTemplate: 'A {setting} has spiders (8 legs) and beetles (6 legs). There are {totalCreatures} creatures with {totalLegs} legs in all. How many spiders are there?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this problem about?', correctIndex: 0, choices: [
        'Finding how many of each creature', 'Counting total legs', 'Comparing spider and beetle sizes', 'Finding how many legs one creature has',
      ]},
      identify_info: { type: 'highlight', expected: ['{totalCreatures}', '{totalLegs}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The number of spiders', 'The total number of creatures', 'The number of beetles', 'The number of legs on each',
      ]},
      plan: { type: 'guess_setup', prompt: 'What conditions must be satisfied?', constraints: ['Total creatures = {totalCreatures}', 'Total legs = {totalLegs} (spiders 8, beetles 6)'] },
      solve: { type: 'guess_table', prompt: 'Guess the number of spiders and check.', columns: ['Spiders', 'Beetles', 'Total legs'], maxGuesses: 5, answer: '{spiders}' },
      check: { type: 'reasonableness', prompt: 'Check: {spiders} × 8 + {beetles} × 6 = {totalLegs}?' },
    },
    misconceptions: { solve: ['psl/random-guess', 'psl/forgot-constraint'] },
  },
  {
    templateId: 'psl-tpl-h5-animals-03',
    skillId: 'psl-p3-guess-animals', structure: null, heuristic: 'guess-check',
    operations: ['addition', 'multiplication'], difficulty: 2,
    contexts: [{ setting: 'pond', verb: 'has' }],
    constraints: { ducks: { min: 3, max: 10 }, turtles: { min: 2, max: 8 } },
    storyTemplate: 'A {setting} {verb} ducks and turtles. There are {totalAnimals} animals. The ducks have {totalWings} wings in total (ducks have 2 wings; turtles have 0). How many turtles are there?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this problem about?', correctIndex: 0, choices: [
        'Finding how many of each animal', 'Counting wings', 'Comparing ducks and turtles', 'Finding the total number of animals',
      ]},
      identify_info: { type: 'highlight', expected: ['{totalAnimals}', '{totalWings}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The number of turtles', 'The number of ducks', 'The total wings', 'How many wings a duck has',
      ]},
      plan: { type: 'guess_setup', prompt: 'What conditions must be satisfied?', constraints: ['Total animals = {totalAnimals}', 'Total wings = {totalWings} (ducks 2, turtles 0)'] },
      solve: { type: 'guess_table', prompt: 'Guess the number of turtles and check.', columns: ['Turtles', 'Ducks', 'Total wings'], maxGuesses: 5, answer: '{turtles}' },
      check: { type: 'reasonableness', prompt: 'Check: {ducks} × 2 = {totalWings} wings, and {ducks} + {turtles} = {totalAnimals}?' },
    },
    misconceptions: { solve: ['psl/random-guess', 'psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  H6: WORKING BACKWARDS — TWO OPERATIONS (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-h6-twoOp-01',
    skillId: 'psl-p3-reverse-twoOp', structure: null, heuristic: 'work-backwards',
    operations: ['multiplication', 'addition'], difficulty: 1,
    contexts: [
      { setting: 'number puzzle', verb: 'thinks of' },
      { setting: 'classroom', verb: 'picks' },
    ],
    constraints: { original: { min: 3, max: 15 }, multiplier: { min: 2, max: 4 }, addend: { min: 5, max: 20 } },
    storyTemplate: '{nameA} {verb} a number, multiplies it by {multiplier}, then adds {addend}, and gets {result}. What was the original number?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding the starting number by undoing operations', 'Adding two numbers together', 'Comparing two quantities', 'Dividing into equal groups',
      ]},
      identify_info: { type: 'highlight', expected: ['{multiplier}', '{addend}', '{result}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The original number', 'The final result', 'The multiplier', 'The sum of two numbers',
      ]},
      plan: { type: 'reverse_steps', prompt: 'What operations do we need to reverse?', operations: ['Multiply by {multiplier}', 'Add {addend}'], finalResult: '{result}' },
      solve: { type: 'reverse_chain', prompt: 'Work backwards from {result} to find the original number.', steps: ['{step1}'], answer: '{original}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable? Multiply it by {multiplier} and add {addend} — do you get {result}?' },
    },
    misconceptions: { plan: ['psl/wrong-step-order'], solve: ['psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-h6-twoOp-02',
    skillId: 'psl-p3-reverse-twoOp', structure: null, heuristic: 'work-backwards',
    operations: ['addition', 'subtraction'], difficulty: 1,
    contexts: [
      { setting: 'savings', verb: 'had' },
      { setting: 'sticker collection', verb: 'had' },
    ],
    constraints: { original: { min: 20, max: 100 }, addend: { min: 10, max: 50 }, subtrahend: { min: 5, max: 30 } },
    storyTemplate: '{nameA} {verb} some {entityA}. After receiving {addend} more and then giving away {subtrahend}, {nameA} had {result} left. How many did {nameA} start with?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding what someone started with by undoing changes', 'Finding the total of two groups', 'Comparing two people\'s amounts', 'Sharing equally',
      ]},
      identify_info: { type: 'highlight', expected: ['{addend}', '{subtrahend}', '{result}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many {nameA} started with', 'How many were given away', 'The total received', 'How many are left',
      ]},
      plan: { type: 'reverse_steps', prompt: 'What operations do we need to reverse?', operations: ['Add {addend}', 'Subtract {subtrahend}'], finalResult: '{result}' },
      solve: { type: 'reverse_chain', prompt: 'Work backwards from {result}.', steps: ['{step1}'], answer: '{original}' },
      check: { type: 'reasonableness', prompt: 'Check: {original} + {addend} − {subtrahend} = {result}?' },
    },
    misconceptions: { plan: ['psl/wrong-step-order'], solve: ['psl/wrong-reverse'] },
  },
  {
    templateId: 'psl-tpl-h6-twoOp-03',
    skillId: 'psl-p3-reverse-twoOp', structure: null, heuristic: 'work-backwards',
    operations: ['multiplication', 'subtraction'], difficulty: 1,
    contexts: [
      { setting: 'bakery', verb: 'baked' },
      { setting: 'farm', verb: 'picked' },
    ],
    constraints: { original: { min: 5, max: 20 }, multiplier: { min: 2, max: 5 }, subtrahend: { min: 3, max: 15 } },
    storyTemplate: 'A {setting} had some {entityA}. They tripled the amount, then {subtrahend} were sold. Now there are {result}. How many were there at the start?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding the starting amount by undoing steps', 'Finding the total after tripling', 'Comparing amounts before and after', 'Dividing equally',
      ]},
      identify_info: { type: 'highlight', expected: ['{subtrahend}', '{result}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The number at the start', 'The number that were sold', 'The final total', 'How many times it was multiplied',
      ]},
      plan: { type: 'reverse_steps', prompt: 'What operations do we need to reverse?', operations: ['Multiply by 3', 'Subtract {subtrahend}'], finalResult: '{result}' },
      solve: { type: 'reverse_chain', prompt: 'Work backwards from {result}.', steps: ['{step1}'], answer: '{original}' },
      check: { type: 'reasonableness', prompt: 'Check: {original} × 3 − {subtrahend} = {result}?' },
    },
    misconceptions: { solve: ['psl/arithmetic-error', 'psl/wrong-reverse'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  H6: WORKING BACKWARDS — THREE OPERATIONS (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-h6-threeOp-01',
    skillId: 'psl-p3-reverse-threeOp', structure: null, heuristic: 'work-backwards',
    operations: ['addition', 'multiplication', 'subtraction'], difficulty: 2,
    contexts: [
      { setting: 'number puzzle', verb: 'thinks of' },
    ],
    constraints: { original: { min: 3, max: 12 }, addend: { min: 2, max: 10 }, multiplier: { min: 2, max: 3 }, subtrahend: { min: 2, max: 10 } },
    storyTemplate: '{nameA} {verb} a number, adds {addend}, multiplies by {multiplier}, then subtracts {subtrahend}. The result is {result}. What was the number?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Reversing three operations to find the starting number', 'Adding three numbers', 'Finding the average', 'Comparing results',
      ]},
      identify_info: { type: 'highlight', expected: ['{addend}', '{multiplier}', '{subtrahend}', '{result}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The original number', 'The sum of operations', 'The multiplier', 'The final result',
      ]},
      plan: { type: 'reverse_steps', prompt: 'List the three operations to reverse.', operations: ['Add {addend}', 'Multiply by {multiplier}', 'Subtract {subtrahend}'], finalResult: '{result}' },
      solve: { type: 'reverse_chain', prompt: 'Work backwards from {result}.', steps: ['{step1}', '{step2}'], answer: '{original}' },
      check: { type: 'reasonableness', prompt: 'Check: ({original} + {addend}) × {multiplier} − {subtrahend} = {result}?' },
    },
    misconceptions: { plan: ['psl/wrong-step-order'], solve: ['psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-h6-threeOp-02',
    skillId: 'psl-p3-reverse-threeOp', structure: null, heuristic: 'work-backwards',
    operations: ['subtraction', 'multiplication', 'addition'], difficulty: 2,
    contexts: [
      { setting: 'pocket money', verb: 'had' },
    ],
    constraints: { original: { min: 20, max: 80 }, subtrahend: { min: 5, max: 15 }, multiplier: { min: 2, max: 3 }, addend: { min: 10, max: 30 } },
    storyTemplate: '{nameA} {verb} some money. After spending ${subtrahend}, doubling what was left, and receiving ${addend} more, {nameA} had ${result}. How much did {nameA} start with?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding the starting amount by reversing money changes', 'Adding up all spending', 'Comparing pocket money', 'Sharing money equally',
      ]},
      identify_info: { type: 'highlight', expected: ['{subtrahend}', '{addend}', '{result}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How much {nameA} started with', 'How much was spent', 'The total received', 'How much is left',
      ]},
      plan: { type: 'reverse_steps', prompt: 'List the operations to reverse.', operations: ['Subtract {subtrahend}', 'Multiply by 2', 'Add {addend}'], finalResult: '{result}' },
      solve: { type: 'reverse_chain', prompt: 'Work backwards from {result}.', steps: ['{step1}', '{step2}'], answer: '{original}' },
      check: { type: 'reasonableness', prompt: 'Check: ({original} − {subtrahend}) × 2 + {addend} = {result}?' },
    },
    misconceptions: { solve: ['psl/wrong-reverse', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-h6-threeOp-03',
    skillId: 'psl-p3-reverse-threeOp', structure: null, heuristic: 'work-backwards',
    operations: ['multiplication', 'addition', 'subtraction'], difficulty: 2,
    contexts: [
      { setting: 'game', verb: 'started with' },
    ],
    constraints: { original: { min: 4, max: 15 }, multiplier: { min: 2, max: 4 }, addend: { min: 5, max: 20 }, subtrahend: { min: 3, max: 12 } },
    storyTemplate: '{nameA} {verb} some points. After multiplying by {multiplier}, earning {addend} bonus points, and losing {subtrahend} points, {nameA} ended with {result} points. How many points did {nameA} start with?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Finding starting points by undoing changes', 'Adding up all the points', 'Comparing scores', 'Splitting points between players',
      ]},
      identify_info: { type: 'highlight', expected: ['{multiplier}', '{addend}', '{subtrahend}', '{result}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'How many points {nameA} started with', 'The total bonus points', 'How many points were lost', 'The final score',
      ]},
      plan: { type: 'reverse_steps', prompt: 'List the operations to reverse.', operations: ['Multiply by {multiplier}', 'Add {addend}', 'Subtract {subtrahend}'], finalResult: '{result}' },
      solve: { type: 'reverse_chain', prompt: 'Work backwards from {result}.', steps: ['{step1}', '{step2}'], answer: '{original}' },
      check: { type: 'reasonableness', prompt: 'Check: {original} × {multiplier} + {addend} − {subtrahend} = {result}?' },
    },
    misconceptions: { plan: ['psl/wrong-step-order'], solve: ['psl/arithmetic-error'] },
  },
];

// ════════════════════════════════════════════════════════════════════════════
//  P4 HEURISTIC TEMPLATES
//  Derived from real Singapore P4 exam papers (Catholic High, Nanyang,
//  Henry Park, Raffles). These questions require bar-model, substitution,
//  or simultaneous-change heuristics — not straightforward multi-step drill.
// ════════════════════════════════════════════════════════════════════════════

function compMultScaffold(understandChoices, questionChoices, unknownPos) {
  return {
    understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: understandChoices },
    identify_info: { type: 'highlight', expected: ['{relationship}', '{knownTotal}'] },
    identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: questionChoices },
    plan: { type: 'model', modelType: 'comparisonMultiples', unknownPosition: unknownPos },
    solve: { type: 'twoStep', steps: [
      { operation: 'division', expression: '{knownTotal} ÷ {totalUnits}', label: 'Find 1 unit' },
      { operation: 'multiplication', expression: '{oneUnit} × {targetUnits}', label: 'Find the answer' },
    ], answer: '{answer}' },
    check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
  };
}

const P4_TEMPLATES = [

  // ══════════════════════════════════════════════════════════════════════
  //  COMPARISON WITH MULTIPLES — "n times as many" problems
  // ══════════════════════════════════════════════════════════════════════

  {
    templateId: 'psl-tpl-p4-comp-mult-01',
    skillId: 'psl-p4-bar-comp-multiples', level: 'P4',
    structure: 'comparisonMultiples', unknownPosition: 'both',
    operations: ['division', 'multiplication'], difficulty: 2,
    contexts: [
      { setting: 'stickers', entityA: 'stickers', verb: 'has', relationship: '{multiple} times as many as' },
      { setting: 'marbles', entityA: 'marbles', verb: 'collected', relationship: '{multiple} times as many as' },
    ],
    constraints: { multiple: { min: 2, max: 5 }, difference: { min: 50, max: 500 }, answer: { max: 2000 } },
    storyTemplate: 'The difference between two numbers is {difference}. One number is {multiple} times the other. Find the sum of the two numbers.',
    scaffold: compMultScaffold(
      ['Using a multiple relationship and the difference to find both numbers', 'Just dividing a number by a multiple', 'Adding two given numbers', 'Subtracting to find a remainder'],
      ['The sum of the two numbers', 'Only the larger number', 'The difference between them', 'The product of the two numbers'],
      'both',
    ),
    misconceptions: { plan: ['psl/wrong-unit-count'], solve: ['psl/confuses-sum-and-difference', 'psl/arithmetic-error'] },
  },

  {
    templateId: 'psl-tpl-p4-comp-mult-02',
    skillId: 'psl-p4-bar-comp-multiples', level: 'P4',
    structure: 'comparisonMultiples', unknownPosition: 'both',
    operations: ['division', 'multiplication', 'addition'], difficulty: 2,
    contexts: [
      { setting: 'apples', entityA: 'apples', entityB: 'apples', verb: 'has' },
      { setting: 'stickers', entityA: 'stickers', entityB: 'stickers', verb: 'collected' },
    ],
    constraints: { multiple: { min: 2, max: 4 }, extra: { min: 5, max: 50 }, total: { min: 100, max: 500 } },
    storyTemplate: '{nameA} has {extra} more {entityA} than {nameB}. {nameC} has {multiple} times as many {entityA} as {nameB}. {nameA} and {nameC} have {total} {entityA} altogether. How many {entityA} does {nameB} have?',
    scaffold: compMultScaffold(
      ['Using "more than" and "times as many" together to find a base quantity', 'Just adding all the numbers', 'Dividing the total equally among three people', 'Subtracting the extra from the total'],
      ['How many {entityA} {nameB} has', 'The total for all three people', 'How many more {nameC} has than {nameA}', 'How many {nameA} gave away'],
      'unit',
    ),
    misconceptions: { plan: ['psl/wrong-unit-count', 'psl/forgets-extra'], solve: ['psl/arithmetic-error'] },
  },

  {
    templateId: 'psl-tpl-p4-comp-mult-03',
    skillId: 'psl-p4-bar-comp-multiples', level: 'P4',
    structure: 'comparisonMultiples', unknownPosition: 'both',
    operations: ['division', 'multiplication'], difficulty: 3,
    contexts: [
      { setting: 'shop', entityA: 'items', verb: 'has' },
      { setting: 'farm', entityA: 'animals', verb: 'has' },
    ],
    constraints: { multipleAB: { min: 2, max: 3 }, multipleAC: { min: 2, max: 2 }, total: { min: 100, max: 600 } },
    storyTemplate: '{nameA} has {multipleAB} times as many {entityA} as {nameB}. {nameA} has {multipleAC} times as many {entityA} as {nameC}. They have {total} {entityA} altogether. How many {entityA} does {nameC} have?',
    scaffold: compMultScaffold(
      ['Expressing all quantities in terms of one person, then using the total', 'Adding the multiples together', 'Dividing the total by 3', 'Comparing only two people'],
      ['How many {entityA} {nameC} has', 'The total for {nameA} and {nameB}', 'How many more {nameA} has than {nameB}', 'The product of all three amounts'],
      'unit',
    ),
    misconceptions: { plan: ['psl/wrong-unit-count'], solve: ['psl/confuses-which-person', 'psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  SUBSTITUTION — replace one item with an equivalent
  // ══════════════════════════════════════════════════════════════════════

  {
    templateId: 'psl-tpl-p4-subst-01',
    skillId: 'psl-p4-substitution', level: 'P4',
    structure: 'substitution', unknownPosition: 'unit',
    operations: ['division'], difficulty: 2,
    contexts: [
      { setting: 'stationery', entityA: 'pen', entityB: 'eraser', verb: 'costs', relationship: '1 {entityA} costs as much as {multiple} {entityB}s' },
      { setting: 'bakery', entityA: 'cake', entityB: 'muffin', verb: 'costs', relationship: '1 {entityA} costs as much as {multiple} {entityB}s' },
    ],
    constraints: { multiple: { min: 3, max: 6 }, countA: { min: 1, max: 3 }, countB: { min: 1, max: 5 }, totalCost: { min: 3, max: 30 } },
    storyTemplate: '1 {entityA} costs as much as {multiple} {entityB}s. {nameA} paid ${totalCost} for {countA} {entityA} and {countB} {entityB}s. Find the cost of 1 {entityB}.',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Replacing one item type with its equivalent to find a unit price', 'Adding prices of different items', 'Finding change from a purchase', 'Comparing which item is more expensive',
      ]},
      identify_info: { type: 'highlight', expected: ['{relationship}', '{totalCost}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The cost of 1 {entityB}', 'The cost of 1 {entityA}', 'The total cost', 'How many items were bought',
      ]},
      plan: { type: 'model', modelType: 'substitution', unknownPosition: 'unit' },
      solve: { type: 'twoStep', steps: [
        { operation: 'substitution', expression: '{countA} {entityA} = {countA} × {multiple} {entityB}s = {equivalentB} {entityB}s', label: 'Replace {entityA}s with {entityB}s' },
        { operation: 'division', expression: '${totalCost} ÷ {totalEquivB}', label: 'Find cost of 1 {entityB}' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-substitution', 'psl/forgets-to-substitute'], solve: ['psl/arithmetic-error'] },
  },

  {
    templateId: 'psl-tpl-p4-subst-02',
    skillId: 'psl-p4-substitution', level: 'P4',
    structure: 'substitution', unknownPosition: 'unit',
    operations: ['division'], difficulty: 2,
    contexts: [
      { setting: 'food court', entityA: 'bowl of noodles', entityB: 'drink', verb: 'costs' },
      { setting: 'canteen', entityA: 'set meal', entityB: 'drink', verb: 'costs' },
    ],
    constraints: { multiple: { min: 2, max: 5 }, totalCost: { min: 5, max: 25 } },
    storyTemplate: '1 {entityA} costs as much as {multiple} {entityB}s. {nameA} bought 2 {entityA}s and 1 {entityB}. He paid ${totalCost} altogether. What is the cost of 1 {entityB}?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Converting one item into equivalent units of another to find the unit price', 'Adding the cost of different items', 'Finding change after a purchase', 'Comparing the prices of two food items',
      ]},
      identify_info: { type: 'highlight', expected: ['{multiple}', '{totalCost}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The cost of 1 {entityB}', 'The cost of 1 {entityA}', 'How much {nameA} spent', 'How many items were bought',
      ]},
      plan: { type: 'model', modelType: 'substitution', unknownPosition: 'unit' },
      solve: { type: 'twoStep', steps: [
        { operation: 'substitution', expression: '2 {entityA}s = 2 × {multiple} = {equivalentB} {entityB}s', label: 'Replace {entityA}s' },
        { operation: 'division', expression: '${totalCost} ÷ {totalEquivB}', label: 'Find cost of 1 {entityB}' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-substitution'], solve: ['psl/divides-by-wrong-count'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  SIMULTANEOUS CHANGE — eliminate a common unknown
  // ══════════════════════════════════════════════════════════════════════

  {
    templateId: 'psl-tpl-p4-simul-01',
    skillId: 'psl-p4-simultaneous', level: 'P4',
    structure: 'simultaneousChange', unknownPosition: 'unit',
    operations: ['subtraction', 'division'], difficulty: 3,
    contexts: [
      { setting: 'mass', entityA: 'box', entityB: 'ball', unitLabel: 'kg' },
      { setting: 'cost', entityA: 'basket', entityB: 'fruit', unitLabel: '$' },
    ],
    constraints: { countB1: { min: 3, max: 6 }, countB2: { min: 1, max: 4 }, total1: { min: 2, max: 15 }, total2: { min: 1, max: 10 } },
    storyTemplate: 'The total mass of 1 {entityA} and {countB1} {entityB}s is {total1} {unitLabel}. The total mass of 1 {entityA} and {countB2} {entityB}s is {total2} {unitLabel}. What is the mass of 1 {entityB}?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Two facts share a common unknown — subtracting removes it', 'Adding both totals together', 'Dividing the total mass equally', 'Finding the mass of the {entityA} first',
      ]},
      identify_info: { type: 'highlight', expected: ['{total1}', '{total2}', '{countB1}', '{countB2}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The mass of 1 {entityB}', 'The mass of the {entityA}', 'The total mass of all items', 'How many {entityB}s there are',
      ]},
      plan: { type: 'model', modelType: 'simultaneousChange', unknownPosition: 'unit' },
      solve: { type: 'twoStep', steps: [
        { operation: 'subtraction', expression: '{total1} − {total2} = mass of {diffB} {entityB}s', label: 'Eliminate the {entityA}' },
        { operation: 'division', expression: '{massDiff} ÷ {diffB}', label: 'Find mass of 1 {entityB}' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/subtracts-wrong-pair'], solve: ['psl/divides-by-wrong-count', 'psl/arithmetic-error'] },
  },

  {
    templateId: 'psl-tpl-p4-simul-02',
    skillId: 'psl-p4-simultaneous', level: 'P4',
    structure: 'simultaneousChange', unknownPosition: 'unit',
    operations: ['subtraction', 'division'], difficulty: 3,
    contexts: [
      { setting: 'pricing', entityA: 'dress', entityB: 'skirt', unitLabel: '$' },
      { setting: 'weight', entityA: 'bag', entityB: 'book', unitLabel: 'kg' },
    ],
    constraints: { countA1: { min: 1, max: 1 }, countB1: { min: 2, max: 4 }, total1: { min: 100, max: 400 }, extra: { min: 20, max: 100 } },
    storyTemplate: '{nameA} bought 1 {entityA} and {countB1} {entityB}s for ${total1}. The {entityA} cost ${extra} more than a {entityB}. How much was the cost of 1 {entityB}?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: [
        'Replacing the {entityA} with its equivalent in {entityB}s plus the extra', 'Just dividing the total by the number of items', 'Subtracting the extra from the total', 'Adding the extra to find the {entityA} cost',
      ]},
      identify_info: { type: 'highlight', expected: ['{total1}', '{extra}', '{countB1}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: [
        'The cost of 1 {entityB}', 'The cost of the {entityA}', 'How many items were bought', 'The total cost for all items',
      ]},
      plan: { type: 'model', modelType: 'simultaneousChange', unknownPosition: 'unit' },
      solve: { type: 'twoStep', steps: [
        { operation: 'subtraction', expression: '${total1} − ${extra} = cost of {totalEquivB} {entityB}s', label: 'Remove the extra' },
        { operation: 'division', expression: '{remaining} ÷ {totalEquivB}', label: 'Find cost of 1 {entityB}' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { plan: ['psl/wrong-substitution'], solve: ['psl/divides-by-wrong-count', 'psl/arithmetic-error'] },
  },
];

async function seed() {
  await connectDB();
  const ALL_TEMPLATES = [...TEMPLATES, ...P4_TEMPLATES];
  let upserted = 0;
  for (const tpl of ALL_TEMPLATES) {
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
