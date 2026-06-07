export const SKILL_MISCONCEPTION_MAP_VERSION = 'mathpath-skill-misconception-map-v1';

export const SKILL_MISCONCEPTION_MAP = Object.freeze([
  { skillId: 'F001', skillName: 'Recognise Fractions', primary: ['equal_parts_missing'], secondary: ['whole_number_thinking'], remediationPriority: 'visual_foundation' },
  { skillId: 'F002', skillName: 'Numerator and Denominator', primary: ['numerator_denominator_confusion'], secondary: ['equal_parts_missing'], remediationPriority: 'notation_foundation' },
  { skillId: 'F003', skillName: 'Fraction of a Whole', primary: ['equal_parts_missing'], secondary: ['numerator_denominator_confusion', 'whole_number_thinking'], remediationPriority: 'visual_foundation' },
  { skillId: 'F004', skillName: 'Unit Fractions', primary: ['compares_denominators_only'], secondary: ['whole_number_thinking'], remediationPriority: 'visual_comparison' },
  { skillId: 'F005', skillName: 'Fractions on Number Line', primary: ['whole_number_thinking'], secondary: ['equal_parts_missing', 'numerator_denominator_confusion'], remediationPriority: 'number_line' },
  { skillId: 'F006', skillName: 'Compare Unit Fractions', primary: ['compares_denominators_only'], secondary: ['whole_number_thinking'], remediationPriority: 'visual_comparison' },
  { skillId: 'F007', skillName: 'Compare Same Denominator', primary: ['compares_numerators_only'], secondary: ['whole_number_thinking'], remediationPriority: 'comparison_reasoning' },
  { skillId: 'F008', skillName: 'Compare Same Numerator', primary: ['compares_denominators_only'], secondary: ['whole_number_thinking'], remediationPriority: 'comparison_reasoning' },
  { skillId: 'F009', skillName: 'Order Fractions', primary: ['compares_denominators_only', 'compares_numerators_only'], secondary: ['common_denominator_missing'], remediationPriority: 'comparison_reasoning' },
  { skillId: 'F010', skillName: 'Equivalent Fractions', primary: ['equivalence_scale_error'], secondary: ['whole_number_thinking'], remediationPriority: 'equivalence_model' },
  { skillId: 'F011', skillName: 'Generate Equivalent Fractions', primary: ['equivalence_scale_error'], secondary: ['numerator_denominator_confusion'], remediationPriority: 'equivalence_model' },
  { skillId: 'F012', skillName: 'Simplify Fractions', primary: ['incorrect_simplification'], secondary: ['equivalence_scale_error'], remediationPriority: 'factor_review' },
  { skillId: 'F013', skillName: 'Improper Fractions', primary: ['whole_number_thinking'], secondary: ['numerator_denominator_confusion'], remediationPriority: 'mixed_improper_model' },
  { skillId: 'F014', skillName: 'Mixed Numbers', primary: ['mixed_improper_conversion_error'], secondary: ['whole_number_thinking'], remediationPriority: 'mixed_improper_model' },
  { skillId: 'F015', skillName: 'Convert Mixed ↔ Improper', primary: ['mixed_improper_conversion_error'], secondary: ['numerator_denominator_confusion', 'calculation_error'], remediationPriority: 'mixed_improper_model' },
  { skillId: 'F016', skillName: 'Add Same Denominator', primary: ['adds_denominators_directly'], secondary: ['numerator_denominator_confusion', 'calculation_error'], remediationPriority: 'like_denominator_operations' },
  { skillId: 'F017', skillName: 'Subtract Same Denominator', primary: ['subtracts_denominators_directly'], secondary: ['numerator_denominator_confusion', 'calculation_error'], remediationPriority: 'like_denominator_operations' },
  { skillId: 'F018', skillName: 'Add Different Denominators', primary: ['common_denominator_missing', 'adds_denominators_directly'], secondary: ['incorrect_simplification', 'calculation_error'], remediationPriority: 'common_denominator_operations' },
  { skillId: 'F019', skillName: 'Subtract Different Denominators', primary: ['common_denominator_missing', 'subtracts_denominators_directly'], secondary: ['regrouping_with_mixed_numbers_error', 'calculation_error'], remediationPriority: 'common_denominator_operations' },
  { skillId: 'F020', skillName: 'Fraction of Quantity', primary: ['fraction_of_quantity_whole_error'], secondary: ['operation_mismatch', 'calculation_error'], remediationPriority: 'quantity_model' },
  { skillId: 'F021', skillName: 'Multiply Fractions', primary: ['operation_mismatch'], secondary: ['incorrect_simplification', 'calculation_error'], remediationPriority: 'operation_meaning' },
  { skillId: 'F022', skillName: 'Divide Fractions', primary: ['operation_mismatch'], secondary: ['mixed_improper_conversion_error', 'calculation_error'], remediationPriority: 'operation_meaning' },
  { skillId: 'F023', skillName: 'Fraction Word Problems', primary: ['operation_mismatch', 'fraction_of_quantity_whole_error'], secondary: ['skipped_step', 'calculation_error'], remediationPriority: 'story_problem_scaffold' },
  { skillId: 'F024', skillName: 'Multi-Step Fraction Problems', primary: ['skipped_step', 'uses_original_instead_of_remainder'], secondary: ['operation_mismatch', 'did_not_work_backwards'], remediationPriority: 'multi_step_scaffold' },
  { skillId: 'F025', skillName: 'Exam-Style Fraction Applications', primary: ['did_not_work_backwards', 'uses_original_instead_of_remainder'], secondary: ['operation_mismatch', 'skipped_step'], remediationPriority: 'exam_application_scaffold' },
  { skillId: 'F026', skillName: 'Fractions Mastery Challenge', primary: ['skipped_step', 'operation_mismatch', 'calculation_error'], secondary: ['did_not_work_backwards', 'common_denominator_missing'], remediationPriority: 'mixed_review' },
]);

const mapBySkillId = new Map(SKILL_MISCONCEPTION_MAP.map((entry) => [entry.skillId, entry]));

export function getSkillMisconceptionEntry(skillId = '') {
  return mapBySkillId.get(String(skillId || '').toUpperCase()) || null;
}

export function listSkillMisconceptionEntries() {
  return SKILL_MISCONCEPTION_MAP.map((entry) => ({
    ...entry,
    primary: [...entry.primary],
    secondary: [...entry.secondary],
  }));
}

export function getMisconceptionsForSkill(skillId = '') {
  const entry = getSkillMisconceptionEntry(skillId);
  if (!entry) return [];
  return [...new Set([...(entry.primary || []), ...(entry.secondary || [])])];
}

export default {
  SKILL_MISCONCEPTION_MAP_VERSION,
  getSkillMisconceptionEntry,
  listSkillMisconceptionEntries,
  getMisconceptionsForSkill,
};
