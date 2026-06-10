import { getSkill } from './p4FactorsMultiplesSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p4FactorsMultiplesQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function getFactors(n) {
  const f = [];
  for (let i = 1; i <= n; i++) { if (n % i === 0) f.push(i); }
  return f;
}
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
function lcmOf(a, b) { return (a * b) / gcd(a, b); }

const HCF_PAIRS = [
  [12,18],[16,24],[20,30],[24,36],[18,27],[15,25],[14,21],[12,30],[18,42],[24,32],
  [28,42],[36,48],[20,45],[16,40],[12,36],[15,35],[21,28],[30,42],[18,48],[24,40],
];
const LCM_PAIRS = [
  [3,4],[4,6],[3,5],[2,7],[3,8],[4,5],[6,8],[5,6],[3,7],[4,9],[5,8],[6,9],[2,9],[4,7],
];

function generateFactors(familyId) {
  if (familyId.endsWith('_001')) {
    const n = pick([12,15,16,18,20,24,28,30,32,36,40,42,48]);
    const factors = getFactors(n);
    return {
      skillId: 'P4-FM-01', questionFamilyId: familyId,
      prompt: `How many factors does ${n} have?`,
      answer: factors.length, answerType: 'number',
      instructionHint: 'List factor pairs to find all factors, then count.',
      solutionText: `Factors of ${n}: ${factors.join(', ')}. That is ${factors.length} factors.`,
      misconceptionTraps: ['misses_factor_pair', 'forgets_1_is_a_factor'],
    };
  }
  if (familyId.endsWith('_002')) {
    const [a, b] = pick(HCF_PAIRS);
    const fA = getFactors(a), fB = getFactors(b);
    const common = fA.filter((f) => fB.includes(f));
    return {
      skillId: 'P4-FM-01', questionFamilyId: familyId,
      prompt: `How many common factors do ${a} and ${b} share?`,
      answer: common.length, answerType: 'number',
      instructionHint: 'List factors of each number, then find shared ones.',
      solutionText: `Factors of ${a}: ${fA.join(', ')}. Factors of ${b}: ${fB.join(', ')}. Common: ${common.join(', ')} (${common.length}).`,
      misconceptionTraps: ['confuses_factors_and_multiples', 'misses_factor_pair'],
    };
  }
  const [a, b] = pick(HCF_PAIRS);
  const hcf = gcd(a, b);
  return {
    skillId: 'P4-FM-01', questionFamilyId: familyId,
    prompt: `What is the greatest common factor (HCF) of ${a} and ${b}?`,
    answer: hcf, answerType: 'number',
    instructionHint: 'List the factors of each number. The largest shared factor is the HCF.',
    solutionText: `Factors of ${a}: ${getFactors(a).join(', ')}. Factors of ${b}: ${getFactors(b).join(', ')}. HCF = ${hcf}.`,
    misconceptionTraps: ['confuses_factors_and_multiples'],
  };
}

function generateMultiples(familyId) {
  if (familyId.endsWith('_001')) {
    const n = randInt(2, 9);
    const askIdx = randInt(4, 8);
    const suffix = askIdx === 1 ? 'st' : askIdx === 2 ? 'nd' : askIdx === 3 ? 'rd' : 'th';
    const multiples = Array.from({ length: askIdx }, (_, i) => n * (i + 1));
    return {
      skillId: 'P4-FM-02', questionFamilyId: familyId,
      prompt: `What is the ${askIdx}${suffix} multiple of ${n}?`,
      answer: n * askIdx, answerType: 'number',
      instructionHint: `Count up by ${n}.`,
      solutionText: `Multiples of ${n}: ${multiples.join(', ')}. The ${askIdx}${suffix} multiple is ${n * askIdx}.`,
      misconceptionTraps: ['confuses_factors_and_multiples'],
    };
  }
  if (familyId.endsWith('_002')) {
    const [a, b] = pick(LCM_PAIRS);
    const limit = lcmOf(a, b) * 3;
    const mA = [], mB = [];
    for (let i = 1; i * a <= limit; i++) mA.push(i * a);
    for (let i = 1; i * b <= limit; i++) mB.push(i * b);
    const common = mA.filter((m) => mB.includes(m));
    return {
      skillId: 'P4-FM-02', questionFamilyId: familyId,
      prompt: `How many common multiples of ${a} and ${b} are there up to ${limit}?`,
      answer: common.length, answerType: 'number',
      instructionHint: `List multiples of ${a} and ${b} up to ${limit}, find shared ones.`,
      solutionText: `Common multiples of ${a} and ${b} up to ${limit}: ${common.join(', ')} (${common.length}).`,
      misconceptionTraps: ['confuses_factors_and_multiples', 'stops_listing_too_early'],
    };
  }
  const [a, b] = pick(LCM_PAIRS);
  const answer = lcmOf(a, b);
  return {
    skillId: 'P4-FM-02', questionFamilyId: familyId,
    prompt: `What is the lowest common multiple (LCM) of ${a} and ${b}?`,
    answer, answerType: 'number',
    instructionHint: `Count up in ${a}s and ${b}s until you find the first match.`,
    solutionText: `Multiples of ${a}: ${Array.from({ length: Math.ceil(answer / a) + 2 }, (_, i) => a * (i + 1)).join(', ')}. Multiples of ${b}: ${Array.from({ length: Math.ceil(answer / b) + 2 }, (_, i) => b * (i + 1)).join(', ')}. LCM = ${answer}.`,
    misconceptionTraps: ['multiplies_instead_of_finding_lcm'],
  };
}

const generatorsBySkill = { 'P4-FM-01': generateFactors, 'P4-FM-02': generateMultiples };

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
