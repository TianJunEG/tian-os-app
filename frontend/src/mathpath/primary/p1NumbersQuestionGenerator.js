import { getSkill } from './p1SkillGraph.js';
import { getQuestionFamiliesBySkill } from './p1NumbersQuestionFamilies.js';
import {
  numberLineDiagram,
  pictureCollectionDiagram,
  placeValueBlocksDiagram,
  objectSetDiagram,
  orderedLineDiagram,
  comparisonModelDiagram,
} from './p1DiagramHelpers.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Number words lookup (0-100)
// ---------------------------------------------------------------------------

const WORDS_0_20 = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
];

const WORDS_TENS = {
  30: 'thirty',
  40: 'forty',
  50: 'fifty',
  60: 'sixty',
  70: 'seventy',
  80: 'eighty',
  90: 'ninety',
  100: 'one hundred',
};

function numberWord(n) {
  if (n <= 20) return WORDS_0_20[n];
  if (n % 10 === 0) return WORDS_TENS[n];
  return `${WORDS_TENS[Math.floor(n / 10) * 10]}-${WORDS_0_20[n % 10]}`;
}

// ---------------------------------------------------------------------------
// Domain constants
// ---------------------------------------------------------------------------

const COUNT_OBJECTS = ['apples', 'stars', 'marbles', 'stickers', 'buttons', 'beads', 'cubes', 'flowers'];
const ORDINAL_OBJECTS = ['bear', 'cat', 'dog', 'bird', 'fish', 'frog', 'rabbit', 'duck', 'ant', 'bee'];
const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

// ---------------------------------------------------------------------------
// Helper: generate word-from-numeral distractors
// ---------------------------------------------------------------------------

function wordChoiceDistractors(correctWord, min, max) {
  const pool = [];
  for (let i = 0; i < 30; i++) {
    const n = randInt(min, max);
    const w = numberWord(n);
    if (w !== correctWord && !pool.includes(w)) pool.push(w);
    if (pool.length >= 3) break;
  }
  // Fallback: if we couldn't get 3, pad with nearby words
  let offset = 1;
  while (pool.length < 3) {
    const candidate = numberWord(Math.min(max, min + offset));
    if (candidate !== correctWord && !pool.includes(candidate)) pool.push(candidate);
    offset++;
    if (offset > max - min + 5) break; // safety
  }
  return pool.slice(0, 3);
}

// ---------------------------------------------------------------------------
// P1-NUM-01: Count Objects to 10
// ---------------------------------------------------------------------------

function generateCountTo10(familyId) {
  const obj = pick(COUNT_OBJECTS);
  const count = randInt(1, 10);
  const isArranged = familyId.endsWith('_001');

  return {
    skillId: 'P1-NUM-01',
    questionFamilyId: familyId,
    prompt: isArranged
      ? `Count the ${obj} arranged in a row. How many are there?`
      : `Count the scattered ${obj}. How many are there?`,
    answer: count,
    answerType: 'number',
    instructionHint: 'Count and write the number.',
    solutionText: `There are ${count} ${obj}.`,
    diagramSpec: objectSetDiagram(obj, count, { title: `${count} ${obj}` }),
    misconceptionTraps: ['skip_count_objects'],
  };
}

// ---------------------------------------------------------------------------
// P1-NUM-02: Read/Write Numerals 0-10
// ---------------------------------------------------------------------------

function generateReadWrite0To10(familyId) {
  const isNumeralFromWord = familyId.endsWith('_001');

  if (isNumeralFromWord) {
    const n = randInt(0, 10);
    const word = numberWord(n);
    return {
      skillId: 'P1-NUM-02',
      questionFamilyId: familyId,
      prompt: `What numeral matches the word '${word}'?`,
      answer: n,
      answerType: 'number',
      instructionHint: 'Write the numeral.',
      solutionText: `The word '${word}' matches the numeral ${n}.`,
      misconceptionTraps: ['reverses_digits'],
    };
  }

  // Word from numeral (choice)
  const n = randInt(0, 10);
  const correctWord = numberWord(n);
  const distractors = wordChoiceDistractors(correctWord, 0, 10);
  const options = shuffle([correctWord, ...distractors]);

  return {
    skillId: 'P1-NUM-02',
    questionFamilyId: familyId,
    prompt: `What is the number word for ${n}?`,
    answer: correctWord,
    answerType: 'choice',
    options,
    instructionHint: 'Choose the correct word.',
    solutionText: `The numeral ${n} is written as '${correctWord}'.`,
    misconceptionTraps: ['reverses_digits'],
  };
}

// ---------------------------------------------------------------------------
// P1-NUM-03: Count Objects to 20
// ---------------------------------------------------------------------------

function generateCountTo20(familyId) {
  const obj = pick(COUNT_OBJECTS);
  const count = randInt(11, 20);
  const isArranged = familyId.endsWith('_001');

  return {
    skillId: 'P1-NUM-03',
    questionFamilyId: familyId,
    prompt: isArranged
      ? `Count the ${obj} arranged in rows. How many are there?`
      : `Count the scattered ${obj}. How many are there?`,
    answer: count,
    answerType: 'number',
    instructionHint: 'Count and write the number.',
    solutionText: `There are ${count} ${obj}.`,
    diagramSpec: objectSetDiagram(obj, count, { title: `${count} ${obj}` }),
    misconceptionTraps: ['teens_counting_error'],
  };
}

// ---------------------------------------------------------------------------
// P1-NUM-04: Read/Write Numerals 11-20
// ---------------------------------------------------------------------------

function generateReadWrite11To20(familyId) {
  const isNumeralFromWord = familyId.endsWith('_001');

  if (isNumeralFromWord) {
    const n = randInt(11, 20);
    const word = numberWord(n);
    return {
      skillId: 'P1-NUM-04',
      questionFamilyId: familyId,
      prompt: `What numeral matches the word '${word}'?`,
      answer: n,
      answerType: 'number',
      instructionHint: 'Write the numeral.',
      solutionText: `The word '${word}' matches the numeral ${n}.`,
      misconceptionTraps: ['reverses_digits'],
    };
  }

  const n = randInt(11, 20);
  const correctWord = numberWord(n);
  const distractors = wordChoiceDistractors(correctWord, 11, 20);
  const options = shuffle([correctWord, ...distractors]);

  return {
    skillId: 'P1-NUM-04',
    questionFamilyId: familyId,
    prompt: `What is the number word for ${n}?`,
    answer: correctWord,
    answerType: 'choice',
    options,
    instructionHint: 'Choose the correct word.',
    solutionText: `The numeral ${n} is written as '${correctWord}'.`,
    misconceptionTraps: ['reverses_digits'],
  };
}

// ---------------------------------------------------------------------------
// P1-NUM-05: Count Objects to 40
// ---------------------------------------------------------------------------

function generateCountTo40(familyId) {
  const obj = pick(COUNT_OBJECTS);
  const count = randInt(21, 40);
  const isGrouped = familyId.endsWith('_001');
  const tens = Math.floor(count / 10);
  const ones = count % 10;

  return {
    skillId: 'P1-NUM-05',
    questionFamilyId: familyId,
    prompt: isGrouped
      ? `Count the ${obj} shown in groups of ten. How many are there?`
      : `Count the scattered ${obj}. How many are there?`,
    answer: count,
    answerType: 'number',
    instructionHint: 'Count and write the number.',
    solutionText: isGrouped
      ? `${tens} groups of 10 = ${tens * 10}, plus ${ones} more = ${count} ${obj}.`
      : `There are ${count} ${obj}.`,
    diagramSpec: pictureCollectionDiagram(
      ones > 0
        ? [{ label: `group of 10 ${obj}`, count: tens }, { label: obj, count: ones }]
        : [{ label: `group of 10 ${obj}`, count: tens }],
      { title: `${count} ${obj}` },
    ),
    misconceptionTraps: ['loses_count_past_20'],
  };
}

// ---------------------------------------------------------------------------
// P1-NUM-06: Read/Write Numerals to 40
// ---------------------------------------------------------------------------

function generateReadWrite21To40(familyId) {
  const isNumeralFromWord = familyId.endsWith('_001');

  if (isNumeralFromWord) {
    const n = randInt(21, 40);
    const word = numberWord(n);
    return {
      skillId: 'P1-NUM-06',
      questionFamilyId: familyId,
      prompt: `What numeral matches the word '${word}'?`,
      answer: n,
      answerType: 'number',
      instructionHint: 'Write the numeral.',
      solutionText: `The word '${word}' matches the numeral ${n}.`,
      misconceptionTraps: ['reverses_digits'],
    };
  }

  const n = randInt(21, 40);
  const correctWord = numberWord(n);
  const distractors = wordChoiceDistractors(correctWord, 21, 40);
  const options = shuffle([correctWord, ...distractors]);

  return {
    skillId: 'P1-NUM-06',
    questionFamilyId: familyId,
    prompt: `What is the number word for ${n}?`,
    answer: correctWord,
    answerType: 'choice',
    options,
    instructionHint: 'Choose the correct word.',
    solutionText: `The numeral ${n} is written as '${correctWord}'.`,
    misconceptionTraps: ['reverses_digits'],
  };
}

// ---------------------------------------------------------------------------
// P1-NUM-07: Count Objects to 100
// ---------------------------------------------------------------------------

function generateCountTo100(familyId) {
  const obj = pick(COUNT_OBJECTS);
  const count = randInt(41, 100);
  const isGrouped = familyId.endsWith('_001');
  const tens = Math.floor(count / 10);
  const ones = count % 10;

  return {
    skillId: 'P1-NUM-07',
    questionFamilyId: familyId,
    prompt: isGrouped
      ? `Count the ${obj} shown in groups of ten. How many are there?`
      : `Count the scattered ${obj}. How many are there?`,
    answer: count,
    answerType: 'number',
    instructionHint: 'Count and write the number.',
    solutionText: isGrouped
      ? `${tens} groups of 10 = ${tens * 10}, plus ${ones} more = ${count} ${obj}.`
      : `There are ${count} ${obj}.`,
    diagramSpec: pictureCollectionDiagram(
      ones > 0
        ? [{ label: `group of 10 ${obj}`, count: tens }, { label: obj, count: ones }]
        : [{ label: `group of 10 ${obj}`, count: tens }],
      { title: `${count} ${obj}` },
    ),
    misconceptionTraps: ['loses_count_past_20'],
  };
}

// ---------------------------------------------------------------------------
// P1-NUM-08: Read/Write Numerals to 100
// ---------------------------------------------------------------------------

function generateReadWrite41To100(familyId) {
  const isNumeralFromWord = familyId.endsWith('_001');

  if (isNumeralFromWord) {
    const n = randInt(41, 100);
    const word = numberWord(n);
    return {
      skillId: 'P1-NUM-08',
      questionFamilyId: familyId,
      prompt: `What numeral matches the word '${word}'?`,
      answer: n,
      answerType: 'number',
      instructionHint: 'Write the numeral.',
      solutionText: `The word '${word}' matches the numeral ${n}.`,
      misconceptionTraps: ['reverses_digits'],
    };
  }

  const n = randInt(41, 100);
  const correctWord = numberWord(n);
  const distractors = wordChoiceDistractors(correctWord, 41, 100);
  const options = shuffle([correctWord, ...distractors]);

  return {
    skillId: 'P1-NUM-08',
    questionFamilyId: familyId,
    prompt: `What is the number word for ${n}?`,
    answer: correctWord,
    answerType: 'choice',
    options,
    instructionHint: 'Choose the correct word.',
    solutionText: `The numeral ${n} is written as '${correctWord}'.`,
    misconceptionTraps: ['reverses_digits'],
  };
}

// ---------------------------------------------------------------------------
// P1-NUM-09: Number Bonds to 10
// ---------------------------------------------------------------------------

function generateNumberBonds(familyId) {
  const isMissingAddend = familyId.endsWith('_001');

  if (isMissingAddend) {
    const part = randInt(1, 9);
    const missing = 10 - part;
    return {
      skillId: 'P1-NUM-09',
      questionFamilyId: familyId,
      prompt: `? + ${part} = 10. What is the missing number?`,
      answer: missing,
      answerType: 'number',
      instructionHint: 'Write the missing number.',
      solutionText: `${missing} + ${part} = 10. The missing number is ${missing}.`,
      diagramSpec: objectSetDiagram('counters', 10, { crossedOut: part, title: `${missing} + ${part} = 10` }),
      misconceptionTraps: ['number_bond_recall_error'],
    };
  }

  // Find the pair - choice question
  const correctA = randInt(1, 9);
  const correctB = 10 - correctA;
  const correctPair = `${correctA} and ${correctB}`;

  // Build distractors: pairs that do NOT add to 10
  const distractorPairs = [];
  const attempts = new Set();
  while (distractorPairs.length < 3) {
    const a = randInt(1, 9);
    const b = randInt(1, 9);
    if (a + b === 10) continue;
    const key = `${a} and ${b}`;
    if (key === correctPair || attempts.has(key)) continue;
    attempts.add(key);
    distractorPairs.push(key);
  }
  const options = shuffle([correctPair, ...distractorPairs]);

  return {
    skillId: 'P1-NUM-09',
    questionFamilyId: familyId,
    prompt: 'Which two numbers add to 10?',
    answer: correctPair,
    answerType: 'choice',
    options,
    instructionHint: 'Choose the pair that adds to 10.',
    solutionText: `${correctA} + ${correctB} = 10.`,
    diagramSpec: objectSetDiagram('counters', 10, { crossedOut: correctB, title: `${correctA} + ${correctB} = 10` }),
    misconceptionTraps: ['number_bond_recall_error'],
  };
}

// ---------------------------------------------------------------------------
// P1-NUM-10: Compare/Order Numbers to 20
// ---------------------------------------------------------------------------

function generateCompareOrder20(familyId) {
  const isCompare = familyId.endsWith('_001');

  if (isCompare) {
    let a = randInt(0, 20);
    let b = randInt(0, 20);
    while (b === a) b = randInt(0, 20);
    const symbol = a > b ? '>' : '<';
    const options = ['>', '<', '='];
    return {
      skillId: 'P1-NUM-10',
      questionFamilyId: familyId,
      prompt: `Compare: ${a} ___ ${b}. Which symbol goes in the blank?`,
      answer: symbol,
      answerType: 'choice',
      options,
      instructionHint: 'Choose >, < or =.',
      solutionText: `${a} ${symbol} ${b}. ${a > b ? `${a} is greater than ${b}` : `${a} is less than ${b}`}.`,
      diagramSpec: numberLineDiagram({
        start: 0,
        end: 20,
        step: 1,
        points: [{ value: a, label: String(a) }, { value: b, label: String(b) }],
        title: `Compare ${a} and ${b}`,
      }),
      misconceptionTraps: ['confuses_more_less_symbols'],
    };
  }

  // Order three numbers
  const nums = [];
  while (nums.length < 3) {
    const n = randInt(0, 20);
    if (!nums.includes(n)) nums.push(n);
  }
  const ascending = pick([true, false]);
  const sorted = [...nums].sort((x, y) => (ascending ? x - y : y - x));
  const direction = ascending ? 'smallest to largest' : 'largest to smallest';

  return {
    skillId: 'P1-NUM-10',
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
      end: 20,
      step: 1,
      points: nums.map((n) => ({ value: n, label: String(n) })),
      title: `Order ${nums.join(', ')}`,
    }),
    misconceptionTraps: ['confuses_more_less_symbols'],
  };
}

// ---------------------------------------------------------------------------
// P1-NUM-11: Compare/Order Numbers to 100
// ---------------------------------------------------------------------------

function generateCompareOrder100(familyId) {
  const isCompare = familyId.endsWith('_001');

  if (isCompare) {
    let a = randInt(1, 100);
    let b = randInt(1, 100);
    while (b === a) b = randInt(1, 100);
    const symbol = a > b ? '>' : '<';
    const options = ['>', '<', '='];
    return {
      skillId: 'P1-NUM-11',
      questionFamilyId: familyId,
      prompt: `Compare: ${a} ___ ${b}. Which symbol goes in the blank?`,
      answer: symbol,
      answerType: 'choice',
      options,
      instructionHint: 'Choose >, < or =.',
      solutionText: `${a} ${symbol} ${b}. ${a > b ? `${a} is greater than ${b}` : `${a} is less than ${b}`}.`,
      diagramSpec: numberLineDiagram({
        start: 0,
        end: 100,
        step: 10,
        points: [{ value: a, label: String(a) }, { value: b, label: String(b) }],
        title: `Compare ${a} and ${b}`,
      }),
      misconceptionTraps: ['confuses_more_less_symbols'],
    };
  }

  const nums = [];
  while (nums.length < 3) {
    const n = randInt(1, 100);
    if (!nums.includes(n)) nums.push(n);
  }
  const ascending = pick([true, false]);
  const sorted = [...nums].sort((x, y) => (ascending ? x - y : y - x));
  const direction = ascending ? 'smallest to largest' : 'largest to smallest';

  return {
    skillId: 'P1-NUM-11',
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
      end: 100,
      step: 10,
      points: nums.map((n) => ({ value: n, label: String(n) })),
      title: `Order ${nums.join(', ')}`,
    }),
    misconceptionTraps: ['confuses_more_less_symbols'],
  };
}

// ---------------------------------------------------------------------------
// P1-NUM-12: Number Patterns by 1s
// ---------------------------------------------------------------------------

function generatePatternBy1s(familyId) {
  const isForward = familyId.endsWith('_001');

  if (isForward) {
    const start = randInt(1, 95);
    const seq = [start, start + 1, start + 2, start + 3, start + 4];
    const missingIdx = randInt(1, 3); // avoid first and last
    const missing = seq[missingIdx];
    const display = seq.map((n, i) => (i === missingIdx ? '?' : String(n))).join(', ');

    return {
      skillId: 'P1-NUM-12',
      questionFamilyId: familyId,
      prompt: `What is the missing number? ${display}`,
      answer: missing,
      answerType: 'number',
      instructionHint: 'Write the missing number.',
      solutionText: `The numbers count forward by 1. The missing number is ${missing}.`,
      diagramSpec: numberLineDiagram({
        start: seq[0],
        end: seq[seq.length - 1],
        step: 1,
        points: seq.map((n) => ({ value: n, label: String(n) })),
        title: `Counting forward by 1`,
      }),
      misconceptionTraps: ['pattern_direction_error'],
    };
  }

  // Backward
  const start = randInt(5, 100);
  const seq = [start, start - 1, start - 2, start - 3, start - 4];
  const missingIdx = randInt(1, 3);
  const missing = seq[missingIdx];
  const display = seq.map((n, i) => (i === missingIdx ? '?' : String(n))).join(', ');

  return {
    skillId: 'P1-NUM-12',
    questionFamilyId: familyId,
    prompt: `What is the missing number? ${display}`,
    answer: missing,
    answerType: 'number',
    instructionHint: 'Write the missing number.',
    solutionText: `The numbers count backward by 1. The missing number is ${missing}.`,
    diagramSpec: numberLineDiagram({
      start: seq[seq.length - 1],
      end: seq[0],
      step: 1,
      points: seq.map((n) => ({ value: n, label: String(n) })),
      title: `Counting backward by 1`,
    }),
    misconceptionTraps: ['pattern_direction_error'],
  };
}

// ---------------------------------------------------------------------------
// P1-NUM-13: Number Patterns by 2s, 5s, 10s
// ---------------------------------------------------------------------------

function generateSkipPatterns(familyId) {
  const isForward = familyId.endsWith('_001');
  const skip = pick([2, 5, 10]);

  if (isForward) {
    const maxStart = skip === 10 ? 60 : (skip === 5 ? 80 : 90);
    const start = randInt(0, maxStart);
    const seq = [start, start + skip, start + 2 * skip, start + 3 * skip];
    const next = start + 4 * skip;

    return {
      skillId: 'P1-NUM-13',
      questionFamilyId: familyId,
      prompt: `What comes next? ${seq.join(', ')}, ?`,
      answer: next,
      answerType: 'number',
      instructionHint: 'Write the next number in the pattern.',
      solutionText: `The pattern counts by ${skip}s. ${seq[seq.length - 1]} + ${skip} = ${next}.`,
      diagramSpec: numberLineDiagram({
        start: seq[0],
        end: next,
        step: skip,
        points: [...seq, next].map((n) => ({ value: n, label: String(n) })),
        title: `Counting by ${skip}s`,
      }),
      misconceptionTraps: ['skip_count_reverts_to_ones'],
    };
  }

  // Identify rule
  const maxStart = skip === 10 ? 60 : (skip === 5 ? 80 : 90);
  const start = randInt(0, maxStart);
  const seq = [start, start + skip, start + 2 * skip, start + 3 * skip];
  const options = shuffle(['Counting by 2s', 'Counting by 5s', 'Counting by 10s']);
  const answer = `Counting by ${skip}s`;

  return {
    skillId: 'P1-NUM-13',
    questionFamilyId: familyId,
    prompt: `Look at this pattern: ${seq.join(', ')}. What is the counting rule?`,
    answer,
    answerType: 'choice',
    options,
    instructionHint: 'Choose the counting rule.',
    solutionText: `Each number increases by ${skip}. The rule is counting by ${skip}s.`,
    diagramSpec: numberLineDiagram({
      start: seq[0],
      end: seq[seq.length - 1],
      step: skip,
      points: seq.map((n) => ({ value: n, label: String(n) })),
      title: `Skip counting pattern`,
    }),
    misconceptionTraps: ['skip_count_reverts_to_ones'],
  };
}

// ---------------------------------------------------------------------------
// P1-NUM-14: Place Value tens/ones to 40
// ---------------------------------------------------------------------------

function generatePlaceValue40(familyId) {
  const isDecompose = familyId.endsWith('_001');

  if (isDecompose) {
    const n = randInt(10, 40);
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    const askTens = pick([true, false]);

    return {
      skillId: 'P1-NUM-14',
      questionFamilyId: familyId,
      prompt: askTens
        ? `How many tens does ${n} have?`
        : `How many ones does ${n} have?`,
      answer: askTens ? tens : ones,
      answerType: 'number',
      instructionHint: `Write how many ${askTens ? 'tens' : 'ones'}.`,
      solutionText: `${n} = ${tens} ten${tens !== 1 ? 's' : ''} and ${ones} one${ones !== 1 ? 's' : ''}. It has ${askTens ? tens : ones} ${askTens ? 'tens' : 'ones'}.`,
      diagramSpec: placeValueBlocksDiagram(tens, ones, { title: `${n} in tens and ones` }),
      misconceptionTraps: ['swaps_tens_ones'],
    };
  }

  // Compose
  const tens = randInt(1, 4);
  const ones = randInt(0, 9);
  const n = tens * 10 + ones;

  return {
    skillId: 'P1-NUM-14',
    questionFamilyId: familyId,
    prompt: `${tens} ten${tens !== 1 ? 's' : ''} and ${ones} one${ones !== 1 ? 's' : ''} = ?`,
    answer: n,
    answerType: 'number',
    instructionHint: 'Write the number.',
    solutionText: `${tens} ten${tens !== 1 ? 's' : ''} and ${ones} one${ones !== 1 ? 's' : ''} = ${n}.`,
    diagramSpec: placeValueBlocksDiagram(tens, ones, { title: `${tens} tens and ${ones} ones` }),
    misconceptionTraps: ['swaps_tens_ones'],
  };
}

// ---------------------------------------------------------------------------
// P1-NUM-15: Place Value tens/ones to 100
// ---------------------------------------------------------------------------

function generatePlaceValue100(familyId) {
  const isDecompose = familyId.endsWith('_001');

  if (isDecompose) {
    const n = randInt(41, 100);
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    const askTens = pick([true, false]);

    return {
      skillId: 'P1-NUM-15',
      questionFamilyId: familyId,
      prompt: askTens
        ? `How many tens does ${n} have?`
        : `How many ones does ${n} have?`,
      answer: askTens ? tens : ones,
      answerType: 'number',
      instructionHint: `Write how many ${askTens ? 'tens' : 'ones'}.`,
      solutionText: `${n} = ${tens} ten${tens !== 1 ? 's' : ''} and ${ones} one${ones !== 1 ? 's' : ''}. It has ${askTens ? tens : ones} ${askTens ? 'tens' : 'ones'}.`,
      diagramSpec: placeValueBlocksDiagram(tens, ones, { title: `${n} in tens and ones` }),
      misconceptionTraps: ['swaps_tens_ones'],
    };
  }

  // Compose
  const tens = randInt(5, 10);
  const ones = tens === 10 ? 0 : randInt(0, 9);
  const n = tens * 10 + ones;

  return {
    skillId: 'P1-NUM-15',
    questionFamilyId: familyId,
    prompt: `${tens} ten${tens !== 1 ? 's' : ''} and ${ones} one${ones !== 1 ? 's' : ''} = ?`,
    answer: n,
    answerType: 'number',
    instructionHint: 'Write the number.',
    solutionText: `${tens} ten${tens !== 1 ? 's' : ''} and ${ones} one${ones !== 1 ? 's' : ''} = ${n}.`,
    diagramSpec: placeValueBlocksDiagram(tens, ones, { title: `${tens} tens and ${ones} ones` }),
    misconceptionTraps: ['swaps_tens_ones'],
  };
}

// ---------------------------------------------------------------------------
// P1-NUM-16: Ordinal Numbers 1st-10th
// ---------------------------------------------------------------------------

function generateOrdinals(familyId) {
  const isFromLeft = familyId.endsWith('_001');
  const lineLength = randInt(5, 10);
  const animals = shuffle([...ORDINAL_OBJECTS]).slice(0, lineLength);
  const position = randInt(1, lineLength); // 1-indexed ordinal position

  if (isFromLeft) {
    const targetAnimal = animals[position - 1];
    const distractors = shuffle(animals.filter((a) => a !== targetAnimal)).slice(0, 3);
    const options = shuffle([targetAnimal, ...distractors]);

    return {
      skillId: 'P1-NUM-16',
      questionFamilyId: familyId,
      prompt: `In this row: ${animals.join(', ')}. What animal is ${ORDINALS[position - 1]} from the left?`,
      answer: targetAnimal,
      answerType: 'choice',
      options,
      instructionHint: 'Choose the correct animal.',
      solutionText: `Counting from the left, the ${ORDINALS[position - 1]} animal is the ${targetAnimal}.`,
      diagramSpec: orderedLineDiagram('animals', lineLength, position, 'left', {
        title: `${ORDINALS[position - 1]} from the left`,
      }),
      misconceptionTraps: ['ordinal_cardinal_confusion'],
    };
  }

  // From right
  const rightIdx = lineLength - position; // convert right-based ordinal to array index
  const targetAnimal = animals[rightIdx];
  const distractors = shuffle(animals.filter((a) => a !== targetAnimal)).slice(0, 3);
  const options = shuffle([targetAnimal, ...distractors]);

  return {
    skillId: 'P1-NUM-16',
    questionFamilyId: familyId,
    prompt: `In this row: ${animals.join(', ')}. What animal is ${ORDINALS[position - 1]} from the right?`,
    answer: targetAnimal,
    answerType: 'choice',
    options,
    instructionHint: 'Choose the correct animal.',
    solutionText: `Counting from the right, the ${ORDINALS[position - 1]} animal is the ${targetAnimal}.`,
    diagramSpec: orderedLineDiagram('animals', lineLength, position, 'right', {
      title: `${ORDINALS[position - 1]} from the right`,
    }),
    misconceptionTraps: ['ordinal_cardinal_confusion'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P1-NUM-01': generateCountTo10,
  'P1-NUM-02': generateReadWrite0To10,
  'P1-NUM-03': generateCountTo20,
  'P1-NUM-04': generateReadWrite11To20,
  'P1-NUM-05': generateCountTo40,
  'P1-NUM-06': generateReadWrite21To40,
  'P1-NUM-07': generateCountTo100,
  'P1-NUM-08': generateReadWrite41To100,
  'P1-NUM-09': generateNumberBonds,
  'P1-NUM-10': generateCompareOrder20,
  'P1-NUM-11': generateCompareOrder100,
  'P1-NUM-12': generatePatternBy1s,
  'P1-NUM-13': generateSkipPatterns,
  'P1-NUM-14': generatePlaceValue40,
  'P1-NUM-15': generatePlaceValue100,
  'P1-NUM-16': generateOrdinals,
};

// ---------------------------------------------------------------------------
// Public API (mirrors Money domain pattern)
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
