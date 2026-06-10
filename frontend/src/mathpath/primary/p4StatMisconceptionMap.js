const misconceptions = [
  {
    tag: 'reads_wrong_axis',
    label: 'Reads the wrong axis',
    description: 'Reads the x-axis value when the y-axis is needed, or vice versa. E.g. reports the day name instead of the sales figure.',
    remediationExplanation: 'The horizontal axis (x) usually shows categories or time. The vertical axis (y) shows the measured value. Trace from the point straight across to the y-axis to read the value.',
    visualScaffold: 'axis_label_highlight',
    recheckPattern: 'The graph shows temperature over 5 days. What does the vertical axis represent?',
    parentNote: 'Ask your child to point to each axis and say what it measures before answering any questions.',
    relatedSkills: ['P4-STAT-01', 'P4-STAT-02'],
  },
  {
    tag: 'interpolation_error',
    label: 'Misreads a value between labelled points',
    description: 'When the value falls between two grid lines, reads the nearest labelled line instead of estimating. E.g. reads 100 instead of 130.',
    remediationExplanation: 'If a point is between two grid lines, count the small intervals. E.g. between 100 and 200 with 5 intervals, each interval = 20. Three intervals above 100 = 160.',
    visualScaffold: 'grid_interval_counting',
    recheckPattern: 'The scale goes 0, 50, 100, 150. A point is halfway between 50 and 100. What is its value?',
    parentNote: 'Practise reading a ruler between centimetre marks — the same skill applies to graph scales.',
    relatedSkills: ['P4-STAT-01'],
  },
  {
    tag: 'misreads_scale',
    label: 'Misreads the scale intervals',
    description: 'Assumes each grid line = 1 when the scale goes up in 5s, 10s, 20s, etc. E.g. counts 3 grid lines as 3 instead of 30.',
    remediationExplanation: 'Always check the scale first. Read two consecutive labels and subtract: that tells you the interval. E.g. 20 and 40 → each grid line = 20.',
    visualScaffold: 'scale_interval_box',
    recheckPattern: 'The y-axis shows 0, 20, 40, 60. What does each grid line represent?',
    parentNote: 'Before reading any values, have your child write down: "Each grid line = ___". This prevents scale errors.',
    relatedSkills: ['P4-STAT-01', 'P4-STAT-02'],
  },
  {
    tag: 'confuses_sector_label',
    label: 'Confuses sector label with value',
    description: 'Treats the percentage label as the actual count, or confuses which label belongs to which sector. E.g. says "25 items" when the chart shows 25% of 200 items.',
    remediationExplanation: 'A pie chart sector label shows a fraction or percentage of the total. To find the actual number: multiply the percentage by the total and divide by 100. E.g. 25% of 200 = 200 × 25 ÷ 100 = 50.',
    visualScaffold: 'pie_percentage_to_value',
    recheckPattern: 'A pie chart shows 30% for "Mango". There are 400 fruits in total. How many are Mango?',
    parentNote: 'Remind your child: "Percentage is not the count." Always multiply by the total.',
    relatedSkills: ['P4-STAT-02'],
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
