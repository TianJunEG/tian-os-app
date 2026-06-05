import { createEmptyAssetHooks, normalizeKnowledgeMap } from '../knowledge/knowledgeMapModel.js';

function misconception(id, title, description) {
  return { id, title, description };
}

function microSkill(config) {
  return {
    ...createEmptyAssetHooks(),
    misconceptions: [],
    legacySkillIds: [],
    prerequisites: [],
    ...config,
  };
}

export const fractionsKnowledgeMapV1 = normalizeKnowledgeMap({
  domain: 'fractions',
  domainTitle: 'Fractions',
  stage: 'P4',
  modelVersion: 'fractions-knowledge-map-v1',
  source: {
    legacySkillRange: 'F001-F026',
    sourceFiles: [
      'frontend/src/mathpath/fractions/fractionSkillGraph.js',
      'frontend/src/mathpath/fractions/fractionQuestionFamilies.js',
      'frontend/src/mathpath/curriculum/fractionCurriculumMappings.js',
      'scripts/domains/fractions.js',
    ],
    productionBehaviorChanged: false,
  },
  topics: [
    {
      id: 'fractions.foundations',
      title: 'Understanding Fractions',
      description: 'Part-whole meaning, equal parts, notation, unit fractions, and number-line representation.',
      legacySkillIds: ['F001', 'F002', 'F003', 'F004', 'F005'],
      microSkills: [
        microSkill({
          id: 'fractions.p4.equal_parts_whole',
          title: 'Recognise equal parts of one whole',
          legacySkillIds: ['F001', 'F003'],
          learningObjectives: [
            'Identify whether a shape or set has been divided into equal parts.',
            'Name the shaded or selected part as a fraction of one whole.',
          ],
          misconceptions: [
            misconception('M-FND-001', 'Counts parts without checking equality', 'Student treats unequal pieces as valid fraction parts.'),
            misconception('M-FND-002', 'Uses shaded count as denominator', 'Student writes total shaded parts as the denominator instead of total equal parts.'),
          ],
        }),
        microSkill({
          id: 'fractions.p4.numerator_denominator_meaning',
          title: 'Explain numerator and denominator',
          legacySkillIds: ['F002'],
          prerequisites: ['fractions.p4.equal_parts_whole'],
          learningObjectives: [
            'Explain numerator as selected equal parts.',
            'Explain denominator as total equal parts in the whole.',
          ],
          misconceptions: [
            misconception('M-FND-003', 'Swaps numerator and denominator', 'Student reverses top and bottom numbers when naming a fraction.'),
            misconception('M-FND-004', 'Denominator as unshaded parts', 'Student treats the denominator as the number of unshaded parts.'),
          ],
        }),
        microSkill({
          id: 'fractions.p4.unit_fraction_size',
          title: 'Reason about unit fraction size',
          legacySkillIds: ['F004', 'F006'],
          prerequisites: ['fractions.p4.numerator_denominator_meaning'],
          learningObjectives: [
            'Identify unit fractions in symbolic and visual form.',
            'Explain why a larger denominator gives a smaller unit fraction.',
          ],
          misconceptions: [
            misconception('M-FND-005', 'Bigger denominator means bigger value', 'Student compares denominators as whole numbers without considering part size.'),
          ],
        }),
        microSkill({
          id: 'fractions.p4.number_line_position',
          title: 'Place fractions on a number line',
          legacySkillIds: ['F005'],
          prerequisites: ['fractions.p4.numerator_denominator_meaning'],
          learningObjectives: [
            'Partition the interval from 0 to 1 into equal parts.',
            'Locate unit and non-unit fractions using equal intervals.',
          ],
          misconceptions: [
            misconception('M-FND-006', 'Counts tick marks instead of intervals', 'Student uses the number of tick marks rather than spaces between ticks.'),
            misconception('M-FND-007', 'Unequal spacing on number line', 'Student places fraction markers without preserving equal intervals.'),
          ],
        }),
      ],
    },
    {
      id: 'fractions.equivalence',
      title: 'Equivalent Fractions and Simplest Form',
      description: 'Recognising, generating, and simplifying equivalent fractions.',
      legacySkillIds: ['F010', 'F011', 'F012'],
      microSkills: [
        microSkill({
          id: 'fractions.p4.recognise_equivalence',
          title: 'Recognise equivalent fractions',
          legacySkillIds: ['F010'],
          prerequisites: ['fractions.p4.equal_parts_whole'],
          learningObjectives: [
            'Identify two fractions that represent the same value.',
            'Use visual or numeric evidence to justify equivalence.',
          ],
          misconceptions: [
            misconception('M-EQ-001', 'Compares only numerators or denominators', 'Student decides equivalence from one number instead of the fraction value.'),
          ],
        }),
        microSkill({
          id: 'fractions.p4.generate_equivalent_fractions',
          title: 'Generate equivalent fractions',
          legacySkillIds: ['F011'],
          prerequisites: ['fractions.p4.recognise_equivalence'],
          learningObjectives: [
            'Multiply numerator and denominator by the same factor.',
            'Fill missing terms in equivalent-fraction statements.',
          ],
          misconceptions: [
            misconception('M-EQ-002', 'Scales only one part', 'Student multiplies or divides only the numerator or only the denominator.'),
            misconception('M-EQ-003', 'Uses different scale factors', 'Student applies different factors to numerator and denominator.'),
          ],
        }),
        microSkill({
          id: 'fractions.p4.simplify_to_lowest_terms',
          title: 'Simplify fractions to lowest terms',
          legacySkillIds: ['F012'],
          prerequisites: ['fractions.p4.generate_equivalent_fractions'],
          learningObjectives: [
            'Find a common factor for numerator and denominator.',
            'Reduce a fraction until no common factor greater than 1 remains.',
          ],
          misconceptions: [
            misconception('M-EQ-004', 'Stops before simplest form', 'Student divides by a common factor but leaves another common factor.'),
            misconception('M-EQ-005', 'Subtracts instead of divides', 'Student reduces by subtracting the same number instead of dividing by the same factor.'),
          ],
        }),
      ],
    },
    {
      id: 'fractions.comparing_ordering',
      title: 'Comparing and Ordering Fractions',
      description: 'Same denominator, same numerator, unit fraction, related denominator, and ordered sets.',
      legacySkillIds: ['F006', 'F007', 'F008', 'F009'],
      microSkills: [
        microSkill({
          id: 'fractions.p4.compare_same_denominator',
          title: 'Compare fractions with the same denominator',
          legacySkillIds: ['F007'],
          prerequisites: ['fractions.p4.numerator_denominator_meaning'],
          learningObjectives: [
            'Compare fractions with equal-sized parts by comparing numerators.',
          ],
          misconceptions: [
            misconception('M-CMP-001', 'Compares denominators when denominators are same', 'Student ignores that equal denominators mean equal-sized parts.'),
          ],
        }),
        microSkill({
          id: 'fractions.p4.compare_same_numerator',
          title: 'Compare fractions with the same numerator',
          legacySkillIds: ['F008'],
          prerequisites: ['fractions.p4.unit_fraction_size'],
          learningObjectives: [
            'Compare same-numerator fractions using denominator-size reasoning.',
          ],
          misconceptions: [
            misconception('M-CMP-002', 'Bigger denominator selected as bigger fraction', 'Student treats the denominator as an ordinary whole number comparison.'),
          ],
        }),
        microSkill({
          id: 'fractions.p4.order_related_fractions',
          title: 'Order related fractions',
          legacySkillIds: ['F006', 'F009'],
          prerequisites: ['fractions.p4.compare_same_denominator', 'fractions.p4.compare_same_numerator'],
          learningObjectives: [
            'Arrange fractions using same-denominator, same-numerator, unit-fraction, or related-denominator reasoning.',
          ],
          misconceptions: [
            misconception('M-CMP-003', 'Uses one comparison rule for every case', 'Student applies same-denominator reasoning to same-numerator or unlike-fraction cases.'),
            misconception('M-CMP-004', 'Ordering direction reversed', 'Student confuses ascending and descending order.'),
          ],
        }),
      ],
    },
    {
      id: 'fractions.mixed_improper',
      title: 'Improper Fractions and Mixed Numbers',
      description: 'Values greater than one, mixed-number representation, and bidirectional conversion.',
      legacySkillIds: ['F013', 'F014', 'F015'],
      microSkills: [
        microSkill({
          id: 'fractions.p4.recognise_improper_fractions',
          title: 'Recognise improper fractions',
          legacySkillIds: ['F013'],
          prerequisites: ['fractions.p4.numerator_denominator_meaning'],
          learningObjectives: [
            'Identify fractions with values equal to or greater than one.',
            'Represent improper fractions with whole-plus-part models.',
          ],
          misconceptions: [
            misconception('M-MIX-001', 'Treats improper fractions as invalid', 'Student thinks numerator must always be smaller than denominator.'),
            misconception('M-MIX-002', 'Misses the whole count', 'Student represents only the remainder fraction and omits complete wholes.'),
          ],
        }),
        microSkill({
          id: 'fractions.p4.recognise_mixed_numbers',
          title: 'Recognise mixed numbers',
          legacySkillIds: ['F014'],
          prerequisites: ['fractions.p4.recognise_improper_fractions'],
          learningObjectives: [
            'Interpret a mixed number as whole number plus fractional part.',
            'Connect visual models to mixed-number notation.',
          ],
          misconceptions: [
            misconception('M-MIX-003', 'Adds whole and numerator only', 'Student reads 2 1/3 as 3/3 or 2/3 instead of two wholes and one third.'),
          ],
        }),
        microSkill({
          id: 'fractions.p4.convert_mixed_to_improper',
          title: 'Convert mixed numbers to improper fractions',
          legacySkillIds: ['F015'],
          prerequisites: ['fractions.p4.recognise_mixed_numbers'],
          learningObjectives: [
            'Multiply the whole number by the denominator.',
            'Add the numerator and keep the denominator unchanged.',
          ],
          misconceptions: [
            misconception('M-MIX-004', 'Forgets to add numerator', 'Student multiplies whole by denominator but does not add the remaining numerator.'),
            misconception('M-MIX-005', 'Changes denominator during conversion', 'Student changes the denominator instead of preserving the part size.'),
          ],
        }),
        microSkill({
          id: 'fractions.p4.convert_improper_to_mixed',
          title: 'Convert improper fractions to mixed numbers',
          legacySkillIds: ['F015'],
          prerequisites: ['fractions.p4.recognise_improper_fractions'],
          learningObjectives: [
            'Divide numerator by denominator to find complete wholes.',
            'Use the remainder as the numerator over the original denominator.',
          ],
          misconceptions: [
            misconception('M-MIX-006', 'Remainder placed as denominator', 'Student puts the remainder in the denominator position.'),
            misconception('M-MIX-007', 'Whole number calculated incorrectly', 'Student does not connect division quotient to number of wholes.'),
          ],
        }),
      ],
    },
    {
      id: 'fractions.operations',
      title: 'Fraction Operations',
      description: 'P4-ready operation concepts and P5/P6 bridge skills kept as legacy-compatible references.',
      legacySkillIds: ['F016', 'F017', 'F018', 'F019', 'F021', 'F022'],
      microSkills: [
        microSkill({
          id: 'fractions.p4.add_same_denominator',
          title: 'Add fractions with the same denominator',
          legacySkillIds: ['F016'],
          prerequisites: ['fractions.p4.compare_same_denominator'],
          learningObjectives: [
            'Add numerators when parts are the same size.',
            'Keep the denominator unchanged and simplify if needed.',
          ],
          misconceptions: [
            misconception('M-OPS-001', 'Adds denominators directly', 'Student adds numerator and denominator instead of preserving the common denominator.'),
          ],
        }),
        microSkill({
          id: 'fractions.p4.subtract_same_denominator',
          title: 'Subtract fractions with the same denominator',
          legacySkillIds: ['F017'],
          prerequisites: ['fractions.p4.add_same_denominator'],
          learningObjectives: [
            'Subtract numerators when parts are the same size.',
            'Keep the denominator unchanged and simplify if needed.',
          ],
          misconceptions: [
            misconception('M-OPS-002', 'Subtracts denominators directly', 'Student changes the denominator during same-denominator subtraction.'),
          ],
        }),
        microSkill({
          id: 'fractions.p4.add_related_denominators',
          title: 'Add fractions with related denominators',
          legacySkillIds: ['F018'],
          prerequisites: ['fractions.p4.generate_equivalent_fractions', 'fractions.p4.add_same_denominator'],
          learningObjectives: [
            'Rename fractions with a common denominator before adding.',
            'Add and simplify the final answer where appropriate.',
          ],
          misconceptions: [
            misconception('M-OPS-003', 'Adds unlike fractions without renaming', 'Student adds numerators and denominators directly for unlike denominators.'),
            misconception('M-OPS-004', 'Finds common denominator but does not scale numerator', 'Student changes denominator without preserving equivalent value.'),
          ],
        }),
        microSkill({
          id: 'fractions.p4.subtract_related_denominators',
          title: 'Subtract fractions with related denominators',
          legacySkillIds: ['F019'],
          prerequisites: ['fractions.p4.generate_equivalent_fractions', 'fractions.p4.subtract_same_denominator'],
          learningObjectives: [
            'Rename fractions with a common denominator before subtracting.',
            'Subtract and simplify the final answer where appropriate.',
          ],
          misconceptions: [
            misconception('M-OPS-005', 'Subtracts smaller numerator from larger numerator only', 'Student ignores the order and operation direction.'),
            misconception('M-OPS-006', 'Regroups without preserving value', 'Student changes mixed or improper forms inconsistently.'),
          ],
        }),
      ],
    },
    {
      id: 'fractions.quantity_problem_solving',
      title: 'Fraction of Quantity and Problem Solving',
      description: 'Countable quantities, set reasoning, remainder reasoning, and contextual modelling.',
      legacySkillIds: ['F020', 'F023', 'F024', 'F025', 'F026'],
      microSkills: [
        microSkill({
          id: 'fractions.p4.unit_fraction_of_quantity',
          title: 'Find a unit fraction of a quantity',
          legacySkillIds: ['F020'],
          prerequisites: ['fractions.p4.numerator_denominator_meaning'],
          learningObjectives: [
            'Divide the total quantity by the denominator to find one part.',
          ],
          misconceptions: [
            misconception('M-QTY-001', 'Multiplies before finding one part', 'Student does not first divide by the denominator for unit fractions.'),
          ],
        }),
        microSkill({
          id: 'fractions.p4.non_unit_fraction_of_quantity',
          title: 'Find a non-unit fraction of a quantity',
          legacySkillIds: ['F020'],
          prerequisites: ['fractions.p4.unit_fraction_of_quantity'],
          learningObjectives: [
            'Find one part, then multiply by the numerator.',
            'Use whole-number intermediate values for countable objects.',
          ],
          misconceptions: [
            misconception('M-QTY-002', 'Uses numerator first without unit value', 'Student multiplies by numerator before finding one fractional unit.'),
            misconception('M-QTY-003', 'Allows fractional objects in countable contexts', 'Student accepts non-whole intermediate counts for people, cards, or objects.'),
          ],
        }),
        microSkill({
          id: 'fractions.p4.fraction_remainder_reasoning',
          title: 'Reason with fraction of the remainder',
          legacySkillIds: ['F024'],
          prerequisites: ['fractions.p4.non_unit_fraction_of_quantity'],
          learningObjectives: [
            'Subtract the first fractional amount before applying the next fraction.',
            'Track whether each fraction refers to the original whole or the remainder.',
          ],
          misconceptions: [
            misconception('M-QTY-004', 'Uses original whole for every fraction', 'Student applies every fraction to the starting amount instead of the remaining amount.'),
            misconception('M-QTY-005', 'Loses track of the remaining quantity', 'Student finds used amounts but does not subtract to answer what is left.'),
          ],
        }),
        microSkill({
          id: 'fractions.p4.model_one_step_word_problem',
          title: 'Model a one-step fraction word problem',
          legacySkillIds: ['F023', 'F025'],
          prerequisites: ['fractions.p4.non_unit_fraction_of_quantity'],
          learningObjectives: [
            'Identify the whole, the fraction, and the required unknown.',
            'Choose a bar model, set model, or equation before calculating.',
          ],
          misconceptions: [
            misconception('M-QTY-006', 'Answers a different unknown', 'Student finds the used amount when the question asks for the remainder, or vice versa.'),
            misconception('M-QTY-007', 'Ignores context units', 'Student calculates a number but does not connect it to the object or unit in the problem.'),
          ],
        }),
      ],
    },
  ],
  deferredLegacySkillIds: [
    {
      legacySkillId: 'F021',
      reason: 'Current flat graph includes multiplication, but full fraction multiplication is a later-year build outside P4 Phase 1.',
    },
    {
      legacySkillId: 'F022',
      reason: 'Fraction division is outside P4 Phase 1 and remains a future map extension.',
    },
    {
      legacySkillId: 'F026',
      reason: 'Mastery challenge/capstone should be rebuilt after P5/P6 maps exist.',
    },
  ],
});

export default fractionsKnowledgeMapV1;
