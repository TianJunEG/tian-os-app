import { getSkill } from './p5WordProbSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p5WordProbQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const NAMES = ['Ali', 'Mei', 'Ravi', 'Sarah', 'Tom', 'Wei Ming', 'Priya', 'Ahmad', 'Siti', 'Lina'];

// ---------------------------------------------------------------------------
// P5-WP-01: Multi-Step Word Problems
// ---------------------------------------------------------------------------

function generateMultiStep(familyId) {
  const name = pick(NAMES);

  if (familyId.endsWith('_001')) {
    // Shopping with change — buy X items at $Y each, pay with $Z, find change
    const count = randInt(3, 9);
    const priceEach = pick([1.50, 2.50, 3.50, 4.50, 5.50, 6.50, 7.50, 8.50]);
    const totalCost = count * priceEach;
    const ceilTotal = Math.ceil(totalCost / 10) * 10;
    const paid = ceilTotal + (ceilTotal === totalCost ? pick([10, 20]) : pick([0, 10, 20]));
    const answer = paid - totalCost;
    const itemName = pick(['exercise books', 'folders', 'erasers', 'highlighters', 'rulers']);
    return {
      skillId: 'P5-WP-01',
      questionFamilyId: familyId,
      prompt: `${name} buys ${count} ${itemName} at $${priceEach.toFixed(2)} each. ${name} pays with $${paid.toFixed(2)}. How much change does ${name} receive?`,
      answer,
      answerType: 'number',
      instructionHint: `Step 1: Find total cost (${count} × $${priceEach.toFixed(2)}). Step 2: Subtract from $${paid.toFixed(2)}.`,
      solutionText: `${count} × $${priceEach.toFixed(2)} = $${totalCost.toFixed(2)}. $${paid.toFixed(2)} − $${totalCost.toFixed(2)} = $${answer.toFixed(2)}. ${name} receives $${answer.toFixed(2)} in change.`,
      misconceptionTraps: ['uses_wrong_operation', 'skips_intermediate_step'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Distribute equally with remainder
    const groups = pick([3, 4, 5, 6, 7, 8]);
    const perGroup = randInt(12, 35);
    const extra = randInt(1, groups - 1);
    const totalItems = groups * perGroup + extra;
    const answer = extra;
    const itemName = pick(['stickers', 'pencils', 'sweets', 'buttons', 'cards']);
    return {
      skillId: 'P5-WP-01',
      questionFamilyId: familyId,
      prompt: `${name} has ${totalItems} ${itemName} to share equally among ${groups} friends. Each friend gets the same number of ${itemName}. How many ${itemName} are left over?`,
      answer,
      answerType: 'number',
      instructionHint: `Divide ${totalItems} by ${groups}. The remainder is the answer.`,
      solutionText: `${totalItems} ÷ ${groups} = ${perGroup} remainder ${extra}. There are ${extra} ${itemName} left over.`,
      misconceptionTraps: ['uses_wrong_operation', 'skips_intermediate_step'],
    };
  }

  // _003: Multi-step comparison
  const countA = randInt(3, 8);
  const priceA = randInt(5, 15);
  const totalA = countA * priceA;
  const countB = randInt(2, 6);
  const priceB = randInt(8, 20);
  const totalB = countB * priceB;
  const answer = Math.abs(totalA - totalB);
  const nameB = pick(NAMES.filter((n) => n !== name));
  const itemA = pick(['pens', 'notebooks', 'markers', 'files']);
  const itemB = pick(['rulers', 'scissors', 'glue sticks', 'tape rolls']);
  const whoMore = totalA > totalB ? name : nameB;
  return {
    skillId: 'P5-WP-01',
    questionFamilyId: familyId,
    prompt: `${name} buys ${countA} ${itemA} at $${priceA} each. ${nameB} buys ${countB} ${itemB} at $${priceB} each. How much more does ${whoMore} spend than the other person?`,
    answer,
    answerType: 'number',
    instructionHint: `Step 1: Find ${name}'s total (${countA} × $${priceA}). Step 2: Find ${nameB}'s total (${countB} × $${priceB}). Step 3: Subtract the smaller from the larger.`,
    solutionText: `${name}: ${countA} × $${priceA} = $${totalA}. ${nameB}: ${countB} × $${priceB} = $${totalB}. Difference: $${Math.max(totalA, totalB)} − $${Math.min(totalA, totalB)} = $${answer}.`,
    misconceptionTraps: ['uses_wrong_operation', 'skips_intermediate_step'],
  };
}

// ---------------------------------------------------------------------------
// P5-WP-02: Before-After Word Problems
// ---------------------------------------------------------------------------

function generateBeforeAfter(familyId) {
  const name = pick(NAMES);

  if (familyId.endsWith('_001')) {
    // Had X, gave away Y, received Z, how many now
    const initial = randInt(120, 500);
    const gaveAway = randInt(30, Math.floor(initial * 0.5));
    const received = randInt(15, 80);
    const answer = initial - gaveAway + received;
    const itemName = pick(['stickers', 'marbles', 'cards', 'stamps', 'beads']);
    return {
      skillId: 'P5-WP-02',
      questionFamilyId: familyId,
      prompt: `${name} had ${initial} ${itemName}. ${name} gave ${gaveAway} ${itemName} to a friend and then received ${received} ${itemName} from a cousin. How many ${itemName} does ${name} have now?`,
      answer,
      answerType: 'number',
      instructionHint: `Step 1: Subtract ${gaveAway} from ${initial}. Step 2: Add ${received}.`,
      solutionText: `${initial} − ${gaveAway} = ${initial - gaveAway}. ${initial - gaveAway} + ${received} = ${answer}. ${name} has ${answer} ${itemName} now.`,
      misconceptionTraps: ['misreads_before_after', 'skips_intermediate_step'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Had X, spent some, left with Y, how much spent
    const initial = randInt(200, 800);
    const spent = randInt(50, Math.floor(initial * 0.6));
    const remaining = initial - spent;
    const answer = spent;
    const context = pick(['savings', 'pocket money', 'birthday money']);
    return {
      skillId: 'P5-WP-02',
      questionFamilyId: familyId,
      prompt: `${name} had $${initial} in ${context}. After buying some books, ${name} had $${remaining} left. How much did ${name} spend on books?`,
      answer,
      answerType: 'number',
      instructionHint: `Subtract the remaining amount from the initial amount: $${initial} − $${remaining}.`,
      solutionText: `$${initial} − $${remaining} = $${answer}. ${name} spent $${answer} on books.`,
      misconceptionTraps: ['misreads_before_after', 'uses_wrong_operation'],
    };
  }

  // _003: Find original amount (work backwards)
  const original = randInt(150, 600);
  const spentPart = randInt(40, Math.floor(original * 0.4));
  const receivedPart = randInt(20, 100);
  const finalAmount = original - spentPart + receivedPart;
  const answer = original;
  const context = pick(['savings', 'allowance', 'pocket money']);
  return {
    skillId: 'P5-WP-02',
    questionFamilyId: familyId,
    prompt: `${name} spent $${spentPart} on a present and then received $${receivedPart} from a relative. ${name} now has $${finalAmount}. How much did ${name} have at first?`,
    answer,
    answerType: 'number',
    instructionHint: `Work backwards: $${finalAmount} − $${receivedPart} + $${spentPart} = original amount.`,
    solutionText: `Working backwards: $${finalAmount} − $${receivedPart} = $${finalAmount - receivedPart}. $${finalAmount - receivedPart} + $${spentPart} = $${answer}. ${name} had $${answer} at first.`,
    misconceptionTraps: ['misreads_before_after', 'uses_wrong_operation', 'skips_intermediate_step'],
  };
}

// ---------------------------------------------------------------------------
// P5-WP-03: Rate & Unit Cost Problems
// ---------------------------------------------------------------------------

function generateRateUnitCost(familyId) {
  const name = pick(NAMES);

  if (familyId.endsWith('_001')) {
    // X items cost $Y, find unit cost
    const count = pick([3, 4, 5, 6, 8, 10, 12]);
    const unitCost = pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15]);
    const totalCost = count * unitCost;
    const answer = unitCost;
    const itemName = pick(['erasers', 'pens', 'buns', 'muffins', 'notebooks', 'drink bottles']);
    return {
      skillId: 'P5-WP-03',
      questionFamilyId: familyId,
      prompt: `${name} buys ${count} ${itemName} for $${totalCost}. What is the cost of one ${itemName.replace(/s$/, '')}?`,
      answer,
      answerType: 'number',
      instructionHint: `Divide the total cost by the number of items: $${totalCost} ÷ ${count}.`,
      solutionText: `$${totalCost} ÷ ${count} = $${answer}. Each ${itemName.replace(/s$/, '')} costs $${answer}.`,
      misconceptionTraps: ['confuses_unit_rate_with_total'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Travels X km in Y hours, find speed
    const hours = pick([2, 3, 4, 5, 6]);
    const speed = pick([40, 50, 60, 70, 80, 90]);
    const distance = hours * speed;
    const answer = speed;
    const vehicle = pick(['car', 'bus', 'van', 'train']);
    return {
      skillId: 'P5-WP-03',
      questionFamilyId: familyId,
      prompt: `A ${vehicle} travels ${distance} km in ${hours} hours. What is the speed of the ${vehicle} in km/h?`,
      answer,
      answerType: 'number',
      instructionHint: `Speed = Distance ÷ Time = ${distance} ÷ ${hours}.`,
      solutionText: `${distance} km ÷ ${hours} h = ${answer} km/h. The ${vehicle} travels at ${answer} km/h.`,
      misconceptionTraps: ['confuses_unit_rate_with_total', 'uses_wrong_operation'],
    };
  }

  // _003: Compare two rates (which is cheaper)
  const countA = pick([3, 4, 5, 6, 8]);
  const unitCostA = pick([2, 3, 4, 5, 6, 7, 8]);
  const totalCostA = countA * unitCostA;
  // Ensure different unit cost for B
  const countB = pick([4, 5, 6, 8, 10].filter((n) => n !== countA));
  let unitCostB = unitCostA + pick([-2, -1, 1, 2]);
  if (unitCostB < 1) unitCostB = unitCostA + 1;
  const totalCostB = countB * unitCostB;
  const cheaper = unitCostA < unitCostB ? 'A' : 'B';
  const answer = Math.min(unitCostA, unitCostB);
  const itemName = pick(['muffins', 'cupcakes', 'cookies', 'oranges', 'apples']);
  const nameB = pick(NAMES.filter((n) => n !== name));
  return {
    skillId: 'P5-WP-03',
    questionFamilyId: familyId,
    prompt: `Shop A sells ${countA} ${itemName} for $${totalCostA}. Shop B sells ${countB} ${itemName} for $${totalCostB}. Which shop offers a lower price per ${itemName.replace(/s$/, '')}? Give the lower unit cost.`,
    answer,
    answerType: 'number',
    instructionHint: `Find unit cost for each shop: Shop A = $${totalCostA} ÷ ${countA}, Shop B = $${totalCostB} ÷ ${countB}. Compare.`,
    solutionText: `Shop A: $${totalCostA} ÷ ${countA} = $${unitCostA} each. Shop B: $${totalCostB} ÷ ${countB} = $${unitCostB} each. Shop ${cheaper} is cheaper at $${answer} per ${itemName.replace(/s$/, '')}.`,
    misconceptionTraps: ['wrong_comparison_direction', 'confuses_unit_rate_with_total', 'uses_wrong_operation'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P5-WP-01': generateMultiStep,
  'P5-WP-02': generateBeforeAfter,
  'P5-WP-03': generateRateUnitCost,
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
