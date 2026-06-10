const misconceptions = [
  {
    tag: 'table_fact_confusion',
    label: 'Confuses nearby table facts',
    description: 'Recalls a neighbouring fact instead of the correct one, e.g. 7x8=54 (confusing with 6x9) instead of 56.',
    remediationExplanation: 'Check your answer by counting groups. 7x8 means 7 groups of 8. Use a known fact and adjust: 7x8 = 7x7 + 7 = 49 + 7 = 56.',
    visualScaffold: 'times_table_grid_highlight',
    recheckPattern: 'Recall a table fact and verify by skip-counting.',
    parentNote: 'Focus on the hardest facts (6x7, 6x8, 7x8, 7x9, 8x9). Practise with flashcards and the "derive from known" strategy.',
    relatedSkills: ['P3-MD-01', 'P3-MD-02'],
  },
  {
    tag: 'counts_instead_of_recall',
    label: 'Skip-counts instead of instant recall',
    description: 'Knows the tables but counts through the sequence (6, 12, 18, 24...) instead of recalling instantly, causing slow responses.',
    remediationExplanation: 'You know the answer — practise saying it instantly without counting through. Speed drills and flashcards help build automatic recall.',
    visualScaffold: 'flashcard_drill',
    recheckPattern: 'Timed recall of 10 random table facts.',
    parentNote: 'The goal is instant recall (under 3 seconds). Daily 2-minute speed drills help. Focus on the facts your child is slowest on.',
    relatedSkills: ['P3-MD-01'],
  },
  {
    tag: 'division_as_subtraction',
    label: 'Treats division as repeated subtraction and loses count',
    description: 'Uses repeated subtraction to divide but miscounts the number of subtractions, e.g. 56/8: subtracts 8 six times and writes 6 instead of 7.',
    remediationExplanation: 'Division is the inverse of multiplication. Instead of subtracting repeatedly, think: "what times 8 equals 56?" 7x8=56, so 56/8=7.',
    visualScaffold: 'multiplication_division_inverse',
    recheckPattern: 'Division fact: use the related multiplication fact to check.',
    parentNote: 'Teach your child to think of division as "missing factor": ? x 8 = 56. This is faster and less error-prone than repeated subtraction.',
    relatedSkills: ['P3-MD-02'],
  },
  {
    tag: 'remainder_equals_quotient',
    label: 'Confuses the quotient and remainder',
    description: 'When asked for the remainder, gives the quotient, or vice versa. E.g. 29/4: writes remainder 7 instead of 1.',
    remediationExplanation: 'The quotient is how many whole groups fit. The remainder is what is left over. 29/4 = 7 remainder 1 because 7x4=28 and 29-28=1.',
    visualScaffold: 'division_model_groups',
    recheckPattern: 'New division with remainder. Ask for both the quotient and the remainder.',
    parentNote: 'Use physical objects: share 29 counters among 4 groups. Count the groups (quotient=7) and the leftovers (remainder=1).',
    relatedSkills: ['P3-MD-03'],
  },
  {
    tag: 'remainder_larger_than_divisor',
    label: 'Gives a remainder larger than the divisor',
    description: 'Writes a remainder that is equal to or larger than the divisor, e.g. 29/4 = 5 remainder 9.',
    remediationExplanation: 'The remainder must always be smaller than the divisor. If it is not, you can fit one more group. Check: is my remainder < divisor?',
    visualScaffold: 'remainder_check_diagram',
    recheckPattern: 'Division with remainder. Check: is the remainder less than the divisor?',
    parentNote: 'After your child finds the answer, ask: "Is the remainder less than the number you divided by?" If not, they need one more group.',
    relatedSkills: ['P3-MD-03'],
  },
  {
    tag: 'forgets_carry_in_multiplication',
    label: 'Forgets to carry in long multiplication',
    description: 'Multiplies each digit correctly but does not carry when the product exceeds 9, e.g. 243x6: 3x6=18, writes 8 but forgets to carry the 1.',
    remediationExplanation: 'When a product is 10 or more, write the ones digit and carry the tens digit to the next column. Always check: is my product 10 or more?',
    visualScaffold: 'long_multiplication_carry_arrows',
    recheckPattern: 'Long multiplication with carries. Show working.',
    parentNote: 'Write a small carried digit above the next column. Encourage your child to circle the carry so it is not missed.',
    relatedSkills: ['P3-MD-04'],
  },
  {
    tag: 'multiplies_digit_by_digit',
    label: 'Multiplies digit by digit instead of by the whole multiplier',
    description: 'Treats 243x6 as (2x6)(4x6)(3x6) = 122418 instead of using place value (200x6 + 40x6 + 3x6).',
    remediationExplanation: 'Multiply from right to left. Start with ones: 3x6=18. Carry the 1. Then tens: 4x6=24, plus 1 carry = 25. Then hundreds: 2x6=12, plus 2 carry = 14. Answer: 1458.',
    visualScaffold: 'column_multiplication_steps',
    recheckPattern: 'Long multiplication. Check place-value alignment.',
    parentNote: 'Use the column method with clear columns. Work through one column at a time and show where the carry goes.',
    relatedSkills: ['P3-MD-04'],
  },
  {
    tag: 'long_div_place_value_skip',
    label: 'Skips a place value in long division',
    description: 'Forgets to write a 0 in the quotient when a digit does not divide, e.g. 486/6: gets 8_1 instead of 81, or 612/6 gives 12 instead of 102.',
    remediationExplanation: 'In long division, every digit position needs a quotient digit. If the divisor does not go into the current number, write 0 and bring down the next digit.',
    visualScaffold: 'long_division_zero_quotient',
    recheckPattern: 'Long division where the quotient contains a zero.',
    parentNote: 'Practise with numbers like 612/6 or 804/4. Emphasise that every column needs a digit, even if it is 0.',
    relatedSkills: ['P3-MD-05'],
  },
  {
    tag: 'forgets_bring_down',
    label: 'Forgets to bring down the next digit',
    description: 'After subtracting in long division, forgets to bring down the next digit and either stops early or divides the wrong number.',
    remediationExplanation: 'Long division steps: Divide, Multiply, Subtract, Bring down. After each subtraction, bring down the next digit before dividing again.',
    visualScaffold: 'long_division_steps_annotated',
    recheckPattern: 'Long division showing all steps including bring-down.',
    parentNote: 'Teach the mnemonic "Does McDonald'\''s Sell Burgers?" — Divide, Multiply, Subtract, Bring down. Repeat until done.',
    relatedSkills: ['P3-MD-05'],
  },
];

const misconceptionByTag = new Map(misconceptions.map((m) => [m.tag, m]));

export function getMisconception(tag) { return misconceptionByTag.get(tag) || null; }
export function getMisconceptionsForSkill(skillId) { return misconceptions.filter((m) => m.relatedSkills.includes(skillId)); }
export function getAllMisconceptions() { return [...misconceptions]; }
export function getRemediationForTag(tag) {
  const m = misconceptionByTag.get(tag);
  if (!m) return null;
  return { tag: m.tag, explanation: m.remediationExplanation, visualScaffold: m.visualScaffold, recheckPattern: m.recheckPattern, parentNote: m.parentNote };
}

export default { getMisconception, getMisconceptionsForSkill, getAllMisconceptions, getRemediationForTag };
