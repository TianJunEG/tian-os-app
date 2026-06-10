import { getSkill } from './p3AreaPerimSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p3AreaPerimQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ---------------------------------------------------------------------------
// P3-AP-01: Area of a Rectangle
// ---------------------------------------------------------------------------

function generateArea(familyId) {
  if (familyId.endsWith('_001')) {
    // Rectangle area
    const length = randInt(3, 15);
    let width = randInt(2, 12);
    if (width === length) width = length + 1; // ensure rectangle, not square
    const area = length * width;
    return {
      skillId: 'P3-AP-01',
      questionFamilyId: familyId,
      prompt: `A rectangle has a length of ${length} cm and a width of ${width} cm. What is its area?`,
      answer: area,
      answerType: 'number',
      instructionHint: 'Area = length × width.',
      solutionText: `Area = ${length} × ${width} = ${area} cm².`,
      misconceptionTraps: ['confuses_area_perimeter', 'adds_instead_of_multiplies', 'forgets_square_units'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Square area
    const side = randInt(2, 12);
    const area = side * side;
    return {
      skillId: 'P3-AP-01',
      questionFamilyId: familyId,
      prompt: `A square has sides of ${side} cm. What is its area?`,
      answer: area,
      answerType: 'number',
      instructionHint: 'Area of a square = side × side.',
      solutionText: `Area = ${side} × ${side} = ${area} cm².`,
      misconceptionTraps: ['confuses_area_perimeter', 'forgets_square_units'],
    };
  }

  // _003: Missing side from area
  const knownSide = randInt(2, 12);
  const missingSide = randInt(2, 12);
  const area = knownSide * missingSide;
  const askLength = pick([true, false]);
  const givenLabel = askLength ? 'width' : 'length';
  const missingLabel = askLength ? 'length' : 'width';
  return {
    skillId: 'P3-AP-01',
    questionFamilyId: familyId,
    prompt: `A rectangle has an area of ${area} cm² and a ${givenLabel} of ${knownSide} cm. What is its ${missingLabel}?`,
    answer: missingSide,
    answerType: 'number',
    instructionHint: `${missingLabel} = area ÷ ${givenLabel}.`,
    solutionText: `${missingLabel} = ${area} ÷ ${knownSide} = ${missingSide} cm.`,
    misconceptionTraps: ['confuses_area_perimeter'],
  };
}

// ---------------------------------------------------------------------------
// P3-AP-02: Perimeter of a Rectangle
// ---------------------------------------------------------------------------

function generatePerimeter(familyId) {
  if (familyId.endsWith('_001')) {
    // Rectangle perimeter
    const length = randInt(3, 15);
    let width = randInt(2, 12);
    if (width === length) width = length + 1;
    const perimeter = 2 * (length + width);
    return {
      skillId: 'P3-AP-02',
      questionFamilyId: familyId,
      prompt: `A rectangle has a length of ${length} cm and a width of ${width} cm. What is its perimeter?`,
      answer: perimeter,
      answerType: 'number',
      instructionHint: 'Perimeter = 2 × (length + width).',
      solutionText: `Perimeter = 2 × (${length} + ${width}) = 2 × ${length + width} = ${perimeter} cm.`,
      misconceptionTraps: ['confuses_area_perimeter', 'forgets_two_pairs', 'only_adds_two_sides'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Square perimeter
    const side = randInt(2, 15);
    const perimeter = 4 * side;
    return {
      skillId: 'P3-AP-02',
      questionFamilyId: familyId,
      prompt: `A square has sides of ${side} cm. What is its perimeter?`,
      answer: perimeter,
      answerType: 'number',
      instructionHint: 'Perimeter of a square = 4 × side.',
      solutionText: `Perimeter = 4 × ${side} = ${perimeter} cm.`,
      misconceptionTraps: ['confuses_area_perimeter'],
    };
  }

  // _003: Missing side from perimeter
  const length = randInt(3, 15);
  const width = randInt(2, 12);
  const perimeter = 2 * (length + width);
  const askLength = pick([true, false]);
  const given = askLength ? width : length;
  const missing = askLength ? length : width;
  const givenLabel = askLength ? 'width' : 'length';
  const missingLabel = askLength ? 'length' : 'width';
  return {
    skillId: 'P3-AP-02',
    questionFamilyId: familyId,
    prompt: `A rectangle has a perimeter of ${perimeter} cm and a ${givenLabel} of ${given} cm. What is its ${missingLabel}?`,
    answer: missing,
    answerType: 'number',
    instructionHint: `Half the perimeter = length + width. ${missingLabel} = half perimeter − ${givenLabel}.`,
    solutionText: `Half perimeter = ${perimeter} ÷ 2 = ${perimeter / 2}. ${missingLabel} = ${perimeter / 2} − ${given} = ${missing} cm.`,
    misconceptionTraps: ['forgets_two_pairs'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P3-AP-01': generateArea,
  'P3-AP-02': generatePerimeter,
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
