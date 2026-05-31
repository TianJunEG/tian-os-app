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
  normalizeCurriculum,
  getSkillCurriculumMapping,
  getSkillsByCountryCurriculumLevel,
  getPrerequisiteSkills,
  getVisibleSkillsForStudentLevel,
  getRemediationSkillsForWeakPrerequisites,
  getCurriculumCoverageSummary,
} from './curriculumMappingSelectors.js';
