import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLProblemTemplate from '../models/psl/PSLProblemTemplate.js';
import { strategyScaffold } from './pslTemplateFactory.js';

// ─── Scaffold helper ────────────────────────────────────────────────
const assumptionScaffold = (understandChoices, questionChoices, highlights, solveSteps, answer) => ({
  understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: understandChoices },
  identify_info: { type: 'highlight', expected: highlights },
  identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: questionChoices },
  plan: { type: 'strategySelect', prompt: 'What strategy should we use?', correctIndex: 0,
    choices: ['Assume all are one type, then adjust', 'Draw a bar model', 'Use guess and check', 'Work backwards'] },
  solve: { type: 'twoStep', steps: solveSteps, answer },
  check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
});

// ─── Constraint patterns ────────────────────────────────────────────
// Animals: totalAnimals chickens (2 legs) + rabbits (4 legs) = totalLegs
const animalsConstraints = (legsA, legsB) => ({
  _generic: {
    totalItems: { min: 10, max: 30 },
    countB: { min: 3, max: 15 },
  },
  _compute: {
    countA: (n) => n.totalItems - n.countB,
    totalValue: (n) => (n.totalItems - n.countB) * legsA + n.countB * legsB,
    assumedTotal: (n) => n.totalItems * legsA,
    diff: (n) => Math.abs(n.totalItems * legsA - ((n.totalItems - n.countB) * legsA + n.countB * legsB)),
    swapDiff: () => Math.abs(legsA - legsB),
    answer: (n) => n.countB,
  },
  answer: { min: 3 },
});

// Items: totalItems of typeA ($priceA each) + typeB ($priceB each) = totalCost
const itemsConstraints = {
  _generic: {
    priceA: { min: 2, max: 6 },
    priceB: { min: 7, max: 15 },
    totalItems: { min: 8, max: 20 },
    countB: { min: 3, max: 10 },
  },
  _compute: {
    countA: (n) => n.totalItems - n.countB,
    totalCost: (n) => (n.totalItems - n.countB) * n.priceA + n.countB * n.priceB,
    assumedTotal: (n) => n.totalItems * n.priceA,
    diff: (n) => Math.abs((n.totalItems - n.countB) * n.priceA + n.countB * n.priceB - n.totalItems * n.priceA),
    swapDiff: (n) => n.priceB - n.priceA,
    answer: (n) => n.countB,
  },
  answer: { min: 3 },
};

// Coins: totalCoins of valA cents + valB cents = totalValue cents
const coinsConstraints = (valA, valB) => ({
  _generic: {
    totalItems: { min: 10, max: 25 },
    countB: { min: 3, max: 12 },
  },
  _compute: {
    countA: (n) => n.totalItems - n.countB,
    totalValue: (n) => (n.totalItems - n.countB) * valA + n.countB * valB,
    assumedTotal: (n) => n.totalItems * valA,
    diff: (n) => Math.abs((n.totalItems - n.countB) * valA + n.countB * valB - n.totalItems * valA),
    swapDiff: () => Math.abs(valB - valA),
    answer: (n) => n.countB,
  },
  answer: { min: 3 },
});

// Scoring: totalQuestions, correct gets +markGain, wrong loses markLose, total score
const scoringConstraints = {
  _generic: {
    markGain: { min: 2, max: 5 },
    markLose: { min: 1, max: 2 },
    totalItems: { min: 15, max: 30 },
    countB: { min: 3, max: 10 },
  },
  _compute: {
    countA: (n) => n.totalItems - n.countB,
    totalValue: (n) => (n.totalItems - n.countB) * n.markGain - n.countB * n.markLose,
    assumedTotal: (n) => n.totalItems * n.markGain,
    diff: (n) => Math.abs(n.totalItems * n.markGain - ((n.totalItems - n.countB) * n.markGain - n.countB * n.markLose)),
    swapDiff: (n) => n.markGain + n.markLose,
    answer: (n) => n.countB,
  },
  answer: { min: 3 },
};

// Transport: cars (4 wheels) + motorcycles (2 wheels) = totalWheels
const transportConstraints = animalsConstraints(4, 2);

// ─── Templates ──────────────────────────────────────────────────────
const templates = [
  // ══════════════════════════════════════════════════════════════════
  //  P4 ANIMALS & LEGS  (4 templates)
  // ══════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-asmp-animals-01',
    skillId: 'psl-p4-assumption-animals', structure: 'assumption', heuristic: 'assumption',
    operations: ['multiplication', 'subtraction', 'division'], difficulty: 1,
    contexts: [
      { entityA: 'chickens', entityB: 'rabbits', setting: 'farm', propA: '2 legs', propB: '4 legs', unitA: 2, unitB: 4 },
    ],
    constraints: animalsConstraints(2, 4),
    storyTemplate: 'A {setting} has {totalItems} {entityA} and {entityB} altogether. They have {totalValue} legs in total. How many {entityB} are there?',
    solutionTemplate: 'Step 1: Assume all {totalItems} animals are {entityA} ({propA} each).\nStep 2: Assumed legs = {totalItems} × {unitA} = {assumedTotal}.\nStep 3: Actual legs = {totalValue}. Difference = {totalValue} − {assumedTotal} = {diff}.\nStep 4: Each swap ({entityA} → {entityB}) adds {swapDiff} legs.\nStep 5: Number of {entityB} = {diff} ÷ {swapDiff} = {answer}.\nAnswer: {answer} {entityB}.',
    scaffold: assumptionScaffold(
      ['A farm with two types of animals that have different numbers of legs', 'Counting animals in a zoo', 'Feeding animals at a pet shop', 'Buying animals from a market'],
      ['How many {entityB} are there', 'How many legs are there in total', 'How many {entityA} are there', 'How many animals are there'],
      ['{totalItems}', '{totalValue}'],
      [
        { operation: 'multiplication', expression: '{totalItems} × {unitA}', label: 'Assume all are {entityA}: total legs' },
        { operation: 'subtraction', expression: '{totalValue} − {assumedTotal}', label: 'Find the difference in legs' },
        { operation: 'division', expression: '{diff} ÷ {swapDiff}', label: 'Divide by the per-swap difference' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/assumption-wrong-base', 'psl/assumption-wrong-swap'] },
  },
  {
    templateId: 'psl-tpl-asmp-animals-02',
    skillId: 'psl-p4-assumption-animals', structure: 'assumption', heuristic: 'assumption',
    operations: ['multiplication', 'subtraction', 'division'], difficulty: 1,
    contexts: [
      { entityA: 'chickens', entityB: 'spiders', setting: 'garden', propA: '2 legs', propB: '8 legs', unitA: 2, unitB: 8 },
    ],
    constraints: animalsConstraints(2, 8),
    storyTemplate: 'In the {setting}, there are {totalItems} {entityA} and {entityB}. They have {totalValue} legs altogether. How many {entityB} are there?',
    solutionTemplate: 'Step 1: Assume all {totalItems} are {entityA} ({propA} each).\nStep 2: Assumed legs = {totalItems} × {unitA} = {assumedTotal}.\nStep 3: Difference = {totalValue} − {assumedTotal} = {diff}.\nStep 4: Each swap adds {swapDiff} legs.\nStep 5: {entityB} = {diff} ÷ {swapDiff} = {answer}.\nAnswer: {answer} {entityB}.',
    scaffold: assumptionScaffold(
      ['Creatures in a garden with different numbers of legs', 'Counting insects at a picnic', 'Animals in a pet shop', 'Bugs in a science lab'],
      ['How many {entityB} are there', 'The total number of legs', 'How many {entityA} are there', 'How many creatures can fly'],
      ['{totalItems}', '{totalValue}'],
      [
        { operation: 'multiplication', expression: '{totalItems} × {unitA}', label: 'Assume all are {entityA}' },
        { operation: 'subtraction', expression: '{totalValue} − {assumedTotal}', label: 'Find the difference' },
        { operation: 'division', expression: '{diff} ÷ {swapDiff}', label: 'Divide by per-swap difference' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/assumption-wrong-base', 'psl/assumption-wrong-swap'] },
  },
  {
    templateId: 'psl-tpl-asmp-animals-03',
    skillId: 'psl-p4-assumption-animals', structure: 'assumption', heuristic: 'assumption',
    operations: ['multiplication', 'subtraction', 'division'], difficulty: 2,
    contexts: [
      { entityA: 'ducks', entityB: 'dogs', setting: 'park', propA: '2 legs', propB: '4 legs', unitA: 2, unitB: 4 },
    ],
    constraints: animalsConstraints(2, 4),
    storyTemplate: 'At the {setting}, {nameA} counted {totalItems} {entityA} and {entityB}. There were {totalValue} legs in all. How many {entityB} were there?',
    solutionTemplate: 'Step 1: Assume all are {entityA} ({propA}).\nStep 2: Assumed legs = {totalItems} × {unitA} = {assumedTotal}.\nStep 3: Difference = {totalValue} − {assumedTotal} = {diff}.\nStep 4: Each {entityA} → {entityB} swap adds {swapDiff} legs.\nStep 5: {entityB} = {diff} ÷ {swapDiff} = {answer}.\nAnswer: {answer} {entityB}.',
    scaffold: assumptionScaffold(
      ['Counting animals at a park with different numbers of legs', 'A zoo visit with different animals', 'A pet show with various animals', 'A nature walk counting creatures'],
      ['How many {entityB} were there', 'The total number of animals', 'How many {entityA} were there', 'The total number of legs'],
      ['{totalItems}', '{totalValue}'],
      [
        { operation: 'multiplication', expression: '{totalItems} × {unitA}', label: 'Assume all are {entityA}' },
        { operation: 'subtraction', expression: '{totalValue} − {assumedTotal}', label: 'Find the leg difference' },
        { operation: 'division', expression: '{diff} ÷ {swapDiff}', label: 'Divide by swap difference' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/assumption-wrong-base'] },
  },
  {
    templateId: 'psl-tpl-asmp-animals-04',
    skillId: 'psl-p4-assumption-animals', structure: 'assumption', heuristic: 'assumption',
    operations: ['multiplication', 'subtraction', 'division'], difficulty: 2,
    contexts: [
      { entityA: 'beetles', entityB: 'ants', setting: 'science lab', propA: '6 legs', propB: '6 legs', unitA: 6, unitB: 6 },
    ],
    constraints: animalsConstraints(2, 6),
    storyTemplate: 'There are {totalItems} birds and {entityB} in the {setting}. They have {totalValue} legs in total. How many {entityB} are there? (Birds have 2 legs; {entityB} have 6 legs.)',
    solutionTemplate: 'Step 1: Assume all {totalItems} are birds (2 legs each).\nStep 2: Assumed legs = {totalItems} × 2 = {assumedTotal}.\nStep 3: Difference = {totalValue} − {assumedTotal} = {diff}.\nStep 4: Each swap (bird → {entityB}) adds {swapDiff} legs.\nStep 5: {entityB} = {diff} ÷ {swapDiff} = {answer}.\nAnswer: {answer} {entityB}.',
    scaffold: assumptionScaffold(
      ['Creatures in a lab with different numbers of legs', 'A nature class counting insects', 'Animals at a zoo', 'Pets in a shop'],
      ['How many {entityB} are there', 'How many birds are there', 'The total number of legs', 'The total number of creatures'],
      ['{totalItems}', '{totalValue}'],
      [
        { operation: 'multiplication', expression: '{totalItems} × 2', label: 'Assume all are birds' },
        { operation: 'subtraction', expression: '{totalValue} − {assumedTotal}', label: 'Find the difference' },
        { operation: 'division', expression: '{diff} ÷ {swapDiff}', label: 'Divide by swap difference' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/assumption-wrong-base', 'psl/assumption-wrong-swap'] },
  },

  // ══════════════════════════════════════════════════════════════════
  //  P4 ITEMS & COST  (3 templates)
  // ══════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-asmp-items-01',
    skillId: 'psl-p4-assumption-items', structure: 'assumption', heuristic: 'assumption',
    operations: ['multiplication', 'subtraction', 'division'], difficulty: 2,
    contexts: [
      { entityA: 'pens', entityB: 'rulers', setting: 'school bookshop' },
      { entityA: 'exercise books', entityB: 'files', setting: 'Popular' },
    ],
    constraints: itemsConstraints,
    storyTemplate: '{nameA} bought {totalItems} {entityA} and {entityB} from {setting}. Each {entityA} costs ${priceA} and each {entityB} costs ${priceB}. {nameA} paid ${totalCost} in total. How many {entityB} did {nameA} buy?',
    solutionTemplate: 'Step 1: Assume all {totalItems} items are {entityA} at ${priceA} each.\nStep 2: Assumed cost = {totalItems} × ${priceA} = ${assumedTotal}.\nStep 3: Actual cost = ${totalCost}. Difference = ${totalCost} − ${assumedTotal} = ${diff}.\nStep 4: Each swap ({entityA} → {entityB}) adds ${swapDiff}.\nStep 5: {entityB} = {diff} ÷ {swapDiff} = {answer}.\nAnswer: {answer} {entityB}.',
    scaffold: assumptionScaffold(
      ['Buying two types of stationery at different prices', 'Finding the price of items on sale', 'Sharing the cost of supplies', 'Comparing prices at two shops'],
      ['How many {entityB} {nameA} bought', 'The total cost', 'How many {entityA} {nameA} bought', 'The change received'],
      ['{totalItems}', '{priceA}', '{priceB}', '{totalCost}'],
      [
        { operation: 'multiplication', expression: '{totalItems} × {priceA}', label: 'Assume all are {entityA}' },
        { operation: 'subtraction', expression: '{totalCost} − {assumedTotal}', label: 'Find cost difference' },
        { operation: 'division', expression: '{diff} ÷ {swapDiff}', label: 'Divide by per-swap cost difference' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/assumption-wrong-base', 'psl/assumption-wrong-swap'] },
  },
  {
    templateId: 'psl-tpl-asmp-items-02',
    skillId: 'psl-p4-assumption-items', structure: 'assumption', heuristic: 'assumption',
    operations: ['multiplication', 'subtraction', 'division'], difficulty: 2,
    contexts: [
      { entityA: 'chicken rice', entityB: 'nasi lemak', setting: 'hawker centre' },
      { entityA: 'kaya toast', entityB: 'roti prata', setting: 'kopitiam' },
    ],
    constraints: itemsConstraints,
    storyTemplate: 'At the {setting}, {nameA} ordered {totalItems} plates of {entityA} and {entityB}. {entityA} costs ${priceA} per plate and {entityB} costs ${priceB} per plate. The total bill was ${totalCost}. How many plates of {entityB} were ordered?',
    solutionTemplate: 'Step 1: Assume all {totalItems} plates are {entityA} at ${priceA}.\nStep 2: Assumed total = {totalItems} × ${priceA} = ${assumedTotal}.\nStep 3: Difference = ${totalCost} − ${assumedTotal} = ${diff}.\nStep 4: Each swap adds ${swapDiff}.\nStep 5: {entityB} = {diff} ÷ {swapDiff} = {answer}.\nAnswer: {answer} plates of {entityB}.',
    scaffold: assumptionScaffold(
      ['Ordering food at different prices at a hawker centre', 'Splitting a restaurant bill', 'Buying snacks at a canteen', 'Ordering catering for an event'],
      ['How many plates of {entityB} were ordered', 'The total cost of the food', 'How many plates of {entityA} were ordered', 'The change received'],
      ['{totalItems}', '{priceA}', '{priceB}', '{totalCost}'],
      [
        { operation: 'multiplication', expression: '{totalItems} × {priceA}', label: 'Assume all are {entityA}' },
        { operation: 'subtraction', expression: '{totalCost} − {assumedTotal}', label: 'Find the difference' },
        { operation: 'division', expression: '{diff} ÷ {swapDiff}', label: 'Number of {entityB}' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/assumption-wrong-base'] },
  },
  {
    templateId: 'psl-tpl-asmp-items-03',
    skillId: 'psl-p4-assumption-items', structure: 'assumption', heuristic: 'assumption',
    operations: ['multiplication', 'subtraction', 'division'], difficulty: 3,
    contexts: [
      { entityA: 'adult tickets', entityB: 'child tickets', setting: 'Singapore Zoo' },
      { entityA: 'adult passes', entityB: 'child passes', setting: 'Science Centre' },
    ],
    constraints: itemsConstraints,
    storyTemplate: '{nameA} bought {totalItems} tickets for {setting}. An {entityA} costs ${priceB} and a {entityB} costs ${priceA}. {nameA} paid ${totalCost} altogether. How many {entityB} were bought?',
    solutionTemplate: 'Step 1: Assume all {totalItems} are {entityB} at ${priceA}.\nStep 2: Assumed cost = {totalItems} × ${priceA} = ${assumedTotal}.\nStep 3: Difference = ${totalCost} − ${assumedTotal} = ${diff}.\nStep 4: Each swap ({entityB} → {entityA}) costs ${swapDiff} more.\nStep 5: {entityA} = {diff} ÷ {swapDiff}. Then {entityB} = {totalItems} − that = {answer}.\nAnswer: {answer} {entityB}.',
    scaffold: assumptionScaffold(
      ['Buying tickets for adults and children at different prices', 'Booking seats at a cinema', 'Purchasing passes for a theme park', 'Registering for a school event'],
      ['How many {entityB} were bought', 'The total cost of tickets', 'How many {entityA} were bought', 'The price difference'],
      ['{totalItems}', '{priceA}', '{priceB}', '{totalCost}'],
      [
        { operation: 'multiplication', expression: '{totalItems} × {priceA}', label: 'Assume all are {entityB}' },
        { operation: 'subtraction', expression: '{totalCost} − {assumedTotal}', label: 'Find the cost gap' },
        { operation: 'division', expression: '{diff} ÷ {swapDiff}', label: 'Find number of {entityA}, then subtract' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/assumption-wrong-base', 'psl/assumption-wrong-swap'] },
  },

  // ══════════════════════════════════════════════════════════════════
  //  P5 COINS & NOTES  (3 templates)
  // ══════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-asmp-coins-01',
    skillId: 'psl-p5-assumption-coins', structure: 'assumption', heuristic: 'assumption',
    operations: ['multiplication', 'subtraction', 'division'], difficulty: 2,
    contexts: [
      { entityA: '20-cent coins', entityB: '50-cent coins', setting: 'piggy bank', unitLabel: 'cents' },
    ],
    constraints: coinsConstraints(20, 50),
    storyTemplate: '{nameA} has {totalItems} coins in a {setting}. Some are {entityA} and the rest are {entityB}. The total value is {totalValue} cents. How many {entityB} does {nameA} have?',
    solutionTemplate: 'Step 1: Assume all {totalItems} coins are {entityA} (20¢ each).\nStep 2: Assumed value = {totalItems} × 20 = {assumedTotal} cents.\nStep 3: Difference = {totalValue} − {assumedTotal} = {diff} cents.\nStep 4: Each swap adds {swapDiff} cents.\nStep 5: {entityB} = {diff} ÷ {swapDiff} = {answer}.\nAnswer: {answer} {entityB}.',
    scaffold: assumptionScaffold(
      ['Coins of two denominations with a known total value', 'Counting money in a wallet', 'Sharing coins equally', 'Exchanging coins at a bank'],
      ['How many {entityB} there are', 'The total value of the coins', 'How many {entityA} there are', 'The total number of coins'],
      ['{totalItems}', '{totalValue}'],
      [
        { operation: 'multiplication', expression: '{totalItems} × 20', label: 'Assume all are {entityA}' },
        { operation: 'subtraction', expression: '{totalValue} − {assumedTotal}', label: 'Find the value difference' },
        { operation: 'division', expression: '{diff} ÷ {swapDiff}', label: 'Divide by swap difference' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/assumption-wrong-base'] },
  },
  {
    templateId: 'psl-tpl-asmp-coins-02',
    skillId: 'psl-p5-assumption-coins', structure: 'assumption', heuristic: 'assumption',
    operations: ['multiplication', 'subtraction', 'division'], difficulty: 2,
    contexts: [
      { entityA: '$2 notes', entityB: '$5 notes', setting: 'wallet', unitLabel: 'dollars' },
    ],
    constraints: coinsConstraints(2, 5),
    storyTemplate: '{nameA} has {totalItems} notes in a {setting}. Some are {entityA} and the rest are {entityB}. The total amount is ${totalValue}. How many {entityB} are there?',
    solutionTemplate: 'Step 1: Assume all {totalItems} notes are {entityA} ($2 each).\nStep 2: Assumed value = {totalItems} × $2 = ${assumedTotal}.\nStep 3: Difference = ${totalValue} − ${assumedTotal} = ${diff}.\nStep 4: Each swap adds ${swapDiff}.\nStep 5: {entityB} = {diff} ÷ {swapDiff} = {answer}.\nAnswer: {answer} {entityB}.',
    scaffold: assumptionScaffold(
      ['Notes of two denominations with a known total amount', 'Counting money at a cash register', 'Dividing money into envelopes', 'Making change at a shop'],
      ['How many {entityB} there are', 'The total value', 'How many {entityA} there are', 'The difference in value'],
      ['{totalItems}', '{totalValue}'],
      [
        { operation: 'multiplication', expression: '{totalItems} × 2', label: 'Assume all are {entityA}' },
        { operation: 'subtraction', expression: '{totalValue} − {assumedTotal}', label: 'Find difference' },
        { operation: 'division', expression: '{diff} ÷ {swapDiff}', label: 'Number of {entityB}' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/assumption-wrong-base'] },
  },
  {
    templateId: 'psl-tpl-asmp-coins-03',
    skillId: 'psl-p5-assumption-coins', structure: 'assumption', heuristic: 'assumption',
    operations: ['multiplication', 'subtraction', 'division'], difficulty: 3,
    contexts: [
      { entityA: '10-cent coins', entityB: '$1 coins', setting: 'coin collection', unitLabel: 'cents' },
    ],
    constraints: coinsConstraints(10, 100),
    storyTemplate: '{nameA} has a {setting} of {totalItems} coins — some are {entityA} and the rest are {entityB}. The total value is {totalValue} cents. How many {entityB} does {nameA} have?',
    solutionTemplate: 'Step 1: Assume all {totalItems} are {entityA} (10¢ each).\nStep 2: Assumed value = {totalItems} × 10 = {assumedTotal}¢.\nStep 3: Difference = {totalValue} − {assumedTotal} = {diff}¢.\nStep 4: Each swap adds {swapDiff}¢.\nStep 5: {entityB} = {diff} ÷ {swapDiff} = {answer}.\nAnswer: {answer} {entityB}.',
    scaffold: assumptionScaffold(
      ['Two types of coins with a known total value', 'Sorting coins at a bank', 'Counting money for a donation', 'Exchanging coins at a vending machine'],
      ['How many {entityB} there are', 'The total number of coins', 'The value of the {entityA}', 'How to exchange them'],
      ['{totalItems}', '{totalValue}'],
      [
        { operation: 'multiplication', expression: '{totalItems} × 10', label: 'Assume all are {entityA}' },
        { operation: 'subtraction', expression: '{totalValue} − {assumedTotal}', label: 'Find value gap' },
        { operation: 'division', expression: '{diff} ÷ {swapDiff}', label: 'Number of {entityB}' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/assumption-wrong-swap'] },
  },

  // ══════════════════════════════════════════════════════════════════
  //  P5 SCORING & PENALTIES  (3 templates)
  // ══════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-asmp-score-01',
    skillId: 'psl-p5-assumption-scoring', structure: 'assumption', heuristic: 'assumption',
    operations: ['multiplication', 'subtraction', 'division'], difficulty: 3,
    contexts: [
      { setting: 'maths quiz' },
    ],
    constraints: scoringConstraints,
    storyTemplate: 'A {setting} has {totalItems} questions. Each correct answer earns {markGain} marks and each wrong answer loses {markLose} mark. {nameA} scored {totalValue} marks. How many questions did {nameA} get wrong?',
    solutionTemplate: 'Step 1: Assume all {totalItems} answers are correct → {totalItems} × {markGain} = {assumedTotal} marks.\nStep 2: Difference = {assumedTotal} − {totalValue} = {diff} marks.\nStep 3: Each wrong answer loses {markGain} + {markLose} = {swapDiff} marks from the assumed total.\nStep 4: Wrong answers = {diff} ÷ {swapDiff} = {answer}.\nAnswer: {answer} questions wrong.',
    scaffold: assumptionScaffold(
      ['A quiz where correct answers earn marks and wrong answers lose marks', 'A competition with bonus points', 'A test with varying difficulty', 'A game with points and penalties'],
      ['How many questions {nameA} got wrong', 'The total score', 'How many questions {nameA} got right', 'The mark for each question'],
      ['{totalItems}', '{markGain}', '{markLose}', '{totalValue}'],
      [
        { operation: 'multiplication', expression: '{totalItems} × {markGain}', label: 'Assume all correct' },
        { operation: 'subtraction', expression: '{assumedTotal} − {totalValue}', label: 'Find mark shortfall' },
        { operation: 'division', expression: '{diff} ÷ {swapDiff}', label: 'Wrong answers' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/assumption-wrong-base', 'psl/assumption-scoring-swap'] },
  },
  {
    templateId: 'psl-tpl-asmp-score-02',
    skillId: 'psl-p5-assumption-scoring', structure: 'assumption', heuristic: 'assumption',
    operations: ['multiplication', 'subtraction', 'division'], difficulty: 3,
    contexts: [
      { setting: 'spelling bee' },
    ],
    constraints: scoringConstraints,
    storyTemplate: 'In a {setting}, there are {totalItems} words. For each correct spelling, the contestant earns {markGain} points. For each wrong spelling, {markLose} point is deducted. {nameA} ended with {totalValue} points. How many words did {nameA} spell wrongly?',
    solutionTemplate: 'Step 1: Assume all {totalItems} correct → {totalItems} × {markGain} = {assumedTotal} points.\nStep 2: Shortfall = {assumedTotal} − {totalValue} = {diff}.\nStep 3: Each wrong answer costs {swapDiff} points (gain + loss).\nStep 4: Wrong = {diff} ÷ {swapDiff} = {answer}.\nAnswer: {answer} words.',
    scaffold: assumptionScaffold(
      ['A spelling competition with points for correct and deductions for wrong', 'A quiz show with bonus rounds', 'A trivia game with penalties', 'A word puzzle contest'],
      ['How many words {nameA} spelled wrongly', 'The total points scored', 'How many words {nameA} spelled correctly', 'The maximum possible score'],
      ['{totalItems}', '{markGain}', '{markLose}', '{totalValue}'],
      [
        { operation: 'multiplication', expression: '{totalItems} × {markGain}', label: 'Assume all correct' },
        { operation: 'subtraction', expression: '{assumedTotal} − {totalValue}', label: 'Mark shortfall' },
        { operation: 'division', expression: '{diff} ÷ {swapDiff}', label: 'Wrong answers' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/assumption-scoring-swap'] },
  },
  {
    templateId: 'psl-tpl-asmp-score-03',
    skillId: 'psl-p5-assumption-scoring', structure: 'assumption', heuristic: 'assumption',
    operations: ['multiplication', 'subtraction', 'division'], difficulty: 3,
    contexts: [
      { setting: 'science olympiad' },
    ],
    constraints: scoringConstraints,
    storyTemplate: 'A {setting} has {totalItems} multiple-choice questions. Each correct answer scores {markGain} points, but each wrong answer deducts {markLose} point. {nameA} attempted all questions and scored {totalValue} points. How many questions did {nameA} answer incorrectly?',
    solutionTemplate: 'Step 1: If all correct: {totalItems} × {markGain} = {assumedTotal}.\nStep 2: Gap = {assumedTotal} − {totalValue} = {diff}.\nStep 3: Each swap costs {swapDiff} points.\nStep 4: Incorrect = {diff} ÷ {swapDiff} = {answer}.\nAnswer: {answer} questions.',
    scaffold: assumptionScaffold(
      ['An olympiad with marks gained and deducted', 'A quiz bowl with penalties', 'A trivia night with point deductions', 'A certification exam with negative marking'],
      ['How many questions {nameA} got wrong', 'The total score achieved', 'How many questions {nameA} got right', 'The pass mark'],
      ['{totalItems}', '{markGain}', '{markLose}', '{totalValue}'],
      [
        { operation: 'multiplication', expression: '{totalItems} × {markGain}', label: 'Assume all correct' },
        { operation: 'subtraction', expression: '{assumedTotal} − {totalValue}', label: 'Point shortfall' },
        { operation: 'division', expression: '{diff} ÷ {swapDiff}', label: 'Incorrect answers' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/assumption-scoring-swap'] },
  },

  // ══════════════════════════════════════════════════════════════════
  //  P5 TRANSPORT & WHEELS  (3 templates)
  // ══════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-asmp-transport-01',
    skillId: 'psl-p5-assumption-transport', structure: 'assumption', heuristic: 'assumption',
    operations: ['multiplication', 'subtraction', 'division'], difficulty: 2,
    contexts: [
      { entityA: 'cars', entityB: 'motorcycles', setting: 'HDB car park', propA: '4 wheels', propB: '2 wheels', unitA: 4, unitB: 2 },
    ],
    constraints: transportConstraints,
    storyTemplate: 'An {setting} has {totalItems} {entityA} and {entityB}. There are {totalValue} wheels in total. How many {entityB} are there?',
    solutionTemplate: 'Step 1: Assume all {totalItems} vehicles are {entityA} ({propA}).\nStep 2: Assumed wheels = {totalItems} × {unitA} = {assumedTotal}.\nStep 3: Difference = {assumedTotal} − {totalValue} = {diff}.\nStep 4: Each swap ({entityA} → {entityB}) removes {swapDiff} wheels.\nStep 5: {entityB} = {diff} ÷ {swapDiff} = {answer}.\nAnswer: {answer} {entityB}.',
    scaffold: assumptionScaffold(
      ['Vehicles in a car park with different numbers of wheels', 'Counting tyres at a workshop', 'Vehicles on a highway', 'Parking at a shopping centre'],
      ['How many {entityB} are there', 'The total number of wheels', 'How many {entityA} are there', 'The total number of vehicles'],
      ['{totalItems}', '{totalValue}'],
      [
        { operation: 'multiplication', expression: '{totalItems} × {unitA}', label: 'Assume all are {entityA}' },
        { operation: 'subtraction', expression: '{assumedTotal} − {totalValue}', label: 'Find the wheel difference' },
        { operation: 'division', expression: '{diff} ÷ {swapDiff}', label: 'Number of {entityB}' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/assumption-wrong-base'] },
  },
  {
    templateId: 'psl-tpl-asmp-transport-02',
    skillId: 'psl-p5-assumption-transport', structure: 'assumption', heuristic: 'assumption',
    operations: ['multiplication', 'subtraction', 'division'], difficulty: 2,
    contexts: [
      { entityA: 'bicycles', entityB: 'tricycles', setting: 'playground', propA: '2 wheels', propB: '3 wheels', unitA: 2, unitB: 3 },
    ],
    constraints: animalsConstraints(2, 3),
    storyTemplate: 'At the {setting}, there are {totalItems} {entityA} and {entityB}. The total number of wheels is {totalValue}. How many {entityB} are there?',
    solutionTemplate: 'Step 1: Assume all are {entityA} ({propA}).\nStep 2: Assumed wheels = {totalItems} × {unitA} = {assumedTotal}.\nStep 3: Difference = {totalValue} − {assumedTotal} = {diff}.\nStep 4: Each swap adds {swapDiff} wheel.\nStep 5: {entityB} = {diff} ÷ {swapDiff} = {answer}.\nAnswer: {answer} {entityB}.',
    scaffold: assumptionScaffold(
      ['Cycles at a playground with different numbers of wheels', 'Counting wheels at a bicycle shop', 'Vehicles in a race', 'Bikes at a park'],
      ['How many {entityB} are there', 'The total number of wheels', 'How many {entityA} are there', 'The total number of cycles'],
      ['{totalItems}', '{totalValue}'],
      [
        { operation: 'multiplication', expression: '{totalItems} × {unitA}', label: 'Assume all are {entityA}' },
        { operation: 'subtraction', expression: '{totalValue} − {assumedTotal}', label: 'Wheel difference' },
        { operation: 'division', expression: '{diff} ÷ {swapDiff}', label: 'Number of {entityB}' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/assumption-wrong-base'] },
  },
  {
    templateId: 'psl-tpl-asmp-transport-03',
    skillId: 'psl-p5-assumption-transport', structure: 'assumption', heuristic: 'assumption',
    operations: ['multiplication', 'subtraction', 'division'], difficulty: 3,
    contexts: [
      { entityA: 'lorries', entityB: 'motorcycles', setting: 'factory loading bay', propA: '6 wheels', propB: '2 wheels', unitA: 6, unitB: 2 },
    ],
    constraints: animalsConstraints(6, 2),
    storyTemplate: 'At a {setting}, there are {totalItems} {entityA} and {entityB}. The total number of wheels is {totalValue}. ({entityA} have {propA}; {entityB} have {propB}.) How many of each vehicle are there?',
    solutionTemplate: 'Step 1: Assume all are {entityA} ({propA}).\nStep 2: Assumed = {totalItems} × {unitA} = {assumedTotal}.\nStep 3: Difference = {assumedTotal} − {totalValue} = {diff}.\nStep 4: Each swap removes {swapDiff} wheels.\nStep 5: {entityB} = {diff} ÷ {swapDiff} = {answer}.\nAnswer: {answer} {entityB}, {countA} {entityA}.',
    scaffold: assumptionScaffold(
      ['Vehicles with different wheel counts at a loading bay', 'Counting wheels at a mechanic shop', 'Parking at a construction site', 'Fleet management at a logistics company'],
      ['How many of each vehicle', 'The total number of wheels', 'Which type has more vehicles', 'The total weight of vehicles'],
      ['{totalItems}', '{totalValue}'],
      [
        { operation: 'multiplication', expression: '{totalItems} × {unitA}', label: 'Assume all are {entityA}' },
        { operation: 'subtraction', expression: '{assumedTotal} − {totalValue}', label: 'Wheel difference' },
        { operation: 'division', expression: '{diff} ÷ {swapDiff}', label: 'Number of {entityB}' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/assumption-wrong-swap'] },
  },

  // ══════════════════════════════════════════════════════════════════
  //  P6 ADVANCED  (3 templates)
  // ══════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-asmp-adv-01',
    skillId: 'psl-p6-assumption-advanced', structure: 'assumption', heuristic: 'assumption',
    operations: ['multiplication', 'subtraction', 'division'], difficulty: 3,
    contexts: [
      { entityA: 'tables for 4', entityB: 'tables for 6', setting: 'restaurant' },
    ],
    constraints: animalsConstraints(4, 6),
    storyTemplate: 'A {setting} has {totalItems} tables. Some seat 4 people and the rest seat 6 people. The {setting} can seat {totalValue} people in total. How many {entityB} are there?',
    solutionTemplate: 'Step 1: Assume all {totalItems} tables seat 4.\nStep 2: Assumed capacity = {totalItems} × 4 = {assumedTotal}.\nStep 3: Difference = {totalValue} − {assumedTotal} = {diff}.\nStep 4: Each swap adds {swapDiff} seats.\nStep 5: {entityB} = {diff} ÷ {swapDiff} = {answer}.\nAnswer: {answer} {entityB}.',
    scaffold: assumptionScaffold(
      ['Tables of different sizes in a restaurant', 'Seating arrangements at a banquet', 'Booking tables for an event', 'Arranging chairs in a hall'],
      ['How many {entityB} there are', 'The total seating capacity', 'How many {entityA} there are', 'The number of empty seats'],
      ['{totalItems}', '{totalValue}'],
      [
        { operation: 'multiplication', expression: '{totalItems} × 4', label: 'Assume all seat 4' },
        { operation: 'subtraction', expression: '{totalValue} − {assumedTotal}', label: 'Seating gap' },
        { operation: 'division', expression: '{diff} ÷ {swapDiff}', label: 'Tables for 6' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/assumption-wrong-base'] },
  },
  {
    templateId: 'psl-tpl-asmp-adv-02',
    skillId: 'psl-p6-assumption-advanced', structure: 'assumption', heuristic: 'assumption',
    operations: ['multiplication', 'subtraction', 'division'], difficulty: 4,
    contexts: [
      { entityA: 'small boxes', entityB: 'large boxes', setting: 'warehouse' },
    ],
    constraints: {
      _generic: { capacityA: { min: 6, max: 10 }, capacityB: { min: 15, max: 24 }, totalItems: { min: 10, max: 20 }, countB: { min: 3, max: 8 } },
      _compute: {
        countA: (n) => n.totalItems - n.countB,
        totalValue: (n) => (n.totalItems - n.countB) * n.capacityA + n.countB * n.capacityB,
        assumedTotal: (n) => n.totalItems * n.capacityA,
        diff: (n) => n.countB * n.capacityB + (n.totalItems - n.countB) * n.capacityA - n.totalItems * n.capacityA,
        swapDiff: (n) => n.capacityB - n.capacityA,
        answer: (n) => n.countB,
      },
      answer: { min: 3 },
    },
    storyTemplate: 'A {setting} uses {totalItems} boxes. {entityA} hold {capacityA} items each and {entityB} hold {capacityB} items each. The boxes hold {totalValue} items in total. How many {entityB} are used?',
    solutionTemplate: 'Step 1: Assume all {totalItems} are {entityA} ({capacityA} items each).\nStep 2: Assumed capacity = {totalItems} × {capacityA} = {assumedTotal}.\nStep 3: Difference = {totalValue} − {assumedTotal} = {diff}.\nStep 4: Each swap adds {swapDiff} items.\nStep 5: {entityB} = {diff} ÷ {swapDiff} = {answer}.\nAnswer: {answer} {entityB}.',
    scaffold: assumptionScaffold(
      ['Packing items into boxes of different sizes', 'Shipping goods in containers', 'Storing books on shelves of different sizes', 'Organising files in folders of different capacities'],
      ['How many {entityB} are used', 'The total capacity', 'How many {entityA} are used', 'The total number of items'],
      ['{totalItems}', '{capacityA}', '{capacityB}', '{totalValue}'],
      [
        { operation: 'multiplication', expression: '{totalItems} × {capacityA}', label: 'Assume all small' },
        { operation: 'subtraction', expression: '{totalValue} − {assumedTotal}', label: 'Capacity gap' },
        { operation: 'division', expression: '{diff} ÷ {swapDiff}', label: 'Number of large boxes' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/assumption-wrong-swap'] },
  },
  {
    templateId: 'psl-tpl-asmp-adv-03',
    skillId: 'psl-p6-assumption-advanced', structure: 'assumption', heuristic: 'assumption',
    operations: ['multiplication', 'subtraction', 'division'], difficulty: 4,
    contexts: [
      { entityA: 'single rooms', entityB: 'double rooms', setting: 'hotel' },
    ],
    constraints: animalsConstraints(1, 2),
    storyTemplate: 'A {setting} has {totalItems} rooms. {entityA} hold 1 guest and {entityB} hold 2 guests. The hotel can accommodate {totalValue} guests when fully booked. How many {entityB} are there?',
    solutionTemplate: 'Step 1: Assume all {totalItems} rooms are {entityA} (1 guest).\nStep 2: Assumed guests = {totalItems} × 1 = {assumedTotal}.\nStep 3: Difference = {totalValue} − {assumedTotal} = {diff}.\nStep 4: Each swap adds {swapDiff} guest.\nStep 5: {entityB} = {diff} ÷ {swapDiff} = {answer}.\nAnswer: {answer} {entityB}.',
    scaffold: assumptionScaffold(
      ['Hotel rooms of different sizes accommodating different numbers of guests', 'Dormitory rooms with different capacities', 'Tents at a campsite', 'Cabins on a cruise ship'],
      ['How many {entityB} there are', 'The total guest capacity', 'How many {entityA} there are', 'The number of vacant rooms'],
      ['{totalItems}', '{totalValue}'],
      [
        { operation: 'multiplication', expression: '{totalItems} × 1', label: 'Assume all single rooms' },
        { operation: 'subtraction', expression: '{totalValue} − {assumedTotal}', label: 'Guest gap' },
        { operation: 'division', expression: '{diff} ÷ {swapDiff}', label: 'Double rooms' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/assumption-wrong-base'] },
  },
];

async function seed() {
  await connectDB();
  for (const t of templates) {
    await PSLProblemTemplate.updateOne({ templateId: t.templateId }, { $set: t }, { upsert: true });
  }
  console.log(`Seeded ${templates.length} assumption templates`);
  await mongoose.disconnect();
}
seed().catch((e) => { console.error(e); process.exit(1); });
