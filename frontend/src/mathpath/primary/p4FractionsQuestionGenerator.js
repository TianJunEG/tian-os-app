import { getSkill } from './p4FractionsSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p4FractionsQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
function lcmOf(a, b) { return (a * b) / gcd(a, b); }

function generateMixedImproper(familyId) {
  const denom = pick([2, 3, 4, 5, 6, 8, 10, 12]);
  const whole = randInt(1, 5);
  const numer = randInt(1, denom - 1);
  const improperNumer = whole * denom + numer;

  if (familyId.endsWith('_001')) {
    return {
      skillId: 'P4-FR-01', questionFamilyId: familyId,
      prompt: `Convert ${whole} ${numer}/${denom} to an improper fraction. What is the numerator?`,
      answer: improperNumer, answerType: 'number',
      instructionHint: 'Multiply whole by denominator, then add numerator.',
      solutionText: `${whole} × ${denom} + ${numer} = ${improperNumer}. So ${whole} ${numer}/${denom} = ${improperNumer}/${denom}.`,
      misconceptionTraps: ['mixed_to_improper_add_error'],
    };
  }
  if (familyId.endsWith('_002')) {
    return {
      skillId: 'P4-FR-01', questionFamilyId: familyId,
      prompt: `Convert ${improperNumer}/${denom} to a mixed number. What is the whole number part?`,
      answer: whole, answerType: 'number',
      instructionHint: 'Divide numerator by denominator.',
      solutionText: `${improperNumer} ÷ ${denom} = ${whole} remainder ${numer}. So ${improperNumer}/${denom} = ${whole} ${numer}/${denom}.`,
      misconceptionTraps: ['improper_to_mixed_remainder_error'],
    };
  }
  const matchCorrect = pick([true, false]);
  const showNumer = matchCorrect ? improperNumer : improperNumer + randInt(1, 3);
  return {
    skillId: 'P4-FR-01', questionFamilyId: familyId,
    prompt: `Does ${whole} ${numer}/${denom} equal ${showNumer}/${denom}?`,
    answer: matchCorrect ? 'Yes' : 'No', answerType: 'choice', options: ['Yes', 'No'],
    instructionHint: 'Convert mixed to improper and compare.',
    solutionText: `${whole} ${numer}/${denom} = ${improperNumer}/${denom}. ${matchCorrect ? 'Same' : 'Different'}. Answer: ${matchCorrect ? 'Yes' : 'No'}.`,
    misconceptionTraps: ['mixed_to_improper_add_error'],
  };
}

const FRAC_CONFIGS = [
  { n: 1, d: 2 }, { n: 1, d: 3 }, { n: 1, d: 4 }, { n: 1, d: 5 },
  { n: 2, d: 3 }, { n: 2, d: 5 }, { n: 3, d: 4 }, { n: 3, d: 5 },
  { n: 3, d: 8 }, { n: 5, d: 6 }, { n: 4, d: 5 },
];

function generateFractionOfSet(familyId) {
  if (familyId.endsWith('_001')) {
    const denom = pick([2, 3, 4, 5, 6, 8]);
    const mult = randInt(2, 8);
    const total = denom * mult;
    return {
      skillId: 'P4-FR-02', questionFamilyId: familyId,
      prompt: `What is 1/${denom} of ${total}?`,
      answer: mult, answerType: 'number',
      instructionHint: `Divide ${total} by ${denom}.`,
      solutionText: `1/${denom} of ${total} = ${total} ÷ ${denom} = ${mult}.`,
      misconceptionTraps: ['fraction_of_set_forgets_multiply'],
    };
  }
  if (familyId.endsWith('_002')) {
    const c = pick(FRAC_CONFIGS.filter((x) => x.n > 1));
    const mult = randInt(2, 6);
    const total = c.d * mult;
    const answer = c.n * mult;
    return {
      skillId: 'P4-FR-02', questionFamilyId: familyId,
      prompt: `What is ${c.n}/${c.d} of ${total}?`,
      answer, answerType: 'number',
      instructionHint: `Divide by ${c.d}, then multiply by ${c.n}.`,
      solutionText: `${total} ÷ ${c.d} = ${mult}. ${mult} × ${c.n} = ${answer}.`,
      misconceptionTraps: ['fraction_of_set_divides_by_numerator', 'fraction_of_set_forgets_multiply'],
    };
  }
  const c = pick(FRAC_CONFIGS);
  const mult = randInt(2, 8);
  const total = c.d * mult;
  const answer = c.n * mult;
  const items = pick(['marbles', 'stickers', 'sweets', 'beads', 'books']);
  return {
    skillId: 'P4-FR-02', questionFamilyId: familyId,
    prompt: `Ali has ${total} ${items}. He gives ${c.n}/${c.d} of them away. How many does he give away?`,
    answer, answerType: 'number',
    instructionHint: `Find ${c.n}/${c.d} of ${total}.`,
    solutionText: `${total} ÷ ${c.d} = ${mult}. ${mult} × ${c.n} = ${answer}.`,
    misconceptionTraps: ['fraction_of_set_divides_by_numerator'],
  };
}

const UNLIKE = [[2,3],[2,5],[3,4],[3,5],[4,5],[3,8],[5,6],[3,10],[6,8]];

function generateUnlikeFractions(familyId) {
  const [dA, dB] = pick(UNLIKE);
  const lcd = lcmOf(dA, dB);

  if (familyId.endsWith('_001')) {
    const nA = randInt(1, dA - 1), nB = randInt(1, dB - 1);
    const cA = nA * (lcd / dA), cB = nB * (lcd / dB);
    const ans = cA + cB;
    return {
      skillId: 'P4-FR-03', questionFamilyId: familyId,
      prompt: `${nA}/${dA} + ${nB}/${dB} = ?/${lcd}. What is the numerator?`,
      answer: ans, answerType: 'number',
      instructionHint: `Rewrite over ${lcd}, then add.`,
      solutionText: `${nA}/${dA} = ${cA}/${lcd}, ${nB}/${dB} = ${cB}/${lcd}. ${cA}+${cB}=${ans}.`,
      misconceptionTraps: ['adds_denominators', 'wrong_common_denominator'],
    };
  }
  if (familyId.endsWith('_002')) {
    const nA = randInt(1, dA - 1), nB = randInt(1, dB - 1);
    const cA = nA * (lcd / dA), cB = nB * (lcd / dB);
    const big = Math.max(cA, cB), small = Math.min(cA, cB);
    const ans = big - small;
    const bigF = cA >= cB ? `${nA}/${dA}` : `${nB}/${dB}`;
    const smallF = cA >= cB ? `${nB}/${dB}` : `${nA}/${dA}`;
    return {
      skillId: 'P4-FR-03', questionFamilyId: familyId,
      prompt: `${bigF} − ${smallF} = ?/${lcd}. What is the numerator?`,
      answer: ans, answerType: 'number',
      instructionHint: `Rewrite over ${lcd}, then subtract.`,
      solutionText: `${big}/${lcd} − ${small}/${lcd} = ${ans}/${lcd}.`,
      misconceptionTraps: ['adds_denominators'],
    };
  }
  const isAdd = pick([true, false]);
  const nA = randInt(1, dA - 1), nB = randInt(1, dB - 1);
  const cA = nA * (lcd / dA), cB = nB * (lcd / dB);
  let resN;
  if (isAdd) { resN = cA + cB; } else { resN = Math.abs(cA - cB); }
  const g = gcd(resN, lcd);
  const sN = resN / g, sD = lcd / g;
  return {
    skillId: 'P4-FR-03', questionFamilyId: familyId,
    prompt: `Simplify the answer: ${nA}/${dA} ${isAdd ? '+' : '−'} ${nB}/${dB}. What is the simplified numerator? (denominator = ${sD})`,
    answer: sN, answerType: 'number',
    instructionHint: `Compute over ${lcd}, then simplify.`,
    solutionText: `Result: ${resN}/${lcd}. GCD=${g}. Simplified: ${sN}/${sD}.`,
    misconceptionTraps: ['forgets_to_simplify'],
  };
}

const generatorsBySkill = { 'P4-FR-01': generateMixedImproper, 'P4-FR-02': generateFractionOfSet, 'P4-FR-03': generateUnlikeFractions };

export function generateQuestion(skillId, options = {}) {
  const skill = getSkill(skillId); if (!skill) return null;
  const families = getQuestionFamiliesBySkill(skillId); if (!families.length) return null;
  const family = options.questionFamilyId ? families.find((f) => f.id === options.questionFamilyId) || pick(families) : pick(families);
  const gen = generatorsBySkill[skillId]; if (!gen) return null;
  const q = gen(family.id);
  return { ...q, questionId: `${family.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, difficulty: family.difficulty, fluencyTargetSeconds: family.fluencyTargetSeconds, visualRequirement: skill.visual };
}
export function generateQuestionSet(skillId, count = 5, opts = {}) { const q = []; for (let i = 0; i < count; i++) { const r = generateQuestion(skillId, opts); if (r) q.push(r); } return q; }
export function generateDiagnosticSet(sids, per = 3) { const q = []; for (const s of sids) q.push(...generateQuestionSet(s, per)); return q; }
export function getSupportedSkillIds() { return Object.keys(generatorsBySkill); }
export default { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds };
