import { getSkill } from './p3MoneySkillGraph.js';
import { getQuestionFamiliesBySkill } from './p3MoneyQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const NAMES = ['Ali', 'Ben', 'Mei', 'Siti', 'Raj', 'Tom', 'Lily', 'Sarah', 'John', 'Mary'];
const ITEMS = [
  { name: 'pencil', min: 50, max: 250 },
  { name: 'notebook', min: 150, max: 450 },
  { name: 'eraser', min: 30, max: 150 },
  { name: 'ruler', min: 80, max: 300 },
  { name: 'sticker book', min: 250, max: 650 },
  { name: 'colour pen', min: 120, max: 400 },
  { name: 'drink', min: 100, max: 350 },
  { name: 'sandwich', min: 200, max: 500 },
  { name: 'toy car', min: 350, max: 900 },
  { name: 'bookmark', min: 50, max: 200 },
];

function centsToStr(c) {
  const d = Math.floor(c / 100);
  const r = c % 100;
  return `$${d}.${String(r).padStart(2, '0')}`;
}

function centsToNum(c) {
  return Number((c / 100).toFixed(2));
}

// ---------------------------------------------------------------------------
// P3-MON-01: Adding & Subtracting Money
// ---------------------------------------------------------------------------

function generateMoneyAddSub(familyId) {
  if (familyId.endsWith('_001')) {
    // Add, no carry in cents
    let c1, c2;
    for (let t = 0; t < 200; t++) {
      c1 = randInt(100, 4999); // $1.00 - $49.99
      c2 = randInt(100, 4999);
      if ((c1 % 100) + (c2 % 100) < 100) break;
    }
    const total = c1 + c2;
    return {
      skillId: 'P3-MON-01',
      questionFamilyId: familyId,
      prompt: `${centsToStr(c1)} + ${centsToStr(c2)} = ?`,
      answer: centsToNum(total),
      answerType: 'number',
      instructionHint: 'Add the dollars, then the cents.',
      solutionText: `${centsToStr(c1)} + ${centsToStr(c2)} = ${centsToStr(total)}.`,
      misconceptionTraps: ['decimal_alignment_error', 'drops_cents'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Add, carry from cents
    let c1, c2;
    for (let t = 0; t < 200; t++) {
      c1 = randInt(100, 4999);
      c2 = randInt(100, 4999);
      if ((c1 % 100) + (c2 % 100) >= 100) break;
    }
    const total = c1 + c2;
    return {
      skillId: 'P3-MON-01',
      questionFamilyId: familyId,
      prompt: `${centsToStr(c1)} + ${centsToStr(c2)} = ?`,
      answer: centsToNum(total),
      answerType: 'number',
      instructionHint: 'Add the cents first. If they make $1 or more, carry to the dollars.',
      solutionText: `${centsToStr(c1)} + ${centsToStr(c2)} = ${centsToStr(total)}. The cents total ${(c1 % 100) + (c2 % 100)}, so carry $1.`,
      misconceptionTraps: ['decimal_alignment_error', 'drops_cents', 'dollar_sign_error'],
    };
  }

  if (familyId.endsWith('_003')) {
    // Subtract, no borrow
    let c1, c2;
    for (let t = 0; t < 200; t++) {
      c1 = randInt(500, 9999);
      c2 = randInt(100, c1 - 1);
      if ((c1 % 100) >= (c2 % 100)) break;
    }
    const diff = c1 - c2;
    return {
      skillId: 'P3-MON-01',
      questionFamilyId: familyId,
      prompt: `${centsToStr(c1)} - ${centsToStr(c2)} = ?`,
      answer: centsToNum(diff),
      answerType: 'number',
      instructionHint: 'Subtract the cents, then the dollars.',
      solutionText: `${centsToStr(c1)} - ${centsToStr(c2)} = ${centsToStr(diff)}.`,
      misconceptionTraps: ['decimal_alignment_error', 'drops_cents'],
    };
  }

  // _004: Subtract, borrow from dollars
  let c1, c2;
  for (let t = 0; t < 200; t++) {
    c1 = randInt(500, 9999);
    c2 = randInt(100, c1 - 1);
    if ((c1 % 100) < (c2 % 100)) break;
  }
  const diff = c1 - c2;
  return {
    skillId: 'P3-MON-01',
    questionFamilyId: familyId,
    prompt: `${centsToStr(c1)} - ${centsToStr(c2)} = ?`,
    answer: centsToNum(diff),
    answerType: 'number',
    instructionHint: 'Borrow $1 (100 cents) to subtract the cents.',
    solutionText: `${centsToStr(c1)} - ${centsToStr(c2)} = ${centsToStr(diff)}. Borrow 1 dollar to subtract ${c2 % 100} cents from ${c1 % 100} cents.`,
    misconceptionTraps: ['decimal_alignment_error', 'drops_cents', 'dollar_sign_error'],
  };
}

// ---------------------------------------------------------------------------
// P3-MON-02: Making Change
// ---------------------------------------------------------------------------

function generateMakingChange(familyId) {
  if (familyId.endsWith('_001')) {
    // Change from a whole dollar note
    const notes = [500, 1000, 5000]; // $5, $10, $50
    const note = pick(notes);
    const cost = randInt(100, note - 10); // at least $1, less than note
    const change = note - cost;
    const name = pick(NAMES);
    const item = pick(ITEMS);

    return {
      skillId: 'P3-MON-02',
      questionFamilyId: familyId,
      prompt: `${name} buys a ${item.name} for ${centsToStr(cost)}. ${name} pays with a ${centsToStr(note)} note. How much change does ${name} get?`,
      answer: centsToNum(change),
      answerType: 'number',
      instructionHint: 'Change = amount paid - cost.',
      solutionText: `Change = ${centsToStr(note)} - ${centsToStr(cost)} = ${centsToStr(change)}.`,
      misconceptionTraps: ['subtracts_wrong_way', 'forgets_cents_in_change'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Change from a round amount like $20.00
    const paid = pick([2000, 5000, 10000]); // $20, $50, $100
    const cost = randInt(300, paid - 50);
    const change = paid - cost;
    const name = pick(NAMES);
    const item = pick(ITEMS);

    return {
      skillId: 'P3-MON-02',
      questionFamilyId: familyId,
      prompt: `${name} buys a ${item.name} for ${centsToStr(cost)} and pays with ${centsToStr(paid)}. What is the change?`,
      answer: centsToNum(change),
      answerType: 'number',
      instructionHint: 'Change = amount paid - cost.',
      solutionText: `Change = ${centsToStr(paid)} - ${centsToStr(cost)} = ${centsToStr(change)}.`,
      misconceptionTraps: ['subtracts_wrong_way', 'forgets_cents_in_change'],
    };
  }

  // _003: Multi-item, find total then change
  const note = pick([1000, 2000, 5000]);
  let item1, item2, price1, price2;
  for (let t = 0; t < 200; t++) {
    item1 = pick(ITEMS);
    item2 = pick(ITEMS);
    if (item1.name === item2.name) continue;
    price1 = randInt(item1.min, item1.max);
    price2 = randInt(item2.min, item2.max);
    if (price1 + price2 < note && price1 + price2 >= 100) break;
  }
  const totalCost = price1 + price2;
  const change = note - totalCost;
  const name = pick(NAMES);

  return {
    skillId: 'P3-MON-02',
    questionFamilyId: familyId,
    prompt: `${name} buys a ${item1.name} for ${centsToStr(price1)} and a ${item2.name} for ${centsToStr(price2)}. ${name} pays with a ${centsToStr(note)} note. How much change does ${name} get?`,
    answer: centsToNum(change),
    answerType: 'number',
    instructionHint: 'First find the total cost, then subtract from the amount paid.',
    solutionText: `Total cost = ${centsToStr(price1)} + ${centsToStr(price2)} = ${centsToStr(totalCost)}. Change = ${centsToStr(note)} - ${centsToStr(totalCost)} = ${centsToStr(change)}.`,
    misconceptionTraps: ['subtracts_wrong_way', 'forgets_cents_in_change', 'decimal_alignment_error'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P3-MON-01': generateMoneyAddSub,
  'P3-MON-02': generateMakingChange,
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
