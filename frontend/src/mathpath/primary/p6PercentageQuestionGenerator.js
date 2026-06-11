import { getSkill } from './p6PercentageSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p6PercentageQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

/** Round to 2dp and clean floating-point artefacts */
function cleanNum(n) { return Number(n.toFixed(2)); }

// ---------------------------------------------------------------------------
// Singapore-style context
// ---------------------------------------------------------------------------
const NAMES = [
  'Wei Ling', 'Jun Hao', 'Siti', 'Ravi', 'Mei Xuan',
  'Aisha', 'Zheng Wei', 'Kumar', 'Li Ting', 'Hafiz',
  'Priya', 'Jia En', 'Darren', 'Nurul', 'Yi Xuan',
];

const SHOPS = [
  'FairPrice', 'Popular Bookstore', 'BHG', 'TANGS',
  'Takashimaya', 'Courts', 'Challenger', 'Robinsons',
  'Metro', 'Giant',
];

const ITEMS_INCREASE = [
  { item: 'shirt', unit: '$' },
  { item: 'pair of shoes', unit: '$' },
  { item: 'schoolbag', unit: '$' },
  { item: 'watch', unit: '$' },
  { item: 'bicycle', unit: '$' },
  { item: 'laptop', unit: '$' },
];

const ITEMS_DECREASE = [
  { item: 'dress', unit: '$' },
  { item: 'handbag', unit: '$' },
  { item: 'jacket', unit: '$' },
  { item: 'pair of running shoes', unit: '$' },
  { item: 'toy set', unit: '$' },
  { item: 'board game', unit: '$' },
];

const INCREASE_CONTEXTS = [
  { template: (name, item, X, Y) => `${name} bought a ${item} for $${X}. The price of the ${item} increased by ${Y}%. What is the new price of the ${item}?`, verb: 'increased' },
  { template: (name, item, X, Y) => `A ${item} at ${pick(SHOPS)} costs $${X}. Its price was raised by ${Y}%. Find the new price.`, verb: 'raised' },
  { template: (name, item, X, Y) => `The cost of a ${item} went up by ${Y}%. If it originally cost $${X}, what is the new cost?`, verb: 'went up' },
];

const DECREASE_CONTEXTS = [
  { template: (name, item, X, Y) => `A ${item} costs $${X}. Its price was reduced by ${Y}%. What is the new price?`, verb: 'reduced' },
  { template: (name, item, X, Y) => `${name} found a ${item} marked at $${X}. It was on sale with a ${Y}% discount. What is the sale price?`, verb: 'discounted' },
  { template: (name, item, X, Y) => `A ${item} at ${pick(SHOPS)} is $${X}. During a sale, the price dropped by ${Y}%. Find the sale price.`, verb: 'dropped' },
];

// ---------------------------------------------------------------------------
// Allowed percentages for clean arithmetic
// ---------------------------------------------------------------------------
const PERCENTAGES = [5, 10, 15, 20, 25, 30, 40, 50, 75];

/**
 * Pick a base price X (multiple of 20 in [$20..$500]) and a percentage Y
 * such that X * Y / 100 is a whole number.
 */
function pickCleanBaseAndPercent() {
  const Y = pick(PERCENTAGES);
  // Need X such that X * Y / 100 is whole → X must be a multiple of (100 / gcd(Y,100))
  const g = gcd(Y, 100);
  const step = 100 / g; // minimum X step to get whole-number percentage amount
  // Choose X in a sensible range — at least step, at most 500, in multiples of step
  const minMult = Math.max(1, Math.ceil(20 / step));
  const maxMult = Math.floor(500 / step);
  const mult = randInt(minMult, maxMult);
  const X = mult * step;
  return { X, Y };
}

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

// ---------------------------------------------------------------------------
// P6-PCT-01: Percentage Increase & Decrease
// ---------------------------------------------------------------------------

function generateIncreaseDecrease(familyId) {
  const { X, Y } = pickCleanBaseAndPercent();
  const changeAmount = (X * Y) / 100;
  const name = pick(NAMES);

  if (familyId.endsWith('_001')) {
    // Percentage Increase
    const newPrice = X + changeAmount;
    const { item } = pick(ITEMS_INCREASE);
    return {
      skillId: 'P6-PCT-01',
      questionFamilyId: familyId,
      prompt: `A ${item} costs $${X}. Its price increased by ${Y}%. What is the new price?`,
      answer: newPrice,
      answerType: 'number',
      instructionHint: `Find ${Y}% of $${X} first, then add it to the original price.`,
      solutionText: `${Y}% of $${X} = $${changeAmount}. New price = $${X} + $${changeAmount} = $${newPrice}.`,
      misconceptionTraps: ['adds_percentage_to_value_directly', 'wrong_percentage_fraction'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Percentage Decrease
    const newPrice = X - changeAmount;
    const { item } = pick(ITEMS_DECREASE);
    return {
      skillId: 'P6-PCT-01',
      questionFamilyId: familyId,
      prompt: `A ${item} costs $${X}. Its price decreased by ${Y}%. What is the new price?`,
      answer: newPrice,
      answerType: 'number',
      instructionHint: `Find ${Y}% of $${X} first, then subtract it from the original price.`,
      solutionText: `${Y}% of $${X} = $${changeAmount}. New price = $${X} − $${changeAmount} = $${newPrice}.`,
      misconceptionTraps: ['adds_percentage_to_value_directly', 'confuses_increase_decrease'],
    };
  }

  // _003: Word problem (randomly increase or decrease)
  const isIncrease = Math.random() < 0.5;
  if (isIncrease) {
    const newValue = X + changeAmount;
    const ctx = pick(INCREASE_CONTEXTS);
    const { item } = pick(ITEMS_INCREASE);
    return {
      skillId: 'P6-PCT-01',
      questionFamilyId: familyId,
      prompt: ctx.template(name, item, X, Y),
      answer: newValue,
      answerType: 'number',
      instructionHint: `The price ${ctx.verb} by ${Y}%. Find ${Y}% of $${X}, then add to the original.`,
      solutionText: `${Y}% of $${X} = $${changeAmount}. New price = $${X} + $${changeAmount} = $${newValue}.`,
      misconceptionTraps: ['adds_percentage_to_value_directly', 'confuses_increase_decrease'],
    };
  }

  const newValue = X - changeAmount;
  const ctx = pick(DECREASE_CONTEXTS);
  const { item } = pick(ITEMS_DECREASE);
  return {
    skillId: 'P6-PCT-01',
    questionFamilyId: familyId,
    prompt: ctx.template(name, item, X, Y),
    answer: newValue,
    answerType: 'number',
    instructionHint: `The price ${ctx.verb} by ${Y}%. Find ${Y}% of $${X}, then subtract from the original.`,
    solutionText: `${Y}% of $${X} = $${changeAmount}. New price = $${X} − $${changeAmount} = $${newValue}.`,
    misconceptionTraps: ['adds_percentage_to_value_directly', 'confuses_increase_decrease'],
  };
}

// ---------------------------------------------------------------------------
// P6-PCT-02: Discount & GST
// ---------------------------------------------------------------------------

const GST_RATE = 9;

/**
 * Pick a base price that yields a clean GST amount (price * 9 / 100 has at most 2dp).
 * Prices that are multiples of 100 always work. We also allow multiples of 20 (9% of 20 = 1.80).
 */
function pickGSTCleanPrice() {
  // Multiples of 20 from 20..500 give clean 2dp GST amounts
  return randInt(1, 25) * 20;
}

/**
 * Pick a discount percentage and original price so that:
 * 1) discount amount is whole-number dollars
 * 2) discounted price * 1.09 has at most 2dp (for combined discount+GST questions)
 */
function pickDiscountCleanPrice() {
  const discountPct = pick([10, 15, 20, 25, 30, 40, 50]);
  // Need X * discountPct / 100 whole → same logic as pickCleanBaseAndPercent
  const g = gcd(discountPct, 100);
  const step = 100 / g;
  const minMult = Math.max(1, Math.ceil(20 / step));
  const maxMult = Math.floor(500 / step);
  const mult = randInt(minMult, maxMult);
  const X = mult * step;
  return { X, discountPct };
}

function generateDiscountGST(familyId) {
  const shop = pick(SHOPS);

  if (familyId.endsWith('_001')) {
    // Single Discount
    const { X, discountPct } = pickDiscountCleanPrice();
    const discountAmt = (X * discountPct) / 100;
    const salePrice = X - discountAmt;
    const { item } = pick(ITEMS_DECREASE);

    return {
      skillId: 'P6-PCT-02',
      questionFamilyId: familyId,
      prompt: `A ${item} at ${shop} costs $${X}. It is on sale at ${discountPct}% off. Find the sale price.`,
      answer: salePrice,
      answerType: 'number',
      instructionHint: `Find ${discountPct}% of $${X} to get the discount amount, then subtract it from the original price.`,
      solutionText: `Discount = ${discountPct}% of $${X} = $${discountAmt}. Sale price = $${X} − $${discountAmt} = $${salePrice}.`,
      misconceptionTraps: ['forgets_subtract_discount', 'percentage_of_wrong_base'],
    };
  }

  if (familyId.endsWith('_002')) {
    // GST Calculation
    const price = pickGSTCleanPrice();
    const gstAmount = cleanNum((price * GST_RATE) / 100);
    const total = cleanNum(price + gstAmount);
    const { item } = pick(ITEMS_INCREASE);

    return {
      skillId: 'P6-PCT-02',
      questionFamilyId: familyId,
      prompt: `The price of a ${item} before GST is $${price}. GST is ${GST_RATE}%. Find the total price including GST.`,
      answer: total,
      answerType: 'number',
      instructionHint: `Find ${GST_RATE}% of $${price}, then add it to the original price.`,
      solutionText: `GST = ${GST_RATE}% of $${price} = $${gstAmount}. Total = $${price} + $${gstAmount} = $${total}.`,
      misconceptionTraps: ['gst_on_discounted_not_original', 'wrong_percentage_fraction'],
    };
  }

  // _003: Discount then GST
  // Pick discount % from [10, 20, 25, 50] and base price as multiple of 100
  // so both discount and GST give clean numbers
  const discountPct = pick([10, 20, 25, 50]);
  const basePrice = randInt(1, 5) * 100; // $100, $200, ..., $500
  const discountAmt = (basePrice * discountPct) / 100;
  const discountedPrice = basePrice - discountAmt;
  const gstAmount = cleanNum((discountedPrice * GST_RATE) / 100);
  const finalPrice = cleanNum(discountedPrice + gstAmount);
  const { item } = pick(ITEMS_DECREASE);
  const name = pick(NAMES);

  return {
    skillId: 'P6-PCT-02',
    questionFamilyId: familyId,
    prompt: `${name} wants to buy a ${item} at ${shop}. The original price is $${basePrice}. There is a ${discountPct}% discount, and ${GST_RATE}% GST is added after the discount. What is the final price ${name.split(' ')[0]} pays?`,
    answer: finalPrice,
    answerType: 'number',
    instructionHint: `Step 1: Find the discounted price. Step 2: Calculate GST on the discounted price. Step 3: Add GST to the discounted price.`,
    solutionText: `Discount = ${discountPct}% of $${basePrice} = $${discountAmt}. Discounted price = $${basePrice} − $${discountAmt} = $${discountedPrice}. GST = ${GST_RATE}% of $${discountedPrice} = $${gstAmount}. Final price = $${discountedPrice} + $${gstAmount} = $${finalPrice}.`,
    misconceptionTraps: ['gst_on_discounted_not_original', 'forgets_subtract_discount', 'percentage_of_wrong_base'],
  };
}

// ---------------------------------------------------------------------------
// P6-PCT-03: Reverse Percentage
// ---------------------------------------------------------------------------

/**
 * Strategy: pick the ORIGINAL value first, apply the percentage change,
 * and use the result as the given value. This guarantees clean numbers.
 */

const REVERSE_INCREASE_PCTS = [10, 20, 25, 50]; // percents where 100+pct divides nicely
const REVERSE_DECREASE_PCTS = [10, 20, 25, 40, 50, 75]; // percents where 100-pct divides nicely

function generateReverse(familyId) {
  if (familyId.endsWith('_001')) {
    // Reverse Percentage Increase
    // original * (100 + Y) / 100 = final → original = final * 100 / (100 + Y)
    const Y = pick(REVERSE_INCREASE_PCTS);
    const multiplier = 100 + Y; // e.g. 120
    // Pick original so that original * multiplier / 100 is whole
    // original must be a multiple of (100 / gcd(multiplier, 100))
    const g = gcd(multiplier, 100);
    const step = 100 / g;
    const minMult = Math.max(1, Math.ceil(20 / step));
    const maxMult = Math.floor(500 / step);
    const mult = randInt(minMult, maxMult);
    const original = mult * step;
    const finalValue = (original * multiplier) / 100;

    return {
      skillId: 'P6-PCT-03',
      questionFamilyId: familyId,
      prompt: `After a ${Y}% increase, the price of an item is $${finalValue}. What was the original price?`,
      answer: original,
      answerType: 'number',
      instructionHint: `After a ${Y}% increase, the final price is ${multiplier}% of the original. Divide $${finalValue} by ${multiplier} and multiply by 100.`,
      solutionText: `${multiplier}% → $${finalValue}. 1% → $${finalValue} ÷ ${multiplier} = $${cleanNum(finalValue / multiplier)}. 100% → $${cleanNum(finalValue / multiplier)} × 100 = $${original}.`,
      misconceptionTraps: ['reverse_percentage_uses_final_as_base', 'percentage_of_wrong_base'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Reverse Percentage Decrease
    // original * (100 - Y) / 100 = final → original = final * 100 / (100 - Y)
    const Y = pick(REVERSE_DECREASE_PCTS);
    const multiplier = 100 - Y; // e.g. 80
    const g = gcd(multiplier, 100);
    const step = 100 / g;
    const minMult = Math.max(1, Math.ceil(20 / step));
    const maxMult = Math.floor(500 / step);
    const mult = randInt(minMult, maxMult);
    const original = mult * step;
    const finalValue = (original * multiplier) / 100;

    return {
      skillId: 'P6-PCT-03',
      questionFamilyId: familyId,
      prompt: `After a ${Y}% discount, the price is $${finalValue}. What was the original price?`,
      answer: original,
      answerType: 'number',
      instructionHint: `After a ${Y}% discount, the sale price is ${multiplier}% of the original. Divide $${finalValue} by ${multiplier} and multiply by 100.`,
      solutionText: `${multiplier}% → $${finalValue}. 1% → $${finalValue} ÷ ${multiplier} = $${cleanNum(finalValue / multiplier)}. 100% → $${cleanNum(finalValue / multiplier)} × 100 = $${original}.`,
      misconceptionTraps: ['reverse_percentage_uses_final_as_base', 'percentage_of_wrong_base'],
    };
  }

  // _003: Reverse Percentage Word Problem
  const name = pick(NAMES);
  const isIncrease = Math.random() < 0.5;

  if (isIncrease) {
    const Y = pick(REVERSE_INCREASE_PCTS);
    const multiplier = 100 + Y;
    const g = gcd(multiplier, 100);
    const step = 100 / g;
    const minMult = Math.max(1, Math.ceil(30 / step));
    const maxMult = Math.floor(400 / step);
    const mult = randInt(minMult, maxMult);
    const original = mult * step;
    const finalValue = (original * multiplier) / 100;
    const { item } = pick(ITEMS_INCREASE);

    return {
      skillId: 'P6-PCT-03',
      questionFamilyId: familyId,
      prompt: `The price of a ${item} increased by ${Y}%. The new price is $${finalValue}. What was the price of the ${item} before the increase?`,
      answer: original,
      answerType: 'number',
      instructionHint: `The new price ($${finalValue}) is ${multiplier}% of the original. Use the unitary method: find 1%, then 100%.`,
      solutionText: `${multiplier}% → $${finalValue}. 1% → $${cleanNum(finalValue / multiplier)}. 100% (original) → $${original}.`,
      misconceptionTraps: ['reverse_percentage_uses_final_as_base', 'confuses_increase_decrease'],
    };
  }

  const Y = pick(REVERSE_DECREASE_PCTS);
  const multiplier = 100 - Y;
  const g = gcd(multiplier, 100);
  const step = 100 / g;
  const minMult = Math.max(1, Math.ceil(30 / step));
  const maxMult = Math.floor(400 / step);
  const mult = randInt(minMult, maxMult);
  const original = mult * step;
  const finalValue = (original * multiplier) / 100;
  const { item } = pick(ITEMS_DECREASE);
  const shop = pick(SHOPS);

  return {
    skillId: 'P6-PCT-03',
    questionFamilyId: familyId,
    prompt: `${name} bought a ${item} at ${shop} during a ${Y}% off sale. ${name.split(' ')[0]} paid $${finalValue}. What was the original price of the ${item}?`,
    answer: original,
    answerType: 'number',
    instructionHint: `${name.split(' ')[0]} paid ${multiplier}% of the original price. Use the unitary method: find 1%, then 100%.`,
    solutionText: `${multiplier}% → $${finalValue}. 1% → $${cleanNum(finalValue / multiplier)}. 100% (original) → $${original}.`,
    misconceptionTraps: ['reverse_percentage_uses_final_as_base', 'confuses_increase_decrease'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P6-PCT-01': generateIncreaseDecrease,
  'P6-PCT-02': generateDiscountGST,
  'P6-PCT-03': generateReverse,
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
