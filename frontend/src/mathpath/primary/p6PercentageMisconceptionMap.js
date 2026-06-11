const misconceptions = [
  {
    tag: 'adds_percentage_to_value_directly',
    label: 'Adds the percentage number directly to the value',
    description: 'Treats the percentage as a dollar amount. For example, "increase $80 by 25%" becomes $80 + $25 = $105 instead of $80 + $20 = $100.',
    remediationExplanation: 'A percentage is not the same as a dollar amount. To find 25% of $80, calculate 25/100 × $80 = $20. Then add $20 to $80 to get $100.',
    visualScaffold: 'bar_model_percentage',
    recheckPattern: 'A toy costs $60. Its price increased by 15%. What is the new price?',
    parentNote: 'Your child may be confusing "25%" with "$25". Practise converting percentages to fractions or decimals first (25% = 1/4), then finding that fraction of the amount.',
    relatedSkills: ['P6-PCT-01'],
  },
  {
    tag: 'percentage_of_wrong_base',
    label: 'Calculates the percentage of the wrong base value',
    description: 'Uses the new/changed value as the base instead of the original, or vice versa. For example, after a 20% increase from $100 to $120, mistakenly calculates 20% of $120 for subsequent operations.',
    remediationExplanation: 'Always identify which value is the "whole" or base. In a percentage increase, the base is the original value. In reverse percentage, the given value is NOT the base — you must work backwards to find the original.',
    visualScaffold: 'bar_model_percentage',
    recheckPattern: 'After a 25% increase, a shirt costs $150. What was the original price?',
    parentNote: 'Help your child identify the "100%" value in each problem. Drawing a bar model where the full bar represents 100% makes it clearer which number to use as the base.',
    relatedSkills: ['P6-PCT-02', 'P6-PCT-03'],
  },
  {
    tag: 'forgets_subtract_discount',
    label: 'Gives the discount amount instead of the sale price',
    description: 'Correctly calculates the discount amount but forgets to subtract it from the original price. For example, "20% off $50" gives $10 instead of $40.',
    remediationExplanation: 'Finding the discount is only the first step. The sale price = original price − discount amount. Alternatively, if the discount is 20%, the customer pays 80% of the original: 80% × $50 = $40.',
    visualScaffold: 'bar_model_discount',
    recheckPattern: 'A bag costs $120. It is on sale at 30% off. Find the sale price.',
    parentNote: 'Ask your child: "Does the answer make sense? If there is a discount, should the sale price be more or less than the original?" This helps catch the mistake of giving the discount amount instead of the final price.',
    relatedSkills: ['P6-PCT-02'],
  },
  {
    tag: 'gst_on_discounted_not_original',
    label: 'Applies GST to the original price instead of the discounted price',
    description: 'When a discount is applied first and then GST is added, mistakenly calculates GST on the original price rather than the discounted price.',
    remediationExplanation: 'GST is charged on the price you actually pay (the discounted price), not the original price. Step 1: Find the discounted price. Step 2: Calculate GST on the discounted price. Step 3: Add GST to the discounted price.',
    visualScaffold: 'two_step_bar_model',
    recheckPattern: 'A jacket costs $200. There is a 25% discount, then 9% GST is added. What is the final price?',
    parentNote: 'This is a two-step problem. Help your child see that GST is always calculated on the price being paid, which is the discounted price. Work through each step one at a time.',
    relatedSkills: ['P6-PCT-02'],
  },
  {
    tag: 'reverse_percentage_uses_final_as_base',
    label: 'Uses the final value as the base in reverse percentage',
    description: 'When finding the original value, calculates the percentage of the final value instead of recognising that the final value represents more or less than 100%. For example, "After 20% discount, price is $48" leads to $48 + 20% of $48 = $57.60, instead of the correct $60.',
    remediationExplanation: 'The final value after a 20% discount is 80% of the original — not 100%. To find the original: $48 represents 80%. Find 1%: $48 ÷ 80 = $0.60. Find 100%: $0.60 × 100 = $60.',
    visualScaffold: 'unitary_method_steps',
    recheckPattern: 'After a 25% discount, the price of a bag is $90. What was the original price?',
    parentNote: 'This is the most common mistake in reverse percentage. Help your child see that the given value is NOT the "whole". Draw a bar model: the full bar is the original (unknown), and the given value is a portion of that bar.',
    relatedSkills: ['P6-PCT-03'],
  },
  {
    tag: 'confuses_increase_decrease',
    label: 'Adds when should subtract, or vice versa',
    description: 'Adds the percentage amount when the problem requires subtraction (discount/decrease) or subtracts when it requires addition (increase/markup).',
    remediationExplanation: 'Read the problem carefully for key words. "Increase", "raised", "more", and "added" mean you ADD the percentage amount. "Decrease", "discount", "off", "less", and "reduced" mean you SUBTRACT the percentage amount.',
    visualScaffold: 'keyword_highlighter',
    recheckPattern: 'A watch costs $200. Its price decreased by 30%. What is the new price?',
    parentNote: 'Encourage your child to underline or highlight the key word in the problem (increase, decrease, discount, markup) before calculating. This simple habit prevents careless mix-ups.',
    relatedSkills: ['P6-PCT-01', 'P6-PCT-03'],
  },
  {
    tag: 'wrong_percentage_fraction',
    label: 'Converts the percentage to a wrong fraction or decimal',
    description: 'Incorrectly converts a percentage to a fraction or decimal. For example, writes 25% as 2.5 or 0.025 instead of 0.25, or writes 9% as 0.9 instead of 0.09.',
    remediationExplanation: 'To convert a percentage to a decimal, divide by 100 (move the decimal point two places to the left). 25% = 25 ÷ 100 = 0.25. 9% = 9 ÷ 100 = 0.09. To convert to a fraction: 25% = 25/100 = 1/4.',
    visualScaffold: 'percentage_conversion_table',
    recheckPattern: 'Express 9% as a decimal. Express 40% as a fraction in simplest form.',
    parentNote: 'A place-value chart can help. "Per cent" means "per hundred", so 25% means 25 out of 100. Practise the conversions: 25% = 0.25 = 1/4, 50% = 0.50 = 1/2, 10% = 0.10 = 1/10.',
    relatedSkills: ['P6-PCT-01', 'P6-PCT-02'],
  },
  {
    tag: 'percentage_greater_than_100_confusion',
    label: 'Confused when the effective percentage exceeds 100%',
    description: 'Struggles when the result of a percentage change means the new value is more than double or when working with percentages above 100%. For example, does not understand that a 150% increase means the new value is 250% of the original.',
    remediationExplanation: 'A percentage increase of 150% means you add 150% of the original to itself. The new value = 100% + 150% = 250% of the original. If the original is $40, the new value is 250% × $40 = $100.',
    visualScaffold: 'extended_bar_model',
    recheckPattern: 'A painting was bought for $80. Its value increased by 150%. What is the new value?',
    parentNote: 'Use a bar model where the original is one full bar (100%). For a 150% increase, draw one-and-a-half additional bars. The total is two-and-a-half bars, which is 250% of the original.',
    relatedSkills: ['P6-PCT-01', 'P6-PCT-03'],
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
