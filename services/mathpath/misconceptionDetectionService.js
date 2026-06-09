import { getMisconception, matchMisconceptionsFromText } from './misconceptionRegistry.js';

const LEGACY_TAG_ALIASES = {
  adds_denominators_directly: 'fraction_add_denominators_directly',
  numerator_denominator_confusion: 'numerator_denominator_reversed',
};

const PARENT_EXPLANATIONS = {
  equal_parts_missing: 'We noticed your child sometimes counts pieces that are not the same size as if they were equal. Fractions only work when every piece is the same size.',
  numerator_denominator_confusion: 'Your child sometimes swaps the top and bottom numbers of a fraction. The top number counts how many parts are selected, and the bottom number tells how many equal parts make up one whole.',
  whole_number_thinking: 'Your child is sometimes comparing fractions by looking at the numbers on top and bottom separately, the way we compare whole numbers. With fractions, the size of each piece matters as much as how many pieces there are.',
  compares_denominators_only: 'Your child sometimes assumes the fraction with the bigger bottom number is bigger. Actually, a bigger denominator means each piece is smaller.',
  compares_numerators_only: 'Your child sometimes compares only the top numbers without checking if the parts are the same size. Fractions with different denominators need to be renamed first.',
  equivalence_scale_error: 'When making equivalent fractions, your child sometimes changes only the top or bottom number. Both must be multiplied or divided by the same number to keep the value the same.',
  incorrect_simplification: 'Your child is not always simplifying fractions completely. Encourage checking for common factors until no more exist.',
  mixed_improper_conversion_error: 'We noticed difficulty converting between mixed numbers and improper fractions. For example, to convert 2 1/3, first multiply 2 × 3 = 6 thirds, then add the extra 1 third to get 7/3.',
  adds_denominators_directly: 'Your child sometimes adds the bottom numbers when adding fractions. The denominators name the part size — they should stay the same or be renamed to a common size.',
  subtracts_denominators_directly: 'Your child sometimes subtracts the bottom numbers when subtracting fractions. The denominator stays the same when the parts are already the same size.',
  common_denominator_missing: 'Your child is combining fractions that have different-sized parts without first making the parts the same size. Drawing fraction strips of the same length can help show this.',
  regrouping_with_mixed_numbers_error: 'Your child finds it tricky to borrow from the whole-number part during mixed-number subtraction. Practising with fraction strips helps make this concrete.',
  fraction_of_quantity_whole_error: 'When finding a fraction of a quantity, your child sometimes uses the wrong total. Drawing a bar model and labelling the whole first can help.',
  uses_original_instead_of_remainder: 'In multi-step problems, your child sometimes applies the next fraction to the original total instead of what remains. A bar model with the used part crossed out helps.',
  did_not_work_backwards: 'Your child sometimes works forwards when the question gives the final amount and asks for the original. Reversing the story steps with a model can help.',
  operation_mismatch: 'Your child sometimes picks the wrong operation for a word problem. Drawing a model of the story before choosing add, subtract, multiply, or divide helps match the operation to the situation.',
  skipped_step: 'Your child sometimes skips an intermediate step in multi-step problems. Labelling each step with what it represents helps ensure the final answer matches the question.',
  calculation_error: 'Your child understands the method but is making small arithmetic mistakes. Encourage a quick estimation check to see if the answer is reasonable.',
  wrong_whole_identified: 'Your child sometimes counts the number of shapes instead of the number of equal parts per shape when writing the denominator. The denominator should be the number of equal parts in one whole.',
  improper_fraction_conversion_error: 'When converting improper fractions to mixed numbers, your child sometimes gets the remainder wrong. Practising division with fraction strips can help.',
  answer_form_mismatch: 'Your child sometimes gives the right value but in the wrong form — for example, an improper fraction when the question asks for a mixed number. Reading the question carefully before answering helps.',
  number_line_partition_error: 'Your child sometimes miscounts tick marks on a number line. Counting the spaces between marks, not the marks themselves, gives the correct position.',
};

function classifyConfidence(score) {
  if (score >= 0.75) return 'high';
  if (score >= 0.5) return 'moderate';
  return 'limited';
}

export function detectMisconceptions({ questionText = '', studentAnswer = '', teacherMarkedCorrect = null } = {}) {
  const text = `${questionText}\n${studentAnswer}`;
  const result = matchMisconceptionsFromText(text, { teacherMarkedCorrect });
  const misconceptionTags = [
    ...result.misconceptionTags,
    ...result.misconceptionTags.map((tag) => LEGACY_TAG_ALIASES[tag]).filter(Boolean),
  ];
  return {
    misconceptionTags: [...new Set(misconceptionTags)],
    misconceptionEvidence: result.misconceptions.map((match) => match.description),
    misconceptionDetails: result.misconceptions.map((match) => ({
      ...match,
      registryEntry: getMisconception(match.misconceptionId),
      confidenceLevel: classifyConfidence(result.confidence),
      parentExplanation: PARENT_EXPLANATIONS[match.misconceptionId] || null,
    })),
    confidence: result.confidence,
    confidenceLevel: classifyConfidence(result.confidence),
  };
}

export function getParentExplanation(misconceptionId = '') {
  return PARENT_EXPLANATIONS[String(misconceptionId || '')] || null;
}

export function classifyMisconceptionConfidence(score) {
  return classifyConfidence(score);
}

export default { detectMisconceptions, getParentExplanation, classifyMisconceptionConfidence };
