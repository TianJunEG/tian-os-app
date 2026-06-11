import { p4FourOpsSkillGraph } from './p4FourOpsSkillGraph.js';

const SKILL_IDS = new Set(p4FourOpsSkillGraph.skillIds);

function buildFamily(skillId, index, config) {
  return {
    id: `QF_${skillId}_${String(index).padStart(3, '0')}`,
    skillId,
    name: config.name,
    description: config.description,
    difficulty: config.difficulty,
    recommendedQuestionCount: config.recommendedQuestionCount ?? 20,
    fluencyTargetSeconds: config.fluencyTargetSeconds,
    masteryTargetAccuracy: config.masteryTargetAccuracy ?? 90,
    masteryQuestionCount: config.masteryQuestionCount ?? 20,
    misconceptionTags: config.misconceptionTags ?? [],
    assessmentRelevant: config.assessmentRelevant ?? true,
    mentalMathEligible: config.mentalMathEligible ?? false,
    workingRequired: config.workingRequired ?? false,
    answerType: config.answerType ?? 'numeric',
    fluencyBenchmarks: config.fluencyBenchmarks ?? {
      bronze: Math.round(config.fluencyTargetSeconds * 1.8),
      silver: Math.round(config.fluencyTargetSeconds * 1.4),
      gold: config.fluencyTargetSeconds,
      platinum: Math.max(2, Math.round(config.fluencyTargetSeconds * 0.7)),
    },
  };
}

const familiesBySkillBlueprint = {
  'P4-FO-01': [
    {
      name: 'Standard Multiplication (4-digit by 1-digit)',
      description: 'Multiply a 4-digit number by a 1-digit number using the column method.',
      difficulty: 2,
      fluencyTargetSeconds: 26,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['carries_wrong_column', 'forgets_carry'],
    },
    {
      name: 'Word Context (4-digit by 1-digit)',
      description: 'Solve a word problem that requires multiplying a 4-digit number by a 1-digit number.',
      difficulty: 2,
      fluencyTargetSeconds: 30,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['carries_wrong_column', 'forgets_carry'],
    },
  ],
  'P4-FO-02': [
    {
      name: 'Standard Multiplication (3-digit by 2-digit)',
      description: 'Multiply a 3-digit number by a 2-digit number using partial products.',
      difficulty: 3,
      fluencyTargetSeconds: 35,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['wrong_partial_product', 'forgets_carry', 'carries_wrong_column'],
    },
    {
      name: 'Word Context (3-digit by 2-digit)',
      description: 'Solve a word problem that requires multiplying a 3-digit number by a 2-digit number.',
      difficulty: 3,
      fluencyTargetSeconds: 40,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['wrong_partial_product', 'forgets_carry'],
    },
  ],
  'P4-FO-03': [
    {
      name: 'Exact Division (4-digit by 1-digit)',
      description: 'Divide a number up to 4 digits exactly by a 1-digit number.',
      difficulty: 2,
      fluencyTargetSeconds: 26,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['wrong_remainder'],
    },
    {
      name: 'Division with Remainder (4-digit by 1-digit)',
      description: 'Divide a number up to 4 digits by a 1-digit number and find the remainder.',
      difficulty: 2,
      fluencyTargetSeconds: 28,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['wrong_remainder', 'confuses_quotient_and_remainder'],
    },
    {
      name: 'Word Context (Division)',
      description: 'Solve a word problem that requires dividing a large number by a 1-digit number.',
      difficulty: 3,
      fluencyTargetSeconds: 32,
      answerType: 'numeric',
      workingRequired: true,
      misconceptionTags: ['wrong_remainder', 'confuses_quotient_and_remainder'],
    },
  ],
};

export const p4FourOpsQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, definitions]) =>
    definitions.map((definition, index) => buildFamily(skillId, index + 1, definition))
);

const familyById = new Map(p4FourOpsQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(familyId) { return familyById.get(familyId) || null; }
export function getQuestionFamiliesBySkill(skillId) {
  return p4FourOpsQuestionFamilies.filter((f) => f.skillId === skillId);
}
export function getAllQuestionFamilies() { return [...p4FourOpsQuestionFamilies]; }
export function getQuestionFamilyCountsBySkill() {
  return p4FourOpsSkillGraph.skillIds.reduce((acc, sid) => {
    acc[sid] = getQuestionFamiliesBySkill(sid).length;
    return acc;
  }, {});
}

export function validateP4FourOpsQuestionFamilies() {
  const ids = p4FourOpsQuestionFamilies.map((f) => f.id);
  const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
  const invalidSkillRefs = p4FourOpsQuestionFamilies
    .filter((f) => !SKILL_IDS.has(f.skillId))
    .map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const skillCoverage = getQuestionFamilyCountsBySkill();
  const missingSkillCoverage = Object.entries(skillCoverage).filter(([, c]) => c === 0).map(([s]) => s);
  const lowFamilyCountSkills = Object.entries(skillCoverage).filter(([, c]) => c < 2).map(([s, c]) => ({ skillId: s, count: c }));

  const errors = [];
  if (duplicateIds.length) errors.push('Duplicate question family IDs found.');
  if (invalidSkillRefs.length) errors.push('Some question families reference invalid skill IDs.');
  if (missingSkillCoverage.length) errors.push('Some skills have no question families.');
  if (lowFamilyCountSkills.length) errors.push('Some skills have fewer than 2 question families.');

  return {
    isValid: errors.length === 0,
    totalQuestionFamilies: p4FourOpsQuestionFamilies.length,
    familiesPerSkill: skillCoverage,
    summary: { duplicateIds: [...new Set(duplicateIds)], invalidSkillRefs, missingSkillCoverage, lowFamilyCountSkills },
    errors,
  };
}

export default {
  domainId: 'p4-four-ops',
  version: '1.0.0',
  totalSkills: p4FourOpsSkillGraph.skillIds.length,
  totalQuestionFamilies: p4FourOpsQuestionFamilies.length,
  families: p4FourOpsQuestionFamilies,
};
