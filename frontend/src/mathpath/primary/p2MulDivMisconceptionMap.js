const misconceptions = [
  {
    tag: 'times_table_recall_error',
    label: 'Recalls the wrong times table fact',
    description: 'Retrieves a neighbouring fact instead of the correct one, e.g. says 4 x 5 = 25 (confusing with 5 x 5) instead of 20.',
    remediationExplanation: 'Check your answer by skip-counting. 4 x 5 means 4 groups of 5: count 5, 10, 15, 20. Use a known fact to double-check.',
    visualScaffold: 'times_table_grid_highlight',
    recheckPattern: 'Recall a table fact and verify by skip-counting.',
    parentNote: 'Practise the trickier facts (e.g. 3 x 4, 4 x 5, 3 x 5) with flashcards. The "derive from a known fact" strategy helps: if you know 4 x 4 = 16, then 4 x 5 = 16 + 4 = 20.',
    relatedSkills: ['P2-MD-01', 'P2-MD-02'],
  },
  {
    tag: 'confuses_multiplication_addition',
    label: 'Adds instead of multiplying',
    description: 'Treats the multiplication sign as addition, e.g. writes 3 x 4 = 7 instead of 12.',
    remediationExplanation: 'Multiplication means "groups of." 3 x 4 means 3 groups of 4, not 3 + 4. Draw 3 circles with 4 dots each and count all the dots.',
    visualScaffold: 'groups_of_visual',
    recheckPattern: 'Given a x b, draw groups and count the total.',
    parentNote: 'Use physical objects: lay out 3 groups of 4 counters and count. Reinforce the language "groups of" every time you see the x sign.',
    relatedSkills: ['P2-MD-01'],
  },
  {
    tag: 'division_remainder_confusion',
    label: 'Gives a remainder when division is exact',
    description: 'Reports a non-zero remainder for a division that comes out evenly, e.g. says 20 / 4 = 4 remainder 4 instead of 5.',
    remediationExplanation: 'Use the related multiplication fact to check. 20 / 4 = ? Think: what times 4 gives 20? 5 x 4 = 20, so the answer is 5 with no remainder.',
    visualScaffold: 'multiplication_division_inverse',
    recheckPattern: 'Divide and check using multiplication: answer x divisor should equal the dividend.',
    parentNote: 'Remind your child that division "undoes" multiplication. After dividing, multiply the answer back to check: 5 x 4 = 20. If it matches, no remainder.',
    relatedSkills: ['P2-MD-02'],
  },
  {
    tag: 'division_as_repeated_subtraction_error',
    label: 'Loses count during repeated subtraction',
    description: 'Uses repeated subtraction to divide but miscounts the steps, e.g. 30 / 5: subtracts 5 five times and writes 5 instead of 6.',
    remediationExplanation: 'Division is the inverse of multiplication. Instead of subtracting over and over, think: "what times 5 equals 30?" 6 x 5 = 30, so 30 / 5 = 6.',
    visualScaffold: 'multiplication_division_inverse',
    recheckPattern: 'Division fact: use the related multiplication fact to check.',
    parentNote: 'Teach your child to think of division as "missing factor": ? x 5 = 30. This is faster and avoids counting mistakes from repeated subtraction.',
    relatedSkills: ['P2-MD-02'],
  },
  {
    tag: 'commutative_for_division_error',
    label: 'Applies commutativity to division',
    description: 'Believes division is commutative, e.g. thinks 20 / 4 and 4 / 20 give the same answer.',
    remediationExplanation: 'Division is NOT commutative. 20 / 4 = 5, but 4 / 20 is less than 1. Always read the division carefully: the bigger number is usually the total being shared.',
    visualScaffold: 'sharing_model',
    recheckPattern: 'Compare a / b and b / a. Are they the same?',
    parentNote: 'Use sharing language: "20 sweets shared among 4 friends" is very different from "4 sweets shared among 20 friends." This helps build the correct mental model.',
    relatedSkills: ['P2-MD-02'],
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
