const misconceptions = [
  {
    tag: 'multiplies_only_one_part',
    label: 'Multiplies only the numerator or only the denominator',
    description: 'When finding an equivalent fraction, multiplies the numerator but forgets to multiply the denominator (or vice versa), e.g. 1/3 = 1/6 instead of 2/6.',
    remediationExplanation: 'To keep a fraction equivalent, you must multiply (or divide) BOTH the numerator and the denominator by the same number. Think of it as cutting each piece into smaller pieces — the number of pieces AND the number you have both change.',
    visualScaffold: 'fraction_bar_equivalent',
    recheckPattern: 'Find the missing numerator or denominator in an equivalent fraction.',
    parentNote: 'Use paper strips. Fold one strip into thirds and shade one third. Then fold a matching strip into sixths — show that two sixths covers the same length. Both numbers changed.',
    relatedSkills: ['P3-FR-01'],
  },
  {
    tag: 'divides_only_one_part',
    label: 'Divides only the numerator or only the denominator when simplifying',
    description: 'When checking equivalence by simplifying, divides only the top or only the bottom, producing a wrong fraction.',
    remediationExplanation: 'Simplifying (finding an equivalent fraction with smaller numbers) means dividing both parts by the same number. If you only divide one part, the fraction changes its value.',
    visualScaffold: 'fraction_bar_equivalent',
    recheckPattern: 'Simplify a fraction or check if two fractions are equivalent.',
    parentNote: 'Ask: "Did you do the same thing to the top AND the bottom?" Both must be divided by the same number.',
    relatedSkills: ['P3-FR-01'],
  },
  {
    tag: 'uses_additive_instead_of_multiplicative',
    label: 'Adds instead of multiplying to find equivalent fractions',
    description: 'Uses addition to scale fractions, e.g. 1/3 = 3/5 (added 2 to both) instead of 1/3 = 2/6 (multiplied both by 2).',
    remediationExplanation: 'Equivalent fractions use multiplication, not addition. Adding the same number to the top and bottom CHANGES the value of the fraction. You must multiply both parts by the same number.',
    visualScaffold: 'fraction_bar_equivalent',
    recheckPattern: 'Find the equivalent fraction by identifying the scale factor.',
    parentNote: 'Show with concrete examples: 1/2 is not the same as 3/4 (adding 2), but IS the same as 2/4 (multiplying by 2). Use fraction strips or drawings to prove it.',
    relatedSkills: ['P3-FR-01'],
  },
  {
    tag: 'adds_unlike_numerators_directly',
    label: 'Adds numerators without finding a common denominator',
    description: 'When adding fractions with different denominators, adds the numerators directly without renaming, e.g. 1/2 + 1/4 = 2/4 instead of 3/4.',
    remediationExplanation: 'You can only add numerators when the denominators are the same. First, rename the fraction with the smaller denominator: 1/2 = 2/4. Then add: 2/4 + 1/4 = 3/4.',
    visualScaffold: 'fraction_bar_addition',
    recheckPattern: 'Add two related fractions where one denominator divides the other.',
    parentNote: 'Use fraction bars: show that 1/2 = 2/4. Place them side by side with the 1/4 piece. Count the total fourths.',
    relatedSkills: ['P3-FR-02'],
  },
  {
    tag: 'wrong_common_denominator',
    label: 'Uses an incorrect common denominator',
    description: 'Chooses a denominator that is not a common multiple, or multiplies both denominators unnecessarily, e.g. uses 6 for 1/2 + 1/4 instead of 4.',
    remediationExplanation: 'For related fractions, the larger denominator IS the common denominator. If one denominator divides into the other, just rename the fraction with the smaller denominator. No extra work needed.',
    visualScaffold: 'fraction_bar_common_denominator',
    recheckPattern: 'Add or subtract related fractions, identifying the common denominator.',
    parentNote: 'Ask: "Does the smaller denominator divide evenly into the larger one?" If yes, the larger denominator is already the common one. Rename only the other fraction.',
    relatedSkills: ['P3-FR-02'],
  },
  {
    tag: 'forgets_to_rename_numerator',
    label: 'Changes the denominator but forgets to change the numerator',
    description: 'When renaming a fraction to a common denominator, changes the bottom number but leaves the top unchanged, e.g. writes 1/2 = 1/4 instead of 2/4.',
    remediationExplanation: 'When you change the denominator, you must multiply the numerator by the same scale factor. If the denominator doubles, the numerator doubles too.',
    visualScaffold: 'fraction_bar_equivalent',
    recheckPattern: 'Rename a fraction to an equivalent fraction with a different denominator.',
    parentNote: 'This is the same rule as equivalent fractions: whatever you do to the bottom, you must do to the top. Practise a few equivalent fraction drills before returning to addition.',
    relatedSkills: ['P3-FR-02', 'P3-FR-01'],
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
