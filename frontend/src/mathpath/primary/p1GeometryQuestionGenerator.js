import { getSkill } from './p1GeometrySkillGraph.js';
import { getQuestionFamiliesBySkill } from './p1GeometryQuestionFamilies.js';
import {
  pictureCollectionDiagram,
  numberLineDiagram,
} from './p1DiagramHelpers.js';

const SHAPES_2D = ['circle', 'triangle', 'square', 'rectangle'];
const SHAPES_3D = ['cube', 'cuboid', 'sphere', 'cone', 'cylinder'];

const SHAPE_PROPERTIES = {
  circle: { sides: 0, corners: 0, curved: true },
  triangle: { sides: 3, corners: 3, curved: false },
  square: { sides: 4, corners: 4, curved: false },
  rectangle: { sides: 4, corners: 4, curved: false },
};

const SHAPE_3D_DESCRIPTIONS = {
  cube: 'all faces are squares, it has 6 faces',
  cuboid: 'it has 6 rectangular faces and looks like a box',
  sphere: 'it is perfectly round like a ball, no flat faces',
  cone: 'it has a circular base and a pointed top',
  cylinder: 'it has 2 circular faces and a curved surface',
};

const REAL_OBJECTS_2D = {
  circle: ['coin', 'clock face', 'plate'],
  triangle: ['traffic sign', 'sandwich slice', 'hanger'],
  square: ['window', 'tile', 'napkin'],
  rectangle: ['door', 'book', 'whiteboard'],
};

const REAL_OBJECTS_3D = {
  cube: ['dice', 'ice cube', "Rubik's cube"],
  cuboid: ['box', 'brick', 'eraser'],
  sphere: ['ball', 'marble', 'orange'],
  cone: ['ice cream cone', 'party hat', 'traffic cone'],
  cylinder: ['can', 'battery', 'pipe'],
};

const POSITION_WORDS = ['above', 'below', 'beside', 'between', 'left of', 'right of'];

const POSITION_OBJECTS = ['star', 'heart', 'circle', 'square', 'triangle', 'diamond', 'moon', 'sun'];

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

function choiceDistractors(correct, pool, count) {
  const others = pool.filter((item) => item !== correct);
  return shuffle(others).slice(0, count);
}

// --- P1-GEO-01: Identify basic 2D shapes ---
function generateIdentify2D(familyId) {
  const shape = pick(SHAPES_2D);
  const props = SHAPE_PROPERTIES[shape];

  if (familyId.endsWith('_001')) {
    const distractors = choiceDistractors(shape, SHAPES_2D, 3);
    const choices = shuffle([shape, ...distractors]);
    return {
      skillId: 'P1-GEO-01',
      questionFamilyId: familyId,
      prompt: `What is the name of this shape? (A ${shape} is shown.)`,
      answer: shape,
      answerType: 'choice',
      choices,
      instructionHint: 'Choose the correct shape name.',
      solutionText: `This shape is a ${shape}. ${props.curved ? 'It has no straight sides.' : `It has ${props.sides} sides and ${props.corners} corners.`}`,
      diagramSpec: undefined,
      misconceptionTraps: ['shape_orientation_dependence'],
    };
  }

  // Family 002: Count sides or corners
  const askSides = Math.random() < 0.5;
  const answer = askSides ? props.sides : props.corners;
  const property = askSides ? 'sides' : 'corners';
  return {
    skillId: 'P1-GEO-01',
    questionFamilyId: familyId,
    prompt: `How many ${property} does a ${shape} have?`,
    answer,
    answerType: 'number',
    instructionHint: 'Write your answer in numerals.',
    solutionText: `A ${shape} has ${answer} ${property}.`,
    diagramSpec: undefined,
    misconceptionTraps: ['shape_orientation_dependence'],
  };
}

// --- P1-GEO-02: Identify basic 3D objects ---
function generateIdentify3D(familyId) {
  const object = pick(SHAPES_3D);

  if (familyId.endsWith('_001')) {
    const distractors = choiceDistractors(object, SHAPES_3D, 3);
    const choices = shuffle([object, ...distractors]);
    return {
      skillId: 'P1-GEO-02',
      questionFamilyId: familyId,
      prompt: `What is the name of this 3D object? (A ${object} is shown.)`,
      answer: object,
      answerType: 'choice',
      choices,
      instructionHint: 'Choose the correct 3D object name.',
      solutionText: `This 3D object is a ${object}. ${SHAPE_3D_DESCRIPTIONS[object]}.`,
      diagramSpec: undefined,
      misconceptionTraps: ['confuses_2d_3d'],
    };
  }

  // Family 002: Match 3D object to description
  const description = SHAPE_3D_DESCRIPTIONS[object];
  const distractors = choiceDistractors(object, SHAPES_3D, 3);
  const choices = shuffle([object, ...distractors]);
  return {
    skillId: 'P1-GEO-02',
    questionFamilyId: familyId,
    prompt: `Which 3D object has this description: ${description}?`,
    answer: object,
    answerType: 'choice',
    choices,
    instructionHint: 'Choose the correct 3D object.',
    solutionText: `The answer is ${object}. A ${object}: ${description}.`,
    diagramSpec: undefined,
    misconceptionTraps: ['confuses_2d_3d'],
  };
}

// --- P1-GEO-03: Sort shapes by properties ---
function generateSortShapes(familyId) {
  if (familyId.endsWith('_001')) {
    // Sort by number of sides
    const targetSides = pick([0, 3, 4]);
    const matching = SHAPES_2D.filter((s) => SHAPE_PROPERTIES[s].sides === targetSides);
    const answer = matching.join(', ');
    const choices = shuffle(SHAPES_2D);
    const label = targetSides === 0 ? 'no sides (curved)' : `${targetSides} sides`;
    return {
      skillId: 'P1-GEO-03',
      questionFamilyId: familyId,
      prompt: `Which of these shapes have ${label}? ${choices.join(', ')}`,
      answer,
      answerType: 'choice',
      choices,
      instructionHint: 'Choose all shapes that match.',
      solutionText: `Shapes with ${label}: ${answer}.`,
      diagramSpec: pictureCollectionDiagram(
        choices.map((s) => ({ label: s, count: 1 })),
        { title: `Sort shapes: ${label}` }
      ),
      misconceptionTraps: ['sorts_by_appearance_not_property'],
    };
  }

  // Family 002: Sort by curved/straight
  const askCurved = Math.random() < 0.5;
  const matching = SHAPES_2D.filter((s) => SHAPE_PROPERTIES[s].curved === askCurved);
  const answer = matching.join(', ');
  const choices = shuffle(SHAPES_2D);
  const edgeType = askCurved ? 'curved edges' : 'straight edges';
  return {
    skillId: 'P1-GEO-03',
    questionFamilyId: familyId,
    prompt: `Which of these shapes have ${edgeType}? ${choices.join(', ')}`,
    answer,
    answerType: 'choice',
    choices,
    instructionHint: 'Choose all shapes that match.',
    solutionText: `Shapes with ${edgeType}: ${answer}.`,
    diagramSpec: pictureCollectionDiagram(
      choices.map((s) => ({ label: s, count: 1 })),
      { title: `Sort shapes: ${edgeType}` }
    ),
    misconceptionTraps: ['sorts_by_appearance_not_property'],
  };
}

// --- P1-GEO-04: Continue shape patterns ---
function generateContinuePattern(familyId) {
  if (familyId.endsWith('_001')) {
    // AB pattern
    const available = shuffle(SHAPES_2D);
    const a = available[0];
    const b = available[1];
    const repeats = randInt(2, 3);
    const pattern = [];
    for (let i = 0; i < repeats; i++) {
      pattern.push(a, b);
    }
    const answer = a;
    const distractors = choiceDistractors(answer, SHAPES_2D, 3);
    const choices = shuffle([answer, ...distractors]);
    return {
      skillId: 'P1-GEO-04',
      questionFamilyId: familyId,
      prompt: `What comes next? ${pattern.join(', ')}, ___?`,
      answer,
      answerType: 'choice',
      choices,
      instructionHint: 'Choose the shape that continues the pattern.',
      solutionText: `The pattern repeats: ${a}, ${b}. The next shape is ${answer}.`,
      diagramSpec: undefined,
      misconceptionTraps: ['pattern_looks_only_at_last'],
    };
  }

  // Family 002: ABC pattern
  const available = shuffle(SHAPES_2D);
  const a = available[0];
  const b = available[1];
  const c = available[2];
  const repeats = randInt(2, 3);
  const pattern = [];
  for (let i = 0; i < repeats; i++) {
    pattern.push(a, b, c);
  }
  const answer = a;
  const distractors = choiceDistractors(answer, SHAPES_2D, 3);
  const choices = shuffle([answer, ...distractors]);
  return {
    skillId: 'P1-GEO-04',
    questionFamilyId: familyId,
    prompt: `What comes next? ${pattern.join(', ')}, ___?`,
    answer,
    answerType: 'choice',
    choices,
    instructionHint: 'Choose the shape that continues the pattern.',
    solutionText: `The pattern repeats: ${a}, ${b}, ${c}. The next shape is ${answer}.`,
    diagramSpec: undefined,
    misconceptionTraps: ['pattern_looks_only_at_last'],
  };
}

// --- P1-GEO-05: Create simple repeating patterns ---
function generateCreatePattern(familyId) {
  if (familyId.endsWith('_001')) {
    // AB pattern - choose next
    const available = shuffle(SHAPES_2D);
    const a = available[0];
    const b = available[1];
    const shown = [a, b, a, b, a];
    const answer = b;
    const distractors = choiceDistractors(answer, SHAPES_2D, 3);
    const choices = shuffle([answer, ...distractors]);
    return {
      skillId: 'P1-GEO-05',
      questionFamilyId: familyId,
      prompt: `Continue the AB pattern: ${shown.join(', ')}, ___?`,
      answer,
      answerType: 'choice',
      choices,
      instructionHint: 'Choose the shape that keeps the pattern going.',
      solutionText: `The AB pattern is: ${a}, ${b} repeating. The next shape is ${answer}.`,
      diagramSpec: undefined,
      misconceptionTraps: ['pattern_random_sequence'],
    };
  }

  // Family 002: ABB pattern - choose next
  const available = shuffle(SHAPES_2D);
  const a = available[0];
  const b = available[1];
  // Determine position in the ABB cycle to decide answer
  const shown = [a, b, b, a, b, b, a];
  const answer = b;
  const distractors = choiceDistractors(answer, SHAPES_2D, 3);
  const choices = shuffle([answer, ...distractors]);
  return {
    skillId: 'P1-GEO-05',
    questionFamilyId: familyId,
    prompt: `Continue the ABB pattern: ${shown.join(', ')}, ___?`,
    answer,
    answerType: 'choice',
    choices,
    instructionHint: 'Choose the shape that keeps the pattern going.',
    solutionText: `The ABB pattern is: ${a}, ${b}, ${b} repeating. The next shape is ${answer}.`,
    diagramSpec: undefined,
    misconceptionTraps: ['pattern_random_sequence'],
  };
}

// --- P1-GEO-06: Use position words ---
function generatePositionWords(familyId) {
  const objects = shuffle(POSITION_OBJECTS).slice(0, 3);

  if (familyId.endsWith('_001')) {
    // Above/Below
    const positionWord = pick(['above', 'below']);
    const topObj = objects[0];
    const bottomObj = objects[1];
    const answer = positionWord === 'above' ? topObj : bottomObj;
    const distractors = choiceDistractors(answer, objects, 2);
    const choices = shuffle([answer, ...distractors]);
    return {
      skillId: 'P1-GEO-06',
      questionFamilyId: familyId,
      prompt: `The ${topObj} is on top. The ${bottomObj} is at the bottom. Which object is ${positionWord}?`,
      answer,
      answerType: 'choice',
      choices,
      instructionHint: 'Choose the correct object.',
      solutionText: `The ${answer} is ${positionWord}. "${positionWord === 'above' ? 'Above' : 'Below'}" means ${positionWord === 'above' ? 'higher up' : 'lower down'}.`,
      diagramSpec: undefined,
      misconceptionTraps: ['confuses_between_beside'],
    };
  }

  // Family 002: Left/Right/Between
  const leftObj = objects[0];
  const middleObj = objects[1];
  const rightObj = objects[2];
  const positionType = pick(['left of', 'right of', 'between']);

  let answer, prompt;
  if (positionType === 'between') {
    answer = middleObj;
    prompt = `The objects are in a row: ${leftObj}, ${middleObj}, ${rightObj}. Which object is between the ${leftObj} and the ${rightObj}?`;
  } else if (positionType === 'left of') {
    answer = leftObj;
    prompt = `The objects are in a row: ${leftObj}, ${middleObj}, ${rightObj}. Which object is to the left of the ${middleObj}?`;
  } else {
    answer = rightObj;
    prompt = `The objects are in a row: ${leftObj}, ${middleObj}, ${rightObj}. Which object is to the right of the ${middleObj}?`;
  }

  const distractors = choiceDistractors(answer, objects, 2);
  const choices = shuffle([answer, ...distractors]);
  return {
    skillId: 'P1-GEO-06',
    questionFamilyId: familyId,
    prompt,
    answer,
    answerType: 'choice',
    choices,
    instructionHint: 'Choose the correct object.',
    solutionText: `The ${answer} is ${positionType} ${positionType === 'between' ? `the ${leftObj} and the ${rightObj}` : `the ${middleObj}`}.`,
    diagramSpec: numberLineDiagram({
      start: 1,
      end: 3,
      step: 1,
      points: [
        { value: 1, label: leftObj },
        { value: 2, label: middleObj },
        { value: 3, label: rightObj },
      ],
      title: 'Objects in a row',
    }),
    misconceptionTraps: positionType === 'between'
      ? ['confuses_between_beside']
      : ['confuses_left_right'],
  };
}

// --- P1-GEO-07: Match real objects to shapes ---
function generateMatchRealObject(familyId) {
  if (familyId.endsWith('_001')) {
    // Match to 2D shape
    const shape = pick(SHAPES_2D);
    const realObject = pick(REAL_OBJECTS_2D[shape]);
    const distractors = choiceDistractors(shape, SHAPES_2D, 3);
    const choices = shuffle([shape, ...distractors]);
    return {
      skillId: 'P1-GEO-07',
      questionFamilyId: familyId,
      prompt: `A ${realObject} looks most like which shape?`,
      answer: shape,
      answerType: 'choice',
      choices,
      instructionHint: 'Choose the shape that matches.',
      solutionText: `A ${realObject} is shaped like a ${shape}.`,
      diagramSpec: undefined,
      misconceptionTraps: ['matches_by_colour_or_use'],
    };
  }

  // Family 002: Match to 3D object
  const object = pick(SHAPES_3D);
  const realObject = pick(REAL_OBJECTS_3D[object]);
  const distractors = choiceDistractors(object, SHAPES_3D, 3);
  const choices = shuffle([object, ...distractors]);
  return {
    skillId: 'P1-GEO-07',
    questionFamilyId: familyId,
    prompt: `A ${realObject} is most like which 3D object?`,
    answer: object,
    answerType: 'choice',
    choices,
    instructionHint: 'Choose the 3D object that matches.',
    solutionText: `A ${realObject} is shaped like a ${object}.`,
    diagramSpec: undefined,
    misconceptionTraps: ['matches_by_colour_or_use'],
  };
}

const generatorsBySkill = {
  'P1-GEO-01': generateIdentify2D,
  'P1-GEO-02': generateIdentify3D,
  'P1-GEO-03': generateSortShapes,
  'P1-GEO-04': generateContinuePattern,
  'P1-GEO-05': generateCreatePattern,
  'P1-GEO-06': generatePositionWords,
  'P1-GEO-07': generateMatchRealObject,
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
