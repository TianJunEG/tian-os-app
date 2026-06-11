const misconceptions = [
  {
    tag: 'forgets_to_convert_mixed',
    label: 'Forgets to convert mixed number to improper fraction before operating',
    description: 'Multiplies or divides only the whole-number part and ignores the fractional part, e.g. 2 3/4 × 4 → 8 instead of 11.',
    remediationExplanation: 'Always convert a mixed number to an improper fraction first. 2 3/4 = (2×4+3)/4 = 11/4. Then multiply or divide as normal.',
    visualScaffold: 'mixed_to_improper_before_ops',
    recheckPattern: 'Calculate 1 2/3 × 6.',
    parentNote: 'Remind your child to convert mixed numbers to improper fractions before multiplying or dividing.',
    relatedSkills: ['P6-FR-01'],
  },
  {
    tag: 'multiplies_denominators_for_addition',
    label: 'Multiplies denominators when adding fractions instead of finding LCD',
    description: 'For 1/3 + 1/4, multiplies to get 1/12 instead of finding the LCD and renaming both fractions correctly.',
    remediationExplanation: 'When adding or subtracting fractions, find the Lowest Common Denominator (LCD) and rename BOTH fractions. Only then add or subtract the numerators. 1/3 + 1/4: LCD = 12, so 4/12 + 3/12 = 7/12.',
    visualScaffold: 'lcd_rename_add',
    recheckPattern: 'Add 2/5 + 1/3.',
    parentNote: 'Adding fractions requires a common denominator first — the numerators can only be added once the denominators match.',
    relatedSkills: ['P6-FR-01'],
  },
  {
    tag: 'wrong_reciprocal_in_division',
    label: 'Flips the wrong fraction when dividing',
    description: 'For a/b ÷ c/d, flips a/b instead of c/d, computing b/a × c/d.',
    remediationExplanation: 'When dividing by a fraction, flip the SECOND fraction (the divisor) and multiply. a/b ÷ c/d = a/b × d/c. The first fraction stays the same.',
    visualScaffold: 'division_flip_second',
    recheckPattern: 'Calculate 3/5 ÷ 2/3.',
    parentNote: 'The key rule: Keep the first fraction, flip the second, then multiply. KFC — Keep, Flip, Change.',
    relatedSkills: ['P6-FR-01'],
  },
  {
    tag: 'fraction_of_original_not_remainder',
    label: 'Takes the fraction of the original instead of the remainder',
    description: 'In a remainder problem, applies the second fraction to the original total rather than what is left after the first step.',
    remediationExplanation: 'Read carefully: "fraction of the remainder" means you must first calculate what is left, then apply the fraction to that leftover amount — not to the original total.',
    visualScaffold: 'bar_model_remainder',
    recheckPattern: 'Ali had 200 sweets. He gave 1/4 away and then ate 1/3 of the remainder. How many did he eat?',
    parentNote: 'This is the most common mistake in remainder problems. Use a bar model: shade the first fraction, then work only with the unshaded part.',
    relatedSkills: ['P6-FR-02', 'P6-FR-03'],
  },
  {
    tag: 'treats_remainder_as_whole',
    label: 'Treats the remainder fraction as a fraction of the whole',
    description: 'After computing one step, forgets that the context has shifted and treats a remainder quantity as if it were the full original.',
    remediationExplanation: 'After each step in a remainder chain, update your "working total" to the new remainder. Draw a bar model and cross out the used portion at each step so you always see what is left.',
    visualScaffold: 'bar_model_chain',
    recheckPattern: 'Mei had 300 beads. She used 1/3 for project A and 1/2 of the remainder for project B. How many are left?',
    parentNote: 'Encourage drawing a bar model and crossing out portions step by step. The "remainder" changes at each step.',
    relatedSkills: ['P6-FR-03'],
  },
  {
    tag: 'forgets_to_simplify',
    label: 'Gives an unsimplified fraction as the answer',
    description: 'Arrives at the correct numerator and denominator but does not reduce to simplest form, e.g. writes 4/8 instead of 1/2.',
    remediationExplanation: 'Always check if your answer can be simplified. Divide both the numerator and denominator by their Greatest Common Factor (GCF). 4/8: GCF of 4 and 8 is 4, so 4÷4 / 8÷4 = 1/2.',
    visualScaffold: 'simplify_gcf',
    recheckPattern: 'Simplify 6/18.',
    parentNote: 'Make it a habit: after every fraction answer, ask "Can I simplify this?" Find the largest number that divides both top and bottom.',
    relatedSkills: ['P6-FR-01', 'P6-FR-02'],
  },
  {
    tag: 'wrong_common_denominator',
    label: 'Uses a wrong common denominator in multi-step problems',
    description: 'Picks a denominator that is not a common multiple, leading to incorrect intermediate results in word problems.',
    remediationExplanation: 'When combining fractions in a word problem, list the multiples of each denominator until you find the Lowest Common Multiple (LCM). Use that as your common denominator.',
    visualScaffold: 'lcm_listing',
    recheckPattern: 'Ravi ate 1/6 of a pizza and Sarah ate 3/8. What fraction did they eat altogether?',
    parentNote: 'Practise finding the LCM of two numbers. A quick method: list multiples of the larger denominator and check which one the smaller denominator also divides into.',
    relatedSkills: ['P6-FR-02'],
  },
  {
    tag: 'incorrect_mixed_to_improper',
    label: 'Incorrectly converts a mixed number to an improper fraction',
    description: 'Makes an arithmetic error in the conversion, e.g. 3 2/5 → 13/5 (correct is 17/5) by forgetting to add the numerator or multiplying wrong.',
    remediationExplanation: 'To convert W n/d to an improper fraction: multiply W × d, then ADD n. The denominator stays the same. 3 2/5: 3×5=15, 15+2=17, so 17/5.',
    visualScaffold: 'mixed_to_improper_steps',
    recheckPattern: 'Convert 4 3/7 to an improper fraction.',
    parentNote: 'Have your child say the steps out loud: "Multiply whole by bottom, add the top, keep the bottom." Check with: 4 3/7 → 4×7+3 = 31, so 31/7.',
    relatedSkills: ['P6-FR-01'],
  },
];

const byTag = new Map(misconceptions.map((m) => [m.tag, m]));
export function getMisconception(tag) { return byTag.get(tag) || null; }
export function getMisconceptionsForSkill(skillId) { return misconceptions.filter((m) => m.relatedSkills.includes(skillId)); }
export function getAllMisconceptions() { return [...misconceptions]; }
export function getRemediationForTag(tag) { const m = byTag.get(tag); if (!m) return null; return { tag: m.tag, explanation: m.remediationExplanation, visualScaffold: m.visualScaffold, recheckPattern: m.recheckPattern, parentNote: m.parentNote }; }
export default { getMisconception, getMisconceptionsForSkill, getAllMisconceptions, getRemediationForTag };
