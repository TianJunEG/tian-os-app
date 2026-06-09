import { getSkill } from './p1DataSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p1DataQuestionFamilies.js';
import {
  pictureCollectionDiagram,
  comparisonModelDiagram,
} from './p1DiagramHelpers.js';

const GRAPH_TOPICS = [
  { title: 'Favourite Fruits', categories: ['apples', 'oranges', 'bananas', 'grapes'] },
  { title: 'Favourite Animals', categories: ['cats', 'dogs', 'rabbits', 'fish'] },
  { title: 'Favourite Colours', categories: ['red', 'blue', 'green', 'yellow'] },
  { title: 'Favourite Sports', categories: ['swimming', 'running', 'football', 'badminton'] },
  { title: 'Toys We Have', categories: ['dolls', 'cars', 'balls', 'blocks'] },
];

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

function buildGraphData(categoryCount, minCount, maxCount) {
  const topic = pick(GRAPH_TOPICS);
  const shuffled = shuffle(topic.categories);
  const chosen = shuffled.slice(0, categoryCount);
  const categories = chosen.map((label) => ({
    label,
    count: randInt(minCount, maxCount),
  }));
  return { title: topic.title, categories };
}

function buildGraphDataDistinct(categoryCount, minCount, maxCount) {
  let data;
  let attempts = 0;
  do {
    data = buildGraphData(categoryCount, minCount, maxCount);
    attempts++;
  } while (
    attempts < 20 &&
    new Set(data.categories.map((c) => c.count)).size < data.categories.length
  );
  return data;
}

// --- P1-DAT-01: Read simple picture graphs ---
function generateReadGraph(familyId) {
  const is4Cat = familyId.endsWith('_002');
  const catCount = is4Cat ? 4 : 3;
  const { title, categories } = buildGraphData(catCount, 1, 8);
  const target = pick(categories);

  return {
    skillId: 'P1-DAT-01',
    questionFamilyId: familyId,
    prompt: `Look at the picture graph "${title}". How many children chose ${target.label}?`,
    answer: target.count,
    answerType: 'number',
    instructionHint: 'Count the pictures next to the label and write the number.',
    solutionText: `Count the pictures for ${target.label}. There are ${target.count}.`,
    diagramSpec: pictureCollectionDiagram(categories, { symbol: '●', title }),
    misconceptionTraps: ['graph_counts_all'],
  };
}

// --- P1-DAT-02: Count items in each category ---
function generateCountCategory(familyId) {
  const isSmall = familyId.endsWith('_001');
  const minCount = isSmall ? 1 : 4;
  const maxCount = isSmall ? 5 : 8;
  const { title, categories } = buildGraphData(3, minCount, maxCount);
  const target = pick(categories);

  return {
    skillId: 'P1-DAT-02',
    questionFamilyId: familyId,
    prompt: `Count the ${target.label} in the picture graph "${title}". How many are there?`,
    answer: target.count,
    answerType: 'number',
    instructionHint: 'Count each picture carefully. Write the number.',
    solutionText: `Count each picture for ${target.label}: there are ${target.count}.`,
    diagramSpec: pictureCollectionDiagram(categories, { symbol: '●', title }),
    misconceptionTraps: ['graph_counts_across_rows', 'graph_skips_picture'],
  };
}

// --- P1-DAT-03: Compare categories ---
function generateCompareCategories(familyId) {
  const isMostFewest = familyId.endsWith('_001');
  const { title, categories } = buildGraphDataDistinct(3, 1, 8);

  if (isMostFewest) {
    const askMost = Math.random() < 0.5;
    const sorted = [...categories].sort((a, b) => a.count - b.count);
    const answer = askMost ? sorted[sorted.length - 1].label : sorted[0].label;
    const word = askMost ? 'most' : 'fewest';

    return {
      skillId: 'P1-DAT-03',
      questionFamilyId: familyId,
      prompt: `Look at the picture graph "${title}". Which has the ${word}?`,
      answer,
      answerType: 'text',
      instructionHint: `Count each category and find the one with the ${word}.`,
      solutionText: `${categories.map((c) => `${c.label}: ${c.count}`).join(', ')}. ${answer} has the ${word}.`,
      diagramSpec: pictureCollectionDiagram(categories, { symbol: '●', title }),
      misconceptionTraps: ['graph_by_preference', 'graph_by_label_length'],
    };
  }

  // More/fewer comparison between two specific categories
  const pair = shuffle(categories).slice(0, 2);
  const [catA, catB] = pair;
  const askMore = Math.random() < 0.5;
  const word = askMore ? 'more' : 'fewer';
  const answer = askMore
    ? (catA.count >= catB.count ? catA.label : catB.label)
    : (catA.count <= catB.count ? catA.label : catB.label);

  return {
    skillId: 'P1-DAT-03',
    questionFamilyId: familyId,
    prompt: `Look at the picture graph "${title}". Which has ${word}: ${catA.label} or ${catB.label}?`,
    answer,
    answerType: 'text',
    instructionHint: `Count both categories and decide which has ${word}.`,
    solutionText: `${catA.label}: ${catA.count}, ${catB.label}: ${catB.count}. ${answer} has ${word}.`,
    diagramSpec: pictureCollectionDiagram(categories, { symbol: '●', title }),
    misconceptionTraps: ['graph_by_preference', 'graph_by_label_length'],
  };
}

// --- P1-DAT-04: Find total from a graph ---
function generateFindTotal(familyId) {
  const is4Cat = familyId.endsWith('_002');
  const catCount = is4Cat ? 4 : 3;
  const { title, categories } = buildGraphData(catCount, 1, 8);
  const total = categories.reduce((sum, c) => sum + c.count, 0);
  const countsStr = categories.map((c) => c.count).join(' + ');

  return {
    skillId: 'P1-DAT-04',
    questionFamilyId: familyId,
    prompt: `Look at the picture graph "${title}". How many children voted altogether?`,
    answer: total,
    answerType: 'number',
    instructionHint: 'Add up the count for every category.',
    solutionText: `${countsStr} = ${total}. There are ${total} children altogether.`,
    diagramSpec: pictureCollectionDiagram(categories, { symbol: '●', title }),
    workingTemplate: { format: 'equation', boxes: catCount + 1, operatorCircle: true },
    misconceptionTraps: ['graph_largest_not_total'],
  };
}

// --- P1-DAT-05: Answer simple data questions (difference) ---
function generateDataQuestion(familyId) {
  const isMore = familyId.endsWith('_001');
  const { title, categories } = buildGraphDataDistinct(3, 1, 8);
  const pair = shuffle(categories).slice(0, 2);
  const [catA, catB] = pair;
  const larger = catA.count >= catB.count ? catA : catB;
  const smaller = catA.count >= catB.count ? catB : catA;
  const diff = larger.count - smaller.count;

  const word = isMore ? 'more' : 'fewer';
  const prompt = isMore
    ? `Look at the picture graph "${title}". How many more ${larger.label} than ${smaller.label}?`
    : `Look at the picture graph "${title}". How many fewer ${smaller.label} than ${larger.label}?`;

  return {
    skillId: 'P1-DAT-05',
    questionFamilyId: familyId,
    prompt,
    answer: diff,
    answerType: 'number',
    instructionHint: 'Find the difference between the two categories.',
    solutionText: `${larger.label}: ${larger.count}, ${smaller.label}: ${smaller.count}. ${larger.count} − ${smaller.count} = ${diff}.`,
    diagramSpec: comparisonModelDiagram(larger.count, smaller.count, {
      leftLabel: larger.label,
      rightLabel: smaller.label,
      mode: 'difference',
      title,
    }),
    workingTemplate: { format: 'equation', boxes: 3, operatorCircle: true },
    misconceptionTraps: ['graph_adds_instead_of_diff', 'graph_ignores_question'],
  };
}

// --- P1-DAT-06: Complete a simple picture graph ---
function generateCompleteGraph(familyId) {
  const isGivenCount = familyId.endsWith('_001');

  if (isGivenCount) {
    // Family 1: given count, draw pictures
    const { title, categories } = buildGraphData(3, 1, 8);
    const targetIdx = randInt(0, categories.length - 1);
    const target = categories[targetIdx];

    return {
      skillId: 'P1-DAT-06',
      questionFamilyId: familyId,
      prompt: `In the picture graph "${title}", ${target.label} has ${target.count} votes. How many pictures should you draw for ${target.label}?`,
      answer: target.count,
      answerType: 'number',
      instructionHint: 'Draw the same number of pictures as the count given.',
      solutionText: `${target.label} has ${target.count} votes, so draw ${target.count} pictures.`,
      diagramSpec: pictureCollectionDiagram(
        categories.map((c, i) => i === targetIdx ? { label: c.label, count: 0 } : c),
        { symbol: '●', title }
      ),
      misconceptionTraps: ['graph_draw_mismatch'],
    };
  }

  // Family 2: given total and other categories, find missing count
  const { title, categories } = buildGraphData(3, 1, 8);
  const total = categories.reduce((sum, c) => sum + c.count, 0);
  const hiddenIdx = randInt(0, categories.length - 1);
  const hidden = categories[hiddenIdx];
  const knownSum = total - hidden.count;

  return {
    skillId: 'P1-DAT-06',
    questionFamilyId: familyId,
    prompt: `In the picture graph "${title}", there are ${total} votes altogether. ${categories.filter((_, i) => i !== hiddenIdx).map((c) => `${c.label} has ${c.count}`).join(', ')}. How many votes does ${hidden.label} have?`,
    answer: hidden.count,
    answerType: 'number',
    instructionHint: 'Add the known counts, then subtract from the total.',
    solutionText: `Total is ${total}. Known: ${knownSum}. ${total} − ${knownSum} = ${hidden.count}.`,
    diagramSpec: pictureCollectionDiagram(
      categories.map((c, i) => i === hiddenIdx ? { label: c.label, count: 0 } : c),
      { symbol: '●', title }
    ),
    workingTemplate: { format: 'equation', boxes: 3, operatorCircle: true },
    misconceptionTraps: ['graph_draw_mismatch', 'graph_row_column_confusion'],
  };
}

const generatorsBySkill = {
  'P1-DAT-01': generateReadGraph,
  'P1-DAT-02': generateCountCategory,
  'P1-DAT-03': generateCompareCategories,
  'P1-DAT-04': generateFindTotal,
  'P1-DAT-05': generateDataQuestion,
  'P1-DAT-06': generateCompleteGraph,
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
