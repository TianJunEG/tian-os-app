import { getSkill } from './p2WholeNumbersSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p2WholeNumbersQuestionFamilies.js';
import {
  numberLineDiagram,
  placeValueBlocksDiagram,
} from './p1DiagramHelpers.js';

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

function distinctRandInt(min, max, exclude) {
  for (let i = 0; i < 100; i++) {
    const n = randInt(min, max);
    if (n !== exclude) return n;
  }
  return exclude === min ? min + 1 : min;
}

// ---------------------------------------------------------------------------
// Number-to-words helper for P2-WN-05
// ---------------------------------------------------------------------------

const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const TEENS = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function numberToWords(n) {
  if (n === 0) return 'zero';
  const h = Math.floor(n / 100);
  const remainder = n % 100;
  const t = Math.floor(remainder / 10);
  const o = remainder % 10;

  let result = '';
  if (h > 0) {
    result += ONES[h] + ' hundred';
  }
  if (remainder > 0) {
    if (h > 0) result += ' and ';
    if (remainder >= 10 && remainder <= 19) {
      result += TEENS[remainder - 10];
    } else {
      if (t >= 2) {
        result += TENS[t];
        if (o > 0) result += '-' + ONES[o];
      } else {
        result += ONES[o];
      }
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// P2-WN-01: Place Value (hundreds, tens, ones)
// ---------------------------------------------------------------------------

function generatePlaceValue3Digit(familyId) {
  if (familyId.endsWith('_001')) {
    const h = randInt(1, 9);
    const t = randInt(0, 9);
    const o = randInt(0, 9);
    const n = h * 100 + t * 10 + o;
    const places = [
      { label: 'hundreds', value: h },
      { label: 'tens', value: t },
      { label: 'ones', value: o },
    ];
    const asked = pick(places);

    return {
      skillId: 'P2-WN-01',
      questionFamilyId: familyId,
      prompt: `In ${n}, how many ${asked.label} are there?`,
      answer: asked.value,
      answerType: 'number',
      instructionHint: `Write the number of ${asked.label}.`,
      solutionText: `${n} = ${h} hundreds, ${t} tens, ${o} ones. There are ${asked.value} ${asked.label}.`,
      diagramSpec: placeValueBlocksDiagram(t, o, { hundreds: h, title: `${n} in place values` }),
      misconceptionTraps: ['confuses_hto_columns'],
    };
  }

  if (familyId.endsWith('_002')) {
    const h = randInt(1, 9);
    const t = randInt(0, 9);
    const o = randInt(0, 9);
    const n = h * 100 + t * 10 + o;

    return {
      skillId: 'P2-WN-01',
      questionFamilyId: familyId,
      prompt: `What number is ${h} hundreds, ${t} tens, and ${o} ones?`,
      answer: n,
      answerType: 'number',
      instructionHint: 'Write the number.',
      solutionText: `${h} x 100 + ${t} x 10 + ${o} = ${n}.`,
      diagramSpec: placeValueBlocksDiagram(t, o, { hundreds: h, title: `${h} H, ${t} T, ${o} O` }),
      misconceptionTraps: ['confuses_hto_columns', 'zero_placeholder_error'],
    };
  }

  // _003: Value of a digit
  const h = randInt(1, 9);
  const t = randInt(0, 9);
  const o = randInt(0, 9);
  const n = h * 100 + t * 10 + o;
  const positions = [
    { digit: h, place: 'hundreds', value: h * 100 },
    { digit: t, place: 'tens', value: t * 10 },
    { digit: o, place: 'ones', value: o },
  ];
  const asked = pick(positions);

  return {
    skillId: 'P2-WN-01',
    questionFamilyId: familyId,
    prompt: `What is the value of the digit ${asked.digit} in ${n}?`,
    answer: asked.value,
    answerType: 'number',
    instructionHint: 'Write the value of the digit.',
    solutionText: `The digit ${asked.digit} is in the ${asked.place} place, so its value is ${asked.value}.`,
    misconceptionTraps: ['confuses_hto_columns'],
  };
}

// ---------------------------------------------------------------------------
// P2-WN-02: Comparing & Ordering Numbers to 1000
// ---------------------------------------------------------------------------

function generateCompareOrder1000(familyId) {
  if (familyId.endsWith('_001')) {
    let a = randInt(100, 999);
    let b = distinctRandInt(100, 999, a);
    const symbol = a > b ? '>' : '<';
    const options = ['>', '<', '='];

    return {
      skillId: 'P2-WN-02',
      questionFamilyId: familyId,
      prompt: `Compare: ${a} ___ ${b}. Which symbol goes in the blank?`,
      answer: symbol,
      answerType: 'choice',
      options,
      instructionHint: 'Choose >, < or =.',
      solutionText: `${a} ${symbol} ${b}. Compare from the hundreds place: ${Math.floor(a / 100)} vs ${Math.floor(b / 100)}.`,
      diagramSpec: numberLineDiagram({
        start: 0,
        end: 1000,
        step: 100,
        points: [{ value: a, label: String(a) }, { value: b, label: String(b) }],
        title: `Compare ${a} and ${b}`,
      }),
      misconceptionTraps: ['compares_digit_wrong_order', 'confuses_more_less_symbols'],
    };
  }

  if (familyId.endsWith('_002')) {
    const nums = [];
    while (nums.length < 3) {
      const n = randInt(100, 999);
      if (!nums.includes(n)) nums.push(n);
    }
    const ascending = pick([true, false]);
    const sorted = [...nums].sort((x, y) => (ascending ? x - y : y - x));
    const direction = ascending ? 'smallest to largest' : 'largest to smallest';

    return {
      skillId: 'P2-WN-02',
      questionFamilyId: familyId,
      prompt: `Put these numbers in order from ${direction}: ${nums.join(', ')}`,
      answer: sorted.join(', '),
      answerType: 'choice',
      options: shuffle([
        sorted.join(', '),
        [...sorted].reverse().join(', '),
        shuffle([...nums]).join(', '),
      ].filter((v, i, a) => a.indexOf(v) === i)).slice(0, 3),
      instructionHint: `Order from ${direction}.`,
      solutionText: `In order from ${direction}: ${sorted.join(', ')}.`,
      diagramSpec: numberLineDiagram({
        start: 0,
        end: 1000,
        step: 100,
        points: nums.map((n) => ({ value: n, label: String(n) })),
        title: `Order ${nums.join(', ')}`,
      }),
      misconceptionTraps: ['compares_digit_wrong_order'],
    };
  }

  // _003: Greatest / smallest from 3 digits
  const digits = [];
  while (digits.length < 3) {
    const d = randInt(0, 9);
    if (!digits.includes(d)) digits.push(d);
  }
  const wantGreatest = pick([true, false]);
  const sortedDigits = [...digits].sort((a, b) => (wantGreatest ? b - a : a - b));
  if (sortedDigits[0] === 0) {
    const firstNonZero = sortedDigits.findIndex((d) => d > 0);
    [sortedDigits[0], sortedDigits[firstNonZero]] = [sortedDigits[firstNonZero], sortedDigits[0]];
  }
  const answer = Number(sortedDigits.join(''));
  const label = wantGreatest ? 'greatest' : 'smallest';

  return {
    skillId: 'P2-WN-02',
    questionFamilyId: familyId,
    prompt: `Using the digits ${digits.join(', ')}, form the ${label} 3-digit number. (Use each digit once.)`,
    answer,
    answerType: 'number',
    instructionHint: `Write the ${label} 3-digit number.`,
    solutionText: `To make the ${label} number, arrange digits from ${wantGreatest ? 'largest to smallest' : 'smallest to largest'} (put the ${wantGreatest ? 'biggest' : 'smallest non-zero'} digit in the hundreds place): ${answer}.`,
    misconceptionTraps: ['compares_digit_wrong_order', 'confuses_more_less_symbols'],
  };
}

// ---------------------------------------------------------------------------
// P2-WN-03: Odd & Even Numbers (10-99)
// ---------------------------------------------------------------------------

function generateOddEven(familyId) {
  if (familyId.endsWith('_001')) {
    const n = randInt(10, 99);
    const isEven = n % 2 === 0;
    const answer = isEven ? 'even' : 'odd';
    const names = ['Ali', 'Ben', 'Mei', 'Siti', 'Raj', 'Tom', 'Lily', 'Sarah', 'John', 'Mary'];
    const name = pick(names);

    return {
      skillId: 'P2-WN-03',
      questionFamilyId: familyId,
      prompt: `${name} writes the number ${n}. Is ${n} odd or even?`,
      answer,
      answerType: 'choice',
      options: ['odd', 'even'],
      instructionHint: 'Choose odd or even.',
      solutionText: `${n} ends in ${n % 10}. Numbers ending in ${isEven ? '0, 2, 4, 6, 8' : '1, 3, 5, 7, 9'} are ${answer}. So ${n} is ${answer}.`,
      misconceptionTraps: ['confuses_odd_even'],
    };
  }

  if (familyId.endsWith('_002')) {
    const n = randInt(10, 97);
    const wantOdd = pick([true, false]);
    const target = wantOdd ? 'odd' : 'even';
    let next = n + 1;
    if (wantOdd) {
      next = n % 2 === 0 ? n + 1 : n + 2;
    } else {
      next = n % 2 === 0 ? n + 2 : n + 1;
    }

    return {
      skillId: 'P2-WN-03',
      questionFamilyId: familyId,
      prompt: `What is the next ${target} number after ${n}?`,
      answer: next,
      answerType: 'number',
      instructionHint: `Write the next ${target} number.`,
      solutionText: `Starting from ${n}, count up: ${n + 1}, ${n + 2}... The next ${target} number is ${next}.`,
      misconceptionTraps: ['confuses_odd_even'],
    };
  }

  // _003: Count odd or even in a set
  const setSize = randInt(5, 7);
  const nums = [];
  while (nums.length < setSize) {
    const n = randInt(10, 99);
    if (!nums.includes(n)) nums.push(n);
  }
  const wantOdd = pick([true, false]);
  const target = wantOdd ? 'odd' : 'even';
  const count = nums.filter((n) => (wantOdd ? n % 2 !== 0 : n % 2 === 0)).length;

  return {
    skillId: 'P2-WN-03',
    questionFamilyId: familyId,
    prompt: `How many ${target} numbers are in this set? { ${nums.join(', ')} }`,
    answer: count,
    answerType: 'number',
    instructionHint: `Count the ${target} numbers.`,
    solutionText: `Look at the last digit of each number. ${target === 'even' ? 'Even' : 'Odd'} numbers end in ${target === 'even' ? '0, 2, 4, 6, 8' : '1, 3, 5, 7, 9'}. There are ${count} ${target} numbers.`,
    misconceptionTraps: ['confuses_odd_even', 'parity_of_zero'],
  };
}

// ---------------------------------------------------------------------------
// P2-WN-04: Number Patterns (steps of tens/hundreds)
// ---------------------------------------------------------------------------

function generateNumberPatterns(familyId) {
  const STEPS = [10, 20, 25, 50, 100];

  if (familyId.endsWith('_001')) {
    const step = pick(STEPS);
    const start = randInt(50, 900 - step * 5);
    const seq = Array.from({ length: 5 }, (_, i) => start + i * step);
    const next = start + 5 * step;

    return {
      skillId: 'P2-WN-04',
      questionFamilyId: familyId,
      prompt: `What comes next? ${seq.join(', ')}, ?`,
      answer: next,
      answerType: 'number',
      instructionHint: 'Write the next number in the pattern.',
      solutionText: `The pattern increases by ${step} each time. ${seq[4]} + ${step} = ${next}.`,
      diagramSpec: numberLineDiagram({
        start: seq[0],
        end: next,
        step,
        points: [...seq, next].map((n) => ({ value: n, label: String(n) })),
        title: `Pattern: +${step}`,
      }),
      misconceptionTraps: ['pattern_step_error'],
    };
  }

  if (familyId.endsWith('_002')) {
    const step = pick(STEPS);
    const start = randInt(step * 5 + 50, 900);
    const seq = Array.from({ length: 5 }, (_, i) => start - i * step);
    const next = start - 5 * step;

    return {
      skillId: 'P2-WN-04',
      questionFamilyId: familyId,
      prompt: `What comes next? ${seq.join(', ')}, ?`,
      answer: next,
      answerType: 'number',
      instructionHint: 'Write the next number in the pattern.',
      solutionText: `The pattern decreases by ${step} each time. ${seq[4]} - ${step} = ${next}.`,
      diagramSpec: numberLineDiagram({
        start: next,
        end: seq[0],
        step,
        points: [...seq, next].map((n) => ({ value: n, label: String(n) })),
        title: `Pattern: -${step}`,
      }),
      misconceptionTraps: ['pattern_step_error', 'pattern_direction_error'],
    };
  }

  // _003: Find missing term in the middle
  const step = pick(STEPS);
  const increasing = pick([true, false]);
  const start = increasing
    ? randInt(50, 900 - step * 5)
    : randInt(step * 5 + 50, 900);
  const seq = Array.from({ length: 5 }, (_, i) =>
    increasing ? start + i * step : start - i * step
  );
  const missingIdx = randInt(1, 3);
  const missing = seq[missingIdx];
  const display = seq.map((n, i) => (i === missingIdx ? '?' : String(n))).join(', ');

  return {
    skillId: 'P2-WN-04',
    questionFamilyId: familyId,
    prompt: `What is the missing number? ${display}`,
    answer: missing,
    answerType: 'number',
    instructionHint: 'Write the missing number.',
    solutionText: `The pattern ${increasing ? 'increases' : 'decreases'} by ${step}. The missing number is ${missing}.`,
    diagramSpec: numberLineDiagram({
      start: Math.min(...seq),
      end: Math.max(...seq),
      step,
      points: seq.map((n) => ({ value: n, label: String(n) })),
      title: `Pattern: ${increasing ? '+' : '-'}${step}`,
    }),
    misconceptionTraps: ['pattern_step_error'],
  };
}

// ---------------------------------------------------------------------------
// P2-WN-05: Numbers in Words (101-999)
// ---------------------------------------------------------------------------

function generateNumberWords(familyId) {
  if (familyId.endsWith('_001')) {
    // Number to words (MCQ)
    const h = randInt(1, 9);
    const remainder = randInt(1, 99);
    const n = h * 100 + remainder;
    const correctWords = numberToWords(n);

    // Build distractors
    const distractors = new Set();
    // Distractor: swap hundreds digit
    const altH = distinctRandInt(1, 9, h);
    distractors.add(numberToWords(altH * 100 + remainder));
    // Distractor: "and" omission or teen/ty confusion
    const t = Math.floor(remainder / 10);
    const o = remainder % 10;
    if (remainder >= 13 && remainder <= 19) {
      // teen-ty confusion: replace teen with ty equivalent
      distractors.add(numberToWords(h * 100 + (remainder - 10) * 10));
    } else if (t >= 2 && o > 0) {
      // ty-teen confusion: replace ty+ones with teen
      distractors.add(numberToWords(h * 100 + 10 + o));
    }
    // Additional distractor: shift remainder
    const altR = distinctRandInt(1, 99, remainder);
    distractors.add(numberToWords(h * 100 + altR));

    distractors.delete(correctWords);
    const options = shuffle([correctWords, ...Array.from(distractors).slice(0, 2)]);

    return {
      skillId: 'P2-WN-05',
      questionFamilyId: familyId,
      prompt: `How do you write ${n} in words?`,
      answer: correctWords,
      answerType: 'choice',
      options,
      instructionHint: 'Choose the correct word form.',
      solutionText: `${n} = ${h} hundreds and ${remainder}. In words: ${correctWords}.`,
      misconceptionTraps: ['number_words_and_omission', 'number_words_teen_ty_confusion'],
    };
  }

  // _002: Words to number (MCQ)
  const h = randInt(1, 9);
  const remainder = randInt(1, 99);
  const n = h * 100 + remainder;
  const words = numberToWords(n);

  // Build distractors
  const distractors = new Set();
  // Swap hundreds
  const altH = distinctRandInt(1, 9, h);
  distractors.add(altH * 100 + remainder);
  // Teen/ty confusion
  const t = Math.floor(remainder / 10);
  const o = remainder % 10;
  if (remainder >= 13 && remainder <= 19) {
    distractors.add(h * 100 + (remainder - 10) * 10);
  } else if (t >= 2 && o > 0) {
    distractors.add(h * 100 + 10 + o);
  }
  // Additional distractor
  const altR = distinctRandInt(1, 99, remainder);
  distractors.add(h * 100 + altR);

  distractors.delete(n);
  const options = shuffle([n, ...Array.from(distractors).slice(0, 2)]);

  return {
    skillId: 'P2-WN-05',
    questionFamilyId: familyId,
    prompt: `What number is "${words}"?`,
    answer: n,
    answerType: 'choice',
    options,
    instructionHint: 'Choose the correct number.',
    solutionText: `"${words}" = ${h} hundreds and ${remainder} = ${n}.`,
    misconceptionTraps: ['number_words_and_omission', 'number_words_teen_ty_confusion'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P2-WN-01': generatePlaceValue3Digit,
  'P2-WN-02': generateCompareOrder1000,
  'P2-WN-03': generateOddEven,
  'P2-WN-04': generateNumberPatterns,
  'P2-WN-05': generateNumberWords,
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
