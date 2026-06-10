import { getSkill } from './p3AddSubSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p3AddSubQuestionFamilies.js';

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ---------------------------------------------------------------------------
// P3-AS-01: Mental Addition (two 2-digit numbers)
// ---------------------------------------------------------------------------

function generateMentalAdd(familyId) {
  if (familyId.endsWith('_001')) {
    // No carry: ones sum <= 9
    const aOnes = randInt(1, 4);
    const bOnes = randInt(1, 9 - aOnes);
    const aTens = randInt(1, 7);
    const bTens = randInt(1, 8 - aTens);
    const a = aTens * 10 + aOnes;
    const b = bTens * 10 + bOnes;
    const ans = a + b;

    return {
      skillId: 'P3-AS-01',
      questionFamilyId: familyId,
      prompt: `${a} + ${b} = ?`,
      answer: ans,
      answerType: 'number',
      instructionHint: 'Work it out in your head.',
      solutionText: `${aTens * 10} + ${bTens * 10} = ${(aTens + bTens) * 10}. ${aOnes} + ${bOnes} = ${aOnes + bOnes}. Total = ${ans}.`,
      misconceptionTraps: ['adds_ones_to_tens'],
    };
  }

  if (familyId.endsWith('_002')) {
    // With carry: ones sum > 9
    const aOnes = randInt(3, 9);
    const bOnes = randInt(10 - aOnes, 9);
    const aTens = randInt(1, 7);
    const bTens = randInt(1, Math.min(8, 17 - aTens)); // keep sum < 178
    const a = aTens * 10 + aOnes;
    const b = bTens * 10 + bOnes;
    const ans = a + b;

    return {
      skillId: 'P3-AS-01',
      questionFamilyId: familyId,
      prompt: `${a} + ${b} = ?`,
      answer: ans,
      answerType: 'number',
      instructionHint: 'Work it out in your head. Watch for carrying!',
      solutionText: `${aOnes} + ${bOnes} = ${aOnes + bOnes} (carry 1 ten). ${aTens} + ${bTens} + 1 = ${aTens + bTens + 1} tens. Answer: ${ans}.`,
      misconceptionTraps: ['mental_add_carry_error'],
    };
  }

  // _003: Near doubles / make-ten strategy
  const strategies = [
    () => {
      // Near doubles: a and b within 2 of each other
      const base = randInt(15, 44);
      const diff = randInt(1, 2);
      return { a: base, b: base + diff };
    },
    () => {
      // Make-ten: one number ends in 8 or 9
      const aTens = randInt(1, 7);
      const aOnes = pick([8, 9]);
      const bTens = randInt(1, 8 - aTens);
      const bOnes = randInt(2, 9);
      return { a: aTens * 10 + aOnes, b: bTens * 10 + bOnes };
    },
  ];
  const { a, b } = pick(strategies)();
  const ans = a + b;

  return {
    skillId: 'P3-AS-01',
    questionFamilyId: familyId,
    prompt: `${a} + ${b} = ?`,
    answer: ans,
    answerType: 'number',
    instructionHint: 'Try a smart strategy (near doubles or make ten).',
    solutionText: `${a} + ${b} = ${ans}.`,
    misconceptionTraps: ['mental_add_carry_error', 'adds_ones_to_tens'],
  };
}

// ---------------------------------------------------------------------------
// P3-AS-02: Mental Subtraction (two 2-digit numbers)
// ---------------------------------------------------------------------------

function generateMentalSub(familyId) {
  if (familyId.endsWith('_001')) {
    // No regroup: aOnes >= bOnes
    const bOnes = randInt(1, 7);
    const aOnes = randInt(bOnes, 9);
    const bTens = randInt(1, 6);
    const aTens = randInt(bTens, 9);
    const a = aTens * 10 + aOnes;
    const b = bTens * 10 + bOnes;
    const ans = a - b;

    return {
      skillId: 'P3-AS-02',
      questionFamilyId: familyId,
      prompt: `${a} - ${b} = ?`,
      answer: ans,
      answerType: 'number',
      instructionHint: 'Work it out in your head.',
      solutionText: `${aTens * 10} - ${bTens * 10} = ${(aTens - bTens) * 10}. ${aOnes} - ${bOnes} = ${aOnes - bOnes}. Answer: ${ans}.`,
      misconceptionTraps: ['subtracts_smaller_from_larger_digit'],
    };
  }

  if (familyId.endsWith('_002')) {
    // With regroup: aOnes < bOnes
    const bOnes = randInt(3, 9);
    const aOnes = randInt(0, bOnes - 1);
    const bTens = randInt(1, 6);
    const aTens = randInt(bTens + 1, 9);
    const a = aTens * 10 + aOnes;
    const b = bTens * 10 + bOnes;
    const ans = a - b;

    return {
      skillId: 'P3-AS-02',
      questionFamilyId: familyId,
      prompt: `${a} - ${b} = ?`,
      answer: ans,
      answerType: 'number',
      instructionHint: 'Work it out in your head. Think about regrouping.',
      solutionText: `${a} - ${b}: regroup — ${a} = ${(aTens - 1) * 10} + ${10 + aOnes}. ${10 + aOnes} - ${bOnes} = ${10 + aOnes - bOnes}. ${(aTens - 1) * 10} - ${bTens * 10} = ${(aTens - 1 - bTens) * 10}. Answer: ${ans}.`,
      misconceptionTraps: ['mental_sub_regroup_error'],
    };
  }

  // _003: Complement / add-up strategy
  const bTens = randInt(2, 7);
  const bOnes = randInt(1, 9);
  const b = bTens * 10 + bOnes;
  const ans = randInt(10, 50);
  const a = b + ans;
  if (a > 99) {
    // Fallback to safe range
    const safeB = randInt(20, 50);
    const safeAns = randInt(10, 40);
    const safeA = safeB + safeAns;
    return {
      skillId: 'P3-AS-02',
      questionFamilyId: familyId,
      prompt: `${safeA} - ${safeB} = ?`,
      answer: safeAns,
      answerType: 'number',
      instructionHint: 'Try adding up from the smaller number.',
      solutionText: `Count up from ${safeB} to ${safeA}: the difference is ${safeAns}.`,
      misconceptionTraps: ['mental_sub_regroup_error', 'subtracts_smaller_from_larger_digit'],
    };
  }

  return {
    skillId: 'P3-AS-02',
    questionFamilyId: familyId,
    prompt: `${a} - ${b} = ?`,
    answer: ans,
    answerType: 'number',
    instructionHint: 'Try adding up from the smaller number.',
    solutionText: `Count up from ${b} to ${a}: the difference is ${ans}.`,
    misconceptionTraps: ['mental_sub_regroup_error', 'subtracts_smaller_from_larger_digit'],
  };
}

// ---------------------------------------------------------------------------
// P3-AS-03: Addition within 10 000 (column method)
// ---------------------------------------------------------------------------

function generateColumnAdd(familyId) {
  if (familyId.endsWith('_001')) {
    // No carry
    let a, b;
    for (let attempt = 0; attempt < 200; attempt++) {
      a = randInt(1000, 7000);
      b = randInt(1000, 9999 - a);
      const s = String(a);
      const t = String(b).padStart(4, '0');
      const p = s.padStart(4, '0');
      const noCarry = [0, 1, 2, 3].every((i) => Number(p[i]) + Number(t[i]) <= 9);
      if (noCarry) break;
    }
    const ans = a + b;

    return {
      skillId: 'P3-AS-03',
      questionFamilyId: familyId,
      prompt: `${a} + ${b} = ?`,
      answer: ans,
      answerType: 'number',
      instructionHint: 'Use the column method. Line up the digits.',
      solutionText: `${a} + ${b} = ${ans}. No carrying needed.`,
      misconceptionTraps: ['column_alignment_error'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Single carry (ones column exceeds 9)
    let a, b;
    for (let attempt = 0; attempt < 200; attempt++) {
      a = randInt(1000, 7000);
      b = randInt(1000, 9999 - a);
      const aOnes = a % 10;
      const bOnes = b % 10;
      if (aOnes + bOnes >= 10) break;
    }
    const ans = a + b;

    return {
      skillId: 'P3-AS-03',
      questionFamilyId: familyId,
      prompt: `${a} + ${b} = ?`,
      answer: ans,
      answerType: 'number',
      instructionHint: 'Use the column method. Remember to carry.',
      solutionText: `${a} + ${b} = ${ans}. Carry when a column exceeds 9.`,
      misconceptionTraps: ['forgets_carry', 'column_alignment_error'],
    };
  }

  // _003: Multiple carries
  let a, b;
  for (let attempt = 0; attempt < 200; attempt++) {
    a = randInt(1500, 6000);
    b = randInt(1500, 9999 - a);
    const digits = [0, 1, 2, 3].map((i) => {
      const ad = Number(String(a).padStart(4, '0')[i]);
      const bd = Number(String(b).padStart(4, '0')[i]);
      return ad + bd;
    });
    const carries = digits.filter((d) => d >= 10).length;
    if (carries >= 2) break;
  }
  const ans = a + b;

  return {
    skillId: 'P3-AS-03',
    questionFamilyId: familyId,
    prompt: `${a} + ${b} = ?`,
    answer: ans,
    answerType: 'number',
    instructionHint: 'Use the column method. Watch for multiple carries.',
    solutionText: `${a} + ${b} = ${ans}. Multiple carries needed.`,
    misconceptionTraps: ['forgets_carry'],
  };
}

// ---------------------------------------------------------------------------
// P3-AS-04: Subtraction within 10 000 (column method)
// ---------------------------------------------------------------------------

function generateColumnSub(familyId) {
  if (familyId.endsWith('_001')) {
    // No borrow: each top digit >= corresponding bottom digit
    let a, b;
    for (let attempt = 0; attempt < 200; attempt++) {
      a = randInt(2000, 9999);
      b = randInt(1000, a - 1);
      const ap = String(a).padStart(4, '0');
      const bp = String(b).padStart(4, '0');
      const noBorrow = [0, 1, 2, 3].every((i) => Number(ap[i]) >= Number(bp[i]));
      if (noBorrow) break;
    }
    const ans = a - b;

    return {
      skillId: 'P3-AS-04',
      questionFamilyId: familyId,
      prompt: `${a} - ${b} = ?`,
      answer: ans,
      answerType: 'number',
      instructionHint: 'Use the column method.',
      solutionText: `${a} - ${b} = ${ans}. No borrowing needed.`,
      misconceptionTraps: ['column_alignment_error'],
    };
  }

  if (familyId.endsWith('_002')) {
    // With borrows
    let a, b;
    for (let attempt = 0; attempt < 200; attempt++) {
      a = randInt(3000, 9999);
      b = randInt(1000, a - 1);
      const ap = String(a).padStart(4, '0');
      const bp = String(b).padStart(4, '0');
      const needsBorrow = [0, 1, 2, 3].some((i) => Number(ap[i]) < Number(bp[i]));
      if (needsBorrow) break;
    }
    const ans = a - b;

    return {
      skillId: 'P3-AS-04',
      questionFamilyId: familyId,
      prompt: `${a} - ${b} = ?`,
      answer: ans,
      answerType: 'number',
      instructionHint: 'Use the column method. You will need to borrow.',
      solutionText: `${a} - ${b} = ${ans}. Borrow from the next column when needed.`,
      misconceptionTraps: ['forgets_borrow', 'subtracts_smaller_from_larger_digit'],
    };
  }

  // _003: Borrow across zeros
  const zeroPatterns = [
    () => randInt(1, 9) * 1000 + randInt(1, 9),       // e.g. 5007
    () => randInt(1, 9) * 1000 + randInt(1, 9) * 10,  // e.g. 3060
    () => randInt(2, 9) * 1000,                         // e.g. 5000
  ];
  const a = pick(zeroPatterns)();
  const b = randInt(Math.max(1000, Math.floor(a * 0.2)), a - 1);
  const ans = a - b;

  return {
    skillId: 'P3-AS-04',
    questionFamilyId: familyId,
    prompt: `${a} - ${b} = ?`,
    answer: ans,
    answerType: 'number',
    instructionHint: 'Use the column method. Borrow across the zeros carefully.',
    solutionText: `${a} - ${b} = ${ans}. Borrow through the zero columns.`,
    misconceptionTraps: ['borrow_across_zero', 'forgets_borrow'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P3-AS-01': generateMentalAdd,
  'P3-AS-02': generateMentalSub,
  'P3-AS-03': generateColumnAdd,
  'P3-AS-04': generateColumnSub,
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
