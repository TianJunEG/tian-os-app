const misconceptions = [
  {
    tag: 'pie_chart_fractions_dont_sum_to_1',
    label: 'Forgets that pie chart fractions must sum to 1',
    description: 'Adds fractions incorrectly or forgets that all fractions in a pie chart must add up to 1 (the whole). This leads to a wrong value for the remainder category.',
    remediationExplanation: 'A pie chart represents the whole, which equals 1 (or 100%). All the fractions must add up to 1. To find the "rest", add the given fractions first, then subtract from 1.',
    visualScaffold: 'pie_fractions_sum_to_one',
    recheckPattern: 'Find the remaining fraction in a pie chart where three fractions are given.',
    parentNote: 'Ask your child: "What do all the slices add up to?" The answer should always be 1 (or 100%). Practise adding fractions with different denominators.',
    relatedSkills: ['P6-DA-01'],
  },
  {
    tag: 'confuses_fraction_percentage_in_pie',
    label: 'Confuses fractions and percentages in a pie chart',
    description: 'Treats a fraction as a percentage or vice versa. For example, reads 1/4 as 14% instead of 25%, or treats 40% as 4/10 incorrectly.',
    remediationExplanation: 'Fractions and percentages are two ways to show parts of a whole. 1/4 = 25%, 1/2 = 50%, 1/5 = 20%. To convert a fraction to a percentage, divide the numerator by the denominator and multiply by 100.',
    visualScaffold: 'fraction_percentage_conversion_chart',
    recheckPattern: 'Convert a pie chart fraction to a percentage and find the quantity.',
    parentNote: 'Make a reference card with common fraction-to-percentage conversions (1/2 = 50%, 1/4 = 25%, 1/5 = 20%, 1/3 ≈ 33.3%). Practise converting both ways.',
    relatedSkills: ['P6-DA-01'],
  },
  {
    tag: 'wrong_total_for_pie',
    label: 'Uses the wrong total when calculating from a pie chart',
    description: 'Multiplies the fraction or percentage by a number other than the total — for instance, by one of the category values or by a misread number from the question.',
    remediationExplanation: 'Always identify the total first. The total is the number that the whole pie chart represents. Multiply the fraction (or percentage as a decimal) by this total to get the value for one category.',
    visualScaffold: 'pie_chart_total_highlight',
    recheckPattern: 'From a pie chart, state the total and then find the value for one sector.',
    parentNote: 'Before your child starts calculating, ask them to underline or circle the total in the question. This prevents mixing up the total with a sector value.',
    relatedSkills: ['P6-DA-01'],
  },
  {
    tag: 'average_divides_by_wrong_count',
    label: 'Divides by the wrong number when finding the average',
    description: 'Divides the sum by a number other than the count of items — for example, divides by 3 when there are 4 values, or divides by 10 (the largest value) instead of the count.',
    remediationExplanation: 'Average = Total sum / Number of items. Count the items carefully. If there are 4 test scores, divide by 4. If there are 5 months of data, divide by 5.',
    visualScaffold: 'average_formula_scaffold',
    recheckPattern: 'Calculate the average of a set of numbers and explain what you divided by.',
    parentNote: 'Have your child write "Average = Sum / Count" at the top of every average problem. Then ask them to count the items before they start dividing.',
    relatedSkills: ['P6-DA-02'],
  },
  {
    tag: 'forgets_to_multiply_average_by_count',
    label: 'Forgets to multiply average by count to find the total',
    description: 'When given the average and asked to find a missing value, subtracts the known values from the average instead of first computing the total (average x count).',
    remediationExplanation: 'To find a missing value: Step 1 — find the total: Total = Average x Number of items. Step 2 — add up the known values. Step 3 — subtract to find the missing value: Missing = Total - Sum of known values.',
    visualScaffold: 'missing_value_steps',
    recheckPattern: 'Given the average of 5 numbers and 4 of them, find the 5th.',
    parentNote: 'This is a common mistake. Remind your child: the average is NOT the total. They must multiply first. A good check: after finding the missing number, recompute the average to verify.',
    relatedSkills: ['P6-DA-02'],
  },
  {
    tag: 'reads_wrong_category',
    label: 'Reads the value of the wrong category from a table or chart',
    description: 'Gives the value for a neighbouring or similarly named category instead of the one asked about. For example, reads the Science score when asked for Math.',
    remediationExplanation: 'Read the question carefully and underline the category name. Then trace along the row or column in the table to find the correct value. Double-check the label before writing your answer.',
    visualScaffold: 'table_category_tracing',
    recheckPattern: 'Read two specific values from a table and state which category each belongs to.',
    parentNote: 'Ask your child to point at the category name in the question, then point at the matching row or column in the table. This physical tracing step reduces careless misreads.',
    relatedSkills: ['P6-DA-01', 'P6-DA-02'],
  },
  {
    tag: 'assumes_equal_sectors',
    label: 'Assumes all pie chart sectors are equal',
    description: 'Divides the total equally among all categories instead of using the given fractions or percentages for each sector.',
    remediationExplanation: 'Each sector of a pie chart can be a different size. Use the fraction or percentage given for each sector — do not assume they are all equal. Only divide equally if the question says the sectors are equal.',
    visualScaffold: 'unequal_sectors_highlight',
    recheckPattern: 'From a pie chart with unequal fractions, find the value of the largest and smallest sectors.',
    parentNote: 'Show your child pie charts with clearly different-sized slices. Ask: "Are these slices the same size?" This builds awareness that sectors are usually unequal.',
    relatedSkills: ['P6-DA-01'],
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
