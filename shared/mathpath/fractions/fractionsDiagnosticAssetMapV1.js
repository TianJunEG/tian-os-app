import { fractionsKnowledgeMapV1 } from './fractionsKnowledgeMapV1.js';
import { fractionsRemediationMapV1 } from './fractionsRemediationMapV1.js';
import {
  DIAGNOSTIC_QUESTION_TYPES,
  buildDiagnosticEntry,
  diagnosticSignalRules,
  normalizeDiagnosticAssetMap,
} from '../knowledge/diagnosticAssetModel.js';
import { getRemediationEntryByMicroSkillId } from '../knowledge/remediationMapModel.js';

const Q = DIAGNOSTIC_QUESTION_TYPES;

function dq(id, type, prompt, expectedAnswer, options = {}) {
  return {
    id,
    type,
    prompt,
    expectedAnswer,
    acceptedAnswerPatterns: options.acceptedAnswerPatterns || [expectedAnswer],
    detectsMisconceptions: options.detectsMisconceptions || [],
    workingRequirementLevel: options.workingRequirementLevel || 'LOW',
    evidenceRules: options.evidenceRules || [],
  };
}

const DIAGNOSTIC_BLUEPRINTS = {
  'fractions.p4.equal_parts_whole': {
    topic: 'fractions.foundations',
    recognition: ['A rectangle is split into 4 equal parts and 1 part is shaded. What fraction is shaded?', '1/4'],
    procedural: ['A shape has 6 equal parts and 2 are shaded. Write the fraction shaded.', '2/6'],
    misconception: ['A shape has 2 shaded parts, 1 unshaded part, and the parts are not equal. Can it be named as a proper fraction of the whole?', 'No'],
  },
  'fractions.p4.numerator_denominator_meaning': {
    topic: 'fractions.foundations',
    recognition: ['In 3/5, which number tells the total equal parts?', '5'],
    procedural: ['A shape has 5 equal parts and 3 are shaded. Write the fraction.', '3/5'],
    misconception: ['A student writes 5/3 for 3 shaded parts out of 5 equal parts. What is the mistake?', 'Numerator and denominator swapped'],
  },
  'fractions.p4.unit_fraction_size': {
    topic: 'fractions.foundations',
    recognition: ['Which is a unit fraction: 1/6 or 3/6?', '1/6'],
    procedural: ['Which is larger: 1/3 or 1/5?', '1/3'],
    misconception: ['A student says 1/8 is larger than 1/4 because 8 is larger than 4. What is wrong?', 'Larger denominator means smaller unit fraction'],
  },
  'fractions.p4.number_line_position': {
    topic: 'fractions.foundations',
    recognition: ['A 0 to 1 number line is split into 4 equal intervals. What fraction is the first interval mark?', '1/4'],
    procedural: ['On a 0 to 1 line split into 5 equal intervals, where is the third mark?', '3/5'],
    misconception: ['A student counts tick marks instead of spaces on a number line. What should they count?', 'Equal intervals'],
  },
  'fractions.p4.recognise_equivalence': {
    topic: 'fractions.equivalence',
    recognition: ['Are 1/2 and 2/4 equivalent?', 'Yes'],
    procedural: ['Which fraction is equivalent to 3/6: 1/2 or 3/5?', '1/2'],
    misconception: ['A student says 2/4 is not equal to 1/2 because the numbers are different. What did they miss?', 'Same value'],
  },
  'fractions.p4.generate_equivalent_fractions': {
    topic: 'fractions.equivalence',
    recognition: ['To make an equivalent fraction, what must happen to numerator and denominator?', 'Multiply or divide both by the same number'],
    procedural: ['Fill in the blank: 2/3 = 4/?', '6'],
    misconception: ['A student changes 2/3 to 4/3. What part of the equivalent-fraction step is missing?', 'Scale the denominator too'],
  },
  'fractions.p4.simplify_to_lowest_terms': {
    topic: 'fractions.equivalence',
    recognition: ['Is 3/4 in simplest form?', 'Yes'],
    procedural: ['Simplify 6/8.', '3/4'],
    misconception: ['A student simplifies 12/18 to 6/9 and stops. What should they check?', 'Common factor remains'],
  },
  'fractions.p4.compare_same_denominator': {
    topic: 'fractions.comparing_ordering',
    recognition: ['When denominators are the same, which number decides the larger fraction?', 'Numerator'],
    procedural: ['Which is larger: 5/7 or 2/7?', '5/7'],
    misconception: ['A student cannot explain why 5/7 is greater than 2/7. What idea is missing?', 'Same-sized parts compare by numerator'],
  },
  'fractions.p4.compare_same_numerator': {
    topic: 'fractions.comparing_ordering',
    recognition: ['For same numerator fractions, does a larger denominator mean larger or smaller parts?', 'Smaller parts'],
    procedural: ['Which is larger: 3/5 or 3/8?', '3/5'],
    misconception: ['A student chooses 3/8 as greater than 3/5 because 8 is bigger. What rule was misused?', 'Whole-number denominator comparison'],
  },
  'fractions.p4.order_related_fractions': {
    topic: 'fractions.comparing_ordering',
    recognition: ['What does ascending order mean?', 'Smallest to largest'],
    procedural: ['Order from smallest to largest: 1/2, 1/4, 1/3.', '1/4, 1/3, 1/2'],
    misconception: ['A student orders unlike fractions by numerator only. What should they compare instead?', 'Fraction values'],
  },
  'fractions.p4.recognise_improper_fractions': {
    topic: 'fractions.mixed_improper',
    recognition: ['Is 7/4 a proper fraction or an improper fraction?', 'Improper fraction'],
    procedural: ['How many fourths make one whole?', '4'],
    misconception: ['A student says 5/5 is not a fraction because the numerator equals the denominator. What does 5/5 equal?', '1'],
  },
  'fractions.p4.recognise_mixed_numbers': {
    topic: 'fractions.mixed_improper',
    recognition: ['In 2 1/3, what is the whole number part?', '2'],
    procedural: ['What does 1 2/5 mean?', '1 whole and 2 fifths'],
    misconception: ['A student reads 2 1/3 as 3/3. What part did they combine incorrectly?', 'Whole number and numerator'],
  },
  'fractions.p4.convert_mixed_to_improper': {
    topic: 'fractions.mixed_improper',
    recognition: ['When converting 2 1/3 to an improper fraction, which denominator is kept?', '3'],
    procedural: ['Convert 2 1/3 to an improper fraction.', '7/3'],
    misconception: ['A student writes 2 1/3 = 6/3. What step is missing?', 'Add the numerator'],
  },
  'fractions.p4.convert_improper_to_mixed': {
    topic: 'fractions.mixed_improper',
    recognition: ['For 7/3, what operation finds the number of wholes?', '7 divided by 3'],
    procedural: ['Convert 7/3 to a mixed number.', '2 1/3'],
    misconception: ['A student writes 7/3 = 3 1/2. What was misunderstood?', 'Whole groups and remainder'],
  },
  'fractions.p4.add_same_denominator': {
    topic: 'fractions.operations',
    recognition: ['When adding 2/5 + 1/5, what happens to the denominator?', 'It stays 5'],
    procedural: ['Find 2/5 + 1/5.', '3/5'],
    misconception: ['A student writes 2/5 + 1/5 = 3/10. What was added incorrectly?', 'Denominators'],
  },
  'fractions.p4.subtract_same_denominator': {
    topic: 'fractions.operations',
    recognition: ['When subtracting 4/7 - 1/7, what happens to the denominator?', 'It stays 7'],
    procedural: ['Find 4/7 - 1/7.', '3/7'],
    misconception: ['A student writes 5/8 - 2/8 = 3/6. What was changed incorrectly?', 'Denominator'],
  },
  'fractions.p4.add_related_denominators': {
    topic: 'fractions.operations',
    recognition: ['Before adding 1/2 + 1/4, what denominator can both fractions use?', '4'],
    procedural: ['Find 1/2 + 1/4.', '3/4'],
    misconception: ['A student writes 1/2 + 1/3 = 2/5. What step was skipped?', 'Find a common denominator'],
  },
  'fractions.p4.subtract_related_denominators': {
    topic: 'fractions.operations',
    recognition: ['Before subtracting 1/2 - 1/4, what denominator can both fractions use?', '4'],
    procedural: ['Find 1/2 - 1/4.', '1/4'],
    misconception: ['A student writes 1/3 - 1/2 = 1/6 by subtracting smaller from larger. What was ignored?', 'Subtraction order'],
  },
  'fractions.p4.unit_fraction_of_quantity': {
    topic: 'fractions.quantity_problem_solving',
    recognition: ['To find 1/4 of a quantity, do you divide by 4 or multiply by 4 first?', 'Divide by 4'],
    procedural: ['Find 1/4 of 20.', '5'],
    misconception: ['A student finds 1/4 of 20 as 20 x 4. What should they do instead?', 'Divide by 4'],
  },
  'fractions.p4.non_unit_fraction_of_quantity': {
    topic: 'fractions.quantity_problem_solving',
    recognition: ['To find 3/4 of a quantity, what do you find first?', 'One fourth'],
    procedural: ['Find 3/4 of 20.', '15'],
    misconception: ['A student finds 3/4 of 20 as 20 x 3. What step is missing?', 'Divide by denominator first'],
  },
  'fractions.p4.fraction_remainder_reasoning': {
    topic: 'fractions.quantity_problem_solving',
    recognition: ['In “1/3 of the remaining”, does the fraction apply to the original amount or what is left?', 'What is left'],
    procedural: ['There are 42 cards. Half are done. How many remain?', '21'],
    misconception: ['A student finds 1/3 of 42 after half of 42 is removed. What quantity should they use?', 'The remaining 21'],
  },
  'fractions.p4.model_one_step_word_problem': {
    topic: 'fractions.quantity_problem_solving',
    recognition: ['In a word problem, what should you identify before calculating?', 'The whole and the unknown'],
    procedural: ['A class has 24 cards. 3/4 are finished. How many are finished?', '18'],
    misconception: ['A student finds finished cards when the question asks how many are left. What did they miss?', 'The required unknown'],
  },
};

function questionSet(microSkillId) {
  const blueprint = DIAGNOSTIC_BLUEPRINTS[microSkillId];
  const remediationEntry = getRemediationEntryByMicroSkillId(fractionsRemediationMapV1, microSkillId);
  const misconceptionIds = (remediationEntry?.misconceptions || []).map((item) => item.id);
  const baseId = microSkillId.replace(/\./g, '_');
  const workingRequirementLevel = microSkillId.includes('word_problem')
    || microSkillId.includes('remainder')
    || microSkillId.includes('related_denominators')
    ? 'HIGH'
    : microSkillId.includes('convert') || microSkillId.includes('quantity')
      ? 'MEDIUM'
      : 'LOW';

  return [
    dq(`${baseId}_recognition`, Q.RECOGNITION, blueprint.recognition[0], blueprint.recognition[1], {
      workingRequirementLevel: 'LOW',
      evidenceRules: ['correct_high_confidence', 'wrong_high_confidence'],
    }),
    dq(`${baseId}_procedural`, Q.PROCEDURAL, blueprint.procedural[0], blueprint.procedural[1], {
      workingRequirementLevel,
      evidenceRules: ['correct_with_working', 'correct_no_working', 'wrong_low_confidence'],
    }),
    dq(`${baseId}_misconception`, microSkillId.includes('word_problem') || microSkillId.includes('remainder') ? Q.APPLICATION : Q.REASONING, blueprint.misconception[0], blueprint.misconception[1], {
      detectsMisconceptions: misconceptionIds,
      workingRequirementLevel,
      evidenceRules: ['wrong_high_confidence', 'wrong_high_confidence_no_working', 'wrong_no_working_high_requirement'],
    }),
  ];
}

export const fractionsDiagnosticAssetMapV1 = normalizeDiagnosticAssetMap({
  domain: 'fractions',
  domainTitle: 'Fractions',
  stage: 'P4',
  modelVersion: 'fractions-diagnostic-asset-map-v1',
  sourceKnowledgeMapVersion: fractionsKnowledgeMapV1.modelVersion,
  sourceRemediationMapVersion: fractionsRemediationMapV1.modelVersion,
  productionBehaviorChanged: false,
  diagnosticSignalRules,
  entries: Object.entries(DIAGNOSTIC_BLUEPRINTS).map(([microSkill, blueprint]) =>
    buildDiagnosticEntry({
      knowledgeMap: fractionsKnowledgeMapV1,
      remediationMap: fractionsRemediationMapV1,
      topic: blueprint.topic,
      microSkill,
      diagnosticQuestions: questionSet(microSkill),
    })
  ),
});

export default fractionsDiagnosticAssetMapV1;
