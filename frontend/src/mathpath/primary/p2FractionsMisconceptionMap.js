const misconceptions = [
  {
    tag: 'adds_denominators',
    label: 'Adds the denominators together when adding fractions',
    description: 'When adding like fractions, adds both numerators and denominators, e.g. 2/5 + 1/5 becomes 3/10 instead of 3/5.',
    remediationExplanation: 'When fractions have the same denominator, only add the numerators. The denominator tells you the size of each piece and stays the same. 2/5 + 1/5 = 3/5 because you have 2 fifths plus 1 fifth, which is 3 fifths.',
    visualScaffold: 'fraction_bar_overlay',
    recheckPattern: 'Add two fractions with the same denominator.',
    parentNote: 'Use a fraction bar or strip of paper folded into equal parts. Show that each piece stays the same size — we are only counting how many pieces.',
    relatedSkills: ['P2-FR-01'],
  },
  {
    tag: 'forgets_denominator_stays',
    label: 'Changes the denominator when adding or subtracting',
    description: 'Writes a different denominator in the answer even though both fractions share the same one, e.g. 3/8 + 2/8 = 5/16.',
    remediationExplanation: 'The denominator names the size of each part. Since both fractions already use the same-size parts, the answer keeps that same denominator. 3/8 + 2/8 = 5/8.',
    visualScaffold: 'fraction_bar_overlay',
    recheckPattern: 'Add or subtract fractions with a common denominator.',
    parentNote: 'Ask your child: "Are the pieces the same size?" If yes, we just count pieces. The denominator does not change.',
    relatedSkills: ['P2-FR-01'],
  },
  {
    tag: 'confuses_numerator_denominator',
    label: 'Swaps numerator and denominator',
    description: 'Writes the total number of parts as the numerator and the shaded parts as the denominator, e.g. for 3 out of 4 shaded writes 4/3 instead of 3/4.',
    remediationExplanation: 'The numerator (top number) counts how many parts are shaded. The denominator (bottom number) tells how many equal parts there are in total. Shaded parts go on top.',
    visualScaffold: 'labelled_fraction_diagram',
    recheckPattern: 'Identify the fraction for shaded parts of a shape.',
    parentNote: 'Remember: Denominator is Down (the bottom number). It tells the total parts. The numerator counts the selected parts and sits on top.',
    relatedSkills: ['P2-FR-02'],
  },
  {
    tag: 'fraction_greater_than_whole',
    label: 'Gives a numerator larger than the denominator',
    description: 'When adding like fractions, produces a result where the numerator exceeds the denominator, e.g. says 4/5 + 3/5 = 7/5 when the problem constrains the answer to within one whole.',
    remediationExplanation: 'When working within one whole, the numerator can never be bigger than the denominator. If you get a numerator larger than the denominator, re-read the numbers and check your addition.',
    visualScaffold: 'fraction_circle_full',
    recheckPattern: 'Add two like fractions where the sum stays within one whole.',
    parentNote: 'Use a circle or bar divided into equal parts to show that we cannot shade more parts than the shape has. If the answer seems too big, help your child re-check.',
    relatedSkills: ['P2-FR-01'],
  },
  {
    tag: 'counts_unshaded_instead',
    label: 'Counts the unshaded parts instead of the shaded ones',
    description: 'When asked what fraction is shaded, counts the blank parts, e.g. if 3 of 5 parts are shaded, writes 2/5 instead of 3/5.',
    remediationExplanation: 'Look carefully at which parts are coloured in. Count only the shaded parts for the numerator. The unshaded parts are the "leftover" — they are not the answer.',
    visualScaffold: 'highlighted_shaded_vs_unshaded',
    recheckPattern: 'Identify the fraction for shaded parts of a shape.',
    parentNote: 'Point to the shaded parts and count them together. Then point to the unshaded parts. Ask: "Which group did the question ask about?"',
    relatedSkills: ['P2-FR-02'],
  },
];

const misconceptionByTag = new Map(misconceptions.map((m) => [m.tag, m]));

export function getMisconception(tag) {
  return misconceptionByTag.get(tag) || null;
}

export function getMisconceptionsForSkill(skillId) {
  return misconceptions.filter((m) => m.relatedSkills.includes(skillId));
}

export function getAllMisconceptions() {
  return [...misconceptions];
}

export function getRemediationForTag(tag) {
  const m = misconceptionByTag.get(tag);
  if (!m) return null;
  return {
    tag: m.tag,
    explanation: m.remediationExplanation,
    visualScaffold: m.visualScaffold,
    recheckPattern: m.recheckPattern,
    parentNote: m.parentNote,
  };
}

export default { getMisconception, getMisconceptionsForSkill, getAllMisconceptions, getRemediationForTag };
