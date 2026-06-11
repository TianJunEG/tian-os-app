import { getSkill } from './p4DecimalsSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p4DecimalsQuestionFamilies.js';

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function roundTo(value, dp) {
  const factor = Math.pow(10, dp);
  return Math.round(value * factor) / factor;
}

function toFixed(value, dp) {
  return Number(value).toFixed(dp);
}

// ---------------------------------------------------------------------------
// P4-DEC-01: Decimal Place Value
// ---------------------------------------------------------------------------

function generateDecimalPlaceValue(familyId) {
  if (familyId.endsWith('_001')) {
    const ones = randInt(0, 9);
    const tenths = randInt(0, 9);
    const hundredths = randInt(0, 9);
    const thousandths = randInt(0, 9);
    const n = ones + tenths / 10 + hundredths / 100 + thousandths / 1000;
    const display = toFixed(n, 3);

    const places = [
      { label: 'tenths', value: tenths },
      { label: 'hundredths', value: hundredths },
      { label: 'thousandths', value: thousandths },
    ];
    const asked = pick(places);

    return {
      skillId: 'P4-DEC-01',
      questionFamilyId: familyId,
      prompt: `In ${display}, how many ${asked.label} are there?`,
      answer: asked.value,
      answerType: 'number',
      instructionHint: `Write the number of ${asked.label}.`,
      solutionText: `${display} = ${ones} ones, ${tenths} tenths, ${hundredths} hundredths, ${thousandths} thousandths. There are ${asked.value} ${asked.label}.`,
      misconceptionTraps: ['confuses_decimal_columns'],
    };
  }

  if (familyId.endsWith('_002')) {
    const ones = randInt(0, 9);
    const tenths = randInt(0, 9);
    const hundredths = randInt(0, 9);
    const thousandths = randInt(0, 9);
    const n = ones + tenths / 10 + hundredths / 100 + thousandths / 1000;
    const answer = roundTo(n, 3);

    return {
      skillId: 'P4-DEC-01',
      questionFamilyId: familyId,
      prompt: `What decimal is ${ones} ones, ${tenths} tenths, ${hundredths} hundredths, and ${thousandths} thousandths?`,
      answer,
      answerType: 'number',
      instructionHint: 'Write the decimal number.',
      solutionText: `${ones} + ${tenths}/10 + ${hundredths}/100 + ${thousandths}/1000 = ${toFixed(answer, 3)}.`,
      misconceptionTraps: ['confuses_decimal_columns', 'ignores_decimal_point'],
    };
  }

  // _003: Value of a digit
  const ones = randInt(1, 9);
  const tenths = randInt(1, 9);
  const hundredths = randInt(1, 9);
  const thousandths = randInt(1, 9);
  const n = ones + tenths / 10 + hundredths / 100 + thousandths / 1000;
  const display = toFixed(n, 3);

  const positions = [
    { digit: ones, place: 'ones', value: ones },
    { digit: tenths, place: 'tenths', value: roundTo(tenths / 10, 1) },
    { digit: hundredths, place: 'hundredths', value: roundTo(hundredths / 100, 2) },
    { digit: thousandths, place: 'thousandths', value: roundTo(thousandths / 1000, 3) },
  ];
  const asked = pick(positions);

  return {
    skillId: 'P4-DEC-01',
    questionFamilyId: familyId,
    prompt: `What is the value of the digit ${asked.digit} in ${display}?`,
    answer: asked.value,
    answerType: 'number',
    instructionHint: 'Write the value of the digit.',
    solutionText: `The digit ${asked.digit} is in the ${asked.place} place, so its value is ${asked.value}.`,
    misconceptionTraps: ['confuses_decimal_columns'],
  };
}

// ---------------------------------------------------------------------------
// P4-DEC-02: Comparing Decimals
// ---------------------------------------------------------------------------

function generateComparingDecimals(familyId) {
  if (familyId.endsWith('_001')) {
    const dp = pick([1, 2, 3]);
    const aVal = randInt(1, 999) / Math.pow(10, dp);
    let bVal = randInt(1, 999) / Math.pow(10, dp);
    while (bVal === aVal) {
      bVal = randInt(1, 999) / Math.pow(10, dp);
    }
    const a = roundTo(aVal, dp);
    const b = roundTo(bVal, dp);
    const symbol = a > b ? '>' : '<';
    const options = ['>', '<', '='];

    return {
      skillId: 'P4-DEC-02',
      questionFamilyId: familyId,
      prompt: `Compare: ${toFixed(a, dp)} ___ ${toFixed(b, dp)}. Which symbol goes in the blank?`,
      answer: symbol,
      answerType: 'choice',
      options,
      instructionHint: 'Choose >, < or =.',
      solutionText: `${toFixed(a, dp)} ${symbol} ${toFixed(b, dp)}. Compare place by place from the left.`,
      misconceptionTraps: ['more_digits_means_larger', 'ignores_decimal_point'],
    };
  }

  if (familyId.endsWith('_002')) {
    const nums = new Set();
    while (nums.size < 3) {
      const dp = pick([1, 2]);
      nums.add(roundTo(randInt(1, 999) / 100, dp));
    }
    const arr = [...nums];
    const ascending = pick([true, false]);
    const sorted = [...arr].sort((x, y) => (ascending ? x - y : y - x));
    const direction = ascending ? 'smallest to largest' : 'largest to smallest';

    return {
      skillId: 'P4-DEC-02',
      questionFamilyId: familyId,
      prompt: `Put these decimals in order from ${direction}: ${arr.join(', ')}`,
      answer: sorted.join(', '),
      answerType: 'choice',
      options: shuffle([
        sorted.join(', '),
        [...sorted].reverse().join(', '),
        shuffle([...arr]).join(', '),
      ].filter((v, i, a) => a.indexOf(v) === i)).slice(0, 3),
      instructionHint: `Order from ${direction}.`,
      solutionText: `In order from ${direction}: ${sorted.join(', ')}.`,
      misconceptionTraps: ['more_digits_means_larger'],
    };
  }

  // _003: Decimal on a number line
  const whole = randInt(0, 8);
  const tenthsDigit = randInt(1, 9);
  const decimal = roundTo(whole + tenthsDigit / 10, 1);
  const ordinal = tenthsDigit === 1 ? 'st' : tenthsDigit === 2 ? 'nd' : tenthsDigit === 3 ? 'rd' : 'th';

  return {
    skillId: 'P4-DEC-02',
    questionFamilyId: familyId,
    prompt: `A number line goes from ${whole} to ${whole + 1}. It is divided into 10 equal parts. What decimal is at the ${tenthsDigit}${ordinal} mark?`,
    answer: decimal,
    answerType: 'number',
    instructionHint: 'Write the decimal.',
    solutionText: `Each mark is 0.1. The ${tenthsDigit}${ordinal} mark from ${whole} is ${decimal}.`,
    misconceptionTraps: ['confuses_decimal_columns', 'ignores_decimal_point'],
  };
}

// ---------------------------------------------------------------------------
// P4-DEC-03: Rounding Decimals
// ---------------------------------------------------------------------------

function generateRoundingDecimals(familyId) {
  if (familyId.endsWith('_001')) {
    const n = roundTo(randInt(10, 9990) / 100, 2);
    const answer = Math.round(n);

    return {
      skillId: 'P4-DEC-03',
      questionFamilyId: familyId,
      prompt: `Round ${toFixed(n, 2)} to the nearest whole number.`,
      answer,
      answerType: 'number',
      instructionHint: 'Write the rounded whole number.',
      solutionText: `Look at the tenths digit of ${toFixed(n, 2)}. If it is 5 or more, round up; otherwise round down. Answer: ${answer}.`,
      misconceptionTraps: ['rounds_wrong_direction'],
    };
  }

  if (familyId.endsWith('_002')) {
    const n = roundTo(randInt(100, 9999) / 1000, 3);
    const answer = roundTo(n, 1);

    return {
      skillId: 'P4-DEC-03',
      questionFamilyId: familyId,
      prompt: `Round ${toFixed(n, 3)} to 1 decimal place.`,
      answer,
      answerType: 'number',
      instructionHint: 'Write the number rounded to 1 d.p.',
      solutionText: `Look at the hundredths digit of ${toFixed(n, 3)}. If it is 5 or more, round the tenths digit up. Answer: ${toFixed(answer, 1)}.`,
      misconceptionTraps: ['rounds_wrong_direction', 'confuses_decimal_columns'],
    };
  }

  // _003: Round to 2 dp
  const n = roundTo(randInt(1000, 99999) / 10000, 4);
  const answer = roundTo(n, 2);

  return {
    skillId: 'P4-DEC-03',
    questionFamilyId: familyId,
    prompt: `Round ${toFixed(n, 4)} to 2 decimal places.`,
    answer,
    answerType: 'number',
    instructionHint: 'Write the number rounded to 2 d.p.',
    solutionText: `Look at the thousandths digit of ${toFixed(n, 4)}. If it is 5 or more, round the hundredths digit up. Answer: ${toFixed(answer, 2)}.`,
    misconceptionTraps: ['rounds_wrong_direction', 'confuses_decimal_columns'],
  };
}

// ---------------------------------------------------------------------------
// P4-DEC-04: Adding & Subtracting Decimals
// ---------------------------------------------------------------------------

function generateAddSubDecimals(familyId) {
  if (familyId.endsWith('_001')) {
    const dp = pick([1, 2]);
    const a = roundTo(randInt(10, 999) / Math.pow(10, dp), dp);
    const b = roundTo(randInt(10, 999) / Math.pow(10, dp), dp);
    const answer = roundTo(a + b, dp);

    return {
      skillId: 'P4-DEC-04',
      questionFamilyId: familyId,
      prompt: `${toFixed(a, dp)} + ${toFixed(b, dp)} = ?`,
      answer,
      answerType: 'number',
      instructionHint: 'Add the two decimals.',
      solutionText: `Line up the decimal points: ${toFixed(a, dp)} + ${toFixed(b, dp)} = ${toFixed(answer, dp)}.`,
      misconceptionTraps: ['misaligns_decimal_points'],
    };
  }

  if (familyId.endsWith('_002')) {
    const dp = pick([1, 2]);
    let a = roundTo(randInt(10, 999) / Math.pow(10, dp), dp);
    let b = roundTo(randInt(10, 999) / Math.pow(10, dp), dp);
    if (b > a) { const tmp = a; a = b; b = tmp; }
    const answer = roundTo(a - b, dp);

    return {
      skillId: 'P4-DEC-04',
      questionFamilyId: familyId,
      prompt: `${toFixed(a, dp)} − ${toFixed(b, dp)} = ?`,
      answer,
      answerType: 'number',
      instructionHint: 'Subtract the decimals.',
      solutionText: `Line up the decimal points: ${toFixed(a, dp)} − ${toFixed(b, dp)} = ${toFixed(answer, dp)}.`,
      misconceptionTraps: ['misaligns_decimal_points'],
    };
  }

  // _003: Add/subtract with different dp
  const isAdd = pick([true, false]);
  const a = roundTo(randInt(10, 99) / 10, 1);
  const b = roundTo(randInt(10, 99) / 100, 2);
  let answer;
  let prompt;

  if (isAdd) {
    answer = roundTo(a + b, 2);
    prompt = `${toFixed(a, 1)} + ${toFixed(b, 2)} = ?`;
  } else {
    const big = Math.max(a, b);
    const small = Math.min(a, b);
    answer = roundTo(big - small, 2);
    prompt = `${toFixed(big, 2)} − ${toFixed(small, 2)} = ?`;
  }

  return {
    skillId: 'P4-DEC-04',
    questionFamilyId: familyId,
    prompt,
    answer,
    answerType: 'number',
    instructionHint: isAdd ? 'Add the decimals.' : 'Subtract the decimals.',
    solutionText: `Align the decimal points (pad with zeros if needed). Answer: ${toFixed(answer, 2)}.`,
    misconceptionTraps: ['misaligns_decimal_points', 'ignores_decimal_point'],
  };
}

// ---------------------------------------------------------------------------
// P4-DEC-05: Multiply/Divide Decimals by 1-digit
// ---------------------------------------------------------------------------

function generateMulDivDecimals(familyId) {
  if (familyId.endsWith('_001')) {
    const dp = pick([1, 2]);
    const decimal = roundTo(randInt(11, 99) / Math.pow(10, dp), dp);
    const multiplier = randInt(2, 9);
    const answer = roundTo(decimal * multiplier, dp);

    return {
      skillId: 'P4-DEC-05',
      questionFamilyId: familyId,
      prompt: `${toFixed(decimal, dp)} × ${multiplier} = ?`,
      answer,
      answerType: 'number',
      instructionHint: 'Multiply the decimal by the whole number.',
      solutionText: `Multiply ignoring the decimal point, then place it back. ${toFixed(decimal, dp)} × ${multiplier} = ${toFixed(answer, dp)}.`,
      misconceptionTraps: ['decimal_point_wrong_after_multiply'],
    };
  }

  if (familyId.endsWith('_002')) {
    const dp = pick([1, 2]);
    const divisor = randInt(2, 9);
    const answerRaw = randInt(11, 99);
    const answer = roundTo(answerRaw / Math.pow(10, dp), dp);
    const dividend = roundTo(answer * divisor, dp);

    return {
      skillId: 'P4-DEC-05',
      questionFamilyId: familyId,
      prompt: `${toFixed(dividend, dp)} ÷ ${divisor} = ?`,
      answer,
      answerType: 'number',
      instructionHint: 'Divide the decimal by the whole number.',
      solutionText: `${toFixed(dividend, dp)} ÷ ${divisor} = ${toFixed(answer, dp)}. Divide as whole numbers, then place the decimal point.`,
      misconceptionTraps: ['decimal_point_wrong_after_multiply', 'ignores_decimal_point'],
    };
  }

  // _003: Mixed multiply/divide
  const isMul = pick([true, false]);
  const dp = pick([1, 2]);

  if (isMul) {
    const decimal = roundTo(randInt(11, 99) / Math.pow(10, dp), dp);
    const multiplier = randInt(2, 9);
    const answer = roundTo(decimal * multiplier, dp);

    return {
      skillId: 'P4-DEC-05',
      questionFamilyId: familyId,
      prompt: `${toFixed(decimal, dp)} × ${multiplier} = ?`,
      answer,
      answerType: 'number',
      instructionHint: 'Multiply the decimal by the whole number.',
      solutionText: `${toFixed(decimal, dp)} × ${multiplier} = ${toFixed(answer, dp)}.`,
      misconceptionTraps: ['decimal_point_wrong_after_multiply'],
    };
  }

  const divisor = randInt(2, 9);
  const answerRaw = randInt(11, 99);
  const answer = roundTo(answerRaw / Math.pow(10, dp), dp);
  const dividend = roundTo(answer * divisor, dp);

  return {
    skillId: 'P4-DEC-05',
    questionFamilyId: familyId,
    prompt: `${toFixed(dividend, dp)} ÷ ${divisor} = ?`,
    answer,
    answerType: 'number',
    instructionHint: 'Divide the decimal by the whole number.',
    solutionText: `${toFixed(dividend, dp)} ÷ ${divisor} = ${toFixed(answer, dp)}.`,
    misconceptionTraps: ['decimal_point_wrong_after_multiply'],
  };
}

// ---------------------------------------------------------------------------
// P4-DEC-06: Fraction to Decimal Conversion
// ---------------------------------------------------------------------------

function generateFracToDecimal(familyId) {
  if (familyId.endsWith('_001')) {
    const numerator = randInt(1, 9);
    const answer = roundTo(numerator / 10, 1);

    return {
      skillId: 'P4-DEC-06',
      questionFamilyId: familyId,
      prompt: `Convert ${numerator}/10 to a decimal.`,
      answer,
      answerType: 'number',
      instructionHint: 'Write the decimal.',
      solutionText: `${numerator}/10 = ${toFixed(answer, 1)}. Tenths go in the first decimal place.`,
      misconceptionTraps: ['fraction_denominator_conversion_error'],
    };
  }

  if (familyId.endsWith('_002')) {
    const numerator = randInt(1, 99);
    const answer = roundTo(numerator / 100, 2);

    return {
      skillId: 'P4-DEC-06',
      questionFamilyId: familyId,
      prompt: `Convert ${numerator}/100 to a decimal.`,
      answer,
      answerType: 'number',
      instructionHint: 'Write the decimal.',
      solutionText: `${numerator}/100 = ${toFixed(answer, 2)}. Hundredths go in the second decimal place.`,
      misconceptionTraps: ['fraction_denominator_conversion_error', 'confuses_decimal_columns'],
    };
  }

  // _003: Equivalent denominator (factor of 10 or 100)
  const conversions = [
    { denom: 2, factor: 50, targetDenom: 100 },
    { denom: 4, factor: 25, targetDenom: 100 },
    { denom: 5, factor: 2, targetDenom: 10 },
    { denom: 5, factor: 20, targetDenom: 100 },
    { denom: 20, factor: 5, targetDenom: 100 },
    { denom: 25, factor: 4, targetDenom: 100 },
    { denom: 50, factor: 2, targetDenom: 100 },
  ];
  const conv = pick(conversions);
  const maxNumerator = conv.denom - 1;
  const numerator = randInt(1, Math.max(1, maxNumerator));
  const equivNumerator = numerator * conv.factor;
  const answer = roundTo(equivNumerator / conv.targetDenom, conv.targetDenom === 10 ? 1 : 2);

  return {
    skillId: 'P4-DEC-06',
    questionFamilyId: familyId,
    prompt: `Convert ${numerator}/${conv.denom} to a decimal.`,
    answer,
    answerType: 'number',
    instructionHint: `Hint: find an equivalent fraction with denominator ${conv.targetDenom}.`,
    solutionText: `${numerator}/${conv.denom} = ${equivNumerator}/${conv.targetDenom} = ${answer}. Multiply numerator and denominator by ${conv.factor}.`,
    misconceptionTraps: ['fraction_denominator_conversion_error', 'confuses_decimal_columns'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P4-DEC-01': generateDecimalPlaceValue,
  'P4-DEC-02': generateComparingDecimals,
  'P4-DEC-03': generateRoundingDecimals,
  'P4-DEC-04': generateAddSubDecimals,
  'P4-DEC-05': generateMulDivDecimals,
  'P4-DEC-06': generateFracToDecimal,
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
