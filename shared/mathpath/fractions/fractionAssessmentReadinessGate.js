import { getQuestionFamiliesBySkill } from './fractionQuestionFamilies.js';
import { fractionSkillGraph } from './fractionSkillGraph.js';

export const FRACTIONS_ASSESSMENT_BLUEPRINT = [
  { key: 'recognition', label: 'Recognition', weight: 20, skillIds: ['F001', 'F002', 'F003', 'F004', 'F005'] },
  { key: 'conversion_mixed_numbers', label: 'Conversion / Mixed Numbers', weight: 20, skillIds: ['F013', 'F014', 'F015'] },
  { key: 'operations', label: 'Operations', weight: 30, skillIds: ['F016', 'F017', 'F018', 'F019', 'F020', 'F021', 'F022'] },
  { key: 'word_problems', label: 'Word Problems', weight: 20, skillIds: ['F023', 'F024', 'F025'] },
  { key: 'reasoning_model_drawing', label: 'Reasoning / Model Drawing', weight: 10, skillIds: ['F026'] },
];

const BLUEPRINT_BY_SKILL = FRACTIONS_ASSESSMENT_BLUEPRINT.reduce((acc, row) => {
  row.skillIds.forEach((skillId) => {
    acc[skillId] = row.key;
  });
  return acc;
}, {});

export const ASSESSMENT_LOCK_MESSAGE = 'Mastery Check will unlock after more skills are completed.';
export const ASSESSMENT_NOT_READY_MESSAGE = 'Assessment is not ready yet. Continue practice first.';

const MIN_COMPLETED_SKILLS_FOR_MASTERY_CHECK = 18;
const MIN_MEDIUM_HARD_FAMILIES = 12;

function normalizeSkillIds(rows = []) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => (typeof row === 'string' ? row : row?.skillId || row?.id))
    .filter(Boolean)
    .map((id) => String(id).toUpperCase());
}

export function assessmentQuestionTypeForSkill(skillId = '') {
  return BLUEPRINT_BY_SKILL[String(skillId || '').toUpperCase()] || 'practice';
}

export function isAssessmentEligibleFamily(skillId = '', family = {}, difficulty = family?.difficulty) {
  const normalizedSkillId = String(skillId || family?.skillId || '').toUpperCase();
  if (!BLUEPRINT_BY_SKILL[normalizedSkillId]) return false;
  if (family?.assessmentRelevant === false) return false;

  const level = Number(difficulty ?? family?.difficulty ?? 1);
  const questionType = assessmentQuestionTypeForSkill(normalizedSkillId);
  if (questionType === 'recognition') return level >= 2;
  return level >= 3;
}

export function buildFractionAssessmentMetadata({ skillId, family = {}, difficulty, mode = 'practice', singaporeLevel = 'P5' } = {}) {
  const questionType = assessmentQuestionTypeForSkill(skillId || family?.skillId);
  const assessmentEligible = mode === 'assessment'
    ? isAssessmentEligibleFamily(skillId || family?.skillId, family, difficulty)
    : isAssessmentEligibleFamily(skillId || family?.skillId, family, difficulty);

  return {
    moeLevel: singaporeLevel,
    questionType,
    assessmentEligible,
  };
}

export function getFractionAssessmentBlueprintReadiness(options = {}) {
  const {
    completedSkillIds = [],
    masteredSkillIds = [],
    level = 'P5',
    requireStudentReadiness = true,
  } = options;

  const completed = new Set([...normalizeSkillIds(completedSkillIds), ...normalizeSkillIds(masteredSkillIds)]);
  const completedCount = completed.size;
  const eligibleFamilies = fractionSkillGraph.skillIds.flatMap((skillId) =>
    getQuestionFamiliesBySkill(skillId).filter((family) => isAssessmentEligibleFamily(skillId, family))
  );
  const mediumHardFamilies = eligibleFamilies.filter((family) => Number(family.difficulty || 1) >= 3);
  const blueprintCoverage = FRACTIONS_ASSESSMENT_BLUEPRINT.map((row) => {
    const families = eligibleFamilies.filter((family) => row.skillIds.includes(family.skillId));
    return {
      ...row,
      availableFamilies: families.length,
      availableMediumHardFamilies: families.filter((family) => Number(family.difficulty || 1) >= 3).length,
    };
  });

  const missingBlueprintSections = blueprintCoverage
    .filter((row) => row.availableFamilies === 0)
    .map((row) => row.label);
  const hasMixedDifficulty = eligibleFamilies.some((family) => Number(family.difficulty || 1) === 3)
    && eligibleFamilies.some((family) => Number(family.difficulty || 1) >= 4);
  const hasAssessmentQualityQuestions = mediumHardFamilies.length >= MIN_MEDIUM_HARD_FAMILIES
    && missingBlueprintSections.length === 0
    && hasMixedDifficulty;
  const studentHasPrerequisites = !requireStudentReadiness || completedCount >= MIN_COMPLETED_SKILLS_FOR_MASTERY_CHECK;
  const ready = hasAssessmentQualityQuestions && studentHasPrerequisites;

  return {
    ready,
    level,
    message: ready ? 'Assessment is ready.' : (studentHasPrerequisites ? ASSESSMENT_NOT_READY_MESSAGE : ASSESSMENT_LOCK_MESSAGE),
    completedSkillCount: completedCount,
    requiredCompletedSkillCount: MIN_COMPLETED_SKILLS_FOR_MASTERY_CHECK,
    hasAssessmentQualityQuestions,
    hasMixedDifficulty,
    usableQuestionFamilyCount: eligibleFamilies.length,
    mediumHardQuestionFamilyCount: mediumHardFamilies.length,
    missingBlueprintSections,
    blueprint: blueprintCoverage,
  };
}
