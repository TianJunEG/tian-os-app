import { getSkill } from './p3MulDivSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p3MulDivQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ---------------------------------------------------------------------------
// P3-MD-01: Multiplication Tables (6, 7, 8, 9)
// ---------------------------------------------------------------------------

function generateTablesMul(familyId) {
  const table = pick([6, 7, 8, 9]);
  const factor = randInt(1, 10);
  const product = table * factor;

  if (familyId.endsWith('_001')) {
    return {
      skillId: 'P3-MD-01',
      questionFamilyId: familyId,
      prompt: `${table} x ${factor} = ?`,
      answer: product,
      answerType: 'number',
      instructionHint: 'Recall the times table fact.',
      solutionText: `${table} x ${factor} = ${product}.`,
      misconceptionTraps: ['table_fact_confusion', 'counts_instead_of_recall'],
    };
  }

  if (familyId.endsWith('_002')) {
    return {
      skillId: 'P3-MD-01',
      questionFamilyId: familyId,
      prompt: `${factor} x ${table} = ?`,
      answer: product,
      answerType: 'number',
      instructionHint: 'Recall the times table fact.',
      solutionText: `${factor} x ${table} = ${product}. (Same as ${table} x ${factor}.)`,
      misconceptionTraps: ['table_fact_confusion'],
    };
  }

  // _003: Missing factor
  const askFirst = pick([true, false]);
  if (askFirst) {
    return {
      skillId: 'P3-MD-01',
      questionFamilyId: familyId,
      prompt: `? x ${factor} = ${product}`,
      answer: table,
      answerType: 'number',
      instructionHint: 'Find the missing number.',
      solutionText: `${table} x ${factor} = ${product}, so the missing number is ${table}.`,
      misconceptionTraps: ['table_fact_confusion'],
    };
  }
  return {
    skillId: 'P3-MD-01',
    questionFamilyId: familyId,
    prompt: `${table} x ? = ${product}`,
    answer: factor,
    answerType: 'number',
    instructionHint: 'Find the missing number.',
    solutionText: `${table} x ${factor} = ${product}, so the missing number is ${factor}.`,
    misconceptionTraps: ['table_fact_confusion'],
  };
}

// ---------------------------------------------------------------------------
// P3-MD-02: Dividing Within the Tables
// ---------------------------------------------------------------------------

function generateTablesDiv(familyId) {
  const divisor = pick([6, 7, 8, 9]);
  const quotient = randInt(1, 10);
  const dividend = divisor * quotient;

  if (familyId.endsWith('_001')) {
    return {
      skillId: 'P3-MD-02',
      questionFamilyId: familyId,
      prompt: `${dividend} / ${divisor} = ?`,
      answer: quotient,
      answerType: 'number',
      instructionHint: 'Use a times table fact.',
      solutionText: `${quotient} x ${divisor} = ${dividend}, so ${dividend} / ${divisor} = ${quotient}.`,
      misconceptionTraps: ['division_as_subtraction', 'table_fact_confusion'],
    };
  }

  if (familyId.endsWith('_002')) {
    return {
      skillId: 'P3-MD-02',
      questionFamilyId: familyId,
      prompt: `${dividend} / ${divisor} = ? Think: ? x ${divisor} = ${dividend}`,
      answer: quotient,
      answerType: 'number',
      instructionHint: 'Find the missing factor.',
      solutionText: `${quotient} x ${divisor} = ${dividend}, so ${dividend} / ${divisor} = ${quotient}.`,
      misconceptionTraps: ['division_as_subtraction'],
    };
  }

  // _003: Related facts — ask for one of two division facts
  const otherQuotient = divisor;
  const otherDivisor = quotient;
  const askFirst = pick([true, false]);
  const chosenDivisor = askFirst ? divisor : otherDivisor;
  const chosenQuotient = askFirst ? quotient : otherQuotient;

  return {
    skillId: 'P3-MD-02',
    questionFamilyId: familyId,
    prompt: `${quotient} x ${divisor} = ${dividend}. So ${dividend} / ${chosenDivisor} = ?`,
    answer: chosenQuotient,
    answerType: 'number',
    instructionHint: 'Use the multiplication fact to find the division answer.',
    solutionText: `${dividend} / ${chosenDivisor} = ${chosenQuotient}.`,
    misconceptionTraps: ['table_fact_confusion'],
  };
}

// ---------------------------------------------------------------------------
// P3-MD-03: Division with Remainder
// ---------------------------------------------------------------------------

function generateDivRemainder(familyId) {
  if (familyId.endsWith('_001')) {
    // Small divisor 3-5
    const divisor = pick([3, 4, 5]);
    const quotient = randInt(2, 12);
    const remainder = randInt(1, divisor - 1);
    const dividend = quotient * divisor + remainder;

    return {
      skillId: 'P3-MD-03',
      questionFamilyId: familyId,
      prompt: `${dividend} / ${divisor} = ? remainder ?. What is the remainder?`,
      answer: remainder,
      answerType: 'number',
      instructionHint: 'Divide and find the remainder.',
      solutionText: `${quotient} x ${divisor} = ${quotient * divisor}. ${dividend} - ${quotient * divisor} = ${remainder}. Remainder is ${remainder}.`,
      misconceptionTraps: ['remainder_equals_quotient', 'remainder_larger_than_divisor'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Larger divisor 6-9
    const divisor = pick([6, 7, 8, 9]);
    const quotient = randInt(2, 10);
    const remainder = randInt(1, divisor - 1);
    const dividend = quotient * divisor + remainder;

    return {
      skillId: 'P3-MD-03',
      questionFamilyId: familyId,
      prompt: `${dividend} / ${divisor} = ? remainder ?. What is the remainder?`,
      answer: remainder,
      answerType: 'number',
      instructionHint: 'Divide and find the remainder.',
      solutionText: `${quotient} x ${divisor} = ${quotient * divisor}. ${dividend} - ${quotient * divisor} = ${remainder}. Remainder is ${remainder}.`,
      misconceptionTraps: ['remainder_equals_quotient', 'remainder_larger_than_divisor'],
    };
  }

  // _003: Ask for the quotient (not remainder)
  const divisor = pick([3, 4, 5, 6, 7, 8, 9]);
  const quotient = randInt(2, 12);
  const remainder = randInt(1, divisor - 1);
  const dividend = quotient * divisor + remainder;

  return {
    skillId: 'P3-MD-03',
    questionFamilyId: familyId,
    prompt: `${dividend} / ${divisor} = ? remainder ${remainder}. What is the quotient?`,
    answer: quotient,
    answerType: 'number',
    instructionHint: 'Find the quotient.',
    solutionText: `${quotient} x ${divisor} = ${quotient * divisor}. ${quotient * divisor} + ${remainder} = ${dividend}. Quotient is ${quotient}.`,
    misconceptionTraps: ['remainder_equals_quotient'],
  };
}

// ---------------------------------------------------------------------------
// P3-MD-04: Multiply up to 3-digit by 1-digit
// ---------------------------------------------------------------------------

function generateLongMul(familyId) {
  if (familyId.endsWith('_001')) {
    // 2-digit x 1-digit, no carry
    let a, b;
    for (let t = 0; t < 200; t++) {
      a = randInt(11, 44);
      b = randInt(2, 4);
      const onesProduct = (a % 10) * b;
      const tensProduct = Math.floor(a / 10) * b;
      if (onesProduct <= 9 && tensProduct <= 9) break;
    }
    const ans = a * b;
    return {
      skillId: 'P3-MD-04',
      questionFamilyId: familyId,
      prompt: `${a} x ${b} = ?`,
      answer: ans,
      answerType: 'number',
      instructionHint: 'Use the column method.',
      solutionText: `${a} x ${b} = ${ans}. No carrying needed.`,
      misconceptionTraps: ['multiplies_digit_by_digit'],
    };
  }

  if (familyId.endsWith('_002')) {
    // 2-digit x 1-digit, with carry
    let a, b;
    for (let t = 0; t < 200; t++) {
      a = randInt(13, 99);
      b = randInt(2, 9);
      if ((a % 10) * b >= 10) break;
    }
    const ans = a * b;
    return {
      skillId: 'P3-MD-04',
      questionFamilyId: familyId,
      prompt: `${a} x ${b} = ?`,
      answer: ans,
      answerType: 'number',
      instructionHint: 'Use the column method. Remember to carry.',
      solutionText: `${a} x ${b} = ${ans}.`,
      misconceptionTraps: ['forgets_carry_in_multiplication'],
    };
  }

  // _003: 3-digit x 1-digit
  const a = randInt(100, 399);
  const b = randInt(2, 9);
  const ans = a * b;
  return {
    skillId: 'P3-MD-04',
    questionFamilyId: familyId,
    prompt: `${a} x ${b} = ?`,
    answer: ans,
    answerType: 'number',
    instructionHint: 'Use the column method. Show your working.',
    solutionText: `${a} x ${b} = ${ans}.`,
    misconceptionTraps: ['forgets_carry_in_multiplication', 'multiplies_digit_by_digit'],
  };
}

// ---------------------------------------------------------------------------
// P3-MD-05: Divide up to 3-digit by 1-digit
// ---------------------------------------------------------------------------

function generateLongDiv(familyId) {
  if (familyId.endsWith('_001')) {
    // 2-digit / 1-digit, exact
    const divisor = randInt(2, 9);
    const quotient = randInt(11, 99);
    // Ensure it stays 2-digit dividend
    const safeQuotient = Math.min(quotient, Math.floor(99 / divisor));
    const dividend = safeQuotient * divisor;
    return {
      skillId: 'P3-MD-05',
      questionFamilyId: familyId,
      prompt: `${dividend} / ${divisor} = ?`,
      answer: safeQuotient,
      answerType: 'number',
      instructionHint: 'Use short division.',
      solutionText: `${dividend} / ${divisor} = ${safeQuotient}.`,
      misconceptionTraps: ['forgets_bring_down'],
    };
  }

  if (familyId.endsWith('_002')) {
    // 3-digit / 1-digit, exact, quotient has no zero
    const divisor = randInt(2, 9);
    let quotient;
    for (let t = 0; t < 200; t++) {
      quotient = randInt(11, 150);
      if (quotient * divisor >= 100 && quotient * divisor <= 999 && !String(quotient).includes('0')) break;
    }
    const dividend = quotient * divisor;
    return {
      skillId: 'P3-MD-05',
      questionFamilyId: familyId,
      prompt: `${dividend} / ${divisor} = ?`,
      answer: quotient,
      answerType: 'number',
      instructionHint: 'Use long division. Show your working.',
      solutionText: `${dividend} / ${divisor} = ${quotient}.`,
      misconceptionTraps: ['long_div_place_value_skip', 'forgets_bring_down'],
    };
  }

  // _003: quotient has a zero (e.g. 102, 205, 301)
  const divisor = randInt(2, 9);
  const zeroQuotients = [];
  for (let q = 100; q <= 999; q++) {
    const s = String(q);
    if (s[1] === '0' && q * divisor >= 100 && q * divisor <= 999) {
      zeroQuotients.push(q);
    }
  }
  const quotient = zeroQuotients.length > 0 ? pick(zeroQuotients) : 102;
  const dividend = quotient * divisor;

  return {
    skillId: 'P3-MD-05',
    questionFamilyId: familyId,
    prompt: `${dividend} / ${divisor} = ?`,
    answer: quotient,
    answerType: 'number',
    instructionHint: 'Use long division. Watch for zeros in the quotient.',
    solutionText: `${dividend} / ${divisor} = ${quotient}. The quotient has a 0 in the tens place.`,
    misconceptionTraps: ['long_div_place_value_skip'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P3-MD-01': generateTablesMul,
  'P3-MD-02': generateTablesDiv,
  'P3-MD-03': generateDivRemainder,
  'P3-MD-04': generateLongMul,
  'P3-MD-05': generateLongDiv,
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
