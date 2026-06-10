import { getSkill } from './p4StatSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p4StatQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ---------------------------------------------------------------------------
// P4-STAT-01: Reading a Line Graph
// ---------------------------------------------------------------------------

const LINE_GRAPH_TOPICS = [
  { title: 'number of visitors to a park', unit: 'visitors', labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
  { title: 'number of books sold at a shop', unit: 'books', labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'] },
  { title: 'temperature in a city', unit: '°C', labels: ['6 am', '9 am', '12 pm', '3 pm', '6 pm'] },
  { title: 'number of ice creams sold', unit: 'ice creams', labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
  { title: 'rainfall in mm', unit: 'mm', labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'] },
  { title: 'savings in dollars', unit: '$', labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'] },
];

function generateLineGraphData(scale) {
  const count = 5;
  const values = [];
  for (let i = 0; i < count; i++) {
    values.push(randInt(2, 12) * scale);
  }
  return values;
}

function describeLineGraph(topic, values) {
  const pairs = topic.labels.map((label, i) => `${label}: ${values[i]}`);
  return `The line graph shows the ${topic.title} over ${topic.labels.length} periods.\n${pairs.join(', ')}.`;
}

function generateLineGraph(familyId) {
  const topic = pick(LINE_GRAPH_TOPICS);
  const scale = pick([5, 10, 20]);
  const values = generateLineGraphData(scale);
  const description = describeLineGraph(topic, values);

  if (familyId.endsWith('_001')) {
    // Read value at a point
    const idx = randInt(0, values.length - 1);
    const answer = values[idx];
    return {
      skillId: 'P4-STAT-01',
      questionFamilyId: familyId,
      prompt: `${description}\n\nHow many ${topic.unit} were there on ${topic.labels[idx]}?`,
      answer,
      answerType: 'number',
      instructionHint: `Find ${topic.labels[idx]} on the horizontal axis and read across to the vertical axis.`,
      solutionText: `On ${topic.labels[idx]}, the value is ${answer} ${topic.unit}.`,
      misconceptionTraps: ['reads_wrong_axis', 'misreads_scale'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Find increase or decrease between two points
    const idx1 = randInt(0, values.length - 2);
    const idx2 = randInt(idx1 + 1, values.length - 1);
    const change = values[idx2] - values[idx1];
    const direction = change >= 0 ? 'increase' : 'decrease';
    const answer = Math.abs(change);
    return {
      skillId: 'P4-STAT-01',
      questionFamilyId: familyId,
      prompt: `${description}\n\nWhat was the ${direction} in ${topic.unit} from ${topic.labels[idx1]} to ${topic.labels[idx2]}?`,
      answer,
      answerType: 'number',
      instructionHint: `Read the values at ${topic.labels[idx1]} and ${topic.labels[idx2]}, then find the difference.`,
      solutionText: `${topic.labels[idx1]}: ${values[idx1]}. ${topic.labels[idx2]}: ${values[idx2]}. ${direction === 'increase' ? 'Increase' : 'Decrease'} = ${answer} ${topic.unit}.`,
      misconceptionTraps: ['reads_wrong_axis', 'interpolation_error'],
    };
  }

  // _003: Find the period with the greatest change
  const changes = [];
  for (let i = 0; i < values.length - 1; i++) {
    changes.push({ from: i, to: i + 1, change: Math.abs(values[i + 1] - values[i]) });
  }
  changes.sort((a, b) => b.change - a.change);
  const greatest = changes[0];
  const answer = greatest.change;

  return {
    skillId: 'P4-STAT-01',
    questionFamilyId: familyId,
    prompt: `${description}\n\nWhat was the greatest change in ${topic.unit} between any two consecutive periods?`,
    answer,
    answerType: 'number',
    instructionHint: 'Find the difference between each pair of consecutive values and pick the largest.',
    solutionText: `Changes: ${changes.map((c) => `${topic.labels[c.from]}→${topic.labels[c.to]}: ${c.change}`).join(', ')}. The greatest change is ${answer} ${topic.unit} (from ${topic.labels[greatest.from]} to ${topic.labels[greatest.to]}).`,
    misconceptionTraps: ['interpolation_error', 'misreads_scale'],
  };
}

// ---------------------------------------------------------------------------
// P4-STAT-02: Reading a Pie Chart
// ---------------------------------------------------------------------------

const PIE_CHART_TOPICS = [
  { title: 'favourite fruits of students', categories: ['Apple', 'Banana', 'Orange', 'Grape'], unit: 'students' },
  { title: 'favourite sports of students', categories: ['Football', 'Basketball', 'Swimming', 'Badminton'], unit: 'students' },
  { title: 'types of books borrowed', categories: ['Fiction', 'Non-fiction', 'Comics', 'Reference'], unit: 'books' },
  { title: 'favourite colours of children', categories: ['Red', 'Blue', 'Green', 'Yellow'], unit: 'children' },
  { title: 'snacks sold at a canteen', categories: ['Chips', 'Sandwich', 'Muffin', 'Fruit'], unit: 'snacks' },
];

function generatePiePercentages() {
  // Generate 4 percentages that sum to 100, each a multiple of 5
  const options = [
    [25, 30, 20, 25],
    [35, 25, 15, 25],
    [30, 20, 30, 20],
    [40, 25, 20, 15],
    [20, 35, 25, 20],
    [30, 30, 25, 15],
    [45, 20, 15, 20],
    [25, 25, 25, 25],
    [35, 30, 20, 15],
    [40, 20, 25, 15],
  ];
  return pick(options);
}

function describePieChart(topic, percentages, total) {
  const pairs = topic.categories.map((cat, i) => `${cat}: ${percentages[i]}%`);
  return `A pie chart shows the ${topic.title}. ${pairs.join(', ')}. There are ${total} ${topic.unit} in total.`;
}

function generatePieChart(familyId) {
  const topic = pick(PIE_CHART_TOPICS);
  const percentages = generatePiePercentages();
  const total = pick([100, 200, 300, 400, 500, 600, 800]);
  const description = describePieChart(topic, percentages, total);

  if (familyId.endsWith('_001')) {
    // Read sector value
    const idx = randInt(0, percentages.length - 1);
    const answer = (percentages[idx] * total) / 100;
    return {
      skillId: 'P4-STAT-02',
      questionFamilyId: familyId,
      prompt: `${description}\n\nHow many ${topic.unit} chose ${topic.categories[idx]}?`,
      answer,
      answerType: 'number',
      instructionHint: `Find ${percentages[idx]}% of ${total}. Multiply ${total} by ${percentages[idx]} and divide by 100.`,
      solutionText: `${percentages[idx]}% of ${total} = ${total} × ${percentages[idx]} ÷ 100 = ${answer} ${topic.unit}.`,
      misconceptionTraps: ['confuses_sector_label'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Find missing sector — give 3 percentages, ask for the 4th
    const hiddenIdx = randInt(0, percentages.length - 1);
    const knownSum = percentages.reduce((s, p, i) => i === hiddenIdx ? s : s + p, 0);
    const answer = 100 - knownSum;
    const knownParts = topic.categories
      .map((cat, i) => i === hiddenIdx ? null : `${cat}: ${percentages[i]}%`)
      .filter(Boolean);
    return {
      skillId: 'P4-STAT-02',
      questionFamilyId: familyId,
      prompt: `A pie chart shows the ${topic.title}. ${knownParts.join(', ')}. What percentage is ${topic.categories[hiddenIdx]}?`,
      answer,
      answerType: 'number',
      instructionHint: `All percentages in a pie chart add up to 100%. Add the known ones and subtract from 100.`,
      solutionText: `Known: ${knownParts.join(' + ')} = ${knownSum}%. ${topic.categories[hiddenIdx]} = 100% − ${knownSum}% = ${answer}%.`,
      misconceptionTraps: ['confuses_sector_label', 'misreads_scale'],
    };
  }

  // _003: Compare two sectors — find the difference in actual values
  const idx1 = 0;
  const idx2 = 1;
  const val1 = (percentages[idx1] * total) / 100;
  const val2 = (percentages[idx2] * total) / 100;
  const answer = Math.abs(val1 - val2);
  const more = val1 > val2 ? topic.categories[idx1] : topic.categories[idx2];

  return {
    skillId: 'P4-STAT-02',
    questionFamilyId: familyId,
    prompt: `${description}\n\nHow many more ${topic.unit} chose ${more} than ${more === topic.categories[idx1] ? topic.categories[idx2] : topic.categories[idx1]}?`,
    answer,
    answerType: 'number',
    instructionHint: `Find the actual number for each sector, then subtract the smaller from the larger.`,
    solutionText: `${topic.categories[idx1]}: ${percentages[idx1]}% of ${total} = ${val1}. ${topic.categories[idx2]}: ${percentages[idx2]}% of ${total} = ${val2}. Difference = ${answer} ${topic.unit}.`,
    misconceptionTraps: ['confuses_sector_label', 'reads_wrong_axis'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P4-STAT-01': generateLineGraph,
  'P4-STAT-02': generatePieChart,
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
