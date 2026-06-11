import { getSkill } from './p5DecimalsSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p5DecimalsQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ── Helpers for safe decimal arithmetic ──────────────────────────────
function safeAdd(a, b) { return Math.round((a + b) * 1000) / 1000; }
function safeSub(a, b) { return Math.round((a - b) * 1000) / 1000; }
function safeMul(a, b) { return Math.round(a * b * 1000) / 1000; }
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

// ── Place-value digit extraction ─────────────────────────────────────
function digitAtPlace(numStr, place) {
  // place: 'ones','tens','hundreds','tenths','hundredths','thousandths'
  const parts = numStr.split('.');
  const intPart = parts[0] || '0';
  const decPart = (parts[1] || '').padEnd(3, '0');
  const positions = { hundreds: intPart.length >= 3 ? intPart[intPart.length - 3] : '0', tens: intPart.length >= 2 ? intPart[intPart.length - 2] : '0', ones: intPart[intPart.length - 1] || '0', tenths: decPart[0], hundredths: decPart[1], thousandths: decPart[2] };
  return parseInt(positions[place], 10);
}
function placeValueOf(digit, place) {
  const multipliers = { ones: 1, tens: 10, hundreds: 100, tenths: 0.1, hundredths: 0.01, thousandths: 0.001 };
  return Math.round(digit * multipliers[place] * 1000) / 1000;
}

// ── Fraction-decimal conversion tables (exact terminating decimals) ──
const FRAC_TO_DEC = [
  { num: 1, den: 2, dec: 0.5 },
  { num: 1, den: 4, dec: 0.25 },
  { num: 3, den: 4, dec: 0.75 },
  { num: 1, den: 5, dec: 0.2 },
  { num: 2, den: 5, dec: 0.4 },
  { num: 3, den: 5, dec: 0.6 },
  { num: 4, den: 5, dec: 0.8 },
  { num: 1, den: 8, dec: 0.125 },
  { num: 3, den: 8, dec: 0.375 },
  { num: 5, den: 8, dec: 0.625 },
  { num: 7, den: 8, dec: 0.875 },
  { num: 1, den: 10, dec: 0.1 },
  { num: 3, den: 10, dec: 0.3 },
  { num: 7, den: 10, dec: 0.7 },
  { num: 9, den: 10, dec: 0.9 },
  { num: 1, den: 20, dec: 0.05 },
  { num: 3, den: 20, dec: 0.15 },
  { num: 7, den: 20, dec: 0.35 },
  { num: 9, den: 20, dec: 0.45 },
  { num: 11, den: 20, dec: 0.55 },
  { num: 1, den: 25, dec: 0.04 },
  { num: 2, den: 25, dec: 0.08 },
  { num: 3, den: 25, dec: 0.12 },
  { num: 4, den: 25, dec: 0.16 },
  { num: 7, den: 25, dec: 0.28 },
  { num: 9, den: 25, dec: 0.36 },
  { num: 11, den: 25, dec: 0.44 },
];

// ── DEC-01: Place Value & Rounding ───────────────────────────────────
function generatePlaceValue(familyId) {
  if (familyId.endsWith('_001')) {
    // Identify the value of a specific digit in a decimal
    const intPart = randInt(1, 9);
    const d1 = randInt(0, 9), d2 = randInt(0, 9), d3 = randInt(1, 9);
    const numStr = `${intPart}.${d1}${d2}${d3}`;
    const places = ['tenths', 'hundredths', 'thousandths'];
    const place = pick(places);
    const digit = digitAtPlace(numStr, place);
    const value = placeValueOf(digit, place);
    return {
      skillId: 'P5-DEC-01', questionFamilyId: familyId,
      prompt: `In the number ${numStr}, what is the value of the digit ${digit} in the ${place} place?`,
      answer: value, answerType: 'number',
      instructionHint: `The ${place} place is worth ${place === 'tenths' ? '0.1' : place === 'hundredths' ? '0.01' : '0.001'} per unit. Multiply the digit by that value.`,
      solutionText: `The digit ${digit} is in the ${place} place. Its value is ${digit} × ${place === 'tenths' ? '0.1' : place === 'hundredths' ? '0.01' : '0.001'} = ${value}.`,
      misconceptionTraps: ['ignores_decimal_point_in_comparison'],
    };
  }
  if (familyId.endsWith('_002')) {
    // Round to 1 decimal place
    const intPart = randInt(1, 19);
    const d1 = randInt(0, 9), d2 = randInt(0, 9), d3 = randInt(1, 9);
    const numStr = `${intPart}.${d1}${d2}${d3}`;
    const num = parseFloat(numStr);
    const rounded = Math.round(num * 10) / 10;
    return {
      skillId: 'P5-DEC-01', questionFamilyId: familyId,
      prompt: `Round ${numStr} to 1 decimal place.`,
      answer: rounded, answerType: 'number',
      instructionHint: 'Look at the hundredths digit. If it is 5 or more, round up the tenths digit. Otherwise keep it the same.',
      solutionText: `${numStr} → the hundredths digit is ${d2}. ${d2 >= 5 ? 'Round up' : 'Round down'} → ${rounded.toFixed(1)}.`,
      misconceptionTraps: ['rounds_wrong_direction', 'forgets_trailing_zeros'],
    };
  }
  // _003: Round to 2 decimal places
  const intPart = randInt(1, 19);
  const d1 = randInt(0, 9), d2 = randInt(0, 9), d3 = randInt(1, 9);
  const numStr = `${intPart}.${d1}${d2}${d3}`;
  const num = parseFloat(numStr);
  const rounded = Math.round(num * 100) / 100;
  return {
    skillId: 'P5-DEC-01', questionFamilyId: familyId,
    prompt: `Round ${numStr} to 2 decimal places.`,
    answer: rounded, answerType: 'number',
    instructionHint: 'Look at the thousandths digit. If it is 5 or more, round up the hundredths digit.',
    solutionText: `${numStr} → the thousandths digit is ${d3}. ${d3 >= 5 ? 'Round up' : 'Round down'} → ${rounded.toFixed(2)}.`,
    misconceptionTraps: ['rounds_wrong_direction'],
  };
}

// ── DEC-02: Four Operations ──────────────────────────────────────────
function generateFourOps(familyId) {
  if (familyId.endsWith('_001')) {
    // Add or subtract two decimals (up to 2dp)
    const isAdd = Math.random() < 0.5;
    const a = Math.round(randInt(10, 99) * 10) / 100; // e.g. 0.10 to 0.99
    const bRaw = Math.round(randInt(10, 99) * 10) / 100;
    let answer, prompt;
    if (isAdd) {
      // a and b are both 1dp or 2dp decimals in range ~1 to ~20
      const aVal = Math.round(randInt(100, 1999)) / 100;
      const bVal = Math.round(randInt(100, 999)) / 100;
      answer = safeAdd(aVal, bVal);
      prompt = `Calculate ${aVal} + ${bVal}`;
    } else {
      const aVal = Math.round(randInt(500, 1999)) / 100;
      const bVal = Math.round(randInt(100, Math.floor(aVal * 100) - 1)) / 100;
      answer = safeSub(aVal, bVal);
      prompt = `Calculate ${aVal} − ${bVal}`;
    }
    return {
      skillId: 'P5-DEC-02', questionFamilyId: familyId, prompt,
      answer, answerType: 'number',
      instructionHint: 'Line up the decimal points, add trailing zeros if needed, then add or subtract column by column.',
      solutionText: `${prompt} = ${answer}`,
      misconceptionTraps: ['misaligns_decimal_points_adding', 'forgets_trailing_zeros'],
    };
  }
  if (familyId.endsWith('_002')) {
    // Multiply decimal by whole number (ensure clean result)
    const multiplier = randInt(2, 9);
    // Create a decimal that gives a clean product
    const baseInt = randInt(1, 99);
    const dp = pick([10, 100]); // 1dp or 2dp
    const decimal = Math.round(baseInt * 1000 / dp) / 1000;
    const decimalClean = baseInt / dp;
    const answer = safeMul(decimalClean, multiplier);
    return {
      skillId: 'P5-DEC-02', questionFamilyId: familyId,
      prompt: `Calculate ${decimalClean} × ${multiplier}`,
      answer, answerType: 'number',
      instructionHint: 'Multiply as if there is no decimal point, then put the decimal point back in the correct position.',
      solutionText: `${decimalClean} × ${multiplier} = ${answer}`,
      misconceptionTraps: ['moves_decimal_wrong_direction_multiplying'],
    };
  }
  // _003: Divide decimal by whole number (exact result)
  const divisor = randInt(2, 9);
  // Build the dividend so it divides evenly: pick a quotient, multiply back
  const quotientBase = randInt(1, 99);
  const dp = pick([10, 100]);
  const quotient = quotientBase / dp;
  const dividend = safeMul(quotient, divisor);
  return {
    skillId: 'P5-DEC-02', questionFamilyId: familyId,
    prompt: `Calculate ${dividend} ÷ ${divisor}`,
    answer: quotient, answerType: 'number',
    instructionHint: 'Divide as normal. Keep the decimal point aligned in the quotient above the decimal point in the dividend.',
    solutionText: `${dividend} ÷ ${divisor} = ${quotient}`,
    misconceptionTraps: ['moves_decimal_wrong_direction_multiplying', 'forgets_trailing_zeros'],
  };
}

// ── DEC-03: Fraction-Decimal Conversion ──────────────────────────────
function generateConversion(familyId) {
  if (familyId.endsWith('_001')) {
    // Fraction → decimal
    const entry = pick(FRAC_TO_DEC);
    return {
      skillId: 'P5-DEC-03', questionFamilyId: familyId,
      prompt: `Convert ${entry.num}/${entry.den} to a decimal.`,
      answer: entry.dec, answerType: 'number',
      instructionHint: `Divide the numerator by the denominator: ${entry.num} ÷ ${entry.den}.`,
      solutionText: `${entry.num}/${entry.den} = ${entry.num} ÷ ${entry.den} = ${entry.dec}`,
      misconceptionTraps: ['confuses_fraction_decimal_conversion'],
    };
  }
  if (familyId.endsWith('_002')) {
    // Decimal → fraction (simplest form) — answer as text "num/den"
    const entry = pick(FRAC_TO_DEC);
    return {
      skillId: 'P5-DEC-03', questionFamilyId: familyId,
      prompt: `Convert ${entry.dec} to a fraction in simplest form.`,
      answer: `${entry.num}/${entry.den}`, answerType: 'text',
      instructionHint: 'Write the decimal as a fraction over 10, 100, or 1000, then simplify by dividing numerator and denominator by their HCF.',
      solutionText: `${entry.dec} = ${entry.num}/${entry.den}`,
      misconceptionTraps: ['confuses_fraction_decimal_conversion'],
    };
  }
  // _003: Mixed conversion — convert a mixed number to decimal or vice versa
  const wholePart = randInt(1, 9);
  const entry = pick(FRAC_TO_DEC);
  const isToDecimal = Math.random() < 0.5;
  if (isToDecimal) {
    const answer = safeAdd(wholePart, entry.dec);
    return {
      skillId: 'P5-DEC-03', questionFamilyId: familyId,
      prompt: `Convert ${wholePart} ${entry.num}/${entry.den} to a decimal.`,
      answer, answerType: 'number',
      instructionHint: `Convert the fraction part to a decimal, then add the whole number.`,
      solutionText: `${wholePart} ${entry.num}/${entry.den} = ${wholePart} + ${entry.dec} = ${answer}`,
      misconceptionTraps: ['confuses_fraction_decimal_conversion', 'forgets_trailing_zeros'],
    };
  }
  // Decimal → mixed number (text answer)
  const decimalVal = safeAdd(wholePart, entry.dec);
  return {
    skillId: 'P5-DEC-03', questionFamilyId: familyId,
    prompt: `Convert ${decimalVal} to a mixed number with the fraction in simplest form.`,
    answer: `${wholePart} ${entry.num}/${entry.den}`, answerType: 'text',
    instructionHint: 'Separate the whole number from the decimal part. Convert the decimal part to a fraction and simplify.',
    solutionText: `${decimalVal} = ${wholePart} + ${entry.dec} = ${wholePart} ${entry.num}/${entry.den}`,
    misconceptionTraps: ['confuses_fraction_decimal_conversion', 'forgets_trailing_zeros'],
  };
}

const generatorsBySkill = {
  'P5-DEC-01': generatePlaceValue,
  'P5-DEC-02': generateFourOps,
  'P5-DEC-03': generateConversion,
};

export function generateQuestion(skillId, options = {}) {
  const skill = getSkill(skillId);
  if (!skill) return null;
  const families = getQuestionFamiliesBySkill(skillId);
  if (!families.length) return null;
  const family = options.questionFamilyId ? families.find((f) => f.id === options.questionFamilyId) || pick(families) : pick(families);
  const generator = generatorsBySkill[skillId];
  if (!generator) return null;
  const question = generator(family.id);
  return { ...question, questionId: `${family.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, difficulty: family.difficulty, fluencyTargetSeconds: family.fluencyTargetSeconds, visualRequirement: family.visualRequirement || skill.visual };
}

export function generateQuestionSet(skillId, count = 5, options = {}) {
  const questions = [];
  for (let i = 0; i < count; i++) { const q = generateQuestion(skillId, options); if (q) questions.push(q); }
  return questions;
}
export function generateDiagnosticSet(skillIds, questionsPerSkill = 3) {
  const questions = [];
  for (const skillId of skillIds) { questions.push(...generateQuestionSet(skillId, questionsPerSkill)); }
  return questions;
}
export function getSupportedSkillIds() { return Object.keys(generatorsBySkill); }
export default { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds };
