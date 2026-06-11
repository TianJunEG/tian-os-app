import { getSkill } from './p4FourOpsSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p4FourOpsQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const NAMES = ['Ali', 'Ben', 'Mei', 'Siti', 'Raj', 'Tom', 'Lily', 'Sarah', 'John', 'Mary'];

// ---------------------------------------------------------------------------
// Word-problem templates (Singapore context)
// ---------------------------------------------------------------------------

const MUL_WORD_TEMPLATES = [
  (name, a, b, ans) => ({
    prompt: `${name} saves $${a} every month. How much does ${name} save in ${b} months?`,
    solutionText: `${a} x ${b} = ${ans}. ${name} saves $${ans} in ${b} months.`,
  }),
  (name, a, b, ans) => ({
    prompt: `A school orders ${b} boxes of pencils. Each box has ${a} pencils. How many pencils are there in all?`,
    solutionText: `${a} x ${b} = ${ans}. There are ${ans} pencils in all.`,
  }),
  (name, a, b, ans) => ({
    prompt: `${name} buys ${b} packets of stickers. Each packet has ${a} stickers. How many stickers does ${name} buy?`,
    solutionText: `${a} x ${b} = ${ans}. ${name} buys ${ans} stickers.`,
  }),
  (name, a, b, ans) => ({
    prompt: `A factory produces ${a} items each day. How many items does it produce in ${b} days?`,
    solutionText: `${a} x ${b} = ${ans}. The factory produces ${ans} items in ${b} days.`,
  }),
  (name, a, b, ans) => ({
    prompt: `There are ${b} rows of chairs. Each row has ${a} chairs. How many chairs are there altogether?`,
    solutionText: `${a} x ${b} = ${ans}. There are ${ans} chairs altogether.`,
  }),
];

const DIV_WORD_TEMPLATES = [
  (name, dividend, divisor, quotient, remainder) => {
    if (remainder === 0) {
      return {
        prompt: `${name} has ${dividend} marbles. ${name} shares them equally among ${divisor} friends. How many marbles does each friend get?`,
        solutionText: `${dividend} / ${divisor} = ${quotient}. Each friend gets ${quotient} marbles.`,
        answer: quotient,
      };
    }
    return {
      prompt: `${name} has ${dividend} stickers. ${name} shares them equally among ${divisor} friends. How many stickers are left over?`,
      solutionText: `${dividend} / ${divisor} = ${quotient} remainder ${remainder}. There are ${remainder} stickers left over.`,
      answer: remainder,
    };
  },
  (name, dividend, divisor, quotient, remainder) => {
    if (remainder === 0) {
      return {
        prompt: `A baker packs ${dividend} muffins into boxes of ${divisor}. How many boxes does the baker fill?`,
        solutionText: `${dividend} / ${divisor} = ${quotient}. The baker fills ${quotient} boxes.`,
        answer: quotient,
      };
    }
    return {
      prompt: `A baker packs ${dividend} muffins into boxes of ${divisor}. How many muffins are left over?`,
      solutionText: `${dividend} / ${divisor} = ${quotient} remainder ${remainder}. There are ${remainder} muffins left over.`,
      answer: remainder,
    };
  },
  (name, dividend, divisor, quotient, remainder) => {
    if (remainder === 0) {
      return {
        prompt: `${name} arranges ${dividend} books equally on ${divisor} shelves. How many books are on each shelf?`,
        solutionText: `${dividend} / ${divisor} = ${quotient}. Each shelf has ${quotient} books.`,
        answer: quotient,
      };
    }
    return {
      prompt: `${name} arranges ${dividend} books equally on ${divisor} shelves. How many books are left over?`,
      solutionText: `${dividend} / ${divisor} = ${quotient} remainder ${remainder}. There are ${remainder} books left over.`,
      answer: remainder,
    };
  },
];

// ---------------------------------------------------------------------------
// P4-FO-01: Multiply up to 4-digit by 1-digit
// ---------------------------------------------------------------------------

function generateMul4x1(familyId) {
  const a = randInt(1000, 9999);
  const b = randInt(2, 9);
  const ans = a * b;
  const name = pick(NAMES);

  if (familyId.endsWith('_001')) {
    return {
      skillId: 'P4-FO-01',
      questionFamilyId: familyId,
      prompt: `${a} x ${b} = ?`,
      answer: ans,
      answerType: 'number',
      instructionHint: 'Use the column method. Remember to carry when needed.',
      solutionText: `${a} x ${b} = ${ans}.`,
      misconceptionTraps: ['carries_wrong_column', 'forgets_carry'],
    };
  }

  // _002: Word context
  const template = pick(MUL_WORD_TEMPLATES);
  const wordQ = template(name, a, b, ans);

  return {
    skillId: 'P4-FO-01',
    questionFamilyId: familyId,
    prompt: wordQ.prompt,
    answer: ans,
    answerType: 'number',
    instructionHint: 'Read carefully. Multiply to find the answer.',
    solutionText: wordQ.solutionText,
    misconceptionTraps: ['carries_wrong_column', 'forgets_carry'],
  };
}

// ---------------------------------------------------------------------------
// P4-FO-02: Multiply up to 3-digit by 2-digit
// ---------------------------------------------------------------------------

function generateMul3x2(familyId) {
  const a = randInt(100, 999);
  const b = randInt(11, 99);
  const ans = a * b;
  const name = pick(NAMES);

  if (familyId.endsWith('_001')) {
    return {
      skillId: 'P4-FO-02',
      questionFamilyId: familyId,
      prompt: `${a} x ${b} = ?`,
      answer: ans,
      answerType: 'number',
      instructionHint: 'Use the column method with two partial products. Remember the placeholder zero on the second row.',
      solutionText: `${a} x ${b} = ${ans}. Partial products: ${a} x ${b % 10} = ${a * (b % 10)}, ${a} x ${Math.floor(b / 10) * 10} = ${a * Math.floor(b / 10) * 10}.`,
      misconceptionTraps: ['wrong_partial_product', 'forgets_carry', 'carries_wrong_column'],
    };
  }

  // _002: Word context
  const template = pick(MUL_WORD_TEMPLATES);
  const wordQ = template(name, a, b, ans);

  return {
    skillId: 'P4-FO-02',
    questionFamilyId: familyId,
    prompt: wordQ.prompt,
    answer: ans,
    answerType: 'number',
    instructionHint: 'Read carefully. Use the column method with partial products.',
    solutionText: wordQ.solutionText,
    misconceptionTraps: ['wrong_partial_product', 'forgets_carry'],
  };
}

// ---------------------------------------------------------------------------
// P4-FO-03: Divide up to 4-digit by 1-digit
// ---------------------------------------------------------------------------

function generateDiv4x1(familyId) {
  const name = pick(NAMES);

  if (familyId.endsWith('_001')) {
    // Exact division
    const divisor = randInt(2, 9);
    // Rejection sampling: quotient in [111, 1500], dividend = quotient * divisor must be <= 9999
    let quotient;
    for (let t = 0; t < 200; t++) {
      quotient = randInt(111, 1500);
      if (quotient * divisor <= 9999) break;
    }
    const dividend = quotient * divisor;

    return {
      skillId: 'P4-FO-03',
      questionFamilyId: familyId,
      prompt: `${dividend} / ${divisor} = ?`,
      answer: quotient,
      answerType: 'number',
      instructionHint: 'Use long division. Show your working.',
      solutionText: `${dividend} / ${divisor} = ${quotient}. Check: ${quotient} x ${divisor} = ${dividend}.`,
      misconceptionTraps: ['wrong_remainder'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Division with remainder
    const divisor = randInt(2, 9);
    let quotient;
    let remainder;
    let dividend;
    for (let t = 0; t < 200; t++) {
      quotient = randInt(111, 1500);
      remainder = randInt(1, divisor - 1);
      dividend = quotient * divisor + remainder;
      if (dividend <= 9999) break;
    }

    return {
      skillId: 'P4-FO-03',
      questionFamilyId: familyId,
      prompt: `${dividend} / ${divisor} = ? remainder ?. What is the remainder?`,
      answer: remainder,
      answerType: 'number',
      instructionHint: 'Use long division. The remainder is what is left over.',
      solutionText: `${dividend} / ${divisor} = ${quotient} remainder ${remainder}. Check: ${quotient} x ${divisor} + ${remainder} = ${dividend}.`,
      misconceptionTraps: ['wrong_remainder', 'confuses_quotient_and_remainder'],
    };
  }

  // _003: Word context (division)
  const divisor = randInt(2, 9);
  const useRemainder = pick([true, false]);
  let quotient, remainder, dividend;

  if (useRemainder) {
    for (let t = 0; t < 200; t++) {
      quotient = randInt(111, 1500);
      remainder = randInt(1, divisor - 1);
      dividend = quotient * divisor + remainder;
      if (dividend <= 9999) break;
    }
  } else {
    for (let t = 0; t < 200; t++) {
      quotient = randInt(111, 1500);
      remainder = 0;
      dividend = quotient * divisor;
      if (dividend <= 9999) break;
    }
  }

  const template = pick(DIV_WORD_TEMPLATES);
  const wordQ = template(name, dividend, divisor, quotient, remainder);

  return {
    skillId: 'P4-FO-03',
    questionFamilyId: familyId,
    prompt: wordQ.prompt,
    answer: wordQ.answer,
    answerType: 'number',
    instructionHint: 'Read carefully. Use long division to find the answer.',
    solutionText: wordQ.solutionText,
    misconceptionTraps: ['wrong_remainder', 'confuses_quotient_and_remainder'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P4-FO-01': generateMul4x1,
  'P4-FO-02': generateMul3x2,
  'P4-FO-03': generateDiv4x1,
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
