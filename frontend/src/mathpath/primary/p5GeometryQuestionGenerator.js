import { getSkill } from './p5GeometrySkillGraph.js';
import { getQuestionFamiliesBySkill } from './p5GeometryQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

/* ── GEO-01: Angles on Straight Line & at a Point ── */

function generateAnglesOnLine(familyId) {
  if (familyId.endsWith('_001')) {
    // Two given angles on a straight line, find the third (sum = 180)
    const a1 = randInt(25, 75);
    const a2 = randInt(20, 180 - a1 - 10);
    const answer = 180 - a1 - a2;
    return {
      skillId: 'P5-GEO-01', questionFamilyId: familyId,
      prompt: `Three angles lie on a straight line. Two of the angles are ${a1}° and ${a2}°. What is the third angle?`,
      answer, answerType: 'number',
      instructionHint: 'Angles on a straight line add up to 180°. Subtract the known angles from 180°.',
      solutionText: `Angles on a straight line = 180°. Third angle = 180° − ${a1}° − ${a2}° = ${answer}°.`,
      misconceptionTraps: ['forgets_angles_on_line_sum_180'],
    };
  }
  if (familyId.endsWith('_002')) {
    // Vertically opposite angles — given one angle, find the opposite
    const given = randInt(20, 160);
    const answer = given;
    return {
      skillId: 'P5-GEO-01', questionFamilyId: familyId,
      prompt: `Two straight lines intersect. One of the angles formed is ${given}°. What is the vertically opposite angle?`,
      answer, answerType: 'number',
      instructionHint: 'Vertically opposite angles are equal.',
      solutionText: `Vertically opposite angles are equal, so the opposite angle = ${given}°.`,
      misconceptionTraps: ['confuses_vertically_opposite_with_adjacent'],
    };
  }
  // _003: Angles at a point — given three angles, find the fourth (sum = 360)
  const a1 = randInt(40, 120);
  const a2 = randInt(40, 120);
  const a3 = randInt(30, Math.min(120, 360 - a1 - a2 - 10));
  const answer = 360 - a1 - a2 - a3;
  return {
    skillId: 'P5-GEO-01', questionFamilyId: familyId,
    prompt: `Four angles meet at a point. Three of the angles are ${a1}°, ${a2}° and ${a3}°. What is the fourth angle?`,
    answer, answerType: 'number',
    instructionHint: 'Angles at a point add up to 360°. Subtract the known angles from 360°.',
    solutionText: `Angles at a point = 360°. Fourth angle = 360° − ${a1}° − ${a2}° − ${a3}° = ${answer}°.`,
    misconceptionTraps: ['forgets_angles_at_point_sum_360'],
  };
}

/* ── GEO-02: Triangle Angle Properties ── */

function generateTriangleAngles(familyId) {
  if (familyId.endsWith('_001')) {
    // Two given angles in a triangle, find the third (sum = 180)
    const a1 = randInt(25, 90);
    const a2 = randInt(20, 180 - a1 - 10);
    const answer = 180 - a1 - a2;
    return {
      skillId: 'P5-GEO-02', questionFamilyId: familyId,
      prompt: `A triangle has angles of ${a1}° and ${a2}°. What is the third angle?`,
      answer, answerType: 'number',
      instructionHint: 'The angle sum of a triangle is 180°. Subtract the two known angles from 180°.',
      solutionText: `Angle sum in a triangle = 180°. Third angle = 180° − ${a1}° − ${a2}° = ${answer}°.`,
      misconceptionTraps: ['wrong_triangle_angle_sum'],
    };
  }
  if (familyId.endsWith('_002')) {
    // Isosceles triangle — given one base angle or the apex angle
    const giveBase = Math.random() < 0.5;
    if (giveBase) {
      const baseAngle = randInt(30, 80);
      const apex = 180 - 2 * baseAngle;
      return {
        skillId: 'P5-GEO-02', questionFamilyId: familyId,
        prompt: `An isosceles triangle has two equal base angles of ${baseAngle}° each. What is the apex angle?`,
        answer: apex, answerType: 'number',
        instructionHint: 'In an isosceles triangle, two base angles are equal. Angle sum = 180°.',
        solutionText: `Apex angle = 180° − ${baseAngle}° − ${baseAngle}° = ${apex}°.`,
        misconceptionTraps: ['forgets_isosceles_has_two_equal_angles'],
      };
    }
    // Give apex, find base angle
    const apex = randInt(20, 120);
    // Ensure the base angles are whole numbers
    const remainder = 180 - apex;
    const baseAngle = remainder / 2;
    // Re-roll if not integer
    const safeApex = apex % 2 === 0 ? apex : apex + 1;
    const safeBase = (180 - safeApex) / 2;
    return {
      skillId: 'P5-GEO-02', questionFamilyId: familyId,
      prompt: `An isosceles triangle has an apex angle of ${safeApex}°. What is each base angle?`,
      answer: safeBase, answerType: 'number',
      instructionHint: 'In an isosceles triangle, the two base angles are equal. Subtract the apex from 180° and divide by 2.',
      solutionText: `Each base angle = (180° − ${safeApex}°) ÷ 2 = ${safeBase}°.`,
      misconceptionTraps: ['forgets_isosceles_has_two_equal_angles'],
    };
  }
  // _003: Equilateral triangle — verify/apply 60° property
  const numAngles = randInt(1, 3);
  const prompt = numAngles === 3
    ? 'An equilateral triangle has all sides equal. What is each angle of the triangle?'
    : `In an equilateral triangle, two of the angles are 60° each. What is the remaining angle?`;
  return {
    skillId: 'P5-GEO-02', questionFamilyId: familyId,
    prompt,
    answer: 60, answerType: 'number',
    instructionHint: 'All angles in an equilateral triangle are equal. 180° ÷ 3 = 60°.',
    solutionText: 'An equilateral triangle has all angles equal: 180° ÷ 3 = 60° each.',
    misconceptionTraps: ['assumes_all_triangles_equilateral'],
  };
}

/* ── GEO-03: Parallelogram & Quadrilateral Properties ── */

function generateParallelogramAngles(familyId) {
  if (familyId.endsWith('_001')) {
    // Parallelogram — given one angle, find the adjacent or opposite
    const given = randInt(30, 150);
    const findOpposite = Math.random() < 0.5;
    if (findOpposite) {
      return {
        skillId: 'P5-GEO-03', questionFamilyId: familyId,
        prompt: `In a parallelogram, one angle is ${given}°. What is the opposite angle?`,
        answer: given, answerType: 'number',
        instructionHint: 'Opposite angles in a parallelogram are equal.',
        solutionText: `Opposite angles are equal. The opposite angle = ${given}°.`,
        misconceptionTraps: ['confuses_parallelogram_properties'],
      };
    }
    const adjacent = 180 - given;
    return {
      skillId: 'P5-GEO-03', questionFamilyId: familyId,
      prompt: `In a parallelogram, one angle is ${given}°. What is the adjacent angle?`,
      answer: adjacent, answerType: 'number',
      instructionHint: 'Adjacent angles in a parallelogram are supplementary (sum to 180°).',
      solutionText: `Adjacent angles sum to 180°. Adjacent angle = 180° − ${given}° = ${adjacent}°.`,
      misconceptionTraps: ['confuses_parallelogram_properties'],
    };
  }
  if (familyId.endsWith('_002')) {
    // Rhombus — given one angle, find adjacent angle
    const given = randInt(30, 150);
    const answer = 180 - given;
    return {
      skillId: 'P5-GEO-03', questionFamilyId: familyId,
      prompt: `A rhombus has one angle of ${given}°. What is the size of each adjacent angle?`,
      answer, answerType: 'number',
      instructionHint: 'A rhombus is a parallelogram. Adjacent angles sum to 180°.',
      solutionText: `Adjacent angle = 180° − ${given}° = ${answer}°. (Opposite angles are ${given}° and the other pair is ${answer}°.)`,
      misconceptionTraps: ['confuses_parallelogram_properties'],
    };
  }
  // _003: Co-interior angles on parallel lines (sum = 180°)
  const given = randInt(25, 155);
  const answer = 180 - given;
  return {
    skillId: 'P5-GEO-03', questionFamilyId: familyId,
    prompt: `Two parallel lines are cut by a transversal. One co-interior angle is ${given}°. What is the other co-interior angle?`,
    answer, answerType: 'number',
    instructionHint: 'Co-interior angles (same-side interior) between parallel lines sum to 180°.',
    solutionText: `Co-interior angles sum to 180°. Other angle = 180° − ${given}° = ${answer}°.`,
    misconceptionTraps: ['wrong_co_interior_angle_sum'],
  };
}

const generatorsBySkill = {
  'P5-GEO-01': generateAnglesOnLine,
  'P5-GEO-02': generateTriangleAngles,
  'P5-GEO-03': generateParallelogramAngles,
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
