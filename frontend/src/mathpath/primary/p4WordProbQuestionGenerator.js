import { getSkill } from './p4WordProbSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p4WordProbQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ---------------------------------------------------------------------------
// P4-WP-01: Fraction of a Quantity (Bar Model)
// ---------------------------------------------------------------------------

const FRACTION_CONTEXTS = [
  { item: 'marbles', unit: '' },
  { item: 'stickers', unit: '' },
  { item: 'books', unit: '' },
  { item: 'apples', unit: '' },
  { item: 'beads', unit: '' },
  { item: 'cookies', unit: '' },
  { item: 'stamps', unit: '' },
  { item: 'coins', unit: '' },
];

const MONEY_CONTEXTS = [
  { item: 'savings', unit: '$' },
  { item: 'pocket money', unit: '$' },
  { item: 'prize money', unit: '$' },
];

// Fractions with their denominators for easy divisible-set generation
const FRACTIONS = [
  { num: 1, den: 2 }, { num: 1, den: 3 }, { num: 1, den: 4 }, { num: 1, den: 5 },
  { num: 2, den: 3 }, { num: 2, den: 5 }, { num: 3, den: 4 }, { num: 3, den: 5 },
  { num: 3, den: 8 }, { num: 5, den: 8 }, { num: 2, den: 7 }, { num: 4, den: 5 },
];

const UNIT_FRACTIONS = FRACTIONS.filter((f) => f.num === 1);
const NON_UNIT_FRACTIONS = FRACTIONS.filter((f) => f.num > 1);

const NAMES = ['Ali', 'Mei Ling', 'Ravi', 'Sarah', 'Wei Ming', 'Priya', 'Ahmad', 'Siti', 'David', 'Lina'];

function makeDivisibleTotal(den, minTotal, maxTotal) {
  const minMult = Math.ceil(minTotal / den);
  const maxMult = Math.floor(maxTotal / den);
  const mult = randInt(minMult, maxMult);
  return mult * den;
}

function generateWordProbFraction(familyId) {
  const name = pick(NAMES);

  if (familyId.endsWith('_001')) {
    // Unit fraction of a quantity
    const frac = pick(UNIT_FRACTIONS);
    const total = makeDivisibleTotal(frac.den, 10, 60);
    const answer = total / frac.den;
    const ctx = pick(FRACTION_CONTEXTS);
    return {
      skillId: 'P4-WP-01',
      questionFamilyId: familyId,
      prompt: `${name} has ${total} ${ctx.item}. ${name} gives away 1/${frac.den} of them. How many ${ctx.item} does ${name} give away?`,
      answer,
      answerType: 'number',
      instructionHint: `Divide ${total} by ${frac.den} to find one part.`,
      solutionText: `1/${frac.den} of ${total} = ${total} ÷ ${frac.den} = ${answer}.`,
      misconceptionTraps: ['fraction_bar_model_confusion'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Non-unit fraction of a quantity
    const frac = pick(NON_UNIT_FRACTIONS);
    const total = makeDivisibleTotal(frac.den, 16, 80);
    const onePart = total / frac.den;
    const answer = onePart * frac.num;
    const ctx = pick(FRACTION_CONTEXTS);
    return {
      skillId: 'P4-WP-01',
      questionFamilyId: familyId,
      prompt: `There are ${total} ${ctx.item}. ${frac.num}/${frac.den} of them are red. How many ${ctx.item} are red?`,
      answer,
      answerType: 'number',
      instructionHint: `Divide ${total} by ${frac.den}, then multiply by ${frac.num}.`,
      solutionText: `${total} ÷ ${frac.den} = ${onePart}. ${onePart} × ${frac.num} = ${answer}. So ${frac.num}/${frac.den} of ${total} = ${answer}.`,
      misconceptionTraps: ['fraction_bar_model_confusion', 'wrong_operation_choice'],
    };
  }

  // _003: Fraction of quantity with money/real-world context
  const frac = pick(NON_UNIT_FRACTIONS);
  const isMoneyCtx = Math.random() < 0.5;
  const ctx = isMoneyCtx ? pick(MONEY_CONTEXTS) : pick(FRACTION_CONTEXTS);
  const total = isMoneyCtx
    ? makeDivisibleTotal(frac.den, 20, 200)
    : makeDivisibleTotal(frac.den, 16, 80);
  const onePart = total / frac.den;
  const answer = onePart * frac.num;
  const prefix = ctx.unit === '$' ? '$' : '';
  const suffix = ctx.unit === '$' ? '' : ` ${ctx.item}`;

  return {
    skillId: 'P4-WP-01',
    questionFamilyId: familyId,
    prompt: `${name} had ${prefix}${total}${suffix} in ${ctx.item}. ${name} spent ${frac.num}/${frac.den} of it. How much did ${name} spend?`,
    answer,
    answerType: 'number',
    instructionHint: `Split ${total} into ${frac.den} equal parts, then take ${frac.num} parts.`,
    solutionText: `${total} ÷ ${frac.den} = ${onePart}. ${onePart} × ${frac.num} = ${answer}. ${name} spent ${prefix}${answer}${suffix}.`,
    misconceptionTraps: ['doesnt_identify_what_to_find', 'fraction_bar_model_confusion'],
  };
}

// ---------------------------------------------------------------------------
// P4-WP-02: Two-Step Word Problem (Larger Numbers)
// ---------------------------------------------------------------------------

function generateWordProbTwoStep(familyId) {
  const name = pick(NAMES);

  if (familyId.endsWith('_001')) {
    // Subtract twice from a total
    const total = randInt(800, 2500);
    const sub1 = randInt(150, Math.floor(total * 0.4));
    const sub2 = randInt(150, Math.floor((total - sub1) * 0.6));
    const answer = total - sub1 - sub2;
    const item = pick(['savings', 'budget', 'allowance']);
    return {
      skillId: 'P4-WP-02',
      questionFamilyId: familyId,
      prompt: `${name} had $${total} in ${item}. ${name} spent $${sub1} on books and $${sub2} on clothes. How much ${item} does ${name} have left?`,
      answer,
      answerType: 'number',
      instructionHint: `Subtract both amounts from the total: $${total} − $${sub1} − $${sub2}.`,
      solutionText: `$${total} − $${sub1} = $${total - sub1}. $${total - sub1} − $${sub2} = $${answer}. ${name} has $${answer} left.`,
      misconceptionTraps: ['forgets_second_step', 'wrong_operation_choice'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Buy N items at $X each, pay with $Y, find change
    const count = randInt(3, 8);
    const priceEach = randInt(25, 150);
    const totalCost = count * priceEach;
    // Ensure paid amount > total cost and is a round number
    const paid = Math.ceil(totalCost / 100) * 100 + pick([0, 50, 100]);
    const answer = paid - totalCost;
    const itemName = pick(['notebooks', 'pens', 'T-shirts', 'folders', 'pencil cases']);
    return {
      skillId: 'P4-WP-02',
      questionFamilyId: familyId,
      prompt: `${name} buys ${count} ${itemName} at $${priceEach} each. ${name} pays with $${paid}. How much change does ${name} receive?`,
      answer,
      answerType: 'number',
      instructionHint: `Step 1: Find total cost (${count} × $${priceEach}). Step 2: Subtract from $${paid}.`,
      solutionText: `${count} × $${priceEach} = $${totalCost}. $${paid} − $${totalCost} = $${answer}. ${name} receives $${answer} in change.`,
      misconceptionTraps: ['doesnt_identify_what_to_find', 'forgets_second_step'],
    };
  }

  // _003: Combined operations — earn and spend
  const earned1 = randInt(200, 800);
  const earned2 = randInt(200, 800);
  const totalEarned = earned1 + earned2;
  const spent = randInt(150, Math.floor(totalEarned * 0.7));
  const answer = totalEarned - spent;
  const job1 = pick(['washing cars', 'mowing lawns', 'selling cookies', 'tutoring']);
  const job2 = pick(['babysitting', 'recycling', 'helping at a shop', 'delivering newspapers']);
  return {
    skillId: 'P4-WP-02',
    questionFamilyId: familyId,
    prompt: `${name} earned $${earned1} from ${job1} and $${earned2} from ${job2}. ${name} then spent $${spent} on a bicycle. How much money does ${name} have left?`,
    answer,
    answerType: 'number',
    instructionHint: `Step 1: Add the earnings ($${earned1} + $${earned2}). Step 2: Subtract the spending ($${spent}).`,
    solutionText: `$${earned1} + $${earned2} = $${totalEarned}. $${totalEarned} − $${spent} = $${answer}. ${name} has $${answer} left.`,
    misconceptionTraps: ['doesnt_identify_what_to_find', 'wrong_operation_choice', 'forgets_second_step'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P4-WP-01': generateWordProbFraction,
  'P4-WP-02': generateWordProbTwoStep,
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
    visualRequirement: family.visualRequirement || skill.visual,
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
