import { getSkill } from './p6RatioSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p6RatioQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function gcd(a, b) { while (b) { const t = b; b = a % b; a = t; } return a; }
function gcd3(a, b, c) { return gcd(gcd(a, b), c); }

const NAMES = ['Ali', 'Mei', 'Ravi', 'Sarah', 'Tom'];

/* ---------- P6-RAT-01: Equivalent Ratios & Simplification ---------- */

function generateEquivRatioSimplify(familyId) {
  if (familyId.endsWith('_001')) {
    // Simplify a two-term ratio
    const g = randInt(2, 9);
    const a = randInt(1, 8);
    let b = randInt(1, 8);
    while (b === a) b = randInt(1, 8);
    // Ensure a and b are coprime so g is the full GCD
    const d = gcd(a, b);
    const simplA = a / d;
    const simplB = b / d;
    const bigA = a * g;
    const bigB = b * g;
    const answer = `${simplA} : ${simplB}`;
    return {
      skillId: 'P6-RAT-01', questionFamilyId: familyId,
      prompt: `Express the ratio ${bigA} : ${bigB} in its simplest form.`,
      answer, answerType: 'text',
      instructionHint: `Find the HCF of ${bigA} and ${bigB}, then divide both terms by it.`,
      solutionText: `HCF of ${bigA} and ${bigB} is ${g * d}. ${bigA} ÷ ${g * d} = ${simplA}, ${bigB} ÷ ${g * d} = ${simplB}. Simplest form: ${simplA} : ${simplB}.`,
      misconceptionTraps: ['simplifies_only_one_term', 'ratio_order_reversed'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Find missing term: a : b = c : ?
    const a = randInt(2, 9);
    let b = randInt(2, 9);
    while (b === a) b = randInt(2, 9);
    const multiplier = randInt(2, 8);
    const c = a * multiplier;
    const answer = b * multiplier;
    return {
      skillId: 'P6-RAT-01', questionFamilyId: familyId,
      prompt: `${a} : ${b} = ${c} : ?. Find the missing number.`,
      answer, answerType: 'number',
      instructionHint: `Find what ${a} was multiplied by to get ${c}, then multiply ${b} by the same number.`,
      solutionText: `${c} ÷ ${a} = ${multiplier}. So ? = ${b} × ${multiplier} = ${answer}.`,
      misconceptionTraps: ['ratio_order_reversed'],
    };
  }

  // _003: Three-quantity ratio simplification
  const g = randInt(2, 6);
  let a = randInt(1, 7);
  let b = randInt(1, 7);
  let c = randInt(1, 7);
  // Ensure not all three equal
  while (a === b && b === c) { c = randInt(1, 7); }
  const d = gcd3(a, b, c);
  const simplA = a / d;
  const simplB = b / d;
  const simplC = c / d;
  const bigA = a * g;
  const bigB = b * g;
  const bigC = c * g;
  const answer = `${simplA} : ${simplB} : ${simplC}`;
  return {
    skillId: 'P6-RAT-01', questionFamilyId: familyId,
    prompt: `Express the ratio ${bigA} : ${bigB} : ${bigC} in its simplest form.`,
    answer, answerType: 'text',
    instructionHint: `Find the HCF of all three terms, then divide each term by it.`,
    solutionText: `HCF of ${bigA}, ${bigB} and ${bigC} is ${g * d}. ${bigA} ÷ ${g * d} = ${simplA}, ${bigB} ÷ ${g * d} = ${simplB}, ${bigC} ÷ ${g * d} = ${simplC}. Simplest form: ${simplA} : ${simplB} : ${simplC}.`,
    misconceptionTraps: ['simplifies_only_one_term', 'three_quantity_ratio_error'],
  };
}

/* ---------- P6-RAT-02: Ratio Word Problems ---------- */

function generateRatioWordProblem(familyId) {
  if (familyId.endsWith('_001')) {
    // Share $X in ratio a : b
    const a = randInt(1, 7);
    let b = randInt(1, 7);
    while (b === a) b = randInt(1, 7);
    const unitValue = randInt(2, 15);
    const total = (a + b) * unitValue;
    const name1 = pick(NAMES);
    let name2 = pick(NAMES);
    while (name2 === name1) name2 = pick(NAMES);
    const item = pick(['$', 'stickers', 'marbles', 'sweets', 'beads']);
    const prefix = item === '$' ? '$' : '';
    const suffix = item === '$' ? '' : ` ${item}`;
    const shareA = a * unitValue;
    const answer = shareA;
    return {
      skillId: 'P6-RAT-02', questionFamilyId: familyId,
      prompt: `${name1} and ${name2} share ${prefix}${total}${suffix} in the ratio ${a} : ${b}. How many${item === '$' ? ' dollars does' : ` ${item} does`} ${name1} get?`,
      answer, answerType: 'number',
      instructionHint: `Total parts = ${a} + ${b} = ${a + b}. Value of 1 part = ${total} ÷ ${a + b} = ${unitValue}.`,
      solutionText: `Total parts = ${a} + ${b} = ${a + b}. 1 part = ${total} ÷ ${a + b} = ${unitValue}. ${name1} gets ${a} × ${unitValue} = ${shareA}.`,
      misconceptionTraps: ['divides_by_wrong_total', 'forgets_ratio_sum'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Given ratio and one share, find total
    const a = randInt(2, 7);
    let b = randInt(2, 7);
    while (b === a) b = randInt(2, 7);
    const unitValue = randInt(3, 12);
    const shareA = a * unitValue;
    const total = (a + b) * unitValue;
    const name1 = pick(NAMES);
    let name2 = pick(NAMES);
    while (name2 === name1) name2 = pick(NAMES);
    const answer = total;
    return {
      skillId: 'P6-RAT-02', questionFamilyId: familyId,
      prompt: `The ratio of ${name1}'s stickers to ${name2}'s stickers is ${a} : ${b}. ${name1} has ${shareA} stickers. How many stickers do they have altogether?`,
      answer, answerType: 'number',
      instructionHint: `Find the value of 1 part: ${shareA} ÷ ${a} = ${unitValue}. Then multiply by total parts.`,
      solutionText: `1 part = ${shareA} ÷ ${a} = ${unitValue}. Total parts = ${a} + ${b} = ${a + b}. Total = ${a + b} × ${unitValue} = ${total}.`,
      misconceptionTraps: ['forgets_ratio_sum', 'confuses_ratio_fraction'],
    };
  }

  // _003: Given ratio and total, find one group
  const a = randInt(2, 6);
  let b = randInt(2, 6);
  while (b === a) b = randInt(2, 6);
  const unitValue = randInt(3, 15);
  const total = (a + b) * unitValue;
  const context = pick(['boys', 'girls', 'red beads', 'blue beads', 'chicken pies', 'curry puffs']);
  const other = pick(['girls', 'boys', 'blue beads', 'red beads', 'curry puffs', 'chicken pies']);
  const answer = b * unitValue;
  return {
    skillId: 'P6-RAT-02', questionFamilyId: familyId,
    prompt: `The ratio of ${context} to ${other} is ${a} : ${b}. There are ${total} in total. How many ${other} are there?`,
    answer, answerType: 'number',
    instructionHint: `Total parts = ${a} + ${b} = ${a + b}. 1 part = ${total} ÷ ${a + b} = ${unitValue}.`,
    solutionText: `Total parts = ${a} + ${b} = ${a + b}. 1 part = ${total} ÷ ${a + b} = ${unitValue}. ${other} = ${b} × ${unitValue} = ${answer}.`,
    misconceptionTraps: ['divides_by_wrong_total', 'forgets_ratio_sum'],
  };
}

/* ---------- P6-RAT-03: Changing Ratios (Before-After) ---------- */

function generateChangingRatio(familyId) {
  if (familyId.endsWith('_001')) {
    // Before-After: One person spends
    // Before ratio a:b, person A spends $X, after ratio c:d
    // Person B stays the same. Before B = b*k, After B = d*m => b*k = d*m
    // Pick k, m such that b*k = d*m. Then A_before = a*k, A_after = c*m, spent = a*k - c*m
    const a = randInt(2, 5);
    let b = randInt(2, 5);
    while (b === a) b = randInt(2, 5);

    // After ratio: person A has less, person B unchanged
    // We need c*m < a*k and b*k = d*m
    // Pick multiplier for before
    const k = randInt(2, 8);
    const beforeA = a * k;
    const beforeB = b * k;

    // Person B doesn't change. Pick after ratio denominator d such that beforeB % d === 0
    const divisors = [];
    for (let d = 1; d <= beforeB; d++) { if (beforeB % d === 0) divisors.push(d); }
    const d = pick(divisors.filter(dv => dv >= 2 && dv <= 9));
    if (!d) return generateChangingRatioFallback(familyId, 'spent');
    const m = beforeB / d;
    // afterA must be less than beforeA and > 0, expressed as c * m
    // c = afterA / m; afterA must be divisible by m and < beforeA
    const maxC = Math.floor((beforeA - 1) / m);
    if (maxC < 1) return generateChangingRatioFallback(familyId, 'spent');
    const c = randInt(1, maxC);
    const afterA = c * m;
    const spent = beforeA - afterA;
    if (spent <= 0) return generateChangingRatioFallback(familyId, 'spent');

    const name1 = pick(NAMES);
    let name2 = pick(NAMES);
    while (name2 === name1) name2 = pick(NAMES);
    const answer = beforeA;

    return {
      skillId: 'P6-RAT-03', questionFamilyId: familyId,
      prompt: `${name1} and ${name2} had money in the ratio ${a} : ${b}. After ${name1} spent $${spent}, the ratio became ${c} : ${d}. How much did ${name1} have at first?`,
      answer, answerType: 'number',
      instructionHint: `${name2}'s amount did not change. Use ${name2}'s part to find the value of 1 unit in both ratios.`,
      solutionText: `Before: ${name1} = ${a} units, ${name2} = ${b} units. After: ratio ${c} : ${d}. ${name2} unchanged: ${b} units = ${d} parts, so 1 part = ${k} (since ${b}×${k}=${beforeB} and ${d}×${m}=${beforeB}). ${name1} at first = ${a} × ${k} = ${beforeA}. Check: ${beforeA} − ${spent} = ${afterA} = ${c} × ${m}.`,
      misconceptionTraps: ['before_after_wrong_constant', 'subtracts_ratio_parts'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Before-After: One person receives
    // Before ratio a:b, person A receives $X, after ratio c:d
    // Person B unchanged
    const a = randInt(1, 4);
    let b = randInt(2, 6);
    while (b === a) b = randInt(2, 6);

    const k = randInt(2, 8);
    const beforeA = a * k;
    const beforeB = b * k;

    const divisors = [];
    for (let d = 1; d <= beforeB; d++) { if (beforeB % d === 0) divisors.push(d); }
    const d = pick(divisors.filter(dv => dv >= 2 && dv <= 9));
    if (!d) return generateChangingRatioFallback(familyId, 'received');
    const m = beforeB / d;
    // afterA must be more than beforeA, c = afterA / m, afterA > beforeA
    const minC = Math.ceil((beforeA + 1) / m);
    const maxC = Math.floor((beforeA + 60) / m);
    if (minC > maxC || minC > 12) return generateChangingRatioFallback(familyId, 'received');
    const c = randInt(minC, Math.min(maxC, 12));
    const afterA = c * m;
    const received = afterA - beforeA;
    if (received <= 0) return generateChangingRatioFallback(familyId, 'received');

    const name1 = pick(NAMES);
    let name2 = pick(NAMES);
    while (name2 === name1) name2 = pick(NAMES);
    const answer = beforeA;

    return {
      skillId: 'P6-RAT-03', questionFamilyId: familyId,
      prompt: `${name1} and ${name2} had savings in the ratio ${a} : ${b}. After ${name1} received $${received}, the ratio became ${c} : ${d}. How much did ${name1} have at first?`,
      answer, answerType: 'number',
      instructionHint: `${name2}'s amount did not change. Find the value of 1 unit using ${name2}'s part.`,
      solutionText: `Before: ${name1} = ${a} units, ${name2} = ${b} units. After: ratio ${c} : ${d}. ${name2} unchanged: ${b}×${k} = ${beforeB} = ${d}×${m}. ${name1} at first = ${a}×${k} = ${beforeA}. Check: ${beforeA} + ${received} = ${afterA} = ${c}×${m}.`,
      misconceptionTraps: ['before_after_wrong_constant', 'subtracts_ratio_parts'],
    };
  }

  // _003: Transfer between two people
  // Before a:b, transfer $X from person A to B, after c:d
  // Total stays the same: a*k + b*k = c*m + d*m => (a+b)*k = (c+d)*m
  const a = randInt(3, 7);
  let b = randInt(1, 5);
  while (b === a) b = randInt(1, 5);

  // Pick after ratio c:d where c+d divides (a+b)*k
  const totalParts = a + b;
  const k = randInt(2, 7);
  const totalAmount = totalParts * k;

  // Find after ratios c:d where c+d divides totalAmount, c < a*k (A gave away some)
  const afterSums = [];
  for (let s = 3; s <= 15; s++) { if (totalAmount % s === 0) afterSums.push(s); }
  if (!afterSums.length) return generateChangingRatioFallback(familyId, 'transfer');

  const afterSum = pick(afterSums);
  const m = totalAmount / afterSum;

  // c must be < a*k/m (person A has less after giving) and c >= 1
  const maxC = Math.floor((a * k - 1) / m);
  if (maxC < 1) return generateChangingRatioFallback(familyId, 'transfer');
  const c = randInt(1, maxC);
  const d = afterSum - c;
  if (d < 1) return generateChangingRatioFallback(familyId, 'transfer');

  const beforeA = a * k;
  const afterA = c * m;
  const transferred = beforeA - afterA;
  if (transferred <= 0) return generateChangingRatioFallback(familyId, 'transfer');

  const name1 = pick(NAMES);
  let name2 = pick(NAMES);
  while (name2 === name1) name2 = pick(NAMES);
  const answer = beforeA;

  return {
    skillId: 'P6-RAT-03', questionFamilyId: familyId,
    prompt: `${name1} and ${name2} had beads in the ratio ${a} : ${b}. ${name1} gave ${transferred} beads to ${name2}. The ratio became ${c} : ${d}. How many beads did ${name1} have at first?`,
    answer, answerType: 'number',
    instructionHint: `The total number of beads did not change. Use the total to find the value of 1 unit.`,
    solutionText: `Total = (${a}+${b})×${k} = ${totalAmount}. Before: ${name1} = ${a}×${k} = ${beforeA}, ${name2} = ${b}×${k} = ${b * k}. After: (${c}+${d})×${m} = ${totalAmount}. ${name1} after = ${c}×${m} = ${afterA}. Transfer = ${beforeA}−${afterA} = ${transferred}. ${name1} at first = ${beforeA}.`,
    misconceptionTraps: ['before_after_wrong_constant', 'confuses_ratio_fraction'],
  };
}

function generateChangingRatioFallback(familyId, type) {
  if (type === 'spent') {
    // Ali and Mei had money in ratio 3:5. Ali spent $20, ratio became 1:5. Find Ali's original.
    // Before: 3k:5k. After: (3k-20):5k = 1:5. So 5(3k-20)=5k => 15k-100=5k => 10k=100 => k=10.
    // Ali at first = 30.
    return {
      skillId: 'P6-RAT-03', questionFamilyId: familyId,
      prompt: `Ali and Mei had money in the ratio 3 : 5. After Ali spent $20, the ratio became 1 : 5. How much did Ali have at first?`,
      answer: 30, answerType: 'number',
      instructionHint: `Mei's amount did not change. Find the value of 1 unit using Mei's part.`,
      solutionText: `Before: Ali = 3 units, Mei = 5 units. Mei unchanged: 5 units = 5 parts. So 1 unit = 1 part = 6. Wait — let's use algebra: 5k = 5m, and 3k − 20 = 1m. From first: k = m. So 3k − 20 = k => 2k = 20 => k = 10. Ali = 3 × 10 = 30.`,
      misconceptionTraps: ['before_after_wrong_constant', 'subtracts_ratio_parts'],
    };
  }
  if (type === 'received') {
    // Ravi and Sarah had savings in ratio 1:3. Ravi received $40, ratio became 3:3 = 1:1.
    // Before: k:3k. After: (k+40):3k = 1:1. So k+40=3k => 40=2k => k=20. Ravi = 20.
    return {
      skillId: 'P6-RAT-03', questionFamilyId: familyId,
      prompt: `Ravi and Sarah had savings in the ratio 1 : 3. After Ravi received $40, the ratio became 1 : 1. How much did Ravi have at first?`,
      answer: 20, answerType: 'number',
      instructionHint: `Sarah's amount did not change. Find the value of 1 unit using Sarah's part.`,
      solutionText: `Before: Ravi = 1 unit, Sarah = 3 units. Sarah unchanged: 3 units = 1 part × 3 = 3 parts. But after ratio 1:1 means they are equal. So Ravi + 40 = Sarah = 3k. Also Ravi = k. So k + 40 = 3k => 2k = 40 => k = 20. Ravi = 20.`,
      misconceptionTraps: ['before_after_wrong_constant', 'subtracts_ratio_parts'],
    };
  }
  // transfer fallback
  // Tom and Mei had beads in ratio 5:3. Tom gave 12 beads to Mei. Ratio became 1:1.
  // Total = 8k. After: 4m each. 8k = 8m => k = m. Before Tom = 5k. 5k - 12 = 4k => k=12. Tom = 60.
  return {
    skillId: 'P6-RAT-03', questionFamilyId: familyId,
    prompt: `Tom and Mei had beads in the ratio 5 : 3. Tom gave 12 beads to Mei. The ratio became 1 : 1. How many beads did Tom have at first?`,
    answer: 60, answerType: 'number',
    instructionHint: `The total number of beads did not change. Use the total to find the value of 1 unit.`,
    solutionText: `Total = (5+3)k = 8k. After: ratio 1:1, total still 8k, so each has 4k. Tom before − 12 = Tom after: 5k − 12 = 4k => k = 12. Tom at first = 5 × 12 = 60.`,
    misconceptionTraps: ['before_after_wrong_constant', 'confuses_ratio_fraction'],
  };
}

const generatorsBySkill = {
  'P6-RAT-01': generateEquivRatioSimplify,
  'P6-RAT-02': generateRatioWordProblem,
  'P6-RAT-03': generateChangingRatio,
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
