import { getSkill } from './p2FractionsSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p2FractionsQuestionFamilies.js';

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const NAMES = ['Ali', 'Ben', 'Mei', 'Siti', 'Raj'];

function ordinalDenom(denom) {
  const labels = {
    2: 'halves', 3: 'thirds', 4: 'quarters', 5: 'fifths', 6: 'sixths',
    7: 'sevenths', 8: 'eighths', 9: 'ninths', 10: 'tenths',
    11: 'elevenths', 12: 'twelfths',
  };
  return labels[denom] || `${denom}ths`;
}

// ---------------------------------------------------------------------------
// P2-FR-01: Add & Subtract Like Fractions (denominators 3..12, within 1 whole)
// ---------------------------------------------------------------------------

function generateLikeFractions(familyId) {
  if (familyId.endsWith('_001')) {
    // Add like fractions: a/d + b/d = ?/d  → answer is numerator sum
    const denom = randInt(3, 12);
    const maxSum = denom;
    const a = randInt(1, maxSum - 1);
    const b = randInt(1, maxSum - a);
    const ans = a + b;

    return {
      skillId: 'P2-FR-01',
      questionFamilyId: familyId,
      prompt: `${a}/${denom} + ${b}/${denom} = ?/${denom}`,
      answer: ans,
      answerType: 'number',
      instructionHint: 'Add the numerators. The denominator stays the same.',
      solutionText: `${a} + ${b} = ${ans}. So ${a}/${denom} + ${b}/${denom} = ${ans}/${denom}.`,
      misconceptionTraps: ['adds_denominators', 'forgets_denominator_stays'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Subtract like fractions: a/d - b/d = ?/d  → answer is numerator difference
    const denom = randInt(3, 12);
    const a = randInt(2, denom);
    const b = randInt(1, a - 1);
    const ans = a - b;

    return {
      skillId: 'P2-FR-01',
      questionFamilyId: familyId,
      prompt: `${a}/${denom} − ${b}/${denom} = ?/${denom}`,
      answer: ans,
      answerType: 'number',
      instructionHint: 'Subtract the numerators. The denominator stays the same.',
      solutionText: `${a} − ${b} = ${ans}. So ${a}/${denom} − ${b}/${denom} = ${ans}/${denom}.`,
      misconceptionTraps: ['adds_denominators', 'forgets_denominator_stays'],
    };
  }

  // _003: Word context (add or subtract)
  const denom = randInt(3, 10);
  const isAdd = Math.random() < 0.5;
  const name1 = pick(NAMES);
  let name2 = pick(NAMES);
  while (name2 === name1) name2 = pick(NAMES);

  const foods = ['a pizza', 'a cake', 'a pie', 'a waffle', 'a granola bar'];
  const food = pick(foods);

  if (isAdd) {
    const a = randInt(1, denom - 1);
    const b = randInt(1, denom - a);
    const ans = a + b;

    return {
      skillId: 'P2-FR-01',
      questionFamilyId: familyId,
      prompt: `${name1} ate ${a}/${denom} of ${food}. ${name2} ate ${b}/${denom} of the same ${food.replace('a ', '')}. How many ${ordinalDenom(denom)} did they eat altogether?`,
      answer: ans,
      answerType: 'number',
      instructionHint: 'Add the numerators to find the total.',
      solutionText: `${a} + ${b} = ${ans}. They ate ${ans}/${denom} altogether.`,
      misconceptionTraps: ['adds_denominators', 'fraction_greater_than_whole'],
    };
  }

  // Subtraction word problem
  const a = randInt(2, denom);
  const b = randInt(1, a - 1);
  const ans = a - b;

  return {
    skillId: 'P2-FR-01',
    questionFamilyId: familyId,
    prompt: `${name1} had ${a}/${denom} of ${food}. ${name1} gave ${b}/${denom} to ${name2}. How many ${ordinalDenom(denom)} does ${name1} have left?`,
    answer: ans,
    answerType: 'number',
    instructionHint: 'Subtract the numerators to find what is left.',
    solutionText: `${a} − ${b} = ${ans}. ${name1} has ${ans}/${denom} left.`,
    misconceptionTraps: ['adds_denominators', 'fraction_greater_than_whole'],
  };
}

// ---------------------------------------------------------------------------
// P2-FR-02: Fraction of a Whole (denominators 2..8)
// ---------------------------------------------------------------------------

function generateFractionOfWhole(familyId) {
  const shapes = ['circle', 'rectangle', 'square', 'bar'];

  if (familyId.endsWith('_001')) {
    // Shaded parts → fraction numerator
    const denom = randInt(2, 8);
    const num = randInt(1, denom);
    const shape = pick(shapes);

    return {
      skillId: 'P2-FR-02',
      questionFamilyId: familyId,
      prompt: `A ${shape} is divided into ${denom} equal parts. ${num} part${num > 1 ? 's are' : ' is'} shaded. What fraction is shaded? Write the numerator.`,
      answer: num,
      answerType: 'number',
      instructionHint: 'Count the shaded parts. That number is the numerator.',
      solutionText: `${num} out of ${denom} parts are shaded, so the fraction is ${num}/${denom}. The numerator is ${num}.`,
      misconceptionTraps: ['confuses_numerator_denominator', 'counts_unshaded_instead'],
      diagramHint: { type: 'fraction_shape', shape, totalParts: denom, shadedParts: num },
    };
  }

  // _002: Fraction → how many parts to shade
  const denom = randInt(2, 8);
  const num = randInt(1, denom);
  const shape = pick(shapes);

  return {
    skillId: 'P2-FR-02',
    questionFamilyId: familyId,
    prompt: `Shade ${num}/${denom} of the ${shape}. How many parts should be shaded?`,
    answer: num,
    answerType: 'number',
    instructionHint: 'The numerator tells you how many parts to shade.',
    solutionText: `${num}/${denom} means ${num} out of ${denom} parts. Shade ${num} part${num > 1 ? 's' : ''}.`,
    misconceptionTraps: ['confuses_numerator_denominator', 'counts_unshaded_instead'],
    diagramHint: { type: 'fraction_shape', shape, totalParts: denom, shadedParts: 0 },
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P2-FR-01': generateLikeFractions,
  'P2-FR-02': generateFractionOfWhole,
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
  for (let i = 0; i < count; i++) {
    const q = generateQuestion(skillId, options);
    if (q) questions.push(q);
  }
  return questions;
}

export function generateDiagnosticSet(skillIds, questionsPerSkill = 3) {
  const questions = [];
  for (const skillId of skillIds) {
    const set = generateQuestionSet(skillId, questionsPerSkill);
    questions.push(...set);
  }
  return questions;
}

export function getSupportedSkillIds() {
  return Object.keys(generatorsBySkill);
}

export default { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds };
