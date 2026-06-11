import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLProblemTemplate from '../models/psl/PSLProblemTemplate.js';
import { strategyScaffold, makeTemplate } from './pslTemplateFactory.js';

const S = ['Find the pattern rule by looking at differences between terms', 'Try dividing each term by the previous one', 'Draw a bar model', 'Use guess and check'];
const ps = (u, q, st, ss) => strategyScaffold({ understand: u, questionChoices: q, strategyChoices: S, solveType: st, solveSpec: ss });
const mt = (id, sk, o) => makeTemplate(id, sk, 'patternRecognition', { heuristic: 'pattern-recognition', ...o });

const TEMPLATES = [
  // ══════════════════════════════════════════════════════════════════════
  //  P4 CONSTANT DIFFERENCE  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  mt('psl-tpl-pat-constdiff-01', 'psl-p4-pat-constant-diff', {
    difficulty: 1,
    contexts: [
      { setting: 'maths exam', entity: 'number pattern' },
      { setting: 'classroom quiz', entity: 'number sequence' },
    ],
    constraints: {
      _generic: { start: { min: 1, max: 20 }, step: { min: 2, max: 7 }, n: { min: 5, max: 8 } },
      _compute: {
        term1: (n) => n.start,
        term2: (n) => n.start + n.step,
        term3: (n) => n.start + 2 * n.step,
        term4: (n) => n.start + 3 * n.step,
        answer: (n) => n.start + (n.n - 1) * n.step,
      },
      answer: { min: 10 },
    },
    storyTemplate: 'Look at this number pattern: {{term1}}, {{term2}}, {{term3}}, {{term4}}, ... What is the {{n}}th term?',
    solutionTemplate: 'The pattern adds {{step}} each time. The {{n}}th term = {{start}} + ({{n}} − 1) × {{step}} = {{answer}}.',
    scaffold: ps(
      ['A number pattern with a constant difference between terms', 'A repeating pattern of shapes', 'A decreasing sequence of numbers', 'A random list of numbers'],
      ['The {{n}}th term of the pattern', 'The sum of all terms', 'The difference between the first and last term', 'How many terms are in the pattern'],
      'expression', { operation: 'pattern-rule', expression: '{{start}} + ({{n}} − 1) × {{step}}', answer: '{{answer}}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/wrong-pattern-rule', 'psl/arithmetic-error'] },
  }),
  mt('psl-tpl-pat-constdiff-02', 'psl-p4-pat-constant-diff', {
    difficulty: 1,
    contexts: [
      { setting: 'assembly hall', entity: 'chairs', verb: 'arranged' },
      { setting: 'school canteen', entity: 'tables', verb: 'set up' },
    ],
    constraints: {
      _generic: { start: { min: 3, max: 15 }, step: { min: 3, max: 6 }, n: { min: 6, max: 8 } },
      _compute: {
        term1: (n) => n.start,
        term2: (n) => n.start + n.step,
        term3: (n) => n.start + 2 * n.step,
        term4: (n) => n.start + 3 * n.step,
        answer: (n) => n.start + (n.n - 1) * n.step,
      },
      answer: { min: 15 },
    },
    storyTemplate: '{entity} in the {setting} are {verb} in rows. Row 1 has {{term1}}, Row 2 has {{term2}}, Row 3 has {{term3}}, Row 4 has {{term4}}. How many {entity} are in Row {{n}}?',
    solutionTemplate: 'Each row has {{step}} more than the previous. Row {{n}} = {{start}} + ({{n}} − 1) × {{step}} = {{answer}}.',
    scaffold: ps(
      ['An arrangement where each row has a fixed number more than the previous', 'Rows with random numbers of items', 'Equal rows of items', 'Decreasing rows of items'],
      ['The number of {entity} in Row {{n}}', 'The total {entity} in all rows', 'The difference between first and last row', 'How many rows there are'],
      'expression', { operation: 'pattern-rule', expression: '{{start}} + ({{n}} − 1) × {{step}}', answer: '{{answer}}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/wrong-pattern-rule', 'psl/pattern-arithmetic-error'] },
  }),
  mt('psl-tpl-pat-constdiff-03', 'psl-p4-pat-constant-diff', {
    difficulty: 1,
    contexts: [
      { setting: 'MRT station', entity: 'platform numbers' },
      { setting: 'HDB block', entity: 'floor numbers' },
    ],
    constraints: {
      _generic: { start: { min: 2, max: 10 }, step: { min: 2, max: 5 }, n: { min: 5, max: 8 } },
      _compute: {
        term1: (n) => n.start,
        term2: (n) => n.start + n.step,
        term3: (n) => n.start + 2 * n.step,
        term4: (n) => n.start + 3 * n.step,
        answer: (n) => n.start + (n.n - 1) * n.step,
      },
      answer: { min: 10 },
    },
    storyTemplate: 'The {entity} at a {setting} follow this pattern: {{term1}}, {{term2}}, {{term3}}, {{term4}}, ... What is the {{n}}th number in the pattern?',
    solutionTemplate: 'The pattern increases by {{step}} each time. The {{n}}th number = {{start}} + ({{n}} − 1) × {{step}} = {{answer}}.',
    scaffold: ps(
      ['A number sequence increasing by a constant amount', 'A sequence of even numbers only', 'A decreasing pattern', 'A pattern that doubles each time'],
      ['The {{n}}th number in the pattern', 'The sum of all numbers', 'The largest number in the pattern', 'The common difference'],
      'expression', { operation: 'pattern-rule', expression: '{{start}} + ({{n}} − 1) × {{step}}', answer: '{{answer}}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/wrong-pattern-rule', 'psl/arithmetic-error'] },
  }),

  // ══════════════════════════════════════════════════════════════════════
  //  P4 REPEATING PATTERN  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  mt('psl-tpl-pat-repeat-01', 'psl-p4-pat-repeated', {
    difficulty: 2,
    contexts: [
      { setting: 'floor tile design', entity: 'tiles', colours: 'red, blue, green' },
      { setting: 'bead bracelet', entity: 'beads', colours: 'yellow, purple, white' },
    ],
    constraints: {
      _generic: { cycleLength: { min: 3, max: 4 }, n: { min: 15, max: 30 } },
      _compute: {
        position: (n) => ((n.n - 1) % n.cycleLength) + 1,
        answer: (n) => ((n.n - 1) % n.cycleLength) + 1,
      },
    },
    storyTemplate: 'A {setting} uses {colours} {entity} in a repeating pattern. The first {{cycleLength}} {entity} are {colours}. What colour is the {{n}}th {entity}?',
    solutionTemplate: '{{n}} ÷ {{cycleLength}} gives remainder {{position}}. The {{position}}th colour in the cycle is the answer.',
    scaffold: ps(
      ['A repeating colour pattern where we need to find a specific position', 'A pattern where each colour appears once', 'A growing pattern of colours', 'A random arrangement of colours'],
      ['The colour of the {{n}}th {entity}', 'How many {entity} there are altogether', 'How many times the pattern repeats', 'The total number of each colour'],
      'expression', { operation: 'modular', expression: '{{n}} mod {{cycleLength}}', answer: '{{answer}}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/wrong-pattern-rule', 'psl/pattern-arithmetic-error'] },
  }),
  mt('psl-tpl-pat-repeat-02', 'psl-p4-pat-repeated', {
    difficulty: 2,
    contexts: [
      { setting: 'school fence', entity: 'shapes', pattern: 'circle, triangle, square' },
      { setting: 'art class border', entity: 'shapes', pattern: 'star, heart, diamond, moon' },
    ],
    constraints: {
      _generic: { cycleLength: { min: 3, max: 4 }, n: { min: 20, max: 40 } },
      _compute: {
        fullCycles: (n) => Math.floor(n.n / n.cycleLength),
        remainder: (n) => n.n % n.cycleLength,
        answer: (n) => Math.floor(n.n / n.cycleLength) + (n.n % n.cycleLength > 0 ? 1 : 0),
      },
    },
    storyTemplate: '{nameA} draws a {setting} pattern: {pattern}. The pattern repeats over and over. What shape is in position {{n}}?',
    solutionTemplate: 'Divide {{n}} by {{cycleLength}}. The remainder tells us the position within one cycle.',
    scaffold: ps(
      ['A repeating shape pattern where we find a shape at a given position', 'A growing pattern of shapes', 'An alternating pattern of two shapes', 'A decreasing number of shapes'],
      ['The shape at position {{n}}', 'The total number of shapes', 'How many complete cycles fit in {{n}}', 'Which shape appears most often'],
      'expression', { operation: 'modular', expression: '{{n}} mod {{cycleLength}}', answer: '{{answer}}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/wrong-pattern-rule', 'psl/pattern-arithmetic-error'] },
  }),
  mt('psl-tpl-pat-repeat-03', 'psl-p4-pat-repeated', {
    difficulty: 2,
    contexts: [
      { setting: 'National Day decoration', entity: 'flags', colours: 'red, white' },
      { setting: 'Hari Raya banner', entity: 'lights', colours: 'green, yellow, white' },
    ],
    constraints: {
      _generic: { cycleLength: { min: 2, max: 4 }, targetColourPos: { min: 1, max: 4 }, total: { min: 30, max: 50 } },
      _compute: {
        fullCycles: (n) => Math.floor(n.total / n.cycleLength),
        leftover: (n) => n.total % n.cycleLength,
        answer: (n) => Math.floor(n.total / n.cycleLength) + (n.total % n.cycleLength >= n.targetColourPos ? 1 : 0),
      },
    },
    storyTemplate: 'For a {setting}, {nameA} strings {{total}} {entity} in the repeating pattern {colours}. How many of the first colour are there among all {{total}} {entity}?',
    solutionTemplate: '{{total}} ÷ {{cycleLength}} = {{fullCycles}} remainder {{leftover}}. Count how many full cycles include the target colour, plus check the leftover.',
    scaffold: ps(
      ['Counting how many times one colour appears in a repeating pattern', 'Adding all the colours together', 'Finding which colour appears last', 'Multiplying total by cycle length'],
      ['How many of the first colour appear', 'The total number of {entity}', 'The number of complete cycles', 'Which colour appears last'],
      'twoStep', { steps: [
        { operation: 'division', expression: '{{total}} ÷ {{cycleLength}}', label: 'Find how many complete cycles' },
        { operation: 'addition', expression: '{{fullCycles}} + extra from remainder', label: 'Add any extra from the leftover' },
      ], answer: '{{answer}}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/wrong-pattern-rule', 'psl/arithmetic-error'] },
  }),

  // ══════════════════════════════════════════════════════════════════════
  //  P5 GROWING DIFFERENCE  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  mt('psl-tpl-pat-growing-01', 'psl-p5-pat-growing', {
    difficulty: 2,
    contexts: [
      { setting: 'maths exam', entity: 'number pattern' },
      { setting: 'enrichment class', entity: 'number sequence' },
    ],
    constraints: {
      _generic: { start: { min: 1, max: 10 }, step: { min: 2, max: 5 }, growth: { min: 1, max: 3 } },
      _compute: {
        term1: (n) => n.start,
        term2: (n) => n.start + n.step,
        term3: (n) => n.start + n.step + (n.step + n.growth),
        term4: (n) => n.start + n.step + (n.step + n.growth) + (n.step + 2 * n.growth),
        diff1: (n) => n.step,
        diff2: (n) => n.step + n.growth,
        diff3: (n) => n.step + 2 * n.growth,
        nextDiff: (n) => n.step + 3 * n.growth,
        answer: (n) => n.start + n.step + (n.step + n.growth) + (n.step + 2 * n.growth) + (n.step + 3 * n.growth),
      },
      answer: { min: 15 },
    },
    storyTemplate: 'Look at this {entity}: {{term1}}, {{term2}}, {{term3}}, {{term4}}, ... The differences between consecutive terms are increasing. What is the 5th term?',
    solutionTemplate: 'Differences: {{diff1}}, {{diff2}}, {{diff3}} — each grows by {{growth}}. Next difference = {{nextDiff}}. 5th term = {{term4}} + {{nextDiff}} = {{answer}}.',
    scaffold: ps(
      ['A number pattern where the differences between terms grow by a fixed amount', 'A pattern with a constant difference', 'A doubling pattern', 'A random sequence of numbers'],
      ['The 5th term of the pattern', 'The sum of all differences', 'The 10th term of the pattern', 'The common difference'],
      'twoStep', { steps: [
        { operation: 'subtraction', expression: '{{diff2}} − {{diff1}} = {{growth}}', label: 'Find how much the difference grows each time' },
        { operation: 'addition', expression: '{{term4}} + ({{diff3}} + {{growth}})', label: 'Add the next difference to the 4th term' },
      ], answer: '{{answer}}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/wrong-pattern-rule', 'psl/pattern-arithmetic-error'] },
  }),
  mt('psl-tpl-pat-growing-02', 'psl-p5-pat-growing', {
    difficulty: 2,
    contexts: [
      { setting: 'assembly hall', entity: 'chairs', verb: 'added' },
      { setting: 'concert venue', entity: 'seats', verb: 'added' },
    ],
    constraints: {
      _generic: { start: { min: 2, max: 8 }, step: { min: 1, max: 4 }, growth: { min: 1, max: 2 } },
      _compute: {
        term1: (n) => n.start,
        term2: (n) => n.start + n.step,
        term3: (n) => n.start + n.step + (n.step + n.growth),
        term4: (n) => n.start + n.step + (n.step + n.growth) + (n.step + 2 * n.growth),
        nextDiff: (n) => n.step + 3 * n.growth,
        answer: (n) => n.start + n.step + (n.step + n.growth) + (n.step + 2 * n.growth) + (n.step + 3 * n.growth),
      },
      answer: { min: 10 },
    },
    storyTemplate: '{entity} in the {setting} are {verb} in a pattern. Row 1 has {{term1}}, Row 2 has {{term2}}, Row 3 has {{term3}}, Row 4 has {{term4}}. Each row adds more {entity} than the row before. How many {entity} are in Row 5?',
    solutionTemplate: 'The differences grow by {{growth}} each time. Next difference = {{nextDiff}}. Row 5 = {{term4}} + {{nextDiff}} = {{answer}}.',
    scaffold: ps(
      ['A growing arrangement where each row adds more than the previous increase', 'Equal rows of items', 'Rows that double each time', 'A decreasing pattern'],
      ['The number of {entity} in Row 5', 'The total {entity} in all rows', 'The difference between Row 1 and Row 5', 'How many rows there are'],
      'twoStep', { steps: [
        { operation: 'subtraction', expression: 'Find the growth in differences', label: 'Find how much more is added each time' },
        { operation: 'addition', expression: '{{term4}} + {{nextDiff}}', label: 'Add the next difference to Row 4' },
      ], answer: '{{answer}}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/wrong-pattern-rule', 'psl/pattern-arithmetic-error'] },
  }),
  mt('psl-tpl-pat-growing-03', 'psl-p5-pat-growing', {
    difficulty: 3,
    contexts: [
      { setting: 'tile pattern', entity: 'tiles' },
      { setting: 'dot arrangement', entity: 'dots' },
    ],
    constraints: {
      _generic: { start: { min: 1, max: 6 }, step: { min: 2, max: 4 }, growth: { min: 2, max: 3 }, n: { min: 6, max: 7 } },
      _compute: {
        term1: (n) => n.start,
        term2: (n) => n.start + n.step,
        term3: (n) => n.start + n.step + (n.step + n.growth),
        term4: (n) => n.start + n.step + (n.step + n.growth) + (n.step + 2 * n.growth),
        answer: (n) => {
          let val = n.start; let diff = n.step;
          for (let i = 1; i < n.n; i++) { val += diff; diff += n.growth; }
          return val;
        },
      },
      answer: { min: 20 },
    },
    storyTemplate: 'A {setting} grows in this way: Figure 1 has {{term1}} {entity}, Figure 2 has {{term2}}, Figure 3 has {{term3}}, Figure 4 has {{term4}}. How many {entity} are in Figure {{n}}?',
    solutionTemplate: 'Differences grow by {{growth}} each step. Continue the pattern of differences until Figure {{n}} to get {{answer}}.',
    scaffold: ps(
      ['A growing figure pattern where the increase itself increases steadily', 'A repeating tile pattern', 'A pattern that doubles', 'A constant difference pattern'],
      ['The number of {entity} in Figure {{n}}', 'The total {entity} in all figures', 'The difference between Figure 1 and Figure {{n}}', 'The growth rate'],
      'twoStep', { steps: [
        { operation: 'subtraction', expression: 'List the differences and find the growth', label: 'Find the pattern in the differences' },
        { operation: 'addition', expression: 'Continue adding growing differences up to Figure {{n}}', label: 'Extend the pattern to Figure {{n}}' },
      ], answer: '{{answer}}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/wrong-pattern-rule', 'psl/wrong-nth-term'] },
  }),

  // ══════════════════════════════════════════════════════════════════════
  //  P5 MULTIPLY PATTERN  (2 templates)
  // ══════════════════════════════════════════════════════════════════════
  mt('psl-tpl-pat-multiply-01', 'psl-p5-pat-multiply', {
    difficulty: 2,
    contexts: [
      { setting: 'science experiment', entity: 'bacteria count' },
      { setting: 'maths exam', entity: 'number pattern' },
    ],
    constraints: {
      _generic: { start: { min: 2, max: 5 }, multiplier: { min: 2, max: 3 } },
      _compute: {
        term1: (n) => n.start,
        term2: (n) => n.start * n.multiplier,
        term3: (n) => n.start * n.multiplier ** 2,
        term4: (n) => n.start * n.multiplier ** 3,
        answer: (n) => n.start * n.multiplier ** 4,
      },
    },
    storyTemplate: 'Study this {entity}: {{term1}}, {{term2}}, {{term3}}, {{term4}}, ... Each term is multiplied by the same number. What is the 5th term?',
    solutionTemplate: 'Each term is multiplied by {{multiplier}}. 5th term = {{term4}} × {{multiplier}} = {{answer}}.',
    scaffold: ps(
      ['A pattern where each term is multiplied by a constant', 'A pattern with a constant difference', 'A repeating pattern', 'A decreasing sequence'],
      ['The 5th term', 'The sum of all five terms', 'The multiplier used', 'The difference between the 1st and 5th term'],
      'expression', { operation: 'multiplication', expression: '{{term4}} × {{multiplier}}', answer: '{{answer}}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/wrong-pattern-rule', 'psl/arithmetic-error'] },
  }),
  mt('psl-tpl-pat-multiply-02', 'psl-p5-pat-multiply', {
    difficulty: 2,
    contexts: [
      { setting: 'paper folding activity', entity: 'layers' },
      { setting: 'chain email puzzle', entity: 'people reached' },
    ],
    constraints: {
      _generic: { start: { min: 2, max: 4 }, multiplier: { min: 2, max: 3 } },
      _compute: {
        term1: (n) => n.start,
        term2: (n) => n.start * n.multiplier,
        term3: (n) => n.start * n.multiplier ** 2,
        term4: (n) => n.start * n.multiplier ** 3,
        term5: (n) => n.start * n.multiplier ** 4,
        answer: (n) => n.start * n.multiplier ** 5,
      },
    },
    storyTemplate: 'In a {setting}, the number of {entity} follows this pattern: {{term1}}, {{term2}}, {{term3}}, {{term4}}, {{term5}}, ... What is the 6th term?',
    solutionTemplate: 'Each term is ×{{multiplier}}. 6th term = {{term5}} × {{multiplier}} = {{answer}}.',
    scaffold: ps(
      ['A pattern that multiplies by the same number each step', 'A pattern that adds the same number each step', 'A repeating cycle', 'A random list'],
      ['The 6th term', 'The pattern rule', 'The total of all terms', 'The difference between consecutive terms'],
      'expression', { operation: 'multiplication', expression: '{{term5}} × {{multiplier}}', answer: '{{answer}}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/wrong-pattern-rule', 'psl/pattern-arithmetic-error'] },
  }),

  // ══════════════════════════════════════════════════════════════════════
  //  P5 FIND NTH TERM  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  mt('psl-tpl-pat-nth-01', 'psl-p5-pat-nth-term', {
    difficulty: 3,
    contexts: [
      { setting: 'maths exam', entity: 'number pattern' },
      { setting: 'enrichment worksheet', entity: 'sequence' },
    ],
    constraints: {
      _generic: { start: { min: 1, max: 10 }, step: { min: 2, max: 7 }, n: { min: 10, max: 20 } },
      _compute: {
        term1: (n) => n.start,
        term2: (n) => n.start + n.step,
        term3: (n) => n.start + 2 * n.step,
        term4: (n) => n.start + 3 * n.step,
        answer: (n) => n.start + (n.n - 1) * n.step,
      },
      answer: { min: 20 },
    },
    storyTemplate: 'A {entity} goes: {{term1}}, {{term2}}, {{term3}}, {{term4}}, ... Without listing every term, find the {{n}}th term directly.',
    solutionTemplate: 'Rule: start at {{start}}, add {{step}} each time. {{n}}th term = {{start}} + ({{n}} − 1) × {{step}} = {{answer}}.',
    scaffold: ps(
      ['Using a rule to jump directly to a large term number', 'Listing out every term until you reach the answer', 'Multiplying the first term by n', 'Guessing and checking'],
      ['The {{n}}th term', 'The pattern rule', 'The sum of the first {{n}} terms', 'The 4th term'],
      'expression', { operation: 'pattern-rule', expression: '{{start}} + ({{n}} − 1) × {{step}}', answer: '{{answer}}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/wrong-nth-term', 'psl/arithmetic-error'] },
  }),
  mt('psl-tpl-pat-nth-02', 'psl-p5-pat-nth-term', {
    difficulty: 3,
    contexts: [
      { setting: 'assembly hall', entity: 'chairs', verb: 'arranged' },
      { setting: 'stadium', entity: 'seats', verb: 'laid out' },
    ],
    constraints: {
      _generic: { start: { min: 5, max: 15 }, step: { min: 3, max: 6 }, n: { min: 12, max: 25 } },
      _compute: {
        term1: (n) => n.start,
        term2: (n) => n.start + n.step,
        term3: (n) => n.start + 2 * n.step,
        answer: (n) => n.start + (n.n - 1) * n.step,
      },
      answer: { min: 40 },
    },
    storyTemplate: '{entity} in an {setting} are {verb} so that Row 1 has {{term1}}, Row 2 has {{term2}}, Row 3 has {{term3}}, and so on, adding {{step}} each row. How many {entity} are in Row {{n}}?',
    solutionTemplate: 'Row {{n}} = {{start}} + ({{n}} − 1) × {{step}} = {{answer}}.',
    scaffold: ps(
      ['Finding a specific row using the nth-term rule', 'Counting every row one by one', 'Multiplying the step by n', 'Adding all rows together'],
      ['How many {entity} in Row {{n}}', 'The total {entity} in all rows', 'The difference between the first and last row', 'How many rows there are'],
      'expression', { operation: 'pattern-rule', expression: '{{start}} + ({{n}} − 1) × {{step}}', answer: '{{answer}}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/wrong-nth-term', 'psl/pattern-arithmetic-error'] },
  }),
  mt('psl-tpl-pat-nth-03', 'psl-p5-pat-nth-term', {
    difficulty: 3,
    contexts: [
      { setting: 'MRT station numbering', entity: 'station code numbers' },
      { setting: 'bus stop numbering', entity: 'bus stop codes' },
    ],
    constraints: {
      _generic: { start: { min: 100, max: 200 }, step: { min: 3, max: 8 }, n: { min: 15, max: 30 } },
      _compute: {
        term1: (n) => n.start,
        term2: (n) => n.start + n.step,
        term3: (n) => n.start + 2 * n.step,
        answer: (n) => n.start + (n.n - 1) * n.step,
      },
      answer: { min: 120 },
    },
    storyTemplate: '{entity} along a route follow a pattern: {{term1}}, {{term2}}, {{term3}}, ... Each increases by {{step}}. What is the code of the {{n}}th stop?',
    solutionTemplate: '{{n}}th stop = {{start}} + ({{n}} − 1) × {{step}} = {{answer}}.',
    scaffold: ps(
      ['Applying an nth-term formula for a constant-difference pattern', 'Listing all stop numbers', 'Multiplying the first code by {{n}}', 'Dividing the last code by the first'],
      ['The {{n}}th stop code', 'The total of all codes', 'How many stops there are', 'The first and last codes'],
      'expression', { operation: 'pattern-rule', expression: '{{start}} + ({{n}} − 1) × {{step}}', answer: '{{answer}}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/wrong-nth-term', 'psl/arithmetic-error'] },
  }),

  // ══════════════════════════════════════════════════════════════════════
  //  P6 ALGEBRAIC PATTERN  (3 templates)
  // ══════════════════════════════════════════════════════════════════════
  mt('psl-tpl-pat-algebraic-01', 'psl-p6-pat-algebraic', {
    difficulty: 3,
    contexts: [
      { setting: 'maths exam', entity: 'number pattern' },
      { setting: 'problem solving worksheet', entity: 'sequence' },
    ],
    constraints: {
      _generic: { a: { min: 2, max: 5 }, b: { min: 1, max: 10 }, n: { min: 20, max: 50 } },
      _compute: {
        term1: (n) => n.a * 1 + n.b,
        term2: (n) => n.a * 2 + n.b,
        term3: (n) => n.a * 3 + n.b,
        term4: (n) => n.a * 4 + n.b,
        answer: (n) => n.a * n.n + n.b,
      },
      answer: { min: 20 },
    },
    storyTemplate: 'A {entity} begins: {{term1}}, {{term2}}, {{term3}}, {{term4}}, ... Express the nth term as a formula. Then find the {{n}}th term.',
    solutionTemplate: 'The nth term = {{a}}n + {{b}}. The {{n}}th term = {{a}} × {{n}} + {{b}} = {{answer}}.',
    scaffold: ps(
      ['Expressing a linear pattern as an algebraic formula and using it to find a large term', 'Listing every term until reaching the answer', 'Multiplying the first term by n', 'Dividing a term by its position'],
      ['The {{n}}th term', 'The formula for the nth term', 'The sum of the first 4 terms', 'The common difference'],
      'twoStep', { steps: [
        { operation: 'pattern-rule', expression: 'nth term = {{a}}n + {{b}}', label: 'Find the formula for the nth term' },
        { operation: 'multiplication', expression: '{{a}} × {{n}} + {{b}}', label: 'Substitute n = {{n}} into the formula' },
      ], answer: '{{answer}}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/wrong-pattern-rule', 'psl/wrong-nth-term'] },
  }),
  mt('psl-tpl-pat-algebraic-02', 'psl-p6-pat-algebraic', {
    difficulty: 3,
    contexts: [
      { setting: 'tile pattern', entity: 'tiles', shape: 'square' },
      { setting: 'matchstick pattern', entity: 'matchsticks', shape: 'triangle' },
    ],
    constraints: {
      _generic: { a: { min: 2, max: 4 }, b: { min: 0, max: 5 }, n: { min: 25, max: 100 } },
      _compute: {
        term1: (n) => n.a * 1 + n.b,
        term2: (n) => n.a * 2 + n.b,
        term3: (n) => n.a * 3 + n.b,
        term4: (n) => n.a * 4 + n.b,
        answer: (n) => n.a * n.n + n.b,
      },
      answer: { min: 30 },
    },
    storyTemplate: '{nameA} builds {shape} figures using {entity}. Figure 1 uses {{term1}}, Figure 2 uses {{term2}}, Figure 3 uses {{term3}}, Figure 4 uses {{term4}}. Write a formula for the number of {entity} in Figure n. How many {entity} are in Figure {{n}}?',
    solutionTemplate: 'Formula: {{a}}n + {{b}}. Figure {{n}} = {{a}} × {{n}} + {{b}} = {{answer}}.',
    scaffold: ps(
      ['Finding a formula for a visual pattern and using it for a large figure number', 'Drawing Figure {{n}} and counting', 'Multiplying Figure 4 by a large number', 'Adding the first four terms together'],
      ['The number of {entity} in Figure {{n}}', 'The formula', 'The total {entity} in all figures', 'The difference between Figure 1 and Figure {{n}}'],
      'twoStep', { steps: [
        { operation: 'pattern-rule', expression: 'nth term = {{a}}n + {{b}}', label: 'Discover the formula' },
        { operation: 'multiplication', expression: '{{a}} × {{n}} + {{b}}', label: 'Compute the {{n}}th term' },
      ], answer: '{{answer}}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/wrong-pattern-rule', 'psl/arithmetic-error'] },
  }),
  mt('psl-tpl-pat-algebraic-03', 'psl-p6-pat-algebraic', {
    difficulty: 3,
    contexts: [
      { setting: 'seating arrangement', entity: 'seats', location: 'school hall' },
      { setting: 'planting pattern', entity: 'plants', location: 'school garden' },
    ],
    constraints: {
      _generic: { a: { min: 3, max: 5 }, b: { min: -2, max: 8 }, n: { min: 30, max: 60 } },
      _compute: {
        term1: (n) => n.a * 1 + n.b,
        term2: (n) => n.a * 2 + n.b,
        term3: (n) => n.a * 3 + n.b,
        answer: (n) => n.a * n.n + n.b,
      },
      answer: { min: 50 },
    },
    storyTemplate: 'In a {location}, {entity} are placed in a {setting}: Row 1 has {{term1}}, Row 2 has {{term2}}, Row 3 has {{term3}}, and so on. Write a formula for Row n. How many {entity} are in Row {{n}}?',
    solutionTemplate: 'Row n = {{a}}n + {{b}}. Row {{n}} = {{a}} × {{n}} + {{b}} = {{answer}}.',
    scaffold: ps(
      ['Deriving an algebraic rule from a physical arrangement', 'Counting each row individually', 'Doubling the last known row', 'Subtracting the first row from the last'],
      ['The number of {entity} in Row {{n}}', 'The formula for Row n', 'The total {entity}', 'The common difference'],
      'twoStep', { steps: [
        { operation: 'pattern-rule', expression: 'Row n = {{a}}n + {{b}}', label: 'Find the formula' },
        { operation: 'multiplication', expression: '{{a}} × {{n}} + {{b}}', label: 'Substitute n = {{n}}' },
      ], answer: '{{answer}}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/wrong-nth-term', 'psl/arithmetic-error'] },
  }),

  // ══════════════════════════════════════════════════════════════════════
  //  P6 TWO-VARIABLE PATTERN  (2 templates)
  // ══════════════════════════════════════════════════════════════════════
  mt('psl-tpl-pat-twovar-01', 'psl-p6-pat-two-variable', {
    difficulty: 3,
    contexts: [
      { setting: 'maths exam', entityX: 'number of bags', entityY: 'total cost ($)', verb: 'costs' },
      { setting: 'school bookshop', entityX: 'number of notebooks', entityY: 'total price ($)', verb: 'costs' },
    ],
    constraints: {
      _generic: { a: { min: 2, max: 8 }, b: { min: 0, max: 5 }, targetX: { min: 10, max: 20 } },
      _compute: {
        x1: () => 1, y1: (n) => n.a * 1 + n.b,
        x2: () => 2, y2: (n) => n.a * 2 + n.b,
        x3: () => 3, y3: (n) => n.a * 3 + n.b,
        x4: () => 4, y4: (n) => n.a * 4 + n.b,
        answer: (n) => n.a * n.targetX + n.b,
      },
      answer: { min: 15 },
    },
    storyTemplate: 'The table below shows the {entityX} (x) and {entityY} (y):\n| x | {{x1}} | {{x2}} | {{x3}} | {{x4}} |\n| y | {{y1}} | {{y2}} | {{y3}} | {{y4}} |\nFind the relationship between x and y. What is y when x = {{targetX}}?',
    solutionTemplate: 'y = {{a}}x + {{b}}. When x = {{targetX}}, y = {{a}} × {{targetX}} + {{b}} = {{answer}}.',
    scaffold: ps(
      ['Finding a formula linking two variables from a table of values', 'Adding all the y-values', 'Multiplying x by y', 'Finding the average of y-values'],
      ['The value of y when x = {{targetX}}', 'The sum of all y-values', 'The difference between the largest and smallest y', 'The formula relating x and y'],
      'twoStep', { steps: [
        { operation: 'pattern-rule', expression: 'y = {{a}}x + {{b}}', label: 'Find the rule connecting x and y' },
        { operation: 'multiplication', expression: '{{a}} × {{targetX}} + {{b}}', label: 'Substitute x = {{targetX}} into the rule' },
      ], answer: '{{answer}}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/wrong-pattern-rule', 'psl/wrong-nth-term'] },
  }),
  mt('psl-tpl-pat-twovar-02', 'psl-p6-pat-two-variable', {
    difficulty: 3,
    contexts: [
      { setting: 'floor tile design', entityX: 'figure number', entityY: 'number of tiles', verb: 'uses' },
      { setting: 'dot pattern', entityX: 'figure number', entityY: 'number of dots', verb: 'has' },
    ],
    constraints: {
      _generic: { a: { min: 3, max: 6 }, b: { min: -1, max: 4 }, targetX: { min: 15, max: 30 } },
      _compute: {
        x1: () => 1, y1: (n) => n.a * 1 + n.b,
        x2: () => 2, y2: (n) => n.a * 2 + n.b,
        x3: () => 3, y3: (n) => n.a * 3 + n.b,
        x4: () => 5, y4: (n) => n.a * 5 + n.b,
        answer: (n) => n.a * n.targetX + n.b,
      },
      answer: { min: 25 },
    },
    storyTemplate: 'A {setting} shows:\n| Figure (x) | {{x1}} | {{x2}} | {{x3}} | {{x4}} |\n| {entityY} (y) | {{y1}} | {{y2}} | {{y3}} | {{y4}} |\nNote: Figure 4 is missing! Find the rule and calculate the {entityY} for Figure {{targetX}}.',
    solutionTemplate: 'y = {{a}}x + {{b}}. For Figure {{targetX}}: y = {{a}} × {{targetX}} + {{b}} = {{answer}}.',
    scaffold: ps(
      ['Finding a relationship between two variables even when a value is missing', 'Guessing the missing value first', 'Adding consecutive y-values', 'Multiplying x and y together'],
      ['The {entityY} for Figure {{targetX}}', 'The missing y-value for Figure 4', 'The total of all y-values', 'The rule connecting x and y'],
      'twoStep', { steps: [
        { operation: 'pattern-rule', expression: 'y = {{a}}x + {{b}}', label: 'Use given pairs to find the rule' },
        { operation: 'multiplication', expression: '{{a}} × {{targetX}} + {{b}}', label: 'Apply the rule for x = {{targetX}}' },
      ], answer: '{{answer}}' }),
    misconceptions: { plan: ['psl/wrong-strategy'], solve: ['psl/wrong-pattern-rule', 'psl/arithmetic-error'] },
  }),
];

// ── Seed runner ───────────────────────────────────────────────────────
async function seed() {
  await connectDB();
  let upserted = 0;
  for (const t of TEMPLATES) {
    await PSLProblemTemplate.findOneAndUpdate(
      { templateId: t.templateId },
      { $set: t },
      { upsert: true, new: true },
    );
    upserted++;
  }
  console.log(`Seeded ${upserted} PSL pattern-recognition problem templates.`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
