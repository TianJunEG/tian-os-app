import { getSkill } from './p5PercentageSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p5PercentageQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

/* ─── Percent ↔ Fraction / Decimal tables ─── */
const PERCENT_FRACTION_MAP = [
  { pct: 5, num: 1, den: 20 },
  { pct: 10, num: 1, den: 10 },
  { pct: 15, num: 3, den: 20 },
  { pct: 20, num: 1, den: 5 },
  { pct: 25, num: 1, den: 4 },
  { pct: 30, num: 3, den: 10 },
  { pct: 40, num: 2, den: 5 },
  { pct: 50, num: 1, den: 2 },
  { pct: 60, num: 3, den: 5 },
  { pct: 75, num: 3, den: 4 },
  { pct: 80, num: 4, den: 5 },
  { pct: 90, num: 9, den: 10 },
];

const CLEAN_PERCENTAGES = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80];
const CLEAN_BASES = [40, 50, 60, 80, 100, 120, 150, 200, 250, 300, 400, 500, 600, 800, 1000];

/* ─── PCT-01: Percent ↔ Fraction / Decimal Conversion ─── */
function generateConversion(familyId) {
  if (familyId.endsWith('_001')) {
    // Percent to fraction (simplified)
    const entry = pick(PERCENT_FRACTION_MAP);
    return {
      skillId: 'P5-PCT-01', questionFamilyId: familyId,
      prompt: `Convert ${entry.pct}% to a fraction in simplest form. Enter the numerator.`,
      answer: entry.num, answerType: 'number',
      instructionHint: `Write ${entry.pct}/100, then simplify by dividing numerator and denominator by their HCF.`,
      solutionText: `${entry.pct}% = ${entry.pct}/100. GCD of ${entry.pct} and 100 is ${100 / entry.den}. Simplified: ${entry.num}/${entry.den}. Numerator = ${entry.num}.`,
      misconceptionTraps: ['forgets_to_simplify_percent_fraction', 'divides_by_wrong_base_for_percent'],
    };
  }
  if (familyId.endsWith('_002')) {
    // Percent to decimal
    const entry = pick(PERCENT_FRACTION_MAP);
    const decimal = entry.pct / 100;
    return {
      skillId: 'P5-PCT-01', questionFamilyId: familyId,
      prompt: `Convert ${entry.pct}% to a decimal.`,
      answer: decimal, answerType: 'number',
      instructionHint: 'Divide the percentage by 100 (move the decimal point two places to the left).',
      solutionText: `${entry.pct}% = ${entry.pct} ÷ 100 = ${decimal}.`,
      misconceptionTraps: ['moves_decimal_wrong_way'],
    };
  }
  // Fraction/Decimal to percent (_003)
  const useDecimal = Math.random() < 0.5;
  const entry = pick(PERCENT_FRACTION_MAP);
  if (useDecimal) {
    const decimal = entry.pct / 100;
    return {
      skillId: 'P5-PCT-01', questionFamilyId: familyId,
      prompt: `Convert ${decimal} to a percentage.`,
      answer: entry.pct, answerType: 'number',
      instructionHint: 'Multiply the decimal by 100 (move the decimal point two places to the right).',
      solutionText: `${decimal} × 100 = ${entry.pct}%.`,
      misconceptionTraps: ['moves_decimal_wrong_way', 'divides_by_wrong_base_for_percent'],
    };
  }
  return {
    skillId: 'P5-PCT-01', questionFamilyId: familyId,
    prompt: `Convert ${entry.num}/${entry.den} to a percentage.`,
    answer: entry.pct, answerType: 'number',
    instructionHint: `Divide ${entry.num} by ${entry.den}, then multiply by 100.`,
    solutionText: `${entry.num} ÷ ${entry.den} = ${entry.pct / 100}. ${entry.pct / 100} × 100 = ${entry.pct}%.`,
    misconceptionTraps: ['moves_decimal_wrong_way', 'divides_by_wrong_base_for_percent'],
  };
}

/* ─── PCT-02: Find Percentage of a Quantity ─── */
function generatePercentOfQty(familyId) {
  if (familyId.endsWith('_001')) {
    // Find X% of Y
    const pct = pick(CLEAN_PERCENTAGES);
    // Choose a base that gives a whole-number result
    let base;
    do { base = pick(CLEAN_BASES); } while ((pct * base) % 100 !== 0);
    const answer = (pct * base) / 100;
    return {
      skillId: 'P5-PCT-02', questionFamilyId: familyId,
      prompt: `Find ${pct}% of ${base}.`,
      answer, answerType: 'number',
      instructionHint: `Method: ${pct}% of ${base} = (${pct}/100) × ${base}.`,
      solutionText: `${pct}% of ${base} = ${pct}/100 × ${base} = ${answer}.`,
      misconceptionTraps: ['divides_by_wrong_base_for_percent', 'moves_decimal_wrong_way'],
    };
  }
  if (familyId.endsWith('_002')) {
    // What percentage is A of B?
    const pct = pick(CLEAN_PERCENTAGES);
    let base;
    do { base = pick(CLEAN_BASES); } while ((pct * base) % 100 !== 0);
    const part = (pct * base) / 100;
    return {
      skillId: 'P5-PCT-02', questionFamilyId: familyId,
      prompt: `What percentage of ${base} is ${part}?`,
      answer: pct, answerType: 'number',
      instructionHint: `Divide the part by the whole and multiply by 100: (${part}/${base}) × 100.`,
      solutionText: `${part} ÷ ${base} = ${pct / 100}. ${pct / 100} × 100 = ${pct}%.`,
      misconceptionTraps: ['divides_by_wrong_base_for_percent', 'finds_percent_of_wrong_total'],
    };
  }
  // Find the whole from a part and percentage (_003)
  const pct = pick(CLEAN_PERCENTAGES);
  let base;
  do { base = pick(CLEAN_BASES); } while ((pct * base) % 100 !== 0);
  const part = (pct * base) / 100;
  return {
    skillId: 'P5-PCT-02', questionFamilyId: familyId,
    prompt: `${pct}% of a number is ${part}. What is the number?`,
    answer: base, answerType: 'number',
    instructionHint: `If ${pct}% = ${part}, then 1% = ${part} ÷ ${pct}, and 100% = that × 100.`,
    solutionText: `${part} ÷ ${pct} × 100 = ${base}. The number is ${base}.`,
    misconceptionTraps: ['divides_by_wrong_base_for_percent', 'finds_percent_of_wrong_total'],
  };
}

/* ─── PCT-03: Percentage Word Problems ─── */
const NAMES = ['Aisha', 'Benson', 'Chloe', 'Daniel', 'Emily', 'Farhan', 'Grace', 'Harith', 'Irene', 'Jun Wei', 'Kavitha', 'Liam', 'Mei Ling', 'Nathan', 'Olivia', 'Priya', 'Ravi', 'Sarah', 'Tomas', 'Uma'];

function generateWordProblem(familyId) {
  if (familyId.endsWith('_001')) {
    // Spending/saving: spent X%, how much left?
    const name = pick(NAMES);
    const pct = pick([10, 15, 20, 25, 30, 40, 50, 60, 75, 80]);
    const amounts = [40, 50, 60, 80, 100, 120, 150, 200, 250, 300, 400, 500];
    let total;
    do { total = pick(amounts); } while ((pct * total) % 100 !== 0);
    const spent = (pct * total) / 100;
    const left = total - spent;
    const item = pick(['savings', 'allowance', 'pocket money', 'birthday money']);
    return {
      skillId: 'P5-PCT-03', questionFamilyId: familyId,
      prompt: `${name} had $${total} in ${item}. ${name} spent ${pct}% of it. How much does ${name} have left?`,
      answer: left, answerType: 'number',
      instructionHint: `Find ${pct}% of $${total}, then subtract from $${total}. Or find ${100 - pct}% of $${total} directly.`,
      solutionText: `${pct}% of $${total} = $${spent}. $${total} − $${spent} = $${left}.`,
      misconceptionTraps: ['finds_percent_of_wrong_total', 'confuses_percent_increase_with_percent_of'],
    };
  }
  if (familyId.endsWith('_002')) {
    // Composition: X% blue, Y% red, rest green — how many green?
    const name = pick(NAMES);
    const pctA = pick([10, 15, 20, 25, 30]);
    const remaining = 100 - pctA;
    const pctBOptions = [10, 15, 20, 25, 30, 35, 40].filter((p) => p < remaining);
    const pctB = pick(pctBOptions);
    const pctC = 100 - pctA - pctB;
    const totals = [40, 50, 60, 80, 100, 120, 200, 300, 400, 500];
    let total;
    do { total = pick(totals); } while ((pctC * total) % 100 !== 0);
    const answer = (pctC * total) / 100;
    const colourA = pick(['blue', 'red', 'yellow']);
    const colourB = pick(['green', 'white', 'purple'].filter((c) => c !== colourA));
    const colourC = pick(['orange', 'pink', 'black'].filter((c) => c !== colourA && c !== colourB));
    const item = pick(['beads', 'marbles', 'buttons', 'stickers']);
    return {
      skillId: 'P5-PCT-03', questionFamilyId: familyId,
      prompt: `There are ${total} ${item} in a box. ${pctA}% are ${colourA} and ${pctB}% are ${colourB}. The rest are ${colourC}. How many ${colourC} ${item} are there?`,
      answer, answerType: 'number',
      instructionHint: `Rest = 100% − ${pctA}% − ${pctB}% = ${pctC}%. Then find ${pctC}% of ${total}.`,
      solutionText: `${colourC} percentage: 100% − ${pctA}% − ${pctB}% = ${pctC}%. ${pctC}% of ${total} = ${answer}.`,
      misconceptionTraps: ['finds_percent_of_wrong_total', 'confuses_percent_increase_with_percent_of'],
    };
  }
  // Discount / increase problems (_003)
  const name = pick(NAMES);
  const discountPct = pick([10, 15, 20, 25, 30, 40, 50]);
  const prices = [20, 30, 40, 50, 60, 80, 100, 120, 150, 200, 250, 300, 400, 500];
  let originalPrice;
  do { originalPrice = pick(prices); } while ((discountPct * originalPrice) % 100 !== 0);
  const discount = (discountPct * originalPrice) / 100;
  const salePrice = originalPrice - discount;
  const item = pick(['backpack', 'pair of shoes', 'jacket', 'watch', 'bicycle helmet', 'lunch box']);
  return {
    skillId: 'P5-PCT-03', questionFamilyId: familyId,
    prompt: `A ${item} costs $${originalPrice}. During a sale, it is marked down by ${discountPct}%. What is the sale price?`,
    answer: salePrice, answerType: 'number',
    instructionHint: `Find ${discountPct}% of $${originalPrice} and subtract from the original price.`,
    solutionText: `Discount: ${discountPct}% of $${originalPrice} = $${discount}. Sale price: $${originalPrice} − $${discount} = $${salePrice}.`,
    misconceptionTraps: ['confuses_percent_increase_with_percent_of', 'finds_percent_of_wrong_total'],
  };
}

/* ─── Router ─── */
const generatorsBySkill = {
  'P5-PCT-01': generateConversion,
  'P5-PCT-02': generatePercentOfQty,
  'P5-PCT-03': generateWordProblem,
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
