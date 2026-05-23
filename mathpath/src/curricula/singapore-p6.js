// singapore-p6.js — Singapore Primary 6, Number and Algebra strand (Fractions,
// Percentage, Ratio, Algebra) plus Averages (Statistics: Data Analysis).
//
// Mapped to the official "2021 Primary Mathematics Syllabus (P1–P6)", MOE Singapore
// (updated Oct 2025). `code`/`objective` are taken from the syllabus verbatim.
// All P6 drill items resolve to whole-number answers (algebra introduces letters in the
// prompt, not in the answer). Objectives needing richer item types (ratio in simplest
// form, circle/volume geometry, pie charts, word problems) are listed in `pending`.

export default {
  id: 'sg-p6',
  country: 'Singapore',
  framework: 'MOE 2021 Primary Mathematics Syllabus (updated Oct 2025)',
  label: 'Singapore · Primary 6',
  source: 'https://www.moe.gov.sg/primary/curriculum/syllabus',
  groups: [
    { id: 'fr', name: 'Fractions', subtitle: 'Dividing fractions' },
    { id: 'pct', name: 'Percentage', subtitle: 'Finding the whole; increase/decrease' },
    { id: 'ratio', name: 'Ratio', subtitle: 'Equivalent ratios & sharing' },
    { id: 'alg', name: 'Algebra', subtitle: 'Expressions & simple equations' },
    { id: 'stat', name: 'Averages', subtitle: 'Average of a set of data' },
  ],
  skills: [
    // --- Fractions ---
    { id: 'sg-p6-frac-div-whole', group: 'fr', code: 'Fr 1.1', name: 'Divide a fraction by a whole number',
      objective: 'dividing a proper fraction by a whole number without calculator',
      example: '1/2 ÷ 3 = 1/? → 6', timeTarget: 18,
      hint: 'Dividing by a whole number keeps the top the same and multiplies the bottom.',
      spec: { kind: 'fracDivWhole' } },

    { id: 'sg-p6-frac-div-frac', group: 'fr', code: 'Fr 1.2', name: 'Divide a whole number by a fraction',
      objective: 'dividing a whole number/proper fraction by a proper fraction without calculator',
      example: '6 ÷ 2/3 = 9', timeTarget: 20,
      hint: 'Flip the dividing fraction upside down, then multiply.',
      spec: { kind: 'divByFraction' } },

    // --- Percentage ---
    { id: 'sg-p6-pct-whole', group: 'pct', code: 'Pct 1.1', name: 'Find the whole from a part',
      objective: 'finding the whole given a part and the percentage',
      example: '20% of a number is 30 → 150', timeTarget: 20,
      hint: 'Find what 1% is (divide the part by the percentage), then multiply by 100.',
      spec: { kind: 'percentWhole' } },

    { id: 'sg-p6-pct-change', group: 'pct', code: 'Pct 1.2', name: 'Percentage increase/decrease',
      objective: 'finding percentage increase/decrease',
      example: '$80 → $100 is a 25% increase', timeTarget: 22,
      hint: 'Percentage change = (change ÷ original) × 100.',
      spec: { kind: 'percentChange' } },

    // --- Ratio ---
    { id: 'sg-p6-ratio-missing', group: 'ratio', code: 'Ratio 1.6', name: 'Missing term in equivalent ratios',
      objective: 'finding the missing term in a pair of equivalent ratios',
      example: '2 : 3 = 8 : ? → 12', timeTarget: 14,
      hint: 'Find what the first ratio was multiplied by, then apply it to the other term.',
      spec: { kind: 'ratioMissing' } },

    { id: 'sg-p6-ratio-divide', group: 'ratio', code: 'Ratio 1.3', name: 'Divide a quantity in a ratio',
      objective: 'dividing a quantity in a given ratio',
      example: 'Divide $100 in 2 : 3 → first share $40', timeTarget: 20,
      hint: 'Add the ratio parts to get the number of units, find one unit, then multiply.',
      spec: { kind: 'ratioDivide' } },

    // --- Algebra ---
    { id: 'sg-p6-alg-simplify', group: 'alg', code: 'Alg 1.3', name: 'Simplify a linear expression',
      objective: 'simplifying simple linear expressions excluding brackets',
      example: '5a + 3a − 2a = ?a → 6', timeTarget: 16,
      hint: 'Add and subtract the number parts of the like terms.',
      spec: { kind: 'algSimplify' } },

    { id: 'sg-p6-alg-eval', group: 'alg', code: 'Alg 1.4', name: 'Evaluate by substitution',
      objective: 'evaluating simple linear expressions by substitution',
      example: 'If x = 5, find 3x + 2 → 17', timeTarget: 16,
      hint: 'Replace the letter with its value, then work it out.',
      spec: { kind: 'algEval' } },

    { id: 'sg-p6-alg-solve', group: 'alg', code: 'Alg 1.5', name: 'Solve a simple linear equation',
      objective: 'simple linear equations involving whole number coefficient only',
      example: 'Solve 3x + 2 = 14 → x = 4', timeTarget: 22,
      hint: 'Undo the +/− first, then divide by the number in front of the letter.',
      spec: { kind: 'algSolve' } },

    // --- Averages (Statistics: Data Analysis) ---
    { id: 'sg-p6-average', group: 'stat', code: 'Stat 1.1 / 1.2', name: 'Average of a set of data',
      objective: 'average as "total value ÷ number of data"; relationship between average, total and number of data',
      example: 'Average of 4, 8, 6 → 6', timeTarget: 18,
      hint: 'Average = total ÷ how many; so total = average × how many.',
      spec: { kind: 'average' } },
  ],

  // In the P6 syllabus but needing item types beyond a single number answer.
  pending: [
    'Ratio 1.1/1.2/1.4/1.5/1.7 notation, simplest form, finding a ratio, fraction-ratio link (needs ratio answer a:b)',
    'Algebra 1.1/1.2 letters & expression notation (conceptual — needs expression item)',
    'Measurement & Geometry: area/circumference of circle, semicircle & quarter circle, composite figures',
    'Volume of cube/cuboid: finding a missing dimension given the volume',
    'Geometry: unknown angles in composite figures (square, rectangle, parallelogram, rhombus, trapezium)',
    'Statistics: reading & interpreting tables, line graphs and pie charts (needs chart item)',
    'Multi-step word problems & model (bar) method (needs word-problem / bar-model item)',
  ],
};
