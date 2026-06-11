import { getSkill } from './p5AreaVolSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p5AreaVolQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randEven(min, max) { const v = randInt(Math.ceil(min / 2), Math.floor(max / 2)); return v * 2; }

function generateTriangleArea(familyId) {
  if (familyId.endsWith('_001')) {
    const base = randEven(4, 20);
    const height = randInt(3, 15);
    const area = (base * height) / 2;
    return {
      skillId: 'P5-AV-01', questionFamilyId: familyId,
      prompt: `A triangle has a base of ${base} cm and a height of ${height} cm. What is its area in cm²?`,
      answer: area, answerType: 'number',
      instructionHint: 'Area of triangle = 1/2 × base × height.',
      solutionText: `Area = 1/2 × ${base} × ${height} = ${base * height} ÷ 2 = ${area} cm².`,
      misconceptionTraps: ['forgets_half_for_triangle_area', 'confuses_base_and_height'],
    };
  }
  if (familyId.endsWith('_002')) {
    const base = randEven(4, 16);
    const height = randInt(3, 12);
    const area = (base * height) / 2;
    const findBase = Math.random() < 0.5;
    if (findBase) {
      return {
        skillId: 'P5-AV-01', questionFamilyId: familyId,
        prompt: `A triangle has an area of ${area} cm² and a height of ${height} cm. What is its base in cm?`,
        answer: base, answerType: 'number',
        instructionHint: 'Rearrange: base = (2 × area) ÷ height.',
        solutionText: `base = (2 × ${area}) ÷ ${height} = ${2 * area} ÷ ${height} = ${base} cm.`,
        misconceptionTraps: ['forgets_half_for_triangle_area'],
      };
    }
    return {
      skillId: 'P5-AV-01', questionFamilyId: familyId,
      prompt: `A triangle has an area of ${area} cm² and a base of ${base} cm. What is its height in cm?`,
      answer: height, answerType: 'number',
      instructionHint: 'Rearrange: height = (2 × area) ÷ base.',
      solutionText: `height = (2 × ${area}) ÷ ${base} = ${2 * area} ÷ ${base} = ${height} cm.`,
      misconceptionTraps: ['forgets_half_for_triangle_area'],
    };
  }
  // _003: right-triangle area
  const sideA = randEven(4, 18);
  const sideB = randInt(3, 14);
  const area = (sideA * sideB) / 2;
  return {
    skillId: 'P5-AV-01', questionFamilyId: familyId,
    prompt: `A right-angled triangle has perpendicular sides of ${sideA} cm and ${sideB} cm. What is its area in cm²?`,
    answer: area, answerType: 'number',
    instructionHint: 'For a right-angled triangle, the two perpendicular sides are the base and height. Area = 1/2 × base × height.',
    solutionText: `Area = 1/2 × ${sideA} × ${sideB} = ${sideA * sideB} ÷ 2 = ${area} cm².`,
    misconceptionTraps: ['forgets_half_for_triangle_area', 'confuses_area_and_perimeter'],
  };
}

function generateVolume(familyId) {
  if (familyId.endsWith('_001')) {
    const l = randInt(3, 12);
    const w = randInt(2, 10);
    const h = randInt(2, 8);
    const vol = l * w * h;
    return {
      skillId: 'P5-AV-02', questionFamilyId: familyId,
      prompt: `A cuboid has length ${l} cm, width ${w} cm and height ${h} cm. What is its volume in cm³?`,
      answer: vol, answerType: 'number',
      instructionHint: 'Volume of cuboid = length × width × height.',
      solutionText: `Volume = ${l} × ${w} × ${h} = ${vol} cm³.`,
      misconceptionTraps: ['uses_wrong_volume_formula', 'adds_dimensions_instead_of_multiplying'],
    };
  }
  if (familyId.endsWith('_002')) {
    const s = randInt(2, 9);
    const vol = s * s * s;
    return {
      skillId: 'P5-AV-02', questionFamilyId: familyId,
      prompt: `A cube has sides of ${s} cm. What is its volume in cm³?`,
      answer: vol, answerType: 'number',
      instructionHint: 'Volume of cube = side × side × side = side³.',
      solutionText: `Volume = ${s}³ = ${s} × ${s} × ${s} = ${vol} cm³.`,
      misconceptionTraps: ['uses_wrong_volume_formula'],
    };
  }
  // _003: find missing dimension
  const l = randInt(3, 10);
  const w = randInt(2, 8);
  const h = randInt(2, 7);
  const vol = l * w * h;
  const missingChoice = randInt(0, 2);
  if (missingChoice === 0) {
    return {
      skillId: 'P5-AV-02', questionFamilyId: familyId,
      prompt: `A cuboid has a volume of ${vol} cm³, a width of ${w} cm and a height of ${h} cm. What is its length in cm?`,
      answer: l, answerType: 'number',
      instructionHint: 'length = volume ÷ (width × height).',
      solutionText: `length = ${vol} ÷ (${w} × ${h}) = ${vol} ÷ ${w * h} = ${l} cm.`,
      misconceptionTraps: ['uses_wrong_volume_formula', 'adds_dimensions_instead_of_multiplying'],
    };
  }
  if (missingChoice === 1) {
    return {
      skillId: 'P5-AV-02', questionFamilyId: familyId,
      prompt: `A cuboid has a volume of ${vol} cm³, a length of ${l} cm and a height of ${h} cm. What is its width in cm?`,
      answer: w, answerType: 'number',
      instructionHint: 'width = volume ÷ (length × height).',
      solutionText: `width = ${vol} ÷ (${l} × ${h}) = ${vol} ÷ ${l * h} = ${w} cm.`,
      misconceptionTraps: ['uses_wrong_volume_formula', 'adds_dimensions_instead_of_multiplying'],
    };
  }
  return {
    skillId: 'P5-AV-02', questionFamilyId: familyId,
    prompt: `A cuboid has a volume of ${vol} cm³, a length of ${l} cm and a width of ${w} cm. What is its height in cm?`,
    answer: h, answerType: 'number',
    instructionHint: 'height = volume ÷ (length × width).',
    solutionText: `height = ${vol} ÷ (${l} × ${w}) = ${vol} ÷ ${l * w} = ${h} cm.`,
    misconceptionTraps: ['uses_wrong_volume_formula', 'adds_dimensions_instead_of_multiplying'],
  };
}

function generateComposite(familyId) {
  if (familyId.endsWith('_001')) {
    // L-shaped figure: large rectangle with a smaller rectangle attached
    const w1 = randInt(4, 10);
    const h1 = randInt(5, 12);
    const w2 = randInt(3, 8);
    const h2 = randInt(3, 7);
    const area = w1 * h1 + w2 * h2;
    return {
      skillId: 'P5-AV-03', questionFamilyId: familyId,
      prompt: `An L-shaped figure is made of two rectangles. Rectangle A is ${w1} cm by ${h1} cm. Rectangle B is ${w2} cm by ${h2} cm. What is the total area of the figure in cm²?`,
      answer: area, answerType: 'number',
      instructionHint: 'Split into two rectangles, find each area, then add.',
      solutionText: `Area A = ${w1} × ${h1} = ${w1 * h1} cm². Area B = ${w2} × ${h2} = ${w2 * h2} cm². Total = ${w1 * h1} + ${w2 * h2} = ${area} cm².`,
      misconceptionTraps: ['confuses_area_and_perimeter'],
    };
  }
  if (familyId.endsWith('_002')) {
    // Rectangle with triangle cut out
    const rw = randInt(8, 16);
    const rh = randInt(6, 12);
    const tb = randEven(4, Math.min(rw - 2, 12));
    const th = randInt(2, Math.min(rh - 2, 8));
    const rectArea = rw * rh;
    const triArea = (tb * th) / 2;
    const answer = rectArea - triArea;
    return {
      skillId: 'P5-AV-03', questionFamilyId: familyId,
      prompt: `A rectangle is ${rw} cm by ${rh} cm. A triangle with base ${tb} cm and height ${th} cm is cut out from it. What is the remaining area in cm²?`,
      answer, answerType: 'number',
      instructionHint: 'Find the rectangle area, then subtract the triangle area (1/2 × base × height).',
      solutionText: `Rectangle area = ${rw} × ${rh} = ${rectArea} cm². Triangle area = 1/2 × ${tb} × ${th} = ${triArea} cm². Remaining = ${rectArea} − ${triArea} = ${answer} cm².`,
      misconceptionTraps: ['forgets_half_for_triangle_area', 'confuses_area_and_perimeter'],
    };
  }
  // _003: two joined cuboids total volume
  const l1 = randInt(3, 10);
  const w1 = randInt(2, 8);
  const h1 = randInt(2, 6);
  const l2 = randInt(3, 9);
  const w2 = randInt(2, 7);
  const h2 = randInt(2, 6);
  const vol1 = l1 * w1 * h1;
  const vol2 = l2 * w2 * h2;
  const answer = vol1 + vol2;
  return {
    skillId: 'P5-AV-03', questionFamilyId: familyId,
    prompt: `Two cuboids are joined together. Cuboid A is ${l1} cm × ${w1} cm × ${h1} cm. Cuboid B is ${l2} cm × ${w2} cm × ${h2} cm. What is the total volume in cm³?`,
    answer, answerType: 'number',
    instructionHint: 'Find the volume of each cuboid, then add them together.',
    solutionText: `Volume A = ${l1} × ${w1} × ${h1} = ${vol1} cm³. Volume B = ${l2} × ${w2} × ${h2} = ${vol2} cm³. Total = ${vol1} + ${vol2} = ${answer} cm³.`,
    misconceptionTraps: ['uses_wrong_volume_formula', 'adds_dimensions_instead_of_multiplying'],
  };
}

const generatorsBySkill = { 'P5-AV-01': generateTriangleArea, 'P5-AV-02': generateVolume, 'P5-AV-03': generateComposite };

export function generateQuestion(skillId, options = {}) {
  const skill = getSkill(skillId);
  if (!skill) return null;
  const families = getQuestionFamiliesBySkill(skillId);
  if (!families.length) return null;
  const family = options.questionFamilyId ? families.find((f) => f.id === options.questionFamilyId) || pick(families) : pick(families);
  const generator = generatorsBySkill[skillId];
  if (!generator) return null;
  const question = generator(family.id);
  return { ...question, questionId: `${family.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, difficulty: family.difficulty, fluencyTargetSeconds: family.fluencyTargetSeconds, visualRequirement: family.visualRequirement || skill.visual };
}

export function generateQuestionSet(skillId, count = 5, options = {}) {
  const questions = [];
  for (let i = 0; i < count; i++) { const q = generateQuestion(skillId, options); if (q) questions.push(q); }
  return questions;
}
export function generateDiagnosticSet(skillIds, questionsPerSkill = 3) {
  const questions = [];
  for (const skillId of skillIds) { questions.push(...generateQuestionSet(skillId, questionsPerSkill)); }
  return questions;
}
export function getSupportedSkillIds() { return Object.keys(generatorsBySkill); }
export default { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds };
