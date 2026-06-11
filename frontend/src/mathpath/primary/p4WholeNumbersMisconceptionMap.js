const misconceptions = [
  {
    tag: 'confuses_place_columns_5digit',
    label: 'Mixes up ten thousands, thousands, hundreds, tens, ones columns',
    description: 'Assigns a digit to the wrong place value in a 5-digit number, e.g. reads 50 302 as "5 thousands" instead of "5 ten thousands".',
    remediationExplanation: 'Read from left to right: the leftmost digit in a 5-digit number is ten thousands, then thousands, then hundreds, then tens, then ones. Use a place-value chart with five columns.',
    visualScaffold: 'place_value_chart_5digit',
    recheckPattern: 'Write the value of the underlined digit in a 5-digit number.',
    parentNote: 'Draw a place-value table (TTh | Th | H | T | O) and have your child place digits into the correct columns. Practise with postal codes or population figures.',
    relatedSkills: ['P4-WN-01'],
  },
  {
    tag: 'zero_placeholder_error_5digit',
    label: 'Drops or ignores zero placeholders in 5-digit numbers',
    description: 'Writes 5302 instead of 50 302 or reads 40 070 as "four thousand and seventy" because zero placeholders are skipped.',
    remediationExplanation: 'Zero means "none of that place value" but it still holds the place. 50 302 = 5 ten thousands, 0 thousands, 3 hundreds, 0 tens, 2 ones. Every column must be filled.',
    visualScaffold: 'place_value_blocks_with_zero',
    recheckPattern: 'Write the number: 5 ten thousands, 0 thousands, 3 hundreds, 0 tens, 2 ones.',
    parentNote: 'Emphasise that zero is a placeholder. Ask: "What happens if we remove the zero from 50 302? Does the number change?" Show with place-value discs.',
    relatedSkills: ['P4-WN-01'],
  },
  {
    tag: 'compares_digit_by_digit_wrong_order_5digit',
    label: 'Compares digits starting from the ones instead of ten thousands',
    description: 'Begins comparison at the rightmost digit, concluding that 24 899 > 31 002 because 9 > 2.',
    remediationExplanation: "Always compare the leftmost (largest) place value first. If the ten-thousands digit is bigger, the whole number is bigger \u2014 you don't need to check the other digits.",
    visualScaffold: 'comparison_place_value_arrows',
    recheckPattern: 'Compare two 5-digit numbers and explain which place decided it.',
    parentNote: 'Line numbers up in a place-value table and compare column by column from the left. The first column that differs decides the answer.',
    relatedSkills: ['P4-WN-02'],
  },
  {
    tag: 'confuses_more_less_symbols',
    label: 'Mixes up > and < symbols',
    description: 'Uses the wrong comparison symbol, e.g. writes 34 710 > 52 100 instead of 34 710 < 52 100.',
    remediationExplanation: 'The symbol always opens toward the bigger number. Think of a hungry crocodile eating the larger number. 34 710 < 52 100 means 34 710 is less than 52 100.',
    visualScaffold: 'crocodile_comparison',
    recheckPattern: 'Compare two new 5-digit numbers using > or <.',
    parentNote: 'Draw a crocodile mouth that always opens toward the bigger number. Practise with prices, distances, or population figures.',
    relatedSkills: ['P4-WN-02'],
  },
  {
    tag: 'pattern_step_error_large',
    label: 'Uses the wrong step size in a large-number pattern',
    description: 'Misidentifies the constant difference, e.g. sees 15 000, 17 500, 20 000 and thinks the step is 3000 instead of 2500.',
    remediationExplanation: 'Subtract any two consecutive terms to find the step. Check your step works for every pair. 17 500 \u2212 15 000 = 2500, and 20 000 \u2212 17 500 = 2500 \u2014 the step is 2500.',
    visualScaffold: 'number_line_jumps',
    recheckPattern: 'Find the step and continue the pattern.',
    parentNote: 'Ask your child to subtract consecutive terms and check the difference is the same each time. Use a calculator for large subtractions if needed.',
    relatedSkills: ['P4-WN-03'],
  },
  {
    tag: 'pattern_direction_error',
    label: 'Continues a decreasing pattern by adding instead of subtracting',
    description: 'Sees a sequence going down (80 000, 77 500, 75 000) but adds the step instead of subtracting, giving 77 500 instead of 72 500.',
    remediationExplanation: 'Check whether the numbers are getting bigger or smaller. If they are getting smaller, subtract the step to find the next term.',
    visualScaffold: 'number_line_arrows',
    recheckPattern: 'Continue a decreasing number pattern.',
    parentNote: 'Ask: "Are the numbers going up or down?" before finding the next number. Practise with both increasing and decreasing patterns.',
    relatedSkills: ['P4-WN-03'],
  },
  {
    tag: 'rounding_direction_error',
    label: 'Rounds the wrong way (up instead of down, or vice versa)',
    description: 'Rounds 3847 to the nearest 100 as 3900 instead of 3800. The decision digit is 4 (less than 5), so it should round down.',
    remediationExplanation: 'Look at the digit just below the rounding place. If it is 5 or more, round up (increase the rounding digit by 1). If it is less than 5, round down (keep the rounding digit the same).',
    visualScaffold: 'number_line_rounding',
    recheckPattern: 'Round a number to the nearest 10, 100, or 1000.',
    parentNote: 'Use a number line to show where the number sits between two multiples. Ask: "Is it closer to the lower or higher multiple?"',
    relatedSkills: ['P4-WN-04'],
  },
  {
    tag: 'rounding_wrong_place',
    label: 'Looks at the wrong digit when rounding',
    description: 'When asked to round to the nearest 100, looks at the ones digit instead of the tens digit to decide whether to round up or down.',
    remediationExplanation: 'The decision digit is always the one directly to the RIGHT of the rounding place. Rounding to 100? Look at the tens digit. Rounding to 1000? Look at the hundreds digit.',
    visualScaffold: 'place_value_rounding_highlight',
    recheckPattern: 'Circle the decision digit for rounding to 10, 100, and 1000.',
    parentNote: 'Underline the rounding place, then circle the digit to its right \u2014 that is the decision digit. If it is 5 or more, round up.',
    relatedSkills: ['P4-WN-04'],
  },
  {
    tag: 'rounding_five_goes_down',
    label: 'Thinks 5 rounds down instead of up',
    description: 'Rounds 3850 to the nearest 100 as 3800 instead of 3900. The decision digit is 5, which rounds up.',
    remediationExplanation: 'When the decision digit is exactly 5, we round UP. This is the standard rule: "5 or more, round up; less than 5, round down." 3850 \u2192 3900.',
    visualScaffold: 'number_line_rounding',
    recheckPattern: 'Round numbers where the decision digit is exactly 5.',
    parentNote: 'Reinforce: "5 or more, go up!" Have your child practise with numbers ending in 5, 50, or 500.',
    relatedSkills: ['P4-WN-04'],
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
