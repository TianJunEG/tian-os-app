const misconceptions = [
  {
    tag: 'reads_wrong_axis',
    label: 'Reads the wrong axis or label on the graph',
    description: 'Reads the x-axis value when asked for the y-axis value, or confuses the label of one data point with another.',
    remediationExplanation: 'Check which axis shows the quantity you need. The horizontal axis (bottom) usually shows categories or time. The vertical axis (side) usually shows the numbers. Trace from the data point to the correct axis.',
    visualScaffold: 'axis_tracing_guide',
    recheckPattern: 'Read a value from a line graph and explain which axis you used.',
    parentNote: 'Ask your child to point at the data point first, then trace a line across to the vertical axis. Practise with simple graphs before moving to harder ones.',
    relatedSkills: ['P4-ST-01', 'P4-ST-02'],
  },
  {
    tag: 'off_by_one_interval',
    label: 'Reads the value one interval off',
    description: 'Reads the value at the neighbouring data point instead of the correct one, or miscounts intervals on the axis.',
    remediationExplanation: 'Count the labels carefully along the axis. Point to each label as you count. Make sure you are reading the value directly above or below the correct label.',
    visualScaffold: 'interval_counting_highlight',
    recheckPattern: 'Read values at two adjacent points on a line graph.',
    parentNote: 'Have your child place a finger on the correct label at the bottom axis and trace straight up to the line. This avoids reading a neighbouring point by mistake.',
    relatedSkills: ['P4-ST-01'],
  },
  {
    tag: 'confuses_sector_with_total',
    label: 'Confuses a sector value with the total',
    description: 'Gives the total as the answer when asked for one sector, or gives one sector value when asked for the total.',
    remediationExplanation: 'A pie chart shows parts of a whole. Each slice (sector) is one part. The total is found by adding all the sectors together. Read the question carefully to check whether it asks for a part or the whole.',
    visualScaffold: 'pie_chart_part_vs_whole',
    recheckPattern: 'From a pie chart, state one sector value and the total separately.',
    parentNote: 'Ask: "Is the question asking for one slice or the whole pie?" If one slice, read that sector. If the whole pie, add all sectors.',
    relatedSkills: ['P4-ST-02'],
  },
  {
    tag: 'adds_when_should_subtract',
    label: 'Adds when the question asks for a difference',
    description: 'Adds two values together instead of subtracting when asked for the change, increase, decrease, or difference.',
    remediationExplanation: 'Words like "change", "increase", "decrease", "difference", and "how many more" all mean subtraction. Subtract the smaller value from the larger value.',
    visualScaffold: 'difference_vs_total_guide',
    recheckPattern: 'Find the difference between two values on a graph.',
    parentNote: 'Ask your child: "Does the question want the total or the difference?" If it says "how many more" or "change", that means subtract.',
    relatedSkills: ['P4-ST-01', 'P4-ST-02'],
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
