import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLProblemTemplate from '../models/psl/PSLProblemTemplate.js';

// ── Before-After heuristic scaffold helpers ──────────────────────────

function baAddScaffold(understandChoices, questionChoices, highlightFields) {
  return {
    understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: understandChoices },
    identify_info: { type: 'highlight', expected: highlightFields },
    identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: questionChoices },
    plan: { type: 'strategySelect', prompt: 'What strategy should we use?', correctIndex: 0, choices: ['Draw a before-after diagram', 'Draw a bar model', 'Work backwards', 'Guess and check'] },
    solve: { type: 'expression', operation: 'addition', expression: '{start} + {change}', answer: '{answer}' },
    check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
  };
}

function baSubScaffold(understandChoices, questionChoices, highlightFields) {
  return {
    understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: understandChoices },
    identify_info: { type: 'highlight', expected: highlightFields },
    identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: questionChoices },
    plan: { type: 'strategySelect', prompt: 'What strategy should we use?', correctIndex: 0, choices: ['Draw a before-after diagram', 'Draw a bar model', 'Work backwards', 'Guess and check'] },
    solve: { type: 'expression', operation: 'subtraction', expression: '{start} - {change}', answer: '{answer}' },
    check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
  };
}

function baTwoStepScaffold(understandChoices, questionChoices, highlightFields, steps) {
  return {
    understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: understandChoices },
    identify_info: { type: 'highlight', expected: highlightFields },
    identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: questionChoices },
    plan: { type: 'strategySelect', prompt: 'What strategy should we use?', correctIndex: 0, choices: ['Draw a before-after diagram', 'Draw a bar model', 'Work backwards', 'Guess and check'] },
    solve: { type: 'twoStep', steps, answer: '{answer}' },
    check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
  };
}

const TEMPLATES = [
  // ══════════════════════════════════════════════════════════════════════
  //  P3 BEFORE-AFTER: ADDITION  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-ba-add-01',
    skillId: 'psl-p3-ba-add', structure: 'beforeAfter', heuristic: 'before-after',
    operations: ['addition'], difficulty: 1,
    contexts: [
      { setting: 'library', item: 'storybooks', verb: 'had', gainVerb: 'received' },
      { setting: 'garden', item: 'orchid plants', verb: 'had', gainVerb: 'planted' },
    ],
    constraints: { start: { min: 20, max: 200 }, change: { min: 10, max: 80 } },
    storyTemplate: '{nameA} {verb} {start} {item} in the {setting}. {nameA} {gainVerb} {change} more {item}. How many {item} does {nameA} have now?',
    scaffold: baAddScaffold(
      ['Someone gaining more items', 'Someone giving items away', 'Comparing two collections', 'Sharing items equally'],
      ['The total number of {item} now', 'How many {item} were given away', 'The difference between before and after', 'How many {item} each person gets'],
      ['{start}', '{change}'],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-ba-add-02',
    skillId: 'psl-p3-ba-add', structure: 'beforeAfter', heuristic: 'before-after',
    operations: ['addition'], difficulty: 1,
    contexts: [
      { setting: 'hawker centre', item: 'plates of chicken rice', verb: 'sold', gainVerb: 'sold' },
      { setting: 'bookshop', item: 'comics', verb: 'had', gainVerb: 'bought' },
    ],
    constraints: { start: { min: 20, max: 200 }, change: { min: 10, max: 80 } },
    storyTemplate: 'A {setting} {verb} {start} {item} in the morning. In the afternoon, they {gainVerb} {change} more {item}. How many {item} were {verb} in total?',
    scaffold: baAddScaffold(
      ['Combining morning and afternoon amounts', 'Finding the difference between two time periods', 'Sharing items between two groups', 'Removing items from a collection'],
      ['The total {item}', 'How many fewer in the afternoon', 'How many were left unsold', 'How many each person bought'],
      ['{start}', '{change}'],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-ba-add-03',
    skillId: 'psl-p3-ba-add', structure: 'beforeAfter', heuristic: 'before-after',
    operations: ['addition'], difficulty: 1,
    contexts: [
      { setting: 'aquarium', item: 'tropical fish', verb: 'had', gainVerb: 'added' },
      { setting: 'classroom', item: 'reading books', verb: 'had', gainVerb: 'donated' },
    ],
    constraints: { start: { min: 20, max: 200 }, change: { min: 10, max: 80 } },
    storyTemplate: 'The {setting} {verb} {start} {item}. {nameA} {gainVerb} {change} more {item} to the {setting}. How many {item} are there now?',
    scaffold: baAddScaffold(
      ['A collection growing after adding items', 'Splitting a collection into groups', 'Comparing two collections', 'Taking items away from a group'],
      ['The new total of {item}', 'How many {item} were removed', 'The number of {item} each person gets', 'How many more are needed'],
      ['{start}', '{change}'],
    ),
    misconceptions: { identify_info: ['psl/missed-number', 'psl/included-irrelevant'], solve: ['psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P3 BEFORE-AFTER: SUBTRACTION  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-ba-sub-01',
    skillId: 'psl-p3-ba-sub', structure: 'beforeAfter', heuristic: 'before-after',
    operations: ['subtraction'], difficulty: 1,
    contexts: [
      { setting: 'playground', item: 'marbles', verb: 'had', loseVerb: 'gave away' },
      { setting: 'canteen', item: 'curry puffs', verb: 'had', loseVerb: 'sold' },
    ],
    constraints: { start: { min: 50, max: 300 }, change: { min: 10, max: 100 }, operation: 'subtraction' },
    storyTemplate: '{nameA} {verb} {start} {item}. {nameA} {loseVerb} {change} {item}. How many {item} does {nameA} have left?',
    scaffold: baSubScaffold(
      ['Someone losing or giving away items', 'Someone gaining more items', 'Comparing two amounts', 'Sharing items among friends'],
      ['How many {item} are left', 'The total number of {item}', 'How many more {item} were bought', 'How many friends shared the {item}'],
      ['{start}', '{change}'],
    ),
    misconceptions: { solve: ['psl/wrong-operation', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-ba-sub-02',
    skillId: 'psl-p3-ba-sub', structure: 'beforeAfter', heuristic: 'before-after',
    operations: ['subtraction'], difficulty: 1,
    contexts: [
      { setting: 'farm', item: 'eggs', verb: 'collected', loseVerb: 'broke' },
      { setting: 'orchard', item: 'mangoes', verb: 'picked', loseVerb: 'gave to neighbours' },
    ],
    constraints: { start: { min: 50, max: 300 }, change: { min: 10, max: 100 }, operation: 'subtraction' },
    storyTemplate: '{nameA} {verb} {start} {item} from the {setting}. {nameA} {loseVerb} {change} of them. How many {item} does {nameA} have now?',
    scaffold: baSubScaffold(
      ['Having items and losing some', 'Adding two groups together', 'Dividing items into equal parts', 'Comparing amounts from two places'],
      ['How many {item} remain', 'The total {item} collected', 'How many groups can be formed', 'The difference between two farms'],
      ['{start}', '{change}'],
    ),
    misconceptions: { solve: ['psl/wrong-operation', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-ba-sub-03',
    skillId: 'psl-p3-ba-sub', structure: 'beforeAfter', heuristic: 'before-after',
    operations: ['subtraction'], difficulty: 1,
    contexts: [
      { setting: 'shop', item: 'erasers', verb: 'stocked', loseVerb: 'sold' },
      { setting: 'pond', item: 'tadpoles', verb: 'had', loseVerb: 'released' },
    ],
    constraints: { start: { min: 50, max: 300 }, change: { min: 10, max: 100 }, operation: 'subtraction' },
    storyTemplate: 'The {setting} {verb} {start} {item}. After one week, {change} {item} were {loseVerb}. How many {item} are left in the {setting}?',
    scaffold: baSubScaffold(
      ['A quantity decreasing over time', 'A quantity increasing over time', 'Finding the total of two groups', 'Sharing items equally among people'],
      ['How many {item} are left', 'How many more {item} arrived', 'The total number of {item}', 'How many people shared the {item}'],
      ['{start}', '{change}'],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P4 BEFORE-AFTER: MULTIPLE CHANGES  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-ba-multi-change-01',
    skillId: 'psl-p4-ba-multi-change', structure: 'beforeAfter', heuristic: 'before-after',
    operations: ['addition', 'subtraction'], difficulty: 2,
    contexts: [
      { setting: 'bookshelf', item: 'books', gainVerb: 'bought', loseVerb: 'donated' },
      { setting: 'fish tank', item: 'guppies', gainVerb: 'added', loseVerb: 'gave away' },
    ],
    constraints: { valA: { min: 50, max: 300 }, valB: { min: 10, max: 50 }, valC: { min: 10, max: 50 } },
    storyTemplate: '{nameA} had {valA} {item} on the {setting}. {nameA} {gainVerb} {valB} more {item} and then {loseVerb} {valC} {item}. How many {item} does {nameA} have now?',
    scaffold: baTwoStepScaffold(
      ['A quantity changing twice — first increasing, then decreasing', 'Comparing two different collections', 'Sharing items among three people', 'Finding a missing part of a total'],
      ['The final number of {item}', 'How many {item} were bought', 'The difference between the gain and loss', 'How many people received {item}'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'addition', expression: '{valA} + {valB}', label: 'Add items gained' },
        { operation: 'subtraction', expression: '{valA} + {valB} - {valC}', label: 'Subtract items lost' },
      ],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-model-type'], solve: ['psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-ba-multi-change-02',
    skillId: 'psl-p4-ba-multi-change', structure: 'beforeAfter', heuristic: 'before-after',
    operations: ['addition', 'subtraction'], difficulty: 2,
    contexts: [
      { setting: 'savings jar', item: 'coins', gainVerb: 'earned', loseVerb: 'spent' },
      { setting: 'sticker album', item: 'stickers', gainVerb: 'won', loseVerb: 'traded away' },
    ],
    constraints: { valA: { min: 50, max: 300 }, valB: { min: 10, max: 50 }, valC: { min: 10, max: 50 } },
    storyTemplate: '{nameA} had {valA} {item} in the {setting}. {nameA} {gainVerb} {valB} more {item} from a competition and {loseVerb} {valC} {item}. How many {item} does {nameA} have now?',
    scaffold: baTwoStepScaffold(
      ['Two changes happening to a starting amount', 'Finding the total of three groups', 'Comparing amounts before and after', 'Distributing items evenly'],
      ['The final number of {item}', 'The total {item} earned', 'How many more were earned than spent', 'How many each person has'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'addition', expression: '{valA} + {valB}', label: 'Add items earned' },
        { operation: 'subtraction', expression: '{valA} + {valB} - {valC}', label: 'Subtract items spent' },
      ],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error', 'psl/wrong-operation'] },
  },
  {
    templateId: 'psl-tpl-ba-multi-change-03',
    skillId: 'psl-p4-ba-multi-change', structure: 'beforeAfter', heuristic: 'before-after',
    operations: ['subtraction', 'addition'], difficulty: 2,
    contexts: [
      { setting: 'stamp collection', item: 'stamps', loseVerb: 'gave to a friend', gainVerb: 'found' },
      { setting: 'toy shelf', item: 'figurines', loseVerb: 'lost', gainVerb: 'received as gifts' },
    ],
    constraints: { valA: { min: 50, max: 300 }, valB: { min: 10, max: 50 }, valC: { min: 10, max: 50 } },
    storyTemplate: '{nameA} had {valA} {item} in a {setting}. {nameA} {loseVerb} {valB} {item} but later {gainVerb} {valC} {item}. How many {item} does {nameA} have now?',
    scaffold: baTwoStepScaffold(
      ['A quantity decreasing then increasing', 'Adding three groups together', 'Dividing items into equal parts', 'Comparing two different collections'],
      ['The final number of {item}', 'How many {item} were given away in total', 'The total {item} received', 'How many groups were formed'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'subtraction', expression: '{valA} - {valB}', label: 'Subtract items lost' },
        { operation: 'addition', expression: '{valA} - {valB} + {valC}', label: 'Add items gained' },
      ],
    ),
    misconceptions: { plan: ['psl/wrong-model-type'], solve: ['psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P4 BEFORE-AFTER: FIND THE CHANGE  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-ba-find-change-01',
    skillId: 'psl-p4-ba-find-change', structure: 'beforeAfter', heuristic: 'before-after',
    operations: ['subtraction'], difficulty: 2,
    contexts: [
      { setting: 'school hall', item: 'chairs', verb: 'had' },
      { setting: 'carpark', item: 'cars', verb: 'had' },
    ],
    constraints: { start: { min: 100, max: 500 }, change: { min: 20, max: 150 } },
    storyTemplate: 'The {setting} {verb} {start} {item} at first. After some were removed, there were {start} - {change} {item} left. How many {item} were removed?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: ['Finding how many items were removed', 'Adding items to a collection', 'Comparing two groups', 'Sharing items equally'] },
      identify_info: { type: 'highlight', expected: ['{start}', '{start} - {change}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: ['How many {item} were removed', 'The total number of {item}', 'How many {item} were added', 'How many groups were formed'] },
      plan: { type: 'strategySelect', prompt: 'What strategy should we use?', correctIndex: 0, choices: ['Draw a before-after diagram', 'Draw a bar model', 'Work backwards', 'Guess and check'] },
      solve: { type: 'expression', operation: 'subtraction', expression: '{start} - ({start} - {change})', answer: '{change}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/wrong-operation', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-ba-find-change-02',
    skillId: 'psl-p4-ba-find-change', structure: 'beforeAfter', heuristic: 'before-after',
    operations: ['subtraction'], difficulty: 2,
    contexts: [
      { setting: 'basket', item: 'oranges', action: 'eaten' },
      { setting: 'piggy bank', item: 'coins', action: 'spent' },
    ],
    constraints: { start: { min: 100, max: 500 }, change: { min: 20, max: 150 } },
    storyTemplate: '{nameA} had {start} {item} in a {setting}. After some were {action}, there were {start} - {change} {item} left. How many {item} were {action}?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: ['Finding the amount that changed', 'Combining two groups', 'Sharing items among people', 'Finding the larger amount'] },
      identify_info: { type: 'highlight', expected: ['{start}', '{start} - {change}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: ['How many {item} were {action}', 'The total {item} in the {setting}', 'How many {item} were added', 'How many people shared the {item}'] },
      plan: { type: 'strategySelect', prompt: 'What strategy should we use?', correctIndex: 0, choices: ['Draw a before-after diagram', 'Draw a bar model', 'Work backwards', 'Guess and check'] },
      solve: { type: 'expression', operation: 'subtraction', expression: '{start} - ({start} - {change})', answer: '{change}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-ba-find-change-03',
    skillId: 'psl-p4-ba-find-change', structure: 'beforeAfter', heuristic: 'before-after',
    operations: ['subtraction'], difficulty: 2,
    contexts: [
      { setting: 'tank', item: 'litres of water', verb: 'held' },
      { setting: 'warehouse', item: 'boxes', verb: 'stored' },
    ],
    constraints: { start: { min: 100, max: 500 }, change: { min: 20, max: 150 } },
    storyTemplate: 'A {setting} {verb} {start} {item}. After some were used, there were {start} - {change} {item} remaining. How many {item} were used?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: ['Figuring out how much was used up', 'Adding more to a container', 'Comparing two containers', 'Dividing contents into portions'] },
      identify_info: { type: 'highlight', expected: ['{start}', '{start} - {change}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: ['How many {item} were used', 'How many {item} were added', 'The total capacity of the {setting}', 'How many portions can be made'] },
      plan: { type: 'strategySelect', prompt: 'What strategy should we use?', correctIndex: 0, choices: ['Draw a before-after diagram', 'Draw a bar model', 'Work backwards', 'Guess and check'] },
      solve: { type: 'expression', operation: 'subtraction', expression: '{start} - ({start} - {change})', answer: '{change}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/wrong-operation', 'psl/arithmetic-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P5 BEFORE-AFTER: FRACTION CHANGE  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-ba-frac-change-01',
    skillId: 'psl-p5-ba-fraction-change', structure: 'beforeAfter', heuristic: 'before-after',
    operations: ['multiplication', 'addition'], difficulty: 3,
    contexts: [
      { setting: 'bake sale', item: 'cupcakes', fractionWord: 'a quarter', fractionNum: 4 },
      { setting: 'art class', item: 'paint tubes', fractionWord: 'a third', fractionNum: 3 },
    ],
    constraints: { groups: { min: 2, max: 4 }, perGroup: { min: 15, max: 40 } },
    storyTemplate: '{nameA} baked {groups} trays of {item} with {perGroup} {item} per tray for the {setting}. {nameA} ate {fractionWord} of one tray. How many {item} does {nameA} have now?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: ['Finding the total after eating a fraction', 'Sharing cupcakes equally among friends', 'Comparing two bake sales', 'Adding items from two different sources'] },
      identify_info: { type: 'highlight', expected: ['{groups}', '{perGroup}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: ['How many {item} are left after eating some', 'How many {item} per tray', 'How many trays were baked', 'How many friends shared the {item}'] },
      plan: { type: 'strategySelect', prompt: 'What strategy should we use?', correctIndex: 0, choices: ['Draw a before-after diagram', 'Draw a bar model', 'Work backwards', 'Guess and check'] },
      solve: { type: 'twoStep', steps: [
        { operation: 'multiplication', expression: '{groups} × {perGroup}', label: 'Find total baked' },
        { operation: 'subtraction', expression: '{groups} × {perGroup} - {perGroup} ÷ {fractionNum}', label: 'Subtract fraction eaten' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-number'], plan: ['psl/wrong-model-type'], solve: ['psl/fraction-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-ba-frac-change-02',
    skillId: 'psl-p5-ba-fraction-change', structure: 'beforeAfter', heuristic: 'before-after',
    operations: ['multiplication', 'subtraction'], difficulty: 3,
    contexts: [
      { setting: 'workshop', item: 'beads', fractionWord: 'half', fractionNum: 2 },
      { setting: 'store', item: 'greeting cards', fractionWord: 'a fifth', fractionNum: 5 },
    ],
    constraints: { groups: { min: 2, max: 4 }, perGroup: { min: 15, max: 40 } },
    storyTemplate: '{nameA} had {groups} packets of {item} with {perGroup} {item} in each packet. {nameA} used {fractionWord} of one packet for a project. How many {item} does {nameA} have left?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: ['Using a fraction of items from a collection', 'Sharing items among groups equally', 'Buying more items to add', 'Comparing two collections'] },
      identify_info: { type: 'highlight', expected: ['{groups}', '{perGroup}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: ['How many {item} remain', 'How many packets are needed', 'The cost of the {item}', 'How many were given away'] },
      plan: { type: 'strategySelect', prompt: 'What strategy should we use?', correctIndex: 0, choices: ['Draw a before-after diagram', 'Draw a bar model', 'Work backwards', 'Guess and check'] },
      solve: { type: 'twoStep', steps: [
        { operation: 'multiplication', expression: '{groups} × {perGroup}', label: 'Find total items' },
        { operation: 'subtraction', expression: '{groups} × {perGroup} - {perGroup} ÷ {fractionNum}', label: 'Subtract fraction used' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/fraction-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-ba-frac-change-03',
    skillId: 'psl-p5-ba-fraction-change', structure: 'beforeAfter', heuristic: 'before-after',
    operations: ['multiplication', 'subtraction'], difficulty: 3,
    contexts: [
      { setting: 'charity drive', item: 'canned drinks', fractionWord: 'a third', fractionNum: 3 },
      { setting: 'party', item: 'sandwiches', fractionWord: 'a quarter', fractionNum: 4 },
    ],
    constraints: { groups: { min: 2, max: 4 }, perGroup: { min: 15, max: 40 } },
    storyTemplate: 'For the {setting}, {nameA} prepared {groups} boxes of {item} with {perGroup} {item} per box. {fractionWord} of one box was given out. How many {item} does {nameA} still have?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: ['Items decreasing by a fraction of one group', 'Sharing all items equally', 'Adding items from multiple sources', 'Comparing the before and after prices'] },
      identify_info: { type: 'highlight', expected: ['{groups}', '{perGroup}'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: ['How many {item} are still available', 'How many boxes are full', 'The total given out', 'How many people received {item}'] },
      plan: { type: 'strategySelect', prompt: 'What strategy should we use?', correctIndex: 0, choices: ['Draw a before-after diagram', 'Draw a bar model', 'Work backwards', 'Guess and check'] },
      solve: { type: 'twoStep', steps: [
        { operation: 'multiplication', expression: '{groups} × {perGroup}', label: 'Find total prepared' },
        { operation: 'subtraction', expression: '{groups} × {perGroup} - {perGroup} ÷ {fractionNum}', label: 'Subtract fraction given out' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/fraction-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P5 BEFORE-AFTER: TWO EVENTS  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-ba-two-events-01',
    skillId: 'psl-p5-ba-two-events', structure: 'beforeAfter', heuristic: 'before-after',
    operations: ['addition', 'subtraction'], difficulty: 3,
    contexts: [
      { setting: 'community centre', item: 'chairs', event1: 'borrowed from another room', event2: 'returned after the event' },
      { setting: 'sports store', item: 'tennis balls', event1: 'received from supplier', event2: 'sold to customers' },
    ],
    constraints: { valA: { min: 50, max: 200 }, valB: { min: 10, max: 40 }, valC: { min: 15, max: 50 } },
    storyTemplate: 'The {setting} had {valA} {item}. First, {valB} {item} were {event1}. Then, {valC} {item} were {event2}. How many {item} does the {setting} have now?',
    scaffold: baTwoStepScaffold(
      ['Two sequential events changing a quantity', 'Comparing amounts at two locations', 'Sharing items among groups', 'Finding a fraction of a total'],
      ['The final number of {item}', 'How many {item} were borrowed', 'The total {item} moved', 'How many groups were formed'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'addition', expression: '{valA} + {valB}', label: 'After first event' },
        { operation: 'subtraction', expression: '{valA} + {valB} - {valC}', label: 'After second event' },
      ],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-ba-two-events-02',
    skillId: 'psl-p5-ba-two-events', structure: 'beforeAfter', heuristic: 'before-after',
    operations: ['subtraction', 'addition'], difficulty: 3,
    contexts: [
      { setting: 'farm', item: 'chickens', event1: 'sold at the market', event2: 'hatched from eggs' },
      { setting: 'nursery', item: 'seedlings', event1: 'transplanted to the garden', event2: 'germinated in the tray' },
    ],
    constraints: { valA: { min: 50, max: 200 }, valB: { min: 10, max: 40 }, valC: { min: 15, max: 50 } },
    storyTemplate: '{nameA}\'s {setting} had {valA} {item}. {valB} {item} were {event1}. Later, {valC} new {item} {event2}. How many {item} are there now?',
    scaffold: baTwoStepScaffold(
      ['A decrease followed by an increase', 'Adding three separate amounts', 'Comparing two different farms', 'Dividing animals into pens'],
      ['The current number of {item}', 'How many {item} were sold', 'The total {item} hatched', 'How many pens are needed'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'subtraction', expression: '{valA} - {valB}', label: 'After first event' },
        { operation: 'addition', expression: '{valA} - {valB} + {valC}', label: 'After second event' },
      ],
    ),
    misconceptions: { plan: ['psl/wrong-model-type'], solve: ['psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-ba-two-events-03',
    skillId: 'psl-p5-ba-two-events', structure: 'beforeAfter', heuristic: 'before-after',
    operations: ['subtraction', 'subtraction'], difficulty: 3,
    contexts: [
      { setting: 'warehouse', item: 'cartons of milk', event1: 'delivered to Shop A', event2: 'delivered to Shop B' },
      { setting: 'depot', item: 'parcels', event1: 'sent out in the morning', event2: 'sent out in the afternoon' },
    ],
    constraints: { valA: { min: 50, max: 200 }, valB: { min: 10, max: 40 }, valC: { min: 15, max: 50 } },
    storyTemplate: 'A {setting} had {valA} {item}. {valB} {item} were {event1} and {valC} {item} were {event2}. How many {item} are left in the {setting}?',
    scaffold: baTwoStepScaffold(
      ['Two decreases from a starting amount', 'Adding deliveries together', 'Finding the difference between two shops', 'Sharing items among two shops'],
      ['How many {item} remain', 'The total {item} delivered', 'Which shop got more', 'How many shops there are'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'subtraction', expression: '{valA} - {valB}', label: 'After first delivery' },
        { operation: 'subtraction', expression: '{valA} - {valB} - {valC}', label: 'After second delivery' },
      ],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error', 'psl/wrong-operation'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P6 BEFORE-AFTER: PERCENTAGE CHANGE  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-ba-pct-change-01',
    skillId: 'psl-p6-ba-percentage-change', structure: 'beforeAfter', heuristic: 'before-after',
    operations: ['percentage', 'addition'], difficulty: 4,
    contexts: [
      { setting: 'school', item: 'students', direction: 'increased' },
      { setting: 'gym', item: 'members', direction: 'increased' },
    ],
    constraints: { valA: { min: 100, max: 500 }, valB: { min: 10, max: 30 } },
    storyTemplate: 'A {setting} had {valA} {item}. The number of {item} {direction} by {valB}%. How many {item} are there now?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: ['A percentage increase in a quantity', 'Sharing items by percentage', 'Comparing percentages of two groups', 'Finding the original amount'] },
      identify_info: { type: 'highlight', expected: ['{valA}', '{valB}%'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: ['The new total after the percentage increase', 'The original number of {item}', 'The percentage of the increase', 'How many {item} left the {setting}'] },
      plan: { type: 'strategySelect', prompt: 'What strategy should we use?', correctIndex: 0, choices: ['Draw a before-after diagram', 'Draw a bar model', 'Work backwards', 'Guess and check'] },
      solve: { type: 'twoStep', steps: [
        { operation: 'percentage', expression: '{valB}% × {valA}', label: 'Find the increase' },
        { operation: 'addition', expression: '{valA} + {valB}% × {valA}', label: 'Add increase to original' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/percentage-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-ba-pct-change-02',
    skillId: 'psl-p6-ba-percentage-change', structure: 'beforeAfter', heuristic: 'before-after',
    operations: ['percentage', 'subtraction'], difficulty: 4,
    contexts: [
      { setting: 'shop', item: 'items in stock', direction: 'decreased' },
      { setting: 'reservoir', item: 'megalitres of water', direction: 'dropped' },
    ],
    constraints: { valA: { min: 100, max: 500 }, valB: { min: 10, max: 30 } },
    storyTemplate: 'A {setting} had {valA} {item}. Due to a sale, the {item} {direction} by {valB}%. How many {item} are left?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: ['A percentage decrease in a quantity', 'A percentage increase in a quantity', 'Finding the percentage of a whole', 'Splitting items into percentage groups'] },
      identify_info: { type: 'highlight', expected: ['{valA}', '{valB}%'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: ['How many {item} remain after the decrease', 'The percentage that was removed', 'The original number of {item}', 'How many {item} were added'] },
      plan: { type: 'strategySelect', prompt: 'What strategy should we use?', correctIndex: 0, choices: ['Draw a before-after diagram', 'Draw a bar model', 'Work backwards', 'Guess and check'] },
      solve: { type: 'twoStep', steps: [
        { operation: 'percentage', expression: '{valB}% × {valA}', label: 'Find the decrease' },
        { operation: 'subtraction', expression: '{valA} - {valB}% × {valA}', label: 'Subtract decrease from original' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { solve: ['psl/percentage-error', 'psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-ba-pct-change-03',
    skillId: 'psl-p6-ba-percentage-change', structure: 'beforeAfter', heuristic: 'before-after',
    operations: ['percentage', 'addition'], difficulty: 4,
    contexts: [
      { setting: 'tuition centre', item: 'enrolled students', direction: 'grew' },
      { setting: 'hawker stall', item: 'daily customers', direction: 'increased' },
    ],
    constraints: { valA: { min: 100, max: 500 }, valB: { min: 10, max: 30 } },
    storyTemplate: 'Last year, a {setting} had {valA} {item}. This year, the number {direction} by {valB}%. How many {item} are there this year?',
    scaffold: {
      understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: ['Year-on-year percentage growth', 'Comparing two different centres', 'Splitting students into classes', 'Reducing the number of students'] },
      identify_info: { type: 'highlight', expected: ['{valA}', '{valB}%'] },
      identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: ['The new number of {item} this year', 'Last year\'s number of {item}', 'The percentage change', 'How many {item} left'] },
      plan: { type: 'strategySelect', prompt: 'What strategy should we use?', correctIndex: 0, choices: ['Draw a before-after diagram', 'Draw a bar model', 'Work backwards', 'Guess and check'] },
      solve: { type: 'twoStep', steps: [
        { operation: 'percentage', expression: '{valB}% × {valA}', label: 'Find the growth' },
        { operation: 'addition', expression: '{valA} + {valB}% × {valA}', label: 'Add growth to last year' },
      ], answer: '{answer}' },
      check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
    },
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/percentage-error'] },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  P6 BEFORE-AFTER: MULTI-PARTY  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  {
    templateId: 'psl-tpl-ba-multi-party-01',
    skillId: 'psl-p6-ba-multi-party', structure: 'beforeAfter', heuristic: 'before-after',
    operations: ['addition', 'subtraction'], difficulty: 4,
    contexts: [
      { setting: 'fund-raiser', item: 'badges' },
      { setting: 'food drive', item: 'canned goods' },
    ],
    constraints: { valA: { min: 50, max: 200 }, valB: { min: 10, max: 40 }, valC: { min: 20, max: 60 } },
    storyTemplate: '{nameA} had {valA} {item}. {nameA} received {valB} {item} from {nameB} and gave {valC} {item} to {nameC} for the {setting}. How many {item} does {nameA} have now?',
    scaffold: baTwoStepScaffold(
      ['Items moving between multiple people', 'Comparing collections of three people', 'Sharing items equally among three people', 'Finding the total across three people'],
      ['How many {item} {nameA} has now', 'How many {item} {nameB} has', 'The total {item} among all three', 'How many more {item} {nameA} gave than received'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'addition', expression: '{valA} + {valB}', label: 'After receiving from {nameB}' },
        { operation: 'subtraction', expression: '{valA} + {valB} - {valC}', label: 'After giving to {nameC}' },
      ],
    ),
    misconceptions: { identify_info: ['psl/missed-number', 'psl/included-irrelevant'], solve: ['psl/arithmetic-error'] },
  },
  {
    templateId: 'psl-tpl-ba-multi-party-02',
    skillId: 'psl-p6-ba-multi-party', structure: 'beforeAfter', heuristic: 'before-after',
    operations: ['subtraction', 'subtraction'], difficulty: 4,
    contexts: [
      { setting: 'class project', item: 'coloured papers' },
      { setting: 'art exhibition', item: 'origami cranes' },
    ],
    constraints: { valA: { min: 50, max: 200 }, valB: { min: 10, max: 40 }, valC: { min: 20, max: 60 } },
    storyTemplate: '{nameA} started the {setting} with {valA} {item}. {nameA} gave {valB} {item} to {nameB} and {valC} {item} to {nameC}. How many {item} does {nameA} have left?',
    scaffold: baTwoStepScaffold(
      ['Giving items to two different people', 'Receiving items from two people', 'Comparing three collections', 'Finding the total items made'],
      ['How many {item} {nameA} has left', 'How many {item} were given in total', 'Who has the most {item}', 'The total {item} among all people'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'subtraction', expression: '{valA} - {valB}', label: 'After giving to {nameB}' },
        { operation: 'subtraction', expression: '{valA} - {valB} - {valC}', label: 'After giving to {nameC}' },
      ],
    ),
    misconceptions: { identify_info: ['psl/missed-number'], solve: ['psl/arithmetic-error', 'psl/wrong-operation'] },
  },
  {
    templateId: 'psl-tpl-ba-multi-party-03',
    skillId: 'psl-p6-ba-multi-party', structure: 'beforeAfter', heuristic: 'before-after',
    operations: ['addition', 'addition'], difficulty: 4,
    contexts: [
      { setting: 'community library', item: 'donated books' },
      { setting: 'recycling drive', item: 'plastic bottles' },
    ],
    constraints: { valA: { min: 50, max: 200 }, valB: { min: 10, max: 40 }, valC: { min: 20, max: 60 } },
    storyTemplate: 'The {setting} had {valA} {item}. {nameA} contributed {valB} {item} and {nameB} contributed {valC} {item}. How many {item} does the {setting} have now?',
    scaffold: baTwoStepScaffold(
      ['Multiple people contributing to a collection', 'Taking items from a shared collection', 'Comparing contributions from two people', 'Dividing items among people'],
      ['The new total of {item}', 'Who contributed more', 'How many {item} each person has left', 'The difference between the contributions'],
      ['{valA}', '{valB}', '{valC}'],
      [
        { operation: 'addition', expression: '{valA} + {valB}', label: 'After {nameA} contributes' },
        { operation: 'addition', expression: '{valA} + {valB} + {valC}', label: 'After {nameB} contributes' },
      ],
    ),
    misconceptions: { solve: ['psl/arithmetic-error'] },
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
  console.log(`Seeded ${upserted} PSL before-after problem templates.`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
