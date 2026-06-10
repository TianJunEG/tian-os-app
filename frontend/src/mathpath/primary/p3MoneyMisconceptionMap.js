const misconceptions = [
  {
    tag: 'decimal_alignment_error',
    label: 'Misaligns decimal point when adding/subtracting money',
    description: 'Adds $3.50 + $2.5 as $3.50 + $25.00 because the decimal points are not lined up.',
    remediationExplanation: 'Always line up the decimal points so that dollars are under dollars and cents are under cents. Write $2.50 not $2.5.',
    visualScaffold: 'money_column_alignment',
    recheckPattern: 'Add two money amounts where one has a single-digit cent value.',
    parentNote: 'Ask your child to always write money with two decimal places (e.g. $2.50 not $2.5). Use grid paper to keep columns aligned.',
    relatedSkills: ['P3-MON-01', 'P3-MON-02'],
  },
  {
    tag: 'drops_cents',
    label: 'Drops the cents and works only with dollars',
    description: 'Calculates $12.45 + $3.70 as $12 + $3 = $15, ignoring the cents entirely.',
    remediationExplanation: 'Money has two parts: dollars and cents. Always add the cents first, then the dollars. If the cents total 100 or more, carry 1 dollar.',
    visualScaffold: 'dollar_cent_columns',
    recheckPattern: 'Add two money amounts that both have non-zero cents.',
    parentNote: 'Have your child circle the cents in each amount before starting. Practise with real coins so cents feel concrete.',
    relatedSkills: ['P3-MON-01'],
  },
  {
    tag: 'dollar_sign_error',
    label: 'Forgets or misplaces the dollar sign',
    description: 'Writes the answer as 16.15 instead of $16.15, or places the sign after the number.',
    remediationExplanation: 'The dollar sign always goes at the front of a money amount: $16.15. If the question is about money, your answer should have a dollar sign.',
    visualScaffold: 'money_notation_examples',
    recheckPattern: 'Write the total of two money amounts with correct notation.',
    parentNote: 'Point out dollar signs on receipts and price tags. Remind your child: "Dollar sign first, then the number."',
    relatedSkills: ['P3-MON-01'],
  },
  {
    tag: 'subtracts_wrong_way',
    label: 'Subtracts cost from payment in wrong order',
    description: 'Calculates change as cost − payment instead of payment − cost, e.g. $6.40 − $10 = −$3.60.',
    remediationExplanation: 'Change = amount paid − cost. The bigger number (what you paid) always comes first. If you paid $10 and the item costs $6.40, change = $10 − $6.40 = $3.60.',
    visualScaffold: 'change_number_line',
    recheckPattern: 'Find the change when paying with a $10 note.',
    parentNote: 'Role-play shopping at home. Give your child play money to pay and ask them to count the change. "I paid more, so I get money back."',
    relatedSkills: ['P3-MON-02'],
  },
  {
    tag: 'forgets_cents_in_change',
    label: 'Forgets to handle cents when making change',
    description: 'Calculates $10 − $6.40 as $4.00 instead of $3.60 because they only subtracted the dollars.',
    remediationExplanation: 'When making change, subtract both dollars and cents. $10.00 − $6.40: borrow from the dollars to subtract 40 cents. 100 cents − 40 cents = 60 cents, then $9 − $6 = $3. Change = $3.60.',
    visualScaffold: 'change_with_regrouping',
    recheckPattern: 'Find the change from $10 for a cost with non-zero cents.',
    parentNote: 'Practise making change from $5 and $10 notes. Start with "How many cents do I need to make a full dollar?" then count the remaining dollars.',
    relatedSkills: ['P3-MON-02'],
  },
];

const misconceptionByTag = new Map(misconceptions.map((m) => [m.tag, m]));

export function getMisconception(tag) { return misconceptionByTag.get(tag) || null; }
export function getMisconceptionsForSkill(skillId) { return misconceptions.filter((m) => m.relatedSkills.includes(skillId)); }
export function getAllMisconceptions() { return [...misconceptions]; }

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
