const misconceptions = [
  {
    tag: 'ignores_decimal_point',
    label: 'Ignores the decimal point when reading money amounts',
    description: 'Reads $4.85 as 485 dollars instead of 4 dollars and 85 cents, or writes 485 cents as $485 instead of $4.85.',
    remediationExplanation: 'The decimal point separates dollars from cents. The digits before the point are dollars, and the two digits after the point are cents. $4.85 means 4 dollars and 85 cents.',
    visualScaffold: 'decimal_point_splitter',
    recheckPattern: 'Convert a dollar amount with non-zero cents to cents.',
    parentNote: 'Point out the decimal point on price tags and receipts. Ask your child: "What is before the dot? What is after the dot?" to build the habit of reading both parts.',
    relatedSkills: ['P2-MON-01', 'P2-MON-03'],
  },
  {
    tag: 'cents_over_100',
    label: 'Writes cents values of 100 or more without converting to dollars',
    description: 'Writes 150 cents as $0.150 or $1.150 instead of $1.50, not realising that 100 cents = 1 dollar.',
    remediationExplanation: 'When you have 100 cents or more, trade them in for dollars. 100 cents = $1. So 150 cents = 1 dollar and 50 cents = $1.50.',
    visualScaffold: 'cents_to_dollar_trade',
    recheckPattern: 'Convert a cents amount greater than 100 to dollar notation.',
    parentNote: 'Use real coins to practise. Stack groups of 100 cents and trade each stack for a dollar note. "Can we make a dollar from these coins?"',
    relatedSkills: ['P2-MON-01', 'P2-MON-02'],
  },
  {
    tag: 'compares_cents_ignoring_dollars',
    label: 'Compares only the cents part, ignoring the dollars',
    description: 'Says $3.90 is more than $4.05 because 90 cents is more than 5 cents, without looking at the dollar amounts.',
    remediationExplanation: 'Always compare the dollars first. The amount with more dollars is greater. Only compare the cents when the dollars are the same. $4.05 is more than $3.90 because 4 dollars is more than 3 dollars.',
    visualScaffold: 'dollar_then_cent_comparison',
    recheckPattern: 'Compare two amounts where the smaller amount has more cents.',
    parentNote: 'Ask your child: "Which has more dollars?" first. Only move to cents if the dollars are equal. Comparing price tags at the shops is great practice.',
    relatedSkills: ['P2-MON-03'],
  },
  {
    tag: 'counts_notes_as_ones',
    label: 'Counts each note as $1 regardless of its face value',
    description: 'Counts three $5 notes as $3 instead of $15, treating every note as worth $1.',
    remediationExplanation: 'Each note has its own value printed on it. A $5 note is worth 5 dollars, not 1 dollar. Count by the value on the note: $5, $10, $15.',
    visualScaffold: 'note_value_labels',
    recheckPattern: 'Find the total of several notes that are not all $1 notes.',
    parentNote: 'Lay out play notes and practise skip-counting by their value. "This is a $5 note, so we count 5, 10, 15..." Help your child see each note carries its own value.',
    relatedSkills: ['P2-MON-02'],
  },
  {
    tag: 'confuses_coin_values',
    label: 'Mixes up the values of different coins',
    description: 'Treats a 20-cent coin as 10 cents, or a 50-cent coin as 5 cents, confusing coins of similar size.',
    remediationExplanation: 'Each coin has a number on it that tells its value. A 20¢ coin is worth 20 cents, not 10. Check the number on the coin carefully before counting.',
    visualScaffold: 'coin_value_spotlight',
    recheckPattern: 'Find the total value of coins that include 20¢ and 50¢ pieces.',
    parentNote: 'Sort real coins into groups by value. Have your child read the number on each coin aloud, then practise counting each group separately before combining.',
    relatedSkills: ['P2-MON-02'],
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
