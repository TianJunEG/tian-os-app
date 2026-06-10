import { getSkill } from './p3FractionsSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p3FractionsQuestionFamilies.js';

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gcd(a, b) {
  while (b) { const t = b; b = a % b; a = t; }
  return a;
}

const NAMES = ['Ali', 'Ben', 'Mei', 'Siti', 'Raj', 'Tom', 'Lily', 'Sarah', 'John', 'Mary'];

function ordinalDenom(denom) {
  const labels = {
    2: 'halves', 3: 'thirds', 4: 'quarters', 5: 'fifths', 6: 'sixths',
    7: 'sevenths', 8: 'eighths', 9: 'ninths', 10: 'tenths',
    11: 'elevenths', 12: 'twelfths',
  };
  return labels[denom] || `${denom}ths`;
}

// ---------------------------------------------------------------------------
// P3-FR-01: Equivalent Fractions
// baseDenomRange [2, 6], scaleRange [2, 4], maxDenom 12
// ---------------------------------------------------------------------------

function generateEquivalent(familyId) {
  if (familyId.endsWith('_001')) {
    // Find missing numerator: a/b = ?/d  where d = b * k
    for (let attempt = 0; attempt < 200; attempt++) {
      const baseDenom = randInt(2, 6);
      const scale = randInt(2, 4);
      const targetDenom = baseDenom * scale;
      if (targetDenom > 12) continue;
      const baseNum = randInt(1, baseDenom - 1);
      // Ensure the base fraction isn't already using the target denominator
      if (gcd(baseNum, baseDenom) !== 1 && baseDenom !== 2) continue; // prefer reduced form
      const ans = baseNum * scale;

      return {
        skillId: 'P3-FR-01',
        questionFamilyId: familyId,
        prompt: `${baseNum}/${baseDenom} = ?/${targetDenom}`,
        answer: ans,
        answerType: 'number',
        instructionHint: 'Whatever you multiply the denominator by, multiply the numerator by the same number.',
        solutionText: `${baseDenom} × ${scale} = ${targetDenom}, so ${baseNum} × ${scale} = ${ans}. The answer is ${ans}/${targetDenom}.`,
        misconceptionTraps: ['multiplies_only_one_part', 'uses_additive_instead_of_multiplicative'],
      };
    }
    // Fallback
    return {
      skillId: 'P3-FR-01',
      questionFamilyId: familyId,
      prompt: '1/2 = ?/4',
      answer: 2,
      answerType: 'number',
      instructionHint: 'Whatever you multiply the denominator by, multiply the numerator by the same number.',
      solutionText: '2 × 2 = 4, so 1 × 2 = 2. The answer is 2/4.',
      misconceptionTraps: ['multiplies_only_one_part'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Find missing denominator: a/b = c/?  where c = a * k
    for (let attempt = 0; attempt < 200; attempt++) {
      const baseDenom = randInt(2, 6);
      const scale = randInt(2, 4);
      const targetDenom = baseDenom * scale;
      if (targetDenom > 12) continue;
      const baseNum = randInt(1, baseDenom - 1);
      if (gcd(baseNum, baseDenom) !== 1 && baseDenom !== 2) continue;
      const targetNum = baseNum * scale;

      return {
        skillId: 'P3-FR-01',
        questionFamilyId: familyId,
        prompt: `${baseNum}/${baseDenom} = ${targetNum}/?`,
        answer: targetDenom,
        answerType: 'number',
        instructionHint: 'Whatever you multiply the numerator by, multiply the denominator by the same number.',
        solutionText: `${baseNum} × ${scale} = ${targetNum}, so ${baseDenom} × ${scale} = ${targetDenom}. The answer is ${targetNum}/${targetDenom}.`,
        misconceptionTraps: ['divides_only_one_part', 'uses_additive_instead_of_multiplicative'],
      };
    }
    // Fallback
    return {
      skillId: 'P3-FR-01',
      questionFamilyId: familyId,
      prompt: '1/3 = 2/?',
      answer: 6,
      answerType: 'number',
      instructionHint: 'Whatever you multiply the numerator by, multiply the denominator by the same number.',
      solutionText: '1 × 2 = 2, so 3 × 2 = 6. The answer is 2/6.',
      misconceptionTraps: ['divides_only_one_part'],
    };
  }

  // _003: Are these equivalent? (choice: Yes / No)
  const isEquivalent = Math.random() < 0.5;
  if (isEquivalent) {
    for (let attempt = 0; attempt < 200; attempt++) {
      const baseDenom = randInt(2, 6);
      const scale = randInt(2, 4);
      const targetDenom = baseDenom * scale;
      if (targetDenom > 12) continue;
      const baseNum = randInt(1, baseDenom - 1);
      const targetNum = baseNum * scale;

      return {
        skillId: 'P3-FR-01',
        questionFamilyId: familyId,
        prompt: `Are ${baseNum}/${baseDenom} and ${targetNum}/${targetDenom} equivalent fractions?`,
        answer: 'Yes',
        answerType: 'choice',
        choices: [
          { label: 'Yes', value: 'Yes' },
          { label: 'No', value: 'No' },
        ],
        instructionHint: 'Multiply or divide both parts of one fraction to check if you get the other.',
        solutionText: `${baseNum}/${baseDenom} = ${targetNum}/${targetDenom} because ${baseNum} × ${scale} = ${targetNum} and ${baseDenom} × ${scale} = ${targetDenom}. Yes, they are equivalent.`,
        misconceptionTraps: ['multiplies_only_one_part'],
      };
    }
  }

  // Not equivalent — change the numerator slightly
  for (let attempt = 0; attempt < 200; attempt++) {
    const baseDenom = randInt(2, 6);
    const scale = randInt(2, 4);
    const targetDenom = baseDenom * scale;
    if (targetDenom > 12) continue;
    const baseNum = randInt(1, baseDenom - 1);
    const correctTargetNum = baseNum * scale;
    // Offset by 1 to make it non-equivalent
    const wrongNum = correctTargetNum + (Math.random() < 0.5 ? 1 : -1);
    if (wrongNum < 1 || wrongNum >= targetDenom) continue;

    return {
      skillId: 'P3-FR-01',
      questionFamilyId: familyId,
      prompt: `Are ${baseNum}/${baseDenom} and ${wrongNum}/${targetDenom} equivalent fractions?`,
      answer: 'No',
      answerType: 'choice',
      choices: [
        { label: 'Yes', value: 'Yes' },
        { label: 'No', value: 'No' },
      ],
      instructionHint: 'Multiply or divide both parts of one fraction to check if you get the other.',
      solutionText: `${baseNum}/${baseDenom} would be ${correctTargetNum}/${targetDenom}, but the second fraction is ${wrongNum}/${targetDenom}. No, they are not equivalent.`,
      misconceptionTraps: ['multiplies_only_one_part'],
    };
  }

  // Fallback
  return {
    skillId: 'P3-FR-01',
    questionFamilyId: familyId,
    prompt: 'Are 1/3 and 3/9 equivalent fractions?',
    answer: 'Yes',
    answerType: 'choice',
    choices: [
      { label: 'Yes', value: 'Yes' },
      { label: 'No', value: 'No' },
    ],
    instructionHint: 'Multiply or divide both parts of one fraction to check if you get the other.',
    solutionText: '1/3 = 3/9 because 1 × 3 = 3 and 3 × 3 = 9. Yes, they are equivalent.',
    misconceptionTraps: ['multiplies_only_one_part'],
  };
}

// ---------------------------------------------------------------------------
// P3-FR-02: Add & Subtract Related Fractions
// One denominator divides the other; maxDenom 12; answer within one whole.
// Answer is the NUMERATOR of the result (denominator is the common one).
// ---------------------------------------------------------------------------

function generateRelatedPair() {
  // Generate two fractions where one denominator divides the other
  for (let attempt = 0; attempt < 200; attempt++) {
    const smallDenom = randInt(2, 6);
    const scale = randInt(2, 4);
    const largeDenom = smallDenom * scale;
    if (largeDenom > 12) continue;

    // Fraction with the smaller denominator: a/smallDenom
    const a = randInt(1, smallDenom - 1);
    // Rename to common denominator: a*scale / largeDenom
    const aRenamed = a * scale;

    // Fraction with the larger denominator: b/largeDenom
    // For addition: aRenamed + b <= largeDenom (within one whole)
    const maxB = largeDenom - aRenamed;
    if (maxB < 1) continue;
    const b = randInt(1, maxB);

    return {
      a, smallDenom, b, largeDenom, scale, aRenamed,
      sum: aRenamed + b,
    };
  }
  // Fallback: 1/2 + 1/4
  return { a: 1, smallDenom: 2, b: 1, largeDenom: 4, scale: 2, aRenamed: 2, sum: 3 };
}

function generateRelated(familyId) {
  if (familyId.endsWith('_001')) {
    // Add related fractions: a/smallDenom + b/largeDenom = ?/largeDenom
    const { a, smallDenom, b, largeDenom, scale, aRenamed, sum } = generateRelatedPair();

    return {
      skillId: 'P3-FR-02',
      questionFamilyId: familyId,
      prompt: `${a}/${smallDenom} + ${b}/${largeDenom} = ?/${largeDenom}`,
      answer: sum,
      answerType: 'number',
      instructionHint: `Rename ${a}/${smallDenom} so both fractions share the denominator ${largeDenom}, then add the numerators.`,
      solutionText: `${a}/${smallDenom} = ${aRenamed}/${largeDenom}. Then ${aRenamed}/${largeDenom} + ${b}/${largeDenom} = ${sum}/${largeDenom}.`,
      misconceptionTraps: ['adds_unlike_numerators_directly', 'wrong_common_denominator', 'forgets_to_rename_numerator'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Subtract related fractions: larger - smaller
    for (let attempt = 0; attempt < 200; attempt++) {
      const smallDenom = randInt(2, 6);
      const scale = randInt(2, 4);
      const largeDenom = smallDenom * scale;
      if (largeDenom > 12) continue;

      const a = randInt(1, smallDenom - 1);
      const aRenamed = a * scale;

      // b/largeDenom where b < aRenamed (so subtraction is positive)
      if (aRenamed < 2) continue;
      const b = randInt(1, aRenamed - 1);
      const diff = aRenamed - b;

      return {
        skillId: 'P3-FR-02',
        questionFamilyId: familyId,
        prompt: `${a}/${smallDenom} − ${b}/${largeDenom} = ?/${largeDenom}`,
        answer: diff,
        answerType: 'number',
        instructionHint: `Rename ${a}/${smallDenom} so both fractions share the denominator ${largeDenom}, then subtract the numerators.`,
        solutionText: `${a}/${smallDenom} = ${aRenamed}/${largeDenom}. Then ${aRenamed}/${largeDenom} − ${b}/${largeDenom} = ${diff}/${largeDenom}.`,
        misconceptionTraps: ['adds_unlike_numerators_directly', 'forgets_to_rename_numerator'],
      };
    }
    // Fallback: 1/2 - 1/4
    return {
      skillId: 'P3-FR-02',
      questionFamilyId: familyId,
      prompt: '1/2 − 1/4 = ?/4',
      answer: 1,
      answerType: 'number',
      instructionHint: 'Rename 1/2 as 2/4, then subtract: 2/4 − 1/4 = 1/4.',
      solutionText: '1/2 = 2/4. Then 2/4 − 1/4 = 1/4.',
      misconceptionTraps: ['adds_unlike_numerators_directly', 'forgets_to_rename_numerator'],
    };
  }

  // _003: Word context — add or subtract related fractions
  const isAdd = Math.random() < 0.5;
  const name1 = pick(NAMES);
  let name2 = pick(NAMES);
  while (name2 === name1) name2 = pick(NAMES);

  const foods = ['a pizza', 'a cake', 'a pie', 'a waffle', 'a tart'];

  if (isAdd) {
    const { a, smallDenom, b, largeDenom, scale, aRenamed, sum } = generateRelatedPair();
    const food = pick(foods);
    const foodPlain = food.replace('a ', '');

    return {
      skillId: 'P3-FR-02',
      questionFamilyId: familyId,
      prompt: `${name1} ate ${a}/${smallDenom} of ${food}. ${name2} ate ${b}/${largeDenom} of the same ${foodPlain}. What fraction did they eat altogether? Give the numerator over ${largeDenom}.`,
      answer: sum,
      answerType: 'number',
      instructionHint: `Rename ${a}/${smallDenom} as ${aRenamed}/${largeDenom}, then add the numerators.`,
      solutionText: `${a}/${smallDenom} = ${aRenamed}/${largeDenom}. ${aRenamed} + ${b} = ${sum}. They ate ${sum}/${largeDenom} altogether.`,
      misconceptionTraps: ['adds_unlike_numerators_directly', 'wrong_common_denominator'],
    };
  }

  // Subtraction word problem
  for (let attempt = 0; attempt < 200; attempt++) {
    const smallDenom = randInt(2, 6);
    const scale = randInt(2, 4);
    const largeDenom = smallDenom * scale;
    if (largeDenom > 12) continue;
    const a = randInt(1, smallDenom - 1);
    const aRenamed = a * scale;
    if (aRenamed < 2) continue;
    const b = randInt(1, aRenamed - 1);
    const diff = aRenamed - b;
    const food = pick(foods);
    const foodPlain = food.replace('a ', '');

    return {
      skillId: 'P3-FR-02',
      questionFamilyId: familyId,
      prompt: `${name1} had ${a}/${smallDenom} of ${food}. ${name1} gave ${b}/${largeDenom} of the ${foodPlain} to ${name2}. What fraction does ${name1} have left? Give the numerator over ${largeDenom}.`,
      answer: diff,
      answerType: 'number',
      instructionHint: `Rename ${a}/${smallDenom} as ${aRenamed}/${largeDenom}, then subtract.`,
      solutionText: `${a}/${smallDenom} = ${aRenamed}/${largeDenom}. ${aRenamed} − ${b} = ${diff}. ${name1} has ${diff}/${largeDenom} left.`,
      misconceptionTraps: ['adds_unlike_numerators_directly', 'forgets_to_rename_numerator'],
    };
  }

  // Fallback
  return {
    skillId: 'P3-FR-02',
    questionFamilyId: familyId,
    prompt: `${name1} had 1/2 of a cake. ${name1} gave 1/4 of the cake to ${name2}. What fraction does ${name1} have left? Give the numerator over 4.`,
    answer: 1,
    answerType: 'number',
    instructionHint: 'Rename 1/2 as 2/4, then subtract 1/4.',
    solutionText: '1/2 = 2/4. 2 − 1 = 1. Mei has 1/4 left.',
    misconceptionTraps: ['adds_unlike_numerators_directly', 'forgets_to_rename_numerator'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P3-FR-01': generateEquivalent,
  'P3-FR-02': generateRelated,
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
