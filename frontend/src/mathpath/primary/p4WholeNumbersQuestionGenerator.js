import { getSkill } from './p4WholeNumbersSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p4WholeNumbersQuestionFamilies.js';
import {
  numberLineDiagram,
  placeValueBlocksDiagram,
} from './p1DiagramHelpers.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

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

const NAMES = ['Ali', 'Ben', 'Mei', 'Siti', 'Raj', 'Tom', 'Lily', 'Sarah', 'John', 'Mary'];

function rand5Digit() {
  const tth = randInt(1, 9);
  const th = randInt(0, 9);
  const h = randInt(0, 9);
  const t = randInt(0, 9);
  const o = randInt(0, 9);
  return { tth, th, h, t, o, n: tth * 10000 + th * 1000 + h * 100 + t * 10 + o };
}

// ---------------------------------------------------------------------------
// P4-WN-01: Place Value (ten thousands to ones)
// ---------------------------------------------------------------------------

function generatePlaceValue5Digit(familyId) {
  // _001: Expanded form -> number
  if (familyId.endsWith('_001')) {
    const { tth, th, h, t, o, n } = rand5Digit();
    const parts = [];
    if (tth) parts.push(`${tth * 10000}`);
    if (th) parts.push(`${th * 1000}`);
    if (h) parts.push(`${h * 100}`);
    if (t) parts.push(`${t * 10}`);
    if (o) parts.push(`${o}`);
    const expanded = parts.join(' + ') || '0';

    return {
      skillId: 'P4-WN-01',
      questionFamilyId: familyId,
      prompt: `What number is ${expanded}?`,
      answer: n,
      answerType: 'number',
      instructionHint: 'Add the values together to form the number.',
      solutionText: `${expanded} = ${n.toLocaleString()}.`,
      diagramSpec: placeValueBlocksDiagram(t, o, { hundreds: h, title: `${n} in place values` }),
      misconceptionTraps: ['confuses_place_columns_5digit', 'zero_placeholder_error_5digit'],
    };
  }

  // _002: Number -> expanded form (MCQ)
  if (familyId.endsWith('_002')) {
    const { tth, th, h, t, o, n } = rand5Digit();
    const parts = [];
    if (tth) parts.push(`${tth * 10000}`);
    if (th) parts.push(`${th * 1000}`);
    if (h) parts.push(`${h * 100}`);
    if (t) parts.push(`${t * 10}`);
    if (o) parts.push(`${o}`);
    const correct = parts.join(' + ') || '0';

    // Build distractors by swapping place values
    const wrongA = [];
    if (tth) wrongA.push(`${tth * 1000}`);
    if (th) wrongA.push(`${th * 10000}`);
    if (h) wrongA.push(`${h * 100}`);
    if (t) wrongA.push(`${t * 10}`);
    if (o) wrongA.push(`${o}`);
    const distractor1 = wrongA.join(' + ') || '0';

    const wrongB = [];
    if (tth) wrongB.push(`${tth * 10000}`);
    if (th) wrongB.push(`${th * 1000}`);
    if (h) wrongB.push(`${h * 10}`);
    if (t) wrongB.push(`${t * 100}`);
    if (o) wrongB.push(`${o}`);
    const distractor2 = wrongB.join(' + ') || '0';

    const options = [correct, distractor1, distractor2].filter((v, i, a) => a.indexOf(v) === i);
    while (options.length < 3) {
      const alt = rand5Digit();
      const altParts = [];
      if (alt.tth) altParts.push(`${alt.tth * 10000}`);
      if (alt.th) altParts.push(`${alt.th * 1000}`);
      if (alt.h) altParts.push(`${alt.h * 100}`);
      if (alt.t) altParts.push(`${alt.t * 10}`);
      if (alt.o) altParts.push(`${alt.o}`);
      const altExpanded = altParts.join(' + ') || '0';
      if (!options.includes(altExpanded)) options.push(altExpanded);
    }

    return {
      skillId: 'P4-WN-01',
      questionFamilyId: familyId,
      prompt: `Which is the correct expanded form of ${n.toLocaleString()}?`,
      answer: correct,
      answerType: 'choice',
      options: shuffle(options.slice(0, 3)),
      instructionHint: 'Choose the expanded form that adds up to the number.',
      solutionText: `${n.toLocaleString()} = ${correct}.`,
      misconceptionTraps: ['confuses_place_columns_5digit'],
    };
  }

  // _003: Value of a digit
  const { tth, th, h, t, o, n } = rand5Digit();
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
    instructionHint: 'Write the value of the digit, not the digit itself.',
    solutionText: `The digit ${asked.digit} is in the ${asked.place} place, so its value is ${asked.value.toLocaleString()}.`,
    misconceptionTraps: ['confuses_place_columns_5digit'],
  };
}

// ---------------------------------------------------------------------------
// P4-WN-02: Comparing & Ordering Numbers to 100 000
// ---------------------------------------------------------------------------

function generateCompareOrder100000(familyId) {
  // _001: Which is greater
  if (familyId.endsWith('_001')) {
    const a = randInt(1001, 99999);
    const b = distinctRandInt(1001, 99999, a);
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
      solutionText: `${a.toLocaleString()} ${symbol} ${b.toLocaleString()}. Compare from the ten thousands place first.`,
      diagramSpec: numberLineDiagram({
        start: 0, end: 100000, step: 10000,
        points: [{ value: a, label: String(a) }, { value: b, label: String(b) }],
        title: `Compare ${a.toLocaleString()} and ${b.toLocaleString()}`,
      }),
      misconceptionTraps: ['compares_digit_by_digit_wrong_order_5digit', 'confuses_more_less_symbols_5digit'],
    };
  }

  // _002: Order ascending
  if (familyId.endsWith('_002')) {
    const nums = [];
    while (nums.length < 3) {
      const n = randInt(1001, 99999);
      if (!nums.includes(n)) nums.push(n);
    }
    const sorted = [...nums].sort((x, y) => x - y);

    return {
      skillId: 'P4-WN-02',
      questionFamilyId: familyId,
      prompt: `Arrange from smallest to largest: ${nums.map((n) => n.toLocaleString()).join(', ')}`,
      answer: sorted.join(', '),
      answerType: 'choice',
      options: shuffle([
        sorted.join(', '),
        [...sorted].reverse().join(', '),
        shuffle([...nums]).join(', '),
      ].filter((v, i, a) => a.indexOf(v) === i)).slice(0, 3),
      instructionHint: 'Order from smallest to largest.',
      solutionText: `From smallest to largest: ${sorted.map((n) => n.toLocaleString()).join(', ')}.`,
      diagramSpec: numberLineDiagram({
        start: 0, end: 100000, step: 10000,
        points: nums.map((n) => ({ value: n, label: String(n) })),
        title: `Order: ${nums.map((n) => n.toLocaleString()).join(', ')}`,
      }),
      misconceptionTraps: ['compares_digit_by_digit_wrong_order_5digit'],
    };
  }

  // _003: Order descending
  const nums = [];
  while (nums.length < 3) {
    const n = randInt(1001, 99999);
    if (!nums.includes(n)) nums.push(n);
  }
  const sorted = [...nums].sort((x, y) => y - x);

  return {
    skillId: 'P4-WN-02',
    questionFamilyId: familyId,
    prompt: `Arrange from largest to smallest: ${nums.map((n) => n.toLocaleString()).join(', ')}`,
    answer: sorted.join(', '),
    answerType: 'choice',
    options: shuffle([
      sorted.join(', '),
      [...sorted].reverse().join(', '),
      shuffle([...nums]).join(', '),
    ].filter((v, i, a) => a.indexOf(v) === i)).slice(0, 3),
    instructionHint: 'Order from largest to smallest.',
    solutionText: `From largest to smallest: ${sorted.map((n) => n.toLocaleString()).join(', ')}.`,
    diagramSpec: numberLineDiagram({
      start: 0, end: 100000, step: 10000,
      points: nums.map((n) => ({ value: n, label: String(n) })),
      title: `Order: ${nums.map((n) => n.toLocaleString()).join(', ')}`,
    }),
    misconceptionTraps: ['compares_digit_by_digit_wrong_order_5digit'],
  };
}

// ---------------------------------------------------------------------------
// P4-WN-03: Number Patterns (hundreds/thousands steps to 100 000)
// ---------------------------------------------------------------------------

function generateNumberPatterns(familyId) {
  const STEPS = [100, 200, 250, 500, 1000, 1500, 2000, 2500, 5000];

  // _001: Find next in sequence
  if (familyId.endsWith('_001')) {
    const step = pick(STEPS);
    const increasing = pick([true, false]);
    let start;
    if (increasing) {
      start = randInt(1001, 90000 - step * 5);
    } else {
      start = randInt(step * 5 + 1001, 99999);
    }
    const seq = Array.from({ length: 5 }, (_, i) =>
      increasing ? start + i * step : start - i * step
    );
    const next = increasing ? start + 5 * step : start - 5 * step;
    const direction = increasing ? 'increases' : 'decreases';

    return {
      skillId: 'P4-WN-03',
      questionFamilyId: familyId,
      prompt: `What comes next? ${seq.map((n) => n.toLocaleString()).join(', ')}, ?`,
      answer: next,
      answerType: 'number',
      instructionHint: 'Find the pattern and write the next number.',
      solutionText: `The pattern ${direction} by ${step.toLocaleString()} each time. The next number is ${next.toLocaleString()}.`,
      diagramSpec: numberLineDiagram({
        start: Math.min(...seq, next), end: Math.max(...seq, next), step,
        points: [...seq, next].map((n) => ({ value: n, label: String(n) })),
        title: `Pattern: ${increasing ? '+' : '-'}${step.toLocaleString()}`,
      }),
      misconceptionTraps: increasing ? ['pattern_step_error_large'] : ['pattern_step_error_large', 'pattern_direction_error_large'],
    };
  }

  // _002: Find the rule
  if (familyId.endsWith('_002')) {
    const step = pick(STEPS);
    const increasing = pick([true, false]);
    let start;
    if (increasing) {
      start = randInt(1001, 90000 - step * 4);
    } else {
      start = randInt(step * 4 + 1001, 99999);
    }
    const seq = Array.from({ length: 5 }, (_, i) =>
      increasing ? start + i * step : start - i * step
    );
    const ruleAnswer = increasing ? step : -step;

    return {
      skillId: 'P4-WN-03',
      questionFamilyId: familyId,
      prompt: `What is the rule? ${seq.map((n) => n.toLocaleString()).join(', ')}. Each number is found by adding ___ to the previous number.`,
      answer: ruleAnswer,
      answerType: 'number',
      instructionHint: 'Subtract consecutive terms to find the step. Use a negative number if decreasing.',
      solutionText: `${seq[1].toLocaleString()} - ${seq[0].toLocaleString()} = ${ruleAnswer > 0 ? '+' : ''}${ruleAnswer.toLocaleString()}. The rule is add ${ruleAnswer > 0 ? '+' : ''}${ruleAnswer.toLocaleString()}.`,
      diagramSpec: numberLineDiagram({
        start: Math.min(...seq), end: Math.max(...seq), step,
        points: seq.map((n) => ({ value: n, label: String(n) })),
        title: `Rule: ${ruleAnswer > 0 ? '+' : ''}${ruleAnswer.toLocaleString()}`,
      }),
      misconceptionTraps: ['pattern_step_error_large', 'pattern_direction_error_large'],
    };
  }

  // _003: Find missing middle term
  const step = pick(STEPS);
  const increasing = pick([true, false]);
  let start;
  if (increasing) {
    start = randInt(1001, 90000 - step * 4);
  } else {
    start = randInt(step * 4 + 1001, 99999);
  }
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
    instructionHint: 'Find the step between known numbers, then fill in the blank.',
    solutionText: `The pattern ${increasing ? 'increases' : 'decreases'} by ${step.toLocaleString()}. The missing number is ${missing.toLocaleString()}.`,
    diagramSpec: numberLineDiagram({
      start: Math.min(...seq), end: Math.max(...seq), step,
      points: seq.map((n) => ({ value: n, label: String(n) })),
      title: `Pattern: ${increasing ? '+' : '-'}${step.toLocaleString()}`,
    }),
    misconceptionTraps: ['pattern_step_error_large'],
  };
}

// ---------------------------------------------------------------------------
// P4-WN-04: Rounding to 10, 100, 1000
// ---------------------------------------------------------------------------

function roundTo(n, place) {
  return Math.round(n / place) * place;
}

function generateRounding(familyId) {
  // _001: Round to nearest 10
  if (familyId.endsWith('_001')) {
    const n = randInt(1001, 99999);
    const rounded = roundTo(n, 10);
    const onesDigit = n % 10;
    const direction = onesDigit >= 5 ? 'up' : 'down';

    return {
      skillId: 'P4-WN-04',
      questionFamilyId: familyId,
      prompt: `Round ${n.toLocaleString()} to the nearest 10.`,
      answer: rounded,
      answerType: 'number',
      instructionHint: 'Look at the ones digit. If it is 5 or more, round up. Otherwise, round down.',
      solutionText: `The ones digit is ${onesDigit}. Since ${onesDigit} is ${onesDigit >= 5 ? '5 or more' : 'less than 5'}, we round ${direction} to ${rounded.toLocaleString()}.`,
      misconceptionTraps: ['rounds_wrong_direction', 'truncates_instead_of_rounding'],
    };
  }

  // _002: Round to nearest 100
  if (familyId.endsWith('_002')) {
    const n = randInt(1001, 99999);
    const rounded = roundTo(n, 100);
    const tensDigit = Math.floor(n / 10) % 10;
    const direction = tensDigit >= 5 ? 'up' : 'down';

    return {
      skillId: 'P4-WN-04',
      questionFamilyId: familyId,
      prompt: `Round ${n.toLocaleString()} to the nearest 100.`,
      answer: rounded,
      answerType: 'number',
      instructionHint: 'Look at the tens digit. If it is 5 or more, round up. Otherwise, round down.',
      solutionText: `The tens digit is ${tensDigit}. Since ${tensDigit} is ${tensDigit >= 5 ? '5 or more' : 'less than 5'}, we round ${direction} to ${rounded.toLocaleString()}.`,
      misconceptionTraps: ['rounds_wrong_direction', 'rounds_wrong_place'],
    };
  }

  // _003: Round to nearest 1000
  const n = randInt(1001, 99999);
  const rounded = roundTo(n, 1000);
  const hundredsDigit = Math.floor(n / 100) % 10;
  const direction = hundredsDigit >= 5 ? 'up' : 'down';

  return {
    skillId: 'P4-WN-04',
    questionFamilyId: familyId,
    prompt: `Round ${n.toLocaleString()} to the nearest 1,000.`,
    answer: rounded,
    answerType: 'number',
    instructionHint: 'Look at the hundreds digit. If it is 5 or more, round up. Otherwise, round down.',
    solutionText: `The hundreds digit is ${hundredsDigit}. Since ${hundredsDigit} is ${hundredsDigit >= 5 ? '5 or more' : 'less than 5'}, we round ${direction} to ${rounded.toLocaleString()}.`,
    misconceptionTraps: ['rounds_wrong_direction', 'rounds_wrong_place'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P4-WN-01': generatePlaceValue5Digit,
  'P4-WN-02': generateCompareOrder100000,
  'P4-WN-03': generateNumberPatterns,
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
