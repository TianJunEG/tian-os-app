const misconceptions = [
  {
    tag: 'mental_add_carry_error',
    label: 'Drops the carry when adding tens and ones mentally',
    description: 'Adds tens and ones separately but forgets to carry, e.g. 47 + 38: does 40+30=70 and 7+8=15 but writes 715 instead of 85.',
    remediationExplanation: 'After adding ones, check if the total is 10 or more. If so, carry 1 ten to the tens total. 7+8=15, so carry 1 ten: 70+30+10=110, plus 5 ones = 85.',
    visualScaffold: 'split_strategy_diagram',
    recheckPattern: 'Add two 2-digit numbers where the ones sum exceeds 9.',
    parentNote: 'Practise the split strategy: break both numbers into tens and ones, add each, then combine. Watch for ones totals above 9.',
    relatedSkills: ['P3-AS-01'],
  },
  {
    tag: 'adds_ones_to_tens',
    label: 'Adds ones digit to the tens column',
    description: 'Mixes place values when adding mentally, e.g. for 47+38, adds 8 to 4 instead of to 7.',
    remediationExplanation: 'Keep tens with tens and ones with ones. In 47+38: tens are 40+30, ones are 7+8. Then combine the totals.',
    visualScaffold: 'place_value_split',
    recheckPattern: 'New 2-digit addition with mental strategy.',
    parentNote: 'Write the numbers in expanded form (47 = 40 + 7) before adding. This helps keep place values straight.',
    relatedSkills: ['P3-AS-01'],
  },
  {
    tag: 'mental_sub_regroup_error',
    label: 'Fails to regroup when mentally subtracting ones',
    description: 'When the ones digit being subtracted is larger, gives an incorrect result, e.g. 83-47: does 80-40=40, then 3-7 and writes 44 or -4.',
    remediationExplanation: 'If you cannot subtract the ones, adjust: take 1 ten from the tens subtraction. 83-47: 80-40=40, but 3-7 needs regrouping. Think 40-1=30, and 13-7=6, so 36.',
    visualScaffold: 'number_line_count_back',
    recheckPattern: 'Subtract two 2-digit numbers where regrouping is needed.',
    parentNote: 'Practise counting back on a number line. Or use the "add up" strategy: start at 47, how far to 83?',
    relatedSkills: ['P3-AS-02'],
  },
  {
    tag: 'subtracts_smaller_from_larger_digit',
    label: 'Always subtracts the smaller digit from the larger',
    description: 'In each column, subtracts the smaller digit from the larger regardless of position, e.g. 7204-3568: ones column gives 8-4=4 instead of borrowing.',
    remediationExplanation: 'Always subtract the bottom number from the top number. If the top digit is smaller, you must borrow (regroup) from the next column.',
    visualScaffold: 'column_subtraction_regroup',
    recheckPattern: 'Column subtraction requiring borrowing.',
    parentNote: 'Check each column: is the top digit big enough? If not, your child must borrow before subtracting. Use base-ten blocks to show the exchange.',
    relatedSkills: ['P3-AS-02', 'P3-AS-04'],
  },
  {
    tag: 'forgets_carry',
    label: 'Forgets to carry in column addition',
    description: 'Adds each column correctly but does not carry when the column total exceeds 9, e.g. 3486+2057: ones 6+7=13 writes 3 but does not carry the 1 ten.',
    remediationExplanation: 'When a column adds to 10 or more, write the ones digit and carry the tens digit to the next column. Always check: is my column total 10 or more?',
    visualScaffold: 'column_addition_carry_arrows',
    recheckPattern: 'Column addition with at least two carries.',
    parentNote: 'Write a small carried digit above the next column. Encourage your child to circle or highlight the carry so it is not forgotten.',
    relatedSkills: ['P3-AS-03'],
  },
  {
    tag: 'column_alignment_error',
    label: 'Misaligns digits in columns',
    description: 'Lines up digits incorrectly when the two numbers have different lengths, e.g. 3486+57 aligns 5 under the thousands instead of the tens.',
    remediationExplanation: 'Always line up the ones digits first, then fill in the other columns. Use a place-value grid (Th|H|T|O) to keep columns straight.',
    visualScaffold: 'place_value_grid_alignment',
    recheckPattern: 'Add a 4-digit and a 2-digit number using column method.',
    parentNote: 'Use squared paper or draw column lines. Always start by lining up the rightmost (ones) digits.',
    relatedSkills: ['P3-AS-03'],
  },
  {
    tag: 'forgets_borrow',
    label: 'Forgets to borrow in column subtraction',
    description: 'When the top digit is smaller, writes 0 or a negative result instead of borrowing, e.g. 7204-3568 ones column: writes 0 because "4-8 cannot be done".',
    remediationExplanation: 'When the top digit is smaller, borrow 1 from the next column. The top digit becomes 10 bigger. 4 becomes 14, and 14-8=6. Reduce the tens column by 1.',
    visualScaffold: 'column_subtraction_borrow_arrows',
    recheckPattern: 'Column subtraction with multiple borrows.',
    parentNote: 'Use base-ten blocks. Exchange 1 ten for 10 ones (or 1 hundred for 10 tens) so the child can see the regrouping physically.',
    relatedSkills: ['P3-AS-04'],
  },
  {
    tag: 'borrow_across_zero',
    label: 'Cannot borrow across a zero',
    description: 'Gets stuck or makes errors when borrowing across a column that contains 0, e.g. in 5003-1247, cannot borrow from the tens (0) or hundreds (0).',
    remediationExplanation: 'When the column you borrow from is 0, keep going left until you find a non-zero digit. Then borrow through: 5003 becomes 4-9-9-13 after regrouping.',
    visualScaffold: 'borrow_chain_diagram',
    recheckPattern: 'Subtraction with zeros in the middle, e.g. 4002-1365.',
    parentNote: 'This is a common P3 difficulty. Practise with numbers like 1000-567 using place-value blocks. Show the chain of exchanges from thousands all the way to ones.',
    relatedSkills: ['P3-AS-04'],
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
