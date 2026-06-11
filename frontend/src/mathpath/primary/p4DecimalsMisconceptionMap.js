const misconceptions = [
  {
    tag: 'longer_decimal_is_larger',
    label: 'Thinks a decimal with more digits is always larger',
    description: 'Believes 0.65 > 0.7 because 65 > 7. Ignores place value and compares digit counts or the numbers after the point as whole numbers.',
    remediationExplanation: 'When comparing decimals, line them up by the decimal point and add trailing zeros so they have the same number of decimal places. 0.7 = 0.70, and 0.70 > 0.65 because 70 hundredths > 65 hundredths.',
    visualScaffold: 'place_value_chart',
    recheckPattern: 'Which is greater: 0.8 or 0.54?',
    parentNote: 'A common mistake is reading the digits after the decimal point as a whole number. Help your child by always writing decimals with the same number of decimal places (e.g. 0.80 vs 0.54) so the comparison is clearer.',
    relatedSkills: ['P4-DEC-01', 'P4-DEC-02'],
  },
  {
    tag: 'misplaces_decimal_point',
    label: 'Puts the decimal point in the wrong position',
    description: 'When writing or computing decimals, the decimal point is shifted left or right by one or more places.',
    remediationExplanation: 'Always count the number of decimal places in the original numbers. The answer must have the correct number of decimal places. For example, 2.5 has 1 decimal place, so when you multiply 2.5 by 3, the answer (7.5) also has 1 decimal place.',
    visualScaffold: 'decimal_point_alignment',
    recheckPattern: 'Write four and thirty-seven hundredths as a decimal.',
    parentNote: 'Practise reading decimals aloud using place-value language: "4.37 is 4 ones, 3 tenths, and 7 hundredths." This builds awareness of where each digit belongs.',
    relatedSkills: ['P4-DEC-01', 'P4-DEC-04', 'P4-DEC-05', 'P4-DEC-06'],
  },
  {
    tag: 'rounds_wrong_direction',
    label: 'Rounds up when should round down, or vice versa',
    description: 'Confuses the rounding rule. For example, rounds 3.42 to 3.5 (rounds up the tenths) instead of 3.4 when rounding to 1dp.',
    remediationExplanation: 'Look at the digit to the RIGHT of the rounding place. If it is 5 or more, round up. If it is 4 or less, round down (keep it the same). For 3.42 rounded to 1dp: the hundredths digit is 2, which is less than 5, so round down to 3.4.',
    visualScaffold: 'number_line_rounding',
    recheckPattern: 'Round 6.75 to 1 decimal place. Round 4.34 to 1 decimal place.',
    parentNote: 'Use a number line to show which whole number or tenth the decimal is closer to. The phrase "5 or more, let it soar; 4 or less, let it rest" can help.',
    relatedSkills: ['P4-DEC-03'],
  },
  {
    tag: 'aligns_rightmost_not_decimal_point',
    label: 'Aligns numbers at the right edge instead of the decimal point',
    description: 'When adding or subtracting decimals with different numbers of decimal places, lines up the rightmost digits instead of the decimal points. E.g. writes 3.4 + 2.15 as 3.4 + 2.15 aligned at the right, getting a wrong answer.',
    remediationExplanation: 'Always line up the decimal points when adding or subtracting. Write 3.4 as 3.40 so both numbers have 2 decimal places, then add: 3.40 + 2.15 = 5.55.',
    visualScaffold: 'vertical_addition_grid',
    recheckPattern: 'Calculate 5.3 + 2.78 using column addition.',
    parentNote: 'Use squared paper or a place-value grid. Write the decimal point in a dedicated column first, then fill in the digits. Adding trailing zeros helps avoid alignment errors.',
    relatedSkills: ['P4-DEC-04'],
  },
  {
    tag: 'forgets_to_place_decimal_back',
    label: 'Forgets to reinsert the decimal point after multiplying or dividing',
    description: 'Multiplies or divides correctly as a whole number but forgets to place the decimal point back in the answer. E.g. 2.4 x 3 = 72 instead of 7.2.',
    remediationExplanation: 'After multiplying or dividing, count the total number of decimal places in the original decimal. Place the decimal point in the answer so it has the same number of decimal places. 2.4 has 1dp, so 2.4 x 3 = 7.2 (1dp).',
    visualScaffold: 'decimal_place_tracker',
    recheckPattern: 'Calculate 3.15 x 4. How many decimal places should the answer have?',
    parentNote: 'Encourage your child to first estimate the answer. "3.15 x 4 is about 3 x 4 = 12, so the answer should be near 12, not 1260." Estimation catches misplaced decimal points.',
    relatedSkills: ['P4-DEC-05'],
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
