import { getSkill } from './p2StatSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p2StatQuestionFamilies.js';

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

const GRAPH_THEMES = [
  { title: 'Favourite Fruit', categories: ['Apple', 'Orange', 'Banana', 'Grape', 'Watermelon'], unit: 'children', icon: 'fruit' },
  { title: 'Pets We Have', categories: ['Dog', 'Cat', 'Fish', 'Hamster', 'Bird'], unit: 'children', icon: 'paw' },
  { title: 'Favourite Drink', categories: ['Milk', 'Juice', 'Water', 'Milo', 'Tea'], unit: 'children', icon: 'cup' },
  { title: 'Stickers Collected', categories: ['Red', 'Blue', 'Green', 'Yellow', 'Pink'], unit: 'stickers', icon: 'star' },
  { title: 'Books Read', categories: ['Ali', 'Ben', 'Mei', 'Siti', 'Raj'], unit: 'books', icon: 'book' },
];
const SCALES = [1, 2, 5];

function makePictureGraphData() {
  const theme = pick(GRAPH_THEMES);
  const numCats = randInt(3, 5);
  const cats = shuffle(theme.categories).slice(0, numCats);
  const scale = pick(SCALES);
  const iconCounts = cats.map(() => randInt(1, 8));
  const values = iconCounts.map((c) => c * scale);
  // Ensure at least two different values for comparison questions
  if (new Set(values).size === 1) {
    iconCounts[0] = Math.min(iconCounts[0] + 1, 8);
    values[0] = iconCounts[0] * scale;
  }
  return { title: theme.title, unit: theme.unit, icon: theme.icon, categories: cats, iconCounts, values, scale };
}

function graphDescription(data) {
  const lines = data.categories.map((c, i) => `${c}: ${data.iconCounts[i]} icon${data.iconCounts[i] !== 1 ? 's' : ''}`);
  return `Picture graph "${data.title}" (each icon = ${data.scale}). ${lines.join(', ')}.`;
}

// ---------------------------------------------------------------------------
// P2-ST-01: Reading a Picture Graph
// ---------------------------------------------------------------------------

function generateReadPictureGraph(familyId) {
  const data = makePictureGraphData();
  const desc = graphDescription(data);

  if (familyId.endsWith('_001')) {
    // Read a single category
    const idx = randInt(0, data.categories.length - 1);
    const cat = data.categories[idx];
    const icons = data.iconCounts[idx];
    const val = data.values[idx];
    return {
      skillId: 'P2-ST-01',
      questionFamilyId: familyId,
      prompt: `${desc} How many ${data.unit} chose ${cat}?`,
      answer: val,
      answerType: 'number',
      instructionHint: `Count the icons for ${cat} and multiply by ${data.scale}.`,
      solutionText: `${cat} has ${icons} icon${icons !== 1 ? 's' : ''}. ${icons} × ${data.scale} = ${val}. There are ${val} ${data.unit}.`,
      diagramData: data,
      misconceptionTraps: ['ignores_scale_on_graph', 'miscounts_icons'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Compare two categories
    const idxs = shuffle([...Array(data.categories.length).keys()]).slice(0, 2);
    const cat1 = data.categories[idxs[0]];
    const cat2 = data.categories[idxs[1]];
    const val1 = data.values[idxs[0]];
    const val2 = data.values[idxs[1]];
    const diff = Math.abs(val1 - val2);
    const more = val1 >= val2 ? cat1 : cat2;
    return {
      skillId: 'P2-ST-01',
      questionFamilyId: familyId,
      prompt: `${desc} How many more ${data.unit} chose ${more} than ${more === cat1 ? cat2 : cat1}?`,
      answer: diff,
      answerType: 'number',
      instructionHint: 'Find the value for each category, then subtract the smaller from the larger.',
      solutionText: `${cat1}: ${val1}, ${cat2}: ${val2}. Difference = ${Math.max(val1, val2)} - ${Math.min(val1, val2)} = ${diff}.`,
      diagramData: data,
      misconceptionTraps: ['ignores_scale_on_graph', 'miscounts_icons'],
    };
  }

  // _003: Total across 2 or 3 categories
  const count = pick([2, 3]);
  const idxs = shuffle([...Array(data.categories.length).keys()]).slice(0, count);
  const chosen = idxs.map((i) => ({ cat: data.categories[i], val: data.values[i] }));
  const total = chosen.reduce((s, c) => s + c.val, 0);
  const catList = chosen.map((c) => c.cat).join(' and ');
  return {
    skillId: 'P2-ST-01',
    questionFamilyId: familyId,
    prompt: `${desc} How many ${data.unit} chose ${catList} altogether?`,
    answer: total,
    answerType: 'number',
    instructionHint: 'Find the value for each category and add them together.',
    solutionText: `${chosen.map((c) => `${c.cat}: ${c.val}`).join(' + ')} = ${total}.`,
    diagramData: data,
    misconceptionTraps: ['ignores_scale_on_graph', 'miscounts_icons'],
  };
}

// ---------------------------------------------------------------------------
// P2-ST-02: Most & Least on a Picture Graph
// ---------------------------------------------------------------------------

function generateMostLeast(familyId) {
  const data = makePictureGraphData();
  const desc = graphDescription(data);

  const maxVal = Math.max(...data.values);
  const minVal = Math.min(...data.values);
  const maxCat = data.categories[data.values.indexOf(maxVal)];
  const minCat = data.categories[data.values.indexOf(minVal)];

  if (familyId.endsWith('_001')) {
    return {
      skillId: 'P2-ST-02',
      questionFamilyId: familyId,
      prompt: `${desc} Which category has the most ${data.unit}?`,
      answer: maxCat,
      answerType: 'text',
      instructionHint: 'Find the category with the longest row of icons.',
      solutionText: `The longest row is ${maxCat} with ${maxVal} ${data.unit}.`,
      diagramData: data,
      misconceptionTraps: ['confuses_most_least', 'ignores_scale_on_graph'],
    };
  }

  // _002: Find the least
  return {
    skillId: 'P2-ST-02',
    questionFamilyId: familyId,
    prompt: `${desc} Which category has the least ${data.unit}?`,
    answer: minCat,
    answerType: 'text',
    instructionHint: 'Find the category with the shortest row of icons.',
    solutionText: `The shortest row is ${minCat} with ${minVal} ${data.unit}.`,
    diagramData: data,
    misconceptionTraps: ['confuses_most_least', 'ignores_scale_on_graph'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P2-ST-01': generateReadPictureGraph,
  'P2-ST-02': generateMostLeast,
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
