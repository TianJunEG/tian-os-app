import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLProblemTemplate from '../models/psl/PSLProblemTemplate.js';

const NAMES = ['Wei Ling', 'Jun Hao', 'Ravi', 'Siti', 'Mei Xin', 'Arun', 'Farah', 'Zhi Hao', 'Priya', 'Ahmad'];

// Helper: guess-and-check scaffold (strategy-select plan, twoStep solve)
function gcScaffold(understandChoices, questionChoices, highlightExpected, solveSteps, answer) {
  return {
    understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: understandChoices },
    identify_info: { type: 'highlight', expected: highlightExpected },
    identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: questionChoices },
    plan: { type: 'strategySelect', prompt: 'What strategy should we use?', correctIndex: 0,
      choices: ['Suppose / guess and check', 'Draw a bar model', 'Work backwards', 'Make a table'] },
    solve: { type: 'twoStep', steps: solveSteps, answer },
    check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
  };
}

const TEMPLATES = [
  // ══════════════════════════════════════════════════════════════════════
  //  P4 GUESS & CHECK: SUM-DIFFERENCE  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-gc-sumdiff-01',
    skillId: 'psl-p4-gc-sum-diff', structure: 'guessCheck', heuristic: 'guess-check',
    operations: ['addition', 'division'], difficulty: 2,
    contexts: [
      { entityA: 'stickers', entityB: 'stickers', setting: 'classroom' },
      { entityA: 'marbles', entityB: 'marbles', setting: 'playground' },
    ],
    constraints: { total: { min: 20, max: 100 }, diff: { min: 2, max: 20 } },
    storyTemplate: '{nameA} and {nameB} have {total} {entityA} altogether. {nameA} has {diff} more than {nameB}. How many {entityA} does each person have?',
    solutionTemplate: 'Step 1: Add total and difference: {total} + {diff} = {{sum}}.\nStep 2: Divide by 2 to find the larger amount: {{sum}} ÷ 2 = {{larger}}.\nStep 3: Find the smaller amount: {total} − {{larger}} = {{smaller}}.\nAnswer: {nameA} has {{larger}}, {nameB} has {{smaller}}.',
    scaffold: gcScaffold(
      ['Two people sharing items with a known total and difference', 'Dividing items equally among friends', 'Buying items at different prices', 'Comparing heights of two people'],
      ['How many {entityA} each person has', 'How many {entityA} they have altogether', 'The difference between their {entityA}', 'Who has more {entityA}'],
      ['{total}', '{diff}'],
      [
        { operation: 'addition', expression: '{total} + {diff}', label: 'Add total and difference' },
        { operation: 'division', expression: '({total} + {diff}) ÷ 2', label: 'Divide by 2 to find the larger amount' },
      ],
      '{larger}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/wrong-operation'] },
  },
  {
    templateId: 'psl-tpl-gc-sumdiff-02',
    skillId: 'psl-p4-gc-sum-diff', structure: 'guessCheck', heuristic: 'guess-check',
    operations: ['addition', 'division'], difficulty: 2,
    contexts: [
      { entityA: 'books', entityB: 'books', setting: 'library' },
      { entityA: 'erasers', entityB: 'erasers', setting: 'bookshop' },
    ],
    constraints: { total: { min: 20, max: 100 }, diff: { min: 2, max: 20 } },
    storyTemplate: '{nameA} and {nameB} collected {total} {entityA} for the {setting} donation drive. {nameA} collected {diff} more than {nameB}. How many {entityA} did {nameA} collect?',
    solutionTemplate: 'Step 1: Add total and difference: {total} + {diff} = {{sum}}.\nStep 2: Divide by 2 to find {nameA}\'s amount: {{sum}} ÷ 2 = {{larger}}.\nAnswer: {nameA} collected {{larger}}.',
    scaffold: gcScaffold(
      ['Two people collecting items with a known total and difference', 'Sorting books into categories', 'Sharing items equally', 'Finding the cost of items'],
      ['How many {entityA} {nameA} collected', 'How many they collected altogether', 'The difference between their collections', 'How many {entityA} were donated'],
      ['{total}', '{diff}'],
      [
        { operation: 'addition', expression: '{total} + {diff}', label: 'Add total and difference' },
        { operation: 'division', expression: '({total} + {diff}) ÷ 2', label: 'Divide by 2 to find {nameA}\'s amount' },
      ],
      '{larger}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/wrong-operation'] },
  },
  {
    templateId: 'psl-tpl-gc-sumdiff-03',
    skillId: 'psl-p4-gc-sum-diff', structure: 'guessCheck', heuristic: 'guess-check',
    operations: ['subtraction', 'division'], difficulty: 2,
    contexts: [
      { entityA: 'points', entityB: 'points', setting: 'quiz competition' },
      { entityA: 'stamps', entityB: 'stamps', setting: 'stamp collection fair' },
    ],
    constraints: { total: { min: 20, max: 100 }, diff: { min: 2, max: 20 } },
    storyTemplate: 'In a {setting}, {nameA} and {nameB} scored {total} {entityA} in total. {nameB} scored {diff} fewer than {nameA}. How many {entityA} did {nameB} score?',
    solutionTemplate: 'Step 1: Subtract the difference from the total: {total} − {diff} = {{remainder}}.\nStep 2: Divide by 2 to find {nameB}\'s score: {{remainder}} ÷ 2 = {{smaller}}.\nAnswer: {nameB} scored {{smaller}}.',
    scaffold: gcScaffold(
      ['Two people with a combined score and a known difference', 'Ranking students by their scores', 'Finding the average score', 'Splitting a prize equally'],
      ['How many {entityA} {nameB} scored', 'The total score', 'Who scored higher', 'The difference in scores'],
      ['{total}', '{diff}'],
      [
        { operation: 'subtraction', expression: '{total} - {diff}', label: 'Subtract difference from total' },
        { operation: 'division', expression: '({total} - {diff}) ÷ 2', label: 'Divide by 2 to find the smaller amount' },
      ],
      '{smaller}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/wrong-operation'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P4 GUESS & CHECK: ITEMS-TOTAL  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-gc-itemstot-01',
    skillId: 'psl-p4-gc-items-total', structure: 'guessCheck', heuristic: 'guess-check',
    operations: ['multiplication', 'addition'], difficulty: 2,
    contexts: [
      { entityA: 'pens', entityB: 'notebooks', setting: 'Popular bookshop', verb: 'bought' },
      { entityA: 'curry puffs', entityB: 'egg tarts', setting: 'school canteen', verb: 'bought' },
    ],
    constraints: { valA: { min: 3, max: 8 }, valB: { min: 5, max: 12 }, valC: { min: 30, max: 80 } },
    storyTemplate: '{nameA} {verb} some {entityA} at ${valA} each and some {entityB} at ${valB} each from {setting}. {nameA} paid ${valC} in total. How many of each item did {nameA} buy?',
    solutionTemplate: 'Step 1: Suppose {nameA} bought a certain number of {entityA}.\nStep 2: Multiply by ${valA} to find the cost of {entityA}.\nStep 3: Use the remaining money for {entityB} at ${valB} each.\nStep 4: Check combinations until the total is ${valC}.\nAnswer: {{answer}}.',
    scaffold: gcScaffold(
      ['Buying two types of items at different prices with a known total', 'Finding the price of a single item', 'Sharing money equally', 'Comparing prices at two shops'],
      ['How many of each item {nameA} bought', 'The total cost of {entityA}', 'The change {nameA} received', 'Which item costs more'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'multiplication', expression: 'guess × {valA}', label: 'Suppose a number of {entityA} and find cost' },
        { operation: 'addition', expression: '(guess × {valA}) + (remaining × {valB})', label: 'Check if total matches ${valC}' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/wrong-operation'] },
  },
  {
    templateId: 'psl-tpl-gc-itemstot-02',
    skillId: 'psl-p4-gc-items-total', structure: 'guessCheck', heuristic: 'guess-check',
    operations: ['multiplication', 'addition'], difficulty: 2,
    contexts: [
      { entityA: 'chicken rice', entityB: 'nasi lemak', setting: 'hawker centre', verb: 'ordered' },
      { entityA: 'muffins', entityB: 'cupcakes', setting: 'school bake sale', verb: 'bought' },
    ],
    constraints: { valA: { min: 3, max: 8 }, valB: { min: 5, max: 12 }, valC: { min: 30, max: 80 } },
    storyTemplate: '{nameA} {verb} some plates of {entityA} at ${valA} each and some packets of {entityB} at ${valB} each at the {setting}. The total bill was ${valC}. How many plates of {entityA} did {nameA} order?',
    solutionTemplate: 'Step 1: Suppose a number of {entityA} plates at ${valA} each.\nStep 2: Find the cost; use the remainder for {entityB} at ${valB} each.\nStep 3: Check combinations until the total bill is ${valC}.\nAnswer: {{answer}} plates of {entityA}.',
    scaffold: gcScaffold(
      ['Ordering two types of food at different prices with a known total', 'Splitting a bill between friends', 'Finding the cheapest item', 'Calculating GST on a meal'],
      ['How many plates of {entityA} {nameA} ordered', 'The total number of items ordered', 'The cost of {entityB}', 'The change received'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'multiplication', expression: 'guess × {valA}', label: 'Suppose a number of {entityA} and find cost' },
        { operation: 'addition', expression: '(guess × {valA}) + (remaining × {valB})', label: 'Check if total matches ${valC}' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/wrong-operation'] },
  },
  {
    templateId: 'psl-tpl-gc-itemstot-03',
    skillId: 'psl-p4-gc-items-total', structure: 'guessCheck', heuristic: 'guess-check',
    operations: ['multiplication', 'addition'], difficulty: 2,
    contexts: [
      { entityA: 'exercise books', entityB: 'folders', setting: 'bookshop', verb: 'bought' },
      { entityA: 'roses', entityB: 'sunflowers', setting: 'NTUC FairPrice', verb: 'bought' },
    ],
    constraints: { valA: { min: 3, max: 8 }, valB: { min: 5, max: 12 }, valC: { min: 30, max: 80 } },
    storyTemplate: '{nameA} {verb} {entityA} at ${valA} each and {entityB} at ${valB} each from {setting}. {nameA} spent ${valC} altogether. If {nameA} bought the same number of each item, how many of each did {nameA} buy?',
    solutionTemplate: 'Step 1: Each set of one {entityA} and one {entityB} costs ${valA} + ${valB} = ${{setPrice}}.\nStep 2: Divide total by set price: ${valC} ÷ ${{setPrice}} = {{answer}}.\nAnswer: {{answer}} of each item.',
    scaffold: gcScaffold(
      ['Buying equal numbers of two items at different prices', 'Finding the price after a discount', 'Sharing items equally among classmates', 'Comparing the cost of two shops'],
      ['How many of each item {nameA} bought', 'The total number of items', 'Which item was cheaper', 'The change {nameA} received'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'multiplication', expression: 'guess × ({valA} + {valB})', label: 'Suppose a quantity and find combined cost per set' },
        { operation: 'addition', expression: 'guess × ({valA} + {valB}) = {valC}', label: 'Check if combined cost matches ${valC}' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/wrong-operation'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P5 GUESS & CHECK: COINS  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-gc-coins-01',
    skillId: 'psl-p5-gc-coins', structure: 'guessCheck', heuristic: 'guess-check',
    operations: ['multiplication', 'addition'], difficulty: 3,
    contexts: [
      { coinA: '20-cent', coinB: '50-cent', valCoinA: 20, valCoinB: 50 },
      { coinA: '10-cent', coinB: '50-cent', valCoinA: 10, valCoinB: 50 },
    ],
    constraints: { totalCoins: { min: 8, max: 20 }, totalValue: { min: 200, max: 800 } },
    storyTemplate: '{nameA} has {totalCoins} coins made up of {coinA} and {coinB} coins. The total value of the coins is ${totalValue / 100}. How many {coinA} coins does {nameA} have?',
    solutionTemplate: 'Step 1: Suppose a number of {coinA} coins out of {totalCoins} total.\nStep 2: The remaining coins are {coinB} coins.\nStep 3: Calculate: (guess × {valCoinA}) + (remaining × {valCoinB}).\nStep 4: Adjust until the total value matches ${totalValue / 100}.\nAnswer: {{answer}} {coinA} coins.',
    scaffold: gcScaffold(
      ['Finding the number of each type of coin given a total count and value', 'Sharing coins equally between two people', 'Converting dollars to cents', 'Counting the total number of coins'],
      ['How many {coinA} coins {nameA} has', 'The total value of all coins', 'How many {coinB} coins {nameA} has', 'The total number of coins'],
      ['{totalCoins}', '{totalValue / 100}'],
      [
        { operation: 'multiplication', expression: 'guess × {valCoinA}', label: 'Suppose a number of {coinA} coins and find their value' },
        { operation: 'addition', expression: '(guess × {valCoinA}) + (({totalCoins} - guess) × {valCoinB})', label: 'Check if total value matches' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/unit-conversion-error'] },
  },
  {
    templateId: 'psl-tpl-gc-coins-02',
    skillId: 'psl-p5-gc-coins', structure: 'guessCheck', heuristic: 'guess-check',
    operations: ['multiplication', 'addition'], difficulty: 3,
    contexts: [
      { coinA: '20-cent', coinB: '$1', valCoinA: 20, valCoinB: 100 },
      { coinA: '50-cent', coinB: '$1', valCoinA: 50, valCoinB: 100 },
    ],
    constraints: { totalCoins: { min: 8, max: 20 }, totalValue: { min: 400, max: 1200 } },
    storyTemplate: '{nameA} saved {totalCoins} coins in a piggy bank. The coins are a mix of {coinA} and {coinB} coins. The total amount saved is ${totalValue / 100}. How many {coinB} coins are there?',
    solutionTemplate: 'Step 1: Suppose a number of {coinB} coins out of {totalCoins} total.\nStep 2: The remaining coins are {coinA} coins.\nStep 3: Calculate: (guess × {valCoinB}) + (remaining × {valCoinA}).\nStep 4: Adjust until the total value matches ${totalValue / 100}.\nAnswer: {{answer}} {coinB} coins.',
    scaffold: gcScaffold(
      ['Finding coin counts given total number and total value', 'Saving the same amount each week', 'Exchanging coins for notes', 'Dividing money equally'],
      ['How many {coinB} coins there are', 'The total amount saved', 'How much each coin is worth', 'How many coins were spent'],
      ['{totalCoins}', '{totalValue / 100}'],
      [
        { operation: 'multiplication', expression: 'guess × {valCoinB}', label: 'Suppose a number of {coinB} coins and find their value' },
        { operation: 'addition', expression: '(guess × {valCoinB}) + (({totalCoins} - guess) × {valCoinA})', label: 'Check if total value matches' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/unit-conversion-error'] },
  },
  {
    templateId: 'psl-tpl-gc-coins-03',
    skillId: 'psl-p5-gc-coins', structure: 'guessCheck', heuristic: 'guess-check',
    operations: ['multiplication', 'addition'], difficulty: 3,
    contexts: [
      { coinA: '10-cent', coinB: '20-cent', valCoinA: 10, valCoinB: 20 },
      { coinA: '20-cent', coinB: '50-cent', valCoinA: 20, valCoinB: 50 },
    ],
    constraints: { totalCoins: { min: 10, max: 25 }, totalValue: { min: 200, max: 600 } },
    storyTemplate: 'A vending machine at {nameA}\'s school accepted only {coinA} and {coinB} coins. {nameA} inserted {totalCoins} coins worth ${totalValue / 100} in total. How many {coinB} coins did {nameA} use?',
    solutionTemplate: 'Step 1: Suppose a number of {coinB} coins out of {totalCoins} total.\nStep 2: The remaining coins are {coinA} coins.\nStep 3: Calculate: (guess × {valCoinB}) + (remaining × {valCoinA}).\nStep 4: Adjust until the total value matches ${totalValue / 100}.\nAnswer: {{answer}} {coinB} coins.',
    scaffold: gcScaffold(
      ['Finding the number of each coin type used in a vending machine', 'Calculating change from a vending machine', 'Comparing prices of two drinks', 'Finding the cost per item'],
      ['How many {coinB} coins {nameA} used', 'How much the item cost', 'The total number of coins inserted', 'The change received'],
      ['{totalCoins}', '{totalValue / 100}'],
      [
        { operation: 'multiplication', expression: 'guess × {valCoinB}', label: 'Suppose a number of {coinB} coins and find their value' },
        { operation: 'addition', expression: '(guess × {valCoinB}) + (({totalCoins} - guess) × {valCoinA})', label: 'Check if total value matches' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/unit-conversion-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P5 GUESS & CHECK: AGES  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-gc-ages-01',
    skillId: 'psl-p5-gc-ages', structure: 'guessCheck', heuristic: 'guess-check',
    operations: ['addition', 'division'], difficulty: 3,
    contexts: [
      { relationship: 'mother', setting: 'birthday party' },
      { relationship: 'father', setting: 'family gathering' },
    ],
    constraints: { totalAge: { min: 30, max: 70 }, ageDiff: { min: 20, max: 35 } },
    storyTemplate: 'At a {setting}, {nameA} and her {relationship} have a combined age of {totalAge}. Her {relationship} is {ageDiff} years older than {nameA}. How old is {nameA}?',
    solutionTemplate: 'Step 1: Subtract the age difference from the combined age: {totalAge} − {ageDiff} = {{remainder}}.\nStep 2: Divide by 2 to find {nameA}\'s age: {{remainder}} ÷ 2 = {{younger}}.\nAnswer: {nameA} is {{younger}} years old.',
    scaffold: gcScaffold(
      ['Finding two ages given their sum and difference', 'Calculating an age after a number of years', 'Finding the average age of a group', 'Comparing ages of siblings'],
      ['How old {nameA} is', 'The combined age', 'How old the {relationship} is', 'The age difference'],
      ['{totalAge}', '{ageDiff}'],
      [
        { operation: 'subtraction', expression: '{totalAge} - {ageDiff}', label: 'Subtract age difference from combined age' },
        { operation: 'division', expression: '({totalAge} - {ageDiff}) ÷ 2', label: 'Divide by 2 to find {nameA}\'s age' },
      ],
      '{younger}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/wrong-operation'] },
  },
  {
    templateId: 'psl-tpl-gc-ages-02',
    skillId: 'psl-p5-gc-ages', structure: 'guessCheck', heuristic: 'guess-check',
    operations: ['multiplication', 'subtraction'], difficulty: 3,
    contexts: [
      { relationship: 'grandfather', setting: 'Lunar New Year dinner' },
      { relationship: 'uncle', setting: 'family reunion' },
    ],
    constraints: { multiplier: { min: 2, max: 5 }, ageDiff: { min: 15, max: 40 } },
    storyTemplate: '{nameA}\'s {relationship} is {multiplier} times as old as {nameA}. The difference between their ages is {ageDiff} years. How old is {nameA}?',
    solutionTemplate: 'Step 1: The difference in ages equals ({multiplier} − 1) parts: {multiplier} − 1 = {{parts}}.\nStep 2: Divide the age difference by the number of parts: {ageDiff} ÷ {{parts}} = {{younger}}.\nAnswer: {nameA} is {{younger}} years old.',
    scaffold: gcScaffold(
      ['Finding ages when one is a multiple of the other with a known difference', 'Calculating how old someone will be in future', 'Sharing sweets between people of different ages', 'Finding the average age'],
      ['How old {nameA} is', 'How old the {relationship} is', 'The age multiplier', 'The combined age'],
      ['{multiplier}', '{ageDiff}'],
      [
        { operation: 'subtraction', expression: '{multiplier} - 1', label: 'Find how many "parts" the difference represents' },
        { operation: 'division', expression: '{ageDiff} ÷ ({multiplier} - 1)', label: 'Divide difference by number of parts to find {nameA}\'s age' },
      ],
      '{younger}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/ratio-error'] },
  },
  {
    templateId: 'psl-tpl-gc-ages-03',
    skillId: 'psl-p5-gc-ages', structure: 'guessCheck', heuristic: 'guess-check',
    operations: ['addition', 'division'], difficulty: 3,
    contexts: [
      { relationship: 'brother', setting: 'school registration' },
      { relationship: 'sister', setting: 'swimming class sign-up' },
    ],
    constraints: { totalAge: { min: 15, max: 30 }, ageDiff: { min: 2, max: 8 } },
    storyTemplate: '{nameA} and her {relationship} {nameB} signed up for a {setting}. Their combined age is {totalAge}. {nameA} is {ageDiff} years older than {nameB}. How old is {nameB}?',
    solutionTemplate: 'Step 1: Subtract the age difference from the combined age: {totalAge} − {ageDiff} = {{remainder}}.\nStep 2: Divide by 2 to find {nameB}\'s age: {{remainder}} ÷ 2 = {{younger}}.\nAnswer: {nameB} is {{younger}} years old.',
    scaffold: gcScaffold(
      ['Finding two ages with a known sum and difference', 'Comparing the heights of two siblings', 'Finding the total cost of registration', 'Dividing items between two children'],
      ['How old {nameB} is', 'The combined age', 'How old {nameA} is', 'The age gap'],
      ['{totalAge}', '{ageDiff}'],
      [
        { operation: 'subtraction', expression: '{totalAge} - {ageDiff}', label: 'Subtract age difference from total' },
        { operation: 'division', expression: '({totalAge} - {ageDiff}) ÷ 2', label: 'Divide by 2 to find {nameB}\'s age' },
      ],
      '{younger}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/wrong-operation'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P6 GUESS & CHECK: SIMULTANEOUS CONDITIONS  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-gc-simult-01',
    skillId: 'psl-p6-gc-simultaneous', structure: 'guessCheck', heuristic: 'guess-check',
    operations: ['multiplication', 'addition'], difficulty: 4,
    contexts: [
      { entityA: 'tables', entityB: 'chairs', seatsA: 4, seatsB: 6, setting: 'community centre' },
      { entityA: 'round tables', entityB: 'rectangular tables', seatsA: 8, seatsB: 10, setting: 'wedding banquet' },
    ],
    constraints: { totalFurniture: { min: 10, max: 30 }, totalSeats: { min: 50, max: 200 } },
    storyTemplate: 'A {setting} has {totalFurniture} {entityA} and {entityB} altogether. Each {entityA} seats {seatsA} people and each {entityB} seats {seatsB} people. There are {totalSeats} seats in total. How many {entityA} are there?',
    solutionTemplate: 'Step 1: Suppose a number of {entityA} out of {totalFurniture} total.\nStep 2: Find seats: (guess × {seatsA}) + (remaining × {seatsB}).\nStep 3: Adjust until total seats equal {totalSeats}.\nAnswer: {{answer}} {entityA}.',
    scaffold: gcScaffold(
      ['Finding the number of two types of furniture given total count and total seats', 'Arranging furniture in a room', 'Calculating the area of a hall', 'Dividing people into equal groups'],
      ['How many {entityA} there are', 'The total number of seats', 'How many {entityB} there are', 'The seating capacity per table'],
      ['{totalFurniture}', '{totalSeats}', '{seatsA}', '{seatsB}'],
      [
        { operation: 'multiplication', expression: 'guess × {seatsA}', label: 'Suppose a number of {entityA} and find their seats' },
        { operation: 'addition', expression: '(guess × {seatsA}) + (({totalFurniture} - guess) × {seatsB})', label: 'Check if total seats match {totalSeats}' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/wrong-operation'] },
  },
  {
    templateId: 'psl-tpl-gc-simult-02',
    skillId: 'psl-p6-gc-simultaneous', structure: 'guessCheck', heuristic: 'guess-check',
    operations: ['multiplication', 'addition'], difficulty: 4,
    contexts: [
      { entityA: 'bicycles', entityB: 'tricycles', wheelsA: 2, wheelsB: 3, setting: 'East Coast Park' },
      { entityA: 'cars', entityB: 'motorcycles', wheelsA: 4, wheelsB: 2, setting: 'HDB carpark' },
    ],
    constraints: { totalVehicles: { min: 10, max: 30 }, totalWheels: { min: 30, max: 100 } },
    storyTemplate: '{nameA} counted {totalVehicles} {entityA} and {entityB} at {setting}. There were {totalWheels} wheels in total. How many {entityA} were there?',
    solutionTemplate: 'Step 1: Suppose a number of {entityA} out of {totalVehicles} total.\nStep 2: Find wheels: (guess × {wheelsA}) + (remaining × {wheelsB}).\nStep 3: Adjust until total wheels equal {totalWheels}.\nAnswer: {{answer}} {entityA}.',
    scaffold: gcScaffold(
      ['Finding the count of two vehicle types given total vehicles and total wheels', 'Comparing the speeds of two vehicles', 'Calculating the distance travelled', 'Sharing vehicles equally among children'],
      ['How many {entityA} there were', 'The total number of wheels', 'How many {entityB} there were', 'The number of vehicles counted'],
      ['{totalVehicles}', '{totalWheels}', '{wheelsA}', '{wheelsB}'],
      [
        { operation: 'multiplication', expression: 'guess × {wheelsA}', label: 'Suppose a number of {entityA} and find their wheels' },
        { operation: 'addition', expression: '(guess × {wheelsA}) + (({totalVehicles} - guess) × {wheelsB})', label: 'Check if total wheels match {totalWheels}' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/wrong-operation'] },
  },
  {
    templateId: 'psl-tpl-gc-simult-03',
    skillId: 'psl-p6-gc-simultaneous', structure: 'guessCheck', heuristic: 'guess-check',
    operations: ['multiplication', 'addition'], difficulty: 4,
    contexts: [
      { entityA: '$5 notes', entityB: '$2 notes', valA: 5, valB: 2, setting: 'Lunar New Year' },
      { entityA: '$10 notes', entityB: '$5 notes', valA: 10, valB: 5, setting: 'Hari Raya' },
    ],
    constraints: { totalNotes: { min: 8, max: 20 }, totalValue: { min: 40, max: 150 } },
    storyTemplate: 'During {setting}, {nameA} received {totalNotes} ang pow packets containing only {entityA} and {entityB}. The total amount of money was ${totalValue}. How many {entityA} did {nameA} receive?',
    solutionTemplate: 'Step 1: Suppose a number of {entityA} out of {totalNotes} packets.\nStep 2: Find value: (guess × ${valA}) + (remaining × ${valB}).\nStep 3: Adjust until total value equals ${totalValue}.\nAnswer: {{answer}} {entityA}.',
    scaffold: gcScaffold(
      ['Finding the number of each note type given total notes and total value', 'Dividing money equally among siblings', 'Saving money over several days', 'Calculating the cost of a gift'],
      ['How many {entityA} {nameA} received', 'The total amount of money', 'How many {entityB} {nameA} received', 'The total number of ang pow packets'],
      ['{totalNotes}', '{totalValue}', '{valA}', '{valB}'],
      [
        { operation: 'multiplication', expression: 'guess × {valA}', label: 'Suppose a number of {entityA} and find their value' },
        { operation: 'addition', expression: '(guess × {valA}) + (({totalNotes} - guess) × {valB})', label: 'Check if total value matches ${totalValue}' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/wrong-operation'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P6 GUESS & CHECK: EXCESS-SHORTAGE  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-gc-exshort-01',
    skillId: 'psl-p6-gc-excess-short', structure: 'guessCheck', heuristic: 'guess-check',
    operations: ['subtraction', 'division'], difficulty: 4,
    contexts: [
      { entity: 'pencils', setting: 'classroom', recipient: 'students' },
      { entity: 'sweets', setting: 'birthday party', recipient: 'children' },
    ],
    constraints: { perPersonA: { min: 3, max: 8 }, perPersonB: { min: 5, max: 12 }, excess: { min: 2, max: 10 }, shortage: { min: 2, max: 10 } },
    storyTemplate: 'A teacher wants to give {entity} to her {recipient}. If she gives {perPersonA} {entity} to each {recipient}, she will have {excess} left over. If she gives {perPersonB} {entity} to each {recipient}, she will be short of {shortage}. How many {recipient} are there?',
    solutionTemplate: 'Step 1: Find total difference: {excess} + {shortage} = {{totalDiff}}.\nStep 2: Find per-person difference: {perPersonB} − {perPersonA} = {{perDiff}}.\nStep 3: Divide: {{totalDiff}} ÷ {{perDiff}} = {{answer}}.\nAnswer: {{answer}} {recipient}.',
    scaffold: gcScaffold(
      ['Finding the number of people given excess and shortage conditions', 'Sharing items equally among students', 'Comparing two classroom sizes', 'Finding the total number of items'],
      ['How many {recipient} there are', 'How many {entity} the teacher has', 'The difference between the two distributions', 'How many extra {entity} are needed'],
      ['{perPersonA}', '{perPersonB}', '{excess}', '{shortage}'],
      [
        { operation: 'addition', expression: '{excess} + {shortage}', label: 'Find total difference between the two distributions' },
        { operation: 'division', expression: '({excess} + {shortage}) ÷ ({perPersonB} - {perPersonA})', label: 'Divide by the per-person difference to find number of {recipient}' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/excess-shortage-confusion'] },
  },
  {
    templateId: 'psl-tpl-gc-exshort-02',
    skillId: 'psl-p6-gc-excess-short', structure: 'guessCheck', heuristic: 'guess-check',
    operations: ['subtraction', 'division'], difficulty: 4,
    contexts: [
      { entity: 'mooncakes', setting: 'Mid-Autumn Festival', recipient: 'families' },
      { entity: 'goodie bags', setting: 'National Day celebration', recipient: 'participants' },
    ],
    constraints: { perPersonA: { min: 2, max: 6 }, perPersonB: { min: 4, max: 10 }, excess: { min: 3, max: 12 }, shortage: { min: 3, max: 12 } },
    storyTemplate: 'For a {setting}, {nameA} is packing {entity}. If each {recipient} gets {perPersonA} {entity}, there are {excess} extra. If each {recipient} gets {perPersonB} {entity}, {nameA} is short by {shortage}. How many {recipient} are there?',
    solutionTemplate: 'Step 1: Find total difference: {excess} + {shortage} = {{totalDiff}}.\nStep 2: Find per-person difference: {perPersonB} − {perPersonA} = {{perDiff}}.\nStep 3: Divide: {{totalDiff}} ÷ {{perDiff}} = {{answer}}.\nAnswer: {{answer}} {recipient}.',
    scaffold: gcScaffold(
      ['Finding the number of groups given two distribution conditions', 'Packing items into equal boxes', 'Finding the cost of each item', 'Sharing food equally at a party'],
      ['How many {recipient} there are', 'How many {entity} {nameA} has', 'The difference between the two amounts per person', 'How many more {entity} are needed'],
      ['{perPersonA}', '{perPersonB}', '{excess}', '{shortage}'],
      [
        { operation: 'addition', expression: '{excess} + {shortage}', label: 'Find total difference between distributions' },
        { operation: 'division', expression: '({excess} + {shortage}) ÷ ({perPersonB} - {perPersonA})', label: 'Divide by per-person difference to find number of {recipient}' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/excess-shortage-confusion'] },
  },
  {
    templateId: 'psl-tpl-gc-exshort-03',
    skillId: 'psl-p6-gc-excess-short', structure: 'guessCheck', heuristic: 'guess-check',
    operations: ['subtraction', 'division'], difficulty: 4,
    contexts: [
      { entity: 'stickers', setting: 'art class', recipient: 'groups' },
      { entity: 'bookmarks', setting: 'reading programme', recipient: 'students' },
    ],
    constraints: { perPersonA: { min: 4, max: 9 }, perPersonB: { min: 6, max: 14 }, excess: { min: 5, max: 15 }, shortage: { min: 5, max: 15 } },
    storyTemplate: '{nameA} brought {entity} for an {setting}. If {nameA} gives {perPersonA} {entity} to each of the {recipient}, there will be {excess} {entity} remaining. If {nameA} gives {perPersonB} {entity} to each of the {recipient}, {nameA} will need {shortage} more {entity}. How many {recipient} are there?',
    solutionTemplate: 'Step 1: Find total difference: {excess} + {shortage} = {{totalDiff}}.\nStep 2: Find per-person difference: {perPersonB} − {perPersonA} = {{perDiff}}.\nStep 3: Divide: {{totalDiff}} ÷ {{perDiff}} = {{answer}}.\nAnswer: {{answer}} {recipient}.',
    scaffold: gcScaffold(
      ['Finding the number of groups from two distribution scenarios with excess and shortage', 'Dividing items into packets of different sizes', 'Finding the total from a list of numbers', 'Calculating the cost per group'],
      ['How many {recipient} there are', 'How many {entity} {nameA} brought', 'The number of extra {entity} needed', 'The total given to all {recipient}'],
      ['{perPersonA}', '{perPersonB}', '{excess}', '{shortage}'],
      [
        { operation: 'addition', expression: '{excess} + {shortage}', label: 'Find total difference between the two distributions' },
        { operation: 'division', expression: '({excess} + {shortage}) ÷ ({perPersonB} - {perPersonA})', label: 'Divide by per-person difference to find number of {recipient}' },
      ],
      '{answer}',
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-strategy'], solve: ['psl/arithmetic-error', 'psl/excess-shortage-confusion'] },
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
  console.log(`Seeded ${upserted} PSL guess-and-check problem templates.`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
