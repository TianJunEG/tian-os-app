import { getSkill } from './p4StatSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p4StatQuestionFamilies.js';

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
// Line Graph themes
// ---------------------------------------------------------------------------

const LINE_GRAPH_THEMES = [
  { title: 'Number of Books Sold', labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], unit: 'books' },
  { title: 'Temperature During the Week', labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], unit: 'degrees Celsius' },
  { title: 'Number of Visitors to a Library', labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], unit: 'visitors' },
  { title: 'Rainfall Over Five Months', labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'], unit: 'mm' },
  { title: 'Number of Ice Creams Sold', labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], unit: 'ice creams' },
];

function makeLineData() {
  const theme = pick(LINE_GRAPH_THEMES);
  const values = theme.labels.map(() => randInt(10, 90));
  // Ensure at least two different values
  if (new Set(values).size === 1) values[0] += 5;
  return { title: theme.title, labels: theme.labels, values, unit: theme.unit };
}

function lineDescription(data) {
  const pairs = data.labels.map((l, i) => `${l} — ${data.values[i]}`);
  return `The line graph shows the ${data.title.toLowerCase()} each day: ${pairs.join(', ')}.`;
}

// ---------------------------------------------------------------------------
// Pie Chart themes
// ---------------------------------------------------------------------------

const PIE_CHART_THEMES = [
  { title: 'Favourite Sports', categories: ['Swimming', 'Running', 'Cycling', 'Badminton', 'Football'] },
  { title: 'Favourite Drinks', categories: ['Water', 'Juice', 'Milk', 'Tea', 'Soda'] },
  { title: 'Ways to Travel to School', categories: ['Walk', 'Bus', 'Car', 'MRT', 'Bicycle'] },
  { title: 'Favourite Subjects', categories: ['Maths', 'Science', 'English', 'Art', 'PE'] },
  { title: 'Favourite Snacks', categories: ['Chips', 'Cookies', 'Fruit', 'Crackers', 'Nuts'] },
];

const ROUND_TOTALS = [40, 50, 60, 80, 100, 120];

function makePieData() {
  const theme = pick(PIE_CHART_THEMES);
  const numSectors = pick([3, 4]);
  const categories = shuffle(theme.categories).slice(0, numSectors);
  const total = pick(ROUND_TOTALS);

  // Generate sector values that sum to total
  const values = [];
  let remaining = total;
  for (let i = 0; i < numSectors - 1; i++) {
    const minVal = Math.max(2, Math.floor(total * 0.08));
    const maxVal = Math.min(remaining - (numSectors - i - 1) * minVal, Math.floor(total * 0.45));
    const val = randInt(minVal, Math.max(minVal, maxVal));
    values.push(val);
    remaining -= val;
  }
  values.push(remaining);

  // Ensure all values positive and at least two different
  if (new Set(values).size === 1 && values.length > 1) values[0] += 2;

  return { title: theme.title, categories, values, total };
}

function pieDescription(data) {
  const pairs = data.categories.map((c, i) => `${c} — ${data.values[i]}`);
  return `A pie chart shows ${data.title.toLowerCase()} of ${data.total} students: ${pairs.join(', ')}.`;
}

// ---------------------------------------------------------------------------
// P4-ST-01: Reading a Line Graph
// ---------------------------------------------------------------------------

function generateLineGraph(familyId) {
  const data = makeLineData();
  const desc = lineDescription(data);

  if (familyId.endsWith('_001')) {
    // Read a specific value
    const idx = randInt(0, data.labels.length - 1);
    const label = data.labels[idx];
    const val = data.values[idx];
    return {
      skillId: 'P4-ST-01',
      questionFamilyId: familyId,
      prompt: `${desc} How many ${data.unit} were there on ${label}?`,
      answer: val,
      answerType: 'number',
      instructionHint: `Read the value at ${label} from the line graph.`,
      solutionText: `The line graph shows ${val} ${data.unit} on ${label}.`,
      diagramData: { type: 'line_graph', ...data },
      misconceptionTraps: ['reads_wrong_axis', 'off_by_one_interval'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Find the change between two points
    const idxs = shuffle([...Array(data.labels.length).keys()]).slice(0, 2).sort((a, b) => a - b);
    const label1 = data.labels[idxs[0]];
    const label2 = data.labels[idxs[1]];
    const val1 = data.values[idxs[0]];
    const val2 = data.values[idxs[1]];
    const change = Math.abs(val2 - val1);
    const direction = val2 > val1 ? 'increase' : val2 < val1 ? 'decrease' : 'change';
    return {
      skillId: 'P4-ST-01',
      questionFamilyId: familyId,
      prompt: `${desc} What is the ${direction} in the number of ${data.unit} from ${label1} to ${label2}?`,
      answer: change,
      answerType: 'number',
      instructionHint: `Find the values at ${label1} and ${label2}, then subtract the smaller from the larger.`,
      solutionText: `${label1}: ${val1}, ${label2}: ${val2}. ${direction === 'increase' ? 'Increase' : 'Decrease'} = ${Math.max(val1, val2)} - ${Math.min(val1, val2)} = ${change}.`,
      diagramData: { type: 'line_graph', ...data },
      misconceptionTraps: ['reads_wrong_axis', 'adds_when_should_subtract'],
    };
  }

  // _003: Find the total across all points
  const total = data.values.reduce((s, v) => s + v, 0);
  return {
    skillId: 'P4-ST-01',
    questionFamilyId: familyId,
    prompt: `${desc} What is the total number of ${data.unit} for all 5 days?`,
    answer: total,
    answerType: 'number',
    instructionHint: 'Add the values for all five data points.',
    solutionText: `${data.values.join(' + ')} = ${total}. The total is ${total} ${data.unit}.`,
    diagramData: { type: 'line_graph', ...data },
    misconceptionTraps: ['reads_wrong_axis', 'off_by_one_interval'],
  };
}

// ---------------------------------------------------------------------------
// P4-ST-02: Reading a Pie Chart
// ---------------------------------------------------------------------------

function generatePieChart(familyId) {
  const data = makePieData();
  const desc = pieDescription(data);

  if (familyId.endsWith('_001')) {
    // Read a specific sector value
    const idx = randInt(0, data.categories.length - 1);
    const cat = data.categories[idx];
    const val = data.values[idx];
    return {
      skillId: 'P4-ST-02',
      questionFamilyId: familyId,
      prompt: `${desc} How many students chose ${cat}?`,
      answer: val,
      answerType: 'number',
      instructionHint: `Read the value for the ${cat} sector.`,
      solutionText: `The ${cat} sector shows ${val} students.`,
      diagramData: { type: 'pie_chart', ...data },
      misconceptionTraps: ['confuses_sector_with_total', 'reads_wrong_axis'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Find the total
    return {
      skillId: 'P4-ST-02',
      questionFamilyId: familyId,
      prompt: `${desc} How many students were surveyed altogether?`,
      answer: data.total,
      answerType: 'number',
      instructionHint: 'Add all the sector values together.',
      solutionText: `${data.values.join(' + ')} = ${data.total}. The total is ${data.total} students.`,
      diagramData: { type: 'pie_chart', ...data },
      misconceptionTraps: ['confuses_sector_with_total'],
    };
  }

  // _003: Difference between two sectors
  const idxs = shuffle([...Array(data.categories.length).keys()]).slice(0, 2);
  const cat1 = data.categories[idxs[0]];
  const cat2 = data.categories[idxs[1]];
  const val1 = data.values[idxs[0]];
  const val2 = data.values[idxs[1]];
  const diff = Math.abs(val1 - val2);
  const more = val1 >= val2 ? cat1 : cat2;
  return {
    skillId: 'P4-ST-02',
    questionFamilyId: familyId,
    prompt: `${desc} How many more students chose ${more} than ${more === cat1 ? cat2 : cat1}?`,
    answer: diff,
    answerType: 'number',
    instructionHint: 'Subtract the smaller sector value from the larger sector value.',
    solutionText: `${cat1}: ${val1}, ${cat2}: ${val2}. Difference = ${Math.max(val1, val2)} - ${Math.min(val1, val2)} = ${diff}.`,
    diagramData: { type: 'pie_chart', ...data },
    misconceptionTraps: ['confuses_sector_with_total', 'adds_when_should_subtract'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P4-ST-01': generateLineGraph,
  'P4-ST-02': generatePieChart,
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
