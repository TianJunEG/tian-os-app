import dotenv from 'dotenv';
dotenv.config();

if (process.env.NODE_ENV === "production") {
  console.error("Seed script: refusing to run in production (NODE_ENV=production).");
  process.exit(1);
}
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLProblemTemplate from '../models/psl/PSLProblemTemplate.js';
import { strategyScaffold, makeTemplate } from './pslTemplateFactory.js';

const S = ['Divide total by sum of ratio parts, then multiply', 'Draw a bar model', 'Use guess and check', 'Work backwards from the answer'];
const rs = (u, q, st, ss) => strategyScaffold({ understand: u, questionChoices: q, strategyChoices: S, solveType: st, solveSpec: ss });
const mt = (id, sk, o) => makeTemplate(id, sk, 'ratio', { heuristic: 'ratio', ...o });

const TEMPLATES = [
  // ═══ P4 SIMPLE RATIO (split total into 2 parts) ×3 ═══
  mt('psl-tpl-ratio-simple-01', 'psl-p4-ratio-simple', {
    difficulty: 1,
    contexts: [{ setting: 'classroom', entityA: 'boys', entityB: 'girls', itemPlural: 'students', verb: 'are' },
               { setting: 'market', entityA: 'red apples', entityB: 'green apples', itemPlural: 'apples', verb: 'bought' }],
    constraints: { ratioA: { min: 2, max: 5 }, ratioB: { min: 1, max: 4 }, totalValue: { min: 20, max: 100 } },
    storyTemplate: 'The ratio of {entityA} to {entityB} in the {setting} is {ratioA} : {ratioB}. There are {totalValue} {itemPlural} altogether. How many {entityA} are there?',
    solutionTemplate: 'Step 1: Total parts = {ratioA} + {ratioB} = {totalParts}.\nStep 2: Value of 1 part = {totalValue} ÷ {totalParts} = {valuePerPart}.\nStep 3: {entityA} = {ratioA} × {valuePerPart} = {valueA}.\nAnswer: {valueA}.',
    scaffold: rs(['Sharing a total in a given ratio', 'Comparing two equal groups', 'Subtracting to find a remainder', 'Multiplying two numbers together'],
      ['The number of {entityA}', 'The total number of {itemPlural}', 'How many more {entityA} than {entityB}', 'The ratio itself'],
      'expression', { operation: 'division-then-multiply', expression: '{totalValue} ÷ ({ratioA}+{ratioB}) × {ratioA}', answer: '{valueA}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/forgot-total-parts', 'psl/arithmetic-error'] },
  }),
  mt('psl-tpl-ratio-simple-02', 'psl-p4-ratio-simple', {
    difficulty: 1,
    contexts: [{ setting: 'art class', entityA: 'red beads', entityB: 'blue beads', itemPlural: 'beads', verb: 'used' },
               { setting: 'canteen', entityA: 'chicken rice', entityB: 'noodles', itemPlural: 'meals', verb: 'sold' }],
    constraints: { ratioA: { min: 2, max: 5 }, ratioB: { min: 1, max: 4 }, totalValue: { min: 20, max: 100 } },
    storyTemplate: '{nameA} {verb} {entityA} and {entityB} in the ratio {ratioA} : {ratioB}. {nameA} {verb} {totalValue} {itemPlural} in all. How many {entityB} did {nameA} use?',
    solutionTemplate: 'Step 1: Total parts = {ratioA} + {ratioB} = {totalParts}.\nStep 2: Value of 1 part = {totalValue} ÷ {totalParts} = {valuePerPart}.\nStep 3: {entityB} = {ratioB} × {valuePerPart} = {valueB}.\nAnswer: {valueB}.',
    scaffold: rs(['Splitting a total into two parts using a ratio', 'Dividing equally between two groups', 'Finding the difference', 'Adding two groups together'],
      ['The number of {entityB}', 'The total {itemPlural}', 'The ratio itself', 'How many more {entityA} than {entityB}'],
      'expression', { operation: 'division-then-multiply', expression: '{totalValue} ÷ ({ratioA}+{ratioB}) × {ratioB}', answer: '{valueB}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/wrong-ratio-order', 'psl/arithmetic-error'] },
  }),
  mt('psl-tpl-ratio-simple-03', 'psl-p4-ratio-simple', {
    difficulty: 1,
    contexts: [{ setting: 'playground', entityA: 'boys', entityB: 'girls', itemPlural: 'children', verb: 'are playing' },
               { setting: 'library', entityA: 'fiction books', entityB: 'non-fiction books', itemPlural: 'books', verb: 'borrowed' }],
    constraints: { ratioA: { min: 2, max: 5 }, ratioB: { min: 1, max: 4 }, totalValue: { min: 30, max: 90 } },
    storyTemplate: 'The ratio of {entityA} to {entityB} at the {setting} is {ratioA} : {ratioB}. There are {totalValue} {itemPlural}. How many {entityA} are there?',
    solutionTemplate: 'Step 1: Total parts = {ratioA} + {ratioB} = {totalParts}.\nStep 2: Value of 1 part = {totalValue} ÷ {totalParts} = {valuePerPart}.\nStep 3: {entityA} = {ratioA} × {valuePerPart} = {valueA}.\nAnswer: {valueA}.',
    scaffold: rs(['Using a ratio to share a total into two groups', 'Finding the average of two numbers', 'Subtracting one group from another', 'Guessing and checking'],
      ['The number of {entityA}', 'The sum of both ratio parts', 'The difference between the groups', 'How many groups there are'],
      'expression', { operation: 'division-then-multiply', expression: '{totalValue} ÷ ({ratioA}+{ratioB}) × {ratioA}', answer: '{valueA}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/forgot-total-parts', 'psl/arithmetic-error'] },
  }),

  // ═══ P4 FIND TOTAL FROM PARTS ×3 ═══
  mt('psl-tpl-ratio-findtot-01', 'psl-p4-ratio-find-total', {
    difficulty: 1,
    contexts: [{ setting: 'pocket money', entityA: 'savings', entityB: 'spending', verb: 'divides' }],
    constraints: { ratioA: { min: 2, max: 5 }, ratioB: { min: 1, max: 4 }, knownValue: { min: 10, max: 60 } },
    storyTemplate: '{nameA} divides pocket money for {entityA} and {entityB} in the ratio {ratioA} : {ratioB}. {nameA} saves ${knownValue}. How much pocket money does {nameA} get altogether?',
    solutionTemplate: 'Step 1: Value of 1 part = {knownValue} ÷ {ratioA} = {valuePerPart}.\nStep 2: Total parts = {ratioA} + {ratioB} = {totalParts}.\nStep 3: Total = {valuePerPart} × {totalParts} = {total}.\nAnswer: ${total}.',
    scaffold: rs(['Finding the total when one part of a ratio is known', 'Subtracting savings from total', 'Multiplying savings by the ratio', 'Dividing the ratio into halves'],
      ['The total pocket money', 'How much {nameA} spends', 'The ratio itself', 'How much more saved than spent'],
      'twoStep', { steps: [{ operation: 'division', expression: '{knownValue} ÷ {ratioA}', label: 'Find value of 1 part' },
        { operation: 'multiplication', expression: '{valuePerPart} × ({ratioA}+{ratioB})', label: 'Find the total' }], answer: '{total}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/forgot-total-parts', 'psl/wrong-operation'] },
  }),
  mt('psl-tpl-ratio-findtot-02', 'psl-p4-ratio-find-total', {
    difficulty: 1,
    contexts: [{ setting: 'Sports Day', entityA: 'medals', entityB: 'ribbons', itemPlural: 'prizes', verb: 'won' },
               { setting: 'stationery shop', entityA: 'pens', entityB: 'pencils', itemPlural: 'items', verb: 'bought' }],
    constraints: { ratioA: { min: 2, max: 5 }, ratioB: { min: 1, max: 4 }, knownValue: { min: 8, max: 50 } },
    storyTemplate: 'The ratio of {entityA} to {entityB} at the {setting} is {ratioA} : {ratioB}. There are {knownValue} {entityA}. How many {itemPlural} are there altogether?',
    solutionTemplate: 'Step 1: Value of 1 part = {knownValue} ÷ {ratioA} = {valuePerPart}.\nStep 2: Total parts = {ratioA} + {ratioB} = {totalParts}.\nStep 3: Total {itemPlural} = {valuePerPart} × {totalParts} = {total}.\nAnswer: {total}.',
    scaffold: rs(['Using one known part to find the total', 'Adding both parts directly', 'Comparing the two types', 'Dividing total equally'],
      ['The total {itemPlural}', 'The number of {entityB}', 'The difference', 'The ratio as a fraction'],
      'twoStep', { steps: [{ operation: 'division', expression: '{knownValue} ÷ {ratioA}', label: 'Find value of 1 part' },
        { operation: 'multiplication', expression: '{valuePerPart} × ({ratioA}+{ratioB})', label: 'Find the total' }], answer: '{total}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/wrong-operation', 'psl/arithmetic-error'] },
  }),
  mt('psl-tpl-ratio-findtot-03', 'psl-p4-ratio-find-total', {
    difficulty: 1,
    contexts: [{ setting: 'bakery', entityA: 'chocolate muffins', entityB: 'vanilla muffins', itemPlural: 'muffins', verb: 'baked' }],
    constraints: { ratioA: { min: 2, max: 5 }, ratioB: { min: 1, max: 4 }, knownValue: { min: 12, max: 48 } },
    storyTemplate: 'A {setting} baked {entityA} and {entityB} in the ratio {ratioA} : {ratioB}. There were {knownValue} {entityB}. How many {itemPlural} were baked in all?',
    solutionTemplate: 'Step 1: Value of 1 part = {knownValue} ÷ {ratioB} = {valuePerPart}.\nStep 2: Total parts = {ratioA} + {ratioB} = {totalParts}.\nStep 3: Total {itemPlural} = {valuePerPart} × {totalParts} = {total}.\nAnswer: {total}.',
    scaffold: rs(['Finding the total from a known smaller part', 'Multiplying the known part by 2', 'Subtracting the known from the ratio', 'Adding both ratio numbers'],
      ['The total {itemPlural}', 'The number of {entityA}', 'The difference between the two', 'The ratio as a decimal'],
      'twoStep', { steps: [{ operation: 'division', expression: '{knownValue} ÷ {ratioB}', label: 'Find value of 1 part' },
        { operation: 'multiplication', expression: '{valuePerPart} × ({ratioA}+{ratioB})', label: 'Find the total' }], answer: '{total}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/forgot-total-parts', 'psl/arithmetic-error'] },
  }),

  // ═══ P4 COMPARE QUANTITIES ×3 ═══
  mt('psl-tpl-ratio-compare-01', 'psl-p4-ratio-compare', {
    difficulty: 2,
    contexts: [{ setting: 'sharing stickers', entityA: '{nameA}', entityB: '{nameB}', itemPlural: 'stickers', verb: 'shared' },
               { setting: 'CCA', entityA: 'Art Club', entityB: 'Science Club', itemPlural: 'members', verb: 'has' }],
    constraints: { ratioA: { min: 3, max: 5 }, ratioB: { min: 1, max: 3 }, totalValue: { min: 30, max: 100 } },
    storyTemplate: '{nameA} and {nameB} shared {totalValue} {itemPlural} in the ratio {ratioA} : {ratioB}. How many more {itemPlural} did {nameA} get than {nameB}?',
    solutionTemplate: 'Step 1: Total parts = {ratioA} + {ratioB} = {totalParts}.\nStep 2: Value of 1 part = {totalValue} ÷ {totalParts} = {valuePerPart}.\nStep 3: Difference = ({ratioA} − {ratioB}) × {valuePerPart} = {answer}.\nAnswer: {answer}.',
    scaffold: rs(['Finding the difference between two ratio parts', 'Dividing items equally', 'Adding both shares', 'Subtracting to find a remainder'],
      ['How many more {nameA} than {nameB}', 'The total {itemPlural}', 'How many {nameA} has', 'Value of 1 part'],
      'twoStep', { steps: [{ operation: 'division', expression: '{totalValue} ÷ ({ratioA}+{ratioB})', label: 'Find value of 1 part' },
        { operation: 'multiplication', expression: '{valuePerPart} × ({ratioA}-{ratioB})', label: 'Find the difference' }], answer: '{answer}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/forgot-total-parts', 'psl/wrong-ratio-order'] },
  }),
  mt('psl-tpl-ratio-compare-02', 'psl-p4-ratio-compare', {
    difficulty: 2,
    contexts: [{ setting: 'hawker centre', entityA: 'adults', entityB: 'children', itemPlural: 'people', verb: 'counted' }],
    constraints: { ratioA: { min: 3, max: 5 }, ratioB: { min: 1, max: 3 }, totalValue: { min: 40, max: 100 } },
    storyTemplate: 'The ratio of {entityA} to {entityB} at the {setting} is {ratioA} : {ratioB}. There are {totalValue} {itemPlural}. How many more {entityA} than {entityB}?',
    solutionTemplate: 'Step 1: Total parts = {ratioA} + {ratioB} = {totalParts}.\nStep 2: Value of 1 part = {totalValue} ÷ {totalParts} = {valuePerPart}.\nStep 3: Difference = ({ratioA} − {ratioB}) × {valuePerPart} = {answer}.\nAnswer: {answer}.',
    scaffold: rs(['Using a ratio and total to find the difference', 'Subtracting the smaller group from the total', 'Dividing total by 2', 'Multiplying both ratio parts'],
      ['How many more {entityA} than {entityB}', 'Total {itemPlural}', 'Number of {entityA}', 'Sum of ratio parts'],
      'twoStep', { steps: [{ operation: 'division', expression: '{totalValue} ÷ ({ratioA}+{ratioB})', label: 'Find value of 1 part' },
        { operation: 'multiplication', expression: '{valuePerPart} × ({ratioA}-{ratioB})', label: 'Find the difference' }], answer: '{answer}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/forgot-total-parts', 'psl/arithmetic-error'] },
  }),
  mt('psl-tpl-ratio-compare-03', 'psl-p4-ratio-compare', {
    difficulty: 2,
    contexts: [{ setting: 'paint mixing', entityA: 'blue paint', entityB: 'white paint', itemPlural: 'litres', verb: 'mixed' }],
    constraints: { ratioA: { min: 3, max: 5 }, ratioB: { min: 1, max: 3 }, totalValue: { min: 24, max: 80 } },
    storyTemplate: '{nameA} {verb} {entityA} and {entityB} in the ratio {ratioA} : {ratioB} using {totalValue} {itemPlural}. How many more {itemPlural} of {entityA} than {entityB}?',
    solutionTemplate: 'Step 1: Total parts = {ratioA} + {ratioB} = {totalParts}.\nStep 2: Value of 1 part = {totalValue} ÷ {totalParts} = {valuePerPart}.\nStep 3: Difference = ({ratioA} − {ratioB}) × {valuePerPart} = {answer}.\nAnswer: {answer}.',
    scaffold: rs(['Finding how much more of one colour via ratio parts', 'Dividing total paint equally', 'Multiplying the ratio numbers', 'Subtracting one from the total'],
      ['How many more litres of {entityA}', 'Total litres', 'Litres of {entityA}', 'Ratio of {entityA} to {entityB}'],
      'twoStep', { steps: [{ operation: 'division', expression: '{totalValue} ÷ ({ratioA}+{ratioB})', label: 'Find value of 1 part' },
        { operation: 'multiplication', expression: '{valuePerPart} × ({ratioA}-{ratioB})', label: 'Find the difference' }], answer: '{answer}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/wrong-ratio-order', 'psl/arithmetic-error'] },
  }),

  // ═══ P5 THREE-WAY RATIO ×3 ═══
  mt('psl-tpl-ratio-3way-01', 'psl-p5-ratio-3way', {
    difficulty: 2,
    contexts: [{ setting: 'recipe', entityA: 'flour', entityB: 'sugar', entityC: 'butter', unit: 'g', verb: 'needs' }],
    constraints: { _generic: { ratioA:{min:1,max:5}, ratioB:{min:1,max:5}, ratioC:{min:1,max:5}, total:{min:60,max:200} },
      _compute: { totalParts: 'ratioA+ratioB+ratioC', answer: 'total/(ratioA+ratioB+ratioC)*ratioA'}, answer: { min: 5 } },
    storyTemplate: 'A {setting} requires {entityA}, {entityB} and {entityC} in the ratio {ratioA} : {ratioB} : {ratioC}. If {total} {unit} are used, how many {unit} of {entityA} are needed?',
    solutionTemplate: 'Step 1: Total parts = {ratioA} + {ratioB} + {ratioC} = {totalParts}.\nStep 2: Value of 1 part = {total} ÷ {totalParts} = {valuePerPart}.\nStep 3: {entityA} = {ratioA} × {valuePerPart} = {answer}.\nAnswer: {answer} {unit}.',
    scaffold: rs(['Splitting a total among three items using a ratio', 'Dividing equally among 3', 'Subtracting one part', 'Comparing two of three'],
      ['Amount of {entityA}', 'Total amount', 'Difference between {entityA} and {entityC}', 'Ratio as fractions'],
      'expression', { operation: 'division-then-multiply', expression: '{total} ÷ ({ratioA}+{ratioB}+{ratioC}) × {ratioA}', answer: '{answer}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/forgot-total-parts', 'psl/arithmetic-error'] },
  }),
  mt('psl-tpl-ratio-3way-02', 'psl-p5-ratio-3way', {
    difficulty: 2,
    contexts: [{ setting: 'Sports Day prizes', entityA: 'gold', entityB: 'silver', entityC: 'bronze', unit: 'medals', verb: 'given' }],
    constraints: { _generic: { ratioA:{min:1,max:4}, ratioB:{min:2,max:5}, ratioC:{min:2,max:5}, total:{min:60,max:180} },
      _compute: { totalParts: 'ratioA+ratioB+ratioC', answer: 'total/(ratioA+ratioB+ratioC)*ratioC'}, answer: { min: 5 } },
    storyTemplate: 'At {setting}, {entityA}, {entityB} and {entityC} medals were given in the ratio {ratioA} : {ratioB} : {ratioC}. {total} {unit} were given out. How many {entityC} medals?',
    solutionTemplate: 'Step 1: Total parts = {ratioA} + {ratioB} + {ratioC} = {totalParts}.\nStep 2: Value of 1 part = {total} ÷ {totalParts} = {valuePerPart}.\nStep 3: {entityC} = {ratioC} × {valuePerPart} = {answer}.\nAnswer: {answer} {unit}.',
    scaffold: rs(['Using a 3-part ratio to find one specific part', 'Dividing medals equally among houses', 'Subtracting gold from total', 'Multiplying the three ratio numbers'],
      ['Number of {entityC}', 'Total medals', 'More silver than gold', 'Ratio as decimals'],
      'expression', { operation: 'division-then-multiply', expression: '{total} ÷ ({ratioA}+{ratioB}+{ratioC}) × {ratioC}', answer: '{answer}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/forgot-total-parts', 'psl/wrong-ratio-order'] },
  }),
  mt('psl-tpl-ratio-3way-03', 'psl-p5-ratio-3way', {
    difficulty: 2,
    contexts: [{ setting: 'splitting a bill at a hawker centre', entityA: '{nameA}', entityB: '{nameB}', entityC: '{nameC}', unit: 'dollars', verb: 'paid' }],
    constraints: { _generic: { ratioA:{min:1,max:5}, ratioB:{min:1,max:5}, ratioC:{min:1,max:5}, total:{min:60,max:180} },
      _compute: { totalParts: 'ratioA+ratioB+ratioC', answer: 'total/(ratioA+ratioB+ratioC)*ratioB'}, answer: { min: 5 } },
    storyTemplate: '{nameA}, {nameB} and {nameC} split a ${total} bill in the ratio {ratioA} : {ratioB} : {ratioC}. How much did {nameB} pay?',
    solutionTemplate: 'Step 1: Total parts = {ratioA} + {ratioB} + {ratioC} = {totalParts}.\nStep 2: Value of 1 part = {total} ÷ {totalParts} = {valuePerPart}.\nStep 3: {nameB} paid = {ratioB} × {valuePerPart} = {answer}.\nAnswer: ${answer}.',
    scaffold: rs(['Sharing a bill in a 3-way ratio', 'Dividing bill equally by 3', 'Finding who paid most', 'Subtracting each share'],
      ['How much {nameB} paid', 'The total bill', 'Difference between {nameA} and {nameC}', 'Ratio as percentage'],
      'expression', { operation: 'division-then-multiply', expression: '{total} ÷ ({ratioA}+{ratioB}+{ratioC}) × {ratioB}', answer: '{answer}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/wrong-ratio-order', 'psl/arithmetic-error'] },
  }),

  // ═══ P5 CHANGED RATIO ×3 ═══
  mt('psl-tpl-ratio-change-01', 'psl-p5-ratio-change', {
    difficulty: 3,
    contexts: [{ setting: 'sticker collection', entityA: 'stickers', verb: 'gave' }],
    constraints: { _generic: { ratioA1:{min:2,max:5}, ratioB1:{min:1,max:4}, transfer:{min:5,max:30}, totalValue:{min:40,max:120} },
      _compute: { answer: 'totalValue/(ratioA1+ratioB1)*ratioA1-transfer'}, answer: { min: 5 } },
    storyTemplate: 'The ratio of {nameA}\'s to {nameB}\'s stickers was {ratioA1} : {ratioB1}. They had {totalValue} stickers altogether. {nameA} gave {transfer} to {nameB}. How many stickers does {nameA} have now?',
    solutionTemplate: 'Step 1: Total parts = {ratioA1} + {ratioB1} = {totalParts}.\nStep 2: {nameA}\'s original share = {totalValue} ÷ {totalParts} × {ratioA1} = {valueA}.\nStep 3: After giving away {transfer}: {valueA} − {transfer} = {answer}.\nAnswer: {answer}.',
    scaffold: rs(['Finding new amounts after a transfer changes a ratio', 'Simply subtracting the transfer', 'Dividing equally after transfer', 'Multiplying both ratio parts by transfer'],
      ['{nameA}\'s stickers after transfer', 'Total stickers after transfer', '{nameB}\'s original amount', 'How many were lost'],
      'twoStep', { steps: [{ operation: 'division-then-multiply', expression: '{totalValue} ÷ ({ratioA1}+{ratioB1}) × {ratioA1}', label: 'Find {nameA}\'s original amount' },
        { operation: 'subtraction', expression: '{valueA} - {transfer}', label: 'Subtract the transfer' }], answer: '{answer}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/forgot-total-parts', 'psl/wrong-operation'] },
  }),
  mt('psl-tpl-ratio-change-02', 'psl-p5-ratio-change', {
    difficulty: 3,
    contexts: [{ setting: 'marble game', entityA: 'red marbles', entityB: 'blue marbles', verb: 'added' }],
    constraints: { _generic: { ratioA1:{min:2,max:5}, ratioB1:{min:1,max:4}, added:{min:6,max:24}, totalValue:{min:40,max:120} },
      _compute: { answer: 'totalValue/(ratioA1+ratioB1)*ratioA1+added'}, answer: { min: 10 } },
    storyTemplate: 'A bag had {entityA} and {entityB} in the ratio {ratioA1} : {ratioB1} with {totalValue} marbles. After adding {added} {entityA}, how many {entityA} are there now?',
    solutionTemplate: 'Step 1: Total parts = {ratioA1} + {ratioB1} = {totalParts}.\nStep 2: Original {entityA} = {totalValue} ÷ {totalParts} × {ratioA1} = {valueA}.\nStep 3: After adding {added}: {valueA} + {added} = {answer}.\nAnswer: {answer}.',
    scaffold: rs(['Finding a new amount after adding to one ratio part', 'Subtracting added from total', 'Dividing new total by old ratio', 'Ignoring ratio and just adding'],
      ['New number of {entityA}', 'Original {entityA}', 'Total marbles now', 'New ratio'],
      'twoStep', { steps: [{ operation: 'division-then-multiply', expression: '{totalValue} ÷ ({ratioA1}+{ratioB1}) × {ratioA1}', label: 'Find original {entityA}' },
        { operation: 'addition', expression: '{valueA} + {added}', label: 'Add the extra' }], answer: '{answer}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/forgot-total-parts', 'psl/arithmetic-error'] },
  }),
  mt('psl-tpl-ratio-change-03', 'psl-p5-ratio-change', {
    difficulty: 3,
    contexts: [{ setting: 'class library', entityA: 'English books', entityB: 'Chinese books', verb: 'returned' }],
    constraints: { _generic: { ratioA1:{min:3,max:6}, ratioB1:{min:2,max:5}, removed:{min:4,max:20}, totalValue:{min:50,max:150} },
      _compute: { answer: 'totalValue/(ratioA1+ratioB1)*ratioB1'}, answer: { min: 8 } },
    storyTemplate: 'Ratio of {entityA} to {entityB} was {ratioA1} : {ratioB1} with {totalValue} books. After {removed} {entityA} were returned, how many {entityB} are there? ({entityB} did not change.)',
    solutionTemplate: 'Step 1: Total parts = {ratioA1} + {ratioB1} = {totalParts}.\nStep 2: {entityB} = {totalValue} ÷ {totalParts} × {ratioB1} = {answer}.\nStep 3: {entityB} did not change, so the answer stays the same.\nAnswer: {answer}.',
    scaffold: rs(['Finding the unchanged part after one ratio part is reduced', 'Subtracting from both parts', 'Dividing new total by 2', 'Adding removed books back'],
      ['Number of {entityB}', 'New total', '{entityA} remaining', 'New ratio'],
      'expression', { operation: 'division-then-multiply', expression: '{totalValue} ÷ ({ratioA1}+{ratioB1}) × {ratioB1}', answer: '{answer}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/wrong-ratio-order', 'psl/arithmetic-error'] },
  }),

  // ═══ P5 RATIO TO FRACTION ×2 ═══
  mt('psl-tpl-ratio-frac-01', 'psl-p5-ratio-fraction', {
    difficulty: 2,
    contexts: [{ setting: 'pocket money', entityA: 'savings', entityB: 'spending', verb: 'sets aside' }],
    constraints: { ratioA: { min: 2, max: 5 }, ratioB: { min: 1, max: 4 }, totalValue: { min: 30, max: 100 } },
    storyTemplate: '{nameA} divides ${totalValue} for {entityA} and {entityB} in the ratio {ratioA} : {ratioB}. What fraction of the money is for {entityA}?',
    solutionTemplate: 'Step 1: Total parts = {ratioA} + {ratioB} = {totalParts}.\nStep 2: Fraction for {entityA} = {ratioA} ÷ {totalParts} = {fractionA}.\nAnswer: {fractionA}.',
    scaffold: rs(['Expressing one ratio part as a fraction of the whole', 'Dividing total by the bigger part', 'Subtracting the two ratio numbers', 'Multiplying ratio parts'],
      ['Fraction for {entityA}', 'Amount for {entityA}', 'Difference', 'Total amount'],
      'expression', { operation: 'fraction', expression: '{ratioA} / ({ratioA}+{ratioB})', answer: '{fractionA}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/ratio-fraction-confusion', 'psl/forgot-total-parts'] },
  }),
  mt('psl-tpl-ratio-frac-02', 'psl-p5-ratio-fraction', {
    difficulty: 2,
    contexts: [{ setting: 'CCA', entityA: 'boys', entityB: 'girls', itemPlural: 'members', verb: 'are' }],
    constraints: { ratioA: { min: 3, max: 5 }, ratioB: { min: 2, max: 4 }, totalValue: { min: 30, max: 90 } },
    storyTemplate: 'In a CCA, the ratio of {entityA} to {entityB} is {ratioA} : {ratioB}. There are {totalValue} {itemPlural}. What fraction are {entityB}? How many {entityB}?',
    solutionTemplate: 'Step 1: Total parts = {ratioA} + {ratioB} = {totalParts}.\nStep 2: Fraction of {entityB} = {ratioB} ÷ {totalParts} = {fractionB}.\nStep 3: Number of {entityB} = {fractionB} × {totalValue} = {valueB}.\nAnswer: {fractionB} of the members; {valueB} {entityB}.',
    scaffold: rs(['Using a ratio to express a part as a fraction then computing', 'Dividing total by 2', 'Subtracting boys from total', 'Multiplying both parts by total'],
      ['Fraction and number of {entityB}', 'Only the fraction', 'Only the number', 'Ratio of girls to total'],
      'twoStep', { steps: [{ operation: 'fraction', expression: '{ratioB} / ({ratioA}+{ratioB})', label: 'Express as fraction' },
        { operation: 'multiplication', expression: '{fractionB} × {totalValue}', label: 'Find the number' }], answer: '{valueB}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/ratio-fraction-confusion', 'psl/arithmetic-error'] },
  }),

  // ═══ P6 MULTI-STEP RATIO ×3 ═══
  mt('psl-tpl-ratio-multi-01', 'psl-p6-ratio-multi-step', {
    difficulty: 2,
    contexts: [{ setting: 'class fund', entityA: 'Class A', entityB: 'Class B', verb: 'collected' }],
    constraints: { _generic: { ratioA:{min:2,max:5}, ratioB:{min:1,max:4}, totalValue:{min:60,max:200}, extra:{min:10,max:40} },
      _compute: { answer: 'totalValue/(ratioA+ratioB)*ratioA+extra'}, answer: { min: 20 } },
    storyTemplate: '{entityA} and {entityB} raised money in the ratio {ratioA} : {ratioB}, totalling ${totalValue}. A donor gave ${extra} more to {entityA}. How much does {entityA} have now?',
    solutionTemplate: 'Step 1: Total parts = {ratioA} + {ratioB} = {totalParts}.\nStep 2: {entityA} original share = {totalValue} ÷ {totalParts} × {ratioA} = {shareA}.\nStep 3: After donation: {shareA} + {extra} = {answer}.\nAnswer: ${answer}.',
    scaffold: rs(['Using a ratio to find one part then adding extra', 'Adding extra to total first', 'Dividing new total by ratio', 'Splitting equally'],
      ['{entityA} after donation', 'Original amount', 'New ratio', 'Total after donation'],
      'twoStep', { steps: [{ operation: 'division-then-multiply', expression: '{totalValue} ÷ ({ratioA}+{ratioB}) × {ratioA}', label: 'Find original share' },
        { operation: 'addition', expression: '{shareA} + {extra}', label: 'Add extra donation' }], answer: '{answer}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/forgot-total-parts', 'psl/arithmetic-error'] },
  }),
  mt('psl-tpl-ratio-multi-02', 'psl-p6-ratio-multi-step', {
    difficulty: 2,
    contexts: [{ setting: 'hawker centre', entityA: 'chicken rice', entityB: 'laksa', verb: 'ordered' }],
    constraints: { _generic: { ratioA:{min:2,max:5}, ratioB:{min:1,max:4}, totalValue:{min:40,max:120}, pricePerUnit:{min:3,max:8} },
      _compute: { unitsA: 'totalValue/(ratioA+ratioB)*ratioA', answer: 'totalValue/(ratioA+ratioB)*ratioA*pricePerUnit'}, answer: { min: 15 } },
    storyTemplate: 'Orders of {entityA} and {entityB} were in the ratio {ratioA} : {ratioB} with {totalValue} orders total. Each {entityA} costs ${pricePerUnit}. How much was collected from {entityA}?',
    solutionTemplate: 'Step 1: Total parts = {ratioA} + {ratioB} = {totalParts}.\nStep 2: {entityA} orders = {totalValue} ÷ {totalParts} × {ratioA} = {unitsA}.\nStep 3: Revenue = {unitsA} × {pricePerUnit} = {answer}.\nAnswer: ${answer}.',
    scaffold: rs(['Finding a ratio part then multiplying by price', 'Multiplying total orders by price', 'Dividing total by price', 'Subtracting laksa orders'],
      ['Revenue from {entityA}', 'Number of {entityA} orders', 'Cost per {entityA}', 'Ratio as fraction'],
      'twoStep', { steps: [{ operation: 'division-then-multiply', expression: '{totalValue} ÷ ({ratioA}+{ratioB}) × {ratioA}', label: 'Find {entityA} orders' },
        { operation: 'multiplication', expression: '{unitsA} × {pricePerUnit}', label: 'Find revenue' }], answer: '{answer}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/forgot-total-parts', 'psl/wrong-operation'] },
  }),

  // ═══ P6 RATIO & PERCENTAGE ×3 ═══
  mt('psl-tpl-ratio-pct-01', 'psl-p6-ratio-percent', {
    difficulty: 3,
    contexts: [{ setting: 'survey', entityA: 'boys', entityB: 'girls', itemPlural: 'students', verb: 'surveyed' }],
    constraints: { ratioA: { min: 2, max: 5 }, ratioB: { min: 1, max: 4 }, totalValue: { min: 40, max: 200 } },
    storyTemplate: 'In a {setting}, the ratio of {entityA} to {entityB} is {ratioA} : {ratioB}. There are {totalValue} {itemPlural}. What percentage are {entityA}?',
    solutionTemplate: 'Step 1: Total parts = {ratioA} + {ratioB} = {totalParts}.\nStep 2: Fraction of {entityA} = {ratioA} ÷ {totalParts}.\nStep 3: Percentage = ({ratioA} ÷ {totalParts}) × 100 = {percentage}%.\nAnswer: {percentage}%.',
    scaffold: rs(['Converting a ratio part into a percentage', 'Dividing one part by the other', 'Multiplying both parts by 100', 'Subtracting 50%'],
      ['Percentage of {entityA}', 'Number of {entityA}', 'Fraction of {entityB}', 'Ratio as decimal'],
      'twoStep', { steps: [{ operation: 'fraction', expression: '{ratioA} / ({ratioA}+{ratioB})', label: 'Express as fraction' },
        { operation: 'multiplication', expression: '{fraction} × 100', label: 'Convert to percentage' }], answer: '{percentage}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/ratio-percent-confusion', 'psl/arithmetic-error'] },
  }),
  mt('psl-tpl-ratio-pct-02', 'psl-p6-ratio-percent', {
    difficulty: 3,
    contexts: [{ setting: 'class donation', entityA: 'cash', entityB: 'vouchers', verb: 'donated' }],
    constraints: { ratioA: { min: 3, max: 5 }, ratioB: { min: 1, max: 3 }, totalValue: { min: 50, max: 200 } },
    storyTemplate: '{nameA}\'s class donated {entityA} and {entityB} in the ratio {ratioA} : {ratioB} totalling ${totalValue}. What percentage was {entityB}?',
    solutionTemplate: 'Step 1: Total parts = {ratioA} + {ratioB} = {totalParts}.\nStep 2: Fraction of {entityB} = {ratioB} ÷ {totalParts}.\nStep 3: Percentage = ({ratioB} ÷ {totalParts}) × 100 = {percentage}%.\nAnswer: {percentage}%.',
    scaffold: rs(['Finding what percentage a ratio part is', 'Dividing total by 100', 'Subtracting cash from 100%', 'Multiplying ratio numbers'],
      ['Percentage of {entityB}', 'Dollar amount of {entityB}', 'Ratio as fraction', 'More cash than vouchers'],
      'twoStep', { steps: [{ operation: 'fraction', expression: '{ratioB} / ({ratioA}+{ratioB})', label: 'Express as fraction' },
        { operation: 'multiplication', expression: '{fraction} × 100', label: 'Convert to percentage' }], answer: '{percentage}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/ratio-percent-confusion', 'psl/forgot-total-parts'] },
  }),
  mt('psl-tpl-ratio-pct-03', 'psl-p6-ratio-percent', {
    difficulty: 3,
    contexts: [{ setting: 'fruit punch recipe', entityA: 'juice', entityB: 'water', unit: 'ml', verb: 'mixed' }],
    constraints: { ratioA: { min: 2, max: 4 }, ratioB: { min: 1, max: 3 }, totalValue: { min: 100, max: 500 } },
    storyTemplate: '{nameA} mixed {entityA} and {entityB} in the ratio {ratioA} : {ratioB} to make {totalValue} {unit}. What percentage is {entityA}? How many {unit}?',
    solutionTemplate: 'Step 1: Total parts = {ratioA} + {ratioB} = {totalParts}.\nStep 2: Percentage of {entityA} = ({ratioA} ÷ {totalParts}) × 100 = {percentage}%.\nStep 3: Amount of {entityA} = {percentage}% × {totalValue} = {amountA} {unit}.\nAnswer: {percentage}%; {amountA} {unit}.',
    scaffold: rs(['Converting a ratio to a percentage then finding the amount', 'Dividing total by ratio', 'Multiplying both parts by total', 'Subtracting water from total'],
      ['Percentage and amount of {entityA}', 'Only percentage', 'Only amount', 'Ratio of water to total'],
      'twoStep', { steps: [{ operation: 'multiplication', expression: '{ratioA}/({ratioA}+{ratioB}) × 100', label: 'Find percentage' },
        { operation: 'multiplication', expression: '{percentage}/100 × {totalValue}', label: 'Find amount' }], answer: '{amountA}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/ratio-percent-confusion', 'psl/arithmetic-error'] },
  }),

  // ═══ P6 UNCHANGED QUANTITY ×3 ═══
  mt('psl-tpl-ratio-unch-01', 'psl-p6-ratio-unchanged', {
    difficulty: 3,
    contexts: [{ setting: 'pencil case', entityA: 'pens', entityB: 'pencils', verb: 'added' }],
    constraints: { _generic: { ratioA1:{min:2,max:4}, ratioB1:{min:3,max:5}, ratioA2:{min:3,max:5}, ratioB2:{min:3,max:5}, unchangedValue:{min:12,max:60} },
      _compute: { answer: 'unchangedValue/ratioB1*ratioA1'}, answer: { min: 5 } },
    storyTemplate: 'Ratio of {entityA} to {entityB} was {ratioA1} : {ratioB1}. After adding some {entityA}, ratio became {ratioA2} : {ratioB2}. {entityB} stayed at {unchangedValue}. How many {entityA} were there at first?',
    solutionTemplate: 'Step 1: {entityB} stayed at {unchangedValue}. Value of 1 part (old ratio) = {unchangedValue} ÷ {ratioB1}.\nStep 2: Original {entityA} = ({unchangedValue} ÷ {ratioB1}) × {ratioA1} = {answer}.\nAnswer: {answer}.',
    scaffold: rs(['Using the unchanged quantity to find original amounts', 'Subtracting old ratio from new', 'Dividing unchanged by both ratios', 'Multiplying two ratio numbers'],
      ['Original {entityA}', 'New {entityA}', '{entityA} added', 'Total at first'],
      'expression', { operation: 'division-then-multiply', expression: '{unchangedValue} ÷ {ratioB1} × {ratioA1}', answer: '{answer}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/unchanged-qty-confusion', 'psl/wrong-ratio-order'] },
  }),
  mt('psl-tpl-ratio-unch-02', 'psl-p6-ratio-unchanged', {
    difficulty: 3,
    contexts: [{ setting: 'savings account', entityA: '{nameA}\'s savings', entityB: '{nameB}\'s savings', verb: 'withdrew' }],
    constraints: { _generic: { ratioA1:{min:3,max:5}, ratioB1:{min:2,max:4}, ratioA2:{min:2,max:4}, ratioB2:{min:2,max:4}, unchangedValue:{min:20,max:80} },
      _compute: { answer: 'unchangedValue/ratioA1*(ratioA1+ratioB1)'}, answer: { min: 20 } },
    storyTemplate: 'Ratio of {nameA}\'s to {nameB}\'s savings was {ratioA1} : {ratioB1}. After {nameB} withdrew money, ratio became {ratioA2} : {ratioB2}. {nameA}\'s stayed at ${unchangedValue}. What was the total savings at first?',
    solutionTemplate: 'Step 1: {nameA}\'s savings stayed at {unchangedValue}. Value of 1 part = {unchangedValue} ÷ {ratioA1} = {valuePer}.\nStep 2: Total parts = {ratioA1} + {ratioB1} = {totalParts}.\nStep 3: Original total = {valuePer} × {totalParts} = {answer}.\nAnswer: ${answer}.',
    scaffold: rs(['Using unchanged savings to find the original total', 'Subtracting withdrawn amount', 'Dividing by new ratio', 'Adding both ratios'],
      ['Total at first', '{nameB}\'s original savings', 'Amount withdrawn', '{nameA}\'s fraction'],
      'twoStep', { steps: [{ operation: 'division', expression: '{unchangedValue} ÷ {ratioA1}', label: 'Find value of 1 part' },
        { operation: 'multiplication', expression: '{valuePer} × ({ratioA1}+{ratioB1})', label: 'Find original total' }], answer: '{answer}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/unchanged-qty-confusion', 'psl/arithmetic-error'] },
  }),
  mt('psl-tpl-ratio-unch-03', 'psl-p6-ratio-unchanged', {
    difficulty: 3,
    contexts: [{ setting: 'fish tank', entityA: 'guppies', entityB: 'goldfish', verb: 'added' }],
    constraints: { _generic: { ratioA1:{min:2,max:4}, ratioB1:{min:3,max:5}, ratioA2:{min:3,max:6}, ratioB2:{min:3,max:5}, unchangedValue:{min:15,max:50} },
      _compute: { originalA: 'unchangedValue/ratioB1*ratioA1', newA: 'unchangedValue/ratioB2*ratioA2',
        answer: 'unchangedValue/ratioB2*ratioA2 - unchangedValue/ratioB1*ratioA1'}, answer: { min: 2 } },
    storyTemplate: 'Ratio of {entityA} to {entityB} was {ratioA1} : {ratioB1}. After adding {entityA}, ratio became {ratioA2} : {ratioB2}. {entityB} stayed at {unchangedValue}. How many {entityA} were added?',
    solutionTemplate: 'Step 1: {entityB} stayed at {unchangedValue}.\nStep 2: Original {entityA} = ({unchangedValue} ÷ {ratioB1}) × {ratioA1} = {originalA}.\nStep 3: New {entityA} = ({unchangedValue} ÷ {ratioB2}) × {ratioA2} = {newA}.\nStep 4: {entityA} added = {newA} − {originalA} = {answer}.\nAnswer: {answer}.',
    scaffold: rs(['Comparing original and new amounts to find how many added', 'Subtracting the two ratio parts', 'Dividing unchanged by ratio difference', 'Multiplying ratios by unchanged'],
      ['{entityA} added', 'Original {entityA}', 'New {entityA}', 'New total'],
      'twoStep', { steps: [{ operation: 'division-then-multiply', expression: '{unchangedValue} ÷ {ratioB1} × {ratioA1}', label: 'Find original {entityA}' },
        { operation: 'subtraction', expression: '{newA} - {originalA}', label: 'Find how many added' }], answer: '{answer}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/unchanged-qty-confusion', 'psl/wrong-ratio-order', 'psl/arithmetic-error'] },
  }),
];

// ── Seed runner ───────────────────────────────────────────────────────
async function seed() {
  await connectDB();
  let upserted = 0;
  for (const t of TEMPLATES) {
    await PSLProblemTemplate.findOneAndUpdate({ templateId: t.templateId }, { $set: t }, { upsert: true, new: true });
    upserted++;
  }
  console.log(`Seeded ${upserted} PSL ratio problem templates.`);
  await mongoose.disconnect();
}
seed().catch((err) => { console.error(err); process.exit(1); });
