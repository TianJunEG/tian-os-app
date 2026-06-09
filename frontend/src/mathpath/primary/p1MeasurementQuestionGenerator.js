import { getSkill } from './p1MeasurementSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p1MeasurementQuestionFamilies.js';
import {
  comparisonModelDiagram,
  clockDiagram,
  lengthMeasurementDiagram,
} from './p1DiagramHelpers.js';

const LENGTH_OBJECTS = [
  { name: 'pencil', lengthRange: [12, 18] },
  { name: 'ruler', lengthRange: [15, 30] },
  { name: 'ribbon', lengthRange: [10, 25] },
  { name: 'string', lengthRange: [8, 20] },
  { name: 'straw', lengthRange: [10, 22] },
  { name: 'stick', lengthRange: [15, 30] },
  { name: 'crayon', lengthRange: [6, 12] },
  { name: 'spoon', lengthRange: [12, 18] },
];

const HEIGHT_OBJECTS = [
  { name: 'bottle', heightRange: [15, 30] },
  { name: 'box', heightRange: [10, 25] },
  { name: 'book', heightRange: [15, 28] },
  { name: 'toy tower', heightRange: [12, 35] },
  { name: 'plant', heightRange: [8, 30] },
  { name: 'lamp', heightRange: [20, 40] },
];

const MASS_PAIRS = [
  { heavy: 'watermelon', light: 'apple', reason: 'A watermelon is much bigger and denser than an apple.' },
  { heavy: 'school bag', light: 'pencil case', reason: 'A school bag has many books inside and is heavier.' },
  { heavy: 'brick', light: 'sponge', reason: 'A brick is made of heavy material.' },
  { heavy: 'iron', light: 'feather', reason: 'An iron is made of metal and is very heavy.' },
  { heavy: 'dictionary', light: 'notebook', reason: 'A dictionary has many more pages.' },
  { heavy: 'bowling ball', light: 'balloon', reason: 'A bowling ball is solid and heavy.' },
  { heavy: 'pumpkin', light: 'orange', reason: 'A pumpkin is much larger and heavier.' },
  { heavy: 'rock', light: 'leaf', reason: 'A rock is solid and heavy.' },
];

const CAPACITY_PAIRS = [
  { more: 'pail', less: 'cup', moreDesc: 'wide and tall', lessDesc: 'small' },
  { more: 'fish tank', less: 'bowl', moreDesc: 'large and wide', lessDesc: 'small and round' },
  { more: 'bathtub', less: 'basin', moreDesc: 'very large', lessDesc: 'medium-sized' },
  { more: 'kettle', less: 'mug', moreDesc: 'tall and wide', lessDesc: 'small' },
  { more: 'water bottle', less: 'medicine cup', moreDesc: 'tall', lessDesc: 'very small' },
  { more: 'cooking pot', less: 'glass', moreDesc: 'wide and deep', lessDesc: 'narrow' },
];

const CAPACITY_LEVELS = ['full', 'almost full', 'half full', 'almost empty', 'empty'];

const EVENT_SEQUENCES = [
  { events: ['wake up', 'eat breakfast', 'go to school'], period: 'morning' },
  { events: ['eat lunch', 'play at recess', 'do art class'], period: 'afternoon' },
  { events: ['go home from school', 'do homework', 'eat dinner'], period: 'evening' },
  { events: ['brush teeth', 'read a story', 'go to sleep'], period: 'night' },
  { events: ['put on uniform', 'pack school bag', 'walk to the bus stop'], period: 'morning' },
  { events: ['eat breakfast', 'brush teeth', 'leave for school'], period: 'morning' },
  { events: ['come home', 'take a shower', 'eat dinner'], period: 'evening' },
  { events: ['eat lunch', 'have science class', 'go for PE'], period: 'afternoon' },
];

const MEASURE_OBJECTS = ['pencil', 'book', 'ribbon', 'eraser', 'ruler', 'box', 'straw', 'toy car'];

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

// --- P1-MEA-01: Compare length ---
function generateCompareLength(familyId) {
  const isTaller = familyId.endsWith('_002');

  if (isTaller) {
    const objA = pick(HEIGHT_OBJECTS);
    let objB = pick(HEIGHT_OBJECTS);
    while (objB.name === objA.name) objB = pick(HEIGHT_OBJECTS);

    const heightA = randInt(objA.heightRange[0], objA.heightRange[1]);
    const heightB = randInt(objB.heightRange[0], objB.heightRange[1]);
    while (heightA === heightB) {
      return generateCompareLength(familyId);
    }

    const taller = heightA > heightB ? objA.name : objB.name;
    const shorter = heightA > heightB ? objB.name : objA.name;
    const askTaller = Math.random() < 0.5;

    return {
      skillId: 'P1-MEA-01',
      questionFamilyId: familyId,
      prompt: askTaller
        ? `The ${objA.name} is ${heightA} cm tall. The ${objB.name} is ${heightB} cm tall. Which is taller?`
        : `The ${objA.name} is ${heightA} cm tall. The ${objB.name} is ${heightB} cm tall. Which is shorter?`,
      answer: askTaller ? taller : shorter,
      answerType: 'choice',
      instructionHint: 'Choose the correct object.',
      solutionText: `${heightA > heightB ? objA.name : objB.name} is taller because ${Math.max(heightA, heightB)} cm > ${Math.min(heightA, heightB)} cm.`,
      diagramSpec: comparisonModelDiagram(Math.max(heightA, heightB), Math.min(heightA, heightB), {
        leftLabel: heightA > heightB ? objA.name : objB.name,
        rightLabel: heightA > heightB ? objB.name : objA.name,
        mode: 'difference',
        title: 'Compare heights',
      }),
      misconceptionTraps: ['length_by_position'],
    };
  }

  const objA = pick(LENGTH_OBJECTS);
  let objB = pick(LENGTH_OBJECTS);
  while (objB.name === objA.name) objB = pick(LENGTH_OBJECTS);

  const lengthA = randInt(objA.lengthRange[0], objA.lengthRange[1]);
  const lengthB = randInt(objB.lengthRange[0], objB.lengthRange[1]);
  while (lengthA === lengthB) {
    return generateCompareLength(familyId);
  }

  const longer = lengthA > lengthB ? objA.name : objB.name;
  const shorterObj = lengthA > lengthB ? objB.name : objA.name;
  const askLonger = Math.random() < 0.5;

  return {
    skillId: 'P1-MEA-01',
    questionFamilyId: familyId,
    prompt: askLonger
      ? `The ${objA.name} is ${lengthA} cm long. The ${objB.name} is ${lengthB} cm long. Which is longer?`
      : `The ${objA.name} is ${lengthA} cm long. The ${objB.name} is ${lengthB} cm long. Which is shorter?`,
    answer: askLonger ? longer : shorterObj,
    answerType: 'choice',
    instructionHint: 'Choose the correct object.',
    solutionText: `${lengthA > lengthB ? objA.name : objB.name} is longer because ${Math.max(lengthA, lengthB)} cm > ${Math.min(lengthA, lengthB)} cm.`,
    diagramSpec: comparisonModelDiagram(Math.max(lengthA, lengthB), Math.min(lengthA, lengthB), {
      leftLabel: lengthA > lengthB ? objA.name : objB.name,
      rightLabel: lengthA > lengthB ? objB.name : objA.name,
      mode: 'difference',
      title: 'Compare lengths',
    }),
    misconceptionTraps: ['length_by_position', 'length_by_thickness'],
  };
}

// --- P1-MEA-02: Compare mass ---
function generateCompareMass(familyId) {
  const isArrange = familyId.endsWith('_002');

  if (isArrange) {
    const indices = shuffle([...Array(MASS_PAIRS.length).keys()]).slice(0, 3);
    const items = indices.map((i) => MASS_PAIRS[i]);
    const allObjects = shuffle([
      { name: items[0].heavy, weight: 3 },
      { name: items[1].heavy, weight: 2 },
      { name: items[2].light, weight: 1 },
    ]);

    const sorted = [...allObjects].sort((a, b) => a.weight - b.weight);
    const answer = sorted.map((o) => o.name).join(', ');
    const askLightest = Math.random() < 0.5;

    return {
      skillId: 'P1-MEA-02',
      questionFamilyId: familyId,
      prompt: askLightest
        ? `Arrange from lightest to heaviest: ${allObjects.map((o) => o.name).join(', ')}.`
        : `Arrange from heaviest to lightest: ${allObjects.map((o) => o.name).join(', ')}.`,
      answer: askLightest ? answer : sorted.reverse().map((o) => o.name).join(', '),
      answerType: 'choice',
      instructionHint: 'Put the objects in the correct order.',
      solutionText: `The correct order from lightest to heaviest is: ${sorted.sort((a, b) => a.weight - b.weight).map((o) => o.name).join(', ')}.`,
      diagramSpec: comparisonModelDiagram(3, 1, {
        leftLabel: 'heaviest',
        rightLabel: 'lightest',
        mode: 'difference',
        title: 'Arrange by mass',
      }),
      misconceptionTraps: ['mass_by_size'],
    };
  }

  const pair = pick(MASS_PAIRS);
  const askHeavier = Math.random() < 0.5;
  const presentFirst = Math.random() < 0.5;
  const first = presentFirst ? pair.heavy : pair.light;
  const second = presentFirst ? pair.light : pair.heavy;

  return {
    skillId: 'P1-MEA-02',
    questionFamilyId: familyId,
    prompt: askHeavier
      ? `Which is heavier: a ${first} or a ${second}?`
      : `Which is lighter: a ${first} or a ${second}?`,
    answer: askHeavier ? pair.heavy : pair.light,
    answerType: 'choice',
    instructionHint: 'Choose the correct object.',
    solutionText: `The ${pair.heavy} is heavier than the ${pair.light}. ${pair.reason}`,
    diagramSpec: comparisonModelDiagram(2, 1, {
      leftLabel: pair.heavy,
      rightLabel: pair.light,
      mode: 'difference',
      title: 'Compare mass',
    }),
    misconceptionTraps: ['mass_by_size', 'mass_ignores_material'],
  };
}

// --- P1-MEA-03: Compare capacity ---
function generateCompareCapacity(familyId) {
  const isFullEmpty = familyId.endsWith('_002');

  if (isFullEmpty) {
    const level = pick(CAPACITY_LEVELS);
    const container = pick(['cup', 'bottle', 'glass', 'bowl', 'pail', 'jug']);

    return {
      skillId: 'P1-MEA-03',
      questionFamilyId: familyId,
      prompt: `A ${container} has water filled to the very top with no space left. Is the ${container} full, almost full, half full, almost empty, or empty?`,
      answer: 'full',
      answerType: 'choice',
      instructionHint: 'Choose the correct description.',
      solutionText: `The ${container} is full because the water reaches the very top.`,
      diagramSpec: comparisonModelDiagram(10, 10, {
        leftLabel: 'full',
        rightLabel: container,
        mode: 'difference',
        title: `${container} water level`,
      }),
      misconceptionTraps: ['capacity_by_height'],
    };
  }

  const pair = pick(CAPACITY_PAIRS);
  const askMore = Math.random() < 0.5;
  const presentFirst = Math.random() < 0.5;
  const first = presentFirst ? pair.more : pair.less;
  const second = presentFirst ? pair.less : pair.more;
  const firstDesc = presentFirst ? pair.moreDesc : pair.lessDesc;
  const secondDesc = presentFirst ? pair.lessDesc : pair.moreDesc;

  return {
    skillId: 'P1-MEA-03',
    questionFamilyId: familyId,
    prompt: askMore
      ? `A ${first} is ${firstDesc}. A ${second} is ${secondDesc}. Which holds more water?`
      : `A ${first} is ${firstDesc}. A ${second} is ${secondDesc}. Which holds less water?`,
    answer: askMore ? pair.more : pair.less,
    answerType: 'choice',
    instructionHint: 'Choose the correct container.',
    solutionText: `The ${pair.more} holds more water because it is ${pair.moreDesc}. The ${pair.less} holds less water.`,
    diagramSpec: comparisonModelDiagram(2, 1, {
      leftLabel: pair.more,
      rightLabel: pair.less,
      mode: 'difference',
      title: 'Compare capacity',
    }),
    misconceptionTraps: ['capacity_by_height', 'capacity_ignores_width'],
  };
}

// --- P1-MEA-04: Sequence events ---
function generateSequenceEvents(familyId) {
  const isBeforeAfter = familyId.endsWith('_002');

  const sequence = pick(EVENT_SEQUENCES);

  if (isBeforeAfter) {
    const eventIndex = randInt(0, sequence.events.length - 1);
    const targetEvent = sequence.events[eventIndex];
    const askBefore = eventIndex > 0 && (eventIndex === sequence.events.length - 1 || Math.random() < 0.5);

    if (askBefore) {
      const answer = sequence.events[eventIndex - 1];
      return {
        skillId: 'P1-MEA-04',
        questionFamilyId: familyId,
        prompt: `In the ${sequence.period}, you ${targetEvent}. What do you do just before that?`,
        answer,
        answerType: 'choice',
        instructionHint: 'Choose the event that comes before.',
        solutionText: `You ${answer} before you ${targetEvent}.`,
        misconceptionTraps: ['sequence_by_preference'],
      };
    }

    const nextIndex = Math.min(eventIndex + 1, sequence.events.length - 1);
    if (nextIndex === eventIndex) {
      return generateSequenceEvents(familyId);
    }
    const answer = sequence.events[nextIndex];
    return {
      skillId: 'P1-MEA-04',
      questionFamilyId: familyId,
      prompt: `In the ${sequence.period}, you ${targetEvent}. What do you do just after that?`,
      answer,
      answerType: 'choice',
      instructionHint: 'Choose the event that comes after.',
      solutionText: `You ${answer} after you ${targetEvent}.`,
      misconceptionTraps: ['sequence_by_preference'],
    };
  }

  const shuffled = shuffle([...sequence.events]);
  const correctOrder = sequence.events.join(', ');

  return {
    skillId: 'P1-MEA-04',
    questionFamilyId: familyId,
    prompt: `Put these events in the correct order: ${shuffled.join(', ')}.`,
    answer: correctOrder,
    answerType: 'choice',
    instructionHint: 'Arrange the events from first to last.',
    solutionText: `The correct order is: ${correctOrder}. These events happen in the ${sequence.period}.`,
    misconceptionTraps: ['sequence_by_preference', 'sequence_reverses_order'],
  };
}

// --- P1-MEA-05: Tell time to o'clock ---
function generateTimeOClock(familyId) {
  const hour = randInt(1, 12);
  const isReadFromDescription = familyId.endsWith('_001');

  if (isReadFromDescription) {
    return {
      skillId: 'P1-MEA-05',
      questionFamilyId: familyId,
      prompt: `The short hand points to ${hour}. The long hand points to 12. What time is it?`,
      answer: hour,
      answerType: 'number',
      instructionHint: 'Write the hour number.',
      solutionText: `The short hand on ${hour} and the long hand on 12 means it is ${hour} o'clock.`,
      diagramSpec: clockDiagram(hour, 0, { title: `${hour} o'clock` }),
      misconceptionTraps: ['clock_reads_minute_as_hour', 'clock_confuses_hands'],
    };
  }

  return {
    skillId: 'P1-MEA-05',
    questionFamilyId: familyId,
    prompt: `A clock shows ${hour} o'clock. What number does the short hand point to?`,
    answer: hour,
    answerType: 'number',
    instructionHint: 'Write the number.',
    solutionText: `At ${hour} o'clock, the short hand points to ${hour} and the long hand points to 12.`,
    diagramSpec: clockDiagram(hour, 0, { title: `${hour} o'clock` }),
    misconceptionTraps: ['clock_reads_minute_as_hour', 'clock_confuses_hands'],
  };
}

// --- P1-MEA-06: Tell time to half past ---
function generateTimeHalfPast(familyId) {
  const hour = randInt(1, 12);
  const isReadFromDescription = familyId.endsWith('_001');

  if (isReadFromDescription) {
    return {
      skillId: 'P1-MEA-06',
      questionFamilyId: familyId,
      prompt: `The short hand is between ${hour} and ${hour === 12 ? 1 : hour + 1}. The long hand points to 6. What time is it?`,
      answer: `half past ${hour}`,
      answerType: 'choice',
      instructionHint: 'Choose the correct time.',
      solutionText: `The short hand between ${hour} and ${hour === 12 ? 1 : hour + 1} with the long hand on 6 means it is half past ${hour} (${hour}:30).`,
      diagramSpec: clockDiagram(hour, 30, { title: `Half past ${hour}` }),
      misconceptionTraps: ['half_past_reads_wrong_hour', 'half_past_writes_06'],
    };
  }

  return {
    skillId: 'P1-MEA-06',
    questionFamilyId: familyId,
    prompt: `What is half past ${hour} written as a digital time?`,
    answer: `${hour}:30`,
    answerType: 'choice',
    instructionHint: 'Choose the correct digital time.',
    solutionText: `Half past ${hour} is written as ${hour}:30. The long hand on 6 means 30 minutes, not 6 minutes.`,
    diagramSpec: clockDiagram(hour, 30, { title: `Half past ${hour}` }),
    misconceptionTraps: ['half_past_reads_wrong_hour', 'half_past_writes_06'],
  };
}

// --- P1-MEA-07: Use non-standard units ---
function generateNonStandardUnits(familyId) {
  const isPaperClips = familyId.endsWith('_001');
  const unit = isPaperClips ? 'paper clips' : 'cubes';
  const object = pick(MEASURE_OBJECTS);
  const measurement = randInt(4, 12);

  return {
    skillId: 'P1-MEA-07',
    questionFamilyId: familyId,
    prompt: `A ${object} is ${measurement} ${unit} long. How many ${unit} long is the ${object}?`,
    answer: measurement,
    answerType: 'number',
    instructionHint: 'Write the number of units.',
    solutionText: `The ${object} is ${measurement} ${unit} long. Each ${isPaperClips ? 'paper clip' : 'cube'} is placed end to end with no gaps and no overlaps.`,
    diagramSpec: lengthMeasurementDiagram({
      start: 0,
      end: measurement,
      unit,
      objects: [{ label: object, start: 0, end: measurement }],
      title: `${object}: ${measurement} ${unit}`,
    }),
    misconceptionTraps: ['units_gaps_overlaps', 'units_mixed_sizes'],
  };
}

const generatorsBySkill = {
  'P1-MEA-01': generateCompareLength,
  'P1-MEA-02': generateCompareMass,
  'P1-MEA-03': generateCompareCapacity,
  'P1-MEA-04': generateSequenceEvents,
  'P1-MEA-05': generateTimeOClock,
  'P1-MEA-06': generateTimeHalfPast,
  'P1-MEA-07': generateNonStandardUnits,
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
