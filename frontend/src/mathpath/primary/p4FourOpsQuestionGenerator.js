import { getSkill } from './p4FourOpsSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p4FourOpsQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ---------------------------------------------------------------------------
// P4-FO-01: Multiply up to 4-digit by 1-digit
// ---------------------------------------------------------------------------
function generateMul4by1(familyId) {
  if (familyId.endsWith('_001')) {
    // 3-digit x 1-digit
    const a = randInt(100, 999);
    const b = randInt(2, 9);
    const answer = a * b;
    return {
      skillId: 'P4-FO-01', questionFamilyId: familyId,
      prompt: `${a} \u00d7 ${b} = ?`, answer, answerType: 'number',
      instructionHint: 'Multiply each digit from the right, carrying as needed.',
      solutionText: `${a} \u00d7 ${b} = ${answer}.`,
      misconceptionTraps: ['carry_error_multiplication', 'times_table_slip'],
    };
  }
  if (familyId.endsWith('_002')) {
    // 4-digit x 1-digit, no carry (small digits)
    const d = [randInt(1, 2), randInt(0, 2), randInt(0, 2), randInt(0, 2)];
    const a = d[0] * 1000 + d[1] * 100 + d[2] * 10 + d[3];
    const b = randInt(2, 3);
    const answer = a * b;
    return {
      skillId: 'P4-FO-01', questionFamilyId: familyId,
      prompt: `${a} \u00d7 ${b} = ?`, answer, answerType: 'number',
      instructionHint: 'Multiply each digit from the right.',
      solutionText: `${a} \u00d7 ${b} = ${answer}.`,
      misconceptionTraps: ['times_table_slip'],
    };
  }
  // _003: 4-digit x 1-digit with carry
  const a = randInt(1000, 9999);
  const b = randInt(2, 9);
  const answer = a * b;
  return {
    skillId: 'P4-FO-01', questionFamilyId: familyId,
    prompt: `${a} \u00d7 ${b} = ?`, answer, answerType: 'number',
    instructionHint: 'Multiply each digit from the right, carrying as you go.',
    solutionText: `${a} \u00d7 ${b} = ${answer.toLocaleString()}.`,
    misconceptionTraps: ['carry_error_multiplication', 'multiplies_only_ones'],
  };
}

// ---------------------------------------------------------------------------
// P4-FO-02: Multiply up to 3-digit by 2-digit
// ---------------------------------------------------------------------------
function generateMul3by2(familyId) {
  if (familyId.endsWith('_001')) {
    // 2-digit x 2-digit
    const a = randInt(11, 99);
    const b = randInt(11, 99);
    const answer = a * b;
    return {
      skillId: 'P4-FO-02', questionFamilyId: familyId,
      prompt: `${a} \u00d7 ${b} = ?`, answer, answerType: 'number',
      instructionHint: 'Multiply by the ones, then by the tens (shift left), then add.',
      solutionText: `${a} \u00d7 ${b % 10} = ${a * (b % 10)}, ${a} \u00d7 ${Math.floor(b / 10) * 10} = ${a * Math.floor(b / 10) * 10}. Total = ${answer}.`,
      misconceptionTraps: ['forgets_tens_row_shift', 'partial_product_addition_error'],
    };
  }
  if (familyId.endsWith('_002')) {
    // 3-digit x 2-digit (smaller)
    const a = randInt(100, 499);
    const b = randInt(11, 49);
    const answer = a * b;
    return {
      skillId: 'P4-FO-02', questionFamilyId: familyId,
      prompt: `${a} \u00d7 ${b} = ?`, answer, answerType: 'number',
      instructionHint: 'Multiply by ones row, then tens row (remember to shift), then add.',
      solutionText: `${a} \u00d7 ${b} = ${answer.toLocaleString()}.`,
      misconceptionTraps: ['carry_error_multiplication', 'forgets_tens_row_shift'],
    };
  }
  // _003: 3-digit x 2-digit (larger)
  const a = randInt(100, 999);
  const b = randInt(11, 99);
  const answer = a * b;
  return {
    skillId: 'P4-FO-02', questionFamilyId: familyId,
    prompt: `${a} \u00d7 ${b} = ?`, answer, answerType: 'number',
    instructionHint: 'Use partial products: ones row + tens row.',
    solutionText: `${a} \u00d7 ${b} = ${answer.toLocaleString()}.`,
    misconceptionTraps: ['carry_error_multiplication', 'partial_product_addition_error'],
  };
}

// ---------------------------------------------------------------------------
// P4-FO-03: Divide up to 4-digit by 1-digit
// ---------------------------------------------------------------------------
function generateDiv4by1(familyId) {
  if (familyId.endsWith('_001')) {
    // 3-digit / 1-digit exact
    const divisor = randInt(2, 9);
    const quotient = randInt(11, 150);
    const dividend = divisor * quotient;
    if (dividend < 100 || dividend > 999) {
      // retry with safe range
      const safeQ = randInt(Math.ceil(100 / divisor), Math.floor(999 / divisor));
      const safeDividend = divisor * safeQ;
      return {
        skillId: 'P4-FO-03', questionFamilyId: familyId,
        prompt: `${safeDividend} \u00f7 ${divisor} = ?`, answer: safeQ, answerType: 'number',
        instructionHint: 'Use long division, bringing down one digit at a time.',
        solutionText: `${safeDividend} \u00f7 ${divisor} = ${safeQ}.`,
        misconceptionTraps: ['division_direction_error'],
      };
    }
    return {
      skillId: 'P4-FO-03', questionFamilyId: familyId,
      prompt: `${dividend} \u00f7 ${divisor} = ?`, answer: quotient, answerType: 'number',
      instructionHint: 'Use long division, bringing down one digit at a time.',
      solutionText: `${dividend} \u00f7 ${divisor} = ${quotient}.`,
      misconceptionTraps: ['division_direction_error'],
    };
  }
  if (familyId.endsWith('_002')) {
    // 4-digit / 1-digit exact
    const divisor = randInt(2, 9);
    const quotient = randInt(Math.ceil(1000 / divisor), Math.min(1500, Math.floor(9999 / divisor)));
    const dividend = divisor * quotient;
    return {
      skillId: 'P4-FO-03', questionFamilyId: familyId,
      prompt: `${dividend.toLocaleString()} \u00f7 ${divisor} = ?`, answer: quotient, answerType: 'number',
      instructionHint: 'Use long division. Watch for zeros in the quotient!',
      solutionText: `${dividend.toLocaleString()} \u00f7 ${divisor} = ${quotient.toLocaleString()}.`,
      misconceptionTraps: ['skips_zero_in_quotient'],
    };
  }
  // _003: 4-digit / 1-digit with remainder
  const divisor = randInt(2, 9);
  const quotient = randInt(Math.ceil(1000 / divisor), Math.min(1400, Math.floor(9999 / divisor)));
  const remainder = randInt(1, divisor - 1);
  const dividend = divisor * quotient + remainder;
  return {
    skillId: 'P4-FO-03', questionFamilyId: familyId,
    prompt: `${dividend.toLocaleString()} \u00f7 ${divisor} = ? remainder ?. What is the quotient?`,
    answer: quotient, answerType: 'number',
    instructionHint: 'Use long division. The leftover amount is the remainder.',
    solutionText: `${dividend.toLocaleString()} \u00f7 ${divisor} = ${quotient} remainder ${remainder}.`,
    misconceptionTraps: ['division_remainder_confusion', 'skips_zero_in_quotient'],
  };
}

const generatorsBySkill = {
  'P4-FO-01': generateMul4by1,
  'P4-FO-02': generateMul3by2,
  'P4-FO-03': generateDiv4by1,
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
  return { ...question, questionId: `${family.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, difficulty: family.difficulty, fluencyTargetSeconds: family.fluencyTargetSeconds, visualRequirement: skill.visual };
}

export function generateQuestionSet(skillId, count = 5, options = {}) {
  const q = []; for (let i = 0; i < count; i++) { const r = generateQuestion(skillId, options); if (r) q.push(r); } return q;
}
export function generateDiagnosticSet(skillIds, perSkill = 3) {
  const q = []; for (const s of skillIds) q.push(...generateQuestionSet(s, perSkill)); return q;
}
export function getSupportedSkillIds() { return Object.keys(generatorsBySkill); }
export default { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds };
