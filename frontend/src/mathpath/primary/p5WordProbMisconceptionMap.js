const misconceptions = [
  {
    tag: 'uses_wrong_operation',
    label: 'Uses the wrong operation',
    description: 'Applies the wrong arithmetic operation (e.g. adds instead of subtracting, multiplies instead of dividing). Often triggered by keyword misreading.',
    remediationExplanation: 'Identify the action words in the problem. "How much left", "remaining" means subtract. "How much altogether" means add. "Share equally" means divide. "Each costs" means multiply. Read the question twice before choosing an operation.',
    visualScaffold: 'operation_keyword_chart',
    recheckPattern: 'Read the problem again. Underline the key action words. Which operation matches?',
    parentNote: 'Ask your child to explain in their own words what the question is asking before they start calculating. This slows them down and helps them pick the right operation.',
    relatedSkills: ['P5-WP-01', 'P5-WP-02', 'P5-WP-03'],
  },
  {
    tag: 'skips_intermediate_step',
    label: 'Skips an intermediate step',
    description: 'Jumps from the first calculation to the final answer without completing the middle step. E.g. finds total cost but forgets to subtract from amount paid.',
    remediationExplanation: 'Multi-step problems need multiple calculations. After each step, ask: "Have I answered the question yet?" If not, there is another step. Write down each intermediate result.',
    visualScaffold: 'multi_step_flowchart',
    recheckPattern: 'Count how many steps you need. Write each step on a separate line before giving your final answer.',
    parentNote: 'Encourage your child to number their steps (Step 1, Step 2, Step 3) and check that the last step actually answers the question.',
    relatedSkills: ['P5-WP-01', 'P5-WP-02'],
  },
  {
    tag: 'misreads_before_after',
    label: 'Confuses before and after quantities',
    description: 'Mixes up which quantity is the starting amount and which is the ending amount. E.g. subtracts when they should add (or vice versa) because they confuse the direction of change.',
    remediationExplanation: 'Draw a timeline: BEFORE then change then AFTER. Label what you know and what you need to find. If finding the original, work backwards: reverse each operation.',
    visualScaffold: 'before_after_bar_model',
    recheckPattern: 'Draw a Before-After diagram. Label "Before", the changes, and "After". Which value are you looking for?',
    parentNote: 'Help your child draw a simple before-and-after diagram for every such problem. This makes the direction of change visual and concrete.',
    relatedSkills: ['P5-WP-02'],
  },
  {
    tag: 'confuses_unit_rate_with_total',
    label: 'Confuses unit rate with total',
    description: 'Gives the total cost or total distance as the answer instead of the unit rate (cost per item, speed per hour). Or multiplies when they should divide.',
    remediationExplanation: 'A unit rate is the amount for ONE unit. To find it, divide the total by the number of units. "Cost of 1 item" = total cost divided by number of items. "Speed" = distance divided by time.',
    visualScaffold: 'unit_rate_diagram',
    recheckPattern: 'The question asks for the rate for ONE unit. Did you divide the total by the count?',
    parentNote: 'Remind your child: "per" means "for each one". If the answer is for one item or one hour, they need to divide.',
    relatedSkills: ['P5-WP-03'],
  },
  {
    tag: 'wrong_comparison_direction',
    label: 'Compares in the wrong direction',
    description: 'When comparing two rates, picks the larger unit cost as "cheaper" or the slower speed as "faster". Reverses the comparison logic.',
    remediationExplanation: 'After finding both unit rates, re-read the question. "Cheaper" means the smaller number. "Faster" means the larger number. Write both values and circle the correct one based on what is asked.',
    visualScaffold: 'comparison_number_line',
    recheckPattern: 'You found two unit rates. The question asks which is cheaper or faster. Double-check: does cheaper mean smaller or larger?',
    parentNote: 'Have your child write both rates side by side and ask: "Which number is smaller? That is the cheaper one."',
    relatedSkills: ['P5-WP-03'],
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
