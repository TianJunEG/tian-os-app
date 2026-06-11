const misconceptions = [
  {
    tag: 'divides_by_wrong_count_for_average',
    label: 'Divides by wrong count when finding average',
    description: 'Divides the total by the wrong number of items. E.g. divides by 4 instead of 5 when there are 5 values.',
    remediationExplanation: 'The average (mean) is the total divided by the number of items. Count all the values first, then divide. E.g. 5 values that add up to 100 → average = 100 ÷ 5 = 20.',
    visualScaffold: 'count_items_highlight',
    recheckPattern: 'The scores are 12, 18, 15, 20, 10. How many values are there? What is the average?',
    parentNote: 'Before dividing, ask your child to circle each value and write the count. This prevents dividing by the wrong number.',
    relatedSkills: ['P5-ST-01'],
  },
  {
    tag: 'confuses_average_with_median',
    label: 'Confuses the average with the median',
    description: 'Picks the middle value of a sorted list instead of computing the mean. E.g. for 3, 5, 7, 9, 11 answers 7 (the median) instead of 7 (the mean). The confusion surfaces when mean and median differ.',
    remediationExplanation: 'The average (mean) is found by adding all values and dividing by the count. The median is the middle value when sorted. They can be different. E.g. 2, 3, 10 → mean = 5, median = 3.',
    visualScaffold: 'mean_vs_median_comparison',
    recheckPattern: 'The values are 4, 6, 8, 10, 22. What is the average? Is it the same as the middle value?',
    parentNote: 'Ask your child: "Did you add and divide, or did you just pick the middle?" This catches the mix-up early.',
    relatedSkills: ['P5-ST-01'],
  },
  {
    tag: 'reads_wrong_row_column',
    label: 'Reads the wrong row or column',
    description: 'Reads a value from the wrong row or column in a table. E.g. reads the value for "Muffins" when asked about "Cookies".',
    remediationExplanation: 'Use your finger or a ruler to trace along the row or column. Read the category label first, then follow across to the value. Double-check that the label matches the question.',
    visualScaffold: 'row_column_trace',
    recheckPattern: 'A table shows: Apples 25, Bananas 30, Cherries 18. How many Bananas are there?',
    parentNote: 'Have your child underline the category name in the question and then find it in the table before reading the number.',
    relatedSkills: ['P5-ST-02'],
  },
  {
    tag: 'forgets_to_include_all_values',
    label: 'Forgets to include all values',
    description: 'Leaves out one or more values when computing a total or average. E.g. adds only 4 of 5 values before dividing.',
    remediationExplanation: 'Before adding, list every value and tick each one as you include it. Count your ticks to make sure you have the right number. E.g. for 5 items, you should have 5 ticks.',
    visualScaffold: 'checklist_tick',
    recheckPattern: 'The values are 8, 12, 6, 14, 10. Tick each as you add. What is the total?',
    parentNote: 'Encourage your child to write out each value separately and tick them off as they add. Missing one value is a very common error.',
    relatedSkills: ['P5-ST-01', 'P5-ST-02'],
  },
  {
    tag: 'double_counts_data',
    label: 'Double-counts a data value',
    description: 'Counts or adds a data value twice. E.g. adds a row value twice when computing a total from a table.',
    remediationExplanation: 'When adding up values from a table, cross out or tick each row after you include it. This way you will not accidentally add the same row twice.',
    visualScaffold: 'strikethrough_added_rows',
    recheckPattern: 'A table shows: Red 15, Blue 20, Green 10. Add them once to find the total. What do you get?',
    parentNote: 'If your child gets a total that seems too high, ask them to check whether any value was added more than once.',
    relatedSkills: ['P5-ST-02'],
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
