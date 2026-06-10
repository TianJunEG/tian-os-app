const misconceptions = [
  {
    tag: 'mental_add_place_error',
    label: 'Adds to the wrong place-value column mentally',
    description: 'When adding ones, tens, or hundreds to a 3-digit number, the child adds to the wrong column. For example, 340 + 50: adds 5 to the ones instead of the tens, getting 345 instead of 390.',
    remediationExplanation: 'Identify which place the number you are adding belongs to. 50 is 5 tens, so add it to the tens column of 340. The tens digit 4 becomes 9, giving 390.',
    visualScaffold: 'place_value_chart',
    recheckPattern: 'Add a round number (ones, tens, or hundreds) to a 3-digit number.',
    parentNote: 'Use a place-value chart with columns for hundreds, tens, and ones. Have your child place counters to see which column changes when adding.',
    relatedSkills: ['P2-AS-01'],
  },
  {
    tag: 'mental_sub_place_error',
    label: 'Subtracts from the wrong place-value column mentally',
    description: 'When subtracting ones, tens, or hundreds from a 3-digit number, the child subtracts from the wrong column. For example, 476 - 30: subtracts 3 from the ones, getting 473 instead of 446.',
    remediationExplanation: 'Identify which place the number you are subtracting belongs to. 30 is 3 tens, so subtract from the tens column of 476. The tens digit 7 becomes 4, giving 446.',
    visualScaffold: 'place_value_chart',
    recheckPattern: 'Subtract a round number (ones, tens, or hundreds) from a 3-digit number.',
    parentNote: 'Use a place-value chart. Ask your child: is 30 ones, tens, or hundreds? Then point to the correct column before subtracting.',
    relatedSkills: ['P2-AS-02'],
  },
  {
    tag: 'forgets_to_regroup',
    label: 'Forgets to regroup in column addition',
    description: 'Adds each column correctly but does not regroup when the column total exceeds 9. For example, 248 + 367: ones 8+7=15, writes 15 in the ones place or writes 5 without carrying the 1.',
    remediationExplanation: 'When a column adds to 10 or more, write only the ones digit in that column and carry the tens digit to the next column on the left. 8+7=15: write 5, carry 1.',
    visualScaffold: 'column_addition_carry_arrows',
    recheckPattern: 'Column addition within 1000 requiring regrouping.',
    parentNote: 'Remind your child to check each column: is the total 10 or more? If yes, carry. Write the carried digit small above the next column so it is not forgotten.',
    relatedSkills: ['P2-AS-03'],
  },
  {
    tag: 'regroups_wrong_column',
    label: 'Carries the regrouped digit to the wrong column',
    description: 'The child regroups but places the carried digit in the wrong column. For example, carrying from ones to hundreds instead of to tens.',
    remediationExplanation: 'Always carry to the column immediately to the left. If the ones column sums to 10 or more, the carry goes to the tens column, not the hundreds.',
    visualScaffold: 'place_value_grid_alignment',
    recheckPattern: 'Column addition within 1000 with regrouping.',
    parentNote: 'Draw clear column lines labelled H, T, O. After your child writes the carry digit, check that it sits in the correct column.',
    relatedSkills: ['P2-AS-03'],
  },
  {
    tag: 'subtracts_smaller_from_larger',
    label: 'Always subtracts the smaller digit from the larger',
    description: 'In each column, subtracts the smaller digit from the larger regardless of which is on top. For example, 712 - 348: ones column gives 8-2=6 instead of borrowing to compute 12-8=4.',
    remediationExplanation: 'Always subtract the bottom number from the top number. If the top digit is smaller, you must borrow from the next column to the left before subtracting.',
    visualScaffold: 'column_subtraction_regroup',
    recheckPattern: 'Column subtraction within 1000 requiring borrowing.',
    parentNote: 'Ask your child to check each column: is the top digit big enough? If not, borrow first. Use base-ten blocks to show the exchange.',
    relatedSkills: ['P2-AS-04'],
  },
  {
    tag: 'borrows_incorrectly',
    label: 'Makes errors when borrowing in subtraction',
    description: 'The child attempts to borrow but does it incorrectly: forgets to reduce the lending column by 1, or adds 10 to the wrong column. For example, borrows from the hundreds but does not reduce the hundreds digit.',
    remediationExplanation: 'When you borrow, two things happen: (1) the top digit in your column gets 10 more, and (2) the digit in the column to the left goes down by 1. Always do both steps.',
    visualScaffold: 'column_subtraction_borrow_arrows',
    recheckPattern: 'Column subtraction within 1000 with borrowing.',
    parentNote: 'Practise borrowing with base-ten blocks. Exchange 1 ten for 10 ones so your child can physically see the lending column shrink and the borrowing column grow.',
    relatedSkills: ['P2-AS-04'],
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
