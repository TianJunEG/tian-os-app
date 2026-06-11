import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLSkill from '../models/psl/PSLSkill.js';

const P3_SKILLS = [
  // Part-Whole (4)
  {
    skillId: 'psl-p3-bar-pw-find-whole',
    name: 'Bar model: find the whole',
    description: 'Use a part-whole bar model to find the total when all parts are given.',
    level: 'P3', heuristic: 'bar-model', structure: 'partWhole', unknownPosition: 'whole',
    difficulty: 1,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: [],
    commonMisconceptions: ['psl/missed-number', 'psl/wrong-operation'],
  },
  {
    skillId: 'psl-p3-bar-pw-find-part',
    name: 'Bar model: find a part',
    description: 'Use a part-whole bar model to find a missing part when the whole and one part are given.',
    level: 'P3', heuristic: 'bar-model', structure: 'partWhole', unknownPosition: 'part',
    difficulty: 1,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: [],
    commonMisconceptions: ['psl/wrong-operation', 'psl/used-wrong-numbers'],
  },
  {
    skillId: 'psl-p3-bar-pw-3parts',
    name: 'Bar model: 3-part whole',
    description: 'Use a bar model with three parts to find the missing quantity.',
    level: 'P3', heuristic: 'bar-model', structure: 'partWhole', unknownPosition: 'whole',
    difficulty: 2,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: ['psl-p3-bar-pw-find-whole'],
    commonMisconceptions: ['psl/missed-number', 'psl/included-irrelevant'],
  },
  {
    skillId: 'psl-p3-bar-pw-mul',
    name: 'Bar model: equal parts',
    description: 'Use a bar model with equal parts to find the total using multiplication.',
    level: 'P3', heuristic: 'bar-model', structure: 'partWhole', unknownPosition: 'whole',
    difficulty: 2,
    mathPathPrerequisites: ['mul-tables-6789', 'div-within-tables'],
    pslPrerequisites: ['psl-p3-bar-pw-find-whole'],
    commonMisconceptions: ['psl/wrong-operation', 'psl/arithmetic-error'],
  },

  // Comparison (4)
  {
    skillId: 'psl-p3-bar-comp-find-diff',
    name: 'Bar model: find the difference',
    description: 'Use a comparison bar model to find how much more or less one quantity is than another.',
    level: 'P3', heuristic: 'bar-model', structure: 'comparison', unknownPosition: 'difference',
    difficulty: 1,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: ['psl-p3-bar-pw-find-part'],
    commonMisconceptions: ['psl/wrong-model-type', 'psl/wrong-operation'],
  },
  {
    skillId: 'psl-p3-bar-comp-find-larger',
    name: 'Bar model: find the larger',
    description: 'Use a comparison bar model to find the larger quantity given the smaller and the difference.',
    level: 'P3', heuristic: 'bar-model', structure: 'comparison', unknownPosition: 'larger',
    difficulty: 2,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: ['psl-p3-bar-comp-find-diff'],
    commonMisconceptions: ['psl/wrong-unknown-position', 'psl/wrong-operation'],
  },
  {
    skillId: 'psl-p3-bar-comp-find-smaller',
    name: 'Bar model: find the smaller',
    description: 'Use a comparison bar model to find the smaller quantity given the larger and the difference.',
    level: 'P3', heuristic: 'bar-model', structure: 'comparison', unknownPosition: 'smaller',
    difficulty: 2,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: ['psl-p3-bar-comp-find-diff'],
    commonMisconceptions: ['psl/wrong-unknown-position', 'psl/confused-question'],
  },
  {
    skillId: 'psl-p3-bar-comp-total',
    name: 'Bar model: compare then total',
    description: 'Use a comparison model to find a quantity, then add both to find the total.',
    level: 'P3', heuristic: 'bar-model', structure: 'comparison', unknownPosition: 'larger',
    difficulty: 3,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: ['psl-p3-bar-comp-find-larger'],
    commonMisconceptions: ['psl/misread-unknown', 'psl/wrong-operation'],
  },

  // Two-Step (2)
  {
    skillId: 'psl-p3-twostep-pw-comp',
    name: 'Two-step: part-whole + comparison',
    description: 'Solve a two-step problem that combines part-whole and comparison reasoning.',
    level: 'P3', heuristic: 'bar-model', structure: 'twoStep', unknownPosition: 'difference',
    difficulty: 3,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: ['psl-p3-bar-pw-find-part', 'psl-p3-bar-comp-find-diff'],
    commonMisconceptions: ['psl/wrong-model-type', 'psl/used-wrong-numbers', 'psl/arithmetic-error'],
  },
  {
    skillId: 'psl-p3-twostep-comp-pw',
    name: 'Two-step: comparison + part-whole',
    description: 'Solve a two-step problem that combines comparison and part-whole reasoning.',
    level: 'P3', heuristic: 'bar-model', structure: 'twoStep', unknownPosition: 'whole',
    difficulty: 3,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: ['psl-p3-bar-comp-find-larger', 'psl-p3-bar-pw-find-whole'],
    commonMisconceptions: ['psl/wrong-model-type', 'psl/used-wrong-numbers', 'psl/arithmetic-error'],
  },
  // ══════════════════════════════════════════════════════════════════════
  //  H2: FIND A PATTERN (2)
  // ══════════════════════════════════════════════════════════════════════
  {
    skillId: 'psl-p3-pattern-linear',
    name: 'Find a pattern: linear sequence',
    description: 'Identify and extend an arithmetic (constant difference) number pattern.',
    level: 'P3', heuristic: 'find-pattern', structure: null, unknownPosition: '',
    planType: 'table_setup', solveType: 'find_rule',
    difficulty: 1,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: [],
    commonMisconceptions: ['psl/wrong-rule', 'psl/arithmetic-error'],
  },
  {
    skillId: 'psl-p3-pattern-geometric',
    name: 'Find a pattern: shape pattern',
    description: 'Use a table to find the rule behind a growing shape pattern (e.g. matchstick figures).',
    level: 'P3', heuristic: 'find-pattern', structure: null, unknownPosition: '',
    planType: 'table_setup', solveType: 'find_rule',
    difficulty: 2,
    mathPathPrerequisites: ['add-algo-4d', 'mul-tables-6789'],
    pslPrerequisites: ['psl-p3-pattern-linear'],
    commonMisconceptions: ['psl/wrong-rule', 'psl/off-by-one'],
  },
  // ══════════════════════════════════════════════════════════════════════
  //  H3: SUBSTITUTION (2)
  // ══════════════════════════════════════════════════════════════════════
  {
    skillId: 'psl-p3-sub-same-coeff',
    name: 'Substitution: same coefficient',
    description: 'Solve two equations where one variable has the same coefficient in both — subtract to eliminate.',
    level: 'P3', heuristic: 'substitution', structure: null, unknownPosition: '',
    planType: 'equation_setup', solveType: 'eliminate',
    difficulty: 1,
    mathPathPrerequisites: ['add-algo-4d', 'mul-tables-6789'],
    pslPrerequisites: [],
    commonMisconceptions: ['psl/wrong-elimination', 'psl/arithmetic-error'],
  },
  {
    skillId: 'psl-p3-sub-scale',
    name: 'Substitution: scaling needed',
    description: 'Solve two equations by scaling one equation before subtracting to eliminate a variable.',
    level: 'P3', heuristic: 'substitution', structure: null, unknownPosition: '',
    planType: 'equation_setup', solveType: 'eliminate',
    difficulty: 2,
    mathPathPrerequisites: ['add-algo-4d', 'mul-tables-6789'],
    pslPrerequisites: ['psl-p3-sub-same-coeff'],
    commonMisconceptions: ['psl/wrong-scale-factor', 'psl/arithmetic-error'],
  },
  // ══════════════════════════════════════════════════════════════════════
  //  H4: MAKE A LIST (2)
  // ══════════════════════════════════════════════════════════════════════
  {
    skillId: 'psl-p3-list-simple',
    name: 'Make a list: single condition',
    description: 'List candidates that satisfy a single condition within a range to find the answer.',
    level: 'P3', heuristic: 'make-list', structure: null, unknownPosition: '',
    planType: 'list_candidates', solveType: 'list_check',
    difficulty: 1,
    mathPathPrerequisites: ['add-algo-4d', 'mul-tables-6789'],
    pslPrerequisites: [],
    commonMisconceptions: ['psl/missed-candidate', 'psl/wrong-condition'],
  },
  {
    skillId: 'psl-p3-list-multi',
    name: 'Make a list: multiple conditions',
    description: 'List candidates satisfying multiple conditions (e.g. divisibility + odd/even) to find the answer.',
    level: 'P3', heuristic: 'make-list', structure: null, unknownPosition: '',
    planType: 'list_candidates', solveType: 'list_check',
    difficulty: 2,
    mathPathPrerequisites: ['add-algo-4d', 'mul-tables-6789'],
    pslPrerequisites: ['psl-p3-list-simple'],
    commonMisconceptions: ['psl/missed-candidate', 'psl/forgot-condition'],
  },
  // ══════════════════════════════════════════════════════════════════════
  //  H5: GUESS AND CHECK (2)
  // ══════════════════════════════════════════════════════════════════════
  {
    skillId: 'psl-p3-guess-coins',
    name: 'Guess and check: coin problems',
    description: 'Use systematic guessing to find how many of each type of coin satisfy the given conditions.',
    level: 'P3', heuristic: 'guess-check', structure: null, unknownPosition: '',
    planType: 'guess_setup', solveType: 'guess_table',
    difficulty: 1,
    mathPathPrerequisites: ['add-algo-4d', 'mul-tables-6789'],
    pslPrerequisites: [],
    commonMisconceptions: ['psl/random-guess', 'psl/arithmetic-error'],
  },
  {
    skillId: 'psl-p3-guess-animals',
    name: 'Guess and check: heads and legs',
    description: 'Use guess and check to find the number of each type of animal given total heads and legs.',
    level: 'P3', heuristic: 'guess-check', structure: null, unknownPosition: '',
    planType: 'guess_setup', solveType: 'guess_table',
    difficulty: 2,
    mathPathPrerequisites: ['add-algo-4d', 'mul-tables-6789'],
    pslPrerequisites: ['psl-p3-guess-coins'],
    commonMisconceptions: ['psl/random-guess', 'psl/forgot-constraint'],
  },
  // ══════════════════════════════════════════════════════════════════════
  //  H6: WORKING BACKWARDS (2)
  // ══════════════════════════════════════════════════════════════════════
  {
    skillId: 'psl-p3-reverse-twoOp',
    name: 'Work backwards: two operations',
    description: 'Reverse two operations to find the original number.',
    level: 'P3', heuristic: 'work-backwards', structure: null, unknownPosition: '',
    planType: 'reverse_steps', solveType: 'reverse_chain',
    difficulty: 1,
    mathPathPrerequisites: ['add-algo-4d'],
    pslPrerequisites: [],
    commonMisconceptions: ['psl/wrong-reverse', 'psl/arithmetic-error'],
  },
  {
    skillId: 'psl-p3-reverse-threeOp',
    name: 'Work backwards: three operations',
    description: 'Reverse three operations to find the starting value.',
    level: 'P3', heuristic: 'work-backwards', structure: null, unknownPosition: '',
    planType: 'reverse_steps', solveType: 'reverse_chain',
    difficulty: 2,
    mathPathPrerequisites: ['add-algo-4d', 'mul-tables-6789'],
    pslPrerequisites: ['psl-p3-reverse-twoOp'],
    commonMisconceptions: ['psl/wrong-step-order', 'psl/arithmetic-error'],
  },
];

async function seed() {
  await connectDB();
  let upserted = 0;
  for (const skill of P3_SKILLS) {
    await PSLSkill.findOneAndUpdate(
      { skillId: skill.skillId },
      { $set: skill },
      { upsert: true, new: true },
    );
    upserted++;
  }
  console.log(`Seeded ${upserted} PSL skills.`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
