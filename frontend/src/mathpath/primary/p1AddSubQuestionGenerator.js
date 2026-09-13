import { getSkill } from './p1AddSubSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p1AddSubQuestionFamilies.js';
import {
  numberLineDiagram,
  pictureCollectionDiagram,
  objectSetDiagram,
  twoGroupsDiagram,
  comparisonModelDiagram,
  barModelDiagram,
  columnOperationDiagram,
} from './p1DiagramHelpers.js';

const NAMES_MALE = ['Tom', 'Ravi', 'Ali', 'Eric', 'Kumar', 'Peter', 'Amin', 'Bala'];
const NAMES_FEMALE = ['Siti', 'Lynn', 'Jane', 'Alice', 'Susan', 'Mei', 'Priya', 'Mrs Lee'];
const OBJECTS = ['apples', 'oranges', 'marbles', 'stickers', 'books', 'pencils', 'cookies', 'stars'];

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

// --- P1-ADD-01: Addition Within 10 ---
function generateAddWithin10(familyId) {
  const isPicture = familyId.endsWith('_001');
  const a = randInt(1, 9);
  const b = randInt(1, 10 - a);
  const answer = a + b;
  const obj = pick(OBJECTS);

  if (isPicture) {
    return {
      skillId: 'P1-ADD-01',
      questionFamilyId: familyId,
      prompt: `There are ${a} ${obj} and ${b} more ${obj}. How many ${obj} are there altogether?`,
      answer,
      answerType: 'number',
      instructionHint: 'Count all the objects.',
      solutionText: `${a} + ${b} = ${answer}. There are ${answer} ${obj} altogether.`,
      // Two SEPARATE, visually distinct groups (a, then b more) — the student
      // must still count/combine them. objectSetDiagram(obj, answer, ...) used
      // to render exactly `answer` undifferentiated dots: a flat picture of the
      // final count, nothing left to compute.
      diagramSpec: twoGroupsDiagram(obj, a, `more ${obj}`, b, { title: `${a} ${obj} and ${b} more ${obj}` }),
      misconceptionTraps: ['counts_from_one'],
    };
  }

  return {
    skillId: 'P1-ADD-01',
    questionFamilyId: familyId,
    prompt: `${a} + ${b} = ?`,
    answer,
    answerType: 'number',
    instructionHint: 'Find the sum.',
    solutionText: `${a} + ${b} = ${answer}.`,
    diagramSpec: twoGroupsDiagram(obj, a, `more ${obj}`, b, { title: `${a} + ${b}` }),
    misconceptionTraps: ['counts_from_one'],
  };
}

// --- P1-ADD-02: Subtraction Within 10 ---
function generateSubWithin10(familyId) {
  const isPicture = familyId.endsWith('_001');
  const a = randInt(2, 10);
  const b = randInt(1, a - 1);
  const answer = a - b;
  const obj = pick(OBJECTS);

  if (isPicture) {
    return {
      skillId: 'P1-ADD-02',
      questionFamilyId: familyId,
      prompt: `There are ${a} ${obj}. ${b} are taken away. How many ${obj} are left?`,
      answer,
      answerType: 'number',
      instructionHint: 'Cross out the ones taken away and count what is left.',
      solutionText: `${a} - ${b} = ${answer}. There are ${answer} ${obj} left.`,
      diagramSpec: objectSetDiagram(obj, a, { crossedOut: b, title: `${a} ${obj} take away ${b}` }),
      misconceptionTraps: ['subtracts_wrong_direction'],
    };
  }

  return {
    skillId: 'P1-ADD-02',
    questionFamilyId: familyId,
    prompt: `${a} - ${b} = ?`,
    answer,
    answerType: 'number',
    instructionHint: 'Find the difference.',
    solutionText: `${a} - ${b} = ${answer}.`,
    diagramSpec: objectSetDiagram(obj, a, { crossedOut: b, title: `${a} - ${b}` }),
    misconceptionTraps: ['subtracts_wrong_direction'],
  };
}

// --- P1-ADD-03: Addition Facts to 10 (fluency) ---
function generateAddFacts10(familyId) {
  const a = randInt(0, 10);
  const b = randInt(0, 10 - a);
  const answer = a + b;

  return {
    skillId: 'P1-ADD-03',
    questionFamilyId: familyId,
    prompt: `${a} + ${b} = ?`,
    answer,
    answerType: 'number',
    instructionHint: 'Answer as quickly as you can.',
    solutionText: `${a} + ${b} = ${answer}.`,
    misconceptionTraps: ['counts_from_one'],
  };
}

// --- P1-ADD-04: Subtraction Facts to 10 (fluency) ---
function generateSubFacts10(familyId) {
  const a = randInt(1, 10);
  const b = randInt(0, a);
  const answer = a - b;

  return {
    skillId: 'P1-ADD-04',
    questionFamilyId: familyId,
    prompt: `${a} - ${b} = ?`,
    answer,
    answerType: 'number',
    instructionHint: 'Answer as quickly as you can.',
    solutionText: `${a} - ${b} = ${answer}.`,
    misconceptionTraps: ['subtracts_wrong_direction'],
  };
}

// --- P1-ADD-05: Addition Within 20 (no regrouping) ---
function generateAddWithin20(familyId) {
  const isTeenAndOnes = familyId.endsWith('_001');

  if (isTeenAndOnes) {
    const teen = randInt(11, 17);
    const ones = randInt(1, 20 - teen);
    const answer = teen + ones;
    // Mark only the STARTING point — the student counts on `ones` steps and
    // reads their own landing spot off the axis's own tick labels. Marking the
    // answer's position too (as this used to) is a second, explicit "you land
    // here" callout that hands the answer over before any counting happens.
    const points = [
      { value: teen, label: String(teen) },
    ];
    return {
      skillId: 'P1-ADD-05',
      questionFamilyId: familyId,
      prompt: `${teen} + ${ones} = ?`,
      answer,
      answerType: 'number',
      instructionHint: 'Add the ones to the teen number.',
      solutionText: `${teen} + ${ones} = ${answer}. Start at ${teen} and count on ${ones}.`,
      diagramSpec: numberLineDiagram({ start: 0, end: 20, step: 1, points, title: `${teen} + ${ones}` }),
      misconceptionTraps: ['forgets_teen_structure'],
    };
  }

  const a = randInt(10, 18);
  const b = randInt(1, 20 - a);
  const answer = a + b;
  const points = [
    { value: a, label: String(a) },
  ];
  return {
    skillId: 'P1-ADD-05',
    questionFamilyId: familyId,
    prompt: `${a} + ${b} = ?`,
    answer,
    answerType: 'number',
    instructionHint: 'Find the sum.',
    solutionText: `${a} + ${b} = ${answer}.`,
    diagramSpec: numberLineDiagram({ start: 0, end: 20, step: 1, points, title: `${a} + ${b}` }),
    misconceptionTraps: ['forgets_teen_structure'],
  };
}

// --- P1-ADD-06: Subtraction Within 20 (no regrouping) ---
function generateSubWithin20(familyId) {
  const isFromTeen = familyId.endsWith('_001');

  if (isFromTeen) {
    const teen = randInt(11, 19);
    const ones = randInt(1, teen - 10);
    const answer = teen - ones;
    // Same fix as P1-ADD-05: mark only the starting point.
    const points = [
      { value: teen, label: String(teen) },
    ];
    return {
      skillId: 'P1-ADD-06',
      questionFamilyId: familyId,
      prompt: `${teen} - ${ones} = ?`,
      answer,
      answerType: 'number',
      instructionHint: 'Subtract the ones from the teen number.',
      solutionText: `${teen} - ${ones} = ${answer}. Start at ${teen} and count back ${ones}.`,
      diagramSpec: numberLineDiagram({ start: 0, end: 20, step: 1, points, title: `${teen} - ${ones}` }),
      misconceptionTraps: ['subtracts_wrong_direction'],
    };
  }

  const a = randInt(11, 20);
  const b = randInt(1, a - 10);
  const answer = a - b;
  const points = [
    { value: a, label: String(a) },
  ];
  return {
    skillId: 'P1-ADD-06',
    questionFamilyId: familyId,
    prompt: `${a} - ${b} = ?`,
    answer,
    answerType: 'number',
    instructionHint: 'Find the difference.',
    solutionText: `${a} - ${b} = ${answer}.`,
    diagramSpec: numberLineDiagram({ start: 0, end: 20, step: 1, points, title: `${a} - ${b}` }),
    misconceptionTraps: ['subtracts_wrong_direction'],
  };
}

// --- P1-ADD-07: Addition Within 40 ---
function generateAddWithin40(familyId) {
  const a = randInt(11, 30);
  const b = randInt(5, 40 - a);
  const answer = a + b;

  return {
    skillId: 'P1-ADD-07',
    questionFamilyId: familyId,
    prompt: `${a} + ${b} = ?`,
    answer,
    answerType: 'number',
    instructionHint: 'Add the tens, then add the ones.',
    solutionText: `${a} + ${b} = ${answer}. Tens: ${Math.floor(a / 10)} + ${Math.floor(b / 10)} = ${Math.floor(a / 10) + Math.floor(b / 10)}. Ones: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}.`,
    diagramSpec: columnOperationDiagram(a, b, '+', { title: `${a} + ${b}` }),
    workingTemplate: { format: 'column', boxes: 4, operatorCircle: true },
    misconceptionTraps: ['adds_ones_to_tens'],
  };
}

// --- P1-ADD-08: Subtraction Within 40 ---
function generateSubWithin40(familyId) {
  const a = randInt(15, 40);
  const b = randInt(5, a - 5);
  // Ensure ones digit of a >= ones digit of b (no regrouping for basic P1)
  let aa = a;
  let bb = b;
  if ((aa % 10) < (bb % 10)) {
    bb = Math.floor(bb / 10) * 10 + randInt(0, aa % 10);
  }
  const answer = aa - bb;

  return {
    skillId: 'P1-ADD-08',
    questionFamilyId: familyId,
    prompt: `${aa} - ${bb} = ?`,
    answer,
    answerType: 'number',
    instructionHint: 'Subtract the tens, then subtract the ones.',
    solutionText: `${aa} - ${bb} = ${answer}. Tens: ${Math.floor(aa / 10)} - ${Math.floor(bb / 10)} = ${Math.floor(aa / 10) - Math.floor(bb / 10)}. Ones: ${aa % 10} - ${bb % 10} = ${(aa % 10) - (bb % 10)}.`,
    diagramSpec: columnOperationDiagram(aa, bb, '-', { title: `${aa} - ${bb}` }),
    workingTemplate: { format: 'column', boxes: 4, operatorCircle: true },
    misconceptionTraps: ['subtracts_smaller_from_larger_digit'],
  };
}

// --- P1-ADD-09: Word Problems (within 20) ---
function generateWordProblem(familyId) {
  const isJoin = familyId.endsWith('_001');
  const name = pick([...NAMES_MALE, ...NAMES_FEMALE]);
  const obj = pick(OBJECTS);

  if (isJoin) {
    const a = randInt(3, 12);
    const b = randInt(2, 18 - a);
    const answer = a + b;
    return {
      skillId: 'P1-ADD-09',
      questionFamilyId: familyId,
      prompt: `${name} has ${a} ${obj}. ${name} gets ${b} more ${obj}. How many ${obj} does ${name} have now?`,
      answer,
      answerType: 'number',
      instructionHint: 'Read the problem. Decide whether to add or subtract.',
      solutionText: `${name} had ${a} and got ${b} more. ${a} + ${b} = ${answer}. ${name} has ${answer} ${obj} now.`,
      // A "join" word problem has no independently-given whole (the total IS the
      // answer) — barModelDiagram(answer, a, ...) used to pass the answer itself
      // as the diagram's `whole`, which the renderer prints as a raw number next
      // to the bar regardless of the "Total: ?" label text. Show the two GIVEN
      // addends as two bars instead; nothing computed is ever passed in.
      diagramSpec: comparisonModelDiagram(a, b, { leftLabel: `Had: ${a}`, rightLabel: `Got: ${b}`, mode: 'items', title: 'Word problem' }),
      workingTemplate: { format: 'equation', boxes: 3, operatorCircle: true },
      misconceptionTraps: ['wrong_operation_word_problem'],
    };
  }

  const a = randInt(8, 18);
  const b = randInt(2, a - 2);
  const answer = a - b;
  return {
    skillId: 'P1-ADD-09',
    questionFamilyId: familyId,
    prompt: `${name} has ${a} ${obj}. ${name} gives away ${b} ${obj}. How many ${obj} does ${name} have left?`,
    answer,
    answerType: 'number',
    instructionHint: 'Read the problem. Decide whether to add or subtract.',
    solutionText: `${name} had ${a} and gave away ${b}. ${a} - ${b} = ${answer}. ${name} has ${answer} ${obj} left.`,
    // A "separate" word problem DOES have a given whole (`a`, "Had: a") and a
    // given part (`b`, "Gave away: b") — barModelDiagram(a, b, ...) leaves the
    // implicit part2 (= a - b = the answer) unprinted, same safe pattern as
    // P1-MON-06's change diagrams. The old call passed `answer` itself as
    // part1, which the renderer prints as a raw number regardless of the
    // "Left: ?" label text.
    diagramSpec: barModelDiagram(a, b, { part1Label: `Gave away: ${b}`, part2Label: `Left: ?`, wholeLabel: `Had: ${a}`, title: 'Word problem' }),
    workingTemplate: { format: 'equation', boxes: 3, operatorCircle: true },
    misconceptionTraps: ['wrong_operation_word_problem'],
  };
}

// --- P1-ADD-10: Missing Number in Equation ---
function generateMissingNumber(familyId) {
  const isAddition = familyId.endsWith('_001');

  if (isAddition) {
    const answer = randInt(1, 8);
    const total = randInt(answer + 1, 10);
    const given = total - answer;
    const obj = pick(OBJECTS);
    return {
      skillId: 'P1-ADD-10',
      questionFamilyId: familyId,
      prompt: `${given} + ? = ${total}`,
      answer,
      answerType: 'number',
      instructionHint: 'What number goes in the box?',
      solutionText: `${given} + ? = ${total}. ? = ${total} - ${given} = ${answer}.`,
      diagramSpec: objectSetDiagram(obj, total, { title: `${given} + ? = ${total}` }),
      misconceptionTraps: ['missing_number_adds_all'],
    };
  }

  const total = randInt(4, 10);
  const answer = randInt(1, total - 1);
  const result = total - answer;
  const obj = pick(OBJECTS);
  return {
    skillId: 'P1-ADD-10',
    questionFamilyId: familyId,
    prompt: `${total} - ? = ${result}`,
    answer,
    answerType: 'number',
    instructionHint: 'What number goes in the box?',
    solutionText: `${total} - ? = ${result}. ? = ${total} - ${result} = ${answer}.`,
    // `crossedOut` renders as a visually distinct, separately-counted group —
    // fine when it's a GIVEN quantity (e.g. P1-ADD-02's "take away b", stated in
    // the prompt), but here the missing subtrahend IS the answer, so crossing
    // out exactly `answer` dots let the student read it off by counting the
    // crossed-out group. Just show the given total, ungrouped (matches the
    // addition sibling above, which never crosses anything out either).
    diagramSpec: objectSetDiagram(obj, total, { title: `${total} - ? = ${result}` }),
    misconceptionTraps: ['missing_number_adds_all'],
  };
}

const generatorsBySkill = {
  'P1-ADD-01': generateAddWithin10,
  'P1-ADD-02': generateSubWithin10,
  'P1-ADD-03': generateAddFacts10,
  'P1-ADD-04': generateSubFacts10,
  'P1-ADD-05': generateAddWithin20,
  'P1-ADD-06': generateSubWithin20,
  'P1-ADD-07': generateAddWithin40,
  'P1-ADD-08': generateSubWithin40,
  'P1-ADD-09': generateWordProblem,
  'P1-ADD-10': generateMissingNumber,
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
