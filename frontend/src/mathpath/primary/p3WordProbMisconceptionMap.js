const misconceptions = [
  {
    tag: 'wrong_operation_choice',
    label: 'Chooses the wrong operation for the word problem',
    description: 'Adds when the problem requires division, or subtracts when it requires multiplication. Picks an operation based on keywords rather than understanding.',
    remediationExplanation: 'Read the problem carefully. "Shared equally" and "divided into groups" mean division. "How many altogether" means addition or multiplication. Draw a bar model to see the structure.',
    visualScaffold: 'bar_model_operation_guide',
    recheckPattern: 'Solve a sharing word problem and explain which operation you used.',
    parentNote: 'Ask your child: "What do we know? What do we need to find?" before choosing +, −, ×, or ÷. Avoid teaching keyword-based strategies.',
    relatedSkills: ['P3-WP-01', 'P3-WP-02'],
  },
  {
    tag: 'misreads_question',
    label: 'Answers the wrong part of the question',
    description: 'Finds the total when asked for one part, or finds one part when asked for the total.',
    remediationExplanation: 'Re-read the last sentence of the problem — it tells you what to find. Underline the question before you start solving.',
    visualScaffold: 'highlight_question_sentence',
    recheckPattern: 'Solve a word problem and underline what the question asks for.',
    parentNote: 'Teach your child to circle or underline the question sentence. Ask: "What exactly does the problem want you to find?"',
    relatedSkills: ['P3-WP-01', 'P3-WP-02'],
  },
  {
    tag: 'remainder_in_context',
    label: 'Does not interpret the remainder in context',
    description: 'Writes "7 remainder 2" without interpreting what the remainder means (e.g. 2 items are left over, or you need 1 more group).',
    remediationExplanation: 'After dividing, think about what the remainder means in the story. If sharing stickers, the remainder is how many are left. If filling bags, you might need one extra bag.',
    visualScaffold: 'remainder_context_examples',
    recheckPattern: 'Solve a sharing problem and explain what the remainder means.',
    parentNote: 'Ask: "What does the leftover part mean in this story?" Practise with real objects: share 10 sweets among 3 children.',
    relatedSkills: ['P3-WP-01'],
  },
  {
    tag: 'stops_after_one_step',
    label: 'Stops after completing only the first step',
    description: 'In a two-step problem, solves the first step correctly but stops there, giving an intermediate answer as the final answer.',
    remediationExplanation: 'Two-step problems need two calculations. After the first step, check: "Have I answered the question?" If not, use your first answer to do the second step.',
    visualScaffold: 'two_step_bar_model',
    recheckPattern: 'Solve a two-step problem and show both steps.',
    parentNote: 'After your child writes an answer, ask: "Does this answer the question?" If the question asks for the amount left after two purchases, one subtraction is not enough.',
    relatedSkills: ['P3-WP-02'],
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
