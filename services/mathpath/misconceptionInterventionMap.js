import { getMisconception, listMisconceptions } from './misconceptionRegistry.js';

export const MISCONCEPTION_INTERVENTION_MAP_VERSION = 'mathpath-misconception-intervention-map-v1';

const DEFAULT_GUIDED_SEQUENCE = [
  'visual_understanding',
  'worked_example',
  'guided_practice',
  'independent_practice',
  'recheck',
];

export const MISCONCEPTION_INTERVENTION_MAP = Object.freeze({
  equal_parts_missing: {
    interventionType: 'visual_fraction_model',
    worksheetType: 'recovery_worksheet',
    guidedPracticeSequence: ['equal_parts_model', 'shade_and_name', 'guided_practice', 'recheck'],
    recheckStrategy: 'recognition_with_new_shape',
    workedExampleFocus: ['why unequal parts are not fractions', 'how to identify the whole', 'common trap: counting pieces only'],
  },
  numerator_denominator_confusion: {
    interventionType: 'notation_concept_review',
    worksheetType: 'recovery_worksheet',
    guidedPracticeSequence: ['part_whole_cards', 'worked_example', 'guided_practice', 'independent_practice', 'recheck'],
    recheckStrategy: 'notation_role_transfer',
    workedExampleFocus: ['what numerator tells', 'what denominator tells', 'common trap: reversing top and bottom'],
  },
  whole_number_thinking: {
    interventionType: 'number_line_visual_model',
    worksheetType: 'recovery_worksheet',
    guidedPracticeSequence: ['fraction_strip_compare', 'number_line_compare', 'guided_practice', 'recheck'],
    recheckStrategy: 'comparison_with_visual_reasoning',
    workedExampleFocus: ['fraction size is not whole-number size', 'same whole matters', 'common trap: bigger denominator means bigger fraction'],
  },
  compares_denominators_only: {
    interventionType: 'fraction_strip_comparison',
    worksheetType: 'recovery_worksheet',
    guidedPracticeSequence: ['unit_fraction_model', 'compare_same_numerator', 'guided_practice', 'recheck'],
    recheckStrategy: 'same_numerator_comparison',
    workedExampleFocus: ['larger denominator means smaller equal parts', 'use fraction strips', 'common trap: picking larger denominator'],
  },
  compares_numerators_only: {
    interventionType: 'same_denominator_reasoning',
    worksheetType: 'recovery_worksheet',
    guidedPracticeSequence: ['same_denominator_model', 'common_denominator_intro', 'guided_practice', 'recheck'],
    recheckStrategy: 'comparison_strategy_selection',
    workedExampleFocus: ['same-sized parts can compare numerators', 'unlike denominators need a strategy', 'common trap: comparing top numbers only'],
  },
  equivalence_scale_error: {
    interventionType: 'equivalent_fraction_model',
    worksheetType: 'recovery_worksheet',
    guidedPracticeSequence: ['area_model', 'scale_both_parts', 'guided_equivalence', 'independent_practice', 'recheck'],
    recheckStrategy: 'generate_equivalent_fraction_with_reason',
    workedExampleFocus: ['multiply numerator and denominator by same number', 'same value different parts', 'common trap: scaling only one number'],
  },
  incorrect_simplification: {
    interventionType: 'factor_review',
    worksheetType: 'recovery_worksheet',
    guidedPracticeSequence: ['common_factor_review', 'worked_example', 'guided_simplification', 'fluency', 'recheck'],
    recheckStrategy: 'simplify_and_check_lowest_terms',
    workedExampleFocus: ['divide both parts by same factor', 'check for another common factor', 'common trap: subtracting instead of dividing'],
  },
  mixed_improper_conversion_error: {
    interventionType: 'mixed_improper_visual_model',
    worksheetType: 'recovery_worksheet',
    guidedPracticeSequence: ['whole_groups_model', 'worked_conversion', 'guided_practice', 'independent_practice', 'recheck'],
    recheckStrategy: 'convert_both_directions',
    workedExampleFocus: ['whole groups of denominator size', 'quotient and remainder meaning', 'common trap: changing denominator'],
  },
  adds_denominators_directly: {
    interventionType: 'common_denominator_visual_model',
    worksheetType: 'recovery_worksheet',
    guidedPracticeSequence: ['fraction_strip_common_parts', 'worked_example', 'guided_unlike_denominator_addition', 'independent_practice', 'recheck'],
    recheckStrategy: 'unlike_denominator_addition_with_same_error_probe',
    workedExampleFocus: ['why denominators are not added', 'rename to same-sized parts', 'common trap: 1/2 + 1/3 = 2/5'],
  },
  subtracts_denominators_directly: {
    interventionType: 'common_denominator_visual_model',
    worksheetType: 'recovery_worksheet',
    guidedPracticeSequence: ['same_part_size_model', 'worked_example', 'guided_unlike_denominator_subtraction', 'independent_practice', 'recheck'],
    recheckStrategy: 'subtraction_with_denominator_error_probe',
    workedExampleFocus: ['why denominators stay or are renamed', 'subtract same-sized parts only', 'common trap: subtracting bottom numbers'],
  },
  common_denominator_missing: {
    interventionType: 'common_denominator_guide',
    worksheetType: 'recovery_worksheet',
    guidedPracticeSequence: ['find_common_multiple', 'rename_fractions', 'guided_practice', 'fluency', 'recheck'],
    recheckStrategy: 'unlike_denominator_operation',
    workedExampleFocus: ['find same-sized parts first', 'scale numerator too', 'common trap: leaving numerators unchanged'],
  },
  regrouping_with_mixed_numbers_error: {
    interventionType: 'mixed_number_regrouping_model',
    worksheetType: 'tutor_lesson_worksheet',
    guidedPracticeSequence: ['regroup_whole_as_fraction', 'worked_example', 'guided_subtraction', 'independent_practice', 'recheck'],
    recheckStrategy: 'mixed_number_subtraction_with_regrouping',
    workedExampleFocus: ['one whole can become denominator parts', 'preserve total value', 'common trap: borrowing without equivalence'],
  },
  fraction_of_quantity_whole_error: {
    interventionType: 'bar_model_quantity',
    worksheetType: 'recovery_worksheet',
    guidedPracticeSequence: ['identify_whole', 'unit_fraction_value', 'non_unit_fraction_value', 'guided_practice', 'recheck'],
    recheckStrategy: 'fraction_of_quantity_with_context_units',
    workedExampleFocus: ['which amount is the whole', 'divide then multiply', 'common trap: using wrong total'],
  },
  uses_original_instead_of_remainder: {
    interventionType: 'bar_model_remainder',
    worksheetType: 'tutor_lesson_worksheet',
    guidedPracticeSequence: ['identify_removed_amount', 'find_remainder', 'fraction_of_remainder', 'guided_practice', 'recheck'],
    recheckStrategy: 'fraction_of_remainder_transfer',
    workedExampleFocus: ['update the whole after subtraction', 'remaining means new whole', 'common trap: applying fraction to original'],
  },
  did_not_work_backwards: {
    interventionType: 'model_method_work_backwards',
    worksheetType: 'tutor_lesson_worksheet',
    guidedPracticeSequence: ['identify_final_quantity', 'reverse_operation_model', 'worked_example', 'guided_practice', 'recheck'],
    recheckStrategy: 'work_backwards_word_problem',
    workedExampleFocus: ['known value may be final amount', 'reverse the story steps', 'common trap: working forwards from unknown original'],
  },
  operation_mismatch: {
    interventionType: 'story_structure_model',
    worksheetType: 'recovery_worksheet',
    guidedPracticeSequence: ['identify_question_target', 'choose_operation', 'model_drawing', 'guided_practice', 'recheck'],
    recheckStrategy: 'word_problem_operation_selection',
    workedExampleFocus: ['read what is being asked', 'operation comes from structure', 'common trap: calculating before modelling'],
  },
  skipped_step: {
    interventionType: 'working_scaffold',
    worksheetType: 'tutor_lesson_worksheet',
    guidedPracticeSequence: ['label_knowns', 'plan_steps', 'worked_example', 'guided_practice', 'recheck'],
    recheckStrategy: 'multi_step_problem_with_step_check',
    workedExampleFocus: ['write each intermediate quantity', 'label the final target', 'common trap: jumping to final answer'],
  },
  calculation_error: {
    interventionType: 'fluency_and_checking_routine',
    worksheetType: 'practice_worksheet',
    guidedPracticeSequence: ['calculation_fluency', 'checking_routine', 'independent_practice', 'recheck'],
    recheckStrategy: 'same_method_new_numbers',
    workedExampleFocus: ['method may be correct but calculation must be checked', 'estimate reasonableness', 'common trap: not reviewing arithmetic'],
  },
});

export function getInterventionForMisconception(misconceptionId = '') {
  const id = String(misconceptionId || '').trim();
  const misconception = getMisconception(id);
  const mapped = MISCONCEPTION_INTERVENTION_MAP[id];
  if (!misconception && !mapped) return null;
  return {
    misconceptionId: id,
    misconceptionName: misconception?.misconceptionName || id,
    description: misconception?.description || '',
    interventionType: mapped?.interventionType || 'targeted_practice',
    worksheetType: mapped?.worksheetType || 'recovery_worksheet',
    guidedPracticeSequence: mapped?.guidedPracticeSequence || DEFAULT_GUIDED_SEQUENCE,
    recheckStrategy: mapped?.recheckStrategy || 'skill_recheck',
    workedExampleFocus: mapped?.workedExampleFocus || ['why the answer is wrong', 'correct method', 'common trap'],
  };
}

export function listMisconceptionInterventions() {
  return listMisconceptions().map((item) => getInterventionForMisconception(item.misconceptionId));
}

export function auditMisconceptionInterventionCoverage() {
  const rows = listMisconceptionInterventions().map((row) => {
    const missing = [
      row.interventionType ? null : 'intervention_type_missing',
      row.worksheetType ? null : 'worksheet_type_missing',
      row.guidedPracticeSequence?.includes('worked_example') || row.workedExampleFocus?.length ? null : 'worked_example_missing',
      row.guidedPracticeSequence?.includes('recheck') || row.recheckStrategy ? null : 'recheck_strategy_missing',
    ].filter(Boolean);
    return {
      ...row,
      coverageStatus: missing.length ? 'partial' : 'ready',
      missing,
    };
  });
  return {
    version: MISCONCEPTION_INTERVENTION_MAP_VERSION,
    misconceptionCount: rows.length,
    mappedCount: rows.filter((row) => row.coverageStatus === 'ready').length,
    missingInterventions: rows.filter((row) => row.missing.length > 0),
    rows,
  };
}

export default {
  MISCONCEPTION_INTERVENTION_MAP_VERSION,
  getInterventionForMisconception,
  listMisconceptionInterventions,
  auditMisconceptionInterventionCoverage,
};
