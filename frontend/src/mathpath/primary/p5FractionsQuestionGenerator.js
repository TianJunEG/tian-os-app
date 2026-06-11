import { getSkill } from './p5FractionsSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p5FractionsQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); return b === 0 ? a : gcd(b, a % b); }
function lcm(a, b) { return (a * b) / gcd(a, b); }

/** Return simplified fraction string like '7/12' or '1' or '0'. */
function simplify(num, den) {
  if (den === 0) return 'undefined';
  if (num === 0) return '0';
  const sign = (num < 0) !== (den < 0) ? -1 : 1;
  num = Math.abs(num);
  den = Math.abs(den);
  const g = gcd(num, den);
  num = (sign * num) / g;
  den = den / g;
  if (den === 1) return `${num}`;
  return `${num}/${den}`;
}

/** Return mixed number string like '2 1/3' or whole number string. */
function toMixed(num, den) {
  if (den === 0) return 'undefined';
  const sign = (num < 0) !== (den < 0) ? -1 : 1;
  num = Math.abs(num);
  den = Math.abs(den);
  const g = gcd(num, den);
  num = num / g;
  den = den / g;
  if (den === 1) return `${sign * num}`;
  const whole = Math.floor(num / den);
  const remainder = num % den;
  if (whole === 0) return simplify(sign * remainder, den);
  return `${sign * whole} ${remainder}/${den}`;
}

// ── FR-01: Unlike Fractions Addition & Subtraction ──

const UNLIKE_DENOM_PAIRS = [
  [2,3],[2,5],[3,4],[3,5],[4,5],[3,7],[2,7],[4,7],[5,6],[3,8],[5,8],[2,9],[4,9],[5,9],[6,7],[3,10],[7,10],[7,8],
];

function generateFR01(familyId) {
  if (familyId.endsWith('_001')) {
    // Add two unlike proper fractions
    const [d1, d2] = pick(UNLIKE_DENOM_PAIRS);
    const n1 = randInt(1, d1 - 1);
    const n2 = randInt(1, d2 - 1);
    const commonDen = lcm(d1, d2);
    const resultNum = n1 * (commonDen / d1) + n2 * (commonDen / d2);
    const answer = resultNum > commonDen ? toMixed(resultNum, commonDen) : simplify(resultNum, commonDen);
    return {
      skillId: 'P5-FR-01', questionFamilyId: familyId,
      prompt: `What is ${n1}/${d1} + ${n2}/${d2}? Give your answer in simplest form.`,
      answer, answerType: 'text',
      instructionHint: `Find the LCD of ${d1} and ${d2}, convert both fractions, then add the numerators.`,
      solutionText: `LCD of ${d1} and ${d2} is ${commonDen}. ${n1}/${d1} = ${n1 * (commonDen / d1)}/${commonDen}, ${n2}/${d2} = ${n2 * (commonDen / d2)}/${commonDen}. Sum = ${resultNum}/${commonDen} = ${answer}.`,
      misconceptionTraps: ['adds_numerators_and_denominators', 'forgets_to_find_lcd'],
    };
  }
  if (familyId.endsWith('_002')) {
    // Subtract two unlike proper fractions (ensure positive result)
    const [d1, d2] = pick(UNLIKE_DENOM_PAIRS);
    const commonDen = lcm(d1, d2);
    let n1 = randInt(1, d1 - 1);
    let n2 = randInt(1, d2 - 1);
    let scaledN1 = n1 * (commonDen / d1);
    let scaledN2 = n2 * (commonDen / d2);
    // Ensure positive result by swapping if needed
    if (scaledN1 < scaledN2) { [n1, n2] = [n2, n1]; const temp = d1; /* swap fractions */ }
    // Recalculate after potential swap — actually we need to swap fractions including denoms
    let frac1Num, frac1Den, frac2Num, frac2Den;
    if (n1 * (commonDen / d1) >= n2 * (commonDen / d2)) {
      frac1Num = n1; frac1Den = d1; frac2Num = n2; frac2Den = d2;
    } else {
      frac1Num = n2; frac1Den = d2; frac2Num = n1; frac2Den = d1;
    }
    const s1 = frac1Num * (commonDen / frac1Den);
    const s2 = frac2Num * (commonDen / frac2Den);
    const resultNum = s1 - s2;
    if (resultNum === 0) {
      // Edge case: equal fractions — regenerate
      return generateFR01(familyId);
    }
    const answer = simplify(resultNum, commonDen);
    return {
      skillId: 'P5-FR-01', questionFamilyId: familyId,
      prompt: `What is ${frac1Num}/${frac1Den} − ${frac2Num}/${frac2Den}? Give your answer in simplest form.`,
      answer, answerType: 'text',
      instructionHint: `Find the LCD of ${frac1Den} and ${frac2Den}, convert both fractions, then subtract.`,
      solutionText: `LCD of ${frac1Den} and ${frac2Den} is ${commonDen}. ${frac1Num}/${frac1Den} = ${s1}/${commonDen}, ${frac2Num}/${frac2Den} = ${s2}/${commonDen}. Difference = ${resultNum}/${commonDen} = ${answer}.`,
      misconceptionTraps: ['adds_numerators_and_denominators', 'forgets_to_find_lcd'],
    };
  }
  // _003: Mixed number addition or subtraction
  const [d1, d2] = pick(UNLIKE_DENOM_PAIRS);
  const w1 = randInt(1, 4);
  const w2 = randInt(1, 3);
  const n1 = randInt(1, d1 - 1);
  const n2 = randInt(1, d2 - 1);
  const commonDen = lcm(d1, d2);
  const isAdd = Math.random() < 0.5;
  const imp1 = w1 * d1 + n1; // improper numerator over d1
  const imp2 = w2 * d2 + n2; // improper numerator over d2
  const scaled1 = imp1 * (commonDen / d1);
  const scaled2 = imp2 * (commonDen / d2);
  let resultNum;
  let op;
  if (isAdd) {
    resultNum = scaled1 + scaled2;
    op = '+';
  } else {
    if (scaled1 <= scaled2) {
      resultNum = scaled1 + scaled2;
      op = '+';
    } else {
      resultNum = scaled1 - scaled2;
      op = '−';
    }
  }
  const answer = toMixed(resultNum, commonDen);
  return {
    skillId: 'P5-FR-01', questionFamilyId: familyId,
    prompt: `What is ${w1} ${n1}/${d1} ${op} ${w2} ${n2}/${d2}? Give your answer in simplest form.`,
    answer, answerType: 'text',
    instructionHint: `Convert mixed numbers to improper fractions, find the LCD of ${d1} and ${d2}, then ${op === '+' ? 'add' : 'subtract'}.`,
    solutionText: `${w1} ${n1}/${d1} = ${imp1}/${d1}, ${w2} ${n2}/${d2} = ${imp2}/${d2}. LCD = ${commonDen}. ${scaled1}/${commonDen} ${op} ${scaled2}/${commonDen} = ${resultNum}/${commonDen} = ${answer}.`,
    misconceptionTraps: ['wrong_mixed_number_conversion', 'forgets_to_find_lcd', 'forgets_to_simplify'],
  };
}

// ── FR-02: Fraction of a Whole Number ──

const FRACTION_OF_WHOLE_SETS = [
  { num: 1, den: 2, wholes: [8, 14, 18, 24, 30, 36, 42, 50] },
  { num: 1, den: 3, wholes: [9, 15, 18, 21, 27, 33, 36] },
  { num: 2, den: 3, wholes: [9, 12, 15, 18, 21, 24, 27] },
  { num: 1, den: 4, wholes: [12, 16, 20, 24, 28, 32, 36] },
  { num: 3, den: 4, wholes: [8, 12, 16, 20, 24, 28, 32] },
  { num: 1, den: 5, wholes: [10, 15, 20, 25, 30, 35, 40] },
  { num: 2, den: 5, wholes: [10, 15, 20, 25, 30, 35] },
  { num: 3, den: 5, wholes: [10, 15, 20, 25, 30, 35] },
  { num: 4, den: 5, wholes: [10, 15, 20, 25, 30] },
  { num: 1, den: 6, wholes: [12, 18, 24, 30, 36, 42] },
  { num: 5, den: 6, wholes: [12, 18, 24, 30, 36] },
  { num: 1, den: 7, wholes: [14, 21, 28, 35, 42, 49] },
  { num: 3, den: 7, wholes: [14, 21, 28, 35, 42] },
  { num: 1, den: 8, wholes: [16, 24, 32, 40, 48] },
  { num: 3, den: 8, wholes: [16, 24, 32, 40] },
  { num: 1, den: 9, wholes: [18, 27, 36, 45, 54] },
  { num: 2, den: 9, wholes: [18, 27, 36, 45] },
];

function generateFR02(familyId) {
  if (familyId.endsWith('_001')) {
    // Simple fraction of whole
    const set = pick(FRACTION_OF_WHOLE_SETS.filter((s) => s.num <= 2 && s.den <= 5));
    const whole = pick(set.wholes);
    const answer = (set.num * whole) / set.den;
    return {
      skillId: 'P5-FR-02', questionFamilyId: familyId,
      prompt: `What is ${set.num}/${set.den} of ${whole}?`,
      answer, answerType: 'number',
      instructionHint: `Divide ${whole} by ${set.den}, then multiply by ${set.num}.`,
      solutionText: `${whole} ÷ ${set.den} = ${whole / set.den}. ${whole / set.den} × ${set.num} = ${answer}.`,
      misconceptionTraps: ['multiplies_whole_by_both_num_and_den'],
    };
  }
  if (familyId.endsWith('_002')) {
    // Fraction of larger quantity
    const set = pick(FRACTION_OF_WHOLE_SETS.filter((s) => s.den >= 5));
    const whole = pick(set.wholes);
    const answer = (set.num * whole) / set.den;
    return {
      skillId: 'P5-FR-02', questionFamilyId: familyId,
      prompt: `What is ${set.num}/${set.den} of ${whole}?`,
      answer, answerType: 'number',
      instructionHint: `Divide ${whole} by ${set.den} first, then multiply by ${set.num}.`,
      solutionText: `${whole} ÷ ${set.den} = ${whole / set.den}. ${whole / set.den} × ${set.num} = ${answer}.`,
      misconceptionTraps: ['multiplies_whole_by_both_num_and_den', 'forgets_to_simplify'],
    };
  }
  // _003: Mixed number × whole number
  const den = pick([2, 3, 4, 5]);
  const fracPart = randInt(1, den - 1);
  const wholePart = randInt(1, 3);
  const multiplier = pick([2, 3, 4, 5, 6].filter((m) => ((wholePart * den + fracPart) * m) % den === 0));
  const mult = multiplier || den; // fallback ensures clean result
  const impNum = wholePart * den + fracPart;
  const answer = (impNum * mult) / den;
  return {
    skillId: 'P5-FR-02', questionFamilyId: familyId,
    prompt: `What is ${wholePart} ${fracPart}/${den} × ${mult}?`,
    answer, answerType: 'number',
    instructionHint: `Convert ${wholePart} ${fracPart}/${den} to an improper fraction (${impNum}/${den}), then multiply by ${mult}.`,
    solutionText: `${wholePart} ${fracPart}/${den} = ${impNum}/${den}. ${impNum}/${den} × ${mult} = ${impNum * mult}/${den} = ${answer}.`,
    misconceptionTraps: ['wrong_mixed_number_conversion', 'multiplies_whole_by_both_num_and_den'],
  };
}

// ── FR-03: Fraction Multiplication & Division ──

const MULT_FRAC_PAIRS = [
  [[1,2],[1,3]], [[1,2],[3,4]], [[2,3],[3,5]], [[1,4],[2,3]], [[3,4],[2,5]],
  [[2,5],[5,6]], [[3,7],[2,3]], [[1,3],[3,8]], [[2,3],[4,5]], [[3,5],[5,7]],
  [[4,5],[1,6]], [[1,6],[3,4]], [[2,7],[7,8]], [[5,6],[3,10]], [[3,8],[4,9]],
];

function generateFR03(familyId) {
  if (familyId.endsWith('_001')) {
    // Fraction × fraction
    const [[n1, d1], [n2, d2]] = pick(MULT_FRAC_PAIRS);
    const resNum = n1 * n2;
    const resDen = d1 * d2;
    const answer = simplify(resNum, resDen);
    return {
      skillId: 'P5-FR-03', questionFamilyId: familyId,
      prompt: `What is ${n1}/${d1} × ${n2}/${d2}? Give your answer in simplest form.`,
      answer, answerType: 'text',
      instructionHint: 'Multiply numerators together and denominators together, then simplify.',
      solutionText: `${n1} × ${n2} = ${resNum}, ${d1} × ${d2} = ${resDen}. ${resNum}/${resDen} = ${answer}.`,
      misconceptionTraps: ['adds_numerators_and_denominators', 'forgets_to_simplify'],
    };
  }
  if (familyId.endsWith('_002')) {
    // Whole ÷ proper fraction → always a whole number result
    const den = pick([2, 3, 4, 5, 6, 7, 8]);
    const num = randInt(1, den - 1);
    // Ensure whole number result: whole must be divisible by num
    const baseMultiplier = randInt(1, 5);
    const whole = num * baseMultiplier;
    // whole ÷ (num/den) = whole × (den/num) = whole * den / num
    const answer = (whole * den) / num;
    return {
      skillId: 'P5-FR-03', questionFamilyId: familyId,
      prompt: `What is ${whole} ÷ ${num}/${den}?`,
      answer, answerType: 'number',
      instructionHint: `To divide by a fraction, multiply by its reciprocal: ${whole} × ${den}/${num}.`,
      solutionText: `${whole} ÷ ${num}/${den} = ${whole} × ${den}/${num} = ${whole * den}/${num} = ${answer}.`,
      misconceptionTraps: ['inverts_wrong_fraction_in_division'],
    };
  }
  // _003: Fraction ÷ whole number
  const den = pick([2, 3, 4, 5, 6, 7, 8]);
  const num = randInt(1, den - 1);
  const divisor = pick([2, 3, 4, 5, 6].filter((d) => d !== 1));
  // (num/den) ÷ divisor = num / (den × divisor)
  const resDen = den * divisor;
  const answer = simplify(num, resDen);
  return {
    skillId: 'P5-FR-03', questionFamilyId: familyId,
    prompt: `What is ${num}/${den} ÷ ${divisor}? Give your answer in simplest form.`,
    answer, answerType: 'text',
    instructionHint: `Dividing by ${divisor} is the same as multiplying by 1/${divisor}. So ${num}/${den} × 1/${divisor}.`,
    solutionText: `${num}/${den} ÷ ${divisor} = ${num}/${den} × 1/${divisor} = ${num}/${resDen} = ${answer}.`,
    misconceptionTraps: ['inverts_wrong_fraction_in_division', 'forgets_to_simplify'],
  };
}

const generatorsBySkill = { 'P5-FR-01': generateFR01, 'P5-FR-02': generateFR02, 'P5-FR-03': generateFR03 };

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
