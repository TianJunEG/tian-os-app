import { getSkill } from './p2WordProbSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p2WordProbQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const NAMES = ['Ali', 'Ben', 'Mei', 'Siti', 'Raj', 'Tom', 'Lily', 'Sarah', 'John', 'Mary'];
const ITEMS = ['stickers', 'marbles', 'pencils', 'books', 'sweets', 'erasers', 'apples', 'oranges'];
const CONTAINERS = ['bags', 'boxes', 'packets', 'baskets', 'trays'];

function pickTwoNames() {
  const n1 = pick(NAMES);
  let n2 = pick(NAMES);
  while (n2 === n1) n2 = pick(NAMES);
  return [n1, n2];
}

// ---------------------------------------------------------------------------
// P2-WP-01: Comparing Two Quantities
// ---------------------------------------------------------------------------

function generateComparing(familyId) {
  if (familyId.endsWith('_001')) {
    // Find the larger quantity: X has N. Y has D more than X. How many does Y have?
    const [name1, name2] = pickTwoNames();
    const item = pick(ITEMS);
    const base = randInt(8, 40);
    const diff = randInt(3, 15);
    const answer = base + diff;
    return {
      skillId: 'P2-WP-01',
      questionFamilyId: familyId,
      prompt: `${name1} has ${base} ${item}. ${name2} has ${diff} more ${item} than ${name1}. How many ${item} does ${name2} have?`,
      answer,
      answerType: 'number',
      instructionHint: `"${diff} more" means add ${diff} to ${base}.`,
      solutionText: `${name2} has ${diff} more than ${name1}. ${base} + ${diff} = ${answer}. ${name2} has ${answer} ${item}.`,
      misconceptionTraps: ['subtracts_when_should_add', 'confuses_total_with_difference'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Find the smaller quantity: X has N. Y has D fewer than X. How many does Y have?
    const [name1, name2] = pickTwoNames();
    const item = pick(ITEMS);
    const base = randInt(15, 50);
    const diff = randInt(3, Math.min(14, base - 1));
    const answer = base - diff;
    return {
      skillId: 'P2-WP-01',
      questionFamilyId: familyId,
      prompt: `${name1} has ${base} ${item}. ${name2} has ${diff} fewer ${item} than ${name1}. How many ${item} does ${name2} have?`,
      answer,
      answerType: 'number',
      instructionHint: `"${diff} fewer" means subtract ${diff} from ${base}.`,
      solutionText: `${name2} has ${diff} fewer than ${name1}. ${base} - ${diff} = ${answer}. ${name2} has ${answer} ${item}.`,
      misconceptionTraps: ['adds_when_should_subtract', 'confuses_total_with_difference'],
    };
  }

  // _003: Find the difference: X has A, Y has B. How many more does the bigger one have?
  const [name1, name2] = pickTwoNames();
  const item = pick(ITEMS);
  const val1 = randInt(10, 45);
  let val2 = randInt(10, 45);
  while (val2 === val1) val2 = randInt(10, 45);
  const bigger = val1 > val2 ? name1 : name2;
  const smaller = val1 > val2 ? name2 : name1;
  const answer = Math.abs(val1 - val2);
  return {
    skillId: 'P2-WP-01',
    questionFamilyId: familyId,
    prompt: `${name1} has ${val1} ${item}. ${name2} has ${val2} ${item}. How many more ${item} does ${bigger} have than ${smaller}?`,
    answer,
    answerType: 'number',
    instructionHint: 'Subtract the smaller number from the larger number to find the difference.',
    solutionText: `${Math.max(val1, val2)} - ${Math.min(val1, val2)} = ${answer}. ${bigger} has ${answer} more ${item} than ${smaller}.`,
    misconceptionTraps: ['adds_when_should_subtract', 'confuses_total_with_difference'],
  };
}

// ---------------------------------------------------------------------------
// P2-WP-02: Equal Groups
// ---------------------------------------------------------------------------

function generateEqualGroups(familyId) {
  if (familyId.endsWith('_001')) {
    // Find total from groups: N bags x M items each = total
    const name = pick(NAMES);
    const item = pick(ITEMS);
    const container = pick(CONTAINERS);
    const groups = randInt(2, 6);
    const perGroup = randInt(2, 10);
    const answer = groups * perGroup;
    return {
      skillId: 'P2-WP-02',
      questionFamilyId: familyId,
      prompt: `${name} has ${groups} ${container}. Each ${container.endsWith('s') ? container.slice(0, -1) : container} has ${perGroup} ${item}. How many ${item} does ${name} have altogether?`,
      answer,
      answerType: 'number',
      instructionHint: `Multiply the number of ${container} by the number in each: ${groups} x ${perGroup}.`,
      solutionText: `${groups} x ${perGroup} = ${answer}. ${name} has ${answer} ${item} altogether.`,
      misconceptionTraps: ['multiplies_wrong_numbers', 'confuses_groups_with_per_group'],
    };
  }

  // _002: Find the number of groups: total / per group = groups
  const name = pick(NAMES);
  const item = pick(ITEMS);
  const container = pick(CONTAINERS);
  const groups = randInt(2, 6);
  const perGroup = randInt(2, 10);
  const total = groups * perGroup;
  return {
    skillId: 'P2-WP-02',
    questionFamilyId: familyId,
    prompt: `${name} has ${total} ${item}. ${name} puts ${perGroup} ${item} in each ${container.endsWith('s') ? container.slice(0, -1) : container}. How many ${container} does ${name} need?`,
    answer: groups,
    answerType: 'number',
    instructionHint: `Divide the total by the number in each group: ${total} / ${perGroup}.`,
    solutionText: `${total} / ${perGroup} = ${groups}. ${name} needs ${groups} ${container}.`,
    misconceptionTraps: ['multiplies_wrong_numbers', 'confuses_groups_with_per_group'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P2-WP-01': generateComparing,
  'P2-WP-02': generateEqualGroups,
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
