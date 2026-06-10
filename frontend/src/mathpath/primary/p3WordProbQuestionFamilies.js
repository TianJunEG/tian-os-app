import { p3WordProbSkillGraph } from './p3WordProbSkillGraph.js';

const SKILL_IDS = new Set(p3WordProbSkillGraph.skillIds);

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
    workingRequired: config.workingRequired ?? true,
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
  'P3-WP-01': [
    {
      name: 'Share Equally (exact)',
      description: 'Divide a total into equal groups with no remainder.',
      difficulty: 2,
      fluencyTargetSeconds: 30,
      answerType: 'numeric',
      misconceptionTags: ['wrong_operation_choice', 'misreads_question'],
    },
    {
      name: 'Share Equally (with remainder)',
      description: 'Divide a total into equal groups and interpret the remainder.',
      difficulty: 3,
      fluencyTargetSeconds: 36,
      answerType: 'numeric',
      misconceptionTags: ['wrong_operation_choice', 'remainder_in_context'],
    },
    {
      name: 'How Many Groups?',
      description: 'Given a total and group size, find how many groups can be formed.',
      difficulty: 3,
      fluencyTargetSeconds: 36,
      answerType: 'numeric',
      misconceptionTags: ['wrong_operation_choice', 'misreads_question'],
    },
  ],
  'P3-WP-02': [
    {
      name: 'Two-Step: Subtract Twice',
      description: 'Start with a total, subtract two amounts, find what remains.',
      difficulty: 3,
      fluencyTargetSeconds: 44,
      answerType: 'numeric',
      misconceptionTags: ['stops_after_one_step', 'wrong_operation_choice'],
    },
    {
      name: 'Two-Step: Add then Subtract',
      description: 'Find a total first (add), then subtract to find how much is left or the difference.',
      difficulty: 3,
      fluencyTargetSeconds: 48,
      answerType: 'numeric',
      misconceptionTags: ['stops_after_one_step', 'wrong_operation_choice'],
    },
    {
      name: 'Two-Step: Multiply then Subtract',
      description: 'Find a product first, then subtract from a given total.',
      difficulty: 4,
      fluencyTargetSeconds: 50,
      answerType: 'numeric',
      misconceptionTags: ['stops_after_one_step', 'wrong_operation_choice', 'misreads_question'],
    },
  ],
};

export const p3WordProbQuestionFamilies = Object.entries(familiesBySkillBlueprint).flatMap(
  ([skillId, defs]) => defs.map((def, i) => buildFamily(skillId, i + 1, def))
);

const familyById = new Map(p3WordProbQuestionFamilies.map((f) => [f.id, f]));

export function getQuestionFamily(id) { return familyById.get(id) || null; }
export function getQuestionFamiliesBySkill(skillId) { return p3WordProbQuestionFamilies.filter((f) => f.skillId === skillId); }
export function getAllQuestionFamilies() { return [...p3WordProbQuestionFamilies]; }

export function getQuestionFamilyCountsBySkill() {
  return p3WordProbSkillGraph.skillIds.reduce((acc, id) => { acc[id] = getQuestionFamiliesBySkill(id).length; return acc; }, {});
}

export function validateP3WordProbQuestionFamilies() {
  const ids = p3WordProbQuestionFamilies.map((f) => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badRefs = p3WordProbQuestionFamilies.filter((f) => !SKILL_IDS.has(f.skillId)).map((f) => ({ familyId: f.id, skillId: f.skillId }));
  const coverage = getQuestionFamilyCountsBySkill();
  const missing = Object.entries(coverage).filter(([, c]) => c === 0).map(([id]) => id);
  const errors = [];
  if (dupes.length) errors.push('Duplicate question family IDs found.');
  if (badRefs.length) errors.push('Some question families reference invalid skill IDs.');
  if (missing.length) errors.push('Some skills have no question families.');
  return { isValid: errors.length === 0, totalQuestionFamilies: p3WordProbQuestionFamilies.length, familiesPerSkill: coverage, summary: { duplicateIds: [...new Set(dupes)], invalidSkillRefs: badRefs, missingSkillCoverage: missing }, errors };
}

export default {
  domainId: 'p3-word-problems',
  version: '1.0.0',
  totalSkills: p3WordProbSkillGraph.skillIds.length,
  totalQuestionFamilies: p3WordProbQuestionFamilies.length,
  families: p3WordProbQuestionFamilies,
};
