import { getSkill } from './p2GeoSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p2GeoQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const OBJECT_TO_SOLID = {
  ball: 'sphere',
  can: 'cylinder',
  box: 'cuboid',
  dice: 'cube',
  party_hat: 'cone',
  ice_cream_cone: 'cone',
  globe: 'sphere',
  book: 'cuboid',
  tissue_box: 'cuboid',
};

const OBJECT_LABELS = {
  ball: 'a ball',
  can: 'a tin can',
  box: 'a box',
  dice: 'a dice',
  party_hat: 'a party hat',
  ice_cream_cone: 'an ice-cream cone',
  globe: 'a globe',
  book: 'a book',
  tissue_box: 'a tissue box',
};

const SOLID_NAMES = ['cube', 'cuboid', 'cone', 'cylinder', 'sphere'];

const PROPERTY_DESCRIPTIONS = [
  { description: 'It has 6 faces that are all squares of the same size.', answer: 'cube', traps: ['confuses_cube_cuboid'] },
  { description: 'It has 6 faces. Some faces are rectangles.', answer: 'cuboid', traps: ['confuses_cube_cuboid'] },
  { description: 'It is perfectly round with no flat faces. It can roll in any direction.', answer: 'sphere', traps: ['confuses_2d_3d_names'] },
  { description: 'It has 2 flat circular faces and a curved surface. It can roll in one direction.', answer: 'cylinder', traps: ['confuses_cone_cylinder'] },
  { description: 'It has 1 flat circular face and a curved surface that meets at a point.', answer: 'cone', traps: ['confuses_cone_cylinder'] },
  { description: 'All its edges are the same length and all its faces are the same shape.', answer: 'cube', traps: ['confuses_cube_cuboid'] },
  { description: 'It can roll and slide. It has one flat face and one pointed end.', answer: 'cone', traps: ['confuses_cone_cylinder'] },
  { description: 'It can roll but not slide. It has no flat faces at all.', answer: 'sphere', traps: ['confuses_2d_3d_names'] },
  { description: 'It has two flat circles at each end and can roll like a log.', answer: 'cylinder', traps: ['confuses_cone_cylinder'] },
  { description: 'It has 6 rectangular faces, 12 edges, and 8 corners, but not all edges are the same length.', answer: 'cuboid', traps: ['confuses_cube_cuboid'] },
];

// ---------------------------------------------------------------------------
// P2-GEO-01: Naming 3D Solids
// ---------------------------------------------------------------------------

function generateNamingSolids(familyId) {
  if (familyId.endsWith('_001')) {
    // Everyday object → solid name
    const objectKeys = Object.keys(OBJECT_TO_SOLID);
    const objKey = pick(objectKeys);
    const answer = OBJECT_TO_SOLID[objKey];
    const label = OBJECT_LABELS[objKey];

    // Build MCQ choices — always include all 5 solid names, pick 4 including the answer
    const distractors = SOLID_NAMES.filter((s) => s !== answer);
    const choices = shuffle([answer, ...shuffle(distractors).slice(0, 3)]);

    const traps = [];
    if (answer === 'cube' || answer === 'cuboid') traps.push('confuses_cube_cuboid');
    if (answer === 'sphere') traps.push('confuses_2d_3d_names');
    if (answer === 'cone' || answer === 'cylinder') traps.push('confuses_cone_cylinder');

    return {
      skillId: 'P2-GEO-01',
      questionFamilyId: familyId,
      prompt: `What 3D solid does ${label} look like?`,
      answer,
      answerType: 'choice',
      choices,
      instructionHint: `Think about the shape of ${label}. Is it round? Does it have flat faces?`,
      solutionText: `${label.charAt(0).toUpperCase() + label.slice(1)} is shaped like a ${answer}.`,
      misconceptionTraps: traps,
    };
  }

  // _002: Properties → solid name
  const prop = pick(PROPERTY_DESCRIPTIONS);
  const distractors = SOLID_NAMES.filter((s) => s !== prop.answer);
  const choices = shuffle([prop.answer, ...shuffle(distractors).slice(0, 3)]);

  return {
    skillId: 'P2-GEO-01',
    questionFamilyId: familyId,
    prompt: `${prop.description} What 3D solid is this?`,
    answer: prop.answer,
    answerType: 'choice',
    choices,
    instructionHint: 'Read the clues about faces, edges, and how the shape moves.',
    solutionText: `The shape described is a ${prop.answer}.`,
    misconceptionTraps: prop.traps,
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P2-GEO-01': generateNamingSolids,
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
