import { getSkill } from './p2MulDivSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p2MulDivQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const NAMES = ['Ali', 'Ben', 'Mei', 'Siti', 'Raj', 'Tom', 'Lily', 'Sarah', 'John', 'Mary'];
const SHARING_ITEMS = ['stickers', 'marbles', 'pencils', 'sweets', 'erasers', 'bookmarks', 'cards', 'beads'];

// ---------------------------------------------------------------------------
// P2-MD-01: Multiplication Tables (2, 3, 4, 5, 10)
// ---------------------------------------------------------------------------

function generateTablesMul(familyId) {
  const table = pick([2, 3, 4, 5, 10]);
  const factor = randInt(1, 10);
  const product = table * factor;

  if (familyId.endsWith('_001')) {
    return {
      skillId: 'P2-MD-01',
      questionFamilyId: familyId,
      prompt: `${table} x ${factor} = ?`,
      answer: product,
      answerType: 'number',
      instructionHint: 'Recall the times table fact.',
      solutionText: `${table} x ${factor} = ${product}.`,
      misconceptionTraps: ['times_table_recall_error', 'confuses_multiplication_addition'],
    };
  }

  if (familyId.endsWith('_002')) {
    return {
      skillId: 'P2-MD-01',
      questionFamilyId: familyId,
      prompt: `${factor} x ${table} = ?`,
      answer: product,
      answerType: 'number',
      instructionHint: 'Recall the times table fact. Order does not change the answer.',
      solutionText: `${factor} x ${table} = ${product}. (Same as ${table} x ${factor}.)`,
      misconceptionTraps: ['times_table_recall_error'],
    };
  }

  // _003: Missing factor (MCQ)
  const correctAnswer = factor;
  const distractors = new Set();
  while (distractors.size < 3) {
    const d = randInt(1, 10);
    if (d !== correctAnswer) distractors.add(d);
  }
  const choices = [correctAnswer, ...distractors].sort((a, b) => a - b);

  return {
    skillId: 'P2-MD-01',
    questionFamilyId: familyId,
    prompt: `${table} x ? = ${product}`,
    answer: correctAnswer,
    answerType: 'mcq',
    choices,
    instructionHint: 'Find the missing number.',
    solutionText: `${table} x ${correctAnswer} = ${product}, so the missing number is ${correctAnswer}.`,
    misconceptionTraps: ['times_table_recall_error', 'confuses_multiplication_addition'],
  };
}

// ---------------------------------------------------------------------------
// P2-MD-02: Dividing Within the Tables
// ---------------------------------------------------------------------------

function generateTablesDiv(familyId) {
  const divisor = pick([2, 3, 4, 5, 10]);
  const quotient = randInt(1, 10);
  const dividend = divisor * quotient;

  if (familyId.endsWith('_001')) {
    return {
      skillId: 'P2-MD-02',
      questionFamilyId: familyId,
      prompt: `${dividend} / ${divisor} = ?`,
      answer: quotient,
      answerType: 'number',
      instructionHint: 'Use a times table fact.',
      solutionText: `${quotient} x ${divisor} = ${dividend}, so ${dividend} / ${divisor} = ${quotient}.`,
      misconceptionTraps: ['division_remainder_confusion', 'division_as_repeated_subtraction_error'],
    };
  }

  if (familyId.endsWith('_002')) {
    const name = pick(NAMES);
    const item = pick(SHARING_ITEMS);
    return {
      skillId: 'P2-MD-02',
      questionFamilyId: familyId,
      prompt: `${name} has ${dividend} ${item} shared equally among ${divisor} friends. How many ${item} does each friend get?`,
      answer: quotient,
      answerType: 'number',
      instructionHint: 'Sharing equally means dividing.',
      solutionText: `${dividend} / ${divisor} = ${quotient}. Each friend gets ${quotient} ${item}.`,
      misconceptionTraps: ['division_remainder_confusion', 'commutative_for_division_error'],
    };
  }

  // _003: Missing dividend
  return {
    skillId: 'P2-MD-02',
    questionFamilyId: familyId,
    prompt: `? / ${divisor} = ${quotient}`,
    answer: dividend,
    answerType: 'number',
    instructionHint: 'Find the missing number. Think: quotient x divisor = ?',
    solutionText: `${quotient} x ${divisor} = ${dividend}, so the missing number is ${dividend}.`,
    misconceptionTraps: ['division_as_repeated_subtraction_error', 'commutative_for_division_error'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P2-MD-01': generateTablesMul,
  'P2-MD-02': generateTablesDiv,
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
