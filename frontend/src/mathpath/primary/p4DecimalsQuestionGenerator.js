import { getSkill } from './p4DecimalsSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p4DecimalsQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

/** Clean floating-point artefacts to at most 3dp */
function cleanNum(n) { return Number(n.toFixed(3)); }

// ---------------------------------------------------------------------------
// Singapore-style names for word problems
// ---------------------------------------------------------------------------
const NAMES = [
  'Wei Ling', 'Jun Hao', 'Siti', 'Ravi', 'Mei Xuan',
  'Aisha', 'Zheng Wei', 'Kumar', 'Li Ting', 'Hafiz',
  'Priya', 'Jia En', 'Darren', 'Nurul', 'Yi Xuan',
];

// ---------------------------------------------------------------------------
// Digit-name helpers
// ---------------------------------------------------------------------------
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const TEENS = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function wholeNumberWord(n) {
  if (n < 10) return ONES[n];
  if (n < 20) return TEENS[n - 10];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const o = n % 10;
    return o === 0 ? TENS[t] : `${TENS[t]}-${ONES[o]}`;
  }
  return String(n);
}

function decimalToWords(numStr) {
  const [wholePart, decPart] = numStr.split('.');
  const w = parseInt(wholePart, 10);
  let words = wholeNumberWord(w);
  if (!decPart) return words;
  words += ' and ';
  const digits = decPart.split('').map((d) => ONES[parseInt(d, 10)]);
  if (decPart.length === 1) {
    words += `${parseInt(decPart, 10)} tenth${parseInt(decPart, 10) !== 1 ? 's' : ''}`;
  } else if (decPart.length === 2) {
    words += `${parseInt(decPart, 10)} hundredth${parseInt(decPart, 10) !== 1 ? 's' : ''}`;
  } else {
    words += `${parseInt(decPart, 10)} thousandth${parseInt(decPart, 10) !== 1 ? 's' : ''}`;
  }
  return words;
}

// ---------------------------------------------------------------------------
// P4-DEC-01: Decimal Place Value
// ---------------------------------------------------------------------------

function generatePlaceValue(familyId) {
  if (familyId.endsWith('_001')) {
    // words-to-decimal
    const whole = randInt(0, 9);
    const dpCount = pick([1, 2, 3]);
    let decDigits;
    if (dpCount === 1) {
      decDigits = String(randInt(1, 9));
    } else if (dpCount === 2) {
      decDigits = String(randInt(1, 99)).padStart(2, '0');
    } else {
      decDigits = String(randInt(1, 999)).padStart(3, '0');
    }
    const numStr = `${whole}.${decDigits}`;
    const numVal = parseFloat(numStr);
    const wordsForm = decimalToWords(numStr);

    return {
      skillId: 'P4-DEC-01',
      questionFamilyId: familyId,
      prompt: `Write "${wordsForm}" as a decimal.`,
      answer: String(numVal),
      answerType: 'text',
      instructionHint: 'Think about the place value of each digit after the decimal point: tenths, hundredths, thousandths.',
      solutionText: `"${wordsForm}" written as a decimal is ${numVal}.`,
      misconceptionTraps: ['misplaces_decimal_point'],
    };
  }

  // _002: value-of-digit
  const whole = randInt(1, 9);
  const d1 = randInt(1, 9);
  const d2 = randInt(0, 9);
  const d3 = randInt(1, 9);
  const numStr = `${whole}.${d1}${d2}${d3}`;
  const numVal = parseFloat(numStr);

  const placeChoice = pick(['tenths', 'hundredths', 'thousandths']);
  let targetDigit, placeValue;
  if (placeChoice === 'tenths') {
    targetDigit = d1;
    placeValue = cleanNum(d1 * 0.1);
  } else if (placeChoice === 'hundredths') {
    targetDigit = d2;
    placeValue = cleanNum(d2 * 0.01);
  } else {
    targetDigit = d3;
    placeValue = cleanNum(d3 * 0.001);
  }

  return {
    skillId: 'P4-DEC-01',
    questionFamilyId: familyId,
    prompt: `In the number ${numVal}, what is the value of the digit ${targetDigit} in the ${placeChoice} place?`,
    answer: placeValue,
    answerType: 'number',
    instructionHint: `The ${placeChoice} place is the ${placeChoice === 'tenths' ? 'first' : placeChoice === 'hundredths' ? 'second' : 'third'} digit after the decimal point.`,
    solutionText: `The digit ${targetDigit} is in the ${placeChoice} place, so its value is ${placeValue}.`,
    misconceptionTraps: ['misplaces_decimal_point'],
  };
}

// ---------------------------------------------------------------------------
// P4-DEC-02: Comparing Decimals
// ---------------------------------------------------------------------------

function makeDecimal(intPart, dpDigits, dpLen) {
  const padded = String(dpDigits).padStart(dpLen, '0');
  return parseFloat(`${intPart}.${padded}`);
}

function generateComparing(familyId) {
  if (familyId.endsWith('_001')) {
    // which-is-greater
    const w = randInt(0, 9);
    // Create two decimals that test the "longer is larger" misconception
    const useTrap = Math.random() < 0.5;
    let a, b;
    if (useTrap) {
      // e.g. 0.7 vs 0.65 — shorter decimal is larger
      const aDP = randInt(5, 9);
      const bDP = randInt(10, aDP * 10 - 1); // b has more digits but is smaller
      a = makeDecimal(w, aDP, 1);
      b = makeDecimal(w, bDP, 2);
    } else {
      const aDP = randInt(1, 99);
      let bDP = randInt(1, 99);
      while (bDP === aDP) bDP = randInt(1, 99);
      a = makeDecimal(w, aDP, 2);
      b = makeDecimal(w, bDP, 2);
    }
    const greater = a > b ? a : b;

    return {
      skillId: 'P4-DEC-02',
      questionFamilyId: familyId,
      prompt: `Which is greater: ${a} or ${b}?`,
      answer: String(greater),
      answerType: 'text',
      instructionHint: 'Compare digit by digit from left to right, starting after the decimal point.',
      solutionText: `Comparing ${a} and ${b}: ${greater} is the greater number.`,
      misconceptionTraps: ['longer_decimal_is_larger'],
    };
  }

  // _002: order-ascending
  const w = randInt(0, 5);
  const count = pick([3, 4]);
  const decimals = new Set();
  while (decimals.size < count) {
    const dp = randInt(1, 999);
    const dpLen = pick([1, 2, 3]);
    const val = makeDecimal(w, dp % (10 ** dpLen), dpLen);
    decimals.add(val);
  }
  const arr = [...decimals];
  const sorted = [...arr].sort((x, y) => x - y);

  return {
    skillId: 'P4-DEC-02',
    questionFamilyId: familyId,
    prompt: `Arrange these decimals in ascending order: ${arr.join(', ')}`,
    answer: sorted.join(', '),
    answerType: 'text',
    instructionHint: 'Write each number with the same number of decimal places, then compare from left to right.',
    solutionText: `In ascending order: ${sorted.join(', ')}.`,
    misconceptionTraps: ['longer_decimal_is_larger'],
  };
}

// ---------------------------------------------------------------------------
// P4-DEC-03: Rounding Decimals
// ---------------------------------------------------------------------------

function generateRounding(familyId) {
  if (familyId.endsWith('_001')) {
    // round to nearest whole number
    const whole = randInt(1, 50);
    const dp = randInt(1, 99);
    const numStr = `${whole}.${String(dp).padStart(2, '0')}`;
    const num = parseFloat(numStr);
    const rounded = Math.round(num);

    return {
      skillId: 'P4-DEC-03',
      questionFamilyId: familyId,
      prompt: `Round ${num} to the nearest whole number.`,
      answer: rounded,
      answerType: 'number',
      instructionHint: 'Look at the tenths digit. If it is 5 or more, round up. Otherwise, round down.',
      solutionText: `${num} rounded to the nearest whole number is ${rounded}.`,
      misconceptionTraps: ['rounds_wrong_direction'],
    };
  }

  if (familyId.endsWith('_002')) {
    // round to 1dp
    const whole = randInt(0, 20);
    const d1 = randInt(0, 9);
    const d2 = randInt(0, 9);
    const numStr = `${whole}.${d1}${d2}`;
    const num = parseFloat(numStr);
    const rounded = cleanNum(Math.round(num * 10) / 10);

    return {
      skillId: 'P4-DEC-03',
      questionFamilyId: familyId,
      prompt: `Round ${num} to 1 decimal place.`,
      answer: rounded,
      answerType: 'number',
      instructionHint: 'Look at the hundredths digit to decide whether to round the tenths digit up or keep it.',
      solutionText: `${num} rounded to 1 decimal place is ${rounded}.`,
      misconceptionTraps: ['rounds_wrong_direction'],
    };
  }

  // _003: round to 2dp
  const whole = randInt(0, 20);
  const d1 = randInt(0, 9);
  const d2 = randInt(0, 9);
  const d3 = randInt(0, 9);
  const numStr = `${whole}.${d1}${d2}${d3}`;
  const num = parseFloat(numStr);
  const rounded = cleanNum(Math.round(num * 100) / 100);

  return {
    skillId: 'P4-DEC-03',
    questionFamilyId: familyId,
    prompt: `Round ${num} to 2 decimal places.`,
    answer: rounded,
    answerType: 'number',
    instructionHint: 'Look at the thousandths digit to decide whether to round the hundredths digit up or keep it.',
    solutionText: `${num} rounded to 2 decimal places is ${rounded}.`,
    misconceptionTraps: ['rounds_wrong_direction'],
  };
}

// ---------------------------------------------------------------------------
// P4-DEC-04: Adding & Subtracting Decimals
// ---------------------------------------------------------------------------

const ITEMS_FOR_WORD_PROBLEMS = [
  'ribbon', 'rope', 'string', 'wire', 'fabric',
  'flour', 'sugar', 'rice', 'water', 'milk',
];

function generateAddSub(familyId) {
  if (familyId.endsWith('_001')) {
    // add-decimals: work in integers (hundredths) to avoid FP issues
    const aHundredths = randInt(101, 9999);
    const bHundredths = randInt(101, 9999);
    const sumHundredths = aHundredths + bHundredths;
    const a = cleanNum(aHundredths / 100);
    const b = cleanNum(bHundredths / 100);
    const answer = cleanNum(sumHundredths / 100);

    return {
      skillId: 'P4-DEC-04',
      questionFamilyId: familyId,
      prompt: `Calculate ${a} + ${b}`,
      answer,
      answerType: 'number',
      instructionHint: 'Line up the decimal points before adding. Fill empty places with 0.',
      solutionText: `${a} + ${b} = ${answer}`,
      misconceptionTraps: ['aligns_rightmost_not_decimal_point', 'misplaces_decimal_point'],
    };
  }

  if (familyId.endsWith('_002')) {
    // subtract-decimals
    let aHundredths = randInt(500, 9999);
    let bHundredths = randInt(101, aHundredths - 1);
    const diffHundredths = aHundredths - bHundredths;
    const a = cleanNum(aHundredths / 100);
    const b = cleanNum(bHundredths / 100);
    const answer = cleanNum(diffHundredths / 100);

    return {
      skillId: 'P4-DEC-04',
      questionFamilyId: familyId,
      prompt: `Calculate ${a} − ${b}`,
      answer,
      answerType: 'number',
      instructionHint: 'Line up the decimal points before subtracting. Fill empty places with 0.',
      solutionText: `${a} − ${b} = ${answer}`,
      misconceptionTraps: ['aligns_rightmost_not_decimal_point', 'misplaces_decimal_point'],
    };
  }

  // _003: word-context
  const name = pick(NAMES);
  const item = pick(ITEMS_FOR_WORD_PROBLEMS);
  const isAdd = Math.random() < 0.5;

  if (isAdd) {
    const aHundredths = randInt(100, 5000);
    const bHundredths = randInt(100, 5000);
    const sumHundredths = aHundredths + bHundredths;
    const a = cleanNum(aHundredths / 100);
    const b = cleanNum(bHundredths / 100);
    const answer = cleanNum(sumHundredths / 100);
    const unit = pick(['kg', 'l', 'm']);

    return {
      skillId: 'P4-DEC-04',
      questionFamilyId: familyId,
      prompt: `${name} has ${a} ${unit} of ${item}. ${pick(NAMES)} gives ${name.split(' ')[0]} another ${b} ${unit}. How much ${item} does ${name.split(' ')[0]} have now?`,
      answer,
      answerType: 'number',
      instructionHint: 'This is an addition problem. Line up the decimal points and add.',
      solutionText: `${a} + ${b} = ${answer} ${unit}`,
      misconceptionTraps: ['aligns_rightmost_not_decimal_point'],
    };
  }

  const aHundredths = randInt(1000, 9999);
  const bHundredths = randInt(100, aHundredths - 100);
  const diffHundredths = aHundredths - bHundredths;
  const a = cleanNum(aHundredths / 100);
  const b = cleanNum(bHundredths / 100);
  const answer = cleanNum(diffHundredths / 100);
  const unit = pick(['kg', 'l', 'm']);

  return {
    skillId: 'P4-DEC-04',
    questionFamilyId: familyId,
    prompt: `${name} had ${a} ${unit} of ${item}. After using ${b} ${unit}, how much ${item} is left?`,
    answer,
    answerType: 'number',
    instructionHint: 'This is a subtraction problem. Line up the decimal points and subtract.',
    solutionText: `${a} − ${b} = ${answer} ${unit}`,
    misconceptionTraps: ['aligns_rightmost_not_decimal_point'],
  };
}

// ---------------------------------------------------------------------------
// P4-DEC-05: Multiply/Divide Decimals by 1-digit
// ---------------------------------------------------------------------------

function generateMulDiv(familyId) {
  if (familyId.endsWith('_001')) {
    // multiply-decimal: work in hundredths
    const decHundredths = randInt(11, 999); // 0.11 to 9.99
    const multiplier = randInt(2, 9);
    const productHundredths = decHundredths * multiplier;
    const dec = cleanNum(decHundredths / 100);
    const answer = cleanNum(productHundredths / 100);

    return {
      skillId: 'P4-DEC-05',
      questionFamilyId: familyId,
      prompt: `Calculate ${dec} × ${multiplier}`,
      answer,
      answerType: 'number',
      instructionHint: 'Multiply as if there is no decimal point, then place the decimal point back in the answer (same number of decimal places).',
      solutionText: `${dec} × ${multiplier} = ${answer}`,
      misconceptionTraps: ['forgets_to_place_decimal_back', 'misplaces_decimal_point'],
    };
  }

  // _002: divide-decimal — ensure clean division
  const divisor = randInt(2, 9);
  // Generate a quotient in hundredths, then compute the dividend
  const quotientHundredths = randInt(11, 999);
  const dividendHundredths = quotientHundredths * divisor;
  const dividend = cleanNum(dividendHundredths / 100);
  const answer = cleanNum(quotientHundredths / 100);

  return {
    skillId: 'P4-DEC-05',
    questionFamilyId: familyId,
    prompt: `Calculate ${dividend} ÷ ${divisor}`,
    answer,
    answerType: 'number',
    instructionHint: 'Divide as you would a whole number, keeping the decimal point in the same position in the answer.',
    solutionText: `${dividend} ÷ ${divisor} = ${answer}`,
    misconceptionTraps: ['forgets_to_place_decimal_back', 'misplaces_decimal_point'],
  };
}

// ---------------------------------------------------------------------------
// P4-DEC-06: Fraction → Decimal
// ---------------------------------------------------------------------------

const FRACTION_DENOM_TABLE = {
  2: [1],
  4: [1, 2, 3],
  5: [1, 2, 3, 4],
  10: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  20: [1, 3, 7, 9, 11, 13, 17, 19],
  25: [1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19, 21, 22, 23, 24],
  50: [1, 3, 7, 9, 11, 13, 17, 19, 21, 23, 27, 29, 31, 33, 37, 39, 41, 43, 47, 49],
  100: [1, 3, 7, 9, 11, 13, 17, 19, 21, 23, 27, 29, 31, 33, 37, 39, 41, 43, 47, 49,
        51, 53, 57, 59, 61, 63, 67, 69, 71, 73, 77, 79, 81, 83, 87, 89, 91, 93, 97, 99],
};

function generateFractionToDecimal(familyId) {
  const denom = pick(Object.keys(FRACTION_DENOM_TABLE).map(Number));
  const possibleNums = FRACTION_DENOM_TABLE[denom];
  const numer = pick(possibleNums);
  const decimalVal = cleanNum(numer / denom);

  if (familyId.endsWith('_001')) {
    // convert-fraction-to-decimal
    return {
      skillId: 'P4-DEC-06',
      questionFamilyId: familyId,
      prompt: `Express ${numer}/${denom} as a decimal.`,
      answer: decimalVal,
      answerType: 'number',
      instructionHint: `Think: what do you multiply ${denom} by to get 10 or 100? Then multiply the numerator by the same amount.`,
      solutionText: `${numer}/${denom} = ${decimalVal}`,
      misconceptionTraps: ['misplaces_decimal_point'],
    };
  }

  // _002: match-fraction-to-decimal (choice-style, but we emit the correct answer as text)
  // Generate 3 distractors
  const distractors = new Set();
  while (distractors.size < 3) {
    const offset = pick([-0.1, 0.1, -0.01, 0.01, -0.05, 0.05, 0.5, -0.5]);
    const distractor = cleanNum(decimalVal + offset);
    if (distractor > 0 && distractor !== decimalVal) {
      distractors.add(distractor);
    }
  }
  const choices = [...distractors, decimalVal].sort(() => Math.random() - 0.5);

  return {
    skillId: 'P4-DEC-06',
    questionFamilyId: familyId,
    prompt: `Which decimal is equal to ${numer}/${denom}?\nChoices: ${choices.join(', ')}`,
    answer: String(decimalVal),
    answerType: 'text',
    instructionHint: `Convert ${numer}/${denom} by dividing the numerator by the denominator, or find an equivalent fraction with denominator 10 or 100.`,
    solutionText: `${numer}/${denom} = ${decimalVal}`,
    misconceptionTraps: ['misplaces_decimal_point'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P4-DEC-01': generatePlaceValue,
  'P4-DEC-02': generateComparing,
  'P4-DEC-03': generateRounding,
  'P4-DEC-04': generateAddSub,
  'P4-DEC-05': generateMulDiv,
  'P4-DEC-06': generateFractionToDecimal,
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
