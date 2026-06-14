export {
  FRACTIONS_PILOT_SCOPE_LABEL,
  FRACTION_CANONICAL_SKILL_ROWS,
  getCanonicalFractionSkill,
  getCanonicalFractionSkillBySlug,
  listCanonicalFractionSkills,
} from './fractionCanonicalSkillMap.js';

export {
  fractionUniversalSkills,
  getUniversalSkillByFrameworkId,
  getUniversalSkillBySkillId,
} from './fractionUniversalSkills.js';

export {
  fractionCurriculumMappings,
  getFractionCurriculumMappingByFrameworkId,
  getFractionCurriculumMappingBySkillId,
  getAvailableFractionCurricula,
  getAvailableFractionLevels,
  fractionCurriculumMeta,
} from './fractionCurriculumMappings.js';

export {
  TOPICS as PRIMARY_MATH_TOPICS,
  SKILLS as PRIMARY_MATH_SKILLS,
  STRANDS,
  QUESTION_TYPES,
  MISCONCEPTION_TAGS,
  getTopicsByLevel,
  getSkillsByTopic,
  getSkillById,
  getTopicById,
  getSkillsByLevel,
  getPrerequisites,
  getPrerequisiteTree,
  getExamPrepTopics,
  getWeaknessDrillSkills,
  getSkillByFractionsAlias,
  getTopicsByStrand,
  getAllLevels,
  getTaxonomyStats,
} from './primaryMathTaxonomy.js';

export {
  getGeneratorSkillIds,
  getGeneratorFile,
  hasCoverage,
  getCoverageStats,
} from './taxonomyGeneratorMap.js';

export {
  normalizeCurriculum,
  getSkillCurriculumMapping,
  getSkillsByCountryCurriculumLevel,
  getPrerequisiteSkills,
  getVisibleSkillsForStudentLevel,
  getRemediationSkillsForWeakPrerequisites,
  getCurriculumCoverageSummary,
} from './curriculumMappingSelectors.js';
