const misconceptions = [
  {
    tag: 'misreads_scale',
    label: 'Misreads the scale on the axis',
    description: 'Reads a bar that reaches the 3rd line as "3" when the scale goes in steps of 5, so the correct value is 15.',
    remediationExplanation: 'Check the numbers on the axis. If the scale goes 0, 5, 10, 15, each line is worth 5, not 1. Count the scale steps, not the number of lines.',
    visualScaffold: 'bar_graph_scale_highlight',
    recheckPattern: 'Read the value of a bar on a graph where the scale is in steps of 2, 5, or 10.',
    parentNote: 'Ask your child: "What does each line on the axis mean?" before reading any bars. Practise with graphs that use scales of 2, 5, and 10.',
    relatedSkills: ['P3-ST-01', 'P3-ST-02'],
  },
  {
    tag: 'ignores_axis_label',
    label: 'Ignores the axis label and gives the wrong unit',
    description: 'Reads the height of a bar correctly but does not include the unit or context (e.g. says "15" instead of "15 students").',
    remediationExplanation: 'Always check the axis label to know what the numbers represent (students, days, fruit, etc.). Include the unit in your answer.',
    visualScaffold: 'axis_label_callout',
    recheckPattern: 'Read a bar graph value and state the correct unit.',
    parentNote: 'Point to the axis label and ask: "What are we counting?" Make sure answers include the unit.',
    relatedSkills: ['P3-ST-01'],
  },
  {
    tag: 'counts_bars_not_values',
    label: 'Counts the number of bars instead of reading their values',
    description: 'When asked "How many more apples than oranges?", counts 2 bars instead of subtracting the values (15 - 10 = 5 more).',
    remediationExplanation: 'Read the VALUE of each bar from the scale, not just count bars. To find "how many more", subtract the smaller value from the larger value.',
    visualScaffold: 'bar_value_comparison',
    recheckPattern: 'Find how many more one category has than another.',
    parentNote: 'Ask: "What is the value of the apple bar? What is the value of the orange bar? What is the difference?"',
    relatedSkills: ['P3-ST-01'],
  },
  {
    tag: 'confuses_most_least',
    label: 'Mixes up most and least (tallest vs shortest bar)',
    description: 'Points to the shortest bar when asked for the most, or the tallest when asked for the least.',
    remediationExplanation: 'Most = tallest bar (biggest number). Least = shortest bar (smallest number). Read the question carefully: "most" and "least" are opposites.',
    visualScaffold: 'tallest_shortest_bar_labels',
    recheckPattern: 'Identify the category with the most and the category with the least.',
    parentNote: 'Ask: "Which bar is the tallest? That is the most." Practise with real charts from newspapers or menus.',
    relatedSkills: ['P3-ST-02'],
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
