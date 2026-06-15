import { getSkill } from './p3WordProbSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p3WordProbQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const NAMES = ['Ali', 'Ben', 'Mei', 'Siti', 'Raj', 'Tom', 'Lily', 'Sarah', 'John', 'Mary'];

// ---------------------------------------------------------------------------
// P3-WP-01: Sharing Equally
// ---------------------------------------------------------------------------

function generateShareEqually(familyId) {
  if (familyId.endsWith('_001')) {
    // Exact division — share among friends
    const groups = randInt(3, 8);
    const each = randInt(3, 12);
    const total = groups * each;
    const name = pick(NAMES);
    const items = pick(['stickers', 'sweets', 'marbles', 'pencils', 'beads', 'cards', 'books']);
    return {
      skillId: 'P3-WP-01',
      questionFamilyId: familyId,
      prompt: `${name} has ${total} ${items}. ${name} shares them equally among ${groups} friends. How many ${items} does each friend get?`,
      answer: each,
      answerType: 'number',
      instructionHint: 'Divide the total by the number of friends.',
      solutionText: `${total} ÷ ${groups} = ${each}. Each friend gets ${each} ${items}.`,
      misconceptionTraps: ['wrong_operation_choice', 'misreads_question'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Division with remainder
    const groups = randInt(3, 8);
    const each = randInt(3, 12);
    const remainder = randInt(1, groups - 1);
    const total = groups * each + remainder;
    const name = pick(NAMES);
    const items = pick(['stickers', 'sweets', 'marbles', 'pencils', 'beads']);
    return {
      skillId: 'P3-WP-01',
      questionFamilyId: familyId,
      prompt: `${name} has ${total} ${items} and shares them equally among ${groups} friends. How many ${items} are left over?`,
      answer: remainder,
      answerType: 'number',
      instructionHint: 'Divide and find the remainder.',
      solutionText: `${total} ÷ ${groups} = ${each} remainder ${remainder}. There are ${remainder} ${items} left over.`,
      misconceptionTraps: ['wrong_operation_choice', 'remainder_in_context'],
    };
  }

  // _003: How many groups?
  const groupSize = randInt(3, 9);
  const numGroups = randInt(3, 10);
  const total = groupSize * numGroups;
  const name = pick(NAMES);
  const container = pick(['bags', 'boxes', 'packets', 'trays', 'baskets']);
  const items = pick(['oranges', 'apples', 'muffins', 'cookies', 'eggs']);
  return {
    skillId: 'P3-WP-01',
    questionFamilyId: familyId,
    prompt: `${name} packs ${total} ${items} into ${container}. Each ${container.slice(0, -1)} holds ${groupSize} ${items}. How many ${container} does ${name} need?`,
    answer: numGroups,
    answerType: 'number',
    instructionHint: 'Divide the total by the group size.',
    solutionText: `${total} ÷ ${groupSize} = ${numGroups}. ${name} needs ${numGroups} ${container}.`,
    misconceptionTraps: ['wrong_operation_choice', 'misreads_question'],
  };
}

// ---------------------------------------------------------------------------
// P3-WP-02: Two-Step Word Problem
// ---------------------------------------------------------------------------

function generateTwoStep(familyId) {
  if (familyId.endsWith('_001')) {
    // Subtract twice: total - amount1 - amount2
    const total = randInt(200, 900);
    const spent1 = randInt(50, Math.floor(total / 3));
    const spent2 = randInt(50, Math.floor(total / 3));
    const remaining = total - spent1 - spent2;
    const name = pick(NAMES);
    return {
      skillId: 'P3-WP-02',
      questionFamilyId: familyId,
      prompt: `${name} has $${total}. ${name} spends $${spent1} on a bag and $${spent2} on shoes. How much money does ${name} have left?`,
      answer: remaining,
      answerType: 'number',
      instructionHint: 'Subtract both amounts from the total.',
      solutionText: `$${total} - $${spent1} = $${total - spent1}. $${total - spent1} - $${spent2} = $${remaining}. ${name} has $${remaining} left.`,
      misconceptionTraps: ['stops_after_one_step', 'wrong_operation_choice'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Add then subtract: (a + b) then total - sum  or sum - something
    const partA = randInt(30, 200);
    const partB = randInt(30, 200);
    const sum = partA + partB;
    const budget = sum + randInt(50, 300);
    const leftover = budget - sum;
    const name = pick(NAMES);
    const item1 = pick(['book', 'toy', 'shirt', 'game']);
    const item2 = pick(['pen', 'snack', 'hat', 'ball']);
    return {
      skillId: 'P3-WP-02',
      questionFamilyId: familyId,
      prompt: `${name} buys a ${item1} for $${partA} and a ${item2} for $${partB}. ${name} started with $${budget}. How much money is left?`,
      answer: leftover,
      answerType: 'number',
      instructionHint: 'First find the total spent, then subtract from the starting amount.',
      solutionText: `Total spent = $${partA} + $${partB} = $${sum}. Money left = $${budget} - $${sum} = $${leftover}.`,
      misconceptionTraps: ['stops_after_one_step', 'wrong_operation_choice'],
    };
  }

  // _003: Multiply then subtract
  const priceEach = randInt(3, 12);
  const quantity = randInt(3, 8);
  const cost = priceEach * quantity;
  const budget = cost + randInt(10, 100);
  const change = budget - cost;
  const name = pick(NAMES);
  const item = pick(['notebooks', 'pens', 'erasers', 'rulers', 'files']);
  return {
    skillId: 'P3-WP-02',
    questionFamilyId: familyId,
    prompt: `${name} buys ${quantity} ${item} at $${priceEach} each. ${name} pays with $${budget}. How much change does ${name} get?`,
    answer: change,
    answerType: 'number',
    instructionHint: 'First find the total cost (multiply), then find the change (subtract).',
    solutionText: `Total cost = ${quantity} × $${priceEach} = $${cost}. Change = $${budget} - $${cost} = $${change}.`,
    misconceptionTraps: ['stops_after_one_step', 'wrong_operation_choice', 'misreads_question'],
  };
}

// ---------------------------------------------------------------------------
// P3-WP-03: Bar Model — Part-Whole
// Auto-gradable numeric questions backed by a part_whole_bar or comparison_bar
// diagramSpec. Students read the model and find the missing value.
// ---------------------------------------------------------------------------

function generateBarModel(familyId) {
  if (familyId.endsWith('_001')) {
    // Find the total: both parts shown, whole is unknown.
    const partA = randInt(20, 150);
    const partB = randInt(15, 130);
    const total = partA + partB;
    const name = pick(NAMES);
    const colA = pick(['red', 'blue', 'green', 'yellow', 'purple']);
    const colB = pick(['white', 'orange', 'pink', 'brown', 'black']);
    const item = pick(['stickers', 'beads', 'marbles', 'stamps', 'cards', 'buttons']);
    return {
      skillId: 'P3-WP-03',
      questionFamilyId: familyId,
      prompt: `${name} has ${partA} ${colA} ${item} and ${partB} ${colB} ${item}. The bar model shows the two groups.\nHow many ${item} does ${name} have altogether?`,
      answer: total,
      answerType: 'number',
      instructionHint: 'Add the two parts shown in the bar model.',
      solutionText: `${partA} + ${partB} = ${total}. ${name} has ${total} ${item} altogether.`,
      misconceptionTraps: ['wrong_operation_choice', 'op/model-wrong-parts'],
      diagramSpec: {
        type: 'part_whole_bar',
        width: 560,
        height: 140,
        data: {
          parts: [
            { value: partA, label: `${partA}`, fill: '#dbeafe' },
            { value: partB, label: `${partB}`, fill: '#bfdbfe' },
          ],
        },
      },
    };
  }

  if (familyId.endsWith('_002')) {
    // Find the missing part: total and one part shown, other is unknown.
    const missing = randInt(20, 130);
    const known = randInt(20, 150);
    const total = missing + known;
    const name = pick(NAMES);
    const item = pick(['apples', 'books', 'stickers', 'coins', 'pencils', 'eggs', 'flowers']);
    return {
      skillId: 'P3-WP-03',
      questionFamilyId: familyId,
      prompt: `${name} has ${total} ${item} in two boxes. ${known} ${item} are in the first box. The bar model shows the total and one part.\nHow many ${item} are in the second box?`,
      answer: missing,
      answerType: 'number',
      instructionHint: 'Subtract the known part from the total.',
      solutionText: `${total} − ${known} = ${missing}. There are ${missing} ${item} in the second box.`,
      misconceptionTraps: ['wrong_operation_choice', 'op/model-wrong-parts'],
      diagramSpec: {
        type: 'part_whole_bar',
        width: 560,
        height: 140,
        data: {
          parts: [
            { value: known, label: `${known}`, fill: '#dbeafe' },
            { value: missing, label: '?', fill: '#e0f2fe' },
          ],
        },
      },
    };
  }

  // _003: Comparison model — find the difference.
  const smaller = randInt(20, 180);
  const diff = randInt(10, 100);
  const larger = smaller + diff;
  const nameA = pick(NAMES);
  let nameB = pick(NAMES);
  while (nameB === nameA) nameB = pick(NAMES);
  const item = pick(['stamps', 'marbles', 'stickers', 'cards', 'books', 'coins', 'beads']);
  return {
    skillId: 'P3-WP-03',
    questionFamilyId: familyId,
    prompt: `${nameA} has ${smaller} ${item}. ${nameB} has ${larger} ${item}. The bar model compares their amounts.\nHow many more ${item} does ${nameB} have than ${nameA}?`,
    answer: diff,
    answerType: 'number',
    instructionHint: 'Subtract the smaller amount from the larger amount.',
    solutionText: `${larger} − ${smaller} = ${diff}. ${nameB} has ${diff} more ${item} than ${nameA}.`,
    misconceptionTraps: ['wrong_operation_choice', 'misreads_question'],
    diagramSpec: {
      type: 'comparison_bar',
      width: 560,
      height: 160,
      data: {
        leftValue: smaller,
        rightValue: larger,
        leftLabel: `${nameA}: ${smaller}`,
        rightLabel: `${nameB}: ${larger}`,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P3-WP-01': generateShareEqually,
  'P3-WP-02': generateTwoStep,
  'P3-WP-03': generateBarModel,
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
