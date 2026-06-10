const misconceptions = [
  {
    tag: 'confuses_place_columns',
    label: 'Mixes up thousands, hundreds, tens, ones columns',
    description: 'Assigns a digit to the wrong place value, e.g. reads 3405 as "3 hundreds, 4 thousands, 0 tens, 5 ones".',
    remediationExplanation: 'Read from left to right: the leftmost digit in a 4-digit number is thousands, then hundreds, then tens, then ones. Use a place-value chart.',
    visualScaffold: 'place_value_chart_4digit',
    recheckPattern: 'Write the value of the underlined digit in a 4-digit number.',
    parentNote: 'Draw a place-value table (Th | H | T | O) and have your child place digits into the correct columns. Practise with house numbers or car number plates.',
    relatedSkills: ['P3-WN-01'],
  },
  {
    tag: 'zero_placeholder_error',
    label: 'Drops or ignores zero placeholders',
    description: 'Writes 405 instead of 4005 or reads 3050 as "three hundred and fifty" because the zero placeholder is skipped.',
    remediationExplanation: 'Zero means "none of that place value" but it still holds the place. 3050 = 3 thousands, 0 hundreds, 5 tens, 0 ones. Every column must be filled.',
    visualScaffold: 'place_value_blocks_with_zero',
    recheckPattern: 'Write the number: 4 thousands, 0 hundreds, 0 tens, 7 ones.',
    parentNote: 'Emphasise that zero is a placeholder. Ask: "What happens if we remove the zero from 3050? Does the number change?" Show with place-value discs.',
    relatedSkills: ['P3-WN-01'],
  },
  {
    tag: 'compares_digit_by_digit_wrong_order',
    label: 'Compares digits starting from the ones instead of thousands',
    description: 'Begins comparison at the rightmost digit, concluding that 2489 > 3100 because 9 > 0.',
    remediationExplanation: 'Always compare the leftmost (largest) place value first. If the thousands digit is bigger, the whole number is bigger — you don'\''t need to check the other digits.',
    visualScaffold: 'comparison_place_value_arrows',
    recheckPattern: 'Compare two 4-digit numbers and explain which place decided it.',
    parentNote: 'Line numbers up in a place-value table and compare column by column from the left. The first column that differs decides the answer.',
    relatedSkills: ['P3-WN-02'],
  },
  {
    tag: 'confuses_more_less_symbols',
    label: 'Mixes up > and < symbols',
    description: 'Uses the wrong comparison symbol, e.g. writes 3471 > 5210 instead of 3471 < 5210.',
    remediationExplanation: 'The symbol always opens toward the bigger number. Think of a hungry crocodile eating the larger number. 3471 < 5210 means 3471 is less than 5210.',
    visualScaffold: 'crocodile_comparison',
    recheckPattern: 'Compare two new 4-digit numbers using > or <.',
    parentNote: 'Draw a crocodile mouth that always opens toward the bigger number. Practise with prices, distances, or population figures.',
    relatedSkills: ['P3-WN-02'],
  },
  {
    tag: 'pattern_step_error',
    label: 'Uses the wrong step size in a pattern',
    description: 'Misidentifies the constant difference, e.g. sees 1500, 1750, 2000 and thinks the step is 200 instead of 250.',
    remediationExplanation: 'Subtract any two consecutive terms to find the step. Check your step works for every pair. 1750 - 1500 = 250, and 2000 - 1750 = 250 — the step is 250.',
    visualScaffold: 'number_line_jumps',
    recheckPattern: 'Find the step and continue the pattern.',
    parentNote: 'Ask your child to subtract consecutive terms and check the difference is the same each time. Practise with multiples of 25, 50, 100, 250.',
    relatedSkills: ['P3-WN-03'],
  },
  {
    tag: 'pattern_direction_error',
    label: 'Continues a decreasing pattern by adding instead of subtracting',
    description: 'Sees a sequence going down (8000, 7500, 7000) but adds the step instead of subtracting, giving 7500 instead of 6500.',
    remediationExplanation: 'Check whether the numbers are getting bigger or smaller. If they are getting smaller, subtract the step to find the next term.',
    visualScaffold: 'number_line_arrows',
    recheckPattern: 'Continue a decreasing number pattern.',
    parentNote: 'Ask: "Are the numbers going up or down?" before finding the next number. Practise with both increasing and decreasing patterns.',
    relatedSkills: ['P3-WN-03'],
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
