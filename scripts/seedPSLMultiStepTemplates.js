import dotenv from 'dotenv';
dotenv.config();

if (process.env.NODE_ENV === "production") {
  console.error("Seed script: refusing to run in production (NODE_ENV=production).");
  process.exit(1);
}
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLProblemTemplate from '../models/psl/PSLProblemTemplate.js';

const NAMES = ['Wei Ling', 'Jun Hao', 'Ravi', 'Siti', 'Mei Xin', 'Arun', 'Farah', 'Zhi Hao', 'Priya', 'Ahmad'];

// Helper: multi-step scaffold (strategy-select plan, twoStep solve)
function msScaffold(understandChoices, questionChoices, highlightExpected, solveSteps, answer) {
  return {
    understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: understandChoices },
    identify_info: { type: 'highlight', expected: highlightExpected },
    identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: questionChoices },
    plan: { type: 'strategySelect', prompt: 'What strategy should we use?', correctIndex: 0,
      choices: ['Break into smaller steps', 'Draw a bar model', 'Work backwards', 'Guess and check'] },
    solve: { type: 'twoStep', steps: solveSteps, answer },
    check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
  };
}

const TEMPLATES = [
  // ══════════════════════════════════════════════════════════════════════
  //  P3 MULTI-STEP: TWO-OP ADD/SUB  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-ms-addsub-01',
    skillId: 'psl-p3-ms-two-op-add-sub', structure: 'multiStep', heuristic: 'multi-step',
    operations: ['addition', 'subtraction'], difficulty: 2,
    contexts: [
      { setting: 'school canteen', entityA: 'curry puffs', entityB: 'spring rolls', verb: 'bought' },
      { setting: 'hawker centre', entityA: 'satay sticks', entityB: 'otah', verb: 'ordered' },
    ],
    constraints: { valA: { min: 50, max: 200 }, valB: { min: 20, max: 80 }, valC: { min: 10, max: 50 } },
    storyTemplate: '{nameA} {verb} {valA} {entityA} and {valB} {entityB} from the {setting}. {nameA} then gave {valC} {entityA} to {nameB}. How many items did {nameA} have left?',
    solutionTemplate: 'Step 1: Find the total items bought: {valA} + {valB} = {{mid}}.\nStep 2: Subtract the items given away: {{mid}} − {valC} = {{answer}}.\nAnswer: {{answer}} items.',
    scaffold: msScaffold(
      ['Buying items and giving some away', 'Sharing items equally among friends', 'Comparing two amounts', 'Finding a pattern in numbers'],
      ['How many items {nameA} had left', 'How many items {nameB} received', 'The cost of the items', 'How many {entityA} were left'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'addition', expression: '{valA} + {valB}', label: 'Find total items bought' },
        { operation: 'subtraction', expression: '({valA} + {valB}) - {valC}', label: 'Subtract items given away' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/wrong-operation'] },
  },
  {
    templateId: 'psl-tpl-ms-addsub-02',
    skillId: 'psl-p3-ms-two-op-add-sub', structure: 'multiStep', heuristic: 'multi-step',
    operations: ['addition', 'subtraction'], difficulty: 2,
    contexts: [
      { setting: 'bookshop', entityA: 'English books', entityB: 'Chinese books', verb: 'bought' },
      { setting: 'market', entityA: 'red pencils', entityB: 'blue pencils', verb: 'packed' },
    ],
    constraints: { valA: { min: 50, max: 200 }, valB: { min: 20, max: 80 }, valC: { min: 10, max: 50 } },
    storyTemplate: '{nameA} had ${valA} and ${valB}. {nameA} paid ${valC} for some {entityA} at the {setting}. How much money did {nameA} have left?',
    solutionTemplate: 'Step 1: Find the total money: ${valA} + ${valB} = ${{mid}}.\nStep 2: Subtract the amount spent: ${{mid}} − ${valC} = ${{answer}}.\nAnswer: ${{answer}}.',
    scaffold: msScaffold(
      ['Earning money and spending some', 'Splitting money between friends', 'Saving money over time', 'Comparing prices of items'],
      ['How much money {nameA} had left', 'The price of each item', 'How many items {nameA} bought', 'The change {nameA} received'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'addition', expression: '{valA} + {valB}', label: 'Find total money' },
        { operation: 'subtraction', expression: '({valA} + {valB}) - {valC}', label: 'Subtract amount spent' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-ms-addsub-03',
    skillId: 'psl-p3-ms-two-op-add-sub', structure: 'multiStep', heuristic: 'multi-step',
    operations: ['subtraction', 'addition'], difficulty: 2,
    contexts: [
      { setting: 'MRT station', entityA: 'passengers on the first train', entityB: 'passengers on the second train', verb: 'counted' },
      { setting: 'community centre', entityA: 'boys', entityB: 'girls', verb: 'registered' },
    ],
    constraints: { valA: { min: 50, max: 200 }, valB: { min: 20, max: 80 }, valC: { min: 10, max: 50 } },
    storyTemplate: 'There were {valA} people at the {setting}. {valB} people left. Then {valC} more people arrived. How many people were at the {setting} in the end?',
    solutionTemplate: 'Step 1: Subtract the people who left: {valA} − {valB} = {{mid}}.\nStep 2: Add the people who arrived: {{mid}} + {valC} = {{answer}}.\nAnswer: {{answer}} people.',
    scaffold: msScaffold(
      ['People arriving and leaving a place', 'Comparing groups of people', 'Sharing seats equally', 'Finding the cost per person'],
      ['How many people were there in the end', 'How many people left altogether', 'The difference between arrivals and departures', 'How many seats were empty'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'subtraction', expression: '{valA} - {valB}', label: 'Subtract people who left' },
        { operation: 'addition', expression: '({valA} - {valB}) + {valC}', label: 'Add people who arrived' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/wrong-operation'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P3 MULTI-STEP: TWO-OP MUL/ADD  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-ms-muladd-01',
    skillId: 'psl-p3-ms-two-op-mul-add', structure: 'multiStep', heuristic: 'multi-step',
    operations: ['multiplication', 'addition'], difficulty: 2,
    contexts: [
      { setting: 'school', entityA: 'sticker sheets', entityB: 'extra stickers', verb: 'prepared' },
      { setting: 'bakery', entityA: 'trays of cookies', entityB: 'loose cookies', verb: 'baked' },
    ],
    constraints: { groups: { min: 3, max: 8 }, perGroup: { min: 5, max: 12 }, valC: { min: 10, max: 30 } },
    storyTemplate: '{nameA} {verb} {groups} {entityA} with {perGroup} items on each one. {nameA} also had {valC} {entityB}. How many items did {nameA} have altogether?',
    solutionTemplate: 'Step 1: Find items in groups: {groups} × {perGroup} = {{mid}}.\nStep 2: Add the extras: {{mid}} + {valC} = {{answer}}.\nAnswer: {{answer}} items.',
    scaffold: msScaffold(
      ['Finding total from equal groups plus extras', 'Sharing items into equal rows', 'Comparing two collections', 'Taking away items from a group'],
      ['The total number of items', 'How many items in each group', 'The number of groups', 'How many extras were added'],
      ['{groups}', '{perGroup}', '{valC}'],
      [
        { operation: 'multiplication', expression: '{groups} × {perGroup}', label: 'Find items in groups' },
        { operation: 'addition', expression: '({groups} × {perGroup}) + {valC}', label: 'Add the extras' },
      ],
      '{answer}',
    ),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/wrong-operation'] },
  },
  {
    templateId: 'psl-tpl-ms-muladd-02',
    skillId: 'psl-p3-ms-two-op-mul-add', structure: 'multiStep', heuristic: 'multi-step',
    operations: ['multiplication', 'addition'], difficulty: 2,
    contexts: [
      { setting: 'bubble tea shop', entityA: 'packs of cups', entityB: 'sample cups', verb: 'ordered' },
      { setting: 'sports day', entityA: 'teams', entityB: 'reserve players', verb: 'organised' },
    ],
    constraints: { groups: { min: 3, max: 8 }, perGroup: { min: 5, max: 12 }, valC: { min: 10, max: 30 } },
    storyTemplate: 'The {setting} {verb} {groups} {entityA} with {perGroup} in each pack. There were also {valC} {entityB}. How many cups were there in total?',
    solutionTemplate: 'Step 1: Find items in packs: {groups} × {perGroup} = {{mid}}.\nStep 2: Add the extras: {{mid}} + {valC} = {{answer}}.\nAnswer: {{answer}}.',
    scaffold: msScaffold(
      ['Counting items in equal packs plus extras', 'Dividing items into groups', 'Taking away some items', 'Finding the difference between groups'],
      ['The total number of cups', 'How many packs were ordered', 'The number in each pack', 'How many were leftover'],
      ['{groups}', '{perGroup}', '{valC}'],
      [
        { operation: 'multiplication', expression: '{groups} × {perGroup}', label: 'Find items in packs' },
        { operation: 'addition', expression: '({groups} × {perGroup}) + {valC}', label: 'Add sample cups' },
      ],
      '{answer}',
    ),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-ms-muladd-03',
    skillId: 'psl-p3-ms-two-op-mul-add', structure: 'multiStep', heuristic: 'multi-step',
    operations: ['multiplication', 'addition'], difficulty: 2,
    contexts: [
      { setting: 'library', entityA: 'shelves of books', entityB: 'books on the table', verb: 'arranged' },
      { setting: 'art room', entityA: 'boxes of crayons', entityB: 'loose crayons', verb: 'counted' },
    ],
    constraints: { groups: { min: 3, max: 8 }, perGroup: { min: 5, max: 12 }, valC: { min: 10, max: 30 } },
    storyTemplate: 'The {setting} had {groups} {entityA} with {perGroup} items on each. There were {valC} more {entityB} on the side. How many items were there altogether?',
    solutionTemplate: 'Step 1: Find items on shelves: {groups} × {perGroup} = {{mid}}.\nStep 2: Add the extra items: {{mid}} + {valC} = {{answer}}.\nAnswer: {{answer}} items.',
    scaffold: msScaffold(
      ['Counting items on shelves plus leftover ones', 'Removing items from shelves', 'Dividing items equally', 'Comparing shelf sizes'],
      ['The total number of items', 'How many items per shelf', 'The number of shelves', 'How many items to remove'],
      ['{groups}', '{perGroup}', '{valC}'],
      [
        { operation: 'multiplication', expression: '{groups} × {perGroup}', label: 'Find items on shelves' },
        { operation: 'addition', expression: '({groups} × {perGroup}) + {valC}', label: 'Add the extra items' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P4 MULTI-STEP: THREE-OP  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-ms-threeop-01',
    skillId: 'psl-p4-ms-three-op', structure: 'multiStep', heuristic: 'multi-step',
    operations: ['multiplication', 'addition', 'subtraction'], difficulty: 3,
    contexts: [
      { setting: 'canteen', entityA: 'packets of nasi lemak', entityB: 'extra chilli packets', verb: 'prepared', priceWord: 'each' },
      { setting: 'school bookshop', entityA: 'notebooks', entityB: 'erasers', verb: 'bought', priceWord: 'each' },
    ],
    constraints: { valA: { min: 20, max: 100 }, valB: { min: 5, max: 20 }, valC: { min: 3, max: 10 } },
    storyTemplate: '{nameA} had {valA} stickers. {nameA} bought {valB} more packs of {valC} stickers each from the {setting}. {nameA} then gave 15 stickers to {nameB}. How many stickers did {nameA} have in the end?',
    solutionTemplate: 'Step 1: Find stickers from packs: {valB} × {valC} = {{mid}}.\nStep 2: Add to starting amount: {valA} + {{mid}} = {{mid2}}.\nStep 3: Subtract stickers given away: {{mid2}} − 15 = {{answer}}.\nAnswer: {{answer}} stickers.',
    scaffold: msScaffold(
      ['Starting with some, buying more in packs, then giving away', 'Sharing stickers equally', 'Comparing two collections of stickers', 'Sorting stickers into groups'],
      ['How many stickers {nameA} had in the end', 'How many stickers {nameB} received', 'The cost of the sticker packs', 'How many packs were bought'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'multiplication', expression: '{valB} × {valC}', label: 'Find stickers from packs' },
        { operation: 'addition', expression: '{valA} + ({valB} × {valC}) - 15', label: 'Add to starting amount, subtract given away' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/wrong-operation'] },
  },
  {
    templateId: 'psl-tpl-ms-threeop-02',
    skillId: 'psl-p4-ms-three-op', structure: 'multiStep', heuristic: 'multi-step',
    operations: ['addition', 'multiplication', 'subtraction'], difficulty: 3,
    contexts: [
      { setting: 'mama shop', entityA: 'sweets', entityB: 'biscuit packets', verb: 'bought' },
      { setting: 'NTUC FairPrice', entityA: 'cans of drink', entityB: 'bags of chips', verb: 'bought' },
    ],
    constraints: { valA: { min: 20, max: 100 }, valB: { min: 5, max: 20 }, valC: { min: 3, max: 10 } },
    storyTemplate: '{nameA} bought {valA} {entityA} and {valB} {entityB} with {valC} items in each packet from the {setting}. {nameA} ate 8 {entityA}. How many items did {nameA} have left?',
    solutionTemplate: 'Step 1: Find items from packets: {valB} × {valC} = {{mid}}.\nStep 2: Add all items together: {valA} + {{mid}} = {{mid2}}.\nStep 3: Subtract the ones eaten: {{mid2}} − 8 = {{answer}}.\nAnswer: {{answer}} items.',
    scaffold: msScaffold(
      ['Buying loose items and packs, then eating some', 'Comparing prices at the shop', 'Sharing snacks with friends', 'Finding the cost of all items'],
      ['How many items {nameA} had left', 'How much {nameA} paid', 'How many items were in packs', 'How many {entityA} were eaten'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'multiplication', expression: '{valB} × {valC}', label: 'Find items from packets' },
        { operation: 'subtraction', expression: '{valA} + ({valB} × {valC}) - 8', label: 'Add all items, subtract eaten ones' },
      ],
      '{answer}',
    ),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/wrong-operation'] },
  },
  {
    templateId: 'psl-tpl-ms-threeop-03',
    skillId: 'psl-p4-ms-three-op', structure: 'multiStep', heuristic: 'multi-step',
    operations: ['subtraction', 'multiplication', 'addition'], difficulty: 3,
    contexts: [
      { setting: 'kopitiam', entityA: 'kaya toasts', entityB: 'cups of kopi', verb: 'ordered' },
      { setting: 'food court', entityA: 'plates of char kway teow', entityB: 'bowls of laksa', verb: 'served' },
    ],
    constraints: { valA: { min: 20, max: 100 }, valB: { min: 5, max: 20 }, valC: { min: 3, max: 10 } },
    storyTemplate: 'A {setting} started with {valA} {entityA}. It sold {valB} in the morning. In the afternoon, it prepared {valC} more batches of 6 {entityA} each. How many {entityA} were there at the end of the day?',
    solutionTemplate: 'Step 1: Subtract morning sales: {valA} − {valB} = {{mid}}.\nStep 2: Find afternoon batches: {valC} × 6 = {{mid2}}.\nStep 3: Add afternoon batches to remaining: {{mid}} + {{mid2}} = {{answer}}.\nAnswer: {{answer}}.',
    scaffold: msScaffold(
      ['Starting amount, selling some, then making more in batches', 'Comparing morning and afternoon sales', 'Sharing food among customers', 'Finding the cost per batch'],
      ['How many {entityA} at the end of the day', 'How many were sold', 'How many batches were made', 'The total number of customers'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'subtraction', expression: '{valA} - {valB}', label: 'Subtract morning sales' },
        { operation: 'addition', expression: '({valA} - {valB}) + ({valC} × 6)', label: 'Add afternoon batches' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P4 MULTI-STEP: MONEY  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-ms-money-01',
    skillId: 'psl-p4-ms-money', structure: 'multiStep', heuristic: 'multi-step',
    operations: ['multiplication', 'subtraction'], difficulty: 3,
    contexts: [
      { setting: 'Popular bookshop', entityA: 'pens', entityB: 'highlighters', verb: 'bought' },
      { setting: 'school supplies shop', entityA: 'rulers', entityB: 'erasers', verb: 'purchased' },
    ],
    constraints: { valA: { min: 2, max: 10 }, valB: { min: 3, max: 8 }, valC: { min: 20, max: 50 } },
    storyTemplate: '{nameA} bought {valA} {entityA} at ${valB} each from {setting}. {nameA} paid with a ${valC} note. How much change did {nameA} receive?',
    solutionTemplate: 'Step 1: Find the total cost: {valA} × ${valB} = ${{mid}}.\nStep 2: Subtract from amount paid: ${valC} − ${{mid}} = ${{answer}}.\nAnswer: ${{answer}}.',
    scaffold: msScaffold(
      ['Buying items and working out the change', 'Sharing the cost among friends', 'Comparing prices of different items', 'Finding the total cost without change'],
      ['How much change {nameA} received', 'The total cost of the items', 'The price of each item', 'How many items {nameA} bought'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'multiplication', expression: '{valA} × {valB}', label: 'Find total cost' },
        { operation: 'subtraction', expression: '{valC} - ({valA} × {valB})', label: 'Subtract from amount paid' },
      ],
      '{answer}',
    ),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/wrong-operation'] },
  },
  {
    templateId: 'psl-tpl-ms-money-02',
    skillId: 'psl-p4-ms-money', structure: 'multiStep', heuristic: 'multi-step',
    operations: ['multiplication', 'addition', 'subtraction'], difficulty: 3,
    contexts: [
      { setting: 'hawker centre', entityA: 'chicken rice', entityB: 'iced drinks', verb: 'bought' },
      { setting: 'food court', entityA: 'roti prata', entityB: 'teh tarik', verb: 'ordered' },
    ],
    constraints: { valA: { min: 2, max: 10 }, valB: { min: 3, max: 8 }, valC: { min: 20, max: 50 } },
    storyTemplate: '{nameA} bought {valA} plates of {entityA} at ${valB} each and 2 {entityB} at $2 each at the {setting}. {nameA} paid with a ${valC} note. How much change did {nameA} receive?',
    solutionTemplate: 'Step 1: Find cost of food: {valA} × ${valB} = ${{mid}}.\nStep 2: Find cost of drinks: 2 × $2 = $4.\nStep 3: Find total cost: ${{mid}} + $4 = ${{mid2}}.\nStep 4: Find change: ${valC} − ${{mid2}} = ${{answer}}.\nAnswer: ${{answer}}.',
    scaffold: msScaffold(
      ['Buying food and drinks, then finding the change', 'Splitting the bill equally', 'Comparing meal prices', 'Finding who spent more'],
      ['How much change {nameA} received', 'The cost of the {entityA}', 'The cost of the {entityB}', 'The total spent by {nameA}'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'multiplication', expression: '{valA} × {valB} + 2 × 2', label: 'Find total cost of food and drinks' },
        { operation: 'subtraction', expression: '{valC} - ({valA} × {valB} + 4)', label: 'Subtract total from payment' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-ms-money-03',
    skillId: 'psl-p4-ms-money', structure: 'multiStep', heuristic: 'multi-step',
    operations: ['multiplication', 'subtraction'], difficulty: 3,
    contexts: [
      { setting: 'bubble tea shop', entityA: 'brown sugar milk teas', entityB: 'matcha lattes', verb: 'ordered' },
      { setting: 'Mr Bean', entityA: 'soya milk bottles', entityB: 'pancakes', verb: 'bought' },
    ],
    constraints: { valA: { min: 2, max: 10 }, valB: { min: 3, max: 8 }, valC: { min: 20, max: 50 } },
    storyTemplate: '{nameA} and {nameB} each bought {valA} {entityA} at ${valB} each from the {setting}. They paid with a ${valC} note together. How much change did they receive?',
    solutionTemplate: 'Step 1: Find cost for both people: 2 × {valA} × ${valB} = ${{mid}}.\nStep 2: Find change: ${valC} − ${{mid}} = ${{answer}}.\nAnswer: ${{answer}}.',
    scaffold: msScaffold(
      ['Two people buying the same item, paying together for change', 'Comparing what each person bought', 'Sharing items between two friends', 'Finding who spent more money'],
      ['How much change they received', 'How much each person spent', 'The total number of items', 'The price per item'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'multiplication', expression: '2 × {valA} × {valB}', label: 'Find total cost for both' },
        { operation: 'subtraction', expression: '{valC} - (2 × {valA} × {valB})', label: 'Subtract from payment' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/included-irrelevant'], solve: ['psl/arithmetic-error', 'psl/wrong-operation'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P5 MULTI-STEP: DECIMAL CHAIN  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-ms-decimal-01',
    skillId: 'psl-p5-ms-decimal-chain', structure: 'multiStep', heuristic: 'multi-step',
    operations: ['multiplication', 'subtraction'], difficulty: 4,
    contexts: [
      { setting: 'provision shop', entityA: 'bottles of soya sauce', verb: 'bought', unit: 'litres' },
      { setting: 'wet market', entityA: 'packets of rice', verb: 'bought', unit: 'kg' },
    ],
    constraints: { valA: { min: 10, max: 50 }, valB: { min: 2, max: 8 } },
    storyTemplate: '{nameA} bought {valB} {entityA} of 1.5 {unit} each from the {setting}. {nameA} used 2.3 {unit}. How many {unit} did {nameA} have left?',
    solutionTemplate: 'Step 1: Find total amount bought: {valB} × 1.5 = {{mid}}.\nStep 2: Subtract amount used: {{mid}} − 2.3 = {{answer}}.\nAnswer: {{answer}} {unit}.',
    scaffold: msScaffold(
      ['Buying items in decimal quantities and using some', 'Comparing weights of different items', 'Sharing items equally by weight', 'Converting units to find the total'],
      ['How many {unit} {nameA} had left', 'The total {unit} bought', 'The price per {unit}', 'How many packets were used'],
      ['{valB}', '1.5', '2.3'],
      [
        { operation: 'multiplication', expression: '{valB} × 1.5', label: 'Find total amount bought' },
        { operation: 'subtraction', expression: '({valB} × 1.5) - 2.3', label: 'Subtract amount used' },
      ],
      '{answer}',
    ),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/decimal-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-ms-decimal-02',
    skillId: 'psl-p5-ms-decimal-chain', structure: 'multiStep', heuristic: 'multi-step',
    operations: ['multiplication', 'addition'], difficulty: 4,
    contexts: [
      { setting: 'swimming complex', entityA: 'lengths', verb: 'swam', unit: 'km' },
      { setting: 'park connector', entityA: 'laps', verb: 'jogged', unit: 'km' },
    ],
    constraints: { valA: { min: 10, max: 50 }, valB: { min: 2, max: 8 } },
    storyTemplate: '{nameA} {verb} {valB} {entityA} of 0.75 {unit} each at the {setting}. {nameA} then walked another 1.2 {unit}. What was the total distance {nameA} covered?',
    solutionTemplate: 'Step 1: Find distance from laps: {valB} × 0.75 = {{mid}}.\nStep 2: Add walking distance: {{mid}} + 1.2 = {{answer}}.\nAnswer: {{answer}} km.',
    scaffold: msScaffold(
      ['Calculating total distance from laps plus extra walking', 'Finding the speed of each lap', 'Comparing distances of two people', 'Finding time taken per lap'],
      ['The total distance {nameA} covered', 'The distance of each lap', 'How many laps were done', 'The time taken'],
      ['{valB}', '0.75', '1.2'],
      [
        { operation: 'multiplication', expression: '{valB} × 0.75', label: 'Find distance from laps' },
        { operation: 'addition', expression: '({valB} × 0.75) + 1.2', label: 'Add walking distance' },
      ],
      '{answer}',
    ),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/decimal-error'] },
  },
  {
    templateId: 'psl-tpl-ms-decimal-03',
    skillId: 'psl-p5-ms-decimal-chain', structure: 'multiStep', heuristic: 'multi-step',
    operations: ['addition', 'subtraction'], difficulty: 4,
    contexts: [
      { setting: 'Cold Storage', entityA: 'chicken', entityB: 'fish', verb: 'weighed', unit: 'kg' },
      { setting: 'Sheng Siong', entityA: 'bag of flour', entityB: 'bag of sugar', verb: 'weighed', unit: 'kg' },
    ],
    constraints: { valA: { min: 10, max: 50 }, valB: { min: 2, max: 8 } },
    storyTemplate: '{nameA} bought {entityA} weighing 3.45 {unit} and {entityB} weighing 2.8 {unit} from {setting}. {nameA} used 1.65 {unit} of {entityA} for cooking. What was the total weight of food {nameA} had left?',
    solutionTemplate: 'Step 1: Find remaining {entityA}: 3.45 − 1.65 = {{mid}}.\nStep 2: Add {entityB} weight: {{mid}} + 2.8 = {{answer}}.\nAnswer: {{answer}} kg.',
    scaffold: msScaffold(
      ['Buying food by weight, using some, finding what is left', 'Comparing the weight of two items', 'Sharing food equally by weight', 'Converting between units'],
      ['The total weight of food left', 'The weight of {entityA} used', 'The original weight of {entityB}', 'The price per {unit}'],
      ['3.45', '2.8', '1.65'],
      [
        { operation: 'subtraction', expression: '3.45 - 1.65', label: 'Find remaining {entityA}' },
        { operation: 'addition', expression: '(3.45 - 1.65) + 2.8', label: 'Add remaining {entityB}' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/decimal-error', 'psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P5 MULTI-STEP: FRACTION CHAIN  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-ms-frac-01',
    skillId: 'psl-p5-ms-fraction-chain', structure: 'multiStep', heuristic: 'multi-step',
    operations: ['multiplication', 'subtraction'], difficulty: 4,
    contexts: [
      { setting: 'school hall', entityA: 'chairs', verb: 'set up' },
      { setting: 'community centre', entityA: 'seats', verb: 'arranged' },
    ],
    constraints: { groups: { min: 2, max: 5 }, perGroup: { min: 10, max: 30 } },
    storyTemplate: '{nameA} {verb} {groups} rows of {perGroup} {entityA} in the {setting}. 1/5 of the {entityA} were occupied. How many {entityA} were empty?',
    solutionTemplate: 'Step 1: Find total chairs: {groups} × {perGroup} = {{total}}.\nStep 2: Find occupied chairs: {{total}} ÷ 5 = {{occupied}}.\nStep 3: Find empty chairs: {{total}} − {{occupied}} = {{answer}}.\nAnswer: {{answer}} chairs.',
    scaffold: msScaffold(
      ['Finding how many chairs are empty after some are occupied', 'Comparing occupied and empty chairs', 'Sharing chairs equally among rows', 'Adding more chairs to the hall'],
      ['How many {entityA} were empty', 'How many {entityA} were occupied', 'The total number of {entityA}', 'How many rows there were'],
      ['{groups}', '{perGroup}'],
      [
        { operation: 'multiplication', expression: '{groups} × {perGroup}', label: 'Find total chairs' },
        { operation: 'subtraction', expression: '({groups} × {perGroup}) - ({groups} × {perGroup}) ÷ 5', label: 'Subtract occupied chairs' },
      ],
      '{answer}',
    ),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/fraction-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-ms-frac-02',
    skillId: 'psl-p5-ms-fraction-chain', structure: 'multiStep', heuristic: 'multi-step',
    operations: ['multiplication', 'division'], difficulty: 4,
    contexts: [
      { setting: 'CCA session', entityA: 'coloured beads', verb: 'had' },
      { setting: 'art class', entityA: 'buttons', verb: 'collected' },
    ],
    constraints: { groups: { min: 2, max: 5 }, perGroup: { min: 10, max: 30 } },
    storyTemplate: '{nameA} {verb} {groups} bags of {perGroup} {entityA} for a {setting}. {nameA} gave 1/4 of all the {entityA} to {nameB}. How many {entityA} did {nameB} receive?',
    solutionTemplate: 'Step 1: Find total items: {groups} × {perGroup} = {{total}}.\nStep 2: Find 1/4 of total: {{total}} ÷ 4 = {{answer}}.\nAnswer: {{answer}}.',
    scaffold: msScaffold(
      ['Finding a fraction of the total beads to give away', 'Sharing beads into equal bags', 'Comparing how many each person has', 'Adding more beads to the collection'],
      ['How many {entityA} {nameB} received', 'The total number of {entityA}', 'How many bags there were', 'How many {entityA} {nameA} had left'],
      ['{groups}', '{perGroup}'],
      [
        { operation: 'multiplication', expression: '{groups} × {perGroup}', label: 'Find total items' },
        { operation: 'division', expression: '({groups} × {perGroup}) ÷ 4', label: 'Find 1/4 of total' },
      ],
      '{answer}',
    ),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/fraction-error'] },
  },
  {
    templateId: 'psl-tpl-ms-frac-03',
    skillId: 'psl-p5-ms-fraction-chain', structure: 'multiStep', heuristic: 'multi-step',
    operations: ['multiplication', 'subtraction'], difficulty: 4,
    contexts: [
      { setting: 'Hari Raya celebration', entityA: 'kueh lapis slices', verb: 'prepared' },
      { setting: 'Chinese New Year party', entityA: 'pineapple tarts', verb: 'baked' },
    ],
    constraints: { groups: { min: 2, max: 5 }, perGroup: { min: 10, max: 30 } },
    storyTemplate: '{nameA} {verb} {groups} trays of {perGroup} {entityA} for the {setting}. 2/3 of the {entityA} were eaten. How many {entityA} were left?',
    solutionTemplate: 'Step 1: Find total treats: {groups} × {perGroup} = {{total}}.\nStep 2: Find 2/3 eaten: {{total}} × 2 ÷ 3 = {{eaten}}.\nStep 3: Find remaining: {{total}} − {{eaten}} = {{answer}}.\nAnswer: {{answer}}.',
    scaffold: msScaffold(
      ['Making festive treats and finding how many are left after eating', 'Comparing how many each person ate', 'Adding more trays of treats', 'Sharing treats equally among guests'],
      ['How many {entityA} were left', 'How many {entityA} were eaten', 'The total number of {entityA}', 'How many trays were there'],
      ['{groups}', '{perGroup}'],
      [
        { operation: 'multiplication', expression: '{groups} × {perGroup}', label: 'Find total treats' },
        { operation: 'subtraction', expression: '({groups} × {perGroup}) - ({groups} × {perGroup}) × 2 ÷ 3', label: 'Subtract the eaten portion' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/fraction-error', 'psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P6 MULTI-STEP: RATE × TIME  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-ms-rate-01',
    skillId: 'psl-p6-ms-rate-time', structure: 'multiStep', heuristic: 'multi-step',
    operations: ['multiplication', 'subtraction'], difficulty: 5,
    contexts: [
      { setting: 'East Coast Park', entityA: 'cycling', verb: 'cycled', unit: 'km' },
      { setting: 'Bedok Reservoir', entityA: 'jogging', verb: 'jogged', unit: 'km' },
    ],
    constraints: { valA: { min: 30, max: 80 }, valB: { min: 2, max: 5 } },
    storyTemplate: '{nameA} {verb} at a speed of {valA} km/h for {valB} hours along {setting}. {nameB} covered 25 {unit} less than {nameA}. What distance did {nameB} cover?',
    solutionTemplate: 'Step 1: Find distance of {nameA}: {valA} × {valB} = {{mid}} km.\nStep 2: Subtract to find {nameB}\'s distance: {{mid}} − 25 = {{answer}} km.\nAnswer: {{answer}} km.',
    scaffold: msScaffold(
      ['Using speed and time to find distance, then comparing', 'Finding who was faster', 'Calculating the time taken', 'Adding the distances together'],
      ['The distance {nameB} covered', 'The distance {nameA} covered', 'The speed of {nameB}', 'The total distance of both'],
      ['{valA}', '{valB}', '25'],
      [
        { operation: 'multiplication', expression: '{valA} × {valB}', label: 'Find distance of {nameA}' },
        { operation: 'subtraction', expression: '({valA} × {valB}) - 25', label: 'Subtract to find distance of {nameB}' },
      ],
      '{answer}',
    ),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/wrong-operation'] },
  },
  {
    templateId: 'psl-tpl-ms-rate-02',
    skillId: 'psl-p6-ms-rate-time', structure: 'multiStep', heuristic: 'multi-step',
    operations: ['multiplication', 'addition'], difficulty: 5,
    contexts: [
      { setting: 'MRT line', entityA: 'train A', entityB: 'train B', verb: 'travelled', unit: 'km' },
      { setting: 'expressway', entityA: 'Car A', entityB: 'Car B', verb: 'drove', unit: 'km' },
    ],
    constraints: { valA: { min: 30, max: 80 }, valB: { min: 2, max: 5 } },
    storyTemplate: '{entityA} {verb} along the {setting} at {valA} km/h for {valB} hours. {entityB} travelled 18 {unit} more than {entityA}. What was the total distance covered by both?',
    solutionTemplate: 'Step 1: Find distance of first: {valA} × {valB} = {{mid}} km.\nStep 2: Find distance of second: {{mid}} + 18 = {{mid2}} km.\nStep 3: Find total: {{mid}} + {{mid2}} = {{answer}} km.\nAnswer: {{answer}} km.',
    scaffold: msScaffold(
      ['Finding two distances using rate, time, and a comparison', 'Calculating speed from distance', 'Comparing arrival times', 'Finding fuel used for the journey'],
      ['The total distance covered by both', 'The distance of {entityA}', 'The distance of {entityB}', 'The speed difference'],
      ['{valA}', '{valB}', '18'],
      [
        { operation: 'multiplication', expression: '{valA} × {valB}', label: 'Find distance of first' },
        { operation: 'addition', expression: '({valA} × {valB}) + ({valA} × {valB}) + 18', label: 'Add both distances' },
      ],
      '{answer}',
    ),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-ms-rate-03',
    skillId: 'psl-p6-ms-rate-time', structure: 'multiStep', heuristic: 'multi-step',
    operations: ['multiplication', 'division'], difficulty: 5,
    contexts: [
      { setting: 'swimming pool', entityA: 'freestyle', verb: 'swam', unit: 'm' },
      { setting: 'track', entityA: 'running', verb: 'ran', unit: 'm' },
    ],
    constraints: { valA: { min: 30, max: 80 }, valB: { min: 2, max: 5 } },
    storyTemplate: '{nameA} {verb} at {valA} m/min for {valB} minutes at the {setting}. {nameB} covered the same distance but took twice as long. What was {nameB}\'s speed?',
    solutionTemplate: 'Step 1: Find the distance: {valA} × {valB} = {{distance}} m.\nStep 2: Find {nameB}\'s time: {valB} × 2 = {{time}} min.\nStep 3: Find {nameB}\'s speed: {{distance}} ÷ {{time}} = {{answer}} m/min.\nAnswer: {{answer}} m/min.',
    scaffold: msScaffold(
      ['Finding speed when distance and time are known', 'Finding who finished first', 'Calculating the total distance', 'Comparing the two speeds'],
      ['{nameB}\'s speed', 'The distance covered', '{nameA}\'s time', 'The total time for both'],
      ['{valA}', '{valB}'],
      [
        { operation: 'multiplication', expression: '{valA} × {valB}', label: 'Find the distance' },
        { operation: 'division', expression: '({valA} × {valB}) ÷ ({valB} × 2)', label: 'Divide distance by double the time' },
      ],
      '{answer}',
    ),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/wrong-operation'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P6 MULTI-STEP: DISCOUNT + GST  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-ms-disctax-01',
    skillId: 'psl-p6-ms-discount-tax', structure: 'multiStep', heuristic: 'multi-step',
    operations: ['subtraction', 'addition'], difficulty: 5,
    contexts: [
      { setting: 'Challenger', entityA: 'headphones', verb: 'bought' },
      { setting: 'Courts', entityA: 'wireless speaker', verb: 'purchased' },
    ],
    constraints: { valA: { min: 50, max: 200 }, valB: { min: 10, max: 30 } },
    storyTemplate: '{nameA} {verb} a pair of {entityA} at {setting} with an original price of ${valA}. The store offered a {valB}% discount. After the discount, 9% GST was added. How much did {nameA} pay?',
    solutionTemplate: 'Step 1: Find discount amount: ${valA} × {valB}% = ${{discount}}.\nStep 2: Find discounted price: ${valA} − ${{discount}} = ${{discounted}}.\nStep 3: Find GST: ${{discounted}} × 9% = ${{gst}}.\nStep 4: Find final price: ${{discounted}} + ${{gst}} = ${{answer}}.\nAnswer: ${{answer}}.',
    scaffold: msScaffold(
      ['Finding the final price after discount and tax', 'Comparing prices at two stores', 'Calculating profit from a sale', 'Finding the original price from discounted price'],
      ['How much {nameA} paid', 'The amount of discount', 'The GST amount', 'The original price'],
      ['{valA}', '{valB}', '9%'],
      [
        { operation: 'subtraction', expression: '{valA} - {valA} × {valB} ÷ 100', label: 'Apply discount' },
        { operation: 'addition', expression: 'discounted + discounted × 9 ÷ 100', label: 'Add 9% GST' },
      ],
      '{answer}',
    ),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/percentage-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-ms-disctax-02',
    skillId: 'psl-p6-ms-discount-tax', structure: 'multiStep', heuristic: 'multi-step',
    operations: ['subtraction', 'addition'], difficulty: 5,
    contexts: [
      { setting: 'Uniqlo', entityA: 'jacket', verb: 'bought' },
      { setting: 'Cotton On', entityA: 'backpack', verb: 'purchased' },
    ],
    constraints: { valA: { min: 50, max: 200 }, valB: { min: 10, max: 30 } },
    storyTemplate: 'A {entityA} at {setting} was priced at ${valA}. During a sale, there was a {valB}% discount. {nameA} also had to pay 9% GST on the discounted price. What was the total amount {nameA} paid?',
    solutionTemplate: 'Step 1: Find discounted price: ${valA} × (100 − {valB})% = ${{discounted}}.\nStep 2: Find GST: ${{discounted}} × 9% = ${{gst}}.\nStep 3: Find total paid: ${{discounted}} + ${{gst}} = ${{answer}}.\nAnswer: ${{answer}}.',
    scaffold: msScaffold(
      ['Calculating a discounted price then adding tax', 'Finding the savings from a sale', 'Comparing two different discounts', 'Working backwards from the final price'],
      ['The total amount {nameA} paid', 'The discounted price before GST', 'The discount amount', 'The GST amount'],
      ['{valA}', '{valB}', '9%'],
      [
        { operation: 'subtraction', expression: '{valA} × (100 - {valB}) ÷ 100', label: 'Find discounted price' },
        { operation: 'addition', expression: 'discounted × 1.09', label: 'Add 9% GST to discounted price' },
      ],
      '{answer}',
    ),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/percentage-error'] },
  },
  {
    templateId: 'psl-tpl-ms-disctax-03',
    skillId: 'psl-p6-ms-discount-tax', structure: 'multiStep', heuristic: 'multi-step',
    operations: ['multiplication', 'subtraction', 'addition'], difficulty: 5,
    contexts: [
      { setting: 'Harvey Norman', entityA: 'tablets', verb: 'bought' },
      { setting: 'Best Denki', entityA: 'smartwatches', verb: 'purchased' },
    ],
    constraints: { valA: { min: 50, max: 200 }, valB: { min: 10, max: 30 } },
    storyTemplate: '{nameA} {verb} 2 {entityA} at ${valA} each from {setting}. The store gave a {valB}% bulk discount on the total. After the discount, 9% GST was added. How much did {nameA} pay in total?',
    solutionTemplate: 'Step 1: Find total before discount: 2 × ${valA} = ${{subtotal}}.\nStep 2: Find discounted total: ${{subtotal}} × (100 − {valB})% = ${{discounted}}.\nStep 3: Find GST: ${{discounted}} × 9% = ${{gst}}.\nStep 4: Find final price: ${{discounted}} + ${{gst}} = ${{answer}}.\nAnswer: ${{answer}}.',
    scaffold: msScaffold(
      ['Buying multiple items with bulk discount and tax', 'Finding the price per item after discount', 'Comparing bulk vs single pricing', 'Calculating profit margin'],
      ['How much {nameA} paid in total', 'The total before discount', 'The discount amount', 'The GST amount'],
      ['{valA}', '{valB}', '9%'],
      [
        { operation: 'multiplication', expression: '2 × {valA} × (100 - {valB}) ÷ 100', label: 'Find discounted total' },
        { operation: 'addition', expression: 'discounted × 1.09', label: 'Add 9% GST' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/percentage-error', 'psl/arithmetic-error'] },
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
  console.log(`Seeded ${upserted} PSL multi-step problem templates.`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
