// Misconception catalogue for the Percentage domain.
// Each entry covers one common error pattern, its remediation, and which skill(s) it appears in.

const misconceptions = [
  {
    tag: 'pct/not-per-hundred',
    label: 'Not understanding "per hundred"',
    description: 'Student treats percentage as a plain number rather than a ratio out of 100.',
    remediationExplanation:
      'Percentage literally means "per hundred". Draw a 100-square grid. If 37 squares are shaded, that is 37% — 37 out of every 100.',
    visualScaffold: 'hundred_grid',
    recheckPattern: '45 out of 100 squares are blue. What percentage is blue?',
    parentNote:
      'Ask your child to shade a 100-square grid and read off the percentage. Repeat until they see % = count out of 100.',
    relatedSkills: ['P001'],
  },
  {
    tag: 'pct/cap-at-100',
    label: 'Believing percentages cannot exceed 100',
    description: 'Student rejects or incorrectly handles percentages above 100%, e.g., in increase problems.',
    remediationExplanation:
      'A percentage above 100% just means more than the original whole. 150% of $40 = 1.5 × $40 = $60. Think of it as a multiplier.',
    visualScaffold: 'bar_model_extended',
    recheckPattern: 'A price increases by 120%. Is that possible? What would $50 become?',
    parentNote:
      'Show real examples: "150% of your allowance" = 1.5 times the allowance. Percentages beyond 100 are perfectly valid.',
    relatedSkills: ['P001', 'P006'],
  },
  {
    tag: 'pct/move-point-wrong',
    label: 'Moving the decimal point in the wrong direction',
    description: 'Student writes 45% as 4.5 or 450 instead of 0.45 (divides by 10 instead of 100).',
    remediationExplanation:
      'Percent means divide by 100. Move the decimal point TWO places to the left: 45% → 45.0 → 4.50 → 0.45.',
    visualScaffold: 'place_value_chart',
    recheckPattern: 'Write 72% as a decimal.',
    parentNote:
      'Drill: say "percent → decimal: jump the dot two left". Practice with multiples of 10 first (10%, 20%, 50%).',
    relatedSkills: ['P002'],
  },
  {
    tag: 'pct/keep-percent-sign',
    label: 'Keeping the % sign when converting to a fraction',
    description: 'Student writes 40% as a fraction as 40%/100 or 40/100% instead of 40/100 = 2/5.',
    remediationExplanation:
      'Drop the % sign when writing the fraction: 40% means 40/100. Then simplify: 40/100 = 2/5.',
    visualScaffold: 'fraction_bar',
    recheckPattern: 'Write 60% as a fraction in its simplest form.',
    parentNote: 'Remind your child: the % sign is replaced by "/100". No sign remains.',
    relatedSkills: ['P002'],
  },
  {
    tag: 'pct/forgot-divide-100',
    label: 'Forgetting to divide by 100 when finding a percentage of a quantity',
    description: 'Student multiplies by the percentage number without dividing by 100, giving an answer 100× too large.',
    remediationExplanation:
      '30% of 80 = 30/100 × 80 = 0.3 × 80 = 24. Always divide by 100 (or multiply by the decimal form).',
    visualScaffold: 'bar_model',
    recheckPattern: 'Find 25% of 120.',
    parentNote:
      'Ask: "What does 30% really mean as a decimal?" If they say 0.30, they understand the divide-by-100 step.',
    relatedSkills: ['P003'],
  },
  {
    tag: 'pct/wrong-base',
    label: 'Using the wrong base when expressing part as a percentage',
    description: 'Student puts the whole quantity in the numerator instead of the denominator, or uses the wrong reference.',
    remediationExplanation:
      'Formula: (part ÷ whole) × 100. Identify which is the "whole" (the reference group) before dividing.',
    visualScaffold: 'bar_model',
    recheckPattern: '15 out of 60 students are absent. What percentage is absent?',
    parentNote: 'Ask: "What is the total group we are comparing against?" That is always the denominator.',
    relatedSkills: ['P004'],
  },
  {
    tag: 'pct/part-is-whole',
    label: 'Treating the known part as the whole when finding the whole',
    description: 'Given "20% of a number is 40", student answers 40 instead of working backwards to 200.',
    remediationExplanation:
      'If 20% = 40, then 1% = 40 ÷ 20 = 2, so 100% = 2 × 100 = 200. Always find 1% first, then scale to 100%.',
    visualScaffold: 'unitary_method',
    recheckPattern: '15% of a number is 45. What is the number?',
    parentNote: 'Practice the unitary method: 1% step is the key. Ask "What is 1%?" before "What is 100%?".',
    relatedSkills: ['P005'],
  },
  {
    tag: 'pct/add-percent-not-amount',
    label: 'Adding the percentage number to the price instead of the percentage amount',
    description: 'For a 20% increase on $80, student writes $80 + 20 = $100 instead of $80 + $16 = $96.',
    remediationExplanation:
      'First calculate the actual increase: 20% of $80 = $16. Then add: $80 + $16 = $96.',
    visualScaffold: 'bar_model',
    recheckPattern: 'A book costs $50. The price increases by 10%. What is the new price?',
    parentNote:
      'Stress: the percentage is a fraction of the original, not a dollar amount. Always calculate the amount first.',
    relatedSkills: ['P006'],
  },
  {
    tag: 'pct/base-after-not-before',
    label: 'Using the new amount as the base for a decrease',
    description: 'Student applies the percentage to the post-change value rather than the original.',
    remediationExplanation:
      'Percentage change always applies to the ORIGINAL (before) amount. Identify "before" clearly before calculating.',
    visualScaffold: 'before_after_bar',
    recheckPattern: 'A price drops from $200. After a 15% decrease, what is the new price?',
    parentNote: '"Before" is the base. Circle the original number in the question before calculating anything.',
    relatedSkills: ['P006', 'P007'],
  },
  {
    tag: 'pct/percent-of-different-base',
    label: 'Applying a percentage to the wrong total in a before/after problem',
    description: 'Student mixes up which total a given percentage refers to in multi-step problems.',
    remediationExplanation:
      'Label each percentage with its own "100%". Draw a before bar and an after bar separately.',
    visualScaffold: 'before_after_bar',
    recheckPattern:
      'Ali had some stickers. He gave away 40% and had 60 left. How many did he start with?',
    parentNote:
      'Use two bar models — one for "before", one for "after". Keep the percentages anchored to their own bars.',
    relatedSkills: ['P007'],
  },
  {
    tag: 'pct/discount-of-discounted',
    label: 'Applying a second discount to the already-discounted price',
    description: 'With successive discounts, student multiplies discount percentages additively rather than applying them to the correct base.',
    remediationExplanation:
      'For a 20% discount, selling price = 80% of original. Each discount applies to the current price, not the original.',
    visualScaffold: 'bar_model',
    recheckPattern: 'A shoe costs $120. There is a 25% discount. Find the selling price.',
    parentNote: 'Clarify: "discount" reduces the price at that moment. The base changes after each reduction.',
    relatedSkills: ['P008'],
  },
  {
    tag: 'pct/gst-wrong-base',
    label: 'Applying GST to the GST-inclusive price instead of the pre-tax price',
    description: 'Student calculates GST on the total bill rather than on the original price.',
    remediationExplanation:
      'GST is always a percentage of the price BEFORE tax. Total = price × (1 + GST rate).',
    visualScaffold: 'bar_model',
    recheckPattern: 'A meal costs $40 before 9% GST. What is the total bill?',
    parentNote:
      'The label "before GST" is the base. GST is added on top of that — never on top of itself.',
    relatedSkills: ['P009'],
  },
  {
    tag: 'pct/interest-compound-confuse',
    label: 'Confusing simple interest with compound interest',
    description: 'Student re-applies interest to the growing total each year instead of always using the original principal.',
    remediationExplanation:
      'Simple interest: I = P × r% × t. The principal stays the same every year. No interest-on-interest.',
    visualScaffold: 'table_of_years',
    recheckPattern:
      'Find the simple interest on $2000 at 4% per year for 3 years.',
    parentNote:
      'Highlight "SIMPLE interest". The same amount of interest is earned every year because the base never changes.',
    relatedSkills: ['P010'],
  },
];

const byTag = new Map(misconceptions.map((m) => [m.tag, m]));

export function getMisconception(tag) {
  return byTag.get(tag) || null;
}

export function getMisconceptionsForSkill(skillId) {
  return misconceptions.filter((m) => m.relatedSkills.includes(skillId));
}

export function getAllMisconceptions() {
  return [...misconceptions];
}

export function getRemediationForTag(tag) {
  const m = byTag.get(tag);
  if (!m) return null;
  return {
    tag: m.tag,
    explanation: m.remediationExplanation,
    visualScaffold: m.visualScaffold,
    recheckPattern: m.recheckPattern,
    parentNote: m.parentNote,
  };
}

export const percentageMisconceptionMap = misconceptions;
export default percentageMisconceptionMap;
