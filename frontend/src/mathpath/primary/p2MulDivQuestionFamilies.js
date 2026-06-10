import { p2MulDivSkillGraph } from './p2MulDivSkillGraph.js';

const SKILL_IDS = new Set(p2MulDivSkillGraph.skillIds);

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
  'P2-MD-01': [
    {
      name: 'Straight Multiplication (a x b)',
      description: 'Multiply using the 2, 3, 4, 5, or 10 times table.',
      difficulty: 1,
      fluencyTargetSeconds: 8,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['times_table_recall_error', 'confuses_multiplication_addition'],
    },
    {
      name: 'Commutative Form (b x a)',
      description: 'Recall the same fact in reversed order (e.g. 7 x 3 instead of 3 x 7).',
      difficulty: 1,
      fluencyTargetSeconds: 8,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['times_table_recall_error'],
    },
    {
      name: 'Missing Factor',
      description: 'Find the missing factor: 4 x ? = 20.',
      difficulty: 2,
      fluencyTargetSeconds: 12,
      answerType: 'mcq',
      mentalMathEligible: true,
      misconceptionTags: ['times_table_recall_error', 'confuses_multiplication_addition'],
    },
  ],
  'P2-MD-02': [
    {
      name: 'Straight Division',
      description: 'Divide a product from the 2, 3, 4, 5, or 10 tables by its factor.',
      difficulty: 1,
      fluencyTargetSeconds: 10,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['division_remainder_confusion', 'division_as_repeated_subtraction_error'],
    },
    {
      name: 'Word-Context Sharing',
      description: 'Solve a sharing word problem using division within the tables.',
      difficulty: 2,
      fluencyTargetSeconds: 14,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['division_remainder_confusion', 'commutative_for_division_error'],
    },
    {
      name: 'Missing Dividend',
      description: 'Find the missing dividend: ? / 5 = 6.',
      difficulty: 2,
      fluencyTargetSeconds: 12,
      answerType: 'numeric',
      mentalMathEligible: true,
      misconceptionTags: ['division_as_repeated_subtraction_error', 'commutative_for_division_error'],
    },
  ],
};

export const p2MulDivQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);

const familyById = new Map(p2MulDivQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p2MulDivQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p2MulDivQuestionFamilies]; }

export function getQuestionFamilyCountsBySkill() {
  return p2MulDivSkillGraph.skillIds.reduce((acc, id) => { acc[id] = getQuestionFamiliesBySkill(id).length; return acc; }, {});
}

export function validateP2MulDivQuestionFamilies() {
  const ids = p2MulDivQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p2MulDivQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const missing = Object.entries(coverage).filter(([, c]) => c === 0).map(([id]) => id);
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Some question families reference invalid skill IDs.');
  if (missing.length) errors.push('Some skills have no question families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p2MulDivQuestionFamilies.length, familiesPerSkill: coverage, summary: { duplicateIds: [...new Set(dupes)], invalidSkillRefs: badRefs, missingSkillCoverage: missing }, errors };
}

export default {
  domainId: 'p2-muldiv',
  version: '1.0.0',
  totalSkills: p2MulDivSkillGraph.skillIds.length,
  totalQuestionFamilies: p2MulDivQuestionFamilies.length,
  families: p2MulDivQuestionFamilies,
};
