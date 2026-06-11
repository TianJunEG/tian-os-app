import {
  MODEL_METHOD_TYPES,
  WORD_DIAGNOSTIC_TYPES,
  WORD_REMEDIATION_ASSET_TYPES,
  normalizeWordPathMap,
} from './wordStructureModel.js';

const D = WORD_DIAGNOSTIC_TYPES;
const R = WORD_REMEDIATION_ASSET_TYPES;
const M = MODEL_METHOD_TYPES;

function misconception(id, title, observableBehaviour, likelyCause) {
  return { id, title, observableBehaviour, likelyCause };
}

function diagnostic(baseId, recognitionPrompt, reasoningPrompt, misconceptionPrompt, misconceptionIds) {
  return [
    { id: `${baseId}_recognition`, type: D.RECOGNITION, prompt: recognitionPrompt, purpose: 'Identify the problem structure quickly.' },
    { id: `${baseId}_reasoning`, type: D.REASONING, prompt: reasoningPrompt, purpose: 'Check whether the student can explain the structure before calculation.' },
    { id: `${baseId}_misconception`, type: D.MISCONCEPTION_DETECTION, prompt: misconceptionPrompt, detectsMisconceptions: misconceptionIds },
  ];
}

function remediation(baseId, title) {
  return [
    { id: `${baseId}_concept`, type: R.CONCEPT_EXPLANATION, title: `${title} concept explanation`, status: 'PLANNED' },
    { id: `${baseId}_worked`, type: R.WORKED_EXAMPLE, title: `${title} worked example`, status: 'PLANNED' },
    { id: `${baseId}_model`, type: R.MODEL_METHOD_EXAMPLE, title: `${title} model method example`, status: 'PLANNED' },
    { id: `${baseId}_guided`, type: R.GUIDED_PRACTICE, title: `${title} guided practice`, status: 'PLANNED' },
    { id: `${baseId}_independent`, type: R.INDEPENDENT_PRACTICE, title: `${title} independent practice`, status: 'PLANNED' },
    { id: `${baseId}_fluency`, type: R.FLUENCY_VARIANT, title: `${title} fluency variant`, status: 'PLANNED' },
    { id: `${baseId}_retention`, type: R.RETENTION_REVIEW, title: `${title} retention review`, scheduleDays: [3, 7, 14, 30], status: 'PLANNED' },
  ];
}

function microSkill(config) {
  const baseId = config.id.replace(/\./g, '_');
  return {
    diagnosticAssets: diagnostic(
      baseId,
      config.recognitionPrompt,
      config.reasoningPrompt,
      config.misconceptionPrompt,
      config.misconceptions.map((item) => item.id)
    ),
    remediationAssets: remediation(baseId, config.title),
    ...config,
  };
}

export const wordPathKnowledgeMapV1 = normalizeWordPathMap({
  domain: 'wordpath',
  domainTitle: 'WordPath',
  modelVersion: 'wordpath-knowledge-map-v1',
  productionBehaviorChanged: false,
  structures: [
    {
      id: 'wordpath.part_whole',
      title: 'Part-Whole',
      description: 'Problems where a total is made from known or unknown parts.',
      modelMethod: { modelType: M.PART_WHOLE, visualRepresentation: 'bar split into additive parts' },
      mathPathLinks: ['fractions.p4.equal_parts_whole', 'F001', 'F003', 'F016', 'F017'],
      microSkills: [
        microSkill({
          id: 'wordpath.part_whole.identify_whole',
          title: 'Identify the whole and the parts',
          recognitionPrompt: 'A ribbon is split into a red part and a blue part. What is the whole?',
          reasoningPrompt: 'Explain why the two parts must add to the whole.',
          misconceptionPrompt: 'A student treats the red part as the whole. What structure mistake is this?',
          misconceptions: [
            misconception('WP-PW-001', 'Treats a part as the whole', 'Uses one part as the total in the calculation.', 'Does not identify the reference whole before calculating.'),
          ],
          mathPathLinks: ['F001', 'F003', 'fractions.p4.equal_parts_whole'],
        }),
        microSkill({
          id: 'wordpath.part_whole.find_missing_part',
          title: 'Find a missing part from whole and known part',
          recognitionPrompt: 'A total is 48. One part is 17. What kind of unknown is missing?',
          reasoningPrompt: 'What operation finds the missing part when the whole and one part are known?',
          misconceptionPrompt: 'A student adds 48 + 17 to find the missing part. What did they misunderstand?',
          misconceptions: [
            misconception('WP-PW-002', 'Adds instead of subtracts for missing part', 'Adds the whole and known part.', 'Does not understand inverse relationship between whole and part.'),
          ],
          mathPathLinks: ['F016', 'F017', 'fractions.p4.subtract_same_denominator'],
        }),
      ],
    },
    {
      id: 'wordpath.comparison',
      title: 'Comparison',
      description: 'Problems comparing two quantities by more, fewer, greater, smaller, or difference.',
      modelMethod: { modelType: M.COMPARISON, visualRepresentation: 'two aligned bars with difference segment' },
      mathPathLinks: ['F006', 'F007', 'F008', 'F009'],
      microSkills: [
        microSkill({
          id: 'wordpath.comparison.identify_difference',
          title: 'Identify the compared quantities and difference',
          recognitionPrompt: 'Ali has 12 more stickers than Ben. What does 12 represent?',
          reasoningPrompt: 'Draw two bars and mark the difference.',
          misconceptionPrompt: 'A student treats “12 more” as Ali’s total. What was missed?',
          misconceptions: [
            misconception('WP-CMP-001', 'Treats difference as total', 'Uses the difference as one full quantity.', 'Comparison language is not separated from total quantity.'),
          ],
          mathPathLinks: ['F006', 'F007', 'F008', 'fractions.p4.compare_same_denominator'],
        }),
        microSkill({
          id: 'wordpath.comparison.choose_greater_lesser',
          title: 'Decide which quantity is greater or lesser',
          recognitionPrompt: 'Mina has 3/8 more cake than Ravi. Who has more?',
          reasoningPrompt: 'Explain how the phrase “more than” changes the bar model.',
          misconceptionPrompt: 'A student subtracts from Mina even though Mina has more. What did they reverse?',
          misconceptions: [
            misconception('WP-CMP-002', 'Reverses greater and lesser quantities', 'Subtracts from the larger quantity or labels bars in reverse.', 'More/fewer comparison language is insecure.'),
          ],
          mathPathLinks: ['F009', 'fractions.p4.order_related_fractions'],
        }),
      ],
    },
    {
      id: 'wordpath.before_after',
      title: 'Before-After',
      description: 'Problems involving a quantity changing over time.',
      modelMethod: { modelType: M.BEFORE_AFTER, visualRepresentation: 'before bar and after bar with change segment' },
      mathPathLinks: ['F016', 'F017', 'F023'],
      microSkills: [
        microSkill({
          id: 'wordpath.before_after.identify_start_change_end',
          title: 'Identify start, change, and end quantities',
          recognitionPrompt: 'A box had 40 cards. 12 were removed. What is the starting quantity?',
          reasoningPrompt: 'Label start, change, and end in the story.',
          misconceptionPrompt: 'A student uses 12 as the starting amount. What was confused?',
          misconceptions: [
            misconception('WP-BA-001', 'Confuses change with starting amount', 'Uses the changed amount as the initial quantity.', 'Time sequence is not tracked.'),
          ],
          mathPathLinks: ['F017', 'F023', 'fractions.p4.model_one_step_word_problem'],
        }),
      ],
    },
    {
      id: 'wordpath.transfer',
      title: 'Transfer',
      description: 'Problems where one quantity moves from one group to another.',
      modelMethod: { modelType: M.TRANSFER, visualRepresentation: 'two bars with arrow showing movement' },
      mathPathLinks: ['F016', 'F017', 'F023'],
      microSkills: [
        microSkill({
          id: 'wordpath.transfer.track_giver_receiver',
          title: 'Track giver and receiver after transfer',
          recognitionPrompt: 'Sara gives 6 marbles to Tom. Who loses marbles?',
          reasoningPrompt: 'Explain how both bars change after the transfer.',
          misconceptionPrompt: 'A student subtracts 6 from both children. What did they miss?',
          misconceptions: [
            misconception('WP-TR-001', 'Changes both quantities in the same direction', 'Subtracts from both groups or adds to both groups.', 'Does not understand transfer conserves total but changes each group oppositely.'),
          ],
          mathPathLinks: ['F016', 'F017', 'fractions.p4.add_same_denominator', 'fractions.p4.subtract_same_denominator'],
        }),
      ],
    },
    {
      id: 'wordpath.repeated_quantity',
      title: 'Repeated Quantity',
      description: 'Problems involving equal groups, repeated amounts, or multiples.',
      modelMethod: { modelType: M.REPEATED_QUANTITY, visualRepresentation: 'equal unit bars repeated several times' },
      mathPathLinks: ['F020', 'F021', 'F023'],
      microSkills: [
        microSkill({
          id: 'wordpath.repeated_quantity.identify_unit_group',
          title: 'Identify the repeated unit group',
          recognitionPrompt: 'Each packet has 8 cards. There are 5 packets. What is the repeated unit?',
          reasoningPrompt: 'Explain why equal groups can be represented with repeated bars.',
          misconceptionPrompt: 'A student adds 8 + 5 instead of using 5 groups of 8. What structure did they miss?',
          misconceptions: [
            misconception('WP-RQ-001', 'Adds quantities instead of treating equal groups', 'Adds unit size and number of groups.', 'Does not identify repeated equal groups.'),
          ],
          mathPathLinks: ['F020', 'F021', 'fractions.p4.non_unit_fraction_of_quantity'],
        }),
      ],
    },
    {
      id: 'wordpath.unit_value',
      title: 'Unit Value',
      description: 'Problems requiring the value of one unit before scaling.',
      modelMethod: { modelType: M.UNIT_VALUE, visualRepresentation: 'multiple equal bars collapsed into one unit bar' },
      mathPathLinks: ['F020', 'F023'],
      microSkills: [
        microSkill({
          id: 'wordpath.unit_value.find_one_unit',
          title: 'Find one unit before scaling',
          recognitionPrompt: '4 equal notebooks cost $20. What should you find before the cost of 7 notebooks?',
          reasoningPrompt: 'Explain why one unit is needed before scaling to another number of units.',
          misconceptionPrompt: 'A student multiplies 20 by 7 directly. What step is missing?',
          misconceptions: [
            misconception('WP-UV-001', 'Scales from total without finding one unit', 'Multiplies total by target units directly.', 'Unit value has not been isolated.'),
          ],
          mathPathLinks: ['F020', 'fractions.p4.unit_fraction_of_quantity'],
        }),
      ],
    },
    {
      id: 'wordpath.fraction_of_quantity',
      title: 'Fraction of Quantity',
      description: 'Problems where a fraction is applied to a whole quantity.',
      modelMethod: { modelType: M.FRACTION_BAR, visualRepresentation: 'whole bar partitioned by denominator with selected numerator parts' },
      mathPathLinks: ['F020', 'F023'],
      microSkills: [
        microSkill({
          id: 'wordpath.fraction_quantity.identify_whole_fraction_unknown',
          title: 'Identify whole, fraction, and unknown',
          recognitionPrompt: '3/4 of 28 pupils joined a club. What is the whole?',
          reasoningPrompt: 'Explain how the denominator tells the number of equal groups.',
          misconceptionPrompt: 'A student starts with 3 instead of 28. What did they use as the whole?',
          misconceptions: [
            misconception('WP-FQ-001', 'Uses numerator as the whole', 'Starts calculation from numerator instead of total quantity.', 'Whole quantity is not identified before applying the fraction.'),
          ],
          mathPathLinks: ['F020', 'fractions.p4.non_unit_fraction_of_quantity'],
        }),
      ],
    },
    {
      id: 'wordpath.fraction_of_remainder',
      title: 'Fraction of Remainder',
      description: 'Problems where a later fraction applies to what is left, not the original quantity.',
      modelMethod: { modelType: M.FRACTION_BAR, visualRepresentation: 'original bar, removed segment, then remainder bar repartitioned' },
      mathPathLinks: ['F020', 'F023', 'F024', 'F025'],
      microSkills: [
        microSkill({
          id: 'wordpath.fraction_remainder.identify_original_removed_remainder',
          title: 'Identify original, removed amount, and remainder',
          recognitionPrompt: 'A class had 42 cards. Half were used. What remains before the next step?',
          reasoningPrompt: 'Explain why the remainder becomes the new whole for the next fraction.',
          misconceptionPrompt: 'A student finds the next fraction from 42 again. What quantity should they use instead?',
          misconceptions: [
            misconception('WP-FR-001', 'Uses original quantity instead of remainder', 'Applies each fraction to the starting amount.', 'Does not update the whole after removal.'),
            misconception('WP-FR-002', 'Applies fraction before finding remainder', 'Finds later fraction before subtracting the removed amount.', 'Sequence of events is not modelled.'),
          ],
          mathPathLinks: ['F024', 'F025', 'fractions.p4.fraction_remainder_reasoning'],
        }),
        microSkill({
          id: 'wordpath.fraction_remainder.distinguish_remaining_from_used',
          title: 'Distinguish remaining amount from used amount',
          recognitionPrompt: 'If 18 cards are used from 42, does 18 represent used or remaining?',
          reasoningPrompt: 'Label used and remaining parts on a bar model.',
          misconceptionPrompt: 'A student reports the amount used when asked how many are left. What did they miss?',
          misconceptions: [
            misconception('WP-FR-003', 'Answers used amount instead of remaining amount', 'Reports removed or used quantity as the final answer.', 'Question target is not tracked through the model.'),
          ],
          mathPathLinks: ['F023', 'F024', 'fractions.p4.model_one_step_word_problem'],
        }),
      ],
    },
    {
      id: 'wordpath.unchanged_total',
      title: 'Unchanged Total',
      description: 'Problems where parts change but the total remains constant.',
      modelMethod: { modelType: M.COMPARISON, visualRepresentation: 'before-after bars with same combined length' },
      mathPathLinks: ['F023', 'F024'],
      microSkills: [
        microSkill({
          id: 'wordpath.unchanged_total.track_constant_total',
          title: 'Track a total that stays unchanged',
          recognitionPrompt: 'Two groups exchange items but no items leave. What stays the same?',
          reasoningPrompt: 'Explain how a bar model shows the unchanged total.',
          misconceptionPrompt: 'A student changes the total after an exchange. What did they overlook?',
          misconceptions: [
            misconception('WP-UT-001', 'Changes the total when only parts change', 'Adds or subtracts from the combined total after transfer within the system.', 'Does not distinguish internal transfer from external change.'),
          ],
          mathPathLinks: ['F023', 'F024'],
        }),
      ],
    },
    {
      id: 'wordpath.constant_difference',
      title: 'Constant Difference',
      description: 'Problems where two quantities change by the same amount and their difference stays constant.',
      modelMethod: { modelType: M.COMPARISON, visualRepresentation: 'parallel before-after bars with unchanged difference segment' },
      mathPathLinks: ['F009', 'F023', 'F024'],
      microSkills: [
        microSkill({
          id: 'wordpath.constant_difference.track_same_change',
          title: 'Recognise when the difference stays constant',
          recognitionPrompt: 'Both children receive 5 more stickers. What happens to their difference?',
          reasoningPrompt: 'Explain why adding the same amount to both bars keeps the gap the same.',
          misconceptionPrompt: 'A student increases the difference after both amounts increase equally. What was misunderstood?',
          misconceptions: [
            misconception('WP-CD-001', 'Changes difference after equal change', 'Adds the common change to the difference.', 'Does not see that equal changes preserve comparison gap.'),
          ],
          mathPathLinks: ['F009', 'F023'],
        }),
      ],
    },
    {
      id: 'wordpath.rate',
      title: 'Rate',
      description: 'Problems comparing quantities per unit of another measure.',
      modelMethod: { modelType: M.RATE_TABLE, visualRepresentation: 'two-column rate table with one-unit row' },
      mathPathLinks: ['F020', 'F023'],
      microSkills: [
        microSkill({
          id: 'wordpath.rate.identify_per_unit',
          title: 'Identify the per-unit relationship',
          recognitionPrompt: 'A car travels 60 km in 2 hours. What does km per hour ask for?',
          reasoningPrompt: 'Explain why rate needs one unit of time or quantity.',
          misconceptionPrompt: 'A student reports 60 instead of 30 km/h. What did they not find?',
          misconceptions: [
            misconception('WP-RT-001', 'Uses total instead of per-unit value', 'Reports the total quantity as the rate.', 'Does not divide by the unit measure.'),
          ],
          mathPathLinks: ['F020', 'wordpath.unit_value.find_one_unit'],
        }),
      ],
    },
    {
      id: 'wordpath.ratio',
      title: 'Ratio Structures',
      description: 'Problems involving comparison by parts and shared units.',
      modelMethod: { modelType: M.RATIO_BAR, visualRepresentation: 'ratio bars divided into equal units' },
      mathPathLinks: ['F023', 'F024'],
      microSkills: [
        microSkill({
          id: 'wordpath.ratio.identify_ratio_units',
          title: 'Identify ratio units and actual value',
          recognitionPrompt: 'The ratio of red to blue beads is 2:3. How many equal units are shown?',
          reasoningPrompt: 'Explain the difference between ratio units and actual number of beads.',
          misconceptionPrompt: 'A student treats 2 and 3 as the actual bead counts. What did they confuse?',
          misconceptions: [
            misconception('WP-RA-001', 'Treats ratio units as actual quantities', 'Uses ratio numbers directly as final amounts.', 'Does not scale ratio units to actual value.'),
          ],
          mathPathLinks: ['F023', 'F024'],
        }),
      ],
    },
    {
      id: 'wordpath.percentage',
      title: 'Percentage Structures',
      description: 'Problems interpreting percentage as part of a hundred or as change.',
      modelMethod: { modelType: M.PERCENT_BAR, visualRepresentation: '100 percent bar with marked part, whole, and change' },
      mathPathLinks: ['F020', 'F023', 'F025'],
      microSkills: [
        microSkill({
          id: 'wordpath.percentage.identify_percent_base',
          title: 'Identify the percentage base',
          recognitionPrompt: 'A price increases by 20%. The 20% is of which amount?',
          reasoningPrompt: 'Explain why percentage change must refer to a base quantity.',
          misconceptionPrompt: 'A student takes 20% of the new price instead of the original price. What was confused?',
          misconceptions: [
            misconception('WP-PC-001', 'Uses wrong percentage base', 'Applies percentage to the final amount when the original base is required.', 'Base quantity is not identified before percentage calculation.'),
          ],
          mathPathLinks: ['F020', 'F025'],
        }),
      ],
    },
  ],
});

export default wordPathKnowledgeMapV1;
