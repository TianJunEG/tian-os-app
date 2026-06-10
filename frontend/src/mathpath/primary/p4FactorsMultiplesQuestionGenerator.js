import { getSkill } from './p4FactorsMultiplesSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p4FactorsMultiplesQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function getFactors(n) {
  const factors = [];
  for (let i = 1; i <= n; i++) {
    if (n % i === 0) factors.push(i);
  }
  return factors;
}

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
function lcm(a, b) { return (a * b) / gcd(a, b); }

// ---------------------------------------------------------------------------
// P4-FM-01: Common Factors (HCF)
// ---------------------------------------------------------------------------

// Curated pairs that produce interesting HCFs (not always 1)
const HCF_PAIRS = [
  [12, 18], [16, 24], [20, 30], [24, 36], [18, 27],
  [15, 25], [14, 21], [12, 30], [18, 42], [24, 32],
  [28, 42], [36, 48], [20, 45], [16, 40], [12, 36],
  [15, 35], [21, 28], [30, 42], [18, 48], [24, 40],
];

function generateFactors(familyId) {
  if (familyId.endsWith('_001')) {
    // List all factors of a number
    const n = pick([12, 15, 16, 18, 20, 24, 28, 30, 32, 36, 40, 42, 48]);
    const factors = getFactors(n);
    // Ask: how many factors does n have?
    return {
      skillId: 'P4-FM-01',
      questionFamilyId: familyId,
      prompt: `How many factors does ${n} have?`,
      answer: factors.length,
      answerType: 'number',
      instructionHint: 'List the factor pairs to find all factors, then count them.',
      solutionText: `Factors of ${n}: ${factors.join(', ')}. That is ${factors.length} factors.`,
      misconceptionTraps: ['misses_factor_pair', 'forgets_1_is_a_factor'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Find common factors
    const [a, b] = pick(HCF_PAIRS);
    const factorsA = getFactors(a);
    const factorsB = getFactors(b);
    const common = factorsA.filter((f) => factorsB.includes(f));
    // Ask: how many common factors?
    return {
      skillId: 'P4-FM-01',
      questionFamilyId: familyId,
      prompt: `How many common factors do ${a} and ${b} share?`,
      answer: common.length,
      answerType: 'number',
      instructionHint: 'List the factors of each number, then find the ones they share.',
      solutionText: `Factors of ${a}: ${factorsA.join(', ')}. Factors of ${b}: ${factorsB.join(', ')}. Common factors: ${common.join(', ')} (${common.length} in total).`,
      misconceptionTraps: ['confuses_factors_and_multiples', 'misses_factor_pair'],
    };
  }

  // _003: Find the HCF
  const [a, b] = pick(HCF_PAIRS);
  const hcf = gcd(a, b);

  return {
    skillId: 'P4-FM-01',
    questionFamilyId: familyId,
    prompt: `What is the greatest common factor (HCF) of ${a} and ${b}?`,
    answer: hcf,
    answerType: 'number',
    instructionHint: 'List the factors of each number. The largest factor they share is the HCF.',
    solutionText: `Factors of ${a}: ${getFactors(a).join(', ')}. Factors of ${b}: ${getFactors(b).join(', ')}. The HCF is ${hcf}.`,
    misconceptionTraps: ['confuses_factors_and_multiples'],
  };
}

// ---------------------------------------------------------------------------
// P4-FM-02: Common Multiples (LCM)
// ---------------------------------------------------------------------------

const LCM_PAIRS = [
  [3, 4], [4, 6], [3, 5], [2, 7], [3, 8],
  [4, 5], [6, 8], [5, 6], [3, 7], [4, 9],
  [5, 8], [6, 9], [2, 9], [3, 4], [4, 7],
];

function generateMultiples(familyId) {
  if (familyId.endsWith('_001')) {
    // List first N multiples
    const n = randInt(2, 9);
    const count = randInt(5, 8);
    const multiples = Array.from({ length: count }, (_, i) => n * (i + 1));
    // Ask for the Nth multiple
    const askIdx = randInt(4, count);
    return {
      skillId: 'P4-FM-02',
      questionFamilyId: familyId,
      prompt: `What is the ${askIdx}${askIdx === 1 ? 'st' : askIdx === 2 ? 'nd' : askIdx === 3 ? 'rd' : 'th'} multiple of ${n}?`,
      answer: n * askIdx,
      answerType: 'number',
      instructionHint: `Count up by ${n}: ${n}, ${n * 2}, ${n * 3}, ...`,
      solutionText: `Multiples of ${n}: ${multiples.join(', ')}. The ${askIdx}${askIdx === 1 ? 'st' : askIdx === 2 ? 'nd' : askIdx === 3 ? 'rd' : 'th'} multiple is ${n * askIdx}.`,
      misconceptionTraps: ['confuses_factors_and_multiples'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Find common multiples up to a limit
    const [a, b] = pick(LCM_PAIRS);
    const limit = lcm(a, b) * 3;
    const multiplesA = [];
    const multiplesB = [];
    for (let i = 1; i * a <= limit; i++) multiplesA.push(i * a);
    for (let i = 1; i * b <= limit; i++) multiplesB.push(i * b);
    const common = multiplesA.filter((m) => multiplesB.includes(m));
    // Ask: how many common multiples up to limit?
    return {
      skillId: 'P4-FM-02',
      questionFamilyId: familyId,
      prompt: `How many common multiples of ${a} and ${b} are there up to ${limit}?`,
      answer: common.length,
      answerType: 'number',
      instructionHint: `List multiples of ${a} and multiples of ${b} up to ${limit}, then find the ones they share.`,
      solutionText: `Common multiples of ${a} and ${b} up to ${limit}: ${common.join(', ')} (${common.length} in total).`,
      misconceptionTraps: ['confuses_factors_and_multiples', 'stops_listing_too_early'],
    };
  }

  // _003: Find the LCM
  const [a, b] = pick(LCM_PAIRS);
  const answer = lcm(a, b);

  return {
    skillId: 'P4-FM-02',
    questionFamilyId: familyId,
    prompt: `What is the lowest common multiple (LCM) of ${a} and ${b}?`,
    answer,
    answerType: 'number',
    instructionHint: `Count up in ${a}s and ${b}s until you find the first number that appears in both lists.`,
    solutionText: `Multiples of ${a}: ${Array.from({ length: Math.ceil(answer / a) + 2 }, (_, i) => a * (i + 1)).join(', ')}. Multiples of ${b}: ${Array.from({ length: Math.ceil(answer / b) + 2 }, (_, i) => b * (i + 1)).join(', ')}. The LCM is ${answer}.`,
    misconceptionTraps: ['multiplies_instead_of_finding_lcm'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P4-FM-01': generateFactors,
  'P4-FM-02': generateMultiples,
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
    visualRequirement: family.visualRequirement || skill.visual,
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
