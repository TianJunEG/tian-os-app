// singapore-s1.js — Singapore Secondary 1, lower-secondary mathematics.
//
// Mapped to the MOE "O-/G3-Level Mathematics" lower-secondary content (Number & Algebra,
// Geometry & Measurement, Statistics & Probability). Single-answer fluency components only;
// heuristic/word-problem strategy and proof belong to MathThink (see SKILL.md scope note).
// `code`/`objective` paraphrase the syllabus strands.

export default {
  id: 'sg-s1',
  country: 'Singapore',
  framework: 'MOE Secondary Mathematics Syllabus (Lower Secondary)',
  label: 'Singapore · Secondary 1',
  source: 'https://www.moe.gov.sg/secondary/courses/express/subjects',
  groups: [
    { id: 'num', name: 'Numbers', subtitle: 'Integers, factors, powers & roots' },
    { id: 'alg', name: 'Algebra', subtitle: 'Expressions & linear equations' },
    { id: 'ratio', name: 'Ratio & Proportion', subtitle: 'Ratio, rate & direct proportion' },
    { id: 'pct', name: 'Percentage', subtitle: 'Change, reverse & applications' },
    { id: 'mens', name: 'Mensuration', subtitle: 'Area & volume' },
    { id: 'stat', name: 'Statistics', subtitle: 'Mean, median & mode' },
  ],
  skills: [
    // --- Numbers ---
    { id: 'sg-s1-int-as', group: 'num', code: 'N1.1', name: 'Add & subtract integers',
      objective: 'the four operations on integers — addition and subtraction of negative numbers',
      example: '−7 + 3 = −4', timeTarget: 10,
      hint: 'On the number line, + moves right and − moves left. Subtracting a negative moves right.',
      spec: { kind: 'integerAddSub' } },

    { id: 'sg-s1-int-md', group: 'num', code: 'N1.1', name: 'Multiply & divide integers',
      objective: 'the four operations on integers — multiplication and division of negative numbers',
      example: '(−6) × 4 = −24', timeTarget: 10,
      hint: 'Same signs → positive; different signs → negative.',
      spec: { kind: 'integerMulDiv' } },

    { id: 'sg-s1-hcf', group: 'num', code: 'N1.2', name: 'Highest common factor (HCF)',
      objective: 'common factors and the highest common factor of two numbers',
      example: 'HCF of 24 and 36 → 12', timeTarget: 16,
      hint: 'Find the factors common to both numbers and take the largest.',
      spec: { kind: 'hcf' } },

    { id: 'sg-s1-lcm', group: 'num', code: 'N1.2', name: 'Lowest common multiple (LCM)',
      objective: 'common multiples and the lowest common multiple of two numbers',
      example: 'LCM of 4 and 6 → 12', timeTarget: 14,
      hint: 'List multiples of each and take the smallest they share.',
      spec: { kind: 'lcm' } },

    { id: 'sg-s1-powers', group: 'num', code: 'N1.3', name: 'Squares, cubes & powers',
      objective: 'evaluating positive integer powers of whole numbers',
      example: '3⁴ = 81', timeTarget: 12,
      hint: 'A power means repeated multiplication: 3⁴ = 3 × 3 × 3 × 3.',
      spec: { kind: 'indexEval' } },

    { id: 'sg-s1-roots', group: 'num', code: 'N1.3', name: 'Square & cube roots',
      objective: 'square roots and cube roots of perfect squares/cubes',
      example: '√196 = 14', timeTarget: 12,
      hint: '√n asks "what number times itself gives n?"',
      spec: { kind: 'rootEval' } },

    { id: 'sg-s1-round', group: 'num', code: 'N1.4', name: 'Approximation & rounding',
      objective: 'approximation and estimation — rounding to a required place',
      example: 'Round 3847 to the nearest 100 → 3800', timeTarget: 12,
      hint: 'Look at the digit after the place you are rounding to: 5 or more rounds up.',
      spec: { kind: 'roundInt', unitSet: [10, 100, 1000], range: [120, 9899] } },

    // --- Algebra ---
    { id: 'sg-s1-alg-simplify', group: 'alg', code: 'A1.1', name: 'Simplify linear expressions',
      objective: 'simplifying linear expressions by collecting like terms',
      example: '5a + 3a − 2a = 6a', timeTarget: 14,
      hint: 'Combine the number parts of the like terms.',
      spec: { kind: 'algSimplify' } },

    { id: 'sg-s1-alg-expand', group: 'alg', code: 'A1.2', name: 'Expand a single bracket',
      objective: 'expansion of a single bracket: a(bx + c)',
      example: 'Expand 3(2x + 4): coefficient of x → 6', timeTarget: 16,
      hint: 'Multiply the term outside the bracket by each term inside.',
      spec: { kind: 'expandCoeff' } },

    { id: 'sg-s1-alg-factor', group: 'alg', code: 'A1.2', name: 'Factorise (common factor)',
      objective: 'factorisation by extracting a common factor',
      example: 'Factorise 12x + 18 → 6(2x + 3)', timeTarget: 18,
      hint: 'Find the highest common factor of the number parts; that goes outside.',
      spec: { kind: 'factorHcf' } },

    { id: 'sg-s1-alg-eval', group: 'alg', code: 'A1.3', name: 'Evaluate by substitution',
      objective: 'evaluating algebraic expressions by substitution',
      example: 'If x = 5, 3x + 2 = 17', timeTarget: 14,
      hint: 'Replace the letter with its value, then compute.',
      spec: { kind: 'algEval' } },

    { id: 'sg-s1-alg-solve', group: 'alg', code: 'A1.4', name: 'Solve linear equations',
      objective: 'solving linear equations in one variable',
      example: 'Solve 3x + 2 = 14 → x = 4', timeTarget: 18,
      hint: 'Undo the +/− first, then divide by the coefficient.',
      spec: { kind: 'algSolve' } },

    { id: 'sg-s1-alg-solve2', group: 'alg', code: 'A1.4', name: 'Equations with x on both sides',
      objective: 'solving linear equations with the variable on both sides',
      example: 'Solve 5x + 2 = 2x + 14 → x = 4', timeTarget: 22,
      hint: 'Collect the letters on one side and the numbers on the other.',
      spec: { kind: 'solveLinear2' } },

    // --- Ratio & proportion ---
    { id: 'sg-s1-ratio-missing', group: 'ratio', code: 'A2.1', name: 'Equivalent ratios',
      objective: 'finding a missing term in equivalent ratios',
      example: '2 : 3 = 8 : ? → 12', timeTarget: 14,
      hint: 'Find the multiplier of the known pair, then apply it.',
      spec: { kind: 'ratioMissing' } },

    { id: 'sg-s1-ratio-divide', group: 'ratio', code: 'A2.1', name: 'Divide a quantity in a ratio',
      objective: 'dividing a quantity in a given ratio',
      example: 'Divide $100 in 2 : 3 → first share $40', timeTarget: 20,
      hint: 'Add the parts to get the units, find one unit, then multiply.',
      spec: { kind: 'ratioDivide' } },

    { id: 'sg-s1-proportion', group: 'ratio', code: 'A2.2', name: 'Direct proportion',
      objective: 'problems involving direct proportion',
      example: '5 items cost $15 → 8 items cost $24', timeTarget: 18,
      hint: 'Find the cost of one item, then multiply by the new quantity.',
      spec: { kind: 'proportionDirect' } },

    { id: 'sg-s1-rate', group: 'ratio', code: 'A2.3', name: 'Rate, speed & time',
      objective: 'rate as a comparison; speed, distance and time',
      example: '60 km/h for 3 h → 180 km', timeTarget: 18,
      hint: 'Distance = speed × time; rearrange to find the unknown.',
      spec: { kind: 'rate' } },

    // --- Percentage ---
    { id: 'sg-s1-pct-of', group: 'pct', code: 'A3.1', name: 'Percentage of a quantity',
      objective: 'expressing one quantity as a percentage of another; percentage of a quantity',
      example: '20% of 80 → 16', timeTarget: 14,
      hint: 'Convert the percent to a fraction over 100, then multiply.',
      spec: { kind: 'percentOf' } },

    { id: 'sg-s1-pct-change', group: 'pct', code: 'A3.2', name: 'Percentage increase/decrease',
      objective: 'percentage increase and decrease',
      example: '$80 → $100 is a 25% increase', timeTarget: 22,
      hint: 'Percentage change = (change ÷ original) × 100.',
      spec: { kind: 'percentChange' } },

    { id: 'sg-s1-pct-reverse', group: 'pct', code: 'A3.3', name: 'Reverse percentage',
      objective: 'finding the whole given a part and its percentage',
      example: '20% of a number is 30 → 150', timeTarget: 22,
      hint: 'Find what 1% is (part ÷ percentage), then multiply by 100.',
      spec: { kind: 'percentWhole' } },

    { id: 'sg-s1-pct-app', group: 'pct', code: 'A3.4', name: 'Discount, GST & interest',
      objective: 'percentage in real-world contexts: discount, GST, simple interest',
      example: '20% discount on $250 → $50', timeTarget: 22,
      hint: 'Work out the percentage of the price.',
      spec: { kind: 'percentApp' } },

    // --- Mensuration ---
    { id: 'sg-s1-area-rect', group: 'mens', code: 'G1.1', name: 'Area of a rectangle',
      objective: 'area of rectangles and squares',
      example: '8 × 5 → 40 cm²', timeTarget: 14,
      hint: 'Area of a rectangle = length × width.',
      spec: { kind: 'rectArea' } },

    { id: 'sg-s1-area-tri', group: 'mens', code: 'G1.1', name: 'Area of a triangle',
      objective: 'area of a triangle',
      example: 'base 8, height 5 → 20 cm²', timeTarget: 16,
      hint: 'Area of a triangle = ½ × base × height.',
      spec: { kind: 'triArea' } },

    { id: 'sg-s1-vol-cuboid', group: 'mens', code: 'G1.2', name: 'Volume of a cuboid',
      objective: 'volume of cubes and cuboids',
      example: '3 × 4 × 5 → 60 cm³', timeTarget: 16,
      hint: 'Volume of a cuboid = length × breadth × height.',
      spec: { kind: 'cuboidVolume' } },

    // --- Statistics ---
    { id: 'sg-s1-mean', group: 'stat', code: 'S1.1', name: 'Mean of a data set',
      objective: 'mean as total ÷ number of data',
      example: 'Mean of 4, 8, 6 → 6', timeTarget: 18,
      hint: 'Mean = total ÷ how many values.',
      spec: { kind: 'average' } },

    { id: 'sg-s1-median', group: 'stat', code: 'S1.1', name: 'Median of a data set',
      objective: 'median as the middle value of ordered data',
      example: 'Median of 7, 2, 5 → 5', timeTarget: 18,
      hint: 'Sort the numbers, then take the middle one.',
      spec: { kind: 'median' } },

    { id: 'sg-s1-mode', group: 'stat', code: 'S1.1', name: 'Mode of a data set',
      objective: 'mode as the most frequent value',
      example: 'Mode of 4, 4, 4, 2, 7 → 4', timeTarget: 16,
      hint: 'The mode is the value that appears most often.',
      spec: { kind: 'mode' } },
  ],

  pending: [
    'Number: standard form (moved to S2), estimation of irrational values',
    'Algebra: word problems via the model/heuristic method (MathThink)',
    'Geometry: angle properties, construction & loci, congruence (need figure/construction items)',
    'Statistics: data displays — dot/stem-and-leaf, histograms (need chart items)',
  ],
};
