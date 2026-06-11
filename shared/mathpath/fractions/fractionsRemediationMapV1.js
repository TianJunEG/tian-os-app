import { fractionsKnowledgeMapV1 } from './fractionsKnowledgeMapV1.js';
import {
  INTERVENTION_TYPES,
  buildRemediationEntryFromKnowledge,
  normalizeRemediationMap,
} from '../knowledge/remediationMapModel.js';

const I = INTERVENTION_TYPES;

function m(id, title, observableBehaviours, likelyCauses, interventions, description = '') {
  return {
    id,
    title,
    description: description || title,
    observableBehaviours,
    likelyCauses,
    interventions,
  };
}

function entry(topic, microSkill, misconceptions) {
  return buildRemediationEntryFromKnowledge({
    knowledgeMap: fractionsKnowledgeMapV1,
    topic,
    microSkill,
    misconceptions,
  });
}

export const fractionsRemediationMapV1 = normalizeRemediationMap({
  domain: 'fractions',
  domainTitle: 'Fractions',
  stage: 'P4',
  modelVersion: 'fractions-remediation-map-v1',
  sourceKnowledgeMapVersion: fractionsKnowledgeMapV1.modelVersion,
  productionBehaviorChanged: false,
  entries: [
    entry('fractions.foundations', 'fractions.p4.equal_parts_whole', [
      m('M-FND-001', 'Counts parts without checking equality', ['Names 2/4 for a shape split into unequal pieces.', 'Counts visible pieces before checking whether they are equal sized.'], ['Does not yet see equality of parts as required for fractions.', 'Focuses on count rather than area or size.'], [I.CONCEPT_REVIEW, I.MODEL_TRAINER, I.TARGETED_PRACTICE]),
      m('M-FND-002', 'Uses shaded count as denominator', ['Writes 2/2 for two shaded parts out of five equal parts.', 'Denominator changes when shaded count changes.'], ['Confuses selected parts with total equal parts.', 'Has not anchored denominator to the whole.'], [I.GUIDED_EXAMPLE, I.MODEL_TRAINER, I.TARGETED_PRACTICE]),
    ]),
    entry('fractions.foundations', 'fractions.p4.numerator_denominator_meaning', [
      m('M-FND-003', 'Swaps numerator and denominator', ['Writes 5/2 when 2 out of 5 parts are shaded.', 'Says denominator is the shaded amount.'], ['Fraction notation roles are not secure.', 'Reads top and bottom numbers as interchangeable labels.'], [I.CONCEPT_REVIEW, I.GUIDED_EXAMPLE, I.TARGETED_PRACTICE]),
      m('M-FND-004', 'Denominator as unshaded parts', ['Writes 2/3 for 2 shaded out of 5 because 3 are unshaded.', 'Uses unshaded count as the bottom number.'], ['Confuses complement with the whole.', 'Does not track all equal parts in the full shape.'], [I.MODEL_TRAINER, I.GUIDED_EXAMPLE, I.TARGETED_PRACTICE]),
    ]),
    entry('fractions.foundations', 'fractions.p4.unit_fraction_size', [
      m('M-FND-005', 'Bigger denominator means bigger value', ['Chooses 1/8 as greater than 1/4.', 'Orders 1/2, 1/3, 1/5 from denominator size only.'], ['Applies whole-number comparison to denominators.', 'Does not connect denominator to smaller part size.'], [I.CONCEPT_REVIEW, I.MODEL_TRAINER, I.FLUENCY]),
    ]),
    entry('fractions.foundations', 'fractions.p4.number_line_position', [
      m('M-FND-006', 'Counts tick marks instead of intervals', ['Places 3/4 on the third tick when the line has four ticks and three intervals.', 'Uses endpoints as counted parts.'], ['Does not distinguish marks from equal spaces.', 'Number-line partitioning is not secure.'], [I.MODEL_TRAINER, I.GUIDED_EXAMPLE, I.TARGETED_PRACTICE]),
      m('M-FND-007', 'Unequal spacing on number line', ['Places 1/2 closer to 0 than 1.', 'Marks fourths with visibly different interval sizes.'], ['Does not treat the number line as a scale.', 'Uses visual estimation without equal partitioning.'], [I.CONCEPT_REVIEW, I.MODEL_TRAINER, I.TARGETED_PRACTICE]),
    ]),
    entry('fractions.equivalence', 'fractions.p4.recognise_equivalence', [
      m('M-EQ-001', 'Compares only numerators or denominators', ['Says 2/4 is not equal to 1/2 because 2 is not 1.', 'Says 3/6 is greater than 1/2 because 6 is greater than 2.'], ['Does not understand same value in different-sized parts.', 'Checks one number instead of the fraction relationship.'], [I.CONCEPT_REVIEW, I.MODEL_TRAINER, I.TARGETED_PRACTICE]),
    ]),
    entry('fractions.equivalence', 'fractions.p4.generate_equivalent_fractions', [
      m('M-EQ-002', 'Scales only one part', ['Changes 2/3 to 4/3 when asked for an equivalent fraction.', 'Changes 2/3 to 2/6 only.'], ['Does not know numerator and denominator must be scaled together.', 'Treats equivalent fractions as changing one number to match a pattern.'], [I.GUIDED_EXAMPLE, I.MODEL_TRAINER, I.TARGETED_PRACTICE]),
      m('M-EQ-003', 'Uses different scale factors', ['Writes 2/3 = 4/9.', 'Fills 3/5 = 6/15 when numerator doubled but denominator tripled.'], ['Cannot track a common multiplier.', 'Multiplication facts or ratio relationship is weak.'], [I.GUIDED_EXAMPLE, I.TARGETED_PRACTICE, I.FLUENCY]),
    ]),
    entry('fractions.equivalence', 'fractions.p4.simplify_to_lowest_terms', [
      m('M-EQ-004', 'Stops before simplest form', ['Simplifies 12/18 to 6/9 and stops.', 'Leaves 8/12 as 4/6.'], ['Finds a common factor but not the highest common factor.', 'Does not check the final answer for another common factor.'], [I.GUIDED_EXAMPLE, I.TARGETED_PRACTICE, I.FLUENCY]),
      m('M-EQ-005', 'Subtracts instead of divides', ['Changes 6/8 to 3/5 by subtracting 3.', 'Reduces 10/15 to 5/10.'], ['Confuses reducing with making numbers smaller.', 'Equivalent-fraction operation is not secure.'], [I.CONCEPT_REVIEW, I.MODEL_TRAINER, I.TARGETED_PRACTICE]),
    ]),
    entry('fractions.comparing_ordering', 'fractions.p4.compare_same_denominator', [
      m('M-CMP-001', 'Compares denominators when denominators are same', ['Chooses 2/7 as greater than 5/7 because 2 is less work or seen first.', 'Cannot explain why 5/7 is greater than 2/7.'], ['Does not connect same denominator to same-sized parts.', 'Numerator meaning is weak in comparison contexts.'], [I.CONCEPT_REVIEW, I.GUIDED_EXAMPLE, I.FLUENCY]),
    ]),
    entry('fractions.comparing_ordering', 'fractions.p4.compare_same_numerator', [
      m('M-CMP-002', 'Bigger denominator selected as bigger fraction', ['Chooses 3/8 as greater than 3/5.', 'Orders 2/3 before 2/7 in ascending order.'], ['Applies whole-number ordering to denominators.', 'Unit fraction size reasoning is weak.'], [I.CONCEPT_REVIEW, I.MODEL_TRAINER, I.TARGETED_PRACTICE]),
    ]),
    entry('fractions.comparing_ordering', 'fractions.p4.order_related_fractions', [
      m('M-CMP-003', 'Uses one comparison rule for every case', ['Orders unlike fractions by numerator only.', 'Uses denominator-only reasoning for mixed comparison sets.'], ['Cannot choose a comparison strategy from the fraction structure.', 'Same-denominator and same-numerator cases are mixed up.'], [I.GUIDED_EXAMPLE, I.TARGETED_PRACTICE, I.FLUENCY]),
      m('M-CMP-004', 'Ordering direction reversed', ['Gives descending order when asked for ascending.', 'Correct comparisons but reversed final list.'], ['Language of greatest/smallest is insecure.', 'Final answer check is missing.'], [I.GUIDED_EXAMPLE, I.TARGETED_PRACTICE, I.FLUENCY]),
    ]),
    entry('fractions.mixed_improper', 'fractions.p4.recognise_improper_fractions', [
      m('M-MIX-001', 'Treats improper fractions as invalid', ['Rejects 7/4 as not a fraction.', 'Changes 5/5 to 1/5 because numerator cannot equal denominator.'], ['Overgeneralises proper fraction form.', 'Does not understand fractions can represent one or more wholes.'], [I.CONCEPT_REVIEW, I.MODEL_TRAINER, I.TARGETED_PRACTICE]),
      m('M-MIX-002', 'Misses the whole count', ['Represents 7/4 with only 3/4 shaded.', 'Draws one whole when the fraction needs more than one whole.'], ['Does not group denominator-sized sets into wholes.', 'Remainder thinking is not connected to visual models.'], [I.MODEL_TRAINER, I.GUIDED_EXAMPLE, I.TARGETED_PRACTICE]),
    ]),
    entry('fractions.mixed_improper', 'fractions.p4.recognise_mixed_numbers', [
      m('M-MIX-003', 'Adds whole and numerator only', ['Reads 2 1/3 as 3/3.', 'Treats 1 2/5 as 3/5.'], ['Whole number and fraction part are not seen as separate values.', 'Student compresses mixed notation into a single fraction without conversion.'], [I.CONCEPT_REVIEW, I.MODEL_TRAINER, I.TARGETED_PRACTICE]),
    ]),
    entry('fractions.mixed_improper', 'fractions.p4.convert_mixed_to_improper', [
      m('M-MIX-004', 'Forgets to add numerator', ['2 1/3 = 6/3.', '3 2/5 = 15/5.'], ['Knows whole groups but ignores the extra fractional part.', 'Conversion steps are memorised incompletely.'], [I.GUIDED_EXAMPLE, I.TARGETED_PRACTICE, I.FLUENCY]),
      m('M-MIX-005', 'Changes denominator during conversion', ['2 1/3 = 7/4.', 'Uses whole plus denominator as new denominator.'], ['Does not understand denominator as unchanged part size.', 'Confuses conversion with adding all visible numbers.'], [I.CONCEPT_REVIEW, I.MODEL_TRAINER, I.TARGETED_PRACTICE]),
    ]),
    entry('fractions.mixed_improper', 'fractions.p4.convert_improper_to_mixed', [
      m('M-MIX-006', 'Remainder placed as denominator', ['7/3 = 2 3/1.', '9/4 = 2 4/1.'], ['Confuses quotient, divisor, and remainder positions.', 'Does not preserve original denominator.'], [I.GUIDED_EXAMPLE, I.MODEL_TRAINER, I.TARGETED_PRACTICE]),
      m('M-MIX-007', 'Whole number calculated incorrectly', ['7/3 = 3 1/2.', '7/3 = 7 3.'], ['Does not understand whole groups of denominator size.', 'Division facts or quotient-remainder reasoning is weak.'], [I.CONCEPT_REVIEW, I.GUIDED_EXAMPLE, I.FLUENCY]),
    ]),
    entry('fractions.operations', 'fractions.p4.add_same_denominator', [
      m('M-OPS-001', 'Adds denominators directly', ['2/5 + 1/5 = 3/10.', 'Keeps numerator logic but changes denominator after addition.'], ['Does not understand denominator as part size.', 'Uses whole-number vertical addition on both numbers.'], [I.CONCEPT_REVIEW, I.MODEL_TRAINER, I.TARGETED_PRACTICE]),
    ]),
    entry('fractions.operations', 'fractions.p4.subtract_same_denominator', [
      m('M-OPS-002', 'Subtracts denominators directly', ['4/7 - 1/7 = 3/0.', '5/8 - 2/8 = 3/6.'], ['Does not preserve same-sized parts.', 'Applies whole-number subtraction to numerator and denominator.'], [I.CONCEPT_REVIEW, I.MODEL_TRAINER, I.TARGETED_PRACTICE]),
    ]),
    entry('fractions.operations', 'fractions.p4.add_related_denominators', [
      m('M-OPS-003', 'Adds unlike fractions without renaming', ['1/2 + 1/3 = 2/5.', '2/3 + 1/6 = 3/9.'], ['Common denominator need is not understood.', 'Student treats numerator and denominator as separate whole numbers.'], [I.CONCEPT_REVIEW, I.MODEL_TRAINER, I.TARGETED_PRACTICE]),
      m('M-OPS-004', 'Finds common denominator but does not scale numerator', ['1/2 + 1/4 = 1/4 + 1/4 = 2/4.', 'Changes denominator to 6 but leaves original numerators unchanged.'], ['Equivalent fraction scaling is weak.', 'Student focuses on matching denominators only.'], [I.GUIDED_EXAMPLE, I.TARGETED_PRACTICE, I.FLUENCY]),
    ]),
    entry('fractions.operations', 'fractions.p4.subtract_related_denominators', [
      m('M-OPS-005', 'Subtracts smaller numerator from larger numerator only', ['1/3 - 1/2 = 1/6 because 2 - 1 = 1.', 'Reverses numerator subtraction to avoid a negative result.'], ['Operation order is not secure.', 'Student avoids representing the actual difference.'], [I.GUIDED_EXAMPLE, I.MODEL_TRAINER, I.TARGETED_PRACTICE]),
      m('M-OPS-006', 'Regroups without preserving value', ['1 1/4 - 3/4 becomes 1 2/4.', 'Changes mixed form but total value changes.'], ['Mixed number regrouping is procedural but not conceptual.', 'Equivalent values are not checked during regrouping.'], [I.CONCEPT_REVIEW, I.GUIDED_EXAMPLE, I.TARGETED_PRACTICE]),
    ]),
    entry('fractions.quantity_problem_solving', 'fractions.p4.unit_fraction_of_quantity', [
      m('M-QTY-001', 'Multiplies before finding one part', ['Finds 1/4 of 20 as 20 x 4.', 'Uses denominator as a multiplier instead of divisor.'], ['Does not connect denominator to equal groups.', 'Division meaning of unit fraction is weak.'], [I.CONCEPT_REVIEW, I.MODEL_TRAINER, I.FLUENCY]),
    ]),
    entry('fractions.quantity_problem_solving', 'fractions.p4.non_unit_fraction_of_quantity', [
      m('M-QTY-002', 'Uses numerator first without unit value', ['Finds 3/4 of 20 as 20 x 3 only.', 'Multiplies total by numerator and ignores denominator.'], ['Does not use unit-fraction bridge.', 'Sequence divide then multiply is insecure.'], [I.GUIDED_EXAMPLE, I.MODEL_TRAINER, I.TARGETED_PRACTICE]),
      m('M-QTY-003', 'Allows fractional objects in countable contexts', ['Accepts 1/2 of 41 children as 20.5 children.', 'Continues with decimal cards or people in a countable problem.'], ['Does not check reasonableness of intermediate values.', 'Context units are not monitored during calculation.'], [I.GUIDED_EXAMPLE, I.TARGETED_PRACTICE]),
    ]),
    entry('fractions.quantity_problem_solving', 'fractions.p4.fraction_remainder_reasoning', [
      m('M-QTY-004', 'Uses original whole for every fraction', ['Finds 1/3 of 42 after already removing 1/2 of 42.', 'Ignores the phrase “of the remaining”.'], ['Does not update the whole after each step.', 'Remainder language is not connected to subtraction.'], [I.CONCEPT_REVIEW, I.MODEL_TRAINER, I.TARGETED_PRACTICE]),
      m('M-QTY-005', 'Loses track of the remaining quantity', ['Finds used amounts correctly but reports total used when asked for left.', 'Stops after first subtraction in a two-step remainder question.'], ['Question target is not tracked.', 'Working layout does not label each intermediate quantity.'], [I.GUIDED_EXAMPLE, I.TARGETED_PRACTICE]),
    ]),
    entry('fractions.quantity_problem_solving', 'fractions.p4.model_one_step_word_problem', [
      m('M-QTY-006', 'Answers a different unknown', ['Finds the eaten amount when the question asks how many are left.', 'Finds the original total when asked for the fraction part.'], ['Question comprehension is weak.', 'Student calculates before identifying the target unknown.'], [I.GUIDED_EXAMPLE, I.MODEL_TRAINER, I.TARGETED_PRACTICE]),
      m('M-QTY-007', 'Ignores context units', ['Gives 8 instead of 8 cards or 8 pupils.', 'Uses people, cards, and groups interchangeably in working.'], ['Does not attach meaning to calculated values.', 'Model labels are missing from working.'], [I.GUIDED_EXAMPLE, I.TARGETED_PRACTICE]),
    ]),
  ],
});

export default fractionsRemediationMapV1;
