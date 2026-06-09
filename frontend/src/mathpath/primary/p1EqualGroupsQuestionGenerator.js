import { getSkill } from './p1EqualGroupsSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p1EqualGroupsQuestionFamilies.js';
import {
  equalGroupsDiagram,
  pictureCollectionDiagram,
} from './p1DiagramHelpers.js';

const OBJECTS = ['counters', 'stickers', 'sweets', 'pencils', 'cookies', 'marbles'];
const NAMES = ['Tom', 'Ravi', 'Ali', 'Siti', 'Lynn', 'Mei', 'Priya', 'Kumar'];

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

// --- P1-EQG-01: Make equal groups ---
function generateMakeEqualGroups(familyId) {
  const isSmall = familyId.endsWith('_001');
  const obj = pick(OBJECTS);

  let groups, total, itemsPerGroup;
  if (isSmall) {
    groups = randInt(2, 3);
    itemsPerGroup = randInt(2, 4);
    total = groups * itemsPerGroup;
    // Ensure total is 6–12
    while (total < 6 || total > 12) {
      groups = randInt(2, 3);
      itemsPerGroup = randInt(2, 4);
      total = groups * itemsPerGroup;
    }
  } else {
    groups = randInt(2, 4);
    itemsPerGroup = randInt(3, 5);
    total = groups * itemsPerGroup;
    // Ensure total is 12–20
    while (total < 12 || total > 20) {
      groups = randInt(2, 4);
      itemsPerGroup = randInt(3, 5);
      total = groups * itemsPerGroup;
    }
  }

  return {
    skillId: 'P1-EQG-01',
    questionFamilyId: familyId,
    prompt: `Put ${total} ${obj} into ${groups} equal groups. How many ${obj} in each group?`,
    answer: itemsPerGroup,
    answerType: 'number',
    instructionHint: 'Write your answer in numerals.',
    solutionText: `${total} ÷ ${groups} = ${itemsPerGroup}. Each group has ${itemsPerGroup} ${obj}.`,
    diagramSpec: equalGroupsDiagram(groups, itemsPerGroup, { title: `${total} ${obj} in ${groups} groups` }),
    misconceptionTraps: ['equal_groups_uneven'],
  };
}

// --- P1-EQG-02: Identify unequal groups ---
function generateIdentifyUnequalGroups(familyId) {
  const isChooseEqual = familyId.endsWith('_001');
  const obj = pick(OBJECTS);

  if (isChooseEqual) {
    // "Which set shows equal groups?" — multiple choice
    const equalCount = randInt(3, 5);
    const numGroups = randInt(2, 3);

    // Build equal option
    const equalOption = { groups: numGroups, counts: Array(numGroups).fill(equalCount), label: `${numGroups} groups of ${equalCount}` };

    // Build 3 unequal distractors
    const distractors = [];
    for (let d = 0; d < 3; d++) {
      const counts = [];
      for (let g = 0; g < numGroups; g++) {
        counts.push(equalCount + (g === 0 ? 1 : -(d + 1) % 2));
      }
      // Make sure they are actually unequal
      if (new Set(counts).size === 1) counts[0] += 1;
      distractors.push({ groups: numGroups, counts, label: counts.join(', ') });
    }

    const options = shuffle([equalOption, ...distractors]);
    const correctIndex = options.indexOf(equalOption);
    const labels = ['A', 'B', 'C', 'D'];

    const categories = options.map((opt, i) => ({
      label: `${labels[i]}: ${opt.counts.join(', ')} ${obj}`,
      count: opt.counts.reduce((a, b) => a + b, 0),
    }));

    return {
      skillId: 'P1-EQG-02',
      questionFamilyId: familyId,
      prompt: `Which set shows equal groups of ${obj}?\n${options.map((opt, i) => `${labels[i]}) ${opt.counts.join(', ')}`).join('\n')}`,
      answer: labels[correctIndex],
      answerType: 'choice',
      choices: labels.slice(0, 4),
      instructionHint: 'Choose the letter.',
      solutionText: `${labels[correctIndex]} shows equal groups — every group has ${equalCount} ${obj}.`,
      diagramSpec: pictureCollectionDiagram(categories, { symbol: '●', title: 'Which groups are equal?' }),
      misconceptionTraps: ['equal_groups_by_appearance'],
    };
  }

  // "Are these groups equal?" — yes/no
  const numGroups = randInt(2, 3);
  const baseCount = randInt(2, 5);
  const isEqual = Math.random() < 0.5;

  const counts = [];
  for (let g = 0; g < numGroups; g++) {
    counts.push(baseCount);
  }
  if (!isEqual) {
    counts[numGroups - 1] = baseCount + randInt(1, 2);
  }

  const categories = counts.map((c, i) => ({
    label: `Group ${i + 1}`,
    count: c,
  }));

  return {
    skillId: 'P1-EQG-02',
    questionFamilyId: familyId,
    prompt: `Look at the groups of ${obj}: ${counts.join(', ')}. Are these groups equal?`,
    answer: isEqual ? 'Yes' : 'No',
    answerType: 'choice',
    choices: ['Yes', 'No'],
    instructionHint: 'Choose Yes or No.',
    solutionText: isEqual
      ? `Yes — every group has ${baseCount} ${obj}.`
      : `No — the groups have different numbers of ${obj} (${counts.join(', ')}).`,
    diagramSpec: pictureCollectionDiagram(categories, { symbol: '●', title: `${numGroups} groups of ${obj}` }),
    misconceptionTraps: ['equal_groups_by_appearance'],
  };
}

// --- P1-EQG-03: Repeated addition readiness ---
function generateRepeatedAddition(familyId) {
  const isSmall = familyId.endsWith('_001');
  const obj = pick(OBJECTS);

  let groups, itemsPerGroup;
  if (isSmall) {
    groups = randInt(2, 3);
    itemsPerGroup = randInt(2, 5);
  } else {
    groups = randInt(3, 5);
    itemsPerGroup = randInt(2, 5);
  }

  const total = groups * itemsPerGroup;
  const addExpr = Array(groups).fill(String(itemsPerGroup)).join(' + ');

  return {
    skillId: 'P1-EQG-03',
    questionFamilyId: familyId,
    prompt: `There are ${groups} groups of ${itemsPerGroup} ${obj}. How many ${obj} altogether?`,
    answer: total,
    answerType: 'number',
    instructionHint: 'Write your answer in numerals.',
    solutionText: `${addExpr} = ${total}. There are ${total} ${obj} altogether.`,
    diagramSpec: equalGroupsDiagram(groups, itemsPerGroup, { title: `${groups} groups of ${itemsPerGroup} ${obj}` }),
    misconceptionTraps: ['repeated_add_counts_groups', 'repeated_add_one_group'],
  };
}

// --- P1-EQG-04: Share objects equally ---
function generateShareEqually(familyId) {
  const isExact = familyId.endsWith('_001');
  const obj = pick(OBJECTS);

  let people, total, each;
  if (isExact) {
    // Family 1: guaranteed exact sharing
    people = randInt(2, 4);
    each = randInt(2, 5);
    total = people * each;
  } else {
    // Family 2: share among 2–4 (still exact, different range)
    people = randInt(2, 4);
    each = randInt(3, 6);
    total = people * each;
  }

  const names = shuffle(NAMES).slice(0, people);
  const nameList = names.join(', ');

  return {
    skillId: 'P1-EQG-04',
    questionFamilyId: familyId,
    prompt: `Share ${total} ${obj} equally among ${people} children. How many ${obj} does each child get?`,
    answer: each,
    answerType: 'number',
    instructionHint: 'Write your answer in numerals.',
    solutionText: `${total} ÷ ${people} = ${each}. Each child gets ${each} ${obj}.`,
    diagramSpec: equalGroupsDiagram(people, each, { title: `${total} ${obj} shared among ${people}` }),
    misconceptionTraps: ['sharing_gives_all_to_one', 'sharing_unequal'],
  };
}

// --- P1-EQG-05: Identify leftovers ---
function generateLeftovers(familyId) {
  const isSmallLeftover = familyId.endsWith('_001');
  const obj = pick(OBJECTS);

  if (isSmallLeftover) {
    // Family 1: find how many are left over (non-zero remainder)
    const people = randInt(2, 4);
    const each = randInt(2, 4);
    const leftover = randInt(1, people - 1);
    const total = people * each + leftover;

    return {
      skillId: 'P1-EQG-05',
      questionFamilyId: familyId,
      prompt: `Share ${total} ${obj} equally among ${people} children. How many ${obj} are left over?`,
      answer: leftover,
      answerType: 'number',
      instructionHint: 'Write your answer in numerals.',
      solutionText: `Each child gets ${each} ${obj}. ${people} × ${each} = ${people * each}. ${total} − ${people * each} = ${leftover} left over.`,
      diagramSpec: equalGroupsDiagram(people, each, { title: `${total} ${obj} shared among ${people}` }),
      misconceptionTraps: ['leftover_ignored', 'leftover_forced_equal'],
    };
  }

  // Family 2: is the sharing exact or does it have a leftover?
  const people = randInt(2, 4);
  const each = randInt(2, 5);
  const hasLeftover = Math.random() < 0.5;
  const leftover = hasLeftover ? randInt(1, people - 1) : 0;
  const total = people * each + leftover;

  return {
    skillId: 'P1-EQG-05',
    questionFamilyId: familyId,
    prompt: `${total} ${obj} are shared equally among ${people} children. Is the sharing exact or are there leftovers?`,
    answer: hasLeftover ? 'Leftovers' : 'Exact',
    answerType: 'choice',
    choices: ['Exact', 'Leftovers'],
    instructionHint: 'Choose Exact or Leftovers.',
    solutionText: hasLeftover
      ? `Each child gets ${each}. ${people} × ${each} = ${people * each}. There are ${leftover} left over, so there are leftovers.`
      : `Each child gets ${each}. ${people} × ${each} = ${total}. All ${obj} are shared with none left over, so it is exact.`,
    diagramSpec: equalGroupsDiagram(people, each, { title: `${total} ${obj} shared among ${people}` }),
    misconceptionTraps: ['leftover_ignored', 'leftover_gives_total'],
  };
}

const generatorsBySkill = {
  'P1-EQG-01': generateMakeEqualGroups,
  'P1-EQG-02': generateIdentifyUnequalGroups,
  'P1-EQG-03': generateRepeatedAddition,
  'P1-EQG-04': generateShareEqually,
  'P1-EQG-05': generateLeftovers,
};

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
    visualRequirement: family.visualRequirement || skill.visualRequirement,
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
