import { getInterventionForMisconception, listMisconceptionInterventions } from './misconceptionInterventionMap.js';
import { getVisualModelMetadata, normalizeVisualType } from './visualModelRegistry.js';

const EXAMPLE_BANK = {
  adds_denominators_directly: {
    incorrectMethod: '1/2 + 1/3 = 2/5',
    whyIncorrect: 'The denominators show the size of the parts. Halves and thirds are not the same-sized parts, so the denominators should not be added.',
    correctMethod: 'Rename both fractions into sixths: 1/2 = 3/6 and 1/3 = 2/6, so 3/6 + 2/6 = 5/6.',
    visualExplanation: 'Use fraction strips to show that the two fractions must be split into the same-sized sixths before adding.',
    keyTakeaway: 'Add only same-sized fraction parts. Find a common denominator first.',
  },
  subtracts_denominators_directly: {
    incorrectMethod: '5/8 - 2/8 = 3/0 or 3/6',
    whyIncorrect: 'The denominator names the part size. When the parts are already eighths, the part size stays as eighths.',
    correctMethod: 'Subtract the numerators and keep the denominator: 5/8 - 2/8 = 3/8.',
    visualExplanation: 'Use a shaded fraction strip with 5 eighths and remove 2 eighths.',
    keyTakeaway: 'Subtract same-sized parts; do not subtract the denominator.',
  },
  common_denominator_missing: {
    incorrectMethod: '1/2 + 1/4 = 2/6',
    whyIncorrect: 'The fractions are in different-sized parts, so they cannot be combined directly.',
    correctMethod: 'Rename 1/2 as 2/4, then 2/4 + 1/4 = 3/4.',
    visualExplanation: 'Use fraction strips to line up halves and quarters on the same whole.',
    keyTakeaway: 'Make the denominators the same before adding or subtracting unlike fractions.',
  },
  uses_original_instead_of_remainder: {
    incorrectMethod: 'After using 1/2 of 42, the student finds 1/3 of 42 again.',
    whyIncorrect: 'The phrase “of the remaining” means the whole has changed. The next fraction must be taken from what is left.',
    correctMethod: 'Find half of 42 first: 21 used, 21 left. Then find 1/3 of the remaining 21, which is 7.',
    visualExplanation: 'Use a bar model. Cross out the first used part, then divide only the remaining bar.',
    keyTakeaway: 'When a question says remaining, update the whole before taking the next fraction.',
  },
  numerator_denominator_confusion: {
    incorrectMethod: 'For 2 shaded parts out of 5 equal parts, the student writes 5/2.',
    whyIncorrect: 'The numerator counts selected parts. The denominator counts all equal parts in the whole.',
    correctMethod: 'There are 2 shaded parts out of 5 equal parts, so the fraction is 2/5.',
    visualExplanation: 'Use a shaded model and label “selected parts” above “total equal parts”.',
    keyTakeaway: 'Top number: selected parts. Bottom number: total equal parts.',
  },
  equivalence_scale_error: {
    incorrectMethod: '2/3 = 4/3 or 2/6',
    whyIncorrect: 'Changing only one part changes the value of the fraction.',
    correctMethod: 'Multiply numerator and denominator by the same number: 2/3 = 4/6.',
    visualExplanation: 'Use an area model to show the same shaded amount split into more equal parts.',
    keyTakeaway: 'Equivalent fractions keep the same value by scaling both parts the same way.',
  },
  incorrect_simplification: {
    incorrectMethod: '12/18 = 6/9 and stop.',
    whyIncorrect: '6/9 still has a common factor of 3, so it is not in simplest form.',
    correctMethod: 'Divide 12 and 18 by 6: 12/18 = 2/3.',
    visualExplanation: 'Use grouped factor cards to find the greatest common factor.',
    keyTakeaway: 'Keep simplifying until numerator and denominator have no common factor except 1.',
  },
  mixed_improper_conversion_error: {
    incorrectMethod: '2 1/3 = 6/3',
    whyIncorrect: 'The 2 wholes make 6 thirds, but the extra 1 third was not added.',
    correctMethod: '2 wholes = 6/3. Add 1/3 to get 7/3.',
    visualExplanation: 'Use fraction strips: two full strips of thirds plus one extra third.',
    keyTakeaway: 'Whole groups plus the extra fraction part make the improper fraction.',
  },
  operation_mismatch: {
    incorrectMethod: 'The student adds because two numbers appear in the story.',
    whyIncorrect: 'The operation must match what the story is asking, not just the numbers shown.',
    correctMethod: 'Identify the unknown first, draw the model, then choose the operation from the relationship.',
    visualExplanation: 'Use a bar model with labels for known amount, change, and unknown.',
    keyTakeaway: 'Model the story before choosing an operation.',
  },
  skipped_step: {
    incorrectMethod: 'The student jumps from the first calculation to the final answer.',
    whyIncorrect: 'A multi-step problem needs intermediate quantities. Skipping a step can answer the wrong part of the question.',
    correctMethod: 'Write each step with a label, then check that the final line answers the question asked.',
    visualExplanation: 'Use a labelled bar model and tick off each sentence as it is used.',
    keyTakeaway: 'Label each intermediate value so the final answer matches the question.',
  },
  calculation_error: {
    incorrectMethod: 'The method is correct, but an arithmetic fact is wrong.',
    whyIncorrect: 'A small calculation slip can change a correct method into a wrong answer.',
    correctMethod: 'Redo the arithmetic and estimate whether the answer is reasonable.',
    visualExplanation: 'Use a checking routine: estimate, calculate, compare.',
    keyTakeaway: 'Good method plus careful checking leads to reliable answers.',
  },
};

const VISUAL_BY_INTERVENTION = [
  [/bar|remainder|story|model_method|working_scaffold|quantity/, 'bar_model'],
  [/number_line|compare/, 'number_line'],
  [/strip|common_denominator|mixed|improper|equivalent|same_denominator/, 'fraction_strip'],
  [/visual_fraction|area|shade|equal_parts|notation/, 'shaded_fraction_model'],
  [/picture|part_whole/, 'picture_model'],
];

function visualTypeFor(intervention = {}) {
  const source = `${intervention.interventionType || ''} ${(intervention.guidedPracticeSequence || []).join(' ')}`;
  const match = VISUAL_BY_INTERVENTION.find(([pattern]) => pattern.test(source));
  return normalizeVisualType(match?.[1] || 'fraction_strip');
}

function genericExample(intervention = {}) {
  const [why = 'why the answer is wrong', method = 'correct method', trap = 'common trap'] = intervention.workedExampleFocus || [];
  return {
    incorrectMethod: `This mistake usually happens when a student follows the ${trap} without checking the fraction meaning.`,
    whyIncorrect: `The issue is ${why}. The answer can look reasonable, but it does not match the mathematical relationship.`,
    correctMethod: `Use the ${method}. Work one clear step at a time and keep the whole, parts, and operation labelled.`,
    visualExplanation: `Use a ${visualTypeFor(intervention).replace(/_/g, ' ')} to make the quantities visible before calculating.`,
    keyTakeaway: 'Use the model to understand the relationship first, then calculate.',
  };
}

export function generateWorkedExample(misconceptionId = '') {
  const intervention = getInterventionForMisconception(misconceptionId);
  if (!intervention) return null;
  const visualModelType = visualTypeFor(intervention);
  const visualModel = getVisualModelMetadata(visualModelType);
  const example = EXAMPLE_BANK[intervention.misconceptionId] || genericExample(intervention);

  return {
    misconceptionId: intervention.misconceptionId,
    title: intervention.misconceptionName,
    explanation: intervention.description,
    interventionType: intervention.interventionType,
    visualModelType,
    visualModel,
    workedExample: example,
    guidedPracticeSequence: intervention.guidedPracticeSequence,
    independentPracticePrompt: 'Try the next questions without hints. Check each step against the model.',
    recheckStrategy: intervention.recheckStrategy,
    studentExplanation: `${intervention.misconceptionName}: this pack helps you understand the method, practise it with support, then check it again in a recheck.`,
  };
}

export function listWorkedExamples() {
  return listMisconceptionInterventions().map((row) => generateWorkedExample(row.misconceptionId));
}

export default {
  generateWorkedExample,
  listWorkedExamples,
};
