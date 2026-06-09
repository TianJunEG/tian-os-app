const misconceptions = [
  {
    tag: 'equal_groups_uneven',
    label: 'Makes groups with different counts',
    description: 'Created groups with unequal quantities instead of distributing evenly.',
    remediationExplanation: 'Give one to each group, then another to each group. Keep going until all are used up. Every group must have the same number.',
    visualScaffold: 'equal_groups_dealing',
    recheckPattern: 'New equal-grouping task with a different total.',
    parentNote: 'Practise "dealing out" like cards — one at a time to each group in turn.',
    relatedSkills: ['P1-EQG-01', 'P1-EQG-04'],
  },
  {
    tag: 'equal_groups_by_appearance',
    label: 'Judges equality by visual size, not count',
    description: 'Chose groups that looked the same size rather than counting the items in each group.',
    remediationExplanation: 'Count the items in each group. Equal groups have the same number, even if they look different.',
    visualScaffold: 'counting_groups',
    recheckPattern: 'New identification task with groups of different visual arrangements.',
    parentNote: 'Use groups with different layouts (e.g. spread-out vs compact) but same count to build awareness.',
    relatedSkills: ['P1-EQG-02'],
  },
  {
    tag: 'repeated_add_counts_groups',
    label: 'Counts the number of groups instead of total items',
    description: 'Gave the number of groups as the answer instead of the total number of items across all groups.',
    remediationExplanation: 'Count ALL the items across every group. If there are 3 groups of 4, you need to add 4 + 4 + 4, not just say 3.',
    visualScaffold: 'repeated_addition_arrows',
    recheckPattern: 'New repeated-addition problem with different group count.',
    parentNote: 'Point to each group and say "4 plus 4 plus 4" while the child counts along.',
    relatedSkills: ['P1-EQG-03'],
  },
  {
    tag: 'repeated_add_one_group',
    label: 'Gives the count of one group as the total',
    description: 'Gave the number of items in a single group rather than adding all groups together.',
    remediationExplanation: 'There are more items than just one group! Add the same number for each group: 5 + 5 + 5 = 15, not just 5.',
    visualScaffold: 'repeated_addition_arrows',
    recheckPattern: 'New repeated-addition problem with more than 2 groups.',
    parentNote: 'Ask "How many groups?" first, then "How many in each?" and finally "What is the total?"',
    relatedSkills: ['P1-EQG-03'],
  },
  {
    tag: 'sharing_gives_all_to_one',
    label: 'Gives all items to one person',
    description: 'Put all or most of the items with one person instead of distributing equally.',
    remediationExplanation: 'Everyone must get the same amount. Deal one to each person, then go around again until all items are given out.',
    visualScaffold: 'equal_groups_dealing',
    recheckPattern: 'New sharing task with a different number of people.',
    parentNote: 'Use real objects (e.g. sweets) and ask the child to share among family members — fairness is a strong motivator!',
    relatedSkills: ['P1-EQG-04'],
  },
  {
    tag: 'sharing_unequal',
    label: 'Distributes items unevenly',
    description: 'Gave different amounts to different people instead of equal shares.',
    remediationExplanation: 'Check: does everyone have the same number? If not, move items until they do.',
    visualScaffold: 'equal_groups_dealing',
    recheckPattern: 'New sharing task with a different total.',
    parentNote: 'Practise dealing one at a time. This builds the habit of equal distribution.',
    relatedSkills: ['P1-EQG-04', 'P1-EQG-05'],
  },
  {
    tag: 'sharing_counts_people',
    label: 'Gives the number of people as the answer',
    description: 'Answered with how many people are sharing instead of how many items each person gets.',
    remediationExplanation: 'The question asks how many each person GETS, not how many people there are. Share the items out and count how many one person has.',
    visualScaffold: 'equal_groups_dealing',
    recheckPattern: 'New sharing task with different numbers.',
    parentNote: 'Underline the question word: "How many does each child get?" to focus attention on the answer required.',
    relatedSkills: ['P1-EQG-04'],
  },
  {
    tag: 'leftover_ignored',
    label: 'Ignores the remainder',
    description: 'Shared the items but did not report the leftover items that could not be shared equally.',
    remediationExplanation: 'After sharing equally, check: are there any items that no one can have? Those are the leftovers.',
    visualScaffold: 'leftover_highlight',
    recheckPattern: 'New sharing task where remainder is non-zero.',
    parentNote: 'After dealing out, ask "Are there any left in the middle?" to build remainder awareness.',
    relatedSkills: ['P1-EQG-05'],
  },
  {
    tag: 'leftover_forced_equal',
    label: 'Forces equal sharing by ignoring items',
    description: 'Ignored some items to make the sharing come out exactly equal, rather than identifying a remainder.',
    remediationExplanation: 'Use ALL the items. If some are left over after equal sharing, count those as the remainder — do not leave them out.',
    visualScaffold: 'leftover_highlight',
    recheckPattern: 'New sharing task where not all items can be distributed.',
    parentNote: 'Emphasise that every item must be accounted for: either shared or counted as a leftover.',
    relatedSkills: ['P1-EQG-05'],
  },
  {
    tag: 'leftover_gives_total',
    label: 'Gives the total instead of the leftover count',
    description: 'Answered with the total number of items instead of just the number left over after sharing.',
    remediationExplanation: 'First share equally, then count only the items that are LEFT OVER — the ones nobody gets.',
    visualScaffold: 'leftover_highlight',
    recheckPattern: 'New leftover task with a different total.',
    parentNote: 'After sharing, point to the remaining items and ask "How many are these?" separately.',
    relatedSkills: ['P1-EQG-05'],
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
