const misconceptions = [
  {
    tag: 'carries_wrong_column',
    label: 'Carries to the wrong column',
    description: 'Places the carry digit in the wrong column during long multiplication, e.g. carries the tens digit to the hundreds column instead of the tens column.',
    remediationExplanation: 'When multiplying, work from right to left one column at a time. If 7 x 8 = 56, write the 6 in the current column and carry the 5 to the NEXT column to the left. Check that each carry goes exactly one column left.',
    visualScaffold: 'column_multiplication_carry_highlight',
    recheckPattern: 'Long multiplication with multiple carries. Show working and circle each carry.',
    parentNote: 'Use grid paper so each digit sits in its own box. Write carried digits small at the top of the correct column. This helps your child keep columns aligned.',
    relatedSkills: ['P4-FO-01', 'P4-FO-02'],
  },
  {
    tag: 'forgets_carry',
    label: 'Forgets to add the carry',
    description: 'Multiplies digits correctly but forgets to add the carry from the previous column, e.g. 2456 x 3: computes 6x3=18 (carry 1), then 5x3=15 but writes 15 instead of 16.',
    remediationExplanation: 'After each column multiply, CHECK: is there a carry from the last column? If yes, add it to your product before writing the answer. Multiply, then add carry, then write.',
    visualScaffold: 'long_multiplication_carry_arrows',
    recheckPattern: 'Long multiplication problem. After each step, say "Is there a carry?" before moving on.',
    parentNote: 'Encourage your child to write the carry digit clearly and cross it out after adding it. This makes it harder to forget.',
    relatedSkills: ['P4-FO-01', 'P4-FO-02'],
  },
  {
    tag: 'wrong_partial_product',
    label: 'Computes partial products incorrectly',
    description: 'In multi-digit multiplication, fails to shift the second partial product left (i.e. forgets the placeholder zero), e.g. 245 x 13: computes 245x3=735 and 245x1=245 instead of 2450.',
    remediationExplanation: 'When multiplying by the tens digit, your partial product must be shifted one place left (or add a 0 at the end). 245 x 13: first partial product is 245 x 3 = 735. Second partial product is 245 x 10 = 2450. Then add: 735 + 2450 = 3185.',
    visualScaffold: 'partial_products_alignment',
    recheckPattern: 'Multiply a 3-digit number by a 2-digit number. Show both partial products with correct alignment.',
    parentNote: 'When your child writes the second partial product, have them write a 0 first in the ones place before multiplying. This ensures the shift is not forgotten.',
    relatedSkills: ['P4-FO-02'],
  },
  {
    tag: 'wrong_remainder',
    label: 'Computes the remainder incorrectly',
    description: 'Finds the quotient correctly but calculates the remainder wrong, often by subtracting from the wrong number or making an arithmetic error in the final subtraction.',
    remediationExplanation: 'The remainder = dividend - (quotient x divisor). Always check: quotient x divisor + remainder should equal the original dividend. If it does not, recheck your subtraction.',
    visualScaffold: 'long_division_remainder_check',
    recheckPattern: 'Division with remainder. Verify: quotient x divisor + remainder = dividend.',
    parentNote: 'After finding the answer, have your child do the reverse check: multiply the quotient by the divisor and add the remainder. If it does not match the original number, something went wrong.',
    relatedSkills: ['P4-FO-03'],
  },
  {
    tag: 'confuses_quotient_and_remainder',
    label: 'Confuses the quotient and remainder',
    description: 'When asked for the remainder, gives the quotient instead, or vice versa. E.g. 1537 / 4 = 384 R 1, but writes the remainder as 384.',
    remediationExplanation: 'The quotient is how many whole groups you can make. The remainder is what is LEFT OVER after making those groups. 1537 / 4: you can make 384 groups of 4 (quotient = 384), and 1 is left over (remainder = 1).',
    visualScaffold: 'division_model_groups',
    recheckPattern: 'Division problem. State both the quotient and the remainder clearly.',
    parentNote: 'Ask your child: "How many groups?" (that is the quotient) and "How many left over?" (that is the remainder). Practise labelling both parts every time.',
    relatedSkills: ['P4-FO-03'],
  },
];

const misconceptionByTag = new Map(misconceptions.map((m) => [m.tag, m]));

export function getMisconception(tag) { return misconceptionByTag.get(tag) || null; }
export function getMisconceptionsForSkill(skillId) {
  return misconceptions.filter((m) => m.relatedSkills.includes(skillId));
}
export function getAllMisconceptions() { return [...misconceptions]; }
export function getRemediationForTag(tag) {
  const m = misconceptionByTag.get(tag);
  if (!m) return null;
  return { tag: m.tag, explanation: m.remediationExplanation, visualScaffold: m.visualScaffold, recheckPattern: m.recheckPattern, parentNote: m.parentNote };
}

export default { getMisconception, getMisconceptionsForSkill, getAllMisconceptions, getRemediationForTag };
