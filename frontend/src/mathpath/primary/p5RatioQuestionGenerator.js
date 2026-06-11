import { getSkill } from './p5RatioSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p5RatioQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
function simplifyRatio(a, b) { const d = gcd(a, b); return [a / d, b / d]; }
function formatRatio(a, b) { return `${a} : ${b}`; }

/* ── Ratio pools ── */
const RATIO_PAIRS = [
  [4,6],[6,9],[8,12],[10,15],[12,16],[14,21],[15,20],[18,24],[20,30],[24,36],
  [9,12],[10,25],[6,15],[8,20],[12,18],[16,20],[21,28],[25,35],[6,10],[15,25],
];
const SIMPLE_RATIOS = [
  [1,2],[1,3],[2,3],[1,4],[3,4],[2,5],[3,5],[1,5],[3,7],[2,7],[4,5],[5,6],[3,8],[5,8],
];
const NAMES = ['Ali','Mei','Ravi','Siti','Kumar','Wei Lin','Priya','Zhen','Aisha','Jun'];
const ITEMS = ['stickers','marbles','beads','stamps','coins','erasers','pencils','cards','badges','tokens'];

/* ── RAT-01 generators ── */
function generateRatConcept(familyId) {
  if (familyId.endsWith('_001')) {
    const [a, b] = pick(RATIO_PAIRS);
    const [sa, sb] = simplifyRatio(a, b);
    return {
      skillId: 'P5-RAT-01', questionFamilyId: familyId,
      prompt: `Express the ratio ${a} : ${b} in its simplest form.`,
      answer: formatRatio(sa, sb), answerType: 'text',
      instructionHint: 'Find the HCF of both numbers and divide each term by it.',
      solutionText: `HCF of ${a} and ${b} is ${gcd(a, b)}. ${a} ÷ ${gcd(a, b)} = ${sa}, ${b} ÷ ${gcd(a, b)} = ${sb}. Simplest form: ${formatRatio(sa, sb)}.`,
      misconceptionTraps: ['forgets_to_simplify_ratio', 'adds_instead_of_divides_for_ratio'],
    };
  }
  if (familyId.endsWith('_002')) {
    const [sa, sb] = pick(SIMPLE_RATIOS);
    const multiplier = randInt(3, 9);
    const side = pick(['left', 'right']);
    let prompt, answer, solutionText;
    if (side === 'left') {
      prompt = `${sa} : ${sb} = ? : ${sb * multiplier}`;
      answer = sa * multiplier;
      solutionText = `${sb} × ${multiplier} = ${sb * multiplier}, so ? = ${sa} × ${multiplier} = ${sa * multiplier}.`;
    } else {
      prompt = `${sa} : ${sb} = ${sa * multiplier} : ?`;
      answer = sb * multiplier;
      solutionText = `${sa} × ${multiplier} = ${sa * multiplier}, so ? = ${sb} × ${multiplier} = ${sb * multiplier}.`;
    }
    return {
      skillId: 'P5-RAT-01', questionFamilyId: familyId,
      prompt: `Find the missing term.\n${prompt}`,
      answer, answerType: 'number',
      instructionHint: 'Find what the known term was multiplied by, then apply the same multiplier.',
      solutionText,
      misconceptionTraps: ['adds_instead_of_divides_for_ratio'],
    };
  }
  /* _003: express two quantities as a ratio */
  const d = gcd(...pick(RATIO_PAIRS));
  const multiplier = randInt(2, 6);
  const [sa, sb] = pick(SIMPLE_RATIOS);
  const qtyA = sa * multiplier;
  const qtyB = sb * multiplier;
  const item = pick(ITEMS);
  const nameA = pick(NAMES);
  let nameB = pick(NAMES);
  while (nameB === nameA) nameB = pick(NAMES);
  return {
    skillId: 'P5-RAT-01', questionFamilyId: familyId,
    prompt: `${nameA} has ${qtyA} ${item} and ${nameB} has ${qtyB} ${item}. Express the ratio of ${nameA}'s ${item} to ${nameB}'s ${item} in simplest form.`,
    answer: formatRatio(sa, sb), answerType: 'text',
    instructionHint: 'Write the quantities as a ratio, then simplify by dividing both terms by the HCF.',
    solutionText: `Ratio = ${qtyA} : ${qtyB}. HCF of ${qtyA} and ${qtyB} is ${gcd(qtyA, qtyB)}. Simplest form: ${formatRatio(sa, sb)}.`,
    misconceptionTraps: ['reverses_ratio_order', 'forgets_to_simplify_ratio'],
  };
}

/* ── RAT-02 generators ── */
function generateRatFraction(familyId) {
  if (familyId.endsWith('_001')) {
    const [a, b] = pick(SIMPLE_RATIOS);
    const total = a + b;
    const askFirst = pick([true, false]);
    const partLabel = askFirst ? 'first' : 'second';
    const numerator = askFirst ? a : b;
    const [sn, sd] = simplifyRatio(numerator, total);
    return {
      skillId: 'P5-RAT-02', questionFamilyId: familyId,
      prompt: `The ratio of red beads to blue beads is ${a} : ${b}. What fraction of all the beads are the ${askFirst ? 'red' : 'blue'} beads?`,
      answer: `${sn}/${sd}`, answerType: 'text',
      instructionHint: 'Total parts = sum of both terms. The fraction is the part over the total.',
      solutionText: `Total parts = ${a} + ${b} = ${total}. Fraction of ${partLabel} = ${numerator}/${total}${sn !== numerator ? ` = ${sn}/${sd}` : ''}.`,
      misconceptionTraps: ['confuses_ratio_with_fraction', 'divides_total_by_one_part'],
    };
  }
  if (familyId.endsWith('_002')) {
    const [a, b] = pick(SIMPLE_RATIOS);
    const askAOverB = pick([true, false]);
    let prompt, numerator, denominator;
    if (askAOverB) {
      prompt = `The ratio of boys to girls is ${a} : ${b}. What fraction of the girls is the number of boys?`;
      numerator = a; denominator = b;
    } else {
      prompt = `The ratio of boys to girls is ${a} : ${b}. What fraction of the boys is the number of girls?`;
      numerator = b; denominator = a;
    }
    const [sn, sd] = simplifyRatio(numerator, denominator);
    return {
      skillId: 'P5-RAT-02', questionFamilyId: familyId,
      prompt,
      answer: `${sn}/${sd}`, answerType: 'text',
      instructionHint: 'To express A as a fraction of B, write A/B and simplify.',
      solutionText: `Fraction = ${numerator}/${denominator}${sn !== numerator ? ` = ${sn}/${sd}` : ''}.`,
      misconceptionTraps: ['confuses_ratio_with_fraction', 'reverses_ratio_order'],
    };
  }
  /* _003: from fraction to ratio */
  const [a, b] = pick(SIMPLE_RATIOS);
  const total = a + b;
  const item = pick(ITEMS);
  const [sn, sd] = simplifyRatio(a, total);
  return {
    skillId: 'P5-RAT-02', questionFamilyId: familyId,
    prompt: `${sn}/${sd} of the ${item} in a bag are red. The rest are yellow. What is the ratio of red ${item} to yellow ${item}?`,
    answer: formatRatio(a, b), answerType: 'text',
    instructionHint: 'If a/t are red, then (t - a)/t are yellow. The ratio is a : (t - a).',
    solutionText: `Red fraction = ${sn}/${sd}. Yellow fraction = ${sd - sn}/${sd}. Ratio = ${a} : ${b}.`,
    misconceptionTraps: ['confuses_ratio_with_fraction'],
  };
}

/* ── RAT-03 generators ── */
function generateRatWordProb(familyId) {
  if (familyId.endsWith('_001')) {
    const [a, b] = pick(SIMPLE_RATIOS);
    const totalParts = a + b;
    const multiplier = randInt(3, 12);
    const totalQty = totalParts * multiplier;
    const shareA = a * multiplier;
    const shareB = b * multiplier;
    const item = pick(ITEMS);
    const nameA = pick(NAMES);
    let nameB = pick(NAMES);
    while (nameB === nameA) nameB = pick(NAMES);
    const askFirst = pick([true, false]);
    const answerValue = askFirst ? shareA : shareB;
    const who = askFirst ? nameA : nameB;
    return {
      skillId: 'P5-RAT-03', questionFamilyId: familyId,
      prompt: `${nameA} and ${nameB} share ${totalQty} ${item} in the ratio ${a} : ${b}. How many ${item} does ${who} get?`,
      answer: answerValue, answerType: 'number',
      instructionHint: `Total parts = ${a} + ${b} = ${totalParts}. Value of 1 part = total ÷ ${totalParts}.`,
      solutionText: `Total parts = ${totalParts}. 1 part = ${totalQty} ÷ ${totalParts} = ${multiplier}. ${nameA} gets ${a} × ${multiplier} = ${shareA}. ${nameB} gets ${b} × ${multiplier} = ${shareB}.`,
      misconceptionTraps: ['divides_total_by_one_part', 'adds_instead_of_divides_for_ratio'],
    };
  }
  if (familyId.endsWith('_002')) {
    const [a, b] = pick(SIMPLE_RATIOS);
    const totalParts = a + b;
    const multiplier = randInt(3, 10);
    const giveFirst = pick([true, false]);
    const knownShare = giveFirst ? a * multiplier : b * multiplier;
    const knownParts = giveFirst ? a : b;
    const totalQty = totalParts * multiplier;
    const item = pick(ITEMS);
    const nameA = pick(NAMES);
    let nameB = pick(NAMES);
    while (nameB === nameA) nameB = pick(NAMES);
    const who = giveFirst ? nameA : nameB;
    return {
      skillId: 'P5-RAT-03', questionFamilyId: familyId,
      prompt: `${nameA} and ${nameB} share some ${item} in the ratio ${a} : ${b}. ${who} receives ${knownShare} ${item}. How many ${item} are there altogether?`,
      answer: totalQty, answerType: 'number',
      instructionHint: `${who}'s share corresponds to ${knownParts} parts. Find the value of 1 part first.`,
      solutionText: `${who} has ${knownParts} parts = ${knownShare}. 1 part = ${knownShare} ÷ ${knownParts} = ${multiplier}. Total = ${totalParts} × ${multiplier} = ${totalQty}.`,
      misconceptionTraps: ['divides_total_by_one_part'],
    };
  }
  /* _003: compare quantities / find difference */
  const [a, b] = pick(SIMPLE_RATIOS.filter(([x, y]) => x !== y));
  const multiplier = randInt(3, 10);
  const giveFirst = pick([true, false]);
  const knownQty = giveFirst ? a * multiplier : b * multiplier;
  const knownParts = giveFirst ? a : b;
  const unknownParts = giveFirst ? b : a;
  const unknownQty = unknownParts * multiplier;
  const item = pick(ITEMS);
  const nameA = pick(NAMES);
  let nameB = pick(NAMES);
  while (nameB === nameA) nameB = pick(NAMES);
  const knownName = giveFirst ? nameA : nameB;
  const unknownName = giveFirst ? nameB : nameA;
  return {
    skillId: 'P5-RAT-03', questionFamilyId: familyId,
    prompt: `The ratio of ${nameA}'s ${item} to ${nameB}'s ${item} is ${a} : ${b}. ${knownName} has ${knownQty} ${item}. How many ${item} does ${unknownName} have?`,
    answer: unknownQty, answerType: 'number',
    instructionHint: `Find the value of 1 part from the known quantity, then multiply by the unknown number of parts.`,
    solutionText: `${knownName} has ${knownParts} parts = ${knownQty}. 1 part = ${knownQty} ÷ ${knownParts} = ${multiplier}. ${unknownName} has ${unknownParts} parts = ${unknownParts} × ${multiplier} = ${unknownQty}.`,
    misconceptionTraps: ['reverses_ratio_order', 'divides_total_by_one_part'],
  };
}

const generatorsBySkill = { 'P5-RAT-01': generateRatConcept, 'P5-RAT-02': generateRatFraction, 'P5-RAT-03': generateRatWordProb };

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
