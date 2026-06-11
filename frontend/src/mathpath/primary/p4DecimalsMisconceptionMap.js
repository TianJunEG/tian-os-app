const misconceptions = [
  {
    tag: 'confuses_decimal_columns',
    label: 'Mixes up tenths, hundredths, thousandths columns',
    description: 'Assigns a digit to the wrong decimal place, e.g. reads 3.405 as "3 ones, 4 hundredths, 0 thousandths, 5 tenths".',
    remediationExplanation: 'After the decimal point, read from left to right: tenths, hundredths, thousandths. Use a decimal place-value chart.',
    visualScaffold: 'decimal_place_value_chart',
    recheckPattern: 'Write the value of the underlined digit in a decimal number.',
    parentNote: 'Draw a place-value table that extends past the decimal point (O . t h th). Have your child place digits into the correct columns using prices or measurements.',
    relatedSkills: ['P4-DEC-01', 'P4-DEC-02', 'P4-DEC-03', 'P4-DEC-06'],
  },
  {
    tag: 'ignores_decimal_point',
    label: 'Treats decimals as whole numbers',
    description: 'Ignores the decimal point entirely, e.g. reads 3.45 as 345 or adds 1.2 + 3.45 as 12 + 345 = 357.',
    remediationExplanation: 'The decimal point separates ones from tenths. 3.45 means 3 ones and 45 hundredths, not three hundred and forty-five.',
    visualScaffold: 'decimal_vs_whole_comparison',
    recheckPattern: 'What does each digit in 4.72 stand for?',
    parentNote: 'Use money as a concrete example: $3.45 is not $345. Ask your child to read prices aloud and explain what each digit means.',
    relatedSkills: ['P4-DEC-01', 'P4-DEC-02', 'P4-DEC-04'],
  },
  {
    tag: 'more_digits_means_larger',
    label: 'Thinks more decimal digits means a larger number',
    description: 'Believes 0.65 > 0.7 because 65 > 7, ignoring that they are in different decimal places.',
    remediationExplanation: 'Compare decimals by looking at each place value from left to right. Pad with trailing zeros if needed: 0.7 = 0.70, and 0.70 > 0.65.',
    visualScaffold: 'decimal_comparison_with_zeros',
    recheckPattern: 'Which is greater: 0.8 or 0.75?',
    parentNote: 'Ask your child to write both decimals with the same number of decimal places (pad with zeros) before comparing. Use a number line to show that 0.7 is further right than 0.65.',
    relatedSkills: ['P4-DEC-02'],
  },
  {
    tag: 'misaligns_decimal_points',
    label: 'Misaligns decimal points when adding or subtracting',
    description: 'Lines up the rightmost digits instead of aligning decimal points, e.g. computes 1.2 + 3.45 as 1.2 + 3.45 with the 2 above the 5.',
    remediationExplanation: 'Always line up the decimal points before adding or subtracting. Pad with trailing zeros so both numbers have the same number of decimal places.',
    visualScaffold: 'column_addition_decimal_aligned',
    recheckPattern: 'Add 2.3 + 1.45, showing your working.',
    parentNote: 'Have your child always write the decimal point first, then fill in the digits on each side. Use squared paper to keep columns aligned.',
    relatedSkills: ['P4-DEC-04'],
  },
  {
    tag: 'rounds_wrong_direction',
    label: 'Rounds the wrong way or uses the wrong deciding digit',
    description: 'Rounds 3.45 to 3.4 instead of 3.5 when rounding to 1 d.p., or rounds down when the deciding digit is 5.',
    remediationExplanation: 'Look at the digit ONE PLACE after where you are rounding to. If it is 5 or more, round up; if 4 or less, round down. When rounding 3.45 to 1 d.p., look at the 5 (hundredths) \u2014 round up to 3.5.',
    visualScaffold: 'rounding_number_line',
    recheckPattern: 'Round 7.85 to 1 decimal place.',
    parentNote: 'Underline the deciding digit (the one AFTER the rounding place) and ask: is it 5 or more? Practise with prices \u2014 "How much is $7.85 to the nearest 10 cents?"',
    relatedSkills: ['P4-DEC-03'],
  },
  {
    tag: 'decimal_point_wrong_after_multiply',
    label: 'Places decimal point incorrectly after multiplying or dividing',
    description: 'Multiplies 2.4 \u00d7 3 and gets 72 instead of 7.2, forgetting to place the decimal point in the answer.',
    remediationExplanation: 'Count the total number of decimal places in the numbers you multiplied. The answer must have the same number of decimal places. 2.4 has 1 d.p., so 2.4 \u00d7 3 = 7.2 (1 d.p.).',
    visualScaffold: 'multiply_decimal_steps',
    recheckPattern: 'Calculate 3.5 \u00d7 4 and explain where the decimal point goes.',
    parentNote: 'Teach the rule: multiply as if the numbers were whole numbers, then count decimal places and put the point back. Check with estimation \u2014 2.4 \u00d7 3 should be about 2 \u00d7 3 = 6, not 72.',
    relatedSkills: ['P4-DEC-05'],
  },
  {
    tag: 'fraction_denominator_conversion_error',
    label: 'Cannot convert fraction denominators to 10 or 100',
    description: 'Does not know how to find an equivalent fraction with denominator 10 or 100, e.g. cannot see that 3/5 = 6/10.',
    remediationExplanation: 'Find what you multiply the denominator by to get 10 or 100, then multiply the numerator by the same number. 3/5: 5 \u00d7 2 = 10, so 3 \u00d7 2 = 6, giving 6/10 = 0.6.',
    visualScaffold: 'equivalent_fraction_arrows',
    recheckPattern: 'Convert 3/4 to a decimal.',
    parentNote: 'Practise the key denominators: halves (\u00d750), quarters (\u00d725), fifths (\u00d72 or \u00d720). Use fraction walls or bar models to show equivalence.',
    relatedSkills: ['P4-DEC-06'],
  },
];

const misconceptionByTag = new Map(misconceptions.map((m) => [m.tag, m]));

export function getMisconception(tag) {
  return misconceptionByTag.get(tag) || null;
}

export function getMisconceptionsForSkill(skillId) {
  return misconceptions.filter((m) => m.relatedSkills.includes(skillId));
}

export function getAllMisconceptions() {
  return [...misconceptions];
}

export function getRemediationForTag(tag) {
  const m = misconceptionByTag.get(tag);
  if (!m) return null;
  return {
    tag: m.tag,
    explanation: m.remediationExplanation,
    visualScaffold: m.visualScaffold,
    recheckPattern: m.recheckPattern,
    parentNote: m.parentNote,
  };
}

export default { getMisconception, getMisconceptionsForSkill, getAllMisconceptions, getRemediationForTag };
