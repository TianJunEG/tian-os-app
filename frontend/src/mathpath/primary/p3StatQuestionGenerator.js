import { getSkill } from './p3StatSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p3StatQuestionFamilies.js';

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

const CHART_THEMES = [
  { title: 'Favourite Fruit', categories: ['Apple', 'Orange', 'Banana', 'Grape', 'Mango'], unit: 'students' },
  { title: 'Books Read', categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], unit: 'books' },
  { title: 'Sports Played', categories: ['Football', 'Swimming', 'Badminton', 'Running', 'Cycling'], unit: 'children' },
  { title: 'Favourite Colour', categories: ['Red', 'Blue', 'Green', 'Yellow', 'Purple'], unit: 'students' },
  { title: 'Toys Sold', categories: ['Cars', 'Dolls', 'Puzzles', 'Blocks', 'Balls'], unit: 'toys' },
];
const SCALES = [1, 2, 5, 10];

function makeBarData() {
  const theme = pick(CHART_THEMES);
  const numCats = pick([3, 4, 5]);
  const cats = shuffle(theme.categories).slice(0, numCats);
  const scale = pick(SCALES);
  const values = cats.map(() => randInt(1, 10) * scale);
  // Ensure at least two different values for comparison questions
  if (new Set(values).size === 1) values[0] += scale;
  return { title: theme.title, unit: theme.unit, categories: cats, values, scale };
}

function barDescription(data) {
  const lines = data.categories.map((c, i) => `${c}: ${data.values[i]}`);
  return `Bar graph "${data.title}" (scale: ${data.scale}). ${lines.join(', ')}.`;
}

// ---------------------------------------------------------------------------
// P3-ST-01: Reading a Bar Graph
// ---------------------------------------------------------------------------

function generateReadBarGraph(familyId) {
  const data = makeBarData();
  const desc = barDescription(data);

  if (familyId.endsWith('_001')) {
    // Read a single bar value
    const idx = randInt(0, data.categories.length - 1);
    const cat = data.categories[idx];
    const val = data.values[idx];
    return {
      skillId: 'P3-ST-01',
      questionFamilyId: familyId,
      prompt: `${desc} How many ${data.unit} chose ${cat}?`,
      answer: val,
      answerType: 'number',
      instructionHint: `Read the height of the ${cat} bar using the scale.`,
      solutionText: `The ${cat} bar reaches ${val}. There are ${val} ${data.unit}.`,
      diagramData: data,
      misconceptionTraps: ['misreads_scale', 'ignores_axis_label'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Difference between two bars
    const idxs = shuffle([...Array(data.categories.length).keys()]).slice(0, 2);
    const cat1 = data.categories[idxs[0]];
    const cat2 = data.categories[idxs[1]];
    const val1 = data.values[idxs[0]];
    const val2 = data.values[idxs[1]];
    const diff = Math.abs(val1 - val2);
    const more = val1 >= val2 ? cat1 : cat2;
    return {
      skillId: 'P3-ST-01',
      questionFamilyId: familyId,
      prompt: `${desc} How many more ${data.unit} chose ${more} than ${more === cat1 ? cat2 : cat1}?`,
      answer: diff,
      answerType: 'number',
      instructionHint: 'Subtract the smaller value from the larger value.',
      solutionText: `${cat1}: ${val1}, ${cat2}: ${val2}. Difference = ${Math.max(val1, val2)} - ${Math.min(val1, val2)} = ${diff}.`,
      diagramData: data,
      misconceptionTraps: ['misreads_scale', 'counts_bars_not_values'],
    };
  }

  // _003: Total across 2 or 3 categories
  const count = pick([2, 3]);
  const idxs = shuffle([...Array(data.categories.length).keys()]).slice(0, count);
  const chosen = idxs.map((i) => ({ cat: data.categories[i], val: data.values[i] }));
  const total = chosen.reduce((s, c) => s + c.val, 0);
  const catList = chosen.map((c) => c.cat).join(' and ');
  return {
    skillId: 'P3-ST-01',
    questionFamilyId: familyId,
    prompt: `${desc} How many ${data.unit} chose ${catList} altogether?`,
    answer: total,
    answerType: 'number',
    instructionHint: 'Add the values of the bars.',
    solutionText: `${chosen.map((c) => `${c.cat}: ${c.val}`).join(' + ')} = ${total}.`,
    diagramData: data,
    misconceptionTraps: ['misreads_scale'],
  };
}

// ---------------------------------------------------------------------------
// P3-ST-02: Most & Least on a Bar Graph
// ---------------------------------------------------------------------------

function generateMostLeast(familyId) {
  const data = makeBarData();
  const desc = barDescription(data);

  const maxVal = Math.max(...data.values);
  const minVal = Math.min(...data.values);
  const maxCat = data.categories[data.values.indexOf(maxVal)];
  const minCat = data.categories[data.values.indexOf(minVal)];

  if (familyId.endsWith('_001')) {
    return {
      skillId: 'P3-ST-02',
      questionFamilyId: familyId,
      prompt: `${desc} Which ${data.title.toLowerCase().includes('favourite') ? 'choice' : 'category'} has the most ${data.unit}?`,
      answer: maxCat,
      answerType: 'text',
      instructionHint: 'Find the tallest bar.',
      solutionText: `The tallest bar is ${maxCat} with ${maxVal} ${data.unit}.`,
      diagramData: data,
      misconceptionTraps: ['confuses_most_least', 'misreads_scale'],
    };
  }

  if (familyId.endsWith('_002')) {
    return {
      skillId: 'P3-ST-02',
      questionFamilyId: familyId,
      prompt: `${desc} Which ${data.title.toLowerCase().includes('favourite') ? 'choice' : 'category'} has the least ${data.unit}?`,
      answer: minCat,
      answerType: 'text',
      instructionHint: 'Find the shortest bar.',
      solutionText: `The shortest bar is ${minCat} with ${minVal} ${data.unit}.`,
      diagramData: data,
      misconceptionTraps: ['confuses_most_least', 'misreads_scale'],
    };
  }

  // _003: Difference between most and least
  const diff = maxVal - minVal;
  return {
    skillId: 'P3-ST-02',
    questionFamilyId: familyId,
    prompt: `${desc} How many more ${data.unit} does the most popular have than the least popular?`,
    answer: diff,
    answerType: 'number',
    instructionHint: 'Subtract the least from the most.',
    solutionText: `Most: ${maxCat} (${maxVal}). Least: ${minCat} (${minVal}). Difference = ${maxVal} - ${minVal} = ${diff}.`,
    diagramData: data,
    misconceptionTraps: ['confuses_most_least', 'misreads_scale'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P3-ST-01': generateReadBarGraph,
  'P3-ST-02': generateMostLeast,
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
