const misconceptions = [
  {
    tag: 'coin_size_value_confusion',
    label: 'Thinks larger coin means larger value',
    description: 'Assumes the physically bigger coin is worth more money, e.g. thinking a 1¢ coin is worth more than a 10¢ coin because it is larger.',
    remediationExplanation: 'The size of a coin does not tell us its value. Look at the number printed on the coin to find out how much it is worth.',
    visualScaffold: 'coin_lineup_with_values',
    recheckPattern: 'Show two coins of different sizes and ask which is worth more.',
    parentNote: 'Use real Singapore coins. Let your child hold them and compare sizes versus the numbers printed on each coin.',
    relatedSkills: ['P1-MON-01', 'P1-MON-02'],
  },
  {
    tag: 'dollar_cent_confusion',
    label: 'Confuses dollars and cents',
    description: 'Mixes up dollar and cent denominations, e.g. saying a $2 note is worth 2¢ or a 50¢ coin is worth $50.',
    remediationExplanation: 'Coins show cents (¢). Notes show dollars ($). 100 cents make 1 dollar. A $2 note is worth much more than a 2¢ coin.',
    visualScaffold: 'dollar_cent_comparison_chart',
    recheckPattern: 'Ask whether a given denomination is in dollars or cents.',
    parentNote: 'Point out the $ and ¢ symbols on money. Practise sorting coins (cents) from notes (dollars) at home.',
    relatedSkills: ['P1-MON-01', 'P1-MON-02'],
  },
  {
    tag: 'counts_coins_not_value',
    label: 'Counts number of coins instead of their value',
    description: 'Counted the number of coins (e.g. 3 coins) instead of adding up their values (e.g. 10¢ + 20¢ + 50¢ = 80¢).',
    remediationExplanation: 'Each coin has a different value. Say the value of each coin as you count: 10¢, 30¢, 80¢. Do not just count 1, 2, 3.',
    visualScaffold: 'coin_value_labelling',
    recheckPattern: 'New set of mixed-value coins to count.',
    parentNote: 'Practise skip counting with coins at home. Line up coins and say the running total after each coin.',
    relatedSkills: ['P1-MON-03'],
  },
  {
    tag: 'more_coins_means_more_money',
    label: 'Chooses side with more coins as having more money',
    description: 'Picked the group with more coins without checking the total value of each group.',
    remediationExplanation: 'More coins does not always mean more money. Count the total value of each group, then compare the totals.',
    visualScaffold: 'comparison_model_coins',
    recheckPattern: 'Compare a group with many low-value coins to a group with fewer high-value coins.',
    parentNote: 'Show your child 5 one-cent coins versus 1 fifty-cent coin. Ask which pile is worth more.',
    relatedSkills: ['P1-MON-04'],
  },
  {
    tag: 'money_add_ignores_units',
    label: 'Adds numbers but ignores dollars/cents units',
    description: 'Added the numerical values without paying attention to whether they are dollars or cents, or left out the unit in the answer.',
    remediationExplanation: 'Always check the unit. Add cents to cents and dollars to dollars. Write the unit (¢ or $) in your answer.',
    visualScaffold: 'price_tag_with_units',
    recheckPattern: 'New addition with prices in the same or mixed units.',
    parentNote: 'When shopping, ask your child to add up prices. Emphasise reading the $ or ¢ sign on each price tag.',
    relatedSkills: ['P1-MON-05'],
  },
  {
    tag: 'change_adds_cost_and_paid',
    label: 'Adds cost and paid amount instead of subtracting',
    description: 'When finding change, added the cost to the amount paid instead of subtracting the cost from the amount paid.',
    remediationExplanation: 'Change means how much money you get back. Subtract: amount paid minus cost. $5 − $3 = $2 change.',
    visualScaffold: 'bar_model_change',
    recheckPattern: 'New change-finding problem with a different paid amount.',
    parentNote: 'Role-play shopping at home. Give your child play money and ask how much they should get back.',
    relatedSkills: ['P1-MON-06'],
  },
  {
    tag: 'enough_money_focuses_on_object',
    label: 'Focuses on the item instead of comparing values',
    description: 'Decided based on wanting the item rather than comparing the money available to the price.',
    remediationExplanation: 'Compare the amount of money you have with the price of the item. If your money is the same or more than the price, you have enough.',
    visualScaffold: 'comparison_model_money_vs_price',
    recheckPattern: 'New enough-money question with a different item and amount.',
    parentNote: 'At the shop, ask your child: do we have enough to buy this? Let them check the price and count the money.',
    relatedSkills: ['P1-MON-07'],
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
