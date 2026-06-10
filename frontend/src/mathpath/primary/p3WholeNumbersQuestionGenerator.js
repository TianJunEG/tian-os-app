import { getSkill } from './p3WholeNumbersSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p3WholeNumbersQuestionFamilies.js';
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
// P3-WN-01: Place Value (thousands, hundreds, tens, ones)
// ---------------------------------------------------------------------------

function generatePlaceValue4Digit(familyId) {
  if (familyId.endsWith('_001')) {
    const th = randInt(1, 9);
    const h = randInt(0, 9);
    const t = randInt(0, 9);
    const o = randInt(0, 9);
    const n = th * 1000 + h * 100 + t * 10 + o;
    const places = [
      { label: 'thousands', value: th },
      { label: 'hundreds', value: h },
      { label: 'tens', value: t },
      { label: 'ones', value: o },
    ];
    const asked = pick(places);

    return {
      skillId: 'P3-WN-01',
      questionFamilyId: familyId,
      prompt: `In ${n}, how many ${asked.label} are there?`,
      answer: asked.value,
      answerType: 'number',
      instructionHint: `Write the number of ${asked.label}.`,
      solutionText: `${n} = ${th} thousands, ${h} hundreds, ${t} tens, ${o} ones. There are ${asked.value} ${asked.label}.`,
      diagramSpec: placeValueBlocksDiagram(t, o, { hundreds: h, title: `${n} in place values` }),
      misconceptionTraps: ['confuses_place_columns'],
    };
  }

  if (familyId.endsWith('_002')) {
    const th = randInt(1, 9);
    const h = randInt(0, 9);
    const t = randInt(0, 9);
    const o = randInt(0, 9);
    const n = th * 1000 + h * 100 + t * 10 + o;

    return {
      skillId: 'P3-WN-01',
      questionFamilyId: familyId,
      prompt: `What number is ${th} thousands, ${h} hundreds, ${t} tens, and ${o} ones?`,
      answer: n,
      answerType: 'number',
      instructionHint: 'Write the number.',
      solutionText: `${th} x 1000 + ${h} x 100 + ${t} x 10 + ${o} = ${n}.`,
      diagramSpec: placeValueBlocksDiagram(t, o, { hundreds: h, title: `${th} Th, ${h} H, ${t} T, ${o} O` }),
      misconceptionTraps: ['confuses_place_columns', 'zero_placeholder_error'],
    };
  }

  if (familyId.endsWith('_003')) {
    const th = randInt(1, 9);
    const h = randInt(0, 9);
    const t = randInt(0, 9);
    const o = randInt(0, 9);
    const n = th * 1000 + h * 100 + t * 10 + o;
    const positions = [
      { digit: th, place: 'thousands', value: th * 1000 },
      { digit: h, place: 'hundreds', value: h * 100 },
      { digit: t, place: 'tens', value: t * 10 },
      { digit: o, place: 'ones', value: o },
    ];
    const asked = pick(positions);

    return {
      skillId: 'P3-WN-01',
      questionFamilyId: familyId,
      prompt: `What is the value of the digit ${asked.digit} in ${n}?`,
      answer: asked.value,
      answerType: 'number',
      instructionHint: 'Write the value of the digit.',
      solutionText: `The digit ${asked.digit} is in the ${asked.place} place, so its value is ${asked.value}.`,
      misconceptionTraps: ['confuses_place_columns'],
    };
  }

  // _004: Zero placeholder
  const zeroPatterns = [
    () => { const th = randInt(1, 9); const o = randInt(1, 9); return { th, h: 0, t: 0, o }; },
    () => { const th = randInt(1, 9); const h = randInt(1, 9); return { th, h, t: 0, o: 0 }; },
    () => { const th = randInt(1, 9); const t = randInt(1, 9); return { th, h: 0, t, o: 0 }; },
  ];
  const { th, h, t, o } = pick(zeroPatterns)();
  const n = th * 1000 + h * 100 + t * 10 + o;

  return {
    skillId: 'P3-WN-01',
    questionFamilyId: familyId,
    prompt: `What number is ${th} thousands, ${h} hundreds, ${t} tens, and ${o} ones?`,
    answer: n,
    answerType: 'number',
    instructionHint: 'Write the number. Remember the zero placeholders!',
    solutionText: `${th} x 1000 + ${h} x 100 + ${t} x 10 + ${o} = ${n}. The zeros hold the empty places.`,
    diagramSpec: placeValueBlocksDiagram(t, o, { hundreds: h, title: `${n} -- zero placeholders` }),
    misconceptionTraps: ['zero_placeholder_error'],
  };
}

// ---------------------------------------------------------------------------
// P3-WN-02: Comparing & Ordering Numbers to 10 000
// ---------------------------------------------------------------------------

function generateCompareOrder10000(familyId) {
  if (familyId.endsWith('_001')) {
    let a = randInt(1000, 9999);
    let b = distinctRandInt(1000, 9999, a);
    const symbol = a > b ? '>' : '<';
    const options = ['>', '<', '='];

    return {
      skillId: 'P3-WN-02',
      questionFamilyId: familyId,
      prompt: `Compare: ${a} ___ ${b}. Which symbol goes in the blank?`,
      answer: symbol,
      answerType: 'choice',
      options,
      instructionHint: 'Choose >, < or =.',
      solutionText: `${a} ${symbol} ${b}. Compare from the thousands place: ${Math.floor(a / 1000)} vs ${Math.floor(b / 1000)}.`,
      diagramSpec: numberLineDiagram({
        start: 0,
        end: 10000,
        step: 1000,
        points: [{ value: a, label: String(a) }, { value: b, label: String(b) }],
        title: `Compare ${a} and ${b}`,
      }),
      misconceptionTraps: ['compares_digit_by_digit_wrong_order', 'confuses_more_less_symbols'],
    };
  }

  if (familyId.endsWith('_002')) {
    const nums = [];
    while (nums.length < 3) {
      const n = randInt(1000, 9999);
      if (!nums.includes(n)) nums.push(n);
    }
    const ascending = pick([true, false]);
    const sorted = [...nums].sort((x, y) => (ascending ? x - y : y - x));
    const direction = ascending ? 'smallest to largest' : 'largest to smallest';

    return {
      skillId: 'P3-WN-02',
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
        end: 10000,
        step: 1000,
        points: nums.map((n) => ({ value: n, label: String(n) })),
        title: `Order ${nums.join(', ')}`,
      }),
      misconceptionTraps: ['compares_digit_by_digit_wrong_order'],
    };
  }

  // _003: Greatest / smallest from digits
  const digits = [];
  while (digits.length < 4) {
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
    skillId: 'P3-WN-02',
    questionFamilyId: familyId,
    prompt: `Using the digits ${digits.join(', ')}, form the ${label} 4-digit number. (Use each digit once.)`,
    answer,
    answerType: 'number',
    instructionHint: `Write the ${label} 4-digit number.`,
    solutionText: `To make the ${label} number, arrange digits from ${wantGreatest ? 'largest to smallest' : 'smallest to largest'} (put the ${wantGreatest ? 'biggest' : 'smallest non-zero'} digit in the thousands place): ${answer}.`,
    misconceptionTraps: ['confuses_place_columns', 'zero_placeholder_error'],
  };
}

// ---------------------------------------------------------------------------
// P3-WN-03: Number Patterns (hundreds/thousands steps)
// ---------------------------------------------------------------------------

function generateNumberPatterns(familyId) {
  const STEPS = [25, 50, 100, 150, 200, 250, 500, 1000];

  if (familyId.endsWith('_001')) {
    const step = pick(STEPS);
    const start = randInt(200, 8000 - step * 5);
    const seq = Array.from({ length: 5 }, (_, i) => start + i * step);
    const next = start + 5 * step;

    return {
      skillId: 'P3-WN-03',
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
    const start = randInt(step * 5 + 200, 9500);
    const seq = Array.from({ length: 5 }, (_, i) => start - i * step);
    const next = start - 5 * step;

    return {
      skillId: 'P3-WN-03',
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
    ? randInt(200, 8000 - step * 5)
    : randInt(step * 5 + 200, 9500);
  const seq = Array.from({ length: 5 }, (_, i) =>
    increasing ? start + i * step : start - i * step
  );
  const missingIdx = randInt(1, 3);
  const missing = seq[missingIdx];
  const display = seq.map((n, i) => (i === missingIdx ? '?' : String(n))).join(', ');

  return {
    skillId: 'P3-WN-03',
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
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P3-WN-01': generatePlaceValue4Digit,
  'P3-WN-02': generateCompareOrder10000,
  'P3-WN-03': generateNumberPatterns,
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
