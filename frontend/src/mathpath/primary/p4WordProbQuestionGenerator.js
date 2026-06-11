import { getSkill } from './p4WordProbSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p4WordProbQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const NAMES = ['Ali', 'Ben', 'Mei', 'Siti', 'Raj', 'Tom', 'Lily', 'Sarah', 'John', 'Mary'];
const ITEMS = ['stickers', 'books', 'marbles', 'stamps', 'beads', 'cards', 'toys', 'pencils'];

// ---------------------------------------------------------------------------
// P4-WP-01: Fraction of a Quantity
// ---------------------------------------------------------------------------

function generateFractionOfQuantity(familyId) {
  const denom = randInt(2, 8);
  const numer = randInt(1, denom - 1);
  const multiplier = randInt(2, 12);
  const setSize = denom * multiplier;
  const fractionResult = numer * multiplier;
  const name = pick(NAMES);
  const item = pick(ITEMS);

  if (familyId.endsWith('_001')) {
    // Fraction of a quantity
    const context = pick([
      `${name} has ${setSize} ${item}. ${numer}/${denom} of them are red. How many ${item} are red?`,
      `There are ${setSize} ${item}. ${name} takes ${numer}/${denom} of them. How many ${item} does ${name} take?`,
      `${numer}/${denom} of ${setSize} students chose soccer. How many students chose soccer?`,
    ]);
    return {
      skillId: 'P4-WP-01',
      questionFamilyId: familyId,
      prompt: context,
      answer: fractionResult,
      answerType: 'number',
      instructionHint: `Divide ${setSize} by ${denom}, then multiply by ${numer}.`,
      solutionText: `${setSize} ÷ ${denom} = ${multiplier}. ${multiplier} × ${numer} = ${fractionResult}. The answer is ${fractionResult}.`,
      misconceptionTraps: ['uses_wrong_operation', 'computes_fraction_wrong'],
    };
  }

  // _002: Find remainder after taking fraction
  const remainder = setSize - fractionResult;
  const context = pick([
    `${name} has ${setSize} ${item}. ${name} gives away ${numer}/${denom} of them. How many ${item} does ${name} have left?`,
    `There are ${setSize} ${item} in a box. ${numer}/${denom} of them are taken out. How many ${item} are left in the box?`,
  ]);
  return {
    skillId: 'P4-WP-01',
    questionFamilyId: familyId,
    prompt: context,
    answer: remainder,
    answerType: 'number',
    instructionHint: `Find ${numer}/${denom} of ${setSize}, then subtract from ${setSize}.`,
    solutionText: `${setSize} ÷ ${denom} = ${multiplier}. ${multiplier} × ${numer} = ${fractionResult}. ${setSize} - ${fractionResult} = ${remainder}. There are ${remainder} ${item} left.`,
    misconceptionTraps: ['uses_wrong_operation', 'computes_fraction_wrong'],
  };
}

// ---------------------------------------------------------------------------
// P4-WP-02: Two-Step Word Problem
// ---------------------------------------------------------------------------

function generateTwoStep(familyId) {
  if (familyId.endsWith('_001')) {
    // Two-step subtraction: total - amount1 - amount2
    const total = randInt(150, 2500);
    const spent1 = randInt(50, Math.floor(total / 3));
    const spent2 = randInt(50, Math.floor(total / 3));
    const remaining = total - spent1 - spent2;
    const name = pick(NAMES);
    const item1 = pick(['camera', 'bicycle', 'tablet', 'guitar', 'laptop']);
    const item2 = pick(['phone', 'headphones', 'watch', 'bag', 'shoes']);
    return {
      skillId: 'P4-WP-02',
      questionFamilyId: familyId,
      prompt: `${name} had $${total}. He spent $${spent1} on a ${item1} and $${spent2} on a ${item2}. How much money does ${name} have left?`,
      answer: remaining,
      answerType: 'number',
      instructionHint: 'Subtract both amounts from the total.',
      solutionText: `$${total} - $${spent1} = $${total - spent1}. $${total - spent1} - $${spent2} = $${remaining}. ${name} has $${remaining} left.`,
      misconceptionTraps: ['stops_after_one_step', 'adds_instead_of_subtracts'],
    };
  }

  // _002: Two-step mixed operations (add then subtract, or subtract then add)
  const variant = pick(['add-then-subtract', 'subtract-then-add']);
  const name = pick(NAMES);

  if (variant === 'add-then-subtract') {
    const earned1 = randInt(150, 800);
    const earned2 = randInt(150, 800);
    const totalEarned = earned1 + earned2;
    const spent = randInt(100, Math.floor(totalEarned * 0.6));
    const remaining = totalEarned - spent;
    const item = pick(['books', 'stickers', 'toys', 'pencils', 'cards']);
    return {
      skillId: 'P4-WP-02',
      questionFamilyId: familyId,
      prompt: `${name} earned $${earned1} in January and $${earned2} in February. ${name} then spent $${spent} on ${item}. How much money does ${name} have now?`,
      answer: remaining,
      answerType: 'number',
      instructionHint: 'First add the two amounts, then subtract the spending.',
      solutionText: `$${earned1} + $${earned2} = $${totalEarned}. $${totalEarned} - $${spent} = $${remaining}. ${name} has $${remaining} now.`,
      misconceptionTraps: ['stops_after_one_step', 'adds_instead_of_subtracts'],
    };
  }

  // subtract-then-add
  const start = randInt(500, 2500);
  const spent = randInt(150, Math.floor(start * 0.5));
  const received = randInt(100, 600);
  const final = start - spent + received;
  return {
    skillId: 'P4-WP-02',
    questionFamilyId: familyId,
    prompt: `${name} had $${start}. He spent $${spent} on a gift. His mother gave him $${received}. How much money does ${name} have now?`,
    answer: final,
    answerType: 'number',
    instructionHint: 'First subtract the spending, then add what was received.',
    solutionText: `$${start} - $${spent} = $${start - spent}. $${start - spent} + $${received} = $${final}. ${name} has $${final} now.`,
    misconceptionTraps: ['stops_after_one_step', 'adds_instead_of_subtracts'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P4-WP-01': generateFractionOfQuantity,
  'P4-WP-02': generateTwoStep,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateQuestion(skillId, options = {}) {
  const skill = getSkill(skillId);
  if (!skill) return null;
  const families = getQuestionFamiliesBySkill(skillId);
  if (!families.length) return null;
  const family = options.questionFamilyId
    ? families.find((f) => f.id === options.questionFamilyId) || pick(families)
    : pick(families);
  const generator = generatorsBySkill[skillId];
  if (!generator) return null;
  const question = generator(family.id);
  return {
    ...question,
    questionId: `${family.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    difficulty: family.difficulty,
    fluencyTargetSeconds: family.fluencyTargetSeconds,
  };
}

export function generateQuestionSet(skillId, count = 5, options = {}) {
  const questions = [];
  for (let i = 0; i < count; i++) { const q = generateQuestion(skillId, options); if (q) questions.push(q); }
  return questions;
}

export function generateDiagnosticSet(skillIds, questionsPerSkill = 3) {
  const questions = [];
  for (const skillId of skillIds) questions.push(...generateQuestionSet(skillId, questionsPerSkill));
  return questions;
}

export function getSupportedSkillIds() { return Object.keys(generatorsBySkill); }

export default { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds };
