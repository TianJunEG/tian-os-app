import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLProblemTemplate from '../models/psl/PSLProblemTemplate.js';

// ── Work-Backwards heuristic scaffold helpers ───────────────────────

function wbOneStepScaffold(understandChoices, questionChoices, highlightFields) {
  return {
    understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: understandChoices },
    identify_info: { type: 'highlight', expected: highlightFields },
    identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: questionChoices },
    plan: { type: 'strategySelect', prompt: 'What strategy should we use?', correctIndex: 0, choices: ['Work backwards from the end', 'Draw a bar model', 'Guess and check', 'Make a table'] },
    solve: { type: 'expression', operation: 'addition', expression: '{end} + {step1}', answer: '{answer}' },
    check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
  };
}

function wbTwoStepScaffold(understandChoices, questionChoices, highlightFields, steps) {
  return {
    understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: understandChoices },
    identify_info: { type: 'highlight', expected: highlightFields },
    identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: questionChoices },
    plan: { type: 'strategySelect', prompt: 'What strategy should we use?', correctIndex: 0, choices: ['Work backwards from the end', 'Draw a bar model', 'Guess and check', 'Make a table'] },
    solve: { type: 'twoStep', steps, answer: '{answer}' },
    check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
  };
}

function wbMultiStepScaffold(understandChoices, questionChoices, highlightFields, steps) {
  return {
    understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: understandChoices },
    identify_info: { type: 'highlight', expected: highlightFields },
    identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: questionChoices },
    plan: { type: 'strategySelect', prompt: 'What strategy should we use?', correctIndex: 0, choices: ['Work backwards from the end', 'Draw a bar model', 'Guess and check', 'Make a table'] },
    solve: { type: 'twoStep', steps, answer: '{answer}' },
    check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
  };
}

const TEMPLATES = [
  // ══════════════════════════════════════════════════════════════════════
  //  P3 WORK BACKWARDS: ONE-STEP  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-wb-onestep-01',
    skillId: 'psl-p3-wb-one-step', structure: 'workBackwards', heuristic: 'work-backwards',
    operations: ['addition'], difficulty: 1,
    contexts: [
      { setting: 'canteen', item: 'curry puffs', verb: 'gave away', endVerb: 'had left' },
      { setting: 'provision shop', item: 'bottles of soya milk', verb: 'sold', endVerb: 'had left' },
    ],
    constraints: { end: { min: 20, max: 150 }, step1: { min: 10, max: 80 } },
    storyTemplate: '{nameA} {verb} {step1} {item} at the {setting}. {nameA} {endVerb} {end} {item}. How many {item} did {nameA} have at first?',
    solutionTemplate: 'Step 1: Start from the end — {nameA} has {end} {item} left.\nStep 2: Undo the action — {nameA} {verb} {step1}, so add them back: {end} + {step1} = {answer}.\nAnswer: {answer} {item}.',
    scaffold: wbOneStepScaffold(
      ['Finding the starting amount before giving some away', 'Finding how many were given away', 'Sharing items equally between friends', 'Comparing two quantities'],
      ['How many {item} {nameA} had at first', 'How many {item} were given away', 'How many {item} are left', 'How many {item} each person gets'],
      ['{end}', '{step1}'],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error', 'psl/reversed-operation'] },
  },
  {
    templateId: 'psl-tpl-wb-onestep-02',
    skillId: 'psl-p3-wb-one-step', structure: 'workBackwards', heuristic: 'work-backwards',
    operations: ['addition'], difficulty: 1,
    contexts: [
      { setting: 'classroom', item: 'stickers', verb: 'gave to her friend', endVerb: 'had left' },
      { setting: 'playground', item: 'marbles', verb: 'lost', endVerb: 'had left' },
    ],
    constraints: { end: { min: 20, max: 150 }, step1: { min: 10, max: 80 } },
    storyTemplate: '{nameA} {verb} {step1} {item} at the {setting}. {nameA} {endVerb} {end} {item}. How many {item} did {nameA} have at first?',
    solutionTemplate: 'Step 1: Start from the end — {nameA} has {end} {item} left.\nStep 2: Undo the action — {nameA} {verb} {step1}, so add them back: {end} + {step1} = {answer}.\nAnswer: {answer} {item}.',
    scaffold: wbOneStepScaffold(
      ['Finding the original amount before losing some', 'Finding the difference between two groups', 'Dividing items into equal groups', 'Counting items remaining'],
      ['How many {item} {nameA} had at first', 'How many {item} were lost', 'How many more {item} are needed', 'How many {item} each person has'],
      ['{end}', '{step1}'],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error', 'psl/reversed-operation'] },
  },
  {
    templateId: 'psl-tpl-wb-onestep-03',
    skillId: 'psl-p3-wb-one-step', structure: 'workBackwards', heuristic: 'work-backwards',
    operations: ['addition'], difficulty: 1,
    contexts: [
      { setting: 'MRT station', item: 'passengers', verb: 'alighted at the stop', endVerb: 'were still on the train' },
      { setting: 'library', item: 'books', verb: 'were borrowed', endVerb: 'remained on the shelf' },
    ],
    constraints: { end: { min: 20, max: 150 }, step1: { min: 10, max: 80 } },
    storyTemplate: '{step1} {item} {verb}. There were {end} {item} {endVerb}. How many {item} were there at first?',
    solutionTemplate: 'Step 1: Start from the end — there are {end} {item} remaining.\nStep 2: Undo the action — {step1} {item} {verb}, so add them back: {end} + {step1} = {answer}.\nAnswer: {answer} {item}.',
    scaffold: wbOneStepScaffold(
      ['Finding how many there were before some were removed', 'Finding how many were removed', 'Splitting into equal groups', 'Comparing two amounts'],
      ['How many {item} there were at first', 'How many {item} were removed', 'The difference between the two numbers', 'How many groups can be formed'],
      ['{end}', '{step1}'],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error', 'psl/reversed-operation'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P3 WORK BACKWARDS: TWO-STEP  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-wb-twostep-01',
    skillId: 'psl-p3-wb-two-step', structure: 'workBackwards', heuristic: 'work-backwards',
    operations: ['addition', 'addition'], difficulty: 2,
    contexts: [
      { setting: 'mama shop', item: 'packets of tissue', verb1: 'sold', verb2: 'gave away', endVerb: 'had left' },
      { setting: 'school bookshop', item: 'erasers', verb1: 'sold', verb2: 'gave to teachers', endVerb: 'had left' },
    ],
    constraints: { end: { min: 10, max: 80 }, step1: { min: 5, max: 30 }, step2: { min: 5, max: 30 } },
    storyTemplate: '{nameA} {verb1} {step1} {item} in the morning and {verb2} {step2} {item} in the afternoon. {nameA} {endVerb} {end} {item} at the end of the day. How many {item} did {nameA} have at first?',
    solutionTemplate: 'Step 1: Start from the end — {nameA} has {end} {item} left.\nStep 2: Undo step 2 — add back what was {verb2}: {end} + {step2} = {mid}.\nStep 3: Undo step 1 — add back what was {verb1}: {mid} + {step1} = {answer}.\nAnswer: {answer} {item}.',
    scaffold: wbTwoStepScaffold(
      ['Finding the starting amount after two reductions', 'Finding the total sold and given away', 'Sharing items between morning and afternoon', 'Comparing morning and afternoon sales'],
      ['How many {item} {nameA} had at first', 'How many {item} were sold in the morning', 'The total given away', 'How many are left after the morning'],
      ['{end}', '{step1}', '{step2}'],
      [
        { operation: 'addition', expression: '{end} + {step1}', label: 'Reverse step 1: add back what was sold' },
        { operation: 'addition', expression: '... + {step2}', label: 'Reverse step 2: add back what was given away' },
      ],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error', 'psl/reversed-operation', 'psl/skipped-step'] },
  },
  {
    templateId: 'psl-tpl-wb-twostep-02',
    skillId: 'psl-p3-wb-two-step', structure: 'workBackwards', heuristic: 'work-backwards',
    operations: ['addition', 'subtraction'], difficulty: 2,
    contexts: [
      { setting: 'market', item: 'apples', verb1: 'gave away', verb2: 'bought', endVerb: 'had' },
      { setting: 'HDB void deck', item: 'potted plants', verb1: 'gave to neighbours', verb2: 'received from a friend', endVerb: 'had' },
    ],
    constraints: { end: { min: 10, max: 80 }, step1: { min: 5, max: 30 }, step2: { min: 5, max: 30 } },
    storyTemplate: '{nameA} {verb1} {step1} {item} at the {setting}, then {verb2} {step2} more {item}. {nameA} {endVerb} {end} {item} in the end. How many {item} did {nameA} have at first?',
    solutionTemplate: 'Step 1: Start from the end — {nameA} has {end} {item}.\nStep 2: Undo step 2 — reverse the buying: {end} - {step2} = {mid}.\nStep 3: Undo step 1 — add back what was {verb1}: {mid} + {step1} = {answer}.\nAnswer: {answer} {item}.',
    scaffold: wbTwoStepScaffold(
      ['Finding the starting amount after giving and receiving', 'Finding the difference between two actions', 'Combining two groups of items', 'Splitting items into portions'],
      ['How many {item} {nameA} had at first', 'How many {item} were given away', 'How many were bought', 'The total number of {item}'],
      ['{end}', '{step1}', '{step2}'],
      [
        { operation: 'subtraction', expression: '{end} - {step2}', label: 'Reverse step 2: undo the buying' },
        { operation: 'addition', expression: '... + {step1}', label: 'Reverse step 1: add back what was given away' },
      ],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error', 'psl/reversed-operation', 'psl/skipped-step'] },
  },
  {
    templateId: 'psl-tpl-wb-twostep-03',
    skillId: 'psl-p3-wb-two-step', structure: 'workBackwards', heuristic: 'work-backwards',
    operations: ['addition', 'addition'], difficulty: 2,
    contexts: [
      { setting: 'kopitiam', item: 'kaya toast sets', verb1: 'sold during breakfast', verb2: 'sold during lunch', endVerb: 'were left unsold' },
      { setting: 'bakery', item: 'pineapple tarts', verb1: 'sold in the morning', verb2: 'sold in the afternoon', endVerb: 'were left' },
    ],
    constraints: { end: { min: 10, max: 80 }, step1: { min: 5, max: 30 }, step2: { min: 5, max: 30 } },
    storyTemplate: 'A {setting} {verb1} {step1} {item} and {verb2} {step2} {item}. There {endVerb} {end} {item} at the end. How many {item} were there at first?',
    solutionTemplate: 'Step 1: Start from the end — there were {end} {item} left.\nStep 2: Undo step 2 — add back what was {verb2}: {end} + {step2} = {mid}.\nStep 3: Undo step 1 — add back what was {verb1}: {mid} + {step1} = {answer}.\nAnswer: {answer} {item}.',
    scaffold: wbTwoStepScaffold(
      ['Finding the original stock before two rounds of sales', 'Finding the total number sold', 'Comparing breakfast and lunch sales', 'Dividing items between time periods'],
      ['How many {item} there were at first', 'The total number sold', 'The difference between breakfast and lunch', 'How many were left'],
      ['{end}', '{step1}', '{step2}'],
      [
        { operation: 'addition', expression: '{end} + {step1}', label: 'Reverse step 1: add back breakfast sales' },
        { operation: 'addition', expression: '... + {step2}', label: 'Reverse step 2: add back lunch sales' },
      ],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error', 'psl/reversed-operation', 'psl/skipped-step'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P4 WORK BACKWARDS: MULTI-OPERATION  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-wb-multiop-01',
    skillId: 'psl-p4-wb-multi-op', structure: 'workBackwards', heuristic: 'work-backwards',
    operations: ['addition', 'multiplication'], difficulty: 3,
    contexts: [
      { setting: 'hawker centre', item: 'bowls of laksa', verb1: 'sold', verb2: 'packed into bags of', endVerb: 'bowls were left' },
      { setting: 'food court', item: 'plates of nasi lemak', verb1: 'sold', verb2: 'packed into boxes of', endVerb: 'plates were left' },
    ],
    constraints: { valA: { min: 5, max: 40 }, valB: { min: 2, max: 5 }, valC: { min: 3, max: 20 } },
    storyTemplate: '{nameA} {verb1} {valA} {item} and {verb2} {valB} for delivery, making {valC} bags. There were {end} {endVerb}. How many {item} did {nameA} start with?',
    solutionTemplate: 'Step 1: Start from the end — {end} {item} were left.\nStep 2: Find the packed amount — {valB} per bag × {valC} bags = {packed}.\nStep 3: Add back what was sold — {packed} + {valA} = {subtotal}. Add the leftovers — {subtotal} + {end} = {answer}.\nAnswer: {answer} {item}.',
    scaffold: wbMultiStepScaffold(
      ['Finding the starting amount after selling and packing', 'Comparing sold and packed amounts', 'Finding how many bags were made', 'Dividing items equally'],
      ['How many {item} {nameA} started with', 'How many were packed', 'How many bags were made', 'How many were sold'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'multiplication', expression: '{valB} × {valC}', label: 'Find total packed for delivery' },
        { operation: 'addition', expression: '... + {valA}', label: 'Add back what was sold' },
      ],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error', 'psl/reversed-operation', 'psl/wrong-operation-choice'] },
  },
  {
    templateId: 'psl-tpl-wb-multiop-02',
    skillId: 'psl-p4-wb-multi-op', structure: 'workBackwards', heuristic: 'work-backwards',
    operations: ['multiplication', 'addition'], difficulty: 3,
    contexts: [
      { setting: 'community centre', item: 'goodie bags', verb1: 'gave 1 each to', verb2: 'had left over' },
      { setting: 'school hall', item: 'bookmarks', verb1: 'gave 1 each to', verb2: 'had remaining' },
    ],
    constraints: { valA: { min: 20, max: 120 }, valB: { min: 3, max: 15 }, valC: { min: 5, max: 30 } },
    storyTemplate: 'At the {setting}, {nameA} {verb1} {valA} children and then gave {valB} extra to the helpers. {nameA} {verb2} {valC} {item}. How many {item} did {nameA} have at first?',
    solutionTemplate: 'Step 1: Start from the end — {nameA} had {valC} {item} left over.\nStep 2: Total given away — {valA} to children + {valB} to helpers = {given}.\nStep 3: Add back the leftovers — {given} + {valC} = {answer}.\nAnswer: {answer} {item}.',
    scaffold: wbMultiStepScaffold(
      ['Finding the starting amount after distributing to children and helpers', 'Comparing children and helpers', 'Finding how many each child received', 'Finding the number of helpers'],
      ['How many {item} {nameA} had at first', 'How many children received {item}', 'How many helpers there were', 'How many were left over'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'addition', expression: '{valA} + {valB}', label: 'Find total given away (children + helpers)' },
        { operation: 'addition', expression: '... + {valC}', label: 'Add back the leftovers' },
      ],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error', 'psl/reversed-operation', 'psl/wrong-operation-choice'] },
  },
  {
    templateId: 'psl-tpl-wb-multiop-03',
    skillId: 'psl-p4-wb-multi-op', structure: 'workBackwards', heuristic: 'work-backwards',
    operations: ['subtraction', 'multiplication'], difficulty: 3,
    contexts: [
      { setting: 'NTUC FairPrice', item: 'cartons of milk', verb1: 'bought', verb2: 'returned' },
      { setting: 'Popular bookshop', item: 'packs of colour pencils', verb1: 'bought', verb2: 'returned' },
    ],
    constraints: { valA: { min: 3, max: 8 }, valB: { min: 5, max: 15 }, valC: { min: 2, max: 5 } },
    storyTemplate: '{nameA} {verb1} some {item} at {setting}. {nameA} {verb2} {valC} {item} that were damaged. {nameA} then arranged the remaining {item} equally on {valA} shelves with {valB} on each shelf. How many {item} did {nameA} buy at first?',
    solutionTemplate: 'Step 1: Start from the arranged items — {valA} shelves × {valB} each = {arranged}.\nStep 2: Add back the returned items — {arranged} + {valC} = {answer}.\nAnswer: {answer} {item}.',
    scaffold: wbMultiStepScaffold(
      ['Finding the original number bought before returns and arranging', 'Finding how many fit on each shelf', 'Finding the number of shelves needed', 'Comparing damaged and undamaged items'],
      ['How many {item} {nameA} bought at first', 'How many are on each shelf', 'How many shelves were used', 'How many were damaged'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'multiplication', expression: '{valA} × {valB}', label: 'Find total arranged on shelves' },
        { operation: 'addition', expression: '... + {valC}', label: 'Add back the returned items' },
      ],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error', 'psl/reversed-operation', 'psl/wrong-operation-choice'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P4 WORK BACKWARDS: CHAIN  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-wb-chain-01',
    skillId: 'psl-p4-wb-chain', structure: 'workBackwards', heuristic: 'work-backwards',
    operations: ['addition', 'addition', 'addition'], difficulty: 3,
    contexts: [
      { setting: 'Jurong Bird Park', item: 'postcards', person1: 'sister', person2: 'brother', person3: 'cousin' },
      { setting: 'Gardens by the Bay', item: 'souvenir keychains', person1: 'father', person2: 'mother', person3: 'uncle' },
    ],
    constraints: { valA: { min: 5, max: 20 }, valB: { min: 5, max: 20 }, valC: { min: 5, max: 20 } },
    storyTemplate: '{nameA} gave {valA} {item} to {person1}, {valB} {item} to {person2}, and {valC} {item} to {person3} at {setting}. {nameA} had {end} {item} left. How many {item} did {nameA} have at first?',
    solutionTemplate: 'Step 1: Start from the end — {nameA} had {end} {item} left.\nStep 2: Undo step 3 — add back {person3}\u2019s share: {end} + {valC} = {mid2}.\nStep 3: Undo step 2 — add back {person2}\u2019s share: {mid2} + {valB} = {mid1}.\nStep 4: Undo step 1 — add back {person1}\u2019s share: {mid1} + {valA} = {answer}.\nAnswer: {answer} {item}.',
    scaffold: wbMultiStepScaffold(
      ['Finding the starting amount after giving to three people', 'Comparing what each person received', 'Finding who got the most', 'Sharing equally among three people'],
      ['How many {item} {nameA} had at first', 'How many {person1} received', 'The total given to all three', 'How many each person should get'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'addition', expression: '{end} + {valC}', label: 'Reverse step 3: add back what cousin received' },
        { operation: 'addition', expression: '... + {valB}', label: 'Reverse step 2: add back what brother received' },
        { operation: 'addition', expression: '... + {valA}', label: 'Reverse step 1: add back what sister received' },
      ],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error', 'psl/skipped-step', 'psl/reversed-operation'] },
  },
  {
    templateId: 'psl-tpl-wb-chain-02',
    skillId: 'psl-p4-wb-chain', structure: 'workBackwards', heuristic: 'work-backwards',
    operations: ['subtraction', 'addition', 'addition'], difficulty: 3,
    contexts: [
      { setting: 'Tampines', item: 'trading cards', action1: 'won', action2: 'lost', action3: 'gave away' },
      { setting: 'Clementi', item: 'rubber bands', action1: 'received', action2: 'lost', action3: 'used' },
    ],
    constraints: { valA: { min: 5, max: 25 }, valB: { min: 5, max: 25 }, valC: { min: 3, max: 15 } },
    storyTemplate: '{nameA} from {setting} {action1} {valA} {item}, {action2} {valB} {item}, and {action3} {valC} {item}. {nameA} ended up with {end} {item}. How many {item} did {nameA} have at first?',
    solutionTemplate: 'Step 1: Start from the end — {nameA} had {end} {item}.\nStep 2: Undo step 3 — add back what was {action3}: {end} + {valC} = {mid2}.\nStep 3: Undo step 2 — add back what was {action2}: {mid2} + {valB} = {mid1}.\nStep 4: Undo step 1 — remove what was {action1}: {mid1} - {valA} = {answer}.\nAnswer: {answer} {item}.',
    scaffold: wbMultiStepScaffold(
      ['Finding the starting amount after winning, losing and giving', 'Finding the total won', 'Comparing items won and lost', 'Splitting items into groups'],
      ['How many {item} {nameA} had at first', 'How many {item} were won', 'The total lost and given away', 'The difference between won and lost'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'addition', expression: '{end} + {valC}', label: 'Reverse step 3: add back what was given away' },
        { operation: 'addition', expression: '... + {valB}', label: 'Reverse step 2: add back what was lost' },
        { operation: 'subtraction', expression: '... - {valA}', label: 'Reverse step 1: remove what was won' },
      ],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error', 'psl/skipped-step', 'psl/reversed-operation'] },
  },
  {
    templateId: 'psl-tpl-wb-chain-03',
    skillId: 'psl-p4-wb-chain', structure: 'workBackwards', heuristic: 'work-backwards',
    operations: ['addition', 'subtraction', 'addition'], difficulty: 3,
    contexts: [
      { setting: 'Punggol Waterway', item: 'fish', action1: 'caught', action2: 'released back', action3: 'caught more' },
      { setting: 'East Coast Park', item: 'seashells', action1: 'collected', action2: 'threw back', action3: 'found more' },
    ],
    constraints: { valA: { min: 5, max: 30 }, valB: { min: 3, max: 15 }, valC: { min: 5, max: 20 } },
    storyTemplate: 'At {setting}, {nameA} {action1} {valA} {item}. Later, {nameA} {action2} {valB} {item} and then {action3} {valC} {item}. {nameA} had {end} {item} at the end. How many {item} did {nameA} start with?',
    solutionTemplate: 'Step 1: Start from the end — {nameA} had {end} {item}.\nStep 2: Undo step 3 — remove the extra {action3}: {end} - {valC} = {mid2}.\nStep 3: Undo step 2 — add back what was {action2}: {mid2} + {valB} = {mid1}.\nStep 4: Undo step 1 — remove what was {action1}: {mid1} - {valA} = {answer}.\nAnswer: {answer} {item}.',
    scaffold: wbMultiStepScaffold(
      ['Finding the starting amount after a series of gains and losses', 'Finding the total number caught', 'Comparing caught and released', 'Sharing items equally'],
      ['How many {item} {nameA} started with', 'How many were caught in total', 'How many were released', 'The final number of {item}'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'subtraction', expression: '{end} - {valC}', label: 'Reverse step 3: remove the extra found' },
        { operation: 'addition', expression: '... + {valB}', label: 'Reverse step 2: add back what was released' },
        { operation: 'subtraction', expression: '... - {valA}', label: 'Reverse step 1: remove what was caught' },
      ],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error', 'psl/skipped-step', 'psl/reversed-operation'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P5 WORK BACKWARDS: FRACTION  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-wb-fraction-01',
    skillId: 'psl-p5-wb-fraction', structure: 'workBackwards', heuristic: 'work-backwards',
    operations: ['multiplication', 'division'], difficulty: 4,
    contexts: [
      { setting: 'tuition centre', item: 'assessment books', fraction: '1/4', fractionWord: 'a quarter' },
      { setting: 'community library', item: 'storybooks', fraction: '1/3', fractionWord: 'one third' },
    ],
    constraints: { valA: { min: 8, max: 60 }, valB: { min: 3, max: 4 }, valC: { min: 10, max: 50 } },
    storyTemplate: '{nameA} gave {fractionWord} of her {item} to {nameB} and had {valC} {item} left. How many {item} did {nameA} have at first?',
    solutionTemplate: 'Step 1: {nameA} gave {fractionWord} away, so the remainder is ({valB} - 1)/{valB} of the whole.\nStep 2: {valC} {item} represent ({valB} - 1) units. One unit = {valC} ÷ ({valB} - 1) = {unit}.\nStep 3: Original whole = {unit} × {valB} = {answer}.\nAnswer: {answer} {item}.',
    scaffold: wbMultiStepScaffold(
      ['Finding the original amount when a fraction was given away', 'Finding the fraction given away', 'Comparing two people\'s collections', 'Dividing into equal parts'],
      ['How many {item} {nameA} had at first', 'How many were given to {nameB}', 'The fraction remaining', 'How many each person has now'],
      ['{valC}', '{fraction}'],
      [
        { operation: 'division', expression: '{valC} ÷ ({valB} - 1)', label: 'Find the value of one fraction unit' },
        { operation: 'multiplication', expression: '... × {valB}', label: 'Multiply to find the original whole' },
      ],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/fraction-of-whole-error', 'psl/arithmetic-error', 'psl/reversed-operation'] },
  },
  {
    templateId: 'psl-tpl-wb-fraction-02',
    skillId: 'psl-p5-wb-fraction', structure: 'workBackwards', heuristic: 'work-backwards',
    operations: ['division', 'multiplication'], difficulty: 4,
    contexts: [
      { setting: 'Takashimaya', item: 'mooncakes', fraction: '2/5', fractionWord: 'two fifths' },
      { setting: 'bakery', item: 'egg tarts', fraction: '3/8', fractionWord: 'three eighths' },
    ],
    constraints: { valA: { min: 10, max: 80 }, valB: { min: 5, max: 8 }, valC: { min: 10, max: 60 } },
    storyTemplate: 'A {setting} sold {fractionWord} of its {item}. There were {valC} {item} left. How many {item} did the {setting} have at first?',
    solutionTemplate: 'Step 1: The {setting} sold {fractionWord}, so the remaining fraction has (remaining) units.\nStep 2: {valC} {item} left ÷ remaining units = {unit} per unit.\nStep 3: Original total = {unit} × {valB} = {answer}.\nAnswer: {answer} {item}.',
    scaffold: wbMultiStepScaffold(
      ['Finding the original stock when a fraction was sold', 'Finding how many were sold', 'Splitting items into equal groups', 'Comparing sold and unsold portions'],
      ['How many {item} the {setting} had at first', 'How many were sold', 'The fraction that was left', 'How many each group gets'],
      ['{valC}', '{fraction}'],
      [
        { operation: 'division', expression: '{valC} ÷ (remaining units)', label: 'Find the value of one fraction unit' },
        { operation: 'multiplication', expression: '... × {valB}', label: 'Multiply to find the original total' },
      ],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/fraction-of-whole-error', 'psl/arithmetic-error', 'psl/reversed-operation'] },
  },
  {
    templateId: 'psl-tpl-wb-fraction-03',
    skillId: 'psl-p5-wb-fraction', structure: 'workBackwards', heuristic: 'work-backwards',
    operations: ['division', 'multiplication', 'addition'], difficulty: 4,
    contexts: [
      { setting: 'pasar malam', item: 'satay sticks', fraction: '1/3', fractionWord: 'one third' },
      { setting: 'food stall', item: 'popiah rolls', fraction: '1/4', fractionWord: 'a quarter' },
    ],
    constraints: { valA: { min: 3, max: 4 }, valB: { min: 5, max: 20 }, valC: { min: 12, max: 60 } },
    storyTemplate: '{nameA} ate {fractionWord} of the {item} at the {setting} and then ate {valB} more. There were {valC} {item} left. How many {item} were there at first?',
    solutionTemplate: 'Step 1: Start from the end — {valC} {item} left.\nStep 2: Add back the extra eaten — {valC} + {valB} = {afterFraction}.\nStep 3: {afterFraction} represents the remaining fraction units. One unit = {afterFraction} ÷ remaining units = {unit}.\nStep 4: Original whole = {unit} × {valA} = {answer}.\nAnswer: {answer} {item}.',
    scaffold: wbMultiStepScaffold(
      ['Finding the original amount after eating a fraction and some more', 'Finding the fraction eaten', 'Comparing eaten and remaining', 'Dividing items among people'],
      ['How many {item} were there at first', 'How many were eaten in total', 'The fraction that was left', 'How many each person ate'],
      ['{valC}', '{fraction}', '{valB}'],
      [
        { operation: 'addition', expression: '{valC} + {valB}', label: 'Add back the extra eaten' },
        { operation: 'division', expression: '... ÷ (remaining fraction units)', label: 'Find the value of one unit' },
        { operation: 'multiplication', expression: '... × {valA}', label: 'Multiply to find the whole' },
      ],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/fraction-of-whole-error', 'psl/arithmetic-error', 'psl/skipped-step'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P5 WORK BACKWARDS: TWO-PERSON  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-wb-twoperson-01',
    skillId: 'psl-p5-wb-two-person', structure: 'workBackwards', heuristic: 'work-backwards',
    operations: ['addition', 'subtraction'], difficulty: 4,
    contexts: [
      { setting: 'Sentosa', item: 'tokens', verb1: 'gave', verb2: 'received from a friend' },
      { setting: 'arcade', item: 'game tickets', verb1: 'gave', verb2: 'won from a machine' },
    ],
    constraints: { valA: { min: 10, max: 50 }, valB: { min: 5, max: 30 }, valC: { min: 5, max: 30 } },
    storyTemplate: '{nameA} {verb1} {valA} {item} to {nameB} at {setting}. Then {nameA} {verb2} {valB} {item}. {nameA} ended with {valC} {item} and {nameB} ended with {end} {item}. How many {item} did each person have at first?',
    solutionTemplate: 'Step 1: Start from the end — {nameA} had {valC} {item}.\nStep 2: Undo the receiving — {valC} - {valB} = {mid}.\nStep 3: Undo the giving — {mid} + {valA} = {answer}.\nAnswer: {nameA} had {answer} {item} at first.',
    scaffold: wbMultiStepScaffold(
      ['Finding original amounts for two people after transfers', 'Comparing final amounts', 'Finding the total tokens', 'Sharing equally between two people'],
      ['How many {item} each person had at first', 'How many {nameA} gave away', 'The total {item} at the end', 'How many more {nameB} has now'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'subtraction', expression: '{valC} - {valB}', label: 'Reverse: undo what {nameA} received' },
        { operation: 'addition', expression: '... + {valA}', label: 'Reverse: add back what {nameA} gave away' },
      ],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error', 'psl/reversed-operation', 'psl/skipped-step'] },
  },
  {
    templateId: 'psl-tpl-wb-twoperson-02',
    skillId: 'psl-p5-wb-two-person', structure: 'workBackwards', heuristic: 'work-backwards',
    operations: ['addition', 'addition'], difficulty: 4,
    contexts: [
      { setting: 'Changi Airport', item: 'chocolates', verb1: 'shared', verb2: 'shared again' },
      { setting: 'Vivocity', item: 'coupons', verb1: 'transferred', verb2: 'transferred more' },
    ],
    constraints: { valA: { min: 8, max: 40 }, valB: { min: 5, max: 25 }, valC: { min: 10, max: 50 } },
    storyTemplate: '{nameA} {verb1} {valA} {item} with {nameB} and later {verb2} {valB} more {item} to {nameB} at {setting}. {nameA} had {valC} {item} left. How many {item} did {nameA} have at first?',
    solutionTemplate: 'Step 1: Start from the end — {nameA} had {valC} {item} left.\nStep 2: Undo step 2 — add back the second share: {valC} + {valB} = {mid}.\nStep 3: Undo step 1 — add back the first share: {mid} + {valA} = {answer}.\nAnswer: {answer} {item}.',
    scaffold: wbMultiStepScaffold(
      ['Finding the original amount after sharing twice', 'Finding the total shared', 'Comparing what was shared each time', 'Dividing into two groups'],
      ['How many {item} {nameA} had at first', 'The total {item} shared', 'How many were shared the second time', 'How many {nameB} received'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'addition', expression: '{valC} + {valB}', label: 'Reverse step 2: add back the second share' },
        { operation: 'addition', expression: '... + {valA}', label: 'Reverse step 1: add back the first share' },
      ],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error', 'psl/reversed-operation', 'psl/skipped-step'] },
  },
  {
    templateId: 'psl-tpl-wb-twoperson-03',
    skillId: 'psl-p5-wb-two-person', structure: 'workBackwards', heuristic: 'work-backwards',
    operations: ['subtraction', 'addition', 'subtraction'], difficulty: 4,
    contexts: [
      { setting: 'school canteen', item: 'drink coupons', personC: 'teacher' },
      { setting: 'class party', item: 'sweets', personC: 'class monitor' },
    ],
    constraints: { valA: { min: 5, max: 20 }, valB: { min: 5, max: 20 }, valC: { min: 3, max: 15 } },
    storyTemplate: '{nameA} gave {valA} {item} to {nameB} at the {setting}. {nameB} then gave {valC} {item} to the {personC} and received {valB} {item} from {nameA}. {nameA} had {end} {item} left. How many {item} did {nameA} have at first?',
    solutionTemplate: 'Step 1: Start from the end — {nameA} had {end} {item} left.\nStep 2: Undo the second transfer — add back {valB}: {end} + {valB} = {mid}.\nStep 3: Undo the first transfer — add back {valA}: {mid} + {valA} = {answer}.\nAnswer: {answer} {item}.',
    scaffold: wbMultiStepScaffold(
      ['Finding the original amount after multiple transfers between people', 'Finding how many the teacher received', 'Comparing what each person gave', 'Finding the total given away'],
      ['How many {item} {nameA} had at first', 'How many the {personC} received', 'The total transferred', 'How many {nameB} has now'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'addition', expression: '{end} + {valB}', label: 'Reverse: add back second transfer to {nameB}' },
        { operation: 'addition', expression: '... + {valA}', label: 'Reverse: add back first transfer to {nameB}' },
      ],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error', 'psl/reversed-operation', 'psl/skipped-step'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P6 WORK BACKWARDS: PERCENTAGE  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-wb-percentage-01',
    skillId: 'psl-p6-wb-percentage', structure: 'workBackwards', heuristic: 'work-backwards',
    operations: ['division', 'multiplication'], difficulty: 5,
    contexts: [
      { setting: 'NTUC FairPrice', item: 'bottles of cooking oil', pct: 20, pctWord: '20%' },
      { setting: 'Sheng Siong', item: 'bags of rice', pct: 25, pctWord: '25%' },
    ],
    constraints: { valA: { min: 20, max: 80 }, valB: { min: 20, max: 25 }, valC: { min: 40, max: 200 } },
    storyTemplate: '{setting} sold {pctWord} of its {item} during a sale. There were {valC} {item} left. How many {item} did the store have before the sale?',
    solutionTemplate: 'Step 1: {pctWord} was sold, so {valC} {item} left = (100 - {valB})% of the original.\nStep 2: Find 1% — {valC} ÷ (100 - {valB}) = {onePercent}.\nStep 3: Original total — {onePercent} × 100 = {answer}.\nAnswer: {answer} {item}.',
    scaffold: wbMultiStepScaffold(
      ['Finding the original stock when a percentage was sold', 'Finding the percentage sold', 'Comparing sold and remaining percentages', 'Dividing items among shelves'],
      ['How many {item} the store had before the sale', 'How many were sold', 'The percentage remaining', 'How many shelves were used'],
      ['{valC}', '{pctWord}'],
      [
        { operation: 'subtraction', expression: '100 - {valB}', label: 'Find the remaining percentage' },
        { operation: 'division', expression: '{valC} ÷ (remaining %)', label: 'Find 1% of the original' },
        { operation: 'multiplication', expression: '... × 100', label: 'Find the original total (100%)' },
      ],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/percentage-of-whole-error', 'psl/arithmetic-error', 'psl/reversed-operation'] },
  },
  {
    templateId: 'psl-tpl-wb-percentage-02',
    skillId: 'psl-p6-wb-percentage', structure: 'workBackwards', heuristic: 'work-backwards',
    operations: ['division', 'multiplication'], difficulty: 5,
    contexts: [
      { setting: 'Primary school', item: 'students', pct: 40, pctWord: '40%' },
      { setting: 'tuition centre', item: 'pupils', pct: 30, pctWord: '30%' },
    ],
    constraints: { valA: { min: 30, max: 40 }, valB: { min: 30, max: 100 }, valC: { min: 60, max: 250 } },
    storyTemplate: '{pctWord} of the {item} at the {setting} are girls. There are {valC} boys. How many {item} are there in total?',
    solutionTemplate: 'Step 1: {pctWord} of {item} are girls, so boys = (100 - {valA})%.\nStep 2: {valC} boys represent (100 - {valA})%. Find 1% — {valC} ÷ (100 - {valA}) = {onePercent}.\nStep 3: Total = {onePercent} × 100 = {answer}.\nAnswer: {answer} {item}.',
    scaffold: wbMultiStepScaffold(
      ['Finding the total when a percentage represents one group', 'Finding the number of girls', 'Comparing boys and girls', 'Dividing into equal classes'],
      ['The total number of {item}', 'How many are girls', 'The percentage of boys', 'How many classes there are'],
      ['{valC}', '{pctWord}'],
      [
        { operation: 'subtraction', expression: '100 - {valA}', label: 'Find the percentage that are boys' },
        { operation: 'division', expression: '{valC} ÷ (boys %)', label: 'Find 1% of the total' },
        { operation: 'multiplication', expression: '... × 100', label: 'Find the total (100%)' },
      ],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/percentage-of-whole-error', 'psl/arithmetic-error', 'psl/reversed-operation'] },
  },
  {
    templateId: 'psl-tpl-wb-percentage-03',
    skillId: 'psl-p6-wb-percentage', structure: 'workBackwards', heuristic: 'work-backwards',
    operations: ['addition', 'division', 'multiplication'], difficulty: 5,
    contexts: [
      { setting: 'donation drive', item: 'items', pct: 15, pctWord: '15%', extraVerb: 'spoiled' },
      { setting: 'food collection', item: 'cans of food', pct: 10, pctWord: '10%', extraVerb: 'expired' },
    ],
    constraints: { valA: { min: 10, max: 15 }, valB: { min: 5, max: 20 }, valC: { min: 50, max: 200 } },
    storyTemplate: 'During a {setting}, {pctWord} of the {item} were {extraVerb} and {valB} more were lost. {valC} {item} remained. How many {item} were collected originally?',
    solutionTemplate: 'Step 1: Start from the end — {valC} {item} remained.\nStep 2: Add back the extra lost — {valC} + {valB} = {afterPct}. This equals (100 - {valA})% of the original.\nStep 3: Find 1% — {afterPct} ÷ (100 - {valA}) = {onePercent}.\nStep 4: Original total — {onePercent} × 100 = {answer}.\nAnswer: {answer} {item}.',
    scaffold: wbMultiStepScaffold(
      ['Finding the original collection after percentage loss and additional loss', 'Finding the percentage spoiled', 'Comparing spoiled and lost amounts', 'Dividing items into groups'],
      ['How many {item} were collected originally', 'How many were {extraVerb}', 'The percentage remaining', 'How many were lost'],
      ['{valC}', '{pctWord}', '{valB}'],
      [
        { operation: 'addition', expression: '{valC} + {valB}', label: 'Add back the lost items' },
        { operation: 'division', expression: '... ÷ (100 - {valA})', label: 'Find 1% of the original' },
        { operation: 'multiplication', expression: '... × 100', label: 'Find the original total (100%)' },
      ],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/percentage-of-whole-error', 'psl/arithmetic-error', 'psl/skipped-step'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P6 WORK BACKWARDS: COMPLEX  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-wb-complex-01',
    skillId: 'psl-p6-wb-complex', structure: 'workBackwards', heuristic: 'work-backwards',
    operations: ['addition', 'multiplication', 'division'], difficulty: 6,
    contexts: [
      { setting: 'Orchard Road shop', item: 'watches', discount: '1/4', discountWord: 'a quarter' },
      { setting: 'Bugis Street stall', item: 'bracelets', discount: '1/3', discountWord: 'one third' },
    ],
    constraints: { valA: { min: 3, max: 4 }, valB: { min: 10, max: 50 }, valC: { min: 20, max: 100 } },
    storyTemplate: 'An {setting} discounted its {item} by {discountWord} of the original price and then took off another ${valB}. The final price was ${valC}. What was the original price of each {item}?',
    solutionTemplate: 'Step 1: Start from the end — final price was ${valC}.\nStep 2: Add back the extra discount — {valC} + {valB} = {afterFraction}. This is the price after the fraction discount.\nStep 3: {afterFraction} represents ({valA} - 1)/{valA} of the original. One unit = {afterFraction} ÷ ({valA} - 1) = {unit}.\nStep 4: Original price = {unit} × {valA} = {answer}.\nAnswer: ${answer}.',
    scaffold: wbMultiStepScaffold(
      ['Finding the original price after a fraction discount and additional reduction', 'Finding the discount amount', 'Comparing original and final prices', 'Splitting the price into parts'],
      ['The original price of each {item}', 'The amount of the fraction discount', 'The total discount given', 'The selling price after the first discount'],
      ['{valC}', '{discount}', '{valB}'],
      [
        { operation: 'addition', expression: '{valC} + {valB}', label: 'Add back the extra discount' },
        { operation: 'division', expression: '... ÷ ({valA} - 1)', label: 'Find the value of one fraction unit' },
        { operation: 'multiplication', expression: '... × {valA}', label: 'Multiply to find the original price' },
      ],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/fraction-of-whole-error', 'psl/arithmetic-error', 'psl/skipped-step'] },
  },
  {
    templateId: 'psl-tpl-wb-complex-02',
    skillId: 'psl-p6-wb-complex', structure: 'workBackwards', heuristic: 'work-backwards',
    operations: ['multiplication', 'addition', 'division'], difficulty: 6,
    contexts: [
      { setting: 'Ang Mo Kio library', item: 'books', day1: 'Monday', day2: 'Tuesday', day3: 'Wednesday' },
      { setting: 'Bishan CC', item: 'craft kits', day1: 'morning', day2: 'afternoon', day3: 'evening' },
    ],
    constraints: { valA: { min: 2, max: 3 }, valB: { min: 5, max: 20 }, valC: { min: 10, max: 40 } },
    storyTemplate: 'A {setting} lent out some {item} over three days. On {day2}, it lent out twice as many as {day1}. On {day3}, it lent out {valB} fewer than {day2}. If {valC} {item} were lent on {day3}, how many {item} were lent on {day1}?',
    solutionTemplate: 'Step 1: Start from the end — {valC} {item} were lent on {day3}.\nStep 2: Find {day2} — {day3} was {valB} fewer than {day2}: {valC} + {valB} = {day2Amount}.\nStep 3: Find {day1} — {day2} was twice {day1}: {day2Amount} ÷ {valA} = {answer}.\nAnswer: {answer} {item}.',
    scaffold: wbMultiStepScaffold(
      ['Finding the first day amount working back through relationships', 'Finding the total lent over three days', 'Comparing daily amounts', 'Finding the average per day'],
      ['How many {item} were lent on {day1}', 'The total lent over three days', 'How many more on {day2} than {day3}', 'How many on {day2}'],
      ['{valC}', '{valB}', 'twice'],
      [
        { operation: 'addition', expression: '{valC} + {valB}', label: 'Find {day2} amount ({day3} + fewer)' },
        { operation: 'division', expression: '... ÷ {valA}', label: 'Find {day1} amount ({day2} ÷ multiplier)' },
      ],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error', 'psl/reversed-operation', 'psl/wrong-operation-choice'] },
  },
  {
    templateId: 'psl-tpl-wb-complex-03',
    skillId: 'psl-p6-wb-complex', structure: 'workBackwards', heuristic: 'work-backwards',
    operations: ['addition', 'division', 'multiplication'], difficulty: 6,
    contexts: [
      { setting: 'PSLE preparation class', item: 'practice papers', pct: 25, pctWord: '25%' },
      { setting: 'enrichment workshop', item: 'worksheets', pct: 20, pctWord: '20%' },
    ],
    constraints: { valA: { min: 20, max: 25 }, valB: { min: 10, max: 30 }, valC: { min: 5, max: 15 } },
    storyTemplate: '{nameA} completed {pctWord} of the {item} in the {setting}, then completed {valB} more, and finally completed another {valC}. {nameA} still had {end} {item} left. How many {item} were there in total?',
    solutionTemplate: 'Step 1: Start from the end — {nameA} had {end} {item} left.\nStep 2: Add back the later completions — {end} + {valC} + {valB} = {afterPct}. This equals (100 - {valA})% of the total.\nStep 3: Find 1% — {afterPct} ÷ (100 - {valA}) = {onePercent}.\nStep 4: Total = {onePercent} × 100 = {answer}.\nAnswer: {answer} {item}.',
    scaffold: wbMultiStepScaffold(
      ['Finding the original total after percentage and numerical completions', 'Finding the total number completed', 'Comparing percentage and numerical completions', 'Finding the percentage remaining'],
      ['How many {item} there were in total', 'How many {nameA} completed in total', 'The percentage completed', 'How many are still remaining'],
      ['{pctWord}', '{valB}', '{valC}'],
      [
        { operation: 'addition', expression: '{end} + {valC} + {valB}', label: 'Find total after percentage completion' },
        { operation: 'division', expression: '... ÷ (100 - {valA})', label: 'Find the value of 1%' },
        { operation: 'multiplication', expression: '... × 100', label: 'Find the total (100%)' },
      ],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/percentage-of-whole-error', 'psl/arithmetic-error', 'psl/skipped-step'] },
  },
];

// ── Seed runner ─────────────────────────────────────────────────────

async function seed() {
  await connectDB();
  console.log(`Seeding ${TEMPLATES.length} Work-Backwards templates …`);

  for (const tpl of TEMPLATES) {
    await PSLProblemTemplate.findOneAndUpdate(
      { templateId: tpl.templateId },
      tpl,
      { upsert: true, new: true },
    );
    console.log(`  ✓ ${tpl.templateId}`);
  }

  console.log('Done.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
