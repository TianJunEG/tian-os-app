import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLProblemTemplate from '../models/psl/PSLProblemTemplate.js';
import { strategyScaffold, makeTemplate } from './pslTemplateFactory.js';

// ─── Skill definitions ──────────────────────────────────────────────
const skills = {
  // P5
  'psl-p5-sim-basic':        { level: 'P5', title: 'Simultaneous – Basic Elimination' },
  'psl-p5-sim-substitution':  { level: 'P5', title: 'Simultaneous – Substitution' },
  'psl-p5-sim-sum-diff':      { level: 'P5', title: 'Simultaneous – Sum & Difference' },
  // P6
  'psl-p6-sim-multiply-first': { level: 'P6', title: 'Simultaneous – Make Coefficients Equal' },
  'psl-p6-sim-three-items':   { level: 'P6', title: 'Simultaneous – Three-Item' },
  'psl-p6-sim-age':           { level: 'P6', title: 'Simultaneous – Age Problems' },
  'psl-p6-sim-money':         { level: 'P6', title: 'Simultaneous – Money Problems' },
  'psl-p6-sim-word':          { level: 'P6', title: 'Simultaneous – Word Problem' },
};

// ─── Scaffold helpers ───────────────────────────────────────────────
const eliminationScaffold = () => strategyScaffold({
  strategyChoices: [
    'Set up two equations and eliminate one unknown',
    'Draw a bar model',
    'Use guess and check',
    'Work backwards',
  ],
  correctStrategyIndex: 0,
  planChoices: [
    'Write two equations, subtract to eliminate one variable, then solve for the other',
    'Try different values until both conditions are met',
    'Draw two bars and compare their lengths',
    'Start from the answer and work backwards',
  ],
  correctPlanIndex: 0,
});

const substitutionScaffold = () => strategyScaffold({
  strategyChoices: [
    'Set up two equations and eliminate one unknown',
    'Draw a bar model',
    'Use guess and check',
    'Work backwards',
  ],
  correctStrategyIndex: 0,
  planChoices: [
    'Express one unknown in terms of the other, then substitute into the second equation',
    'Try different values until both conditions are met',
    'Draw two bars and compare their lengths',
    'Start from the answer and work backwards',
  ],
  correctPlanIndex: 0,
});

const sumDiffScaffold = () => strategyScaffold({
  strategyChoices: [
    'Set up two equations and eliminate one unknown',
    'Draw a bar model',
    'Use guess and check',
    'Work backwards',
  ],
  correctStrategyIndex: 0,
  planChoices: [
    'Add the sum and difference, then divide by 2 to find the larger value',
    'Try different pairs that add up to the sum',
    'Draw two bars showing the difference',
    'Start from the difference and work backwards',
  ],
  correctPlanIndex: 0,
});

const moneyScaffold = () => strategyScaffold({
  strategyChoices: [
    'Set up two equations and eliminate one unknown',
    'Draw a bar model',
    'Use guess and check',
    'Work backwards',
  ],
  correctStrategyIndex: 0,
  planChoices: [
    'Write one equation for the count and one for the total value, then eliminate',
    'Try different numbers of each coin until the total matches',
    'Draw bars for each coin type',
    'Start from the total value and work backwards',
  ],
  correctPlanIndex: 0,
});

// ─── Constraint presets ─────────────────────────────────────────────

// Basic elimination: two items, two shopping conditions
const basicConstraints = {
  _generic: { costA: { min: 2, max: 8 }, costB: { min: 1, max: 5 }, qtyA1: { min: 2, max: 5 }, qtyB1: { min: 1, max: 4 }, qtyA2: { min: 1, max: 3 }, qtyB2: { min: 1, max: 4 } },
  _compute: {
    total1: 'qtyA1 * costA + qtyB1 * costB',
    total2: 'qtyA2 * costA + qtyB2 * costB',
    answer: 'costA',
  },
  answer: { min: 2 },
};

// Substitution: one unknown expressed as multiple of the other
const substitutionConstraints = {
  _generic: { costB: { min: 1, max: 5 }, multiplier: { min: 2, max: 4 }, qtyA: { min: 2, max: 4 }, qtyB: { min: 1, max: 5 } },
  _compute: {
    costA: 'multiplier * costB',
    total: 'qtyA * (multiplier * costB) + qtyB * costB',
    answer: 'multiplier * costB',
  },
  answer: { min: 4 },
};

// Sum and difference
const sumDiffConstraints = {
  _generic: { valA: { min: 10, max: 50 }, valB: { min: 5, max: 30 } },
  _compute: {
    sum: 'valA + valB',
    diff: 'valA - valB',
    answer: 'valA',
  },
  answer: { min: 10 },
};

// Multiply-first: coefficients that need scaling
const multiplyFirstConstraints = {
  _generic: { costA: { min: 2, max: 8 }, costB: { min: 1, max: 6 }, qtyA1: { min: 2, max: 4 }, qtyB1: { min: 3, max: 5 }, qtyA2: { min: 3, max: 5 }, qtyB2: { min: 2, max: 4 } },
  _compute: {
    total1: 'qtyA1 * costA + qtyB1 * costB',
    total2: 'qtyA2 * costA + qtyB2 * costB',
    answer: 'costA',
  },
  answer: { min: 2 },
};

// Three-item: third item expressed via relationship
const threeItemConstraints = {
  _generic: { costA: { min: 2, max: 6 }, costB: { min: 1, max: 4 }, costCMultiplier: { min: 2, max: 3 }, qtyA1: { min: 1, max: 3 }, qtyB1: { min: 1, max: 3 }, qtyC1: { min: 1, max: 2 }, qtyA2: { min: 1, max: 3 }, qtyB2: { min: 1, max: 3 }, qtyC2: { min: 1, max: 2 } },
  _compute: {
    costC: 'costCMultiplier * costA',
    total1: 'qtyA1 * costA + qtyB1 * costB + qtyC1 * (costCMultiplier * costA)',
    total2: 'qtyA2 * costA + qtyB2 * costB + qtyC2 * (costCMultiplier * costA)',
    answer: 'costA',
  },
  answer: { min: 2 },
};

// Age problems
const ageConstraints = {
  _generic: { ageA: { min: 8, max: 40 }, ageB: { min: 5, max: 30 } },
  _compute: {
    sum: 'ageA + ageB',
    diff: 'ageA - ageB',
    answer: 'ageA',
  },
  answer: { min: 8 },
};

// Money: coins of two denominations
const moneyConstraints = {
  _generic: { countA: { min: 5, max: 20 }, countB: { min: 5, max: 20 }, valueA: { min: 50, max: 100 }, valueB: { min: 10, max: 50 } },
  _compute: {
    totalCoins: 'countA + countB',
    totalCents: 'countA * valueA + countB * valueB',
    totalDollars: '(countA * valueA + countB * valueB) / 100',
    answer: 'countA',
  },
  answer: { min: 5 },
};

// Word-problem (exam style): parking lot with vehicles and wheels
const wordConstraints = {
  _generic: { motorcycles: { min: 5, max: 20 }, cars: { min: 5, max: 20 } },
  _compute: {
    totalVehicles: 'motorcycles + cars',
    totalWheels: 'motorcycles * 2 + cars * 4',
    answer: 'motorcycles',
  },
  answer: { min: 5 },
};

// ─── Templates ──────────────────────────────────────────────────────
const templates = [
  // ══════════════════════════════════════════════════════════════════
  //  P5 BASIC ELIMINATION (3)
  // ══════════════════════════════════════════════════════════════════
  makeTemplate('psl-p5-sim-basic-001', 'psl-p5-sim-basic', 'simultaneous', {
    heuristic: 'simultaneous',
    difficulty: 1,
    story: 'At the school bookshop, {{qtyA1}} notebooks and {{qtyB1}} folders cost ${{total1}}. {{qtyA2}} notebooks and {{qtyB2}} folders cost ${{total2}}. Find the cost of one notebook.',
    solutionTemplate: 'Step 1: Equation 1 → {{qtyA1}} notebooks + {{qtyB1}} folders = ${{total1}}.\nStep 2: Equation 2 → {{qtyA2}} notebooks + {{qtyB2}} folders = ${{total2}}.\nStep 3: Subtract Equation 2 from Equation 1 (or vice-versa) to eliminate folders.\nStep 4: Solve for the cost of one notebook = ${{answer}}.\nAnswer: ${{answer}}.',
    constraints: basicConstraints,
    scaffold: eliminationScaffold(),
  }),
  makeTemplate('psl-p5-sim-basic-002', 'psl-p5-sim-basic', 'simultaneous', {
    heuristic: 'simultaneous',
    difficulty: 1,
    story: 'At a bakery, {{qtyA1}} buns and {{qtyB1}} cakes cost ${{total1}}. {{qtyA2}} buns and {{qtyB2}} cakes cost ${{total2}}. Find the cost of one bun.',
    solutionTemplate: 'Step 1: Equation 1 → {{qtyA1}} buns + {{qtyB1}} cakes = ${{total1}}.\nStep 2: Equation 2 → {{qtyA2}} buns + {{qtyB2}} cakes = ${{total2}}.\nStep 3: Subtract to eliminate cakes.\nStep 4: Solve for the cost of one bun = ${{answer}}.\nAnswer: ${{answer}}.',
    constraints: basicConstraints,
    scaffold: eliminationScaffold(),
  }),
  makeTemplate('psl-p5-sim-basic-003', 'psl-p5-sim-basic', 'simultaneous', {
    heuristic: 'simultaneous',
    difficulty: 2,
    story: 'At the school canteen, {{qtyA1}} curry puffs and {{qtyB1}} drinks cost ${{total1}}. {{qtyA2}} curry puffs and {{qtyB2}} drinks cost ${{total2}}. What is the cost of one curry puff?',
    solutionTemplate: 'Step 1: Equation 1 → {{qtyA1}} curry puffs + {{qtyB1}} drinks = ${{total1}}.\nStep 2: Equation 2 → {{qtyA2}} curry puffs + {{qtyB2}} drinks = ${{total2}}.\nStep 3: Subtract to eliminate drinks.\nStep 4: Cost of one curry puff = ${{answer}}.\nAnswer: ${{answer}}.',
    constraints: basicConstraints,
    scaffold: eliminationScaffold(),
  }),

  // ══════════════════════════════════════════════════════════════════
  //  P5 SUBSTITUTION (3)
  // ══════════════════════════════════════════════════════════════════
  makeTemplate('psl-p5-sim-substitution-001', 'psl-p5-sim-substitution', 'simultaneous', {
    heuristic: 'simultaneous',
    difficulty: 2,
    story: 'A pen costs {{multiplier}} times as much as an eraser. {{qtyA}} pens and {{qtyB}} erasers cost ${{total}} altogether. Find the cost of one pen.',
    solutionTemplate: 'Step 1: Let the cost of an eraser = $E. Then cost of a pen = ${{multiplier}}E.\nStep 2: {{qtyA}} × {{multiplier}}E + {{qtyB}} × E = ${{total}}.\nStep 3: Simplify and solve for E = ${{costB}}.\nStep 4: Cost of one pen = {{multiplier}} × ${{costB}} = ${{answer}}.\nAnswer: ${{answer}}.',
    constraints: substitutionConstraints,
    scaffold: substitutionScaffold(),
  }),
  makeTemplate('psl-p5-sim-substitution-002', 'psl-p5-sim-substitution', 'simultaneous', {
    heuristic: 'simultaneous',
    difficulty: 2,
    story: 'A hardcover book costs {{multiplier}} times as much as a paperback. Mrs Tan bought {{qtyA}} hardcover books and {{qtyB}} paperbacks for ${{total}}. Find the cost of a hardcover book.',
    solutionTemplate: 'Step 1: Let cost of a paperback = $P. Then hardcover = ${{multiplier}}P.\nStep 2: {{qtyA}} × {{multiplier}}P + {{qtyB}} × P = ${{total}}.\nStep 3: Simplify and solve for P = ${{costB}}.\nStep 4: Cost of hardcover = {{multiplier}} × ${{costB}} = ${{answer}}.\nAnswer: ${{answer}}.',
    constraints: substitutionConstraints,
    scaffold: substitutionScaffold(),
  }),
  makeTemplate('psl-p5-sim-substitution-003', 'psl-p5-sim-substitution', 'simultaneous', {
    heuristic: 'simultaneous',
    difficulty: 3,
    story: 'A box of coloured pencils costs {{multiplier}} times as much as a box of crayons. Mr Lee bought {{qtyA}} boxes of coloured pencils and {{qtyB}} boxes of crayons for ${{total}}. How much does a box of coloured pencils cost?',
    solutionTemplate: 'Step 1: Let cost of crayons = $C. Then coloured pencils = ${{multiplier}}C.\nStep 2: {{qtyA}} × {{multiplier}}C + {{qtyB}} × C = ${{total}}.\nStep 3: Simplify and solve for C = ${{costB}}.\nStep 4: Cost of coloured pencils = {{multiplier}} × ${{costB}} = ${{answer}}.\nAnswer: ${{answer}}.',
    constraints: substitutionConstraints,
    scaffold: substitutionScaffold(),
  }),

  // ══════════════════════════════════════════════════════════════════
  //  P5 SUM AND DIFFERENCE (3)
  // ══════════════════════════════════════════════════════════════════
  makeTemplate('psl-p5-sim-sum-diff-001', 'psl-p5-sim-sum-diff', 'simultaneous', {
    heuristic: 'simultaneous',
    difficulty: 1,
    story: 'Ali and Mei have ${{sum}} altogether. Ali has ${{diff}} more than Mei. How much does Ali have?',
    solutionTemplate: 'Step 1: Sum = ${{sum}}, Difference = ${{diff}}.\nStep 2: Ali = (Sum + Difference) ÷ 2 = (${{sum}} + ${{diff}}) ÷ 2 = ${{answer}}.\nAnswer: Ali has ${{answer}}.',
    constraints: sumDiffConstraints,
    scaffold: sumDiffScaffold(),
  }),
  makeTemplate('psl-p5-sim-sum-diff-002', 'psl-p5-sim-sum-diff', 'simultaneous', {
    heuristic: 'simultaneous',
    difficulty: 2,
    story: 'Ravi and Siti collected {{sum}} stickers altogether. Ravi collected {{diff}} more stickers than Siti. How many stickers did Ravi collect?',
    solutionTemplate: 'Step 1: Sum = {{sum}}, Difference = {{diff}}.\nStep 2: Ravi = ({{sum}} + {{diff}}) ÷ 2 = {{answer}}.\nAnswer: Ravi collected {{answer}} stickers.',
    constraints: sumDiffConstraints,
    scaffold: sumDiffScaffold(),
  }),
  makeTemplate('psl-p5-sim-sum-diff-003', 'psl-p5-sim-sum-diff', 'simultaneous', {
    heuristic: 'simultaneous',
    difficulty: 2,
    story: 'Two shelves in the library hold {{sum}} books altogether. The top shelf has {{diff}} more books than the bottom shelf. How many books are on the top shelf?',
    solutionTemplate: 'Step 1: Sum = {{sum}}, Difference = {{diff}}.\nStep 2: Top shelf = ({{sum}} + {{diff}}) ÷ 2 = {{answer}}.\nAnswer: The top shelf has {{answer}} books.',
    constraints: sumDiffConstraints,
    scaffold: sumDiffScaffold(),
  }),

  // ══════════════════════════════════════════════════════════════════
  //  P6 MULTIPLY-FIRST (3)
  // ══════════════════════════════════════════════════════════════════
  makeTemplate('psl-p6-sim-multiply-first-001', 'psl-p6-sim-multiply-first', 'simultaneous', {
    heuristic: 'simultaneous',
    difficulty: 3,
    story: 'At a stationery shop, {{qtyA1}} rulers and {{qtyB1}} protractors cost ${{total1}}. {{qtyA2}} rulers and {{qtyB2}} protractors cost ${{total2}}. Find the cost of one ruler.',
    solutionTemplate: 'Step 1: Equation 1 → {{qtyA1}} rulers + {{qtyB1}} protractors = ${{total1}}.\nStep 2: Equation 2 → {{qtyA2}} rulers + {{qtyB2}} protractors = ${{total2}}.\nStep 3: Multiply one equation so the coefficients of one unknown match.\nStep 4: Subtract to eliminate, then solve for the cost of one ruler = ${{answer}}.\nAnswer: ${{answer}}.',
    constraints: multiplyFirstConstraints,
    scaffold: eliminationScaffold(),
  }),
  makeTemplate('psl-p6-sim-multiply-first-002', 'psl-p6-sim-multiply-first', 'simultaneous', {
    heuristic: 'simultaneous',
    difficulty: 3,
    story: 'At a fruit stall, {{qtyA1}} mangoes and {{qtyB1}} papayas cost ${{total1}}. {{qtyA2}} mangoes and {{qtyB2}} papayas cost ${{total2}}. Find the cost of one mango.',
    solutionTemplate: 'Step 1: Equation 1 → {{qtyA1}} mangoes + {{qtyB1}} papayas = ${{total1}}.\nStep 2: Equation 2 → {{qtyA2}} mangoes + {{qtyB2}} papayas = ${{total2}}.\nStep 3: Multiply one equation to make coefficients equal.\nStep 4: Subtract and solve → cost of one mango = ${{answer}}.\nAnswer: ${{answer}}.',
    constraints: multiplyFirstConstraints,
    scaffold: eliminationScaffold(),
  }),
  makeTemplate('psl-p6-sim-multiply-first-003', 'psl-p6-sim-multiply-first', 'simultaneous', {
    heuristic: 'simultaneous',
    difficulty: 4,
    story: 'At a hawker centre, {{qtyA1}} plates of chicken rice and {{qtyB1}} bowls of laksa cost ${{total1}}. {{qtyA2}} plates of chicken rice and {{qtyB2}} bowls of laksa cost ${{total2}}. What is the cost of one plate of chicken rice?',
    solutionTemplate: 'Step 1: Equation 1 → {{qtyA1}} chicken rice + {{qtyB1}} laksa = ${{total1}}.\nStep 2: Equation 2 → {{qtyA2}} chicken rice + {{qtyB2}} laksa = ${{total2}}.\nStep 3: Scale one equation so coefficients match, then subtract.\nStep 4: Cost of one plate of chicken rice = ${{answer}}.\nAnswer: ${{answer}}.',
    constraints: multiplyFirstConstraints,
    scaffold: eliminationScaffold(),
  }),

  // ══════════════════════════════════════════════════════════════════
  //  P6 THREE-ITEM (2)
  // ══════════════════════════════════════════════════════════════════
  makeTemplate('psl-p6-sim-three-items-001', 'psl-p6-sim-three-items', 'simultaneous', {
    heuristic: 'simultaneous',
    difficulty: 4,
    story: 'A gift set contains notebooks, pens, and pencil cases. A pencil case costs {{costCMultiplier}} times as much as a notebook. {{qtyA1}} notebooks, {{qtyB1}} pens, and {{qtyC1}} pencil cases cost ${{total1}}. {{qtyA2}} notebooks, {{qtyB2}} pens, and {{qtyC2}} pencil cases cost ${{total2}}. Find the cost of one notebook.',
    solutionTemplate: 'Step 1: Let notebook = $N. Then pencil case = ${{costCMultiplier}}N.\nStep 2: Replace pencil case in both equations with {{costCMultiplier}}N.\nStep 3: Simplify to two equations in N and pen cost.\nStep 4: Eliminate and solve → notebook = ${{answer}}.\nAnswer: ${{answer}}.',
    constraints: threeItemConstraints,
    scaffold: substitutionScaffold(),
  }),
  makeTemplate('psl-p6-sim-three-items-002', 'psl-p6-sim-three-items', 'simultaneous', {
    heuristic: 'simultaneous',
    difficulty: 4,
    story: 'A sports shop sells shuttlecocks, rackets, and bags. A bag costs {{costCMultiplier}} times as much as a tube of shuttlecocks. {{qtyA1}} tubes of shuttlecocks, {{qtyB1}} rackets, and {{qtyC1}} bags cost ${{total1}}. {{qtyA2}} tubes of shuttlecocks, {{qtyB2}} rackets, and {{qtyC2}} bags cost ${{total2}}. Find the cost of one tube of shuttlecocks.',
    solutionTemplate: 'Step 1: Let shuttlecocks = $S. Then bag = ${{costCMultiplier}}S.\nStep 2: Replace bag in both equations.\nStep 3: Simplify to two equations in S and racket cost.\nStep 4: Eliminate and solve → shuttlecocks = ${{answer}}.\nAnswer: ${{answer}}.',
    constraints: threeItemConstraints,
    scaffold: substitutionScaffold(),
  }),

  // ══════════════════════════════════════════════════════════════════
  //  P6 AGE PROBLEMS (3)
  // ══════════════════════════════════════════════════════════════════
  makeTemplate('psl-p6-sim-age-001', 'psl-p6-sim-age', 'simultaneous', {
    heuristic: 'simultaneous',
    difficulty: 2,
    story: 'Ali is {{diff}} years older than Mei. Their ages add up to {{sum}}. How old is Ali?',
    solutionTemplate: 'Step 1: Sum of ages = {{sum}}, Difference = {{diff}}.\nStep 2: Ali = ({{sum}} + {{diff}}) ÷ 2 = {{answer}}.\nAnswer: Ali is {{answer}} years old.',
    constraints: ageConstraints,
    scaffold: sumDiffScaffold(),
  }),
  makeTemplate('psl-p6-sim-age-002', 'psl-p6-sim-age', 'simultaneous', {
    heuristic: 'simultaneous',
    difficulty: 3,
    story: 'Mr Lim is {{diff}} years older than his son. The sum of their ages is {{sum}}. Find Mr Lim\'s age.',
    solutionTemplate: 'Step 1: Sum of ages = {{sum}}, Difference = {{diff}}.\nStep 2: Mr Lim = ({{sum}} + {{diff}}) ÷ 2 = {{answer}}.\nAnswer: Mr Lim is {{answer}} years old.',
    constraints: ageConstraints,
    scaffold: sumDiffScaffold(),
  }),
  makeTemplate('psl-p6-sim-age-003', 'psl-p6-sim-age', 'simultaneous', {
    heuristic: 'simultaneous',
    difficulty: 3,
    story: 'Grandma is {{diff}} years older than Auntie. Together, their ages total {{sum}} years. How old is Grandma?',
    solutionTemplate: 'Step 1: Sum of ages = {{sum}}, Difference = {{diff}}.\nStep 2: Grandma = ({{sum}} + {{diff}}) ÷ 2 = {{answer}}.\nAnswer: Grandma is {{answer}} years old.',
    constraints: ageConstraints,
    scaffold: sumDiffScaffold(),
  }),

  // ══════════════════════════════════════════════════════════════════
  //  P6 MONEY PROBLEMS (3)
  // ══════════════════════════════════════════════════════════════════
  makeTemplate('psl-p6-sim-money-001', 'psl-p6-sim-money', 'simultaneous', {
    heuristic: 'simultaneous',
    difficulty: 3,
    story: 'Siti has {{totalCoins}} coins made up of {{valueA}}¢ and {{valueB}}¢ coins. The total value is ${{totalDollars}}. How many {{valueA}}¢ coins does she have?',
    solutionTemplate: 'Step 1: Let the number of {{valueA}}¢ coins = A and {{valueB}}¢ coins = B.\nStep 2: A + B = {{totalCoins}} … (1)\nStep 3: {{valueA}}A + {{valueB}}B = {{totalCents}} … (2)\nStep 4: From (1): B = {{totalCoins}} − A. Substitute into (2) and solve.\nStep 5: A = {{answer}}.\nAnswer: {{answer}} coins of {{valueA}}¢.',
    constraints: moneyConstraints,
    scaffold: moneyScaffold(),
  }),
  makeTemplate('psl-p6-sim-money-002', 'psl-p6-sim-money', 'simultaneous', {
    heuristic: 'simultaneous',
    difficulty: 4,
    story: 'A donation box contains {{totalCoins}} coins, all either {{valueA}}¢ or {{valueB}}¢. The total amount collected is ${{totalDollars}}. How many {{valueA}}¢ coins are in the box?',
    solutionTemplate: 'Step 1: Let A = number of {{valueA}}¢ coins, B = number of {{valueB}}¢ coins.\nStep 2: A + B = {{totalCoins}} … (1)\nStep 3: {{valueA}}A + {{valueB}}B = {{totalCents}} … (2)\nStep 4: Substitute B = {{totalCoins}} − A into (2) and solve.\nStep 5: A = {{answer}}.\nAnswer: {{answer}} coins of {{valueA}}¢.',
    constraints: moneyConstraints,
    scaffold: moneyScaffold(),
  }),
  makeTemplate('psl-p6-sim-money-003', 'psl-p6-sim-money', 'simultaneous', {
    heuristic: 'simultaneous',
    difficulty: 4,
    story: 'Uncle Ahmad has {{totalCoins}} notes of ${{valueA}} and ${{valueB}} denominations. The total value of all the notes is ${{totalDollars}}. How many ${{valueA}} notes does he have?',
    solutionTemplate: 'Step 1: Let A = number of ${{valueA}} notes, B = number of ${{valueB}} notes.\nStep 2: A + B = {{totalCoins}} … (1)\nStep 3: {{valueA}}A + {{valueB}}B = {{totalCents}} … (2)\nStep 4: Substitute B = {{totalCoins}} − A into (2) and solve.\nStep 5: A = {{answer}}.\nAnswer: {{answer}} notes of ${{valueA}}.',
    constraints: moneyConstraints,
    scaffold: moneyScaffold(),
  }),

  // ══════════════════════════════════════════════════════════════════
  //  P6 WORD PROBLEM (2)
  // ══════════════════════════════════════════════════════════════════
  makeTemplate('psl-p6-sim-word-001', 'psl-p6-sim-word', 'simultaneous', {
    heuristic: 'simultaneous',
    difficulty: 4,
    story: 'A parking lot has motorcycles and cars. There are {{totalVehicles}} vehicles and {{totalWheels}} wheels altogether. How many motorcycles are there?',
    solutionTemplate: 'Step 1: Let M = motorcycles, C = cars.\nStep 2: M + C = {{totalVehicles}} … (1)\nStep 3: 2M + 4C = {{totalWheels}} … (2)\nStep 4: From (1): C = {{totalVehicles}} − M. Substitute into (2).\nStep 5: 2M + 4({{totalVehicles}} − M) = {{totalWheels}} → solve for M = {{answer}}.\nAnswer: {{answer}} motorcycles.',
    constraints: wordConstraints,
    scaffold: eliminationScaffold(),
  }),
  makeTemplate('psl-p6-sim-word-002', 'psl-p6-sim-word', 'simultaneous', {
    heuristic: 'simultaneous',
    difficulty: 5,
    story: 'A farm has chickens and cows. There are {{totalVehicles}} animals and {{totalWheels}} legs altogether. How many chickens are there?',
    solutionTemplate: 'Step 1: Let C = chickens, W = cows.\nStep 2: C + W = {{totalVehicles}} … (1)\nStep 3: 2C + 4W = {{totalWheels}} … (2)\nStep 4: From (1): W = {{totalVehicles}} − C. Substitute into (2).\nStep 5: 2C + 4({{totalVehicles}} − C) = {{totalWheels}} → solve for C = {{answer}}.\nAnswer: {{answer}} chickens.',
    constraints: wordConstraints,
    scaffold: eliminationScaffold(),
  }),
];

// ─── Seed runner ────────────────────────────────────────────────────
async function seed() {
  await connectDB();
  console.log(`Seeding ${templates.length} simultaneous templates …`);

  for (const t of templates) {
    await PSLProblemTemplate.findOneAndUpdate(
      { templateId: t.templateId },
      t,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    console.log(`  ✓ ${t.templateId}`);
  }

  console.log('Done.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
