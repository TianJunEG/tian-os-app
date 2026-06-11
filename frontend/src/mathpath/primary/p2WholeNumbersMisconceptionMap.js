const misconceptions = [
  {
    tag: 'confuses_hto_columns',
    label: 'Mixes up hundreds, tens, ones columns',
    description: 'Assigns a digit to the wrong place value, e.g. reads 372 as "3 tens, 7 hundreds, 2 ones".',
    remediationExplanation: 'Read from left to right: in a 3-digit number the first digit is hundreds, the middle is tens, and the last is ones. Use a place-value chart.',
    visualScaffold: 'place_value_chart_3digit',
    recheckPattern: 'Write the value of a digit in a 3-digit number.',
    parentNote: 'Draw a place-value table (H | T | O) and have your child place digits into the correct columns. Practise with house numbers or prices.',
    relatedSkills: ['P2-WN-01'],
  },
  {
    tag: 'zero_placeholder_error',
    label: 'Drops or ignores zero placeholders',
    description: 'Writes 35 instead of 305 or reads 408 as "forty-eight" because the zero placeholder is skipped.',
    remediationExplanation: 'Zero means "none of that place value" but it still holds the place. 305 = 3 hundreds, 0 tens, 5 ones. Every column must be filled.',
    visualScaffold: 'place_value_blocks_with_zero',
    recheckPattern: 'Write the number: 5 hundreds, 0 tens, 3 ones.',
    parentNote: 'Emphasise that zero is a placeholder. Ask: "What happens if we remove the zero from 305? Does the number change?" Show with place-value discs.',
    relatedSkills: ['P2-WN-01'],
  },
  {
    tag: 'compares_digit_wrong_order',
    label: 'Compares digits starting from the ones instead of hundreds',
    description: 'Begins comparison at the rightmost digit, concluding that 289 > 310 because 9 > 0.',
    remediationExplanation: 'Always compare the leftmost (largest) place value first. If the hundreds digit is bigger, the whole number is bigger.',
    visualScaffold: 'comparison_place_value_arrows',
    recheckPattern: 'Compare two 3-digit numbers and explain which place decided it.',
    parentNote: 'Line numbers up in a place-value table and compare column by column from the left. The first column that differs decides the answer.',
    relatedSkills: ['P2-WN-02'],
  },
  {
    tag: 'confuses_more_less_symbols',
    label: 'Mixes up > and < symbols',
    description: 'Uses the wrong comparison symbol, e.g. writes 347 > 521 instead of 347 < 521.',
    remediationExplanation: 'The symbol always opens toward the bigger number. Think of a hungry crocodile eating the larger number. 347 < 521 means 347 is less than 521.',
    visualScaffold: 'crocodile_comparison',
    recheckPattern: 'Compare two new 3-digit numbers using > or <.',
    parentNote: 'Draw a crocodile mouth that always opens toward the bigger number. Practise with prices, ages, or building heights.',
    relatedSkills: ['P2-WN-02'],
  },
  {
    tag: 'confuses_odd_even',
    label: 'Confuses odd and even definitions',
    description: 'Thinks numbers ending in 1, 3, 5, 7, 9 are even, or that even means "not divisible by 2".',
    remediationExplanation: 'Even numbers end in 0, 2, 4, 6, or 8. They can be shared equally into two groups. Odd numbers end in 1, 3, 5, 7, or 9.',
    visualScaffold: 'paired_dots_odd_even',
    recheckPattern: 'Is this number odd or even?',
    parentNote: 'Pair up counters or blocks for a number. If every counter has a partner, the number is even. If one is left over, the number is odd.',
    relatedSkills: ['P2-WN-03'],
  },
  {
    tag: 'parity_of_zero',
    label: 'Unsure whether zero is odd or even',
    description: 'Believes 0 is odd, or neither odd nor even, when it is in fact even.',
    remediationExplanation: 'Zero is even because it can be split into two equal groups of nothing. Zero ends in 0, and 0 is on the even list (0, 2, 4, 6, 8).',
    visualScaffold: 'zero_pair_visual',
    recheckPattern: 'Is 0 odd or even? Explain why.',
    parentNote: 'Ask: "Can you share 0 sweets equally between two people?" Yes, each gets 0. That makes 0 even.',
    relatedSkills: ['P2-WN-03'],
  },
  {
    tag: 'pattern_step_error',
    label: 'Uses the wrong step size in a pattern',
    description: 'Misidentifies the constant difference, e.g. sees 150, 170, 190 and thinks the step is 10 instead of 20.',
    remediationExplanation: 'Subtract any two consecutive terms to find the step. Check your step works for every pair. 170 - 150 = 20, and 190 - 170 = 20 -- the step is 20.',
    visualScaffold: 'number_line_jumps',
    recheckPattern: 'Find the step and continue the pattern.',
    parentNote: 'Ask your child to subtract consecutive terms and check the difference is the same each time. Practise with multiples of 10, 20, 25, 50.',
    relatedSkills: ['P2-WN-04'],
  },
  {
    tag: 'pattern_direction_error',
    label: 'Continues a decreasing pattern by adding instead of subtracting',
    description: 'Sees a sequence going down (400, 350, 300) but adds the step instead of subtracting, giving 350 instead of 250.',
    remediationExplanation: 'Check whether the numbers are getting bigger or smaller. If they are getting smaller, subtract the step to find the next term.',
    visualScaffold: 'number_line_arrows',
    recheckPattern: 'Continue a decreasing number pattern.',
    parentNote: 'Ask: "Are the numbers going up or down?" before finding the next number. Practise with both increasing and decreasing patterns.',
    relatedSkills: ['P2-WN-04'],
  },
  {
    tag: 'number_words_and_omission',
    label: 'Omits "and" or places it incorrectly in number words',
    description: 'Writes "three hundred fifty" instead of "three hundred and fifty", or inserts "and" in the wrong position.',
    remediationExplanation: 'For numbers above 100, use "and" between the hundreds and the remaining part: 350 is "three hundred and fifty". If the tens digit is zero, still use "and": 305 is "three hundred and five".',
    visualScaffold: 'number_words_breakdown',
    recheckPattern: 'Write a 3-digit number in words.',
    parentNote: 'Read prices or distances aloud together. Emphasise the "and" that links the hundreds to the rest of the number.',
    relatedSkills: ['P2-WN-05'],
  },
  {
    tag: 'number_words_teen_ty_confusion',
    label: 'Confuses teen and ty number words',
    description: 'Writes "one hundred and thirteen" as 130, confusing "thirteen" (13) with "thirty" (30).',
    remediationExplanation: 'Words ending in "-teen" are 13-19. Words ending in "-ty" are 20, 30, 40, etc. "Thirteen" = 13 (one-three), "Thirty" = 30 (three-zero).',
    visualScaffold: 'teen_vs_ty_chart',
    recheckPattern: 'Write "one hundred and fourteen" as a number.',
    parentNote: 'Make a chart with two columns: -teen (13-19) and -ty (20-90). Quiz each other by saying a word and pointing to the correct column.',
    relatedSkills: ['P2-WN-05'],
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
