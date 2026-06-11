import { getSkill } from './p4WholeNumbersSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p4WholeNumbersQuestionFamilies.js';
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
// P4-WN-01: Place Value (ten thousands to ones)
// ---------------------------------------------------------------------------

function generatePlaceValue5Digit(familyId) {
  if (familyId.endsWith('_001')) {
    const tth = randInt(1, 9);
    const th = randInt(0, 9);
    const h = randInt(0, 9);
    const t = randInt(0, 9);
    const o = randInt(0, 9);
    const n = tth * 10000 + th * 1000 + h * 100 + t * 10 + o;
    const places = [
      { label: 'ten thousands', value: tth },
      { label: 'thousands', value: th },
      { label: 'hundreds', value: h },
      { label: 'tens', value: t },
      { label: 'ones', value: o },
    ];
    const asked = pick(places);

    return {
      skillId: 'P4-WN-01',
      questionFamilyId: familyId,
      prompt: `In ${n.toLocaleString()}, how many ${asked.label} are there?`,
      answer: asked.value,
      answerType: 'number',
      instructionHint: `Write the number of ${asked.label}.`,
      solutionText: `${n.toLocaleString()} = ${tth} ten thousands, ${th} thousands, ${h} hundreds, ${t} tens, ${o} ones. There are ${asked.value} ${asked.label}.`,
      diagramSpec: placeValueBlocksDiagram(t, o, { hundreds: h, title: `${n.toLocaleString()} in place values` }),
      misconceptionTraps: ['confuses_place_columns_5digit'],
    };
  }

  if (familyId.endsWith('_002')) {
    const tth = randInt(1, 9);
    const th = randInt(0, 9);
    const h = randInt(0, 9);
    const t = randInt(0, 9);
    const o = randInt(0, 9);
    const n = tth * 10000 + th * 1000 + h * 100 + t * 10 + o;

    return {
      skillId: 'P4-WN-01',
      questionFamilyId: familyId,
      prompt: `What number is ${tth} ten thousands, ${th} thousands, ${h} hundreds, ${t} tens, and ${o} ones?`,
      answer: n,
      answerType: 'number',
      instructionHint: 'Write the number.',
      solutionText: `${tth} \u00d7 10 000 + ${th} \u00d7 1000 + ${h} \u00d7 100 + ${t} \u00d7 10 + ${o} = ${n.toLocaleString()}.`,
      diagramSpec: placeValueBlocksDiagram(t, o, { hundreds: h, title: `${tth} TTh, ${th} Th, ${h} H, ${t} T, ${o} O` }),
      misconceptionTraps: ['confuses_place_columns_5digit', 'zero_placeholder_error_5digit'],
    };
  }

  if (familyId.endsWith('_003')) {
    const tth = randInt(1, 9);
    const th = randInt(0, 9);
    const h = randInt(0, 9);
    const t = randInt(0, 9);
    const o = randInt(0, 9);
    const n = tth * 10000 + th * 1000 + h * 100 + t * 10 + o;
    const positions = [
      { digit: tth, place: 'ten thousands', value: tth * 10000 },
      { digit: th, place: 'thousands', value: th * 1000 },
      { digit: h, place: 'hundreds', value: h * 100 },
      { digit: t, place: 'tens', value: t * 10 },
      { digit: o, place: 'ones', value: o },
    ];
    const asked = pick(positions);

    return {
      skillId: 'P4-WN-01',
      questionFamilyId: familyId,
      prompt: `What is the value of the digit ${asked.digit} in ${n.toLocaleString()}?`,
      answer: asked.value,
      answerType: 'number',
      instructionHint: 'Write the value of the digit.',
      solutionText: `The digit ${asked.digit} is in the ${asked.place} place, so its value is ${asked.value.toLocaleString()}.`,
      misconceptionTraps: ['confuses_place_columns_5digit'],
    };
  }

  // _004: Zero placeholder (5-digit)
  const zeroPatterns = [
    () => { const tth = randInt(1, 9); const o = randInt(1, 9); return { tth, th: 0, h: 0, t: 0, o }; },
    () => { const tth = randInt(1, 9); const h = randInt(1, 9); return { tth, th: 0, h, t: 0, o: 0 }; },
    () => { const tth = randInt(1, 9); const th = randInt(1, 9); const o = randInt(1, 9); return { tth, th, h: 0, t: 0, o }; },
    () => { const tth = randInt(1, 9); const t = randInt(1, 9); return { tth, th: 0, h: 0, t, o: 0 }; },
  ];
  const { tth, th, h, t, o } = pick(zeroPatterns)();
  const n = tth * 10000 + th * 1000 + h * 100 + t * 10 + o;

  return {
    skillId: 'P4-WN-01',
    questionFamilyId: familyId,
    prompt: `What number is ${tth} ten thousands, ${th} thousands, ${h} hundreds, ${t} tens, and ${o} ones?`,
    answer: n,
    answerType: 'number',
    instructionHint: 'Write the number. Remember the zero placeholders!',
    solutionText: `${tth} \u00d7 10 000 + ${th} \u00d7 1000 + ${h} \u00d7 100 + ${t} \u00d7 10 + ${o} = ${n.toLocaleString()}. The zeros hold the empty places.`,
    diagramSpec: placeValueBlocksDiagram(t, o, { hundreds: h, title: `${n.toLocaleString()} \u2014 zero placeholders` }),
    misconceptionTraps: ['zero_placeholder_error_5digit'],
  };
}

// ---------------------------------------------------------------------------
// P4-WN-02: Comparing & Ordering Numbers to 100 000
// ---------------------------------------------------------------------------

function generateCompareOrder100000(familyId) {
  if (familyId.endsWith('_001')) {
    const a = randInt(10000, 99999);
    const b = distinctRandInt(10000, 99999, a);
    const symbol = a > b ? '>' : '<';
    const options = ['>', '<', '='];

    return {
      skillId: 'P4-WN-02',
      questionFamilyId: familyId,
      prompt: `Compare: ${a.toLocaleString()} ___ ${b.toLocaleString()}. Which symbol goes in the blank?`,
      answer: symbol,
      answerType: 'choice',
      options,
      instructionHint: 'Choose >, < or =.',
      solutionText: `${a.toLocaleString()} ${symbol} ${b.toLocaleString()}. Compare from the ten-thousands place: ${Math.floor(a / 10000)} vs ${Math.floor(b / 10000)}.`,
      diagramSpec: numberLineDiagram({
        start: 0,
        end: 100000,
        step: 10000,
        points: [{ value: a, label: a.toLocaleString() }, { value: b, label: b.toLocaleString() }],
        title: `Compare ${a.toLocaleString()} and ${b.toLocaleString()}`,
      }),
      misconceptionTraps: ['compares_digit_by_digit_wrong_order_5digit', 'confuses_more_less_symbols'],
    };
  }

  if (familyId.endsWith('_002')) {
    const nums = [];
    while (nums.length < 3) {
      const n = randInt(10000, 99999);
      if (!nums.includes(n)) nums.push(n);
    }
    const ascending = pick([true, false]);
    const sorted = [...nums].sort((x, y) => (ascending ? x - y : y - x));
    const direction = ascending ? 'smallest to largest' : 'largest to smallest';

    return {
      skillId: 'P4-WN-02',
      questionFamilyId: familyId,
      prompt: `Put these numbers in order from ${direction}: ${nums.map((n) => n.toLocaleString()).join(', ')}`,
      answer: sorted.map((n) => n.toLocaleString()).join(', '),
      answerType: 'choice',
      options: shuffle([
        sorted.map((n) => n.toLocaleString()).join(', '),
        [...sorted].reverse().map((n) => n.toLocaleString()).join(', '),
        shuffle([...nums]).map((n) => n.toLocaleString()).join(', '),
      ].filter((v, i, a) => a.indexOf(v) === i)).slice(0, 3),
      instructionHint: `Order from ${direction}.`,
      solutionText: `In order from ${direction}: ${sorted.map((n) => n.toLocaleString()).join(', ')}.`,
      diagramSpec: numberLineDiagram({
        start: 0,
        end: 100000,
        step: 10000,
        points: nums.map((n) => ({ value: n, label: n.toLocaleString() })),
        title: `Order ${nums.map((n) => n.toLocaleString()).join(', ')}`,
      }),
      misconceptionTraps: ['compares_digit_by_digit_wrong_order_5digit'],
    };
  }

  // _003: Greatest / smallest from 5 digits
  const digits = [];
  while (digits.length < 5) {
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
    skillId: 'P4-WN-02',
    questionFamilyId: familyId,
    prompt: `Using the digits ${digits.join(', ')}, form the ${label} 5-digit number. (Use each digit once.)`,
    answer,
    answerType: 'number',
    instructionHint: `Write the ${label} 5-digit number.`,
    solutionText: `To make the ${label} number, arrange digits from ${wantGreatest ? 'largest to smallest' : 'smallest to largest'} (put the ${wantGreatest ? 'biggest' : 'smallest non-zero'} digit in the ten-thousands place): ${answer.toLocaleString()}.`,
    misconceptionTraps: ['confuses_place_columns_5digit', 'zero_placeholder_error_5digit'],
  };
}

// ---------------------------------------------------------------------------
// P4-WN-03: Number Patterns (larger steps)
// ---------------------------------------------------------------------------

function generateNumberPatternsLarge(familyId) {
  const STEPS = [250, 500, 750, 1000, 1250, 1500, 2000, 2500];

  if (familyId.endsWith('_001')) {
    const step = pick(STEPS);
    const start = randInt(2000, 80000 - step * 5);
    const seq = Array.from({ length: 5 }, (_, i) => start + i * step);
    const next = start + 5 * step;

    return {
      skillId: 'P4-WN-03',
      questionFamilyId: familyId,
      prompt: `What comes next? ${seq.map((n) => n.toLocaleString()).join(', ')}, ?`,
      answer: next,
      answerType: 'number',
      instructionHint: 'Write the next number in the pattern.',
      solutionText: `The pattern increases by ${step.toLocaleString()} each time. ${seq[4].toLocaleString()} + ${step.toLocaleString()} = ${next.toLocaleString()}.`,
      diagramSpec: numberLineDiagram({
        start: seq[0],
        end: next,
        step,
        points: [...seq, next].map((n) => ({ value: n, label: n.toLocaleString() })),
        title: `Pattern: +${step.toLocaleString()}`,
      }),
      misconceptionTraps: ['pattern_step_error_large'],
    };
  }

  if (familyId.endsWith('_002')) {
    const step = pick(STEPS);
    const start = randInt(step * 5 + 2000, 95000);
    const seq = Array.from({ length: 5 }, (_, i) => start - i * step);
    const next = start - 5 * step;

    return {
      skillId: 'P4-WN-03',
      questionFamilyId: familyId,
      prompt: `What comes next? ${seq.map((n) => n.toLocaleString()).join(', ')}, ?`,
      answer: next,
      answerType: 'number',
      instructionHint: 'Write the next number in the pattern.',
      solutionText: `The pattern decreases by ${step.toLocaleString()} each time. ${seq[4].toLocaleString()} \u2212 ${step.toLocaleString()} = ${next.toLocaleString()}.`,
      diagramSpec: numberLineDiagram({
        start: next,
        end: seq[0],
        step,
        points: [...seq, next].map((n) => ({ value: n, label: n.toLocaleString() })),
        title: `Pattern: \u2212${step.toLocaleString()}`,
      }),
      misconceptionTraps: ['pattern_step_error_large', 'pattern_direction_error'],
    };
  }

  // _003: Find missing term in the middle
  const step = pick(STEPS);
  const increasing = pick([true, false]);
  const start = increasing
    ? randInt(2000, 80000 - step * 5)
    : randInt(step * 5 + 2000, 95000);
  const seq = Array.from({ length: 5 }, (_, i) =>
    increasing ? start + i * step : start - i * step
  );
  const missingIdx = randInt(1, 3);
  const missing = seq[missingIdx];
  const display = seq.map((n, i) => (i === missingIdx ? '?' : n.toLocaleString())).join(', ');

  return {
    skillId: 'P4-WN-03',
    questionFamilyId: familyId,
    prompt: `What is the missing number? ${display}`,
    answer: missing,
    answerType: 'number',
    instructionHint: 'Write the missing number.',
    solutionText: `The pattern ${increasing ? 'increases' : 'decreases'} by ${step.toLocaleString()}. The missing number is ${missing.toLocaleString()}.`,
    diagramSpec: numberLineDiagram({
      start: Math.min(...seq),
      end: Math.max(...seq),
      step,
      points: seq.map((n) => ({ value: n, label: n.toLocaleString() })),
      title: `Pattern: ${increasing ? '+' : '\u2212'}${step.toLocaleString()}`,
    }),
    misconceptionTraps: ['pattern_step_error_large'],
  };
}

// ---------------------------------------------------------------------------
// P4-WN-04: Rounding to Nearest 10, 100, or 1000
// ---------------------------------------------------------------------------

function generateRounding(familyId) {
  if (familyId.endsWith('_001')) {
    const n = randInt(101, 9999);
    const rounded = Math.round(n / 10) * 10;
    const onesDigit = n % 10;

    return {
      skillId: 'P4-WN-04',
      questionFamilyId: familyId,
      prompt: `Round ${n.toLocaleString()} to the nearest 10.`,
      answer: rounded,
      answerType: 'number',
      instructionHint: 'Write the rounded number.',
      solutionText: `The ones digit is ${onesDigit}. ${onesDigit >= 5 ? `${onesDigit} \u2265 5, so round up.` : `${onesDigit} < 5, so round down.`} ${n.toLocaleString()} \u2192 ${rounded.toLocaleString()}.`,
      diagramSpec: numberLineDiagram({
        start: Math.floor(n / 10) * 10,
        end: Math.ceil(n / 10) * 10 || Math.floor(n / 10) * 10 + 10,
        step: 1,
        points: [{ value: n, label: String(n) }],
        title: `Round ${n} to the nearest 10`,
      }),
      misconceptionTraps: ['rounding_direction_error', 'rounding_five_goes_down'],
    };
  }

  if (familyId.endsWith('_002')) {
    const n = randInt(101, 9999);
    const rounded = Math.round(n / 100) * 100;
    const tensDigit = Math.floor((n % 100) / 10);

    return {
      skillId: 'P4-WN-04',
      questionFamilyId: familyId,
      prompt: `Round ${n.toLocaleString()} to the nearest 100.`,
      answer: rounded,
      answerType: 'number',
      instructionHint: 'Write the rounded number.',
      solutionText: `Look at the tens digit: ${tensDigit}. ${tensDigit >= 5 ? `${tensDigit} \u2265 5, so round up.` : `${tensDigit} < 5, so round down.`} ${n.toLocaleString()} \u2192 ${rounded.toLocaleString()}.`,
      diagramSpec: numberLineDiagram({
        start: Math.floor(n / 100) * 100,
        end: Math.ceil(n / 100) * 100 || Math.floor(n / 100) * 100 + 100,
        step: 10,
        points: [{ value: n, label: String(n) }],
        title: `Round ${n} to the nearest 100`,
      }),
      misconceptionTraps: ['rounding_direction_error', 'rounding_wrong_place'],
    };
  }

  // _003: Round to nearest 1000
  const n = randInt(1001, 9999);
  const rounded = Math.round(n / 1000) * 1000;
  const hundredsDigit = Math.floor((n % 1000) / 100);

  return {
    skillId: 'P4-WN-04',
    questionFamilyId: familyId,
    prompt: `Round ${n.toLocaleString()} to the nearest 1000.`,
    answer: rounded,
    answerType: 'number',
    instructionHint: 'Write the rounded number.',
    solutionText: `Look at the hundreds digit: ${hundredsDigit}. ${hundredsDigit >= 5 ? `${hundredsDigit} \u2265 5, so round up.` : `${hundredsDigit} < 5, so round down.`} ${n.toLocaleString()} \u2192 ${rounded.toLocaleString()}.`,
    diagramSpec: numberLineDiagram({
      start: Math.floor(n / 1000) * 1000,
      end: Math.ceil(n / 1000) * 1000 || Math.floor(n / 1000) * 1000 + 1000,
      step: 100,
      points: [{ value: n, label: String(n) }],
      title: `Round ${n} to the nearest 1000`,
    }),
    misconceptionTraps: ['rounding_direction_error', 'rounding_wrong_place', 'rounding_five_goes_down'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P4-WN-01': generatePlaceValue5Digit,
  'P4-WN-02': generateCompareOrder100000,
  'P4-WN-03': generateNumberPatternsLarge,
  'P4-WN-04': generateRounding,
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
