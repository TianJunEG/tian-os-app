import { getSkill } from './p2AddSubSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p2AddSubQuestionFamilies.js';

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const SINGAPORE_NAMES = ['Ali', 'Ben', 'Mei', 'Siti', 'Raj', 'Tom', 'Lily', 'Sarah', 'John', 'Mary'];

// ---------------------------------------------------------------------------
// P2-AS-01: Mental Addition of 3-Digit and Ones/Tens/Hundreds
// ---------------------------------------------------------------------------

function generateMentalAdd(familyId) {
  if (familyId.endsWith('_001')) {
    // Add ones to a 3-digit number
    const b = randInt(1, 9);
    const aHundreds = randInt(1, 9);
    const aTens = randInt(0, 9);
    const aOnes = randInt(0, 9 - b); // ensure ones don't overflow for clean mental math
    const a = aHundreds * 100 + aTens * 10 + aOnes;
    const ans = a + b;

    return {
      skillId: 'P2-AS-01',
      questionFamilyId: familyId,
      prompt: `${a} + ${b} = ?`,
      answer: ans,
      answerType: 'number',
      instructionHint: 'Work it out in your head.',
      solutionText: `Add ${b} ones to ${a}. The ones digit ${aOnes} + ${b} = ${aOnes + b}. Answer: ${ans}.`,
      misconceptionTraps: ['mental_add_place_error'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Add tens (multiple of 10) to a 3-digit number
    const bTens = randInt(1, 9);
    const b = bTens * 10;
    const aHundreds = randInt(1, 9);
    const aTens = randInt(0, 9 - bTens); // keep sum within same hundreds for clean mental math
    const aOnes = randInt(0, 9);
    const a = aHundreds * 100 + aTens * 10 + aOnes;
    const ans = a + b;

    return {
      skillId: 'P2-AS-01',
      questionFamilyId: familyId,
      prompt: `${a} + ${b} = ?`,
      answer: ans,
      answerType: 'number',
      instructionHint: 'Work it out in your head.',
      solutionText: `Add ${bTens} tens to ${a}. The tens digit ${aTens} + ${bTens} = ${aTens + bTens}. Answer: ${ans}.`,
      misconceptionTraps: ['mental_add_place_error'],
    };
  }

  // _003: Add hundreds (multiple of 100) to a 3-digit number
  const bHundreds = randInt(1, 8);
  const b = bHundreds * 100;
  const aHundreds = randInt(1, 9 - bHundreds); // keep sum <= 999
  const aTens = randInt(0, 9);
  const aOnes = randInt(0, 9);
  const a = aHundreds * 100 + aTens * 10 + aOnes;
  const ans = a + b;

  return {
    skillId: 'P2-AS-01',
    questionFamilyId: familyId,
    prompt: `${a} + ${b} = ?`,
    answer: ans,
    answerType: 'number',
    instructionHint: 'Work it out in your head.',
    solutionText: `Add ${bHundreds} hundreds to ${a}. The hundreds digit ${aHundreds} + ${bHundreds} = ${aHundreds + bHundreds}. Answer: ${ans}.`,
    misconceptionTraps: ['mental_add_place_error'],
  };
}

// ---------------------------------------------------------------------------
// P2-AS-02: Mental Subtraction of Ones/Tens/Hundreds from 3-Digit
// ---------------------------------------------------------------------------

function generateMentalSub(familyId) {
  if (familyId.endsWith('_001')) {
    // Subtract ones from a 3-digit number
    const b = randInt(1, 9);
    const aHundreds = randInt(1, 9);
    const aTens = randInt(0, 9);
    const aOnes = randInt(b, 9); // ensure no borrowing needed
    const a = aHundreds * 100 + aTens * 10 + aOnes;
    const ans = a - b;

    return {
      skillId: 'P2-AS-02',
      questionFamilyId: familyId,
      prompt: `${a} - ${b} = ?`,
      answer: ans,
      answerType: 'number',
      instructionHint: 'Work it out in your head.',
      solutionText: `Subtract ${b} ones from ${a}. The ones digit ${aOnes} - ${b} = ${aOnes - b}. Answer: ${ans}.`,
      misconceptionTraps: ['mental_sub_place_error'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Subtract tens (multiple of 10) from a 3-digit number
    const bTens = randInt(1, 9);
    const b = bTens * 10;
    const aHundreds = randInt(1, 9);
    const aTens = randInt(bTens, 9); // ensure no borrowing from hundreds
    const aOnes = randInt(0, 9);
    const a = aHundreds * 100 + aTens * 10 + aOnes;
    const ans = a - b;

    return {
      skillId: 'P2-AS-02',
      questionFamilyId: familyId,
      prompt: `${a} - ${b} = ?`,
      answer: ans,
      answerType: 'number',
      instructionHint: 'Work it out in your head.',
      solutionText: `Subtract ${bTens} tens from ${a}. The tens digit ${aTens} - ${bTens} = ${aTens - bTens}. Answer: ${ans}.`,
      misconceptionTraps: ['mental_sub_place_error'],
    };
  }

  // _003: Subtract hundreds (multiple of 100) from a 3-digit number
  const aHundreds = randInt(2, 9);
  const bHundreds = randInt(1, aHundreds - 1); // ensure result >= 100
  const b = bHundreds * 100;
  const aTens = randInt(0, 9);
  const aOnes = randInt(0, 9);
  const a = aHundreds * 100 + aTens * 10 + aOnes;
  const ans = a - b;

  return {
    skillId: 'P2-AS-02',
    questionFamilyId: familyId,
    prompt: `${a} - ${b} = ?`,
    answer: ans,
    answerType: 'number',
    instructionHint: 'Work it out in your head.',
    solutionText: `Subtract ${bHundreds} hundreds from ${a}. The hundreds digit ${aHundreds} - ${bHundreds} = ${aHundreds - bHundreds}. Answer: ${ans}.`,
    misconceptionTraps: ['mental_sub_place_error'],
  };
}

// ---------------------------------------------------------------------------
// P2-AS-03: Addition within 1000 (column method)
// ---------------------------------------------------------------------------

function generateColumnAdd(familyId) {
  if (familyId.endsWith('_001')) {
    // No regrouping: each column sum <= 9
    let a, b;
    for (let attempt = 0; attempt < 200; attempt++) {
      a = randInt(100, 500);
      b = randInt(100, 899 - a);
      const ap = String(a).padStart(3, '0');
      const bp = String(b).padStart(3, '0');
      const noRegroup = [0, 1, 2].every((i) => Number(ap[i]) + Number(bp[i]) <= 9);
      if (noRegroup && a + b <= 999) break;
    }
    const ans = a + b;

    return {
      skillId: 'P2-AS-03',
      questionFamilyId: familyId,
      prompt: `${a} + ${b} = ?`,
      answer: ans,
      answerType: 'number',
      instructionHint: 'Use the column method. Line up the digits.',
      solutionText: `${a} + ${b} = ${ans}. No regrouping needed.`,
      misconceptionTraps: ['regroups_wrong_column'],
    };
  }

  if (familyId.endsWith('_002')) {
    // With regrouping: at least one column sum > 9
    let a, b;
    for (let attempt = 0; attempt < 200; attempt++) {
      a = randInt(100, 600);
      b = randInt(100, 999 - a);
      const ap = String(a).padStart(3, '0');
      const bp = String(b).padStart(3, '0');
      const needsRegroup = [0, 1, 2].some((i) => Number(ap[i]) + Number(bp[i]) >= 10);
      if (needsRegroup && a + b <= 999) break;
    }
    const ans = a + b;

    return {
      skillId: 'P2-AS-03',
      questionFamilyId: familyId,
      prompt: `${a} + ${b} = ?`,
      answer: ans,
      answerType: 'number',
      instructionHint: 'Use the column method. Remember to regroup.',
      solutionText: `${a} + ${b} = ${ans}. Regroup when a column exceeds 9.`,
      misconceptionTraps: ['forgets_to_regroup', 'regroups_wrong_column'],
    };
  }

  // _003: Word context addition
  const a = randInt(100, 600);
  const b = randInt(100, 999 - a);
  const ans = a + b;
  const name1 = pick(SINGAPORE_NAMES);
  let name2 = pick(SINGAPORE_NAMES);
  while (name2 === name1) name2 = pick(SINGAPORE_NAMES);
  const contexts = [
    `${name1} has ${a} stickers. ${name2} gives ${name1} ${b} more stickers. How many stickers does ${name1} have now?`,
    `There are ${a} red beads and ${b} blue beads in a box. How many beads are there altogether?`,
    `${name1} saved $${a}. ${name2} saved $${b}. How much did they save in total?`,
    `A school has ${a} pupils in the morning session and ${b} pupils in the afternoon session. How many pupils are there in total?`,
  ];

  return {
    skillId: 'P2-AS-03',
    questionFamilyId: familyId,
    prompt: pick(contexts),
    answer: ans,
    answerType: 'number',
    instructionHint: 'Read the problem carefully. Use the column method to add.',
    solutionText: `${a} + ${b} = ${ans}.`,
    misconceptionTraps: ['forgets_to_regroup'],
  };
}

// ---------------------------------------------------------------------------
// P2-AS-04: Subtraction within 1000 (column method)
// ---------------------------------------------------------------------------

function generateColumnSub(familyId) {
  if (familyId.endsWith('_001')) {
    // No borrowing: each top digit >= corresponding bottom digit
    let a, b;
    for (let attempt = 0; attempt < 200; attempt++) {
      a = randInt(200, 999);
      b = randInt(100, a - 1);
      const ap = String(a).padStart(3, '0');
      const bp = String(b).padStart(3, '0');
      const noBorrow = [0, 1, 2].every((i) => Number(ap[i]) >= Number(bp[i]));
      if (noBorrow) break;
    }
    const ans = a - b;

    return {
      skillId: 'P2-AS-04',
      questionFamilyId: familyId,
      prompt: `${a} - ${b} = ?`,
      answer: ans,
      answerType: 'number',
      instructionHint: 'Use the column method.',
      solutionText: `${a} - ${b} = ${ans}. No borrowing needed.`,
      misconceptionTraps: ['subtracts_smaller_from_larger'],
    };
  }

  if (familyId.endsWith('_002')) {
    // With borrowing: at least one top digit < corresponding bottom digit
    let a, b;
    for (let attempt = 0; attempt < 200; attempt++) {
      a = randInt(200, 999);
      b = randInt(100, a - 1);
      const ap = String(a).padStart(3, '0');
      const bp = String(b).padStart(3, '0');
      const needsBorrow = [0, 1, 2].some((i) => Number(ap[i]) < Number(bp[i]));
      if (needsBorrow) break;
    }
    const ans = a - b;

    return {
      skillId: 'P2-AS-04',
      questionFamilyId: familyId,
      prompt: `${a} - ${b} = ?`,
      answer: ans,
      answerType: 'number',
      instructionHint: 'Use the column method. You will need to borrow.',
      solutionText: `${a} - ${b} = ${ans}. Borrow from the next column when needed.`,
      misconceptionTraps: ['borrows_incorrectly', 'subtracts_smaller_from_larger'],
    };
  }

  // _003: Word context subtraction
  const a = randInt(300, 999);
  const b = randInt(100, a - 1);
  const ans = a - b;
  const name1 = pick(SINGAPORE_NAMES);
  let name2 = pick(SINGAPORE_NAMES);
  while (name2 === name1) name2 = pick(SINGAPORE_NAMES);
  const contexts = [
    `${name1} has ${a} marbles. ${name1} gives ${b} marbles to ${name2}. How many marbles does ${name1} have left?`,
    `A shop had ${a} books. It sold ${b} books. How many books were left?`,
    `${name1} had $${a}. ${name1} spent $${b}. How much money does ${name1} have left?`,
    `There were ${a} children at a camp. ${b} children went home. How many children were still at the camp?`,
  ];

  return {
    skillId: 'P2-AS-04',
    questionFamilyId: familyId,
    prompt: pick(contexts),
    answer: ans,
    answerType: 'number',
    instructionHint: 'Read the problem carefully. Use the column method to subtract.',
    solutionText: `${a} - ${b} = ${ans}.`,
    misconceptionTraps: ['borrows_incorrectly'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P2-AS-01': generateMentalAdd,
  'P2-AS-02': generateMentalSub,
  'P2-AS-03': generateColumnAdd,
  'P2-AS-04': generateColumnSub,
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
