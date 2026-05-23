// singapore-p5.js — Singapore Primary 5, Number and Algebra strand (Whole Numbers /
// Four Operations, Fractions, Decimals, Percentage, Rate).
//
// Mapped to the official "2021 Primary Mathematics Syllabus (P1–P6)", MOE Singapore
// (updated Oct 2025). `code`/`objective` are taken from the syllabus verbatim.
// Percentage/rate answers are whole numbers; decimal skills grade as decimals.
// Measurement & Geometry (area of triangle, volume of cube/cuboid, angles), Statistics,
// and word problems are listed in `pending`.

export default {
  id: 'sg-p5',
  country: 'Singapore',
  framework: 'MOE 2021 Primary Mathematics Syllabus (updated Oct 2025)',
  label: 'Singapore · Primary 5',
  source: 'https://www.moe.gov.sg/primary/curriculum/syllabus',
  groups: [
    { id: 'wn', name: 'Four Operations', subtitle: 'Order of operations, brackets, ×÷ by powers of 10' },
    { id: 'fr', name: 'Fractions', subtitle: 'Mixed numbers & multiplying fractions' },
    { id: 'dec', name: 'Decimals', subtitle: 'Powers of 10 & metric conversion' },
    { id: 'pct', name: 'Percentage', subtitle: 'Part of a whole, discount, GST, interest' },
    { id: 'rate', name: 'Rate', subtitle: 'Rate, total and units' },
  ],
  skills: [
    // --- Whole Numbers / Four Operations ---
    { id: 'sg-p5-pow10', group: 'wn', code: 'FO 2.1', name: 'Multiply/divide by 10, 100, 1000',
      objective: 'multiplying and dividing by 10, 100, 1000 and their multiples without calculator',
      example: '47 × 1000 = 47000', timeTarget: 11,
      hint: 'Each ×10 shifts digits one place left; each ÷10 shifts them one place right.',
      spec: { kind: 'mulDivPow10' } },

    { id: 'sg-p5-order', group: 'wn', code: 'FO 2.2', name: 'Order of operations',
      objective: 'order of operations without calculator',
      example: '3 + 4 × 5 = 23', timeTarget: 16,
      hint: 'Do multiplication and division before addition and subtraction.',
      spec: { kind: 'orderOps' } },

    { id: 'sg-p5-brackets', group: 'wn', code: 'FO 2.3', name: 'Use of brackets',
      objective: 'use of brackets without calculator',
      example: '(3 + 4) × 5 = 35', timeTarget: 18,
      hint: 'Work out whatever is inside the brackets first.',
      spec: { kind: 'orderOps', brackets: true } },

    // --- Fractions ---
    { id: 'sg-p5-frac-decimal', group: 'fr', code: 'Fr 1.2', name: 'Express fractions as decimals',
      objective: 'expressing fractions as decimals',
      example: '5/8 = 0.625', timeTarget: 16,
      hint: 'Rename with denominator 10, 100 or 1000 — or just divide the top by the bottom.',
      spec: { kind: 'fracToDecimal', denomSet: [2, 4, 5, 8, 10, 20, 25, 40, 50, 100, 125] } },

    { id: 'sg-p5-frac-mixed', group: 'fr', code: 'Fr 2.1', name: 'Add & subtract mixed numbers',
      objective: 'adding and subtracting mixed numbers',
      example: '1 1/2 + 2 1/3 = ?/6 → 23', timeTarget: 26,
      hint: 'Put both over a common denominator (count the wholes too), then add/subtract.',
      spec: { kind: 'mixedAddSub', maxDenom: 12 } },

    { id: 'sg-p5-frac-times-whole', group: 'fr', code: 'Fr 2.2 / 2.5', name: 'Multiply a fraction by a whole number',
      objective: 'multiplying a proper/improper fraction (or mixed number) and a whole number',
      example: '3/4 × 8 = 6', timeTarget: 18,
      hint: 'Multiply the top by the whole number, then divide by the bottom.',
      spec: { kind: 'fracTimesWhole' } },

    { id: 'sg-p5-frac-times-frac', group: 'fr', code: 'Fr 2.3 / 2.4', name: 'Multiply two fractions',
      objective: 'multiplying a proper/improper fraction and a proper/improper fraction',
      example: '2/3 × 3/5 = ?/15 → 6', timeTarget: 16,
      hint: 'Multiply the tops together and the bottoms together.',
      spec: { kind: 'fracTimesFrac' } },

    // --- Decimals (graded as decimals) ---
    { id: 'sg-p5-dec-pow10', group: 'dec', code: 'Dec 1.1', name: 'Decimals × ÷ by powers of 10',
      objective: 'multiplying and dividing decimals (up to 3 dp) by 10, 100, 1000 and their multiples',
      example: '0.45 × 100 = 45', timeTarget: 14,
      hint: 'Shift the decimal point right for ×10s and left for ÷10s.',
      spec: { kind: 'decMulDivPow10' } },

    { id: 'sg-p5-dec-convert', group: 'dec', code: 'Dec 1.2', name: 'Metric conversion (decimals)',
      objective: 'converting a measurement from a smaller unit to a larger unit in decimal form, and vice versa',
      example: '2500 m = ? km → 2.5', timeTarget: 16,
      hint: '1 km = 1000 m, 1 m = 100 cm, 1 kg = 1000 g, 1 l = 1000 ml.',
      spec: { kind: 'unitConvert' } },

    // --- Percentage ---
    { id: 'sg-p5-pct-part', group: 'pct', code: 'Pct 1.1', name: 'Part of a whole as a percentage',
      objective: 'expressing a part of a whole as a percentage',
      example: '15 out of 50 = 30%', timeTarget: 16,
      hint: 'Make the fraction part/whole, then rename it with denominator 100.',
      spec: { kind: 'partAsPercent' } },

    { id: 'sg-p5-pct-of', group: 'pct', code: 'Pct 1.3', name: 'Percentage of a whole',
      objective: 'finding a percentage part of a whole',
      example: '20% of 80 = 16', timeTarget: 14,
      hint: '1% is the whole ÷ 100; multiply that by the percentage.',
      spec: { kind: 'percentOf' } },

    { id: 'sg-p5-pct-app', group: 'pct', code: 'Pct 1.4', name: 'Discount, GST & interest',
      objective: 'finding discount, GST and annual interest',
      example: 'A $250 item, 20% discount → $50', timeTarget: 22,
      hint: 'These are all "find the percentage of the amount" in disguise.',
      spec: { kind: 'percentApp' } },

    // --- Rate ---
    { id: 'sg-p5-rate', group: 'rate', code: 'Rate 1.2', name: 'Rate, total & units',
      objective: 'finding rate, total amount or number of units given the other two quantities',
      example: '240 km in 4 h → 60 km/h', timeTarget: 20,
      hint: 'rate = total ÷ units; total = rate × units; units = total ÷ rate.',
      spec: { kind: 'rate' } },
  ],

  // In the P5 syllabus but needing item types beyond a single number answer.
  pending: [
    'WN 1.1 reading & writing numbers up to 10 million in words (needs text item)',
    'Fr 1.1 dividing a whole number by a whole number with quotient as a fraction (needs fraction answer)',
    'Measurement & Geometry: area of a triangle, volume of cube/cuboid (drillable as integers — easy future add)',
    'Geometry: angles on a line / at a point / vertically opposite, triangle & quadrilateral angle facts',
    'Statistics: average of a set of data (P5 Statistics — drillable as an integer, future add)',
    'Multi-step & ratio/algebra-readiness word problems (needs word-problem / bar-model item)',
  ],
};
