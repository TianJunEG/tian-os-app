import { p1AddSubSkillGraph } from './p1AddSubSkillGraph.js';

const SKILL_IDS = new Set(p1AddSubSkillGraph.skillIds);

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
    answerType: config.answerType ?? 'number',
    visualRequirement: config.visualRequirement ?? 'optional',
    fluencyBenchmarks: config.fluencyBenchmarks ?? {
      bronze: Math.round(config.fluencyTargetSeconds * 1.8),
      silver: Math.round(config.fluencyTargetSeconds * 1.4),
      gold: config.fluencyTargetSeconds,
      platinum: Math.max(3, Math.round(config.fluencyTargetSeconds * 0.7)),
    },
  };
}

const familiesBySkillBlueprint = {
  'P1-ADD-01': [
    { name: 'Add with pictures', description: 'Add two groups of objects shown in a picture.', difficulty: 1, fluencyTargetSeconds: 8, answerType: 'number', visualRequirement: 'required', misconceptionTags: ['counts_from_one'] },
    { name: 'Equation fill-in', description: 'Complete an addition equation within 10.', difficulty: 1, fluencyTargetSeconds: 6, answerType: 'number', misconceptionTags: ['counts_from_one'] },
  ],
  'P1-ADD-02': [
    { name: 'Take away with pictures', description: 'Subtract by crossing out objects in a picture.', difficulty: 1, fluencyTargetSeconds: 8, answerType: 'number', visualRequirement: 'required', misconceptionTags: ['subtracts_wrong_direction'] },
    { name: 'Equation fill-in', description: 'Complete a subtraction equation within 10.', difficulty: 1, fluencyTargetSeconds: 6, answerType: 'number', misconceptionTags: ['subtracts_wrong_direction'] },
  ],
  'P1-ADD-03': [
    { name: 'Timed addition drill', description: 'Answer addition facts to 10 as quickly as possible.', difficulty: 2, fluencyTargetSeconds: 3, mentalMathEligible: true, answerType: 'number', misconceptionTags: ['counts_from_one'] },
    { name: 'Mixed addition facts', description: 'Solve a mix of addition facts with sums up to 10.', difficulty: 2, fluencyTargetSeconds: 4, mentalMathEligible: true, answerType: 'number', misconceptionTags: ['counts_from_one'] },
  ],
  'P1-ADD-04': [
    { name: 'Timed subtraction drill', description: 'Answer subtraction facts within 10 as quickly as possible.', difficulty: 2, fluencyTargetSeconds: 3, mentalMathEligible: true, answerType: 'number', misconceptionTags: ['subtracts_wrong_direction'] },
    { name: 'Mixed subtraction facts', description: 'Solve a mix of subtraction facts within 10.', difficulty: 2, fluencyTargetSeconds: 4, mentalMathEligible: true, answerType: 'number', misconceptionTags: ['subtracts_wrong_direction'] },
  ],
  'P1-ADD-05': [
    { name: 'Add teen and ones', description: 'Add a teen number and a single-digit number (no regrouping).', difficulty: 2, fluencyTargetSeconds: 8, answerType: 'number', misconceptionTags: ['forgets_teen_structure'] },
    { name: 'Add two numbers to 20', description: 'Add two numbers with a sum up to 20 (no regrouping).', difficulty: 2, fluencyTargetSeconds: 10, answerType: 'number', misconceptionTags: ['forgets_teen_structure'] },
  ],
  'P1-ADD-06': [
    { name: 'Subtract from teen', description: 'Subtract a single-digit number from a teen number (no borrowing).', difficulty: 2, fluencyTargetSeconds: 8, answerType: 'number', misconceptionTags: ['subtracts_wrong_direction'] },
    { name: 'Subtract two numbers within 20', description: 'Subtract two numbers within 20 (no borrowing).', difficulty: 2, fluencyTargetSeconds: 10, answerType: 'number', misconceptionTags: ['subtracts_wrong_direction'] },
  ],
  'P1-ADD-07': [
    { name: 'Add with tens and ones', description: 'Add two numbers with a sum up to 40 using tens and ones.', difficulty: 3, fluencyTargetSeconds: 12, answerType: 'number', misconceptionTags: ['adds_ones_to_tens'] },
    { name: 'Column addition within 40', description: 'Add two numbers in column format with a sum up to 40.', difficulty: 3, fluencyTargetSeconds: 15, answerType: 'number', workingRequired: true, misconceptionTags: ['adds_ones_to_tens'] },
  ],
  'P1-ADD-08': [
    { name: 'Subtract with tens and ones', description: 'Subtract within 40 using tens and ones.', difficulty: 3, fluencyTargetSeconds: 12, answerType: 'number', misconceptionTags: ['subtracts_smaller_from_larger_digit'] },
    { name: 'Column subtraction within 40', description: 'Subtract in column format within 40.', difficulty: 3, fluencyTargetSeconds: 15, answerType: 'number', workingRequired: true, misconceptionTags: ['subtracts_smaller_from_larger_digit'] },
  ],
  'P1-ADD-09': [
    { name: 'Join word problem', description: 'Solve an addition word problem where groups are joined together.', difficulty: 3, fluencyTargetSeconds: 20, answerType: 'number', workingRequired: true, misconceptionTags: ['wrong_operation_word_problem'] },
    { name: 'Separate word problem', description: 'Solve a subtraction word problem where objects are taken away.', difficulty: 3, fluencyTargetSeconds: 20, answerType: 'number', workingRequired: true, misconceptionTags: ['wrong_operation_word_problem'] },
  ],
  'P1-ADD-10': [
    { name: 'Missing addend', description: 'Find the missing number in an addition equation.', difficulty: 3, fluencyTargetSeconds: 12, answerType: 'number', misconceptionTags: ['missing_number_adds_all'] },
    { name: 'Missing subtrahend', description: 'Find the missing number in a subtraction equation.', difficulty: 3, fluencyTargetSeconds: 12, answerType: 'number', misconceptionTags: ['missing_number_adds_all'] },
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

export function validateP1AddSubQuestionFamilies() {
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

export default { getQuestionFamily, getQuestionFamiliesBySkill, getAllQuestionFamilies, validateP1AddSubQuestionFamilies };
