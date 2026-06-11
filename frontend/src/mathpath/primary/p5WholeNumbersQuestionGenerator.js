import { getSkill } from './p5WholeNumbersSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p5WholeNumbersQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const PLACE_NAMES = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'hundred thousands', 'millions'];
const PLACE_VALUES = [1, 10, 100, 1000, 10000, 100000, 1000000];

function digitValue(num, placeIndex) {
  return Math.floor(num / PLACE_VALUES[placeIndex]) % 10 * PLACE_VALUES[placeIndex];
}

function generatePlaceValue(familyId) {
  if (familyId.endsWith('_001')) {
    const num = randInt(100000, 9999999);
    const placeIdx = randInt(3, 6);
    const digit = Math.floor(num / PLACE_VALUES[placeIdx]) % 10;
    const value = digit * PLACE_VALUES[placeIdx];
    return {
      skillId: 'P5-WN-01', questionFamilyId: familyId,
      prompt: `What is the value of the digit ${digit} in ${num.toLocaleString()}?`,
      answer: value, answerType: 'number',
      instructionHint: `Look at the ${PLACE_NAMES[placeIdx]} place.`,
      solutionText: `The digit ${digit} is in the ${PLACE_NAMES[placeIdx]} place, so its value is ${value.toLocaleString()}.`,
      misconceptionTraps: ['confuses_place_value_names', 'wrong_digit_value'],
    };
  }
  if (familyId.endsWith('_002')) {
    const millions = randInt(1, 9);
    const hundredThousands = randInt(0, 9);
    const tenThousands = randInt(0, 9);
    const thousands = randInt(0, 9);
    const hundreds = randInt(0, 9);
    const tens = randInt(0, 9);
    const ones = randInt(0, 9);
    const num = millions * 1000000 + hundredThousands * 100000 + tenThousands * 10000 + thousands * 1000 + hundreds * 100 + tens * 10 + ones;
    const parts = [];
    if (millions) parts.push(`${millions} million`);
    const remainder = num % 1000000;
    if (remainder >= 1000) {
      const thousandsPart = Math.floor(remainder / 1000);
      parts.push(`${thousandsPart.toLocaleString()} thousand`);
    }
    const lastThree = remainder % 1000;
    if (lastThree > 0) parts.push(`and ${lastThree}`);
    const wordForm = parts.join(', ');
    return {
      skillId: 'P5-WN-01', questionFamilyId: familyId,
      prompt: `Write ${wordForm} in numerals.`,
      answer: num, answerType: 'number',
      instructionHint: 'Build the number place by place from millions down to ones.',
      solutionText: `${wordForm} = ${num.toLocaleString()}`,
      misconceptionTraps: ['omits_zeros_in_word_form'],
    };
  }
  const parts = [randInt(1, 9) * 1000000, randInt(0, 9) * 100000, randInt(0, 9) * 10000, randInt(1, 9) * 1000, randInt(0, 9) * 100, randInt(0, 9) * 10, randInt(1, 9)];
  const num = parts.reduce((a, b) => a + b, 0);
  const nonZero = parts.filter((p) => p > 0);
  const expandedStr = nonZero.map((p) => p.toLocaleString()).join(' + ');
  return {
    skillId: 'P5-WN-01', questionFamilyId: familyId,
    prompt: `What is ${expandedStr}?`,
    answer: num, answerType: 'number',
    instructionHint: 'Add up all the place values.',
    solutionText: `${expandedStr} = ${num.toLocaleString()}`,
    misconceptionTraps: ['confuses_place_value_names'],
  };
}

function generateRounding(familyId) {
  if (familyId.endsWith('_001')) {
    const num = randInt(10000, 999999);
    const rounded = Math.round(num / 1000) * 1000;
    return {
      skillId: 'P5-WN-02', questionFamilyId: familyId,
      prompt: `Round ${num.toLocaleString()} to the nearest thousand.`,
      answer: rounded, answerType: 'number',
      instructionHint: 'Look at the hundreds digit. If it is 5 or more, round up.',
      solutionText: `The hundreds digit of ${num.toLocaleString()} is ${Math.floor((num % 1000) / 100)}. ${Math.floor((num % 1000) / 100) >= 5 ? 'Round up' : 'Round down'} → ${rounded.toLocaleString()}.`,
      misconceptionTraps: ['rounds_wrong_direction', 'rounds_to_wrong_place'],
    };
  }
  if (familyId.endsWith('_002')) {
    const num = randInt(100000, 9999999);
    const rounded = Math.round(num / 10000) * 10000;
    return {
      skillId: 'P5-WN-02', questionFamilyId: familyId,
      prompt: `Round ${num.toLocaleString()} to the nearest ten thousand.`,
      answer: rounded, answerType: 'number',
      instructionHint: 'Look at the thousands digit. If it is 5 or more, round up.',
      solutionText: `The thousands digit is ${Math.floor((num % 10000) / 1000)}. ${Math.floor((num % 10000) / 1000) >= 5 ? 'Round up' : 'Round down'} → ${rounded.toLocaleString()}.`,
      misconceptionTraps: ['rounds_wrong_direction', 'rounds_to_wrong_place'],
    };
  }
  const a = randInt(1000, 9999);
  const b = randInt(1000, 9999);
  const op = pick(['+', '−']);
  const roundedA = Math.round(a / 1000) * 1000;
  const roundedB = Math.round(b / 1000) * 1000;
  const estimate = op === '+' ? roundedA + roundedB : roundedA - roundedB;
  return {
    skillId: 'P5-WN-02', questionFamilyId: familyId,
    prompt: `Estimate ${a.toLocaleString()} ${op} ${b.toLocaleString()} by rounding each number to the nearest thousand.`,
    answer: estimate, answerType: 'number',
    instructionHint: 'Round each number to the nearest thousand first, then compute.',
    solutionText: `${a.toLocaleString()} ≈ ${roundedA.toLocaleString()}, ${b.toLocaleString()} ≈ ${roundedB.toLocaleString()}. ${roundedA.toLocaleString()} ${op} ${roundedB.toLocaleString()} = ${estimate.toLocaleString()}.`,
    misconceptionTraps: ['truncates_instead_of_rounding'],
  };
}

function generateOrderOfOps(familyId) {
  if (familyId.endsWith('_001')) {
    const a = randInt(10, 50);
    const b = randInt(2, 9);
    const c = randInt(2, 9);
    const op1 = pick(['+', '−']);
    const result = op1 === '+' ? a + b * c : a - b * c;
    const expr = `${a} ${op1} ${b} × ${c}`;
    return {
      skillId: 'P5-WN-03', questionFamilyId: familyId,
      prompt: `Find the value of ${expr}.`,
      answer: result, answerType: 'number',
      instructionHint: 'Do multiplication before addition or subtraction.',
      solutionText: `${expr} = ${a} ${op1} ${b * c} = ${result}`,
      misconceptionTraps: ['left_to_right_ignoring_precedence'],
    };
  }
  if (familyId.endsWith('_002')) {
    const a = randInt(2, 9);
    const b = randInt(10, 40);
    const c = randInt(2, 9);
    const bracketResult = b - c;
    const result = a * bracketResult;
    const expr = `${a} × (${b} − ${c})`;
    return {
      skillId: 'P5-WN-03', questionFamilyId: familyId,
      prompt: `Find the value of ${expr}.`,
      answer: result, answerType: 'number',
      instructionHint: 'Solve the brackets first.',
      solutionText: `${expr} = ${a} × ${bracketResult} = ${result}`,
      misconceptionTraps: ['forgets_brackets_first'],
    };
  }
  const a = randInt(20, 80);
  const b = randInt(10, 40);
  const c = randInt(2, 9);
  const d = randInt(2, 5);
  const e = randInt(2, 5);
  const bracketResult = b - c;
  const divResult = bracketResult / d;
  const useDivClean = bracketResult % d === 0;
  if (useDivClean) {
    const result = a + divResult * e;
    const expr = `${a} + (${b} − ${c}) ÷ ${d} × ${e}`;
    return {
      skillId: 'P5-WN-03', questionFamilyId: familyId,
      prompt: `Find the value of ${expr}.`,
      answer: result, answerType: 'number',
      instructionHint: 'Brackets first, then × and ÷ left to right, then + and −.',
      solutionText: `${expr} = ${a} + ${bracketResult} ÷ ${d} × ${e} = ${a} + ${divResult} × ${e} = ${a} + ${divResult * e} = ${result}`,
      misconceptionTraps: ['left_to_right_ignoring_precedence', 'wrong_division_in_chain'],
    };
  }
  const simpleA = randInt(20, 60);
  const simpleB = randInt(10, 30);
  const simpleC = randInt(2, 8);
  const simpleD = randInt(2, 5);
  const simpleResult = simpleA + (simpleB - simpleC) * simpleD;
  const simpleExpr = `${simpleA} + (${simpleB} − ${simpleC}) × ${simpleD}`;
  return {
    skillId: 'P5-WN-03', questionFamilyId: familyId,
    prompt: `Find the value of ${simpleExpr}.`,
    answer: simpleResult, answerType: 'number',
    instructionHint: 'Brackets first, then × and ÷, then + and −.',
    solutionText: `${simpleExpr} = ${simpleA} + ${simpleB - simpleC} × ${simpleD} = ${simpleA} + ${(simpleB - simpleC) * simpleD} = ${simpleResult}`,
    misconceptionTraps: ['left_to_right_ignoring_precedence', 'forgets_brackets_first'],
  };
}

const generatorsBySkill = { 'P5-WN-01': generatePlaceValue, 'P5-WN-02': generateRounding, 'P5-WN-03': generateOrderOfOps };

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
