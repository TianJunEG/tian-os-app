import { getSkill } from './p5StatSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p5StatQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ---------------------------------------------------------------------------
// P5-ST-01: Average (Mean)
// ---------------------------------------------------------------------------

const AVERAGE_CONTEXTS = [
  { noun: 'students', verb: 'scored', unit: 'marks', activity: 'on a spelling test' },
  { noun: 'children', verb: 'collected', unit: 'stickers', activity: 'during a sticker drive' },
  { noun: 'runners', verb: 'completed', unit: 'laps', activity: 'during a training session' },
  { noun: 'classes', verb: 'recycled', unit: 'bottles', activity: 'for a recycling project' },
  { noun: 'friends', verb: 'read', unit: 'pages', activity: 'over the school holidays' },
  { noun: 'teams', verb: 'scored', unit: 'points', activity: 'in a quiz competition' },
];

/**
 * Generate `count` positive integers whose sum equals `targetSum`.
 * Each value is at least `minVal`.
 */
function generateValuesWithSum(count, targetSum, minVal = 5) {
  const values = [];
  let remaining = targetSum - count * minVal;
  for (let i = 0; i < count - 1; i++) {
    const maxAdd = Math.min(remaining, Math.floor(targetSum / count));
    const add = randInt(0, maxAdd);
    values.push(minVal + add);
    remaining -= add;
  }
  values.push(minVal + remaining);
  // Shuffle so the last value isn't always the biggest
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
}

function generateAverage(familyId) {
  const ctx = pick(AVERAGE_CONTEXTS);

  if (familyId.endsWith('_001')) {
    // Find the average of 4-5 numbers (sum divisible by count)
    const count = pick([4, 5]);
    const average = randInt(10, 50);
    const totalSum = average * count;
    const values = generateValuesWithSum(count, totalSum);
    const valStr = values.join(', ');
    return {
      skillId: 'P5-ST-01',
      questionFamilyId: familyId,
      prompt: `${count} ${ctx.noun} ${ctx.verb} the following number of ${ctx.unit} ${ctx.activity}: ${valStr}. Find the average number of ${ctx.unit}.`,
      answer: average,
      answerType: 'number',
      instructionHint: `Add all the values, then divide by ${count}.`,
      solutionText: `Total = ${values.join(' + ')} = ${totalSum}. Average = ${totalSum} ÷ ${count} = ${average}.`,
      misconceptionTraps: ['divides_by_wrong_count_for_average', 'forgets_to_include_all_values'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Find the total from average and count
    const count = pick([4, 5, 6]);
    const average = randInt(12, 45);
    const total = average * count;
    return {
      skillId: 'P5-ST-01',
      questionFamilyId: familyId,
      prompt: `The average number of ${ctx.unit} ${ctx.verb} by ${count} ${ctx.noun} ${ctx.activity} is ${average}. What is the total number of ${ctx.unit}?`,
      answer: total,
      answerType: 'number',
      instructionHint: `Total = Average × Number of items = ${average} × ${count}.`,
      solutionText: `Total = ${average} × ${count} = ${total}.`,
      misconceptionTraps: ['divides_by_wrong_count_for_average'],
    };
  }

  // _003: Find the missing value given the average and the other values
  const count = pick([4, 5]);
  const average = randInt(15, 45);
  const totalSum = average * count;
  const values = generateValuesWithSum(count, totalSum, 5);
  const hiddenIdx = randInt(0, count - 1);
  const missingValue = values[hiddenIdx];
  const knownValues = values.filter((_, i) => i !== hiddenIdx);
  const knownSum = knownValues.reduce((s, v) => s + v, 0);
  const knownStr = knownValues.join(', ');
  const names = [];
  for (let i = 0; i < count; i++) {
    names.push(String.fromCharCode(65 + i)); // A, B, C, D, E
  }
  const hiddenName = names[hiddenIdx];

  return {
    skillId: 'P5-ST-01',
    questionFamilyId: familyId,
    prompt: `The average number of ${ctx.unit} ${ctx.verb} by ${count} ${ctx.noun} ${ctx.activity} is ${average}. If ${count - 1} of them ${ctx.verb} ${knownStr} ${ctx.unit} respectively, how many ${ctx.unit} did ${ctx.noun.slice(0, -1)} ${hiddenName} ${ctx.verb.replace('scored', 'score').replace('collected', 'collect').replace('completed', 'complete').replace('recycled', 'recycle').replace('read', 'read')}?`,
    answer: missingValue,
    answerType: 'number',
    instructionHint: `Total = Average × Count = ${average} × ${count} = ${totalSum}. Missing value = Total − Sum of known values.`,
    solutionText: `Total = ${average} × ${count} = ${totalSum}. Known sum = ${knownValues.join(' + ')} = ${knownSum}. Missing value = ${totalSum} − ${knownSum} = ${missingValue}.`,
    misconceptionTraps: ['divides_by_wrong_count_for_average', 'confuses_average_with_median', 'forgets_to_include_all_values'],
  };
}

// ---------------------------------------------------------------------------
// P5-ST-02: Data Interpretation
// ---------------------------------------------------------------------------

const TABLE_TOPICS = [
  { title: 'number of books borrowed from the library', categories: ['Fiction', 'Non-fiction', 'Comics', 'Science', 'History'], unit: 'books' },
  { title: 'number of students who chose each CCA', categories: ['Art', 'Basketball', 'Choir', 'Drama', 'Robotics'], unit: 'students' },
  { title: 'number of items sold at a school fair', categories: ['Cookies', 'Muffins', 'Sandwiches', 'Juice', 'Popcorn'], unit: 'items' },
  { title: 'number of visitors to different exhibits', categories: ['Dinosaurs', 'Space', 'Ocean Life', 'Rainforest', 'Inventions'], unit: 'visitors' },
  { title: 'number of goals scored by each team', categories: ['Eagles', 'Falcons', 'Hawks', 'Tigers', 'Lions'], unit: 'goals' },
];

function generateTableValues(count) {
  const values = [];
  for (let i = 0; i < count; i++) {
    values.push(randInt(12, 85));
  }
  return values;
}

function describeTable(topic, values) {
  const rows = topic.categories.map((cat, i) => `${cat}: ${values[i]}`);
  return `The table below shows the ${topic.title}.\n${rows.join(', ')}.`;
}

function generateDataInterpretation(familyId) {
  const topic = pick(TABLE_TOPICS);
  const catCount = topic.categories.length;
  const values = generateTableValues(catCount);
  const description = describeTable(topic, values);

  if (familyId.endsWith('_001')) {
    // Find difference between two values
    let idx1 = randInt(0, catCount - 1);
    let idx2 = randInt(0, catCount - 1);
    while (idx2 === idx1) idx2 = randInt(0, catCount - 1);
    const bigger = values[idx1] >= values[idx2] ? idx1 : idx2;
    const smaller = bigger === idx1 ? idx2 : idx1;
    const answer = values[bigger] - values[smaller];
    return {
      skillId: 'P5-ST-02',
      questionFamilyId: familyId,
      prompt: `${description}\n\nHow many more ${topic.unit} does ${topic.categories[bigger]} have than ${topic.categories[smaller]}?`,
      answer,
      answerType: 'number',
      instructionHint: `Find the values for ${topic.categories[bigger]} and ${topic.categories[smaller]}, then subtract.`,
      solutionText: `${topic.categories[bigger]}: ${values[bigger]}. ${topic.categories[smaller]}: ${values[smaller]}. Difference = ${values[bigger]} − ${values[smaller]} = ${answer}.`,
      misconceptionTraps: ['reads_wrong_row_column'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Compute total from table data
    const total = values.reduce((s, v) => s + v, 0);
    return {
      skillId: 'P5-ST-02',
      questionFamilyId: familyId,
      prompt: `${description}\n\nWhat is the total number of ${topic.unit}?`,
      answer: total,
      answerType: 'number',
      instructionHint: `Add up all the values in the table: ${values.join(' + ')}.`,
      solutionText: `Total = ${values.join(' + ')} = ${total}.`,
      misconceptionTraps: ['forgets_to_include_all_values', 'double_counts_data'],
    };
  }

  // _003: Find which category has the most or least
  const askMost = pick([true, false]);
  let targetIdx;
  if (askMost) {
    targetIdx = values.indexOf(Math.max(...values));
  } else {
    targetIdx = values.indexOf(Math.min(...values));
  }
  const answer = values[targetIdx];
  const direction = askMost ? 'most' : 'fewest';

  return {
    skillId: 'P5-ST-02',
    questionFamilyId: familyId,
    prompt: `${description}\n\nWhich category has the ${direction} ${topic.unit}? Give the number of ${topic.unit} for that category.`,
    answer,
    answerType: 'number',
    instructionHint: `Compare all the values to find the ${askMost ? 'largest' : 'smallest'} one.`,
    solutionText: `Values: ${topic.categories.map((c, i) => `${c} = ${values[i]}`).join(', ')}. The ${direction} is ${topic.categories[targetIdx]} with ${answer} ${topic.unit}.`,
    misconceptionTraps: ['reads_wrong_row_column', 'double_counts_data'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P5-ST-01': generateAverage,
  'P5-ST-02': generateDataInterpretation,
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
