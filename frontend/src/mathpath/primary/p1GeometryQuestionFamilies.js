import { p1GeometrySkillGraph } from './p1GeometrySkillGraph.js';

const SKILL_IDS = new Set(p1GeometrySkillGraph.skillIds);

function buildFamily(skillId, index, config) {
  return {
    id: `QF_${skillId}_${String(index).padStart(3, '0')}`,
    skillId,
    name: config.name,
    description: config.description,
    difficulty: config.difficulty,
    recommendedQuestionCount: config.recommendedQuestionCount ?? 10,
    fluencyTargetSeconds: config.fluencyTargetSeconds,
    masteryTargetAccuracy: config.masteryTargetAccuracy ?? 80,
    masteryQuestionCount: config.masteryQuestionCount ?? 10,
    misconceptionTags: config.misconceptionTags ?? [],
    assessmentRelevant: config.assessmentRelevant ?? true,
    mentalMathEligible: config.mentalMathEligible ?? false,
    workingRequired: config.workingRequired ?? false,
    answerType: config.answerType ?? 'choice',
    visualRequirement: config.visualRequirement ?? 'required',
    fluencyBenchmarks: config.fluencyBenchmarks ?? {
      bronze: Math.round(config.fluencyTargetSeconds * 1.8),
      silver: Math.round(config.fluencyTargetSeconds * 1.4),
      gold: config.fluencyTargetSeconds,
      platinum: Math.max(3, Math.round(config.fluencyTargetSeconds * 0.7)),
    },
  };
}

const familiesBySkillBlueprint = {
  'P1-GEO-01': [
    { name: 'Identify 2D Shape by Name', description: 'Choose the correct name for a given 2D shape.', difficulty: 1, fluencyTargetSeconds: 6, mentalMathEligible: false, answerType: 'choice', misconceptionTags: ['shape_orientation_dependence'] },
    { name: 'Count Sides or Corners', description: 'Count the number of sides or corners of a given 2D shape.', difficulty: 1, fluencyTargetSeconds: 8, mentalMathEligible: false, answerType: 'number', misconceptionTags: ['shape_orientation_dependence'] },
  ],
  'P1-GEO-02': [
    { name: 'Identify 3D Object by Name', description: 'Choose the correct name for a given 3D object.', difficulty: 1, fluencyTargetSeconds: 6, mentalMathEligible: false, answerType: 'choice', misconceptionTags: ['confuses_2d_3d'] },
    { name: 'Match 3D Object to Description', description: 'Match a 3D object to a description of its properties.', difficulty: 1, fluencyTargetSeconds: 8, mentalMathEligible: false, answerType: 'choice', misconceptionTags: ['confuses_2d_3d'] },
  ],
  'P1-GEO-03': [
    { name: 'Sort by Number of Sides', description: 'Identify which shapes have a given number of sides.', difficulty: 2, fluencyTargetSeconds: 10, mentalMathEligible: false, answerType: 'choice', misconceptionTags: ['sorts_by_appearance_not_property'] },
    { name: 'Sort by Curved or Straight Edges', description: 'Identify which shapes have curved or straight edges.', difficulty: 2, fluencyTargetSeconds: 10, mentalMathEligible: false, answerType: 'choice', misconceptionTags: ['sorts_by_appearance_not_property'] },
  ],
  'P1-GEO-04': [
    { name: 'Continue AB Pattern', description: 'Continue a repeating AB shape pattern.', difficulty: 2, fluencyTargetSeconds: 10, mentalMathEligible: false, answerType: 'choice', misconceptionTags: ['pattern_looks_only_at_last'] },
    { name: 'Continue ABC Pattern', description: 'Continue a repeating ABC shape pattern.', difficulty: 2, fluencyTargetSeconds: 12, mentalMathEligible: false, answerType: 'choice', misconceptionTags: ['pattern_looks_only_at_last'] },
  ],
  'P1-GEO-05': [
    { name: 'Create AB Pattern', description: 'Choose the next shape to continue an AB repeating pattern.', difficulty: 2, fluencyTargetSeconds: 10, mentalMathEligible: false, answerType: 'choice', misconceptionTags: ['pattern_random_sequence'] },
    { name: 'Create ABB Pattern', description: 'Choose the next shape to continue an ABB repeating pattern.', difficulty: 2, fluencyTargetSeconds: 12, mentalMathEligible: false, answerType: 'choice', misconceptionTags: ['pattern_random_sequence'] },
  ],
  'P1-GEO-06': [
    { name: 'Identify Position (Above/Below)', description: 'Identify which object is above or below another.', difficulty: 1, fluencyTargetSeconds: 6, mentalMathEligible: false, answerType: 'choice', misconceptionTags: ['confuses_between_beside'] },
    { name: 'Identify Position (Left/Right/Between)', description: 'Identify which object is left of, right of, or between others.', difficulty: 1, fluencyTargetSeconds: 8, mentalMathEligible: false, answerType: 'choice', misconceptionTags: ['confuses_left_right', 'confuses_between_beside'] },
  ],
  'P1-GEO-07': [
    { name: 'Match Real Object to 2D Shape', description: 'Match a real-world object to its corresponding 2D shape name.', difficulty: 2, fluencyTargetSeconds: 8, mentalMathEligible: false, answerType: 'choice', misconceptionTags: ['matches_by_colour_or_use'] },
    { name: 'Match Real Object to 3D Object', description: 'Match a real-world object to its corresponding 3D object name.', difficulty: 2, fluencyTargetSeconds: 8, mentalMathEligible: false, answerType: 'choice', misconceptionTags: ['matches_by_colour_or_use'] },
  ],
};

const allFamilies = [];
Object.entries(familiesBySkillBlueprint).forEach(([skillId, blueprints]) => {
  if (!SKILL_IDS.has(skillId)) return;
  blueprints.forEach((bp, i) => {
    allFamilies.push(buildFamily(skillId, i + 1, bp));
  });
});

const familyById = new Map(allFamilies.map((f) => [f.id, f]));
const familiesBySkill = new Map();
allFamilies.forEach((f) => {
  if (!familiesBySkill.has(f.skillId)) familiesBySkill.set(f.skillId, []);
  familiesBySkill.get(f.skillId).push(f);
});

export function getQuestionFamily(familyId) {
  return familyById.get(familyId) || null;
}

export function getQuestionFamiliesBySkill(skillId) {
  return familiesBySkill.get(skillId) || [];
}

export function getAllQuestionFamilies() {
  return [...allFamilies];
}

export function validateP1GeometryQuestionFamilies() {
  const orphanFamilies = allFamilies.filter((f) => !SKILL_IDS.has(f.skillId));
  const missingFluency = allFamilies.filter((f) => !f.fluencyTargetSeconds);
  const duplicateIds = allFamilies
    .map((f) => f.id)
    .filter((id, i, arr) => arr.indexOf(id) !== i);

  const skillsMissingFamilies = [...SKILL_IDS].filter(
    (sid) => !familiesBySkill.has(sid) || familiesBySkill.get(sid).length === 0
  );

  return {
    isValid: orphanFamilies.length === 0 && duplicateIds.length === 0 && skillsMissingFamilies.length === 0,
    totalFamilies: allFamilies.length,
    orphanFamilies: orphanFamilies.map((f) => f.id),
    duplicateIds,
    missingFluency: missingFluency.map((f) => f.id),
    skillsMissingFamilies,
  };
}

export default { getQuestionFamily, getQuestionFamiliesBySkill, getAllQuestionFamilies, validateP1GeometryQuestionFamilies };
