export const MISCONCEPTION_REGISTRY_VERSION = 'mathpath-misconception-registry-v1';

export const MATHPATH_MISCONCEPTIONS = Object.freeze([
  {
    misconceptionId: 'equal_parts_missing',
    misconceptionName: 'Equal parts not recognised',
    description: 'Student treats unequal partitions as valid fraction parts.',
    evidencePatterns: [/unequal parts/i, /not equal/i, /different size/i],
    recommendedInterventions: ['CONCEPT_REVIEW', 'VISUAL_MODEL', 'TARGETED_PRACTICE'],
  },
  {
    misconceptionId: 'numerator_denominator_confusion',
    misconceptionName: 'Numerator and denominator confusion',
    description: 'Student swaps or misinterprets numerator and denominator roles.',
    evidencePatterns: [/revers/i, /denominator.*top/i, /top.*bottom/i, /numerator.*denominator/i],
    recommendedInterventions: ['VISUAL_MODEL', 'GUIDED_EXAMPLE', 'TARGETED_PRACTICE'],
  },
  {
    misconceptionId: 'whole_number_thinking',
    misconceptionName: 'Whole-number thinking',
    description: 'Student compares or operates on fraction parts as isolated whole numbers.',
    evidencePatterns: [/whole number/i, /larger number/i, /\b\d+\s*>\s*\d+/],
    recommendedInterventions: ['CONCEPT_REVIEW', 'NUMBER_LINE', 'TARGETED_PRACTICE'],
  },
  {
    misconceptionId: 'compares_denominators_only',
    misconceptionName: 'Compares denominators only',
    description: 'Student assumes the fraction with the larger denominator is larger.',
    evidencePatterns: [/bigger denominator/i, /larger denominator/i, /bottom number/i],
    recommendedInterventions: ['NUMBER_LINE', 'VISUAL_MODEL', 'TARGETED_PRACTICE'],
  },
  {
    misconceptionId: 'compares_numerators_only',
    misconceptionName: 'Compares numerators only',
    description: 'Student compares numerators without considering denominator or whole size.',
    evidencePatterns: [/bigger numerator/i, /larger numerator/i, /top number/i],
    recommendedInterventions: ['VISUAL_MODEL', 'COMMON_DENOMINATOR_GUIDE', 'TARGETED_PRACTICE'],
  },
  {
    misconceptionId: 'equivalence_scale_error',
    misconceptionName: 'Equivalent fraction scaling error',
    description: 'Student changes numerator and denominator inconsistently when generating equivalent fractions.',
    evidencePatterns: [/equivalent/i, /same value/i, /scale/i, /multiply.*only/i, /divide.*only/i],
    recommendedInterventions: ['GUIDED_EXAMPLE', 'AREA_MODEL', 'TARGETED_PRACTICE'],
  },
  {
    misconceptionId: 'incorrect_simplification',
    misconceptionName: 'Incorrect simplification',
    description: 'Student simplifies using an invalid common factor or only changes one part of the fraction.',
    evidencePatterns: [/simpl/i, /lowest terms/i, /divide/i, /common factor/i],
    recommendedInterventions: ['GUIDED_EXAMPLE', 'FACTOR_REVIEW', 'TARGETED_PRACTICE'],
  },
  {
    misconceptionId: 'mixed_improper_conversion_error',
    misconceptionName: 'Mixed and improper conversion error',
    description: 'Student misapplies whole-number conversion between mixed numbers and improper fractions.',
    evidencePatterns: [/mixed number/i, /improper fraction/i, /convert/i, /whole.*denominator/i],
    recommendedInterventions: ['VISUAL_MODEL', 'GUIDED_EXAMPLE', 'TARGETED_PRACTICE'],
  },
  {
    misconceptionId: 'adds_denominators_directly',
    misconceptionName: 'Adds denominators directly',
    description: 'Student adds denominators when adding fractions instead of using a common denominator.',
    evidencePatterns: [/\b\d+\s*\/\s*\d+\s*\+\s*\d+\s*\/\s*\d+\s*=\s*\d+\s*\/\s*\d+/i, /add.*denominator/i],
    recommendedInterventions: ['COMMON_DENOMINATOR_GUIDE', 'GUIDED_EXAMPLE', 'TARGETED_PRACTICE'],
  },
  {
    misconceptionId: 'subtracts_denominators_directly',
    misconceptionName: 'Subtracts denominators directly',
    description: 'Student subtracts denominators when subtracting fractions instead of preserving or converting denominators.',
    evidencePatterns: [/\b\d+\s*\/\s*\d+\s*-\s*\d+\s*\/\s*\d+\s*=\s*\d+\s*\/\s*\d+/i, /subtract.*denominator/i],
    recommendedInterventions: ['COMMON_DENOMINATOR_GUIDE', 'GUIDED_EXAMPLE', 'TARGETED_PRACTICE'],
  },
  {
    misconceptionId: 'common_denominator_missing',
    misconceptionName: 'Common denominator missing',
    description: 'Student combines unlike fractions without converting to a common denominator.',
    evidencePatterns: [/common denominator/i, /same denominator/i, /unlike denominator/i],
    recommendedInterventions: ['COMMON_DENOMINATOR_GUIDE', 'FLUENCY', 'TARGETED_PRACTICE'],
  },
  {
    misconceptionId: 'regrouping_with_mixed_numbers_error',
    misconceptionName: 'Mixed-number regrouping error',
    description: 'Student cannot regroup a whole into fractional parts during mixed-number operations.',
    evidencePatterns: [/regroup/i, /borrow/i, /mixed number/i],
    recommendedInterventions: ['GUIDED_EXAMPLE', 'BAR_MODEL', 'TARGETED_PRACTICE'],
  },
  {
    misconceptionId: 'fraction_of_quantity_whole_error',
    misconceptionName: 'Fraction of quantity whole error',
    description: 'Student uses the wrong whole when finding a fraction of a quantity.',
    evidencePatterns: [/fraction of/i, /of the/i, /whole/i, /quantity/i],
    recommendedInterventions: ['BAR_MODEL', 'GUIDED_EXAMPLE', 'TARGETED_PRACTICE'],
  },
  {
    misconceptionId: 'uses_original_instead_of_remainder',
    misconceptionName: 'Uses original whole instead of remainder',
    description: 'Student applies the next fraction to the original amount instead of the remaining amount.',
    evidencePatterns: [/remainder/i, /remaining/i, /left/i, /then/i],
    recommendedInterventions: ['BAR_MODEL', 'STORY_MODE', 'TARGETED_PRACTICE'],
  },
  {
    misconceptionId: 'did_not_work_backwards',
    misconceptionName: 'Did not work backwards',
    description: 'Student works forwards when the known value represents a final or remaining amount.',
    evidencePatterns: [/at first/i, /before/i, /work backwards/i, /left/i],
    recommendedInterventions: ['STORY_MODE', 'BAR_MODEL', 'GUIDED_EXAMPLE'],
  },
  {
    misconceptionId: 'operation_mismatch',
    misconceptionName: 'Operation mismatch',
    description: 'Student selects an operation that does not match the story context.',
    evidencePatterns: [/wrong operation/i, /add instead/i, /subtract instead/i, /multiply instead/i, /divide instead/i],
    recommendedInterventions: ['STORY_MODE', 'MODEL_DRAWING', 'TARGETED_PRACTICE'],
  },
  {
    misconceptionId: 'skipped_step',
    misconceptionName: 'Skipped step',
    description: 'Student omits an intermediate step needed for a multi-step problem.',
    evidencePatterns: [/missing step/i, /skipped step/i, /jump/i],
    recommendedInterventions: ['WORKING_SCAFFOLD', 'STORY_MODE', 'GUIDED_EXAMPLE'],
  },
  {
    misconceptionId: 'calculation_error',
    misconceptionName: 'Calculation error',
    description: 'Student appears to choose the right method but makes an arithmetic error.',
    evidencePatterns: [/calculation error/i, /arithmetic/i, /careless/i],
    recommendedInterventions: ['FLUENCY', 'CHECKING_ROUTINE', 'TARGETED_PRACTICE'],
  },
]);

const registryById = new Map(MATHPATH_MISCONCEPTIONS.map((item) => [item.misconceptionId, item]));

export function listMisconceptions() {
  return MATHPATH_MISCONCEPTIONS.map((item) => ({
    ...item,
    evidencePatterns: item.evidencePatterns.map((pattern) => String(pattern)),
  }));
}

export function getMisconception(misconceptionId = '') {
  return registryById.get(String(misconceptionId || '')) || null;
}

export function matchMisconceptionsFromText(text = '', options = {}) {
  const input = String(text || '');
  const wrongBoost = options.teacherMarkedCorrect === false || options.answerCorrect === false ? 0.15 : 0;
  const matches = MATHPATH_MISCONCEPTIONS
    .map((misconception) => {
      const matchedPatterns = misconception.evidencePatterns.filter((pattern) => pattern.test(input));
      return matchedPatterns.length ? {
        misconceptionId: misconception.misconceptionId,
        misconceptionName: misconception.misconceptionName,
        description: misconception.description,
        evidence: matchedPatterns.map((pattern) => String(pattern)),
        recommendedInterventions: misconception.recommendedInterventions,
      } : null;
    })
    .filter(Boolean);
  return {
    misconceptionTags: matches.map((match) => match.misconceptionId),
    misconceptions: matches,
    confidence: matches.length ? Math.min(0.95, 0.4 + matches.length * 0.14 + wrongBoost) : 0,
  };
}

export default {
  MISCONCEPTION_REGISTRY_VERSION,
  listMisconceptions,
  getMisconception,
  matchMisconceptionsFromText,
};
