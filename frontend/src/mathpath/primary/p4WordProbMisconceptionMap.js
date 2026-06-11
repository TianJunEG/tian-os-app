const misconceptions = [
  {
    tag: 'uses_wrong_operation',
    label: 'Uses the wrong operation for a fraction word problem',
    description: 'Adds or subtracts the numerator and denominator instead of dividing the total by the denominator and multiplying by the numerator.',
    remediationExplanation: 'To find a fraction of a number, divide the number by the denominator first, then multiply by the numerator. For example, 3/8 of 24: divide 24 by 8 to get 3, then multiply 3 by 3 to get 9.',
    visualScaffold: 'fraction_of_quantity_bar_model',
    recheckPattern: 'Find 2/5 of 30 and explain each step.',
    parentNote: 'Ask your child: "What does the bottom number (denominator) tell us? How many equal parts?" Then: "What does the top number (numerator) tell us? How many parts do we take?"',
    relatedSkills: ['P4-WP-01'],
  },
  {
    tag: 'computes_fraction_wrong',
    label: 'Computes the fraction incorrectly',
    description: 'Divides by the numerator instead of the denominator, or multiplies by the denominator instead of the numerator.',
    remediationExplanation: 'Remember: divide by the bottom number (denominator) first to find one part, then multiply by the top number (numerator) to find how many parts you need.',
    visualScaffold: 'fraction_computation_steps',
    recheckPattern: 'Find 3/4 of 20 step by step.',
    parentNote: 'Use a simple example first: "What is 1/2 of 10?" (5). Then build up: "What is 3/4 of 8?" Show that 8 ÷ 4 = 2 (one part), then 2 × 3 = 6 (three parts).',
    relatedSkills: ['P4-WP-01'],
  },
  {
    tag: 'stops_after_one_step',
    label: 'Stops after completing only the first step',
    description: 'In a two-step problem, solves the first step correctly but stops there, giving an intermediate answer as the final answer.',
    remediationExplanation: 'Two-step problems need two calculations. After the first step, check: "Have I answered the question?" If not, use your first answer to do the second step.',
    visualScaffold: 'two_step_bar_model',
    recheckPattern: 'Solve a two-step problem and show both steps.',
    parentNote: 'After your child writes an answer, ask: "Does this answer the question?" If the question asks for the amount left after two purchases, one subtraction is not enough.',
    relatedSkills: ['P4-WP-02'],
  },
  {
    tag: 'adds_instead_of_subtracts',
    label: 'Adds when the problem requires subtraction',
    description: 'Adds two amounts together instead of subtracting, especially when the word problem uses "spent", "gave away", or "left".',
    remediationExplanation: 'Look for clue words: "spent", "gave away", "left", and "remaining" usually mean subtraction. "Earned", "received", and "altogether" usually mean addition. Draw a bar model to see whether the quantity is getting bigger or smaller.',
    visualScaffold: 'operation_clue_words_chart',
    recheckPattern: 'Read a word problem and identify whether to add or subtract before solving.',
    parentNote: 'Ask your child: "Is the amount getting bigger or smaller in this story?" If someone spends money, the amount gets smaller — that means subtract.',
    relatedSkills: ['P4-WP-02'],
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
