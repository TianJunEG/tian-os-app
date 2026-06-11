import { getSkill } from './p6DataAnalysisSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p6DataAnalysisQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ---------------------------------------------------------------------------
// Helper: generate N values that sum to a target (for clean averages)
// ---------------------------------------------------------------------------

function generateValuesWithSum(count, targetSum, minVal = 5, maxVal = 100) {
  const values = [];
  let remaining = targetSum;
  for (let i = 0; i < count - 1; i++) {
    const slotsLeft = count - i;
    const lo = Math.max(minVal, remaining - (slotsLeft - 1) * maxVal);
    const hi = Math.min(maxVal, remaining - (slotsLeft - 1) * minVal);
    const val = randInt(lo, hi);
    values.push(val);
    remaining -= val;
  }
  values.push(remaining);
  return shuffle(values);
}

// ---------------------------------------------------------------------------
// Pie chart fraction sets that sum to 1
// ---------------------------------------------------------------------------

const FRACTION_SETS = [
  // [numerator, denominator] groups that sum to 1
  { fractions: [[1, 4], [1, 3], [1, 6], [1, 4]], labels: ['1/4', '1/3', '1/6', '1/4'] },
  { fractions: [[1, 2], [1, 4], [1, 8], [1, 8]], labels: ['1/2', '1/4', '1/8', '1/8'] },
  { fractions: [[1, 3], [1, 4], [1, 6], [1, 4]], labels: ['1/3', '1/4', '1/6', '1/4'] },
  { fractions: [[3, 8], [1, 4], [1, 8], [1, 4]], labels: ['3/8', '1/4', '1/8', '1/4'] },
  { fractions: [[1, 2], [1, 6], [1, 6], [1, 6]], labels: ['1/2', '1/6', '1/6', '1/6'] },
  { fractions: [[2, 5], [1, 5], [1, 5], [1, 5]], labels: ['2/5', '1/5', '1/5', '1/5'] },
  { fractions: [[1, 3], [1, 6], [1, 4], [1, 4]], labels: ['1/3', '1/6', '1/4', '1/4'] },
  { fractions: [[3, 10], [1, 5], [3, 10], [1, 5]], labels: ['3/10', '1/5', '3/10', '1/5'] },
];

// Totals that give whole numbers when multiplied by common fractions
const FRACTION_FRIENDLY_TOTALS = [120, 240, 360, 480, 600, 180, 300];

const PIE_CONTEXTS = [
  { topic: 'how students travel to school', categories: ['walk', 'take the bus', 'take the MRT', 'go by car'] },
  { topic: 'the favourite subjects of students', categories: ['like Math', 'like Science', 'like English', 'like Mother Tongue'] },
  { topic: 'how students spend their pocket money', categories: ['spend on food', 'spend on books', 'spend on transport', 'save'] },
  { topic: 'the favourite fruits of students', categories: ['like apples', 'like oranges', 'like bananas', 'like grapes'] },
  { topic: 'the types of books borrowed from a library', categories: ['borrow fiction', 'borrow non-fiction', 'borrow comics', 'borrow magazines'] },
];

// Percentage sets that sum to 100
const PERCENTAGE_SETS = [
  [40, 25, 15, 20],
  [35, 30, 20, 15],
  [45, 20, 25, 10],
  [30, 25, 25, 20],
  [50, 20, 15, 15],
  [35, 25, 25, 15],
  [40, 30, 10, 20],
  [25, 25, 30, 20],
];

const PERCENTAGE_TOTALS = [200, 300, 400, 500, 600, 800, 1000];

// ---------------------------------------------------------------------------
// P6-DA-01: Pie Charts
// ---------------------------------------------------------------------------

function generatePieChart(familyId) {
  const ctx = pick(PIE_CONTEXTS);
  const categories = [...ctx.categories];

  if (familyId.endsWith('_001')) {
    // Find quantity from pie chart with fractions — ask for the "rest" category
    const fracSet = pick(FRACTION_SETS);
    const total = pick(FRACTION_FRIENDLY_TOTALS);

    // Show only the first 3 fractions, ask about the 4th ("the rest")
    const givenCount = 3;
    const givenFracs = fracSet.fractions.slice(0, givenCount);
    const givenLabels = fracSet.labels.slice(0, givenCount);
    const givenCats = categories.slice(0, givenCount);
    const restCat = categories[3];

    const givenSum = givenFracs.reduce((s, [n, d]) => s + n / d, 0);
    const restFraction = 1 - givenSum;
    const answer = Math.round(restFraction * total);

    // Verify answer is positive and whole
    if (answer <= 0 || !Number.isInteger(answer)) {
      // Fallback: use a safe set
      return generatePieChart(familyId);
    }

    const desc = givenCats.map((c, i) => `${givenLabels[i]} ${c}`).join(', ');
    const prompt = `A pie chart shows ${ctx.topic}. ${total} students were surveyed. ${desc}, and the rest ${restCat}. How many students ${restCat}?`;

    const sumFracDesc = givenLabels.join(' + ');
    const givenSumFrac = givenFracs.reduce((s, [n, d]) => s + n / d, 0);
    const givenSumDisplay = givenFracs.map(([n, d]) => `${n}/${d}`).join(' + ');

    return {
      skillId: 'P6-DA-01',
      questionFamilyId: familyId,
      prompt,
      answer,
      answerType: 'number',
      instructionHint: `Add the given fractions, subtract from 1 to find the rest, then multiply by the total.`,
      solutionText: `Given fractions: ${givenSumDisplay}. The rest = 1 - (${givenSumDisplay}) = ${restFraction.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')}. Number who ${restCat} = ${restFraction.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')} x ${total} = ${answer}.`,
      diagramData: { type: 'pie_chart', context: ctx.topic, total, fractions: fracSet.fractions, labels: fracSet.labels, categories },
      misconceptionTraps: ['pie_chart_fractions_dont_sum_to_1', 'wrong_total_for_pie', 'assumes_equal_sectors'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Find quantity from pie chart with percentages — ask about a specific or remainder category
    const pctSet = [...pick(PERCENTAGE_SETS)];
    const total = pick(PERCENTAGE_TOTALS);

    // Show first 3 percentages, ask for the rest
    const givenPcts = pctSet.slice(0, 3);
    const restPct = pctSet[3];
    const givenCats = categories.slice(0, 3);
    const restCat = categories[3];

    const answer = Math.round((restPct / 100) * total);

    const desc = givenCats.map((c, i) => `${givenPcts[i]}% ${c}`).join(', ');
    const prompt = `In a pie chart showing ${ctx.topic}, ${desc}, and the rest ${restCat}. If the total is ${total}, how many students ${restCat}?`;

    return {
      skillId: 'P6-DA-01',
      questionFamilyId: familyId,
      prompt,
      answer,
      answerType: 'number',
      instructionHint: `Add the given percentages, subtract from 100% to find the rest, then calculate that percentage of the total.`,
      solutionText: `Given: ${givenPcts.join('% + ')}% = ${givenPcts.reduce((a, b) => a + b, 0)}%. Rest = 100% - ${givenPcts.reduce((a, b) => a + b, 0)}% = ${restPct}%. Number who ${restCat} = ${restPct}% x ${total} = ${restPct / 100} x ${total} = ${answer}.`,
      diagramData: { type: 'pie_chart', context: ctx.topic, total, percentages: pctSet, categories },
      misconceptionTraps: ['confuses_fraction_percentage_in_pie', 'wrong_total_for_pie', 'assumes_equal_sectors'],
    };
  }

  // _003: Find the percentage of a category given quantities
  const numCats = 4;
  const catValues = [];
  const total = pick([200, 250, 300, 400, 500, 600]);
  let remaining = total;
  for (let i = 0; i < numCats - 1; i++) {
    const slotsLeft = numCats - i;
    const minV = Math.max(10, Math.floor(total * 0.05));
    const maxV = Math.min(remaining - (slotsLeft - 1) * minV, Math.floor(total * 0.45));
    const val = randInt(minV, Math.max(minV, maxV));
    catValues.push(val);
    remaining -= val;
  }
  catValues.push(remaining);

  // Pick a category to ask about, ensuring its percentage is a whole number
  const askIdx = randInt(0, numCats - 1);
  const askVal = catValues[askIdx];
  const pct = (askVal / total) * 100;
  const answer = Math.round(pct);

  // If percentage is not a clean whole number, regenerate
  if (Math.abs(pct - answer) > 0.01) {
    return generatePieChart(familyId);
  }

  const desc = categories.map((c, i) => `${catValues[i]} ${c}`).join(', ');
  const askCat = categories[askIdx];
  const prompt = `A pie chart shows ${ctx.topic}. The data is: ${desc}. What percentage of students ${askCat}?`;

  return {
    skillId: 'P6-DA-01',
    questionFamilyId: familyId,
    prompt,
    answer,
    answerType: 'number',
    instructionHint: `Divide the number in the category by the total, then multiply by 100.`,
    solutionText: `Total = ${total}. Students who ${askCat} = ${askVal}. Percentage = (${askVal} / ${total}) x 100 = ${answer}%.`,
    diagramData: { type: 'pie_chart', context: ctx.topic, total, values: catValues, categories },
    misconceptionTraps: ['pie_chart_fractions_dont_sum_to_1', 'confuses_fraction_percentage_in_pie', 'reads_wrong_category'],
  };
}

// ---------------------------------------------------------------------------
// P6-DA-02: Average & Data Interpretation
// ---------------------------------------------------------------------------

const SUBJECT_SETS = [
  ['Math', 'Science', 'English', 'Mother Tongue'],
  ['Math', 'Science', 'English', 'Art'],
  ['Math', 'Science', 'English', 'Music'],
];

const STUDENT_NAMES = ['Wei Lin', 'Aisha', 'Ravi', 'Mei Ting', 'Zhi Hao', 'Priya', 'Jun Wei', 'Siti', 'Raj', 'Xin Yi'];

const TABLE_THEMES = [
  { label: 'Number of books read', items: ['January', 'February', 'March', 'April', 'May'], unit: 'books' },
  { label: 'Points scored', items: ['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Round 5'], unit: 'points' },
  { label: 'Temperature (°C)', items: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], unit: '°C' },
  { label: 'Number of visitors', items: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], unit: 'visitors' },
];

function generateAverage(familyId) {

  if (familyId.endsWith('_001')) {
    // Calculate average from data set (school subjects context)
    const subjects = pick(SUBJECT_SETS);
    const count = subjects.length;
    const avg = randInt(65, 95);
    const targetSum = avg * count;
    const values = generateValuesWithSum(count, targetSum, 50, 100);
    const name = pick(STUDENT_NAMES);

    const desc = subjects.map((s, i) => `${s}: ${values[i]}`).join(', ');
    const prompt = `${name}'s test scores are: ${desc}. What is ${name}'s average score?`;

    return {
      skillId: 'P6-DA-02',
      questionFamilyId: familyId,
      prompt,
      answer: avg,
      answerType: 'number',
      instructionHint: `Add all the scores, then divide by the number of subjects.`,
      solutionText: `Sum = ${values.join(' + ')} = ${targetSum}. Average = ${targetSum} / ${count} = ${avg}.`,
      diagramData: { type: 'table', subjects, values, name },
      misconceptionTraps: ['average_divides_by_wrong_count', 'reads_wrong_category'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Find missing value given average
    const count = pick([4, 5, 6]);
    const avg = randInt(10, 50);
    const targetSum = avg * count;
    const allValues = generateValuesWithSum(count, targetSum, 3, 90);

    // Hide one value
    const hideIdx = randInt(0, count - 1);
    const missingVal = allValues[hideIdx];
    const knownValues = allValues.filter((_, i) => i !== hideIdx);
    const knownSum = knownValues.reduce((s, v) => s + v, 0);

    const name = pick(STUDENT_NAMES);
    const labels = [];
    for (let i = 0; i < count; i++) labels.push(`Test ${i + 1}`);

    const displayValues = allValues.map((v, i) => i === hideIdx ? '?' : v);
    const desc = labels.map((l, i) => `${l}: ${displayValues[i]}`).join(', ');
    const prompt = `The average of ${name}'s ${count} test scores is ${avg}. The scores are: ${desc}. Find the missing score.`;

    return {
      skillId: 'P6-DA-02',
      questionFamilyId: familyId,
      prompt,
      answer: missingVal,
      answerType: 'number',
      instructionHint: `Total = average x count. Missing value = total - sum of known values.`,
      solutionText: `Total = ${avg} x ${count} = ${targetSum}. Sum of known scores = ${knownValues.join(' + ')} = ${knownSum}. Missing score = ${targetSum} - ${knownSum} = ${missingVal}.`,
      diagramData: { type: 'table', labels, values: allValues, hiddenIndex: hideIdx, name },
      misconceptionTraps: ['forgets_to_multiply_average_by_count', 'average_divides_by_wrong_count'],
    };
  }

  // _003: Interpret table to answer questions (total / comparison)
  const theme = pick(TABLE_THEMES);
  const count = theme.items.length;
  const values = [];
  for (let i = 0; i < count; i++) values.push(randInt(8, 60));
  // Ensure at least two different values
  if (new Set(values).size === 1) values[0] += 3;

  // Pick question type: total or difference
  const askTotal = Math.random() < 0.5;

  if (askTotal) {
    const total = values.reduce((s, v) => s + v, 0);
    const desc = theme.items.map((item, i) => `${item}: ${values[i]}`).join(', ');
    const prompt = `The table shows the ${theme.label.toLowerCase()} each ${theme.items[0].includes('Week') ? 'week' : theme.items[0].includes('Round') ? 'round' : 'month'}. ${desc}. What is the total ${theme.unit}?`;

    return {
      skillId: 'P6-DA-02',
      questionFamilyId: familyId,
      prompt,
      answer: total,
      answerType: 'number',
      instructionHint: `Add all the values in the table.`,
      solutionText: `Total = ${values.join(' + ')} = ${total}.`,
      diagramData: { type: 'table', theme: theme.label, items: theme.items, values },
      misconceptionTraps: ['reads_wrong_category', 'average_divides_by_wrong_count'],
    };
  }

  // Difference between highest and lowest
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const diff = maxVal - minVal;
  const maxItem = theme.items[values.indexOf(maxVal)];
  const minItem = theme.items[values.indexOf(minVal)];

  const desc = theme.items.map((item, i) => `${item}: ${values[i]}`).join(', ');
  const prompt = `The table shows the ${theme.label.toLowerCase()}. ${desc}. What is the difference between the highest and lowest ${theme.unit}?`;

  return {
    skillId: 'P6-DA-02',
    questionFamilyId: familyId,
    prompt,
    answer: diff,
    answerType: 'number',
    instructionHint: `Find the highest and lowest values, then subtract.`,
    solutionText: `Highest: ${maxItem} = ${maxVal}. Lowest: ${minItem} = ${minVal}. Difference = ${maxVal} - ${minVal} = ${diff}.`,
    diagramData: { type: 'table', theme: theme.label, items: theme.items, values },
    misconceptionTraps: ['reads_wrong_category', 'average_divides_by_wrong_count'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P6-DA-01': generatePieChart,
  'P6-DA-02': generateAverage,
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
  };
}

export function generateQuestionSet(skillId, count = 5, options = {}) {
  const questions = [];
  for (let i = 0; i < count; i++) { const q = generateQuestion(skillId, options); if (q) questions.push(q); }
  return questions;
}

export function generateDiagnosticSet(skillIds, questionsPerSkill = 3) {
  const questions = [];
  for (const skillId of skillIds) questions.push(...generateQuestionSet(skillId, questionsPerSkill));
  return questions;
}

export function getSupportedSkillIds() { return Object.keys(generatorsBySkill); }

export default { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds };
