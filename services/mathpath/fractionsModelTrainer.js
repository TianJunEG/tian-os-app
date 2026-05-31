function gcd(a, b) {
  let x = Math.abs(Number(a) || 0);
  let y = Math.abs(Number(b) || 0);
  while (y) [x, y] = [y, x % y];
  return x || 1;
}

function simplifyFraction(numerator, denominator) {
  const divisor = gcd(numerator, denominator);
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor,
    display: `${numerator / divisor}/${denominator / divisor}`,
  };
}

export function buildBranchingRemainderModel({
  wholeLabel = 'whole',
  firstBranches = [],
  remainderLabel = 'remainder',
  secondBranches = [],
  finalAnswer = '',
} = {}) {
  return {
    type: 'branching_remainder_model',
    wholeLabel,
    firstBranches,
    remainderLabel,
    secondBranches,
    finalAnswer,
  };
}

export function buildRemainderSubdivisionScenario({
  wholeLabel = '1 whole',
  totalQuantity = null,
  unit = '',
  firstRemovedNumerator,
  firstDenominator,
  secondRemovedNumerator,
  secondDenominator,
  finalLabel = '',
} = {}) {
  const remainingNumerator = firstDenominator - firstRemovedNumerator;
  const equivalentDenominator = firstDenominator * secondDenominator;
  const remainderSubparts = remainingNumerator * secondDenominator;
  const removedSubparts = remainingNumerator * secondRemovedNumerator;
  const finalSubparts = remainderSubparts - removedSubparts;
  const simplified = simplifyFraction(finalSubparts, equivalentDenominator);
  const finalQuantity = Number.isFinite(Number(totalQuantity))
    ? (Number(totalQuantity) * finalSubparts) / equivalentDenominator
    : null;
  return {
    wholeLabel,
    totalQuantity,
    unit,
    firstRemoved: `${firstRemovedNumerator}/${firstDenominator}`,
    remainder: `${remainingNumerator}/${firstDenominator}`,
    secondRemovedOfRemainder: `${secondRemovedNumerator}/${secondDenominator}`,
    selectedRegion: Array.from({ length: remainingNumerator }, (_, i) => firstRemovedNumerator + i + 1),
    subdivideRemainingBy: secondDenominator,
    equivalentDenominator,
    remainderAsEquivalent: `${remainderSubparts}/${equivalentDenominator}`,
    removedAsEquivalent: `${removedSubparts}/${equivalentDenominator}`,
    finalUnsimplified: `${finalSubparts}/${equivalentDenominator}`,
    finalSimplified: simplified.display,
    finalAnswer: finalLabel ? `${simplified.display} ${finalLabel}` : simplified.display,
    finalQuantity,
    finalQuantityAnswer: finalQuantity === null ? null : `${finalQuantity}${unit ? ` ${unit}` : ''}`,
    branchModel: buildBranchingRemainderModel({
      wholeLabel,
      firstBranches: [
        { label: 'removed', value: `${firstRemovedNumerator}/${firstDenominator}` },
        { label: 'remainder', value: `${remainingNumerator}/${firstDenominator}` },
      ],
      remainderLabel: `${remainingNumerator}/${firstDenominator}`,
      secondBranches: [
        { label: 'removed from remainder', value: `${removedSubparts}/${equivalentDenominator}` },
        { label: 'left', value: finalQuantity === null ? simplified.display : `${simplified.display} = ${finalQuantity}${unit ? ` ${unit}` : ''}` },
      ],
      finalAnswer: finalQuantity === null ? simplified.display : `${finalQuantity}${unit ? ` ${unit}` : ''}`,
    }),
  };
}

export function buildBackwardRemainderScenario({
  wholeLabel = 'unknown whole',
  fixedRemovedQuantity,
  unit = '',
  secondRemovedNumerator,
  secondDenominator,
  finalLeftNumerator,
  finalLeftDenominator,
} = {}) {
  const remainderLeftNumerator = secondDenominator - secondRemovedNumerator;
  const remainderLeftDenominator = secondDenominator;
  const remainderOfWholeNumerator = finalLeftNumerator * remainderLeftDenominator;
  const remainderOfWholeDenominator = finalLeftDenominator * remainderLeftNumerator;
  const simplifiedRemainder = simplifyFraction(remainderOfWholeNumerator, remainderOfWholeDenominator);
  const removedNumerator = simplifiedRemainder.denominator - simplifiedRemainder.numerator;
  const removedFraction = simplifyFraction(removedNumerator, simplifiedRemainder.denominator);
  const unitValue = Number.isFinite(Number(fixedRemovedQuantity))
    ? Number(fixedRemovedQuantity) / removedFraction.numerator
    : null;
  const initialQuantity = unitValue === null ? null : unitValue * removedFraction.denominator;
  return {
    wholeLabel,
    fixedRemovedQuantity,
    unit,
    secondRemovedOfRemainder: `${secondRemovedNumerator}/${secondDenominator}`,
    finalLeftOfRemainder: `${remainderLeftNumerator}/${remainderLeftDenominator}`,
    finalLeftOfWhole: `${finalLeftNumerator}/${finalLeftDenominator}`,
    mondayRemainderOfWhole: simplifiedRemainder.display,
    fixedRemovedFractionOfWhole: removedFraction.display,
    unitValue,
    initialQuantity,
    initialQuantityAnswer: initialQuantity === null ? null : `${initialQuantity}${unit ? ` ${unit}` : ''}`,
    branchModel: buildBranchingRemainderModel({
      wholeLabel,
      firstBranches: [
        { label: 'fixed removed', value: fixedRemovedQuantity === undefined ? 'unknown' : `${fixedRemovedQuantity}${unit ? ` ${unit}` : ''}` },
        { label: 'remainder', value: simplifiedRemainder.display },
      ],
      remainderLabel: simplifiedRemainder.display,
      secondBranches: [
        { label: 'removed from remainder', value: `${secondRemovedNumerator}/${secondDenominator}` },
        { label: 'left', value: `${finalLeftNumerator}/${finalLeftDenominator}` },
      ],
      finalAnswer: initialQuantity === null ? '' : `${initialQuantity}${unit ? ` ${unit}` : ''}`,
    }),
  };
}

export function buildTwoStageRemainderSpendScenario({
  wholeLabel = 'unknown whole',
  firstRemovedNumerator,
  firstDenominator,
  secondRemovedNumerator,
  secondDenominator,
  knownLaterSpent,
  finalLeft,
  unitPrefix = '$',
} = {}) {
  const afterSecondRemainderNumerator = secondDenominator - secondRemovedNumerator;
  const afterSecondKnownTotal = Number(knownLaterSpent) + Number(finalLeft);
  const oneShareAfterFirstRemainder = afterSecondKnownTotal / afterSecondRemainderNumerator;
  const secondSpentAmount = oneShareAfterFirstRemainder * secondRemovedNumerator;
  const afterFirstRemainderAmount = oneShareAfterFirstRemainder * secondDenominator;
  const afterFirstRemainderNumerator = firstDenominator - firstRemovedNumerator;
  const originalUnitValue = afterFirstRemainderAmount / afterFirstRemainderNumerator;
  const initialAmount = originalUnitValue * firstDenominator;
  const firstRemovedAmount = originalUnitValue * firstRemovedNumerator;
  const format = (value) => `${unitPrefix}${value}`;
  return {
    wholeLabel,
    firstRemoved: `${firstRemovedNumerator}/${firstDenominator}`,
    firstRemovedAmount,
    afterFirstRemainder: `${afterFirstRemainderNumerator}/${firstDenominator}`,
    afterFirstRemainderAmount,
    secondRemovedOfRemainder: `${secondRemovedNumerator}/${secondDenominator}`,
    secondSpentAmount,
    afterSecondRemainder: `${afterSecondRemainderNumerator}/${secondDenominator}`,
    knownLaterSpent,
    finalLeft,
    afterSecondKnownTotal,
    initialAmount,
    firstRemovedAnswer: format(firstRemovedAmount),
    secondSpentAnswer: format(secondSpentAmount),
    initialAmountAnswer: format(initialAmount),
    branchModel: buildBranchingRemainderModel({
      wholeLabel,
      firstBranches: [
        { label: 'parents', value: `${firstRemovedNumerator}/${firstDenominator}` },
        { label: 'remainder', value: `${afterFirstRemainderNumerator}/${firstDenominator} = ${format(afterFirstRemainderAmount)}` },
      ],
      remainderLabel: `${afterFirstRemainderNumerator}/${firstDenominator}`,
      secondBranches: [
        { label: 'transport', value: `${secondRemovedNumerator}/${secondDenominator} = ${format(secondSpentAmount)}` },
        { label: 'food + left', value: `${afterSecondRemainderNumerator}/${secondDenominator} = ${format(afterSecondKnownTotal)}` },
      ],
      finalAnswer: format(initialAmount),
    }),
  };
}

const CHENG_TARTS_SCENARIO = buildRemainderSubdivisionScenario({
  wholeLabel: 'all tarts',
  firstRemovedNumerator: 2,
  firstDenominator: 5,
  secondRemovedNumerator: 1,
  secondDenominator: 6,
});

const BUTTONS_GREEN_SCENARIO = buildRemainderSubdivisionScenario({
  wholeLabel: '75 buttons',
  totalQuantity: 75,
  unit: 'buttons',
  firstRemovedNumerator: 2,
  firstDenominator: 5,
  secondRemovedNumerator: 1,
  secondDenominator: 3,
});

const RAJU_RICE_SCENARIO = buildBackwardRemainderScenario({
  wholeLabel: 'unknown rice',
  fixedRemovedQuantity: 5,
  unit: 'kg',
  secondRemovedNumerator: 5,
  secondDenominator: 9,
  finalLeftNumerator: 1,
  finalLeftDenominator: 6,
});

const LIM_MONEY_SCENARIO = buildTwoStageRemainderSpendScenario({
  wholeLabel: 'unknown money',
  firstRemovedNumerator: 1,
  firstDenominator: 3,
  secondRemovedNumerator: 2,
  secondDenominator: 5,
  knownLaterSpent: 360,
  finalLeft: 120,
});

const MODEL_TRAINER_TEMPLATES = [
  {
    template_id: 'fraction_of_whole_left',
    linked_skill_ids: ['F001', 'F003', 'F020', 'F023'],
    question_type: 'fraction_of_whole',
    title: 'Fraction of a Whole',
    prompt: 'Sally has 1 litre of juice. She gave away 2/5 of it. How much juice does she have left?',
    mode_labels: {
      i_do: 'Watch the bar model appear one step at a time.',
      we_do: 'Choose or enter the next model step.',
      you_do: 'Draw the model independently, then check your answer.',
    },
    model_steps: [
      {
        step_id: 'draw_whole',
        title: 'Draw the whole',
        instruction: 'Draw 1 whole bar labelled 1 L.',
        model: { wholeLabel: '1 L', denominator: 1, removedParts: [], remainingParts: [1] },
      },
      {
        step_id: 'split_fifths',
        title: 'Split into fifths',
        instruction: 'Split the whole into 5 equal parts.',
        model: { wholeLabel: '1 L', denominator: 5, removedParts: [], remainingParts: [1, 2, 3, 4, 5] },
        student_prompt: {
          type: 'number',
          question: 'How many equal parts should the whole be split into?',
          expected_answer: '5',
        },
        expected_actions: ['split_whole_into_denominator_parts'],
      },
      {
        step_id: 'remove_two_fifths',
        title: 'Show the amount given away',
        instruction: 'Shade or cross out 2 parts to show 2/5 given away.',
        model: { wholeLabel: '1 L', denominator: 5, removedParts: [1, 2], remainingParts: [3, 4, 5] },
        student_prompt: {
          type: 'number',
          question: 'How many fifths should be shaded or crossed out?',
          expected_answer: '2',
        },
        expected_actions: ['shade_or_remove_selected_parts'],
      },
      {
        step_id: 'count_remaining',
        title: 'Count what remains',
        instruction: 'Count the remaining 3 parts.',
        model: { wholeLabel: '1 L', denominator: 5, removedParts: [1, 2], remainingParts: [3, 4, 5], highlightRemaining: true },
        student_prompt: {
          type: 'number',
          question: 'How many fifths are left?',
          expected_answer: '3',
        },
        expected_actions: ['count_remaining_parts'],
      },
      {
        step_id: 'answer',
        title: 'Write the answer',
        instruction: 'Answer: 3/5 L.',
        model: { wholeLabel: '1 L', denominator: 5, removedParts: [1, 2], remainingParts: [3, 4, 5], finalAnswer: '3/5 L' },
        sense_check: 'Does 3/5 L make sense? It is smaller than 1 L because some juice was given away.',
      },
    ],
    common_errors: [
      'Student splits the whole into the wrong number of parts.',
      'Student shades/removes the wrong number of parts.',
      'Student counts the remaining parts wrongly.',
      'Student gives a reasonable calculation but wrong unit.',
    ],
    remediation_hint: 'Use the denominator to split the whole first, then remove the numerator parts.',
    sense_check_hints: [
      'Should the answer be bigger or smaller than the original amount?',
      'Did you keep the litre unit?',
      'Can you work backwards to check?',
    ],
  },
  {
    template_id: 'remainder_after_giving_away',
    linked_skill_ids: ['F003', 'F020', 'F023', 'F024'],
    question_type: 'remainder_after_giving_away',
    title: 'Remainder After Giving Away',
    prompt: 'Ali had 1 whole cake. He gave away 3/8. What fraction was left?',
    mode_labels: {
      i_do: 'See how a remainder model is built.',
      we_do: 'Decide the next split, removal, and remaining count.',
      you_do: 'Draw the remainder model independently.',
    },
    model_steps: [
      {
        step_id: 'draw_whole',
        title: 'Draw the whole',
        instruction: 'Draw 1 whole bar.',
        model: { wholeLabel: '1 whole cake', denominator: 1, removedParts: [], remainingParts: [1] },
      },
      {
        step_id: 'split_eighths',
        title: 'Split into eighths',
        instruction: 'Split the whole into 8 equal parts.',
        model: { wholeLabel: '1 whole cake', denominator: 8, removedParts: [], remainingParts: [1, 2, 3, 4, 5, 6, 7, 8] },
        student_prompt: {
          type: 'number',
          question: 'The denominator is 8. How many equal parts do we draw?',
          expected_answer: '8',
        },
        expected_actions: ['split_whole_into_denominator_parts'],
      },
      {
        step_id: 'remove_three_eighths',
        title: 'Remove 3/8',
        instruction: 'Remove or shade 3 parts.',
        model: { wholeLabel: '1 whole cake', denominator: 8, removedParts: [1, 2, 3], remainingParts: [4, 5, 6, 7, 8] },
        student_prompt: {
          type: 'number',
          question: 'How many eighths are given away?',
          expected_answer: '3',
        },
        expected_actions: ['shade_or_remove_selected_parts'],
      },
      {
        step_id: 'count_remaining',
        title: 'Count the remainder',
        instruction: 'Count the remaining 5 parts.',
        model: { wholeLabel: '1 whole cake', denominator: 8, removedParts: [1, 2, 3], remainingParts: [4, 5, 6, 7, 8], highlightRemaining: true },
        student_prompt: {
          type: 'number',
          question: 'How many eighths are left?',
          expected_answer: '5',
        },
        expected_actions: ['count_remaining_parts'],
      },
      {
        step_id: 'answer',
        title: 'Write the answer',
        instruction: 'Answer: 5/8.',
        model: { wholeLabel: '1 whole cake', denominator: 8, removedParts: [1, 2, 3], remainingParts: [4, 5, 6, 7, 8], finalAnswer: '5/8' },
        sense_check: 'Does 5/8 make sense? It is less than 1 whole and more than half.',
      },
    ],
    common_errors: [
      'Student splits the whole into the wrong number of parts.',
      'Student shades/removes the wrong number of parts.',
      'Student counts the remaining parts wrongly.',
      'Student gives an answer with the wrong denominator.',
    ],
    remediation_hint: 'The remainder is what is left after removing the given-away parts.',
    sense_check_hints: [
      'Should the answer be bigger or smaller than the original amount?',
      'Did you count the parts left, not the parts removed?',
      'Did the denominator stay as eighths?',
    ],
  },
  {
    template_id: 'fraction_of_remainder_subdivision',
    linked_skill_ids: ['F020', 'F023', 'F024', 'F025'],
    question_type: 'fraction_of_remainder_with_subdivision',
    title: 'Fraction of the Remainder',
    prompt: 'Sally had 1 litre of juice. She gave away 2/5. Then she drank 1/2 of the remainder. How much juice was left?',
    sample_variants: [
      {
        variant_id: 'cheng_tarts_strawberry',
        prompt: 'Cheng baked some tarts. 2/5 of the tarts were pineapple tarts. 1/6 of the remaining tarts were chocolate tarts and the rest were strawberry tarts. What fraction of the tarts were strawberry tarts? Give your answer in the simplest form.',
        scenario: CHENG_TARTS_SCENARIO,
        final_answer: '1/2',
        model_note: 'After removing 2/5, the remainder is 3/5. Split that remainder into 6 groups: 3/5 = 18/30. Chocolate is 1/6 of the remainder, or 3/30. Strawberry is 15/30 = 1/2.',
      },
      {
        variant_id: 'buttons_green_count',
        prompt: 'There are 75 buttons in a box. 2/5 of the buttons are blue. 1/3 of the remaining buttons are red and the rest are green. How many buttons are green?',
        scenario: BUTTONS_GREEN_SCENARIO,
        final_answer: '30 buttons',
        model_note: 'After removing 2/5 blue buttons, 3/5 remain. Split the remainder into 3 groups. Red is 1 group, so green is 2 groups: 2/3 of 3/5 = 6/15 = 2/5. Then 2/5 of 75 = 30 buttons.',
      },
      {
        variant_id: 'raju_rice_initial_mass',
        prompt: 'Mr Raju had some rice. He cooked 5 kg of rice on Monday. He cooked 5/9 of the remaining rice on Tuesday. He had 1/6 of the rice left. What was the mass of the rice he had at first?',
        scenario: RAJU_RICE_SCENARIO,
        final_answer: '8 kg',
        model_note: 'Work backwards. After Tuesday, 4/9 of the Monday remainder is left, and that equals 1/6 of the original rice. So the Monday remainder is 1/6 ÷ 4/9 = 3/8 of the original. The 5 kg cooked on Monday is the other 5/8. If 5/8 is 5 kg, then 1/8 is 1 kg and the whole is 8 kg.',
      },
      {
        variant_id: 'lim_money_transport_and_original',
        prompt: 'Mrs Lim had a sum of money. She gave 1/3 of the money to her parents. She spent 2/5 of the remainder on transport and spent $360 on food. She had $120 left. a) How much money did she spend on transport? b) How much money did she have at first?',
        scenario: LIM_MONEY_SCENARIO,
        final_answer: 'a) $320 b) $1200',
        model_note: 'Work backwards from the known final amounts. Food and money left are $360 + $120 = $480. This is 3/5 of the remainder after giving money to her parents, so 1/5 is $160. Transport is 2/5, so transport is $320. The remainder after parents is $800, which is 2/3 of the original amount. Therefore 1/3 is $400 and the original amount is $1200.',
      },
    ],
    mode_labels: {
      i_do: 'Watch the remainder become the new amount being divided.',
      we_do: 'Pause to identify the remainder and the subdivision.',
      you_do: 'Draw the full model independently, including the subdivision.',
    },
    model_steps: [
      {
        step_id: 'draw_whole',
        title: 'Draw the whole',
        instruction: 'Draw 1 whole bar labelled 1 L.',
        model: { wholeLabel: '1 L', denominator: 1, removedParts: [], remainingParts: [1] },
      },
      {
        step_id: 'split_fifths',
        title: 'Split into fifths',
        instruction: 'Split the whole into 5 equal parts.',
        model: { wholeLabel: '1 L', denominator: 5, removedParts: [], remainingParts: [1, 2, 3, 4, 5] },
        student_prompt: {
          type: 'number',
          question: 'First denominator: how many equal parts?',
          expected_answer: '5',
        },
        expected_actions: ['split_whole_into_denominator_parts'],
      },
      {
        step_id: 'remove_two_fifths',
        title: 'Remove 2/5',
        instruction: 'Remove or shade 2/5.',
        model: { wholeLabel: '1 L', denominator: 5, removedParts: [1, 2], remainingParts: [3, 4, 5] },
        student_prompt: {
          type: 'number',
          question: 'How many fifths are removed first?',
          expected_answer: '2',
        },
        expected_actions: ['shade_or_remove_selected_parts'],
      },
      {
        step_id: 'identify_remainder',
        title: 'Name the remainder',
        instruction: 'Identify the remainder as 3/5.',
        model: { wholeLabel: '1 L', denominator: 5, removedParts: [1, 2], remainingParts: [3, 4, 5], highlightRemaining: true, remainderLabel: '3/5 remains' },
        student_prompt: {
          type: 'text',
          question: 'What fraction remains after giving away 2/5?',
          expected_answer: '3/5',
        },
        expected_actions: ['select_remaining_region'],
      },
      {
        step_id: 'remainder_is_new_amount',
        title: 'The remainder is the new amount',
        instruction: 'Treat the remaining 3/5 as the new amount being divided.',
        model: { wholeLabel: '1 L', denominator: 5, removedParts: [1, 2], remainingParts: [3, 4, 5], highlightRemaining: true, remainderLabel: 'New amount: 3/5' },
        student_prompt: {
          type: 'choice',
          question: 'Are we dividing the original whole or the remainder now?',
          expected_answer: 'remainder',
          choices: ['original whole', 'remainder'],
        },
        expected_actions: ['treat_remainder_as_new_amount'],
      },
      {
        step_id: 'subdivide_remainder',
        title: 'Subdivide the remainder',
        instruction: 'Subdivide the remaining region into 2 equal groups.',
        model: {
          wholeLabel: '1 L',
          denominator: 5,
          removedParts: [1, 2],
          remainingParts: [3, 4, 5],
          selectedRegion: [3, 4, 5],
          subdivideRemainingBy: 2,
          equivalentDenominator: 10,
          equivalence: 'Each fifth is split into 2 smaller parts, so fifths become tenths.',
          branchModel: buildBranchingRemainderModel({
            wholeLabel: '1 L',
            firstBranches: [
              { label: 'given away', value: '2/5' },
              { label: 'remainder', value: '3/5' },
            ],
            remainderLabel: '3/5',
            secondBranches: [
              { label: 'drank', value: '3/10' },
              { label: 'left', value: '3/10 L' },
            ],
            finalAnswer: '3/10 L',
          }),
        },
        student_prompt: {
          type: 'number',
          question: 'To take 1/2 of the remainder, how many groups do we split the remainder into?',
          expected_answer: '2',
        },
        expected_actions: ['subdivide_remaining_region'],
      },
      {
        step_id: 'remove_half_remainder',
        title: 'Remove half of the remainder',
        instruction: 'Remove 1/2 of the remainder. That is 3 of the 6 small parts in the remainder.',
        model: {
          wholeLabel: '1 L',
          denominator: 5,
          removedParts: [1, 2],
          remainingParts: [3, 4, 5],
          selectedRegion: [3, 4, 5],
          subdivideRemainingBy: 2,
          equivalentDenominator: 10,
          removedSubparts: [1, 2, 3],
          finalSubpartsLeft: [4, 5, 6],
          equivalence: '3/5 = 6/10, and half of 6/10 is 3/10.',
        },
        student_prompt: {
          type: 'number',
          question: 'After splitting 3/5 into 6 small parts, how many small parts are left after removing half?',
          expected_answer: '3',
        },
        expected_actions: ['remove_fraction_of_remainder'],
      },
      {
        step_id: 'answer',
        title: 'Write the final answer',
        instruction: 'Show the final amount left as 3/10 L.',
        model: {
          wholeLabel: '1 L',
          denominator: 5,
          removedParts: [1, 2],
          remainingParts: [3, 4, 5],
          subdivideRemainingBy: 2,
          equivalentDenominator: 10,
          removedSubparts: [1, 2, 3],
          finalSubpartsLeft: [4, 5, 6],
          finalAnswer: '3/10 L',
          equivalence: 'Final amount left: 3/10 L.',
        },
        sense_check: 'Does 3/10 L make sense? Sally gave away some juice, then drank half of what remained, so the answer must be less than 3/5 L.',
      },
    ],
    common_errors: [
      'Student does not treat the remainder as the new amount.',
      'Student fails to subdivide the remainder correctly.',
      'Student gives an answer with the wrong denominator.',
      'Student gives a reasonable calculation but wrong unit.',
    ],
    remediation_hint: 'After the first removal, circle the remainder. The next fraction acts on that circled remainder, not the original whole.',
    sense_check_hints: [
      'Did you divide the remainder, or the original whole?',
      'Should the answer be bigger or smaller than 3/5 L?',
      'Did you convert fifths into tenths before writing the final answer?',
      'Can you work backwards to check?',
    ],
  },
];

const TEMPLATE_BY_ID = new Map(MODEL_TRAINER_TEMPLATES.map((template) => [template.template_id, template]));

export function listFractionsModelTrainerTemplates({ skillId = null } = {}) {
  const normalizedSkillId = skillId ? String(skillId).toUpperCase() : null;
  return MODEL_TRAINER_TEMPLATES
    .filter((template) => !normalizedSkillId || template.linked_skill_ids.includes(normalizedSkillId))
    .map((template) => ({
      template_id: template.template_id,
      linked_skill_ids: [...template.linked_skill_ids],
      question_type: template.question_type,
      title: template.title,
      prompt: template.prompt,
      remediation_hint: template.remediation_hint,
    }));
}

export function getFractionsModelTrainerTemplate(templateId) {
  const template = TEMPLATE_BY_ID.get(String(templateId || ''));
  if (!template) return null;
  return JSON.parse(JSON.stringify(template));
}

export function getFractionsModelTrainerForSkill(skillId) {
  return listFractionsModelTrainerTemplates({ skillId });
}

export function getModelDrawingRemediationPathway({ mistakeCode = '', skillId = '' } = {}) {
  const code = String(mistakeCode || '').toUpperCase();
  const normalizedSkillId = String(skillId || '').toUpperCase();
  const remainderMistakes = new Set(['M008', 'M012']);
  const remainderSkills = new Set(['F020', 'F023', 'F024', 'F025']);
  const templateId = remainderMistakes.has(code) || remainderSkills.has(normalizedSkillId)
    ? 'fraction_of_remainder_subdivision'
    : normalizedSkillId === 'F003'
      ? 'remainder_after_giving_away'
      : 'fraction_of_whole_left';
  const template = getFractionsModelTrainerTemplate(templateId);
  return {
    type: 'model_drawing_trainer',
    label: 'Try the model drawing trainer for fraction remainder.',
    template_id: templateId,
    skill_ids: template?.linked_skill_ids || [],
    href: `/student/mathpath/fractions/model-trainer/${templateId}`,
  };
}

export function validateFractionsModelTrainerTemplates() {
  const templates = MODEL_TRAINER_TEMPLATES;
  const subdivision = getFractionsModelTrainerTemplate('fraction_of_remainder_subdivision');
  const subdivisionStep = subdivision?.model_steps?.find((step) => step.step_id === 'subdivide_remainder');
  const finalStep = subdivision?.model_steps?.find((step) => step.step_id === 'answer');
  const chengVariant = subdivision?.sample_variants?.find((variant) => variant.variant_id === 'cheng_tarts_strawberry');
  const buttonsVariant = subdivision?.sample_variants?.find((variant) => variant.variant_id === 'buttons_green_count');
  const rajuVariant = subdivision?.sample_variants?.find((variant) => variant.variant_id === 'raju_rice_initial_mass');
  const limVariant = subdivision?.sample_variants?.find((variant) => variant.variant_id === 'lim_money_transport_and_original');
  const allHaveRequiredShape = templates.every((template) => (
    template.template_id &&
    template.question_type &&
    Array.isArray(template.linked_skill_ids) &&
    template.linked_skill_ids.length > 0 &&
    Array.isArray(template.model_steps) &&
    template.model_steps.length >= 5 &&
    Array.isArray(template.common_errors) &&
    template.remediation_hint
  ));
  return {
    isValid:
      templates.length === 3 &&
      allHaveRequiredShape &&
      subdivisionStep?.model?.subdivideRemainingBy === 2 &&
      subdivisionStep?.model?.equivalentDenominator === 10 &&
      finalStep?.model?.finalAnswer === '3/10 L' &&
      chengVariant?.scenario?.finalSimplified === '1/2' &&
      buttonsVariant?.scenario?.finalQuantity === 30 &&
      rajuVariant?.scenario?.initialQuantity === 8 &&
      limVariant?.scenario?.secondSpentAmount === 320 &&
      limVariant?.scenario?.initialAmount === 1200 &&
      limVariant?.scenario?.branchModel?.type === 'branching_remainder_model',
    checks: {
      hasThreeTemplates: templates.length === 3,
      allHaveRequiredShape,
      supportsRemainderSubdivision: subdivisionStep?.model?.subdivideRemainingBy === 2,
      updatesEquivalentDenominator: subdivisionStep?.model?.equivalentDenominator === 10,
      finalAnswerIsThreeTenths: finalStep?.model?.finalAnswer === '3/10 L',
      chengVariantSimplifiesToHalf: chengVariant?.scenario?.finalSimplified === '1/2',
      buttonsVariantQuantityIsThirty: buttonsVariant?.scenario?.finalQuantity === 30,
      rajuVariantInitialMassIsEight: rajuVariant?.scenario?.initialQuantity === 8,
      limVariantTransportIsThreeTwenty: limVariant?.scenario?.secondSpentAmount === 320,
      limVariantOriginalIsTwelveHundred: limVariant?.scenario?.initialAmount === 1200,
      supportsBranchingModel: limVariant?.scenario?.branchModel?.type === 'branching_remainder_model',
    },
  };
}

export const fractionsModelTrainer = {
  listFractionsModelTrainerTemplates,
  buildRemainderSubdivisionScenario,
  buildBranchingRemainderModel,
  buildBackwardRemainderScenario,
  buildTwoStageRemainderSpendScenario,
  getFractionsModelTrainerTemplate,
  getFractionsModelTrainerForSkill,
  getModelDrawingRemediationPathway,
  validateFractionsModelTrainerTemplates,
};

export default fractionsModelTrainer;
