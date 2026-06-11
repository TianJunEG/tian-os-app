const misconceptions = [
  {
    tag: 'simplifies_only_one_term',
    label: 'Divides only one term when simplifying a ratio',
    description: 'For 12 : 8, writes 6 : 8 instead of 3 : 2 (divides only the first term by 2).',
    remediationExplanation: 'When simplifying a ratio, divide BOTH terms by the same number (the HCF). 12 : 8 → HCF is 4 → 12÷4 : 8÷4 = 3 : 2.',
    visualScaffold: 'ratio_simplify_both_terms',
    recheckPattern: 'Simplify 18 : 12.',
    parentNote: 'Remind your child: both sides of the ratio must be divided by the same number.',
    relatedSkills: ['P6-RAT-01'],
  },
  {
    tag: 'ratio_order_reversed',
    label: 'Writes ratio terms in the wrong order',
    description: 'When asked for the ratio of A to B, writes B : A instead.',
    remediationExplanation: 'The order in a ratio matters. "The ratio of A to B" means A first, then B. Read the question carefully to see which quantity comes first.',
    visualScaffold: 'ratio_order_label',
    recheckPattern: 'The ratio of boys to girls is 3 : 5. What is the ratio of girls to boys?',
    parentNote: 'Help your child underline "of X to Y" in the question so they put X first.',
    relatedSkills: ['P6-RAT-01', 'P6-RAT-02'],
  },
  {
    tag: 'divides_by_wrong_total',
    label: 'Divides the total by one ratio term instead of the sum of parts',
    description: 'For sharing $60 in ratio 2:3, divides 60 by 2 or 60 by 3 instead of 60 by 5.',
    remediationExplanation: 'First add the ratio parts: 2 + 3 = 5 total parts. Then divide the total by the sum: 60 ÷ 5 = 12 per part. Finally, multiply each ratio term by the value of 1 part.',
    visualScaffold: 'ratio_share_bar_model',
    recheckPattern: 'Share $72 in the ratio 4 : 5.',
    parentNote: 'Draw a bar model: each part has equal value. Count all the parts first.',
    relatedSkills: ['P6-RAT-02'],
  },
  {
    tag: 'forgets_ratio_sum',
    label: 'Forgets to add ratio parts to find the total number of parts',
    description: 'Skips the step of adding ratio terms. May use one ratio term as if it were the total.',
    remediationExplanation: 'Always start by adding the ratio parts. For ratio 3 : 7, total parts = 3 + 7 = 10. This tells you how many equal parts the total is split into.',
    visualScaffold: 'ratio_parts_addition',
    recheckPattern: 'Ratio of red to blue marbles is 5 : 3. There are 96 marbles. How many are red?',
    parentNote: 'Step 1 is always: add the ratio numbers together.',
    relatedSkills: ['P6-RAT-02'],
  },
  {
    tag: 'before_after_wrong_constant',
    label: 'Identifies the wrong quantity as unchanged in a before-after ratio problem',
    description: 'In a problem where only person A spends money, the child incorrectly assumes both amounts changed or picks the wrong person as unchanged.',
    remediationExplanation: 'In before-after ratio problems, identify which quantity stays the same. If Ali spent money but Mei did not, then Mei\'s amount is the constant. Use Mei\'s ratio parts to link the before and after.',
    visualScaffold: 'before_after_bar_model',
    recheckPattern: 'Ali and Mei had money in ratio 4 : 3. After Ali spent $15, ratio became 1 : 1. How much did Ali have at first?',
    parentNote: 'Ask: "Who didn\'t spend or receive anything?" That person\'s amount stays the same.',
    relatedSkills: ['P6-RAT-03'],
  },
  {
    tag: 'subtracts_ratio_parts',
    label: 'Subtracts the ratio numbers instead of working with unit values',
    description: 'For before ratio 5:3 and after ratio 3:3, subtracts 5−3=2 and thinks the answer is 2, instead of finding the unit value.',
    remediationExplanation: 'Ratio numbers are not actual amounts. You must find the value of 1 unit first. Set up: before units and after units, link them through the unchanged quantity, then solve for 1 unit.',
    visualScaffold: 'ratio_units_not_amounts',
    recheckPattern: 'Tom and Ravi had stickers in ratio 7 : 4. After Tom gave away 18 stickers, ratio became 5 : 4. How many stickers did Tom have at first?',
    parentNote: 'The numbers in a ratio are not actual quantities. We need to find what 1 unit is worth.',
    relatedSkills: ['P6-RAT-03'],
  },
  {
    tag: 'confuses_ratio_fraction',
    label: 'Confuses a ratio with a fraction',
    description: 'Treats ratio 3 : 5 as the fraction 3/5, using 5 as the total instead of 3 + 5 = 8.',
    remediationExplanation: 'A ratio 3 : 5 means 3 parts and 5 parts, totalling 8 parts. The fraction of the whole for the first quantity is 3/8, not 3/5. Only use the sum of ratio parts as the denominator.',
    visualScaffold: 'ratio_vs_fraction',
    recheckPattern: 'Ratio of apples to oranges is 2 : 5. What fraction of the fruits are apples?',
    parentNote: 'Ratio 2 : 5 does not mean 2/5. The total parts are 2 + 5 = 7, so the fraction is 2/7.',
    relatedSkills: ['P6-RAT-02', 'P6-RAT-03'],
  },
  {
    tag: 'three_quantity_ratio_error',
    label: 'Simplifies a three-quantity ratio incorrectly',
    description: 'Simplifies only two of the three terms, or finds the HCF of only two terms instead of all three.',
    remediationExplanation: 'For a three-quantity ratio like 12 : 8 : 4, find the HCF of ALL three numbers (HCF = 4), then divide every term by it: 3 : 2 : 1.',
    visualScaffold: 'three_ratio_hcf',
    recheckPattern: 'Simplify 15 : 10 : 25.',
    parentNote: 'For three-part ratios, the HCF must divide into all three numbers evenly.',
    relatedSkills: ['P6-RAT-01'],
  },
];

const byTag = new Map(misconceptions.map((m) => [m.tag, m]));
export function getMisconception(tag) { return byTag.get(tag) || null; }
export function getMisconceptionsForSkill(skillId) { return misconceptions.filter((m) => m.relatedSkills.includes(skillId)); }
export function getAllMisconceptions() { return [...misconceptions]; }
export function getRemediationForTag(tag) { const m = byTag.get(tag); if (!m) return null; return { tag: m.tag, explanation: m.remediationExplanation, visualScaffold: m.visualScaffold, recheckPattern: m.recheckPattern, parentNote: m.parentNote }; }
export default { getMisconception, getMisconceptionsForSkill, getAllMisconceptions, getRemediationForTag };
