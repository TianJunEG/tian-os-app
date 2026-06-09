import { getSkill } from './p1MoneySkillGraph.js';
import { getQuestionFamiliesBySkill } from './p1MoneyQuestionFamilies.js';
import {
  pictureCollectionDiagram,
  comparisonModelDiagram,
  barModelDiagram,
} from './p1DiagramHelpers.js';

const COINS = [
  { label: '1¢ coin', value: 1, unit: 'cents' },
  { label: '5¢ coin', value: 5, unit: 'cents' },
  { label: '10¢ coin', value: 10, unit: 'cents' },
  { label: '20¢ coin', value: 20, unit: 'cents' },
  { label: '50¢ coin', value: 50, unit: 'cents' },
];

const NOTES = [
  { label: '$1 note', value: 100, unit: 'dollars', display: '$1' },
  { label: '$2 note', value: 200, unit: 'dollars', display: '$2' },
  { label: '$5 note', value: 500, unit: 'dollars', display: '$5' },
  { label: '$10 note', value: 1000, unit: 'dollars', display: '$10' },
];

const ITEMS = ['pencil', 'eraser', 'ruler', 'notebook', 'sticker'];
const NAMES_MALE = ['Tom', 'Ravi', 'Ali', 'Eric', 'Kumar', 'Peter', 'Amin', 'Bala'];
const NAMES_FEMALE = ['Siti', 'Lynn', 'Jane', 'Alice', 'Susan', 'Mei', 'Priya', 'Mrs Lee'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatCents(cents) {
  if (cents >= 100 && cents % 100 === 0) {
    return `$${cents / 100}`;
  }
  if (cents >= 100) {
    return `$${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
  }
  return `${cents}¢`;
}

function coinDiagram(coins, title) {
  const categories = coins.map((c) => ({ label: c.label, count: c.count }));
  return pictureCollectionDiagram(categories, { symbol: '●', title });
}

// --- P1-MON-01: Recognise Singapore coins and notes ---
function generateRecogniseMoney(familyId) {
  const isCoin = familyId.endsWith('_001');

  if (isCoin) {
    const coin = pick(COINS);
    const distractors = shuffle(COINS.filter((c) => c.label !== coin.label)).slice(0, 3).map((c) => c.label);
    const options = shuffle([coin.label, ...distractors]);
    return {
      skillId: 'P1-MON-01',
      questionFamilyId: familyId,
      prompt: `What coin is this? It is worth ${coin.value}¢.`,
      answer: coin.label,
      answerType: 'choice',
      options,
      instructionHint: 'Choose the correct coin.',
      solutionText: `This is a ${coin.label}. It is worth ${coin.value}¢.`,
      diagramSpec: pictureCollectionDiagram([{ label: coin.label, count: 1 }], { symbol: '●', title: coin.label }),
      misconceptionTraps: ['coin_size_value_confusion'],
    };
  }

  const note = pick(NOTES);
  const distractors = shuffle(NOTES.filter((n) => n.label !== note.label)).slice(0, 3).map((n) => n.label);
  const options = shuffle([note.label, ...distractors]);
  return {
    skillId: 'P1-MON-01',
    questionFamilyId: familyId,
    prompt: `What note is this? It is worth ${note.display}.`,
    answer: note.label,
    answerType: 'choice',
    options,
    instructionHint: 'Choose the correct note.',
    solutionText: `This is a ${note.label}. It is worth ${note.display}.`,
    diagramSpec: pictureCollectionDiagram([{ label: note.label, count: 1 }], { symbol: '●', title: note.label }),
    misconceptionTraps: ['coin_size_value_confusion'],
  };
}

// --- P1-MON-02: Match coins/notes to values ---
function generateMatchValue(familyId) {
  const isCoin = familyId.endsWith('_001');

  if (isCoin) {
    const coin = pick(COINS);
    const correctAnswer = `${coin.value}¢`;
    const distractorValues = shuffle(COINS.filter((c) => c.value !== coin.value)).slice(0, 3).map((c) => `${c.value}¢`);
    const options = shuffle([correctAnswer, ...distractorValues]);
    return {
      skillId: 'P1-MON-02',
      questionFamilyId: familyId,
      prompt: `How much is a ${coin.label} worth?`,
      answer: correctAnswer,
      answerType: 'choice',
      options,
      instructionHint: 'Choose the correct value.',
      solutionText: `A ${coin.label} is worth ${coin.value}¢.`,
      diagramSpec: pictureCollectionDiagram([{ label: coin.label, count: 1 }], { symbol: '●', title: coin.label }),
      misconceptionTraps: ['dollar_cent_confusion'],
    };
  }

  const note = pick(NOTES);
  const correctAnswer = note.display;
  const distractorValues = shuffle(NOTES.filter((n) => n.display !== note.display)).slice(0, 3).map((n) => n.display);
  const options = shuffle([correctAnswer, ...distractorValues]);
  return {
    skillId: 'P1-MON-02',
    questionFamilyId: familyId,
    prompt: `How much is a ${note.label} worth?`,
    answer: correctAnswer,
    answerType: 'choice',
    options,
    instructionHint: 'Choose the correct value.',
    solutionText: `A ${note.label} is worth ${note.display}.`,
    diagramSpec: pictureCollectionDiagram([{ label: note.label, count: 1 }], { symbol: '●', title: note.label }),
    misconceptionTraps: ['dollar_cent_confusion'],
  };
}

// --- P1-MON-03: Count simple money amounts ---
function generateCountMoney(familyId) {
  const isCoinsOnly = familyId.endsWith('_001');

  if (isCoinsOnly) {
    const coinPool = shuffle(COINS).slice(0, randInt(2, 3));
    const selectedCoins = coinPool.map((c) => ({ ...c, count: randInt(1, 3) }));
    const total = selectedCoins.reduce((sum, c) => sum + c.value * c.count, 0);
    const coinDescription = selectedCoins.map((c) => `${c.count} ${c.label}${c.count > 1 ? 's' : ''}`).join(', ');

    return {
      skillId: 'P1-MON-03',
      questionFamilyId: familyId,
      prompt: `Count the money: ${coinDescription}. How much is there altogether?`,
      answer: total,
      answerType: 'number',
      instructionHint: 'Write your answer in cents.',
      solutionText: `${selectedCoins.map((c) => `${c.count} x ${c.value}¢ = ${c.count * c.value}¢`).join(', ')}. Total = ${total}¢.`,
      diagramSpec: coinDiagram(selectedCoins, `${coinDescription}`),
      misconceptionTraps: ['counts_coins_not_value'],
    };
  }

  const note = pick(NOTES.slice(0, 2));
  const coin = pick(COINS.slice(1));
  const coinCount = randInt(1, 3);
  const totalCents = note.value + coin.value * coinCount;
  const description = `1 ${note.label} and ${coinCount} ${coin.label}${coinCount > 1 ? 's' : ''}`;

  return {
    skillId: 'P1-MON-03',
    questionFamilyId: familyId,
    prompt: `Count the money: ${description}. How much is there altogether?`,
    answer: totalCents,
    answerType: 'number',
    instructionHint: 'Write your answer in cents.',
    solutionText: `${note.display} = ${note.value}¢. ${coinCount} x ${coin.value}¢ = ${coin.value * coinCount}¢. Total = ${totalCents}¢ (${formatCents(totalCents)}).`,
    diagramSpec: coinDiagram([{ label: note.label, count: 1 }, { label: coin.label, count: coinCount }], description),
    misconceptionTraps: ['counts_coins_not_value'],
  };
}

// --- P1-MON-04: Compare money amounts ---
function generateCompareMoney(familyId) {
  const isTwoCoinSets = familyId.endsWith('_001');

  if (isTwoCoinSets) {
    const coinsA = [pick(COINS.slice(2))];
    coinsA[0] = { ...coinsA[0], count: randInt(2, 4) };
    const totalA = coinsA[0].value * coinsA[0].count;

    const coinsB = [pick(COINS.slice(0, 3))];
    coinsB[0] = { ...coinsB[0], count: randInt(3, 6) };
    let totalB = coinsB[0].value * coinsB[0].count;
    while (totalB === totalA) {
      coinsB[0].count = randInt(3, 6);
      totalB = coinsB[0].value * coinsB[0].count;
    }

    const setADesc = `${coinsA[0].count} ${coinsA[0].label}${coinsA[0].count > 1 ? 's' : ''}`;
    const setBDesc = `${coinsB[0].count} ${coinsB[0].label}${coinsB[0].count > 1 ? 's' : ''}`;
    const correctAnswer = totalA > totalB ? 'Set A' : 'Set B';
    const options = ['Set A', 'Set B'];

    return {
      skillId: 'P1-MON-04',
      questionFamilyId: familyId,
      prompt: `Set A: ${setADesc} (${totalA}¢). Set B: ${setBDesc} (${totalB}¢). Which set has more money?`,
      answer: correctAnswer,
      answerType: 'choice',
      options,
      instructionHint: 'Choose Set A or Set B.',
      solutionText: `Set A = ${totalA}¢. Set B = ${totalB}¢. ${correctAnswer} has more money.`,
      diagramSpec: comparisonModelDiagram(totalA, totalB, { leftLabel: `Set A: ${totalA}¢`, rightLabel: `Set B: ${totalB}¢`, mode: 'difference', title: 'Compare money' }),
      misconceptionTraps: ['more_coins_means_more_money'],
    };
  }

  const note = pick(NOTES.slice(0, 2));
  const noteCents = note.value;
  const coin = pick(COINS.slice(1));
  const coinCount = randInt(3, 6);
  const coinTotal = coin.value * coinCount;
  while (coinTotal === noteCents) {
    return generateCompareMoney(familyId);
  }

  const coinsDesc = `${coinCount} ${coin.label}${coinCount > 1 ? 's' : ''}`;
  const correctAnswer = noteCents > coinTotal ? 'The note' : 'The coins';
  const options = ['The note', 'The coins'];

  return {
    skillId: 'P1-MON-04',
    questionFamilyId: familyId,
    prompt: `Which is worth more: 1 ${note.label} or ${coinsDesc}?`,
    answer: correctAnswer,
    answerType: 'choice',
    options,
    instructionHint: 'Choose "The note" or "The coins".',
    solutionText: `1 ${note.label} = ${formatCents(noteCents)}. ${coinsDesc} = ${coinTotal}¢. ${correctAnswer} ${correctAnswer === 'The note' ? 'is' : 'are'} worth more.`,
    diagramSpec: comparisonModelDiagram(noteCents, coinTotal, { leftLabel: `${note.label}: ${formatCents(noteCents)}`, rightLabel: `Coins: ${coinTotal}¢`, mode: 'difference', title: 'Note vs coins' }),
    misconceptionTraps: ['more_coins_means_more_money'],
  };
}

// --- P1-MON-05: Add simple amounts ---
function generateAddMoney(familyId) {
  const isCentsOnly = familyId.endsWith('_001');
  const item1 = pick(ITEMS);
  let item2 = pick(ITEMS);
  while (item2 === item1) item2 = pick(ITEMS);

  if (isCentsOnly) {
    const price1 = randInt(1, 9) * 5;
    const price2 = randInt(1, 9) * 5;
    const total = price1 + price2;
    return {
      skillId: 'P1-MON-05',
      questionFamilyId: familyId,
      prompt: `A ${item1} costs ${price1}¢. A ${item2} costs ${price2}¢. How much do they cost altogether?`,
      answer: total,
      answerType: 'number',
      instructionHint: 'Write your answer in cents.',
      solutionText: `${price1}¢ + ${price2}¢ = ${total}¢.`,
      diagramSpec: barModelDiagram(total, price1, { part1Label: `${item1}: ${price1}¢`, part2Label: `${item2}: ${price2}¢`, wholeLabel: '?', title: 'Total cost' }),
      workingTemplate: { format: 'equation', boxes: 3, operatorCircle: true },
      misconceptionTraps: ['money_add_ignores_units'],
    };
  }

  const dollars1 = randInt(1, 4);
  const cents1 = randInt(0, 1) * (randInt(1, 9) * 10);
  const dollars2 = randInt(1, 4);
  const cents2 = randInt(0, 1) * (randInt(1, 9) * 10);
  const total1Cents = dollars1 * 100 + cents1;
  const total2Cents = dollars2 * 100 + cents2;
  const totalCents = total1Cents + total2Cents;
  const price1Str = cents1 > 0 ? `$${dollars1}.${String(cents1).padStart(2, '0')}` : `$${dollars1}`;
  const price2Str = cents2 > 0 ? `$${dollars2}.${String(cents2).padStart(2, '0')}` : `$${dollars2}`;

  return {
    skillId: 'P1-MON-05',
    questionFamilyId: familyId,
    prompt: `A ${item1} costs ${price1Str}. A ${item2} costs ${price2Str}. How much do they cost altogether?`,
    answer: totalCents,
    answerType: 'number',
    instructionHint: 'Write your answer in cents.',
    solutionText: `${price1Str} + ${price2Str} = ${formatCents(totalCents)}. Total = ${totalCents}¢.`,
    diagramSpec: barModelDiagram(totalCents, total1Cents, { part1Label: `${item1}: ${price1Str}`, part2Label: `${item2}: ${price2Str}`, wholeLabel: '?', title: 'Total cost' }),
    workingTemplate: { format: 'equation', boxes: 3, operatorCircle: true },
    misconceptionTraps: ['money_add_ignores_units'],
  };
}

// --- P1-MON-06: Find simple change ---
function generateChange(familyId) {
  const item = pick(ITEMS);
  const name = pick([...NAMES_MALE, ...NAMES_FEMALE]);
  const isFromOne = familyId.endsWith('_001');

  if (isFromOne) {
    const costCents = randInt(1, 19) * 5;
    const paid = 100;
    const change = paid - costCents;
    return {
      skillId: 'P1-MON-06',
      questionFamilyId: familyId,
      prompt: `${name} buys a ${item} that costs ${costCents}¢. ${name} pays with $1. How much change does ${name} get?`,
      answer: change,
      answerType: 'number',
      instructionHint: 'Write your answer in cents.',
      solutionText: `$1 = 100¢. Change = 100¢ − ${costCents}¢ = ${change}¢.`,
      diagramSpec: barModelDiagram(paid, costCents, { part1Label: `Cost: ${costCents}¢`, part2Label: `Change: ?`, wholeLabel: '$1 = 100¢', title: 'Finding change' }),
      workingTemplate: { format: 'equation', boxes: 3, operatorCircle: true },
      misconceptionTraps: ['change_adds_cost_and_paid'],
    };
  }

  const paidOptions = [500, 1000];
  const paid = pick(paidOptions);
  const costDollars = paid === 500 ? randInt(1, 4) : randInt(1, 9);
  const costCents = costDollars * 100;
  const change = paid - costCents;
  const paidStr = formatCents(paid);
  const costStr = `$${costDollars}`;

  return {
    skillId: 'P1-MON-06',
    questionFamilyId: familyId,
    prompt: `${name} buys a ${item} that costs ${costStr}. ${name} pays with a ${paidStr} note. How much change does ${name} get?`,
    answer: change,
    answerType: 'number',
    instructionHint: 'Write your answer in cents.',
    solutionText: `Change = ${paidStr} − ${costStr} = ${formatCents(change)}. That is ${change}¢.`,
    diagramSpec: barModelDiagram(paid, costCents, { part1Label: `Cost: ${costStr}`, part2Label: `Change: ?`, wholeLabel: `Paid: ${paidStr}`, title: 'Finding change' }),
    workingTemplate: { format: 'equation', boxes: 3, operatorCircle: true },
    misconceptionTraps: ['change_adds_cost_and_paid'],
  };
}

// --- P1-MON-07: Choose enough money ---
function generateEnoughMoney(familyId) {
  const isOneItem = familyId.endsWith('_001');

  if (isOneItem) {
    const item = pick(ITEMS);
    const priceCents = randInt(2, 18) * 5;
    const isEnough = pick([true, false]);
    const moneyCents = isEnough
      ? priceCents + randInt(0, 5) * 5
      : priceCents - randInt(1, Math.max(1, Math.floor(priceCents / 10))) * 5;
    const safeMoneyC = Math.max(5, moneyCents);
    const answer = safeMoneyC >= priceCents ? 'Yes' : 'No';
    const options = ['Yes', 'No'];

    return {
      skillId: 'P1-MON-07',
      questionFamilyId: familyId,
      prompt: `A ${item} costs ${priceCents}¢. You have ${safeMoneyC}¢. Do you have enough money to buy the ${item}?`,
      answer,
      answerType: 'choice',
      options,
      instructionHint: 'Choose Yes or No.',
      solutionText: `${safeMoneyC}¢ ${answer === 'Yes' ? '>=' : '<'} ${priceCents}¢. ${answer}, you ${answer === 'Yes' ? 'have' : 'do not have'} enough.`,
      misconceptionTraps: ['enough_money_focuses_on_object'],
    };
  }

  const item1 = pick(ITEMS);
  let item2 = pick(ITEMS);
  while (item2 === item1) item2 = pick(ITEMS);
  const price1 = randInt(1, 8) * 10;
  const price2 = randInt(1, 8) * 10;
  const totalCost = price1 + price2;
  const isEnough = pick([true, false]);
  const moneyCents = isEnough
    ? totalCost + randInt(0, 3) * 10
    : totalCost - randInt(1, Math.max(1, Math.floor(totalCost / 20))) * 10;
  const safeMoneyC = Math.max(10, moneyCents);
  const answer = safeMoneyC >= totalCost ? 'Yes' : 'No';
  const options = ['Yes', 'No'];

  return {
    skillId: 'P1-MON-07',
    questionFamilyId: familyId,
    prompt: `A ${item1} costs ${price1}¢ and a ${item2} costs ${price2}¢. You have ${safeMoneyC}¢. Do you have enough money to buy both?`,
    answer,
    answerType: 'choice',
    options,
    instructionHint: 'Choose Yes or No.',
    solutionText: `${price1}¢ + ${price2}¢ = ${totalCost}¢. You have ${safeMoneyC}¢. ${safeMoneyC}¢ ${answer === 'Yes' ? '>=' : '<'} ${totalCost}¢. ${answer}, you ${answer === 'Yes' ? 'have' : 'do not have'} enough.`,
    workingTemplate: { format: 'equation', boxes: 3, operatorCircle: true },
    misconceptionTraps: ['enough_money_focuses_on_object'],
  };
}

const generatorsBySkill = {
  'P1-MON-01': generateRecogniseMoney,
  'P1-MON-02': generateMatchValue,
  'P1-MON-03': generateCountMoney,
  'P1-MON-04': generateCompareMoney,
  'P1-MON-05': generateAddMoney,
  'P1-MON-06': generateChange,
  'P1-MON-07': generateEnoughMoney,
};

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
    visualRequirement: family.visualRequirement || skill.visualRequirement,
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
