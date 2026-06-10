const misconceptions = [
  {
    tag: 'ignores_scale_on_graph',
    label: 'Ignores the scale and counts icons as one each',
    description: 'Counts 5 icons as 5 even when each icon represents 2, so the correct value is 10.',
    remediationExplanation: 'Check the key or legend. If each icon stands for 2, multiply the number of icons by 2. Always look at what one icon represents before counting.',
    visualScaffold: 'picture_graph_scale_highlight',
    recheckPattern: 'Read the value for a category on a picture graph where each icon stands for 2 or 5.',
    parentNote: 'Ask your child: "What does one picture stand for?" before reading any category. Practise with picture graphs using scales of 1, 2, and 5.',
    relatedSkills: ['P2-ST-01', 'P2-ST-02'],
  },
  {
    tag: 'miscounts_icons',
    label: 'Miscounts the number of icons in a row',
    description: 'Counts 4 icons as 3 or 5 because of skipping or double-counting an icon.',
    remediationExplanation: 'Point to each icon one at a time and count aloud. Touch each picture once. Then multiply by the scale.',
    visualScaffold: 'icon_count_guide',
    recheckPattern: 'Count the icons for a category and multiply by the scale.',
    parentNote: 'Have your child point to each icon and count aloud. Practise with real objects lined up in a row.',
    relatedSkills: ['P2-ST-01'],
  },
  {
    tag: 'confuses_most_least',
    label: 'Mixes up most and least (longest vs shortest row)',
    description: 'Points to the shortest row when asked for the most, or the longest row when asked for the least.',
    remediationExplanation: 'Most = longest row (biggest number). Least = shortest row (smallest number). Read the question carefully: "most" and "least" are opposites.',
    visualScaffold: 'longest_shortest_row_labels',
    recheckPattern: 'Identify the category with the most and the category with the least on a picture graph.',
    parentNote: 'Ask: "Which row has the most pictures? That is the most." Practise with simple picture graphs drawn at home.',
    relatedSkills: ['P2-ST-02'],
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
