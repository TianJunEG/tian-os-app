import { getSkill } from './p6AreaVolSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p6AreaVolQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ---------------------------------------------------------------------------
// GCD helper for fraction simplification
// ---------------------------------------------------------------------------
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

// ---------------------------------------------------------------------------
// P6-AV-01: Area of Composite Figures
// ---------------------------------------------------------------------------

function generateCompositeArea(familyId) {
  if (familyId.endsWith('_001')) {
    // L-shape: outer rectangle with a rectangular cut-out from one corner
    const outerL = randInt(10, 20);
    const outerW = randInt(8, 16);
    // Cut-out must be strictly smaller than outer on both dims
    const cutL = randInt(2, outerL - 3);
    const cutW = randInt(2, outerW - 3);
    const area = outerL * outerW - cutL * cutW;
    const corner = pick(['top-right', 'top-left', 'bottom-right', 'bottom-left']);
    return {
      skillId: 'P6-AV-01',
      questionFamilyId: familyId,
      prompt: `An L-shaped figure has outer dimensions ${outerL} cm by ${outerW} cm. A ${cutL} cm by ${cutW} cm rectangle is cut from the ${corner} corner. Find the area of the figure.`,
      answer: area,
      answerType: 'number',
      unit: 'cm²',
      instructionHint: 'Area of L-shape = area of outer rectangle − area of cut-out.',
      solutionText: `Outer area = ${outerL} × ${outerW} = ${outerL * outerW} cm². Cut-out area = ${cutL} × ${cutW} = ${cutL * cutW} cm². Area of figure = ${outerL * outerW} − ${cutL * cutW} = ${area} cm².`,
      misconceptionTraps: ['confuses_area_perimeter', 'forgets_subtract_cutout'],
    };
  }

  if (familyId.endsWith('_002')) {
    // T-shape: two rectangles joined (a top bar and a vertical stem)
    const topL = randInt(10, 20);
    const topW = randInt(2, 5);
    const stemW = randInt(2, topL - 3); // stem narrower than top bar
    const stemH = randInt(4, 10);
    const area = topL * topW + stemW * stemH;
    return {
      skillId: 'P6-AV-01',
      questionFamilyId: familyId,
      prompt: `A T-shaped figure is formed by two rectangles. The top bar is ${topL} cm long and ${topW} cm wide. The vertical stem below it is ${stemW} cm wide and ${stemH} cm tall. Find the total area of the figure.`,
      answer: area,
      answerType: 'number',
      unit: 'cm²',
      instructionHint: 'Split the T-shape into two rectangles and add their areas.',
      solutionText: `Top bar area = ${topL} × ${topW} = ${topL * topW} cm². Stem area = ${stemW} × ${stemH} = ${stemW * stemH} cm². Total area = ${topL * topW} + ${stemW * stemH} = ${area} cm².`,
      misconceptionTraps: ['uses_wrong_dimensions_for_composite', 'forgets_subtract_cutout'],
    };
  }

  // _003: Rectangle plus right triangle
  const rectL = randInt(6, 15);
  const rectW = randInt(4, 10);
  // Triangle base sits on one side of the rectangle; height extends outward
  // Use even triangle height to guarantee integer area (base * height / 2)
  const triBase = rectW; // triangle base = rectangle width (attached along that side)
  const triHeight = randInt(2, 8) * 2; // even number for clean division
  const rectArea = rectL * rectW;
  const triArea = (triBase * triHeight) / 2;
  const area = rectArea + triArea;
  const side = pick(['left', 'right']);
  return {
    skillId: 'P6-AV-01',
    questionFamilyId: familyId,
    prompt: `A figure is made of a rectangle ${rectL} cm by ${rectW} cm with a right triangle attached to its ${side} side. The triangle has a base of ${triBase} cm and a height of ${triHeight} cm. Find the total area of the figure.`,
    answer: area,
    answerType: 'number',
    unit: 'cm²',
    instructionHint: 'Total area = area of rectangle + area of triangle. Triangle area = ½ × base × height.',
    solutionText: `Rectangle area = ${rectL} × ${rectW} = ${rectArea} cm². Triangle area = ½ × ${triBase} × ${triHeight} = ${triArea} cm². Total area = ${rectArea} + ${triArea} = ${area} cm².`,
    misconceptionTraps: ['confuses_area_perimeter', 'uses_wrong_dimensions_for_composite'],
  };
}

// ---------------------------------------------------------------------------
// P6-AV-02: Volume of Cubes & Cuboids
// ---------------------------------------------------------------------------

function generateVolume(familyId) {
  if (familyId.endsWith('_001')) {
    // Volume of a cuboid
    const l = randInt(3, 15);
    const w = randInt(3, 12);
    const h = randInt(3, 10);
    const volume = l * w * h;
    return {
      skillId: 'P6-AV-02',
      questionFamilyId: familyId,
      prompt: `A cuboid has a length of ${l} cm, a width of ${w} cm, and a height of ${h} cm. Find its volume.`,
      answer: volume,
      answerType: 'number',
      unit: 'cm³',
      instructionHint: 'Volume = length × width × height.',
      solutionText: `Volume = ${l} × ${w} × ${h} = ${volume} cm³.`,
      misconceptionTraps: ['volume_uses_area_formula'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Missing dimension from volume
    const l = randInt(3, 12);
    const w = randInt(3, 10);
    const h = randInt(2, 10);
    const volume = l * w * h;
    const missingDim = pick(['length', 'width', 'height']);
    let givenA, givenB, labelA, labelB, missingVal;
    if (missingDim === 'length') {
      givenA = w; givenB = h; labelA = 'width'; labelB = 'height'; missingVal = l;
    } else if (missingDim === 'width') {
      givenA = l; givenB = h; labelA = 'length'; labelB = 'height'; missingVal = w;
    } else {
      givenA = l; givenB = w; labelA = 'length'; labelB = 'width'; missingVal = h;
    }
    return {
      skillId: 'P6-AV-02',
      questionFamilyId: familyId,
      prompt: `A cuboid has a volume of ${volume} cm³. Its ${labelA} is ${givenA} cm and its ${labelB} is ${givenB} cm. Find its ${missingDim}.`,
      answer: missingVal,
      answerType: 'number',
      unit: 'cm',
      instructionHint: `${missingDim} = volume ÷ (${labelA} × ${labelB}).`,
      solutionText: `${labelA} × ${labelB} = ${givenA} × ${givenB} = ${givenA * givenB}. ${missingDim} = ${volume} ÷ ${givenA * givenB} = ${missingVal} cm.`,
      misconceptionTraps: ['wrong_dimension_for_missing_side', 'volume_uses_area_formula'],
    };
  }

  // _003: Composite solid — two cuboids joined
  const l1 = randInt(3, 10);
  const w1 = randInt(3, 8);
  const h1 = randInt(3, 8);
  const l2 = randInt(3, 10);
  const w2 = randInt(3, 8);
  const h2 = randInt(3, 8);
  const vol1 = l1 * w1 * h1;
  const vol2 = l2 * w2 * h2;
  const total = vol1 + vol2;
  return {
    skillId: 'P6-AV-02',
    questionFamilyId: familyId,
    prompt: `A solid is formed by joining two cuboids. Cuboid A is ${l1} cm by ${w1} cm by ${h1} cm. Cuboid B is ${l2} cm by ${w2} cm by ${h2} cm. Find the total volume of the solid.`,
    answer: total,
    answerType: 'number',
    unit: 'cm³',
    instructionHint: 'Total volume = volume of Cuboid A + volume of Cuboid B.',
    solutionText: `Volume of A = ${l1} × ${w1} × ${h1} = ${vol1} cm³. Volume of B = ${l2} × ${w2} × ${h2} = ${vol2} cm³. Total = ${vol1} + ${vol2} = ${total} cm³.`,
    misconceptionTraps: ['adds_volumes_incorrectly', 'volume_uses_area_formula'],
  };
}

// ---------------------------------------------------------------------------
// P6-AV-03: Volume & Water Problems
// ---------------------------------------------------------------------------

function generateWater(familyId) {
  if (familyId.endsWith('_001')) {
    // Water level rise when cube submerged
    // We need cubeVol / (tankL * tankW) to be a positive integer
    // Strategy: pick tankL, tankW, then pick cubeEdge such that edge^3 is divisible by (tankL * tankW)
    // Simpler: pick rise first, then derive
    const tankL = randInt(10, 25);
    const tankW = randInt(8, 20);
    const rise = randInt(1, 5);
    const cubeVol = rise * tankL * tankW;
    // cube edge must be a whole number, and cubeVol = edge^3
    // Instead: use a metal block (cuboid) so we can freely set the volume
    const blockL = randInt(2, 8);
    const blockW = randInt(2, 8);
    const blockH = rise * tankL * tankW / (blockL * blockW);
    // That might not be integer, so let's use a different approach:
    // Pick rise, tankL, tankW. Object volume = rise * tankL * tankW. Present object as "a metal block with volume V cm³"
    const objectVol = rise * tankL * tankW;
    const tankH = randInt(Math.max(rise + 5, 15), 30); // tall enough
    const waterDepth = randInt(5, tankH - rise - 2); // water must leave room for rise
    return {
      skillId: 'P6-AV-03',
      questionFamilyId: familyId,
      prompt: `A rectangular tank is ${tankL} cm long and ${tankW} cm wide. It contains water to a depth of ${waterDepth} cm. A metal block with a volume of ${objectVol} cm³ is fully submerged in the water. Find the rise in the water level.`,
      answer: rise,
      answerType: 'number',
      unit: 'cm',
      instructionHint: 'Rise in water level = volume of object ÷ (length × width of tank).',
      solutionText: `Base area of tank = ${tankL} × ${tankW} = ${tankL * tankW} cm². Rise = ${objectVol} ÷ ${tankL * tankW} = ${rise} cm.`,
      misconceptionTraps: ['water_rise_uses_total_volume', 'forgets_object_displaces_water'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Volume of water in tank
    const l = randInt(10, 25);
    const w = randInt(8, 20);
    const waterH = randInt(3, 15);
    const waterVol = l * w * waterH;
    return {
      skillId: 'P6-AV-03',
      questionFamilyId: familyId,
      prompt: `A rectangular tank is ${l} cm long and ${w} cm wide. Water fills the tank to a height of ${waterH} cm. Find the volume of water in the tank.`,
      answer: waterVol,
      answerType: 'number',
      unit: 'cm³',
      instructionHint: 'Volume of water = length × width × water height.',
      solutionText: `Volume of water = ${l} × ${w} × ${waterH} = ${waterVol} cm³.`,
      misconceptionTraps: ['volume_uses_area_formula'],
    };
  }

  // _003: Fraction of container filled — answer as percentage (whole number)
  // Pick tank height and water height such that waterH/tankH simplifies to a clean fraction
  // and the volume of water is a clean number. We express the answer as volume of water.
  // Actually the spec says answerType:'number' and all answers positive integers.
  // Let's ask: "Water fills the tank to H cm. The tank height is T cm. What volume of water is in the tank?"
  // Or better: "What is the volume of water needed to fill the remaining space?"
  // Let's do: volume of empty space remaining.
  const l = randInt(10, 20);
  const w = randInt(8, 15);
  const tankH = randInt(12, 25);
  const waterH = randInt(3, tankH - 3);
  const emptyH = tankH - waterH;
  const emptyVol = l * w * emptyH;
  return {
    skillId: 'P6-AV-03',
    questionFamilyId: familyId,
    prompt: `A rectangular tank is ${l} cm long, ${w} cm wide, and ${tankH} cm tall. Water fills the tank to a height of ${waterH} cm. Find the volume of water needed to fill the tank completely.`,
    answer: emptyVol,
    answerType: 'number',
    unit: 'cm³',
    instructionHint: 'Empty height = tank height − water height. Volume needed = length × width × empty height.',
    solutionText: `Empty height = ${tankH} − ${waterH} = ${emptyH} cm. Volume needed = ${l} × ${w} × ${emptyH} = ${emptyVol} cm³.`,
    misconceptionTraps: ['water_rise_uses_total_volume', 'forgets_object_displaces_water'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P6-AV-01': generateCompositeArea,
  'P6-AV-02': generateVolume,
  'P6-AV-03': generateWater,
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
  for (let i = 0; i < count; i++) {
    const q = generateQuestion(skillId, options);
    if (q) questions.push(q);
  }
  return questions;
}

export function generateDiagnosticSet(skillIds, questionsPerSkill = 3) {
  const questions = [];
  for (const skillId of skillIds) {
    questions.push(...generateQuestionSet(skillId, questionsPerSkill));
  }
  return questions;
}

export function getSupportedSkillIds() { return Object.keys(generatorsBySkill); }

export default { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds };
