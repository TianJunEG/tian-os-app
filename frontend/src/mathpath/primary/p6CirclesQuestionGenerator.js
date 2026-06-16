import { getSkill } from './p6CirclesSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p6CirclesQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function round2(n) { return Math.round(n * 100) / 100; }

/* ---------- Diameter/radius pools for clean arithmetic ---------- */

// Multiples of 7 for π = 22/7 (diameter values → clean circumference)
const DIAMETERS_22_7 = [7, 14, 21, 28, 35, 42, 49, 56, 63, 70];
// Radii that are multiples of 7 for π = 22/7 (area = 22/7 × r × r → integer)
const RADII_AREA_22_7 = [7, 14, 21, 28, 35];
// Radii that are multiples of 14 for quadrant area (22/7 × r² / 4 → integer)
const RADII_QUADRANT_22_7 = [14, 28, 42];
// Even multiples of 7 as diameters for area-from-diameter (radius = d/2 must be multiple of 7)
const DIAMETERS_AREA_22_7 = [14, 28, 42, 56, 70];
// Clean diameters for π = 3.14 (whole-number or simple-decimal circumference)
const DIAMETERS_3_14 = [5, 10, 20, 25, 50, 100];
// Clean radii for π = 3.14 (area = 3.14 × r × r)
const RADII_AREA_3_14 = [5, 10, 20, 25, 50];
// Side lengths for composite figures: multiples of 14 ensure both perimeter and area are integers
const SIDES_COMPOSITE_22_7 = [14, 28, 42, 56, 70];

/* ---------- P6-CIR-01: Circumference of Circle ---------- */

function circleSpec(radius) {
  return { type: 'circle', payload: { radius, showRadius: true, showDiameter: false } };
}
function circleDiameterSpec(diameter) {
  return { type: 'circle', payload: { radius: diameter / 2, showRadius: false, showDiameter: true } };
}

function generateCircumference(familyId) {
  if (familyId.endsWith('_001')) {
    // Circumference from diameter, π = 22/7
    const d = pick(DIAMETERS_22_7);
    const answer = (22 / 7) * d;
    return {
      skillId: 'P6-CIR-01', questionFamilyId: familyId,
      prompt: `Find the circumference of a circle with diameter ${d} cm. (Take π = 22/7)`,
      answer, answerType: 'number',
      diagramSpec: circleDiameterSpec(d),
      instructionHint: 'Circumference = π × diameter. Substitute π = 22/7 and multiply.',
      solutionText: `C = π × d = 22/7 × ${d} = ${answer} cm.`,
      misconceptionTraps: ['uses_diameter_as_radius', 'pi_approximation_error'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Circumference from radius, π = 22/7
    const r = pick(DIAMETERS_22_7);
    const answer = 2 * (22 / 7) * r;
    return {
      skillId: 'P6-CIR-01', questionFamilyId: familyId,
      prompt: `A circle has radius ${r} cm. Find its circumference. (Take π = 22/7)`,
      answer, answerType: 'number',
      diagramSpec: circleSpec(r),
      instructionHint: 'Circumference = 2 × π × radius. Substitute π = 22/7 and multiply.',
      solutionText: `C = 2 × π × r = 2 × 22/7 × ${r} = ${answer} cm.`,
      misconceptionTraps: ['uses_diameter_as_radius', 'pi_approximation_error'],
    };
  }

  // _003: Circumference with π = 3.14
  const d = pick(DIAMETERS_3_14);
  const answer = round2(3.14 * d);
  return {
    skillId: 'P6-CIR-01', questionFamilyId: familyId,
    prompt: `Find the circumference of a circle with diameter ${d} cm. (Take π = 3.14)`,
    answer, answerType: 'number',
    diagramSpec: circleDiameterSpec(d),
    instructionHint: 'Circumference = π × diameter. Substitute π = 3.14 and multiply.',
    solutionText: `C = π × d = 3.14 × ${d} = ${answer} cm.`,
    misconceptionTraps: ['pi_approximation_error', 'confuses_circumference_area_formulas'],
  };
}

/* ---------- P6-CIR-02: Area of Circle ---------- */

function generateArea(familyId) {
  if (familyId.endsWith('_001')) {
    const r = pick(RADII_AREA_22_7);
    const answer = (22 / 7) * r * r;
    return {
      skillId: 'P6-CIR-02', questionFamilyId: familyId,
      prompt: `Find the area of a circle with radius ${r} cm. (Take π = 22/7)`,
      answer, answerType: 'number',
      diagramSpec: circleSpec(r),
      instructionHint: 'Area = π × r × r. Substitute π = 22/7 and multiply.',
      solutionText: `A = π × r × r = 22/7 × ${r} × ${r} = 22/7 × ${r * r} = ${answer} cm².`,
      misconceptionTraps: ['area_uses_diameter_not_radius', 'confuses_circumference_area_formulas'],
    };
  }

  if (familyId.endsWith('_002')) {
    const d = pick(DIAMETERS_AREA_22_7);
    const r = d / 2;
    const answer = (22 / 7) * r * r;
    return {
      skillId: 'P6-CIR-02', questionFamilyId: familyId,
      prompt: `The diameter of a circle is ${d} cm. Find its area. (Take π = 22/7)`,
      answer, answerType: 'number',
      diagramSpec: circleDiameterSpec(d),
      instructionHint: 'First find the radius (diameter ÷ 2), then use Area = π × r × r.',
      solutionText: `Radius = ${d} ÷ 2 = ${r} cm. A = π × r × r = 22/7 × ${r} × ${r} = ${answer} cm².`,
      misconceptionTraps: ['area_uses_diameter_not_radius', 'pi_approximation_error'],
    };
  }

  // _003: Area with π = 3.14
  const r = pick(RADII_AREA_3_14);
  const answer = round2(3.14 * r * r);
  return {
    skillId: 'P6-CIR-02', questionFamilyId: familyId,
    prompt: `Find the area of a circle with radius ${r} cm. (Take π = 3.14)`,
    answer, answerType: 'number',
    diagramSpec: circleSpec(r),
    instructionHint: 'Area = π × r × r. Substitute π = 3.14 and multiply.',
    solutionText: `A = π × r × r = 3.14 × ${r} × ${r} = 3.14 × ${r * r} = ${answer} cm².`,
    misconceptionTraps: ['area_uses_diameter_not_radius', 'pi_approximation_error'],
  };
}

/* ---------- P6-CIR-03: Composite Figures with Circles ---------- */

function generateComposite(familyId) {
  if (familyId.endsWith('_001')) {
    // Perimeter of semicircle = πd/2 + d = (π × d / 2) + d
    // Use diameter that is a multiple of 7 for clean arithmetic with 22/7
    const d = pick(DIAMETERS_22_7);
    const curvedPart = (22 / 7) * d / 2;
    const answer = curvedPart + d;
    return {
      skillId: 'P6-CIR-03', questionFamilyId: familyId,
      prompt: `Find the perimeter of a semicircle with diameter ${d} cm. (Take π = 22/7)`,
      answer, answerType: 'number',
      instructionHint: 'Perimeter of semicircle = half the circumference + the diameter (straight edge).',
      solutionText: `Curved part = π × d ÷ 2 = 22/7 × ${d} ÷ 2 = ${curvedPart} cm. Perimeter = ${curvedPart} + ${d} = ${answer} cm.`,
      misconceptionTraps: ['forgets_straight_edge_in_semicircle', 'forgets_to_halve_for_semicircle'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Area of quadrant = πr²/4
    // Use radii that are multiples of 14 so the answer is always an integer
    const r = pick(RADII_QUADRANT_22_7);
    const fullArea = (22 / 7) * r * r;
    const answer = fullArea / 4;
    return {
      skillId: 'P6-CIR-03', questionFamilyId: familyId,
      prompt: `Find the area of a quadrant (quarter-circle) with radius ${r} cm. (Take π = 22/7)`,
      answer, answerType: 'number',
      instructionHint: 'Area of quadrant = π × r × r ÷ 4.',
      solutionText: `Area of full circle = π × r × r = 22/7 × ${r} × ${r} = ${fullArea} cm². Area of quadrant = ${fullArea} ÷ 4 = ${answer} cm².`,
      misconceptionTraps: ['wrong_fraction_for_quadrant', 'area_uses_diameter_not_radius'],
    };
  }

  // _003: Composite — square with 2 semicircles on opposite sides
  // Side of square = diameter of semicircles; multiples of 14 ensure both perimeter and area are integers
  const side = pick(SIDES_COMPOSITE_22_7);
  // Choose between perimeter and area question
  const askPerimeter = Math.random() < 0.5;

  if (askPerimeter) {
    // Perimeter = 2 straight sides of square + 2 semicircle curved edges
    // 2 semicircle curves = 1 full circumference = π × d = π × side
    const fullCircumference = (22 / 7) * side;
    const straightEdges = 2 * side;
    const answer = fullCircumference + straightEdges;
    return {
      skillId: 'P6-CIR-03', questionFamilyId: familyId,
      prompt: `A figure is made up of a square of side ${side} cm with a semicircle attached to each of two opposite sides. Find the perimeter of the figure. (Take π = 22/7)`,
      answer, answerType: 'number',
      instructionHint: 'Perimeter = 2 curved semicircle edges (= 1 full circumference) + 2 remaining straight sides of the square.',
      solutionText: `Two semicircle curves = 1 full circumference = π × d = 22/7 × ${side} = ${fullCircumference} cm. Two straight edges = 2 × ${side} = ${straightEdges} cm. Perimeter = ${fullCircumference} + ${straightEdges} = ${answer} cm.`,
      misconceptionTraps: ['adds_full_circumference_to_semicircle', 'forgets_straight_edge_in_semicircle'],
    };
  }

  // Area = area of square + 2 semicircle areas = area of square + area of 1 full circle
  const r = side / 2;
  const squareArea = side * side;
  const circleArea = (22 / 7) * r * r;
  const answer = squareArea + circleArea;
  return {
    skillId: 'P6-CIR-03', questionFamilyId: familyId,
    prompt: `A figure is made up of a square of side ${side} cm with a semicircle attached to each of two opposite sides. Find the total area of the figure. (Take π = 22/7)`,
    answer, answerType: 'number',
    instructionHint: 'Total area = area of square + 2 × area of semicircle = area of square + area of 1 full circle.',
    solutionText: `Area of square = ${side} × ${side} = ${squareArea} cm². Radius of semicircle = ${side} ÷ 2 = ${r} cm. Area of 2 semicircles = π × r × r = 22/7 × ${r} × ${r} = ${circleArea} cm². Total area = ${squareArea} + ${circleArea} = ${answer} cm².`,
    misconceptionTraps: ['forgets_to_halve_for_semicircle', 'adds_full_circumference_to_semicircle'],
  };
}

/* ---------- Generator registry ---------- */

const generatorsBySkill = {
  'P6-CIR-01': generateCircumference,
  'P6-CIR-02': generateArea,
  'P6-CIR-03': generateComposite,
};

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
