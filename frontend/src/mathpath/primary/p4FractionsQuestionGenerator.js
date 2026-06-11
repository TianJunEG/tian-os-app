import { getSkill } from './p4FractionsSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p4FractionsQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function gcd(a, b) { while (b) { const t = b; b = a % b; a = t; } return a; }
function lcmFn(a, b) { return (a * b) / gcd(a, b); }

const NAMES = ['Ali', 'Ben', 'Mei', 'Siti', 'Raj', 'Tom', 'Lily', 'Sarah', 'John', 'Mary'];

/* ---------- P4-FR-01: Mixed Number → Improper Fraction ---------- */

function generateMixedToImproper(familyId) {
  const denom = randInt(2, 12);
  const whole = randInt(1, 5);
  const numer = randInt(1, denom - 1);
  const answer = whole * denom + numer;

  if (familyId.endsWith('_001')) {
    return {
      skillId: 'P4-FR-01', questionFamilyId: familyId,
      prompt: `Convert ${whole} ${numer}/${denom} to an improper fraction. What is the numerator? (denominator is ${denom})`,
      answer, answerType: 'number',
      instructionHint: 'Multiply the whole number by the denominator, then add the numerator.',
      solutionText: `${whole} × ${denom} = ${whole * denom}. Then ${whole * denom} + ${numer} = ${answer}. So ${whole} ${numer}/${denom} = ${answer}/${denom}.`,
      misconceptionTraps: ['multiplies_whole_but_forgets_numerator'],
    };
  }
  // _002 word-context
  const name = pick(NAMES);
  const items = pick(['pizzas', 'cakes', 'pies', 'loaves of bread', 'bars of chocolate']);
  return {
    skillId: 'P4-FR-01', questionFamilyId: familyId,
    prompt: `${name} has ${whole} ${numer}/${denom} ${items}. Express this as an improper fraction. What is the numerator? (denominator is ${denom})`,
    answer, answerType: 'number',
    instructionHint: 'Multiply the whole number by the denominator, then add the numerator.',
    solutionText: `${whole} × ${denom} = ${whole * denom}. Then ${whole * denom} + ${numer} = ${answer}. So ${whole} ${numer}/${denom} = ${answer}/${denom}.`,
    misconceptionTraps: ['multiplies_whole_but_forgets_numerator'],
  };
}

/* ---------- P4-FR-02: Fraction of a Set ---------- */

function generateFractionOfSet(familyId) {
  const denom = randInt(2, 8);
  const numer = randInt(1, denom - 1);
  const multiplier = randInt(2, 12);
  const setSize = denom * multiplier;
  const answer = numer * multiplier; // (numer/denom) * setSize

  if (familyId.endsWith('_001')) {
    return {
      skillId: 'P4-FR-02', questionFamilyId: familyId,
      prompt: `What is ${numer}/${denom} of ${setSize}?`,
      answer, answerType: 'number',
      instructionHint: `Divide ${setSize} by ${denom}, then multiply by ${numer}.`,
      solutionText: `${setSize} ÷ ${denom} = ${multiplier}. ${multiplier} × ${numer} = ${answer}. So ${numer}/${denom} of ${setSize} = ${answer}.`,
      misconceptionTraps: ['divides_set_by_numerator_not_denominator'],
    };
  }
  // _002 word-context
  const name = pick(NAMES);
  const objects = pick(['marbles', 'stickers', 'sweets', 'beads', 'buttons', 'pencils', 'cards']);
  return {
    skillId: 'P4-FR-02', questionFamilyId: familyId,
    prompt: `${name} has ${setSize} ${objects}. ${name} gives away ${numer}/${denom} of them. How many ${objects} does ${name} give away?`,
    answer, answerType: 'number',
    instructionHint: `Divide ${setSize} by ${denom}, then multiply by ${numer}.`,
    solutionText: `${setSize} ÷ ${denom} = ${multiplier}. ${multiplier} × ${numer} = ${answer}. So ${numer}/${denom} of ${setSize} = ${answer}.`,
    misconceptionTraps: ['divides_set_by_numerator_not_denominator'],
  };
}

/* ---------- P4-FR-03: Add & Subtract Unlike Fractions ---------- */

// Pre-computed denominator pairs where lcm ≤ 24
const UNLIKE_PAIRS = [];
for (let a = 2; a <= 12; a++) {
  for (let b = a + 1; b <= 12; b++) {
    if (lcmFn(a, b) <= 24) UNLIKE_PAIRS.push([a, b]);
  }
}

function generateUnlikeFractions(familyId) {
  const isAdd = familyId.endsWith('_001') || (familyId.endsWith('_003') && Math.random() < 0.5);
  const isSub = familyId.endsWith('_002') || (familyId.endsWith('_003') && !isAdd);
  const op = isAdd ? '+' : '−';
  const opWord = isAdd ? 'add' : 'subtract';

  const [denom1, denom2] = pick(UNLIKE_PAIRS);
  const lcd = lcmFn(denom1, denom2);
  const scale1 = lcd / denom1;
  const scale2 = lcd / denom2;

  const numer1 = randInt(1, denom1 - 1);
  let numer2;
  if (isAdd) {
    // Ensure result numerator fits within lcd (no improper result needed, but allow up to lcd)
    const maxN2 = Math.min(denom2 - 1, Math.floor((lcd - numer1 * scale1) / scale2));
    numer2 = maxN2 >= 1 ? randInt(1, maxN2) : 1;
  } else {
    // Subtraction: result must be positive
    const maxN2 = Math.min(denom2 - 1, Math.floor((numer1 * scale1 - 1) / scale2));
    if (maxN2 < 1) {
      // Swap to guarantee positive result
      const tempN1 = randInt(1, denom2 - 1);
      const tempMaxN2 = Math.min(denom1 - 1, Math.floor((tempN1 * scale2 - 1) / scale1));
      numer2 = tempMaxN2 >= 1 ? randInt(1, tempMaxN2) : 1;
      const renamed1 = tempN1 * scale2;
      const renamed2 = numer2 * scale1;
      const answer = renamed1 - renamed2;
      if (answer <= 0) {
        // Fallback: simple known-good case
        return generateUnlikeFractionsFallback(familyId, isAdd);
      }
      if (familyId.endsWith('_003')) {
        return generateUnlikeFractionsWordContext(tempN1, denom2, numer2, denom1, lcd, scale2, scale1, answer, isAdd, familyId);
      }
      return {
        skillId: 'P4-FR-03', questionFamilyId: familyId,
        prompt: `${tempN1}/${denom2} ${op} ${numer2}/${denom1} = ? / ${lcd}. What is the numerator?`,
        answer, answerType: 'number',
        instructionHint: `Find the LCD (${lcd}). Rename both fractions, then ${opWord} the numerators.`,
        solutionText: `${tempN1}/${denom2} = ${renamed1}/${lcd}, ${numer2}/${denom1} = ${renamed2}/${lcd}. ${renamed1} ${op} ${renamed2} = ${answer}. Answer: ${answer}/${lcd}.`,
        misconceptionTraps: ['adds_unlike_numerators_directly', 'wrong_lcd', 'forgets_to_rename_both_fractions'],
      };
    }
    numer2 = randInt(1, maxN2);
  }

  const renamed1 = numer1 * scale1;
  const renamed2 = numer2 * scale2;
  const answer = isAdd ? renamed1 + renamed2 : renamed1 - renamed2;

  if (answer <= 0 || answer > lcd) {
    return generateUnlikeFractionsFallback(familyId, isAdd);
  }

  if (familyId.endsWith('_003')) {
    return generateUnlikeFractionsWordContext(numer1, denom1, numer2, denom2, lcd, scale1, scale2, answer, isAdd, familyId);
  }

  return {
    skillId: 'P4-FR-03', questionFamilyId: familyId,
    prompt: `${numer1}/${denom1} ${op} ${numer2}/${denom2} = ? / ${lcd}. What is the numerator?`,
    answer, answerType: 'number',
    instructionHint: `Find the LCD (${lcd}). Rename both fractions, then ${opWord} the numerators.`,
    solutionText: `${numer1}/${denom1} = ${renamed1}/${lcd}, ${numer2}/${denom2} = ${renamed2}/${lcd}. ${renamed1} ${op} ${renamed2} = ${answer}. Answer: ${answer}/${lcd}.`,
    misconceptionTraps: ['adds_unlike_numerators_directly', 'wrong_lcd', 'forgets_to_rename_both_fractions'],
  };
}

function generateUnlikeFractionsFallback(familyId, isAdd) {
  // Known-good fallback: 1/2 + 1/3 = 5/6, or 2/3 − 1/4 = 5/12
  if (isAdd) {
    const lcd = 6;
    if (familyId.endsWith('_003')) {
      return generateUnlikeFractionsWordContext(1, 2, 1, 3, 6, 3, 2, 5, true, familyId);
    }
    return {
      skillId: 'P4-FR-03', questionFamilyId: familyId,
      prompt: `1/2 + 1/3 = ? / 6. What is the numerator?`,
      answer: 5, answerType: 'number',
      instructionHint: 'Find the LCD (6). Rename both fractions, then add the numerators.',
      solutionText: '1/2 = 3/6, 1/3 = 2/6. 3 + 2 = 5. Answer: 5/6.',
      misconceptionTraps: ['adds_unlike_numerators_directly', 'wrong_lcd', 'forgets_to_rename_both_fractions'],
    };
  }
  if (familyId.endsWith('_003')) {
    return generateUnlikeFractionsWordContext(2, 3, 1, 4, 12, 4, 3, 5, false, familyId);
  }
  return {
    skillId: 'P4-FR-03', questionFamilyId: familyId,
    prompt: `2/3 − 1/4 = ? / 12. What is the numerator?`,
    answer: 5, answerType: 'number',
    instructionHint: 'Find the LCD (12). Rename both fractions, then subtract the numerators.',
    solutionText: '2/3 = 8/12, 1/4 = 3/12. 8 − 3 = 5. Answer: 5/12.',
    misconceptionTraps: ['adds_unlike_numerators_directly', 'wrong_lcd', 'forgets_to_rename_both_fractions'],
  };
}

function generateUnlikeFractionsWordContext(n1, d1, n2, d2, lcd, s1, s2, answer, isAdd, familyId) {
  const name = pick(NAMES);
  const op = isAdd ? '+' : '−';
  const opWord = isAdd ? 'add' : 'subtract';
  const r1 = n1 * s1;
  const r2 = n2 * s2;
  let prompt;
  if (isAdd) {
    const item = pick(['of a cake', 'of a pie', 'of a pizza', 'of a chocolate bar']);
    prompt = `${name} ate ${n1}/${d1} ${item} in the morning and ${n2}/${d2} ${item} in the afternoon. What fraction did ${name} eat altogether? Give the numerator. (denominator is ${lcd})`;
  } else {
    const item = pick(['of a ribbon', 'of a rope', 'of a strip of paper', 'of a metre of cloth']);
    prompt = `${name} had ${n1}/${d1} ${item}. ${name} used ${n2}/${d2} ${item}. What fraction is left? Give the numerator. (denominator is ${lcd})`;
  }
  return {
    skillId: 'P4-FR-03', questionFamilyId: familyId,
    prompt, answer, answerType: 'number',
    instructionHint: `Find the LCD (${lcd}). Rename both fractions, then ${opWord} the numerators.`,
    solutionText: `${n1}/${d1} = ${r1}/${lcd}, ${n2}/${d2} = ${r2}/${lcd}. ${r1} ${op} ${r2} = ${answer}. Answer: ${answer}/${lcd}.`,
    misconceptionTraps: ['adds_unlike_numerators_directly', 'wrong_lcd'],
  };
}

const generatorsBySkill = {
  'P4-FR-01': generateMixedToImproper,
  'P4-FR-02': generateFractionOfSet,
  'P4-FR-03': generateUnlikeFractions,
};

export function generateQuestion(skillId, options = {}) {
  const skill = getSkill(skillId);
  if (!skill) return null;
  const families = getQuestionFamiliesBySkill(skillId);
  if (!families.length) return null;
  const family = options.questionFamilyId ? families.find((f) => f.id === options.questionFamilyId) || pick(families) : pick(families);
  const generator = generatorsBySkill[skillId];
  if (!generator) return null;
  const question = generator(family.id);
  return { ...question, questionId: `${family.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, difficulty: family.difficulty, fluencyTargetSeconds: family.fluencyTargetSeconds, visualRequirement: family.visualRequirement || skill.visual };
}

export function generateQuestionSet(skillId, count = 5, options = {}) {
  const questions = [];
  for (let i = 0; i < count; i++) { const q = generateQuestion(skillId, options); if (q) questions.push(q); }
  return questions;
}
export function generateDiagnosticSet(skillIds, questionsPerSkill = 3) {
  const questions = [];
  for (const skillId of skillIds) { questions.push(...generateQuestionSet(skillId, questionsPerSkill)); }
  return questions;
}
export function getSupportedSkillIds() { return Object.keys(generatorsBySkill); }
export default { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds };
