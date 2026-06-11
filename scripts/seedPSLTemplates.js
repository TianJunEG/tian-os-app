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
