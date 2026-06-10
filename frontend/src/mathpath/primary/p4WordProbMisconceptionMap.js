const misconceptions = [
  {
    tag: 'doesnt_identify_what_to_find',
    label: 'Does not identify what the question asks for',
    description: 'Performs calculations but answers the wrong part of the problem. E.g. finds the total instead of the remainder.',
    remediationExplanation: 'Before calculating, underline the question sentence. Ask: "What does the question want me to find?" Write it down first.',
    visualScaffold: 'highlight_question_sentence',
    recheckPattern: 'Read the problem, then tell me: what are you asked to find?',
    parentNote: 'Have your child circle or underline the question before they start any working. This builds a habit of reading carefully.',
    relatedSkills: ['P4-WP-01', 'P4-WP-02'],
  },
  {
    tag: 'wrong_operation_choice',
    label: 'Chooses the wrong operation',
    description: 'Adds when they should subtract, or multiplies when they should divide. E.g. adds two amounts instead of subtracting from a total.',
    remediationExplanation: 'Identify the action in the problem. "Left over", "remaining", "how much more" → subtract. "Each group gets", "shared equally" → divide. "Altogether", "in total" → add.',
    visualScaffold: 'operation_keyword_chart',
    recheckPattern: 'Read the problem and tell me which operation you will use, and why.',
    parentNote: 'Make a keyword poster: "left over = subtract", "altogether = add", "each = divide or multiply". Practise with the poster visible.',
    relatedSkills: ['P4-WP-01', 'P4-WP-02'],
  },
  {
    tag: 'forgets_second_step',
    label: 'Forgets the second step',
    description: 'Completes only the first step and gives that as the final answer. E.g. finds the cost of items but forgets to subtract from the amount paid.',
    remediationExplanation: 'Two-step problems need two calculations. After your first answer, re-read the question: have you answered what it asked? If not, there is another step.',
    visualScaffold: 'two_step_flowchart',
    recheckPattern: 'Solve: Mia has $500. She buys a bag for $185 and shoes for $230. How much does she have left?',
    parentNote: 'After your child writes their first answer, ask "Is that what the question asked?" to prompt the second step.',
    relatedSkills: ['P4-WP-02'],
  },
  {
    tag: 'fraction_bar_model_confusion',
    label: 'Confuses parts of the bar model',
    description: 'Divides by the numerator instead of denominator, or forgets to multiply by the numerator. E.g. for 3/8 of 40, divides 40 by 3 instead of 8.',
    remediationExplanation: 'The denominator tells you how many equal parts to split into. The numerator tells you how many parts to take. For 3/8 of 40: split 40 into 8 parts (40÷8=5), then take 3 parts (5×3=15).',
    visualScaffold: 'bar_model_fraction',
    recheckPattern: 'Find 2/5 of 30 using a bar model.',
    parentNote: 'Draw a bar, split it into "denominator" parts, shade "numerator" parts. This makes the two steps visual and concrete.',
    relatedSkills: ['P4-WP-01'],
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
