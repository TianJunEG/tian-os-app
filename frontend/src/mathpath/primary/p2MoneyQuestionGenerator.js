import { getSkill } from './p2MoneySkillGraph.js';
import { getQuestionFamiliesBySkill } from './p2MoneyQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const NAMES = ['Ali', 'Ben', 'Mei', 'Siti', 'Raj', 'Tom', 'Lily', 'Sarah', 'John', 'Mary'];

function centsToStr(c) {
  const d = Math.floor(c / 100);
  const r = c % 100;
  return `$${d}.${String(r).padStart(2, '0')}`;
}

function centsToNum(c) {
  return Number((c / 100).toFixed(2));
}

// ---------------------------------------------------------------------------
// Shuffle helper
// ---------------------------------------------------------------------------
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------------------
// P2-MON-01: Money — Dollars & Cents
// ---------------------------------------------------------------------------

function generateDollarsCents(familyId) {
  if (familyId.endsWith('_001')) {
    // Dollars to cents: e.g. $4.85 = ? cents
    const dollars = randInt(1, 19);
    const cents = randInt(1, 99);
    const totalCents = dollars * 100 + cents;
    const name = pick(NAMES);
    return {
      skillId: 'P2-MON-01',
      questionFamilyId: familyId,
      prompt: `${name} has ${centsToStr(totalCents)}. How many cents is that?`,
      answer: totalCents,
      answerType: 'number',
      instructionHint: 'Multiply the dollars by 100 and add the cents.',
      solutionText: `${centsToStr(totalCents)} = ${dollars} dollars and ${cents} cents = ${dollars} × 100 + ${cents} = ${totalCents} cents.`,
      misconceptionTraps: ['ignores_decimal_point', 'cents_over_100'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Cents to dollars: e.g. 325 cents = $?.??
    const dollars = randInt(1, 19);
    const cents = randInt(1, 99);
    const totalCents = dollars * 100 + cents;
    const name = pick(NAMES);
    return {
      skillId: 'P2-MON-01',
      questionFamilyId: familyId,
      prompt: `${name} has ${totalCents} cents. Write this amount in dollars and cents.`,
      answer: centsToStr(totalCents),
      answerType: 'text',
      instructionHint: 'Divide by 100 to find the dollars. The remainder is the cents.',
      solutionText: `${totalCents} cents = ${dollars} dollars and ${cents} cents = ${centsToStr(totalCents)}.`,
      misconceptionTraps: ['ignores_decimal_point', 'cents_over_100'],
    };
  }

  // _003: Mixed notation — which amount is the same as X?
  const dollars = randInt(2, 15);
  const cents = randInt(5, 95);
  const totalCents = dollars * 100 + cents;
  const name = pick(NAMES);
  // Ask: how many cents are in the dollar part?
  return {
    skillId: 'P2-MON-01',
    questionFamilyId: familyId,
    prompt: `${name} says "${centsToStr(totalCents)} is the same as ${dollars} dollars and ${cents} cents." How many cents is just the dollar part worth?`,
    answer: dollars * 100,
    answerType: 'number',
    instructionHint: 'Each dollar is worth 100 cents.',
    solutionText: `${dollars} dollars = ${dollars} × 100 cents = ${dollars * 100} cents. So ${centsToStr(totalCents)} = ${dollars * 100} + ${cents} = ${totalCents} cents.`,
    misconceptionTraps: ['ignores_decimal_point', 'cents_over_100'],
  };
}

// ---------------------------------------------------------------------------
// P2-MON-02: Counting Notes & Coins
// ---------------------------------------------------------------------------

const NOTE_VALUES = [100, 200, 500, 1000]; // $1, $2, $5, $10 in cents
const COIN_VALUES = [5, 10, 20, 50]; // 5¢, 10¢, 20¢, 50¢

function describeNotes(notes) {
  // notes: array of cent values, e.g. [500, 200, 100]
  return notes.map((n) => `$${n / 100}`).join(', ');
}

function describeCoins(coins) {
  return coins.map((c) => `${c}¢`).join(', ');
}

function generateCountingMoney(familyId) {
  if (familyId.endsWith('_001')) {
    // Notes only
    const count = randInt(2, 5);
    const notes = [];
    for (let i = 0; i < count; i++) notes.push(pick(NOTE_VALUES));
    notes.sort((a, b) => b - a);
    const total = notes.reduce((s, n) => s + n, 0);
    const name = pick(NAMES);
    return {
      skillId: 'P2-MON-02',
      questionFamilyId: familyId,
      prompt: `${name} has these notes: ${describeNotes(notes)}. What is the total amount of money?`,
      answer: centsToStr(total),
      answerType: 'text',
      instructionHint: 'Add the value of each note together.',
      solutionText: `${describeNotes(notes)} = ${centsToStr(total)}.`,
      misconceptionTraps: ['counts_notes_as_ones'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Coins only
    const count = randInt(3, 6);
    const coins = [];
    for (let i = 0; i < count; i++) coins.push(pick(COIN_VALUES));
    coins.sort((a, b) => b - a);
    const total = coins.reduce((s, c) => s + c, 0);
    const name = pick(NAMES);
    return {
      skillId: 'P2-MON-02',
      questionFamilyId: familyId,
      prompt: `${name} has these coins: ${describeCoins(coins)}. What is the total amount of money?`,
      answer: centsToStr(total),
      answerType: 'text',
      instructionHint: 'Add the value of each coin together. Remember 100 cents = $1.',
      solutionText: `${describeCoins(coins)} = ${total} cents = ${centsToStr(total)}.`,
      misconceptionTraps: ['confuses_coin_values', 'cents_over_100'],
    };
  }

  // _003: Notes and coins
  const noteCount = randInt(1, 3);
  const coinCount = randInt(2, 4);
  const notes = [];
  const coins = [];
  for (let i = 0; i < noteCount; i++) notes.push(pick(NOTE_VALUES));
  for (let i = 0; i < coinCount; i++) coins.push(pick(COIN_VALUES));
  notes.sort((a, b) => b - a);
  coins.sort((a, b) => b - a);
  const noteTotal = notes.reduce((s, n) => s + n, 0);
  const coinTotal = coins.reduce((s, c) => s + c, 0);
  const total = noteTotal + coinTotal;
  const name = pick(NAMES);
  return {
    skillId: 'P2-MON-02',
    questionFamilyId: familyId,
    prompt: `${name} has notes: ${describeNotes(notes)} and coins: ${describeCoins(coins)}. What is the total?`,
    answer: centsToStr(total),
    answerType: 'text',
    instructionHint: 'Add all the notes first, then add all the coins. Combine the two totals.',
    solutionText: `Notes: ${centsToStr(noteTotal)}. Coins: ${coinTotal} cents. Total = ${centsToStr(total)}.`,
    misconceptionTraps: ['counts_notes_as_ones', 'confuses_coin_values', 'cents_over_100'],
  };
}

// ---------------------------------------------------------------------------
// P2-MON-03: Comparing Amounts of Money
// ---------------------------------------------------------------------------

function generateCompareMoney(familyId) {
  if (familyId.endsWith('_001')) {
    // Compare two amounts — which is greater/lesser?
    let a, b;
    for (let t = 0; t < 200; t++) {
      a = randInt(50, 2000);
      b = randInt(50, 2000);
      if (a !== b) break;
    }
    const isGreater = Math.random() < 0.5;
    const questionWord = isGreater ? 'greater' : 'lesser';
    const correct = isGreater ? Math.max(a, b) : Math.min(a, b);
    const wrong = isGreater ? Math.min(a, b) : Math.max(a, b);
    const name = pick(NAMES);

    // Build MCQ options
    const options = shuffle([
      { label: centsToStr(a), value: centsToStr(a) },
      { label: centsToStr(b), value: centsToStr(b) },
    ]);
    return {
      skillId: 'P2-MON-03',
      questionFamilyId: familyId,
      prompt: `${name} is looking at two prices: ${centsToStr(a)} and ${centsToStr(b)}. Which amount is ${questionWord}?`,
      answer: centsToStr(correct),
      answerType: 'mcq',
      options,
      instructionHint: 'Compare the dollars first, then the cents.',
      solutionText: `${centsToStr(correct)} is ${questionWord} than ${centsToStr(wrong)}.`,
      misconceptionTraps: ['compares_cents_ignoring_dollars', 'ignores_decimal_point'],
    };
  }

  // _002: Order three amounts
  let vals;
  for (let t = 0; t < 200; t++) {
    vals = [randInt(50, 2000), randInt(50, 2000), randInt(50, 2000)];
    if (new Set(vals).size === 3) break;
  }
  const isAscending = Math.random() < 0.5;
  const direction = isAscending ? 'least to greatest' : 'greatest to least';
  const sorted = [...vals].sort((x, y) => isAscending ? x - y : y - x);
  const correctOrder = sorted.map(centsToStr).join(', ');
  const name = pick(NAMES);

  // Build MCQ: correct order + 2 wrong orders
  const wrongOrders = [];
  const reversed = [...sorted].reverse().map(centsToStr).join(', ');
  wrongOrders.push(reversed);
  const scrambled = shuffle(vals).map(centsToStr).join(', ');
  if (scrambled !== correctOrder && scrambled !== reversed) {
    wrongOrders.push(scrambled);
  } else {
    // fallback: swap first two
    const swapped = [sorted[1], sorted[0], sorted[2]].map(centsToStr).join(', ');
    wrongOrders.push(swapped);
  }
  const options = shuffle([
    { label: correctOrder, value: correctOrder },
    ...wrongOrders.map((w) => ({ label: w, value: w })),
  ]);

  return {
    skillId: 'P2-MON-03',
    questionFamilyId: familyId,
    prompt: `${name} has three amounts: ${vals.map(centsToStr).join(', ')}. Arrange them from ${direction}.`,
    answer: correctOrder,
    answerType: 'mcq',
    options,
    instructionHint: 'Compare the dollars first. If the dollars are the same, compare the cents.',
    solutionText: `From ${direction}: ${correctOrder}.`,
    misconceptionTraps: ['compares_cents_ignoring_dollars', 'ignores_decimal_point'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P2-MON-01': generateDollarsCents,
  'P2-MON-02': generateCountingMoney,
  'P2-MON-03': generateCompareMoney,
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
