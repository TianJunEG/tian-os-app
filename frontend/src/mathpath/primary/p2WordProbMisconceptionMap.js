const misconceptions = [
  {
    tag: 'adds_when_should_subtract',
    label: 'Adds instead of subtracting when finding a smaller quantity',
    description: 'Sees "fewer" or "less" in the problem but adds the two numbers, giving a larger answer instead of a smaller one.',
    remediationExplanation: '"Fewer" and "less than" mean the answer is smaller. Subtract the difference from the given quantity. Draw a bar model: the shorter bar is the answer.',
    visualScaffold: 'comparison_bar_model',
    recheckPattern: 'Mei has 15 stickers. Ali has 6 fewer stickers than Mei. How many stickers does Ali have?',
    parentNote: 'Ask your child: "Will the answer be bigger or smaller?" If someone has fewer, the answer must be smaller, so we subtract.',
    relatedSkills: ['P2-WP-01'],
  },
  {
    tag: 'subtracts_when_should_add',
    label: 'Subtracts instead of adding when finding a larger quantity',
    description: 'Sees "more" in the problem but subtracts, giving a smaller answer instead of a larger one.',
    remediationExplanation: '"More than" means the answer is bigger. Add the difference to the given quantity. Draw a bar model: the longer bar is the answer.',
    visualScaffold: 'comparison_bar_model',
    recheckPattern: 'Ben has 12 marbles. Raj has 7 more marbles than Ben. How many marbles does Raj have?',
    parentNote: 'Ask: "Does this person have MORE or FEWER? If more, the answer should be bigger than what we started with."',
    relatedSkills: ['P2-WP-01'],
  },
  {
    tag: 'confuses_total_with_difference',
    label: 'Gives the total instead of the difference, or vice versa',
    description: 'When asked "how many more", adds both quantities instead of subtracting. Or when asked for a total, subtracts.',
    remediationExplanation: '"How many more" or "how many fewer" means find the DIFFERENCE (subtract). "How many altogether" means find the TOTAL (add). Read the question carefully.',
    visualScaffold: 'difference_vs_total_chart',
    recheckPattern: 'Tom has 9 pencils and Lily has 14 pencils. How many more pencils does Lily have?',
    parentNote: 'Ask: "Does the question want us to combine or compare?" Combine = add. Compare = subtract.',
    relatedSkills: ['P2-WP-01'],
  },
  {
    tag: 'multiplies_wrong_numbers',
    label: 'Multiplies the wrong pair of numbers in the problem',
    description: 'When the problem says "4 bags with 5 marbles each", multiplies different numbers or adds instead of multiplying.',
    remediationExplanation: 'Find the number of groups and the number in each group. Multiply: groups x items per group = total. For 4 bags with 5 marbles each: 4 x 5 = 20.',
    visualScaffold: 'equal_groups_diagram',
    recheckPattern: 'There are 3 boxes. Each box has 6 erasers. How many erasers are there altogether?',
    parentNote: 'Ask: "How many groups? How many in each group?" Then multiply. Draw the groups if needed.',
    relatedSkills: ['P2-WP-02'],
  },
  {
    tag: 'confuses_groups_with_per_group',
    label: 'Swaps the number of groups with the number per group',
    description: 'When asked "how many bags" (number of groups), gives the number of items per bag instead.',
    remediationExplanation: 'Read carefully: "How many bags?" asks for the number of groups. "How many in each bag?" asks for the size of each group. They are different questions.',
    visualScaffold: 'groups_vs_per_group_labels',
    recheckPattern: 'Sarah has 20 apples. She puts 5 apples in each bag. How many bags does she need?',
    parentNote: 'Have your child underline what the question asks for. "How many bags?" is about groups. "How many in each?" is about the amount per group.',
    relatedSkills: ['P2-WP-02'],
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
