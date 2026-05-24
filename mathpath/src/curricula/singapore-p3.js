// singapore-p3.js — Singapore Primary 3, Number and Algebra + Fractions strands.
//
// Mapped to the official "2021 Primary Mathematics Syllabus (P1–P6)", MOE Singapore
// (updated Oct 2025). `code`/`objective` are taken from the syllabus verbatim.
// Single-integer-answer objectives are implemented; objectives needing richer item types
// (simplest-form/unlike fractions, money, measurement, area, geometry, charts, word problems)
// are listed in `pending`.

export default {
  id: 'sg-p3',
  country: 'Singapore',
  framework: 'MOE 2021 Primary Mathematics Syllabus (updated Oct 2025)',
  label: 'Singapore · Primary 3',
  source: 'https://www.moe.gov.sg/primary/curriculum/syllabus',
  groups: [
    { id: 'wn', name: 'Whole Numbers', subtitle: 'Numbers up to 10 000' },
    { id: 'as', name: 'Addition & Subtraction', subtitle: 'Algorithms up to 4 digits' },
    { id: 'md', name: 'Multiplication & Division', subtitle: 'Tables 6–9; up to 3-digit by 1-digit' },
    { id: 'fr', name: 'Fractions', subtitle: 'Equivalent & related fractions' },
    { id: 'mg', name: 'Area & Perimeter', subtitle: 'Rectangle & square' },
    { id: 'wp', name: 'Word Problems', subtitle: 'Model method (bar models)' },
    { id: 'meas', name: 'Measurement', subtitle: 'Compound units & time' },
    { id: 'money', name: 'Money', subtitle: 'Add, subtract & change' },
    { id: 'stat', name: 'Statistics', subtitle: 'Bar graphs' },
  ],
  skills: [
    // --- Whole Numbers ---
    { id: 'sg-p3-pv', group: 'wn', code: 'WN 1.2', name: 'Place value (thousands→ones)',
      objective: 'number notation, representations and place values (thousands, hundreds, tens, ones)',
      example: '3 thousands, 4 hundreds, 0 tens and 5 ones = 3405', timeTarget: 14,
      hint: 'Thousands → ×1000, hundreds → ×100, tens → ×10, then add the ones.',
      spec: { kind: 'placeValue', thousands: true } },

    { id: 'sg-p3-compare', group: 'wn', code: 'WN 1.4', name: 'Comparing & ordering numbers',
      objective: 'comparing and ordering numbers',
      example: 'Which is greater: 3471 or 3417? → 3471', timeTarget: 10,
      hint: 'Compare from the largest place value down: thousands, then hundreds, then tens, then ones.',
      spec: { kind: 'compare', range: [3, 9999], pick: 'greater' } },

    { id: 'sg-p3-pattern', group: 'wn', code: 'WN 1.5', name: 'Number patterns (hundreds/thousands)',
      objective: 'patterns in number sequences',
      example: '1500, 1750, 2000, 2250, ? → 2500', timeTarget: 14,
      hint: 'Find the constant jump between terms, then add it once more.',
      spec: { kind: 'pattern', startRange: [200, 2000], stepRange: [25, 250], len: 4 } },

    // --- Addition and Subtraction ---
    { id: 'sg-p3-mental-add', group: 'as', code: 'WN 2.2', name: 'Mental addition (two 2-digit)',
      objective: 'mental calculation involving addition … of two 2-digit numbers',
      example: '47 + 38 = 85', timeTarget: 12,
      hint: 'Add tens to tens and ones to ones, then combine.',
      spec: { kind: 'add', aRange: [11, 89], bRange: [11, 89] } },

    { id: 'sg-p3-mental-sub', group: 'as', code: 'WN 2.2', name: 'Mental subtraction (two 2-digit)',
      objective: 'mental calculation involving … subtraction of two 2-digit numbers',
      example: '83 − 47 = 36', timeTarget: 13,
      hint: 'Subtract the tens, then adjust for the ones.',
      spec: { kind: 'sub', aRange: [20, 99], bRange: [11, 89] } },

    { id: 'sg-p3-add4', group: 'as', code: 'WN 2.1', name: 'Addition within 10 000',
      objective: 'addition and subtraction algorithms (up to 4 digits)',
      example: '3486 + 2057 = 5543', timeTarget: 24,
      hint: 'Line up the digits and add column by column, carrying when a column reaches 10.',
      spec: { kind: 'add', aRange: [1000, 8000], bRange: [1000, 8000], maxSum: 9999 } },

    { id: 'sg-p3-sub4', group: 'as', code: 'WN 2.1', name: 'Subtraction within 10 000',
      objective: 'addition and subtraction algorithms (up to 4 digits)',
      example: '7204 − 3568 = 3636', timeTarget: 26,
      hint: 'Subtract column by column, borrowing from the next place when needed.',
      spec: { kind: 'sub', aRange: [3000, 9999], bRange: [1000, 6000] } },

    // --- Multiplication and Division ---
    { id: 'sg-p3-tables-mul', group: 'md', code: 'MD 3.1 / 3.2', name: 'Multiplication tables (6,7,8,9)',
      objective: 'multiplication tables of 6, 7, 8 and 9; multiplying within the tables',
      example: '7 × 8 = 56', timeTarget: 11,
      hint: 'Recall the table fact for 6, 7, 8 or 9.',
      spec: { kind: 'mul', aSet: [6, 7, 8, 9], bRange: [1, 10], maxProduct: 90 } },

    { id: 'sg-p3-tables-div', group: 'md', code: 'MD 3.2', name: 'Dividing within the tables',
      objective: 'multiplying and dividing within the multiplication tables',
      example: '56 ÷ 8 = 7', timeTarget: 12,
      hint: 'Which 6/7/8/9 table fact makes this number?',
      spec: { kind: 'div', divisorSet: [6, 7, 8, 9], quotientRange: [1, 10], maxDividend: 90 } },

    { id: 'sg-p3-div-remainder', group: 'md', code: 'MD 3.3', name: 'Division with remainder',
      objective: 'division with remainder',
      example: 'Find the remainder: 29 ÷ 4 → 1', timeTarget: 14,
      hint: 'How many whole groups fit, and how many are left over? The leftover is the remainder.',
      spec: { kind: 'divRemainder', divisorRange: [3, 9], quotientRange: [2, 12] } },

    { id: 'sg-p3-mul3by1', group: 'md', code: 'MD 3.4', name: 'Multiply up to 3-digit by 1-digit',
      objective: 'multiplication … algorithms (up to 3 digits by 1 digit)',
      example: '243 × 6 = 1458', timeTarget: 22,
      hint: 'Multiply each digit by the 1-digit number, carrying as you go.',
      spec: { kind: 'mul', aRange: [13, 399], bRange: [2, 9] } },

    { id: 'sg-p3-div3by1', group: 'md', code: 'MD 3.4', name: 'Divide up to 3-digit by 1-digit',
      objective: 'division … algorithms (up to 3 digits by 1 digit)',
      example: '486 ÷ 6 = 81', timeTarget: 24,
      hint: 'Use long/short division, working from the largest place value down.',
      spec: { kind: 'div', divisorRange: [2, 9], quotientRange: [11, 150], maxDividend: 999 } },

    // --- Fractions ---
    { id: 'sg-p3-frac-equiv', group: 'fr', code: 'Fr 1.1 / 1.4', name: 'Equivalent fractions',
      objective: 'equivalent fractions; writing the equivalent fraction given the denominator or numerator',
      example: '1/2 = ?/6 → 3', timeTarget: 14,
      hint: 'Whatever you multiply the bottom by, multiply the top by the same number.',
      spec: { kind: 'fractionEquiv', baseDenomRange: [2, 6], scaleRange: [2, 4], maxDenom: 12 } },

    { id: 'sg-p3-frac-related', group: 'fr', code: 'Fr 2.1', name: 'Add & subtract related fractions',
      objective: 'adding and subtracting two related fractions within one whole (denominators not exceeding 12)',
      example: '1/2 + 1/4 = ?/4 → 3', timeTarget: 18,
      hint: 'Rename the fraction with the smaller denominator so both share the larger one, then add/subtract the tops.',
      spec: { kind: 'fractionRelated', maxDenom: 12 } },

    // --- Area & Perimeter (with diagram) ---
    { id: 'sg-p3-rect-area', group: 'mg', code: 'AP 1.4', name: 'Area of a rectangle',
      objective: 'area of rectangle/square',
      example: 'A 8 cm × 5 cm rectangle has area 40 cm²', timeTarget: 14,
      hint: 'Area of a rectangle = length × width.',
      spec: { kind: 'rectArea' } },

    { id: 'sg-p3-rect-perimeter', group: 'mg', code: 'AP 1.3', name: 'Perimeter of a rectangle',
      objective: 'perimeter of rectangle/square',
      example: 'A 8 cm × 5 cm rectangle has perimeter 26 cm', timeTarget: 14,
      hint: 'Perimeter = 2 × (length + width) — add up all four sides.',
      spec: { kind: 'rectPerimeter' } },

    // --- Word problems (bar model diagram + worded prompt) ---
    { id: 'sg-p3-wp-share', group: 'wp', code: 'WP ÷', name: 'Word problem: sharing equally',
      objective: 'divide into equal parts using the model method',
      example: '48 shared among 6 → 8 each', timeTarget: 36,
      hint: 'The whole is split into equal bars — divide by the number of bars.',
      spec: { kind: 'barModel', structure: 'unitsEach', nMax: 8, eachMax: 12 } },

    { id: 'sg-p3-wp-twostep', group: 'wp', code: 'WP 2-step', name: 'Two-step word problem',
      objective: 'solve a 2-step word problem using the model method',
      example: '$650 − $180 − $240 → $230 left', timeTarget: 50,
      hint: 'The whole bar is split into the parts spent and the part left over.',
      spec: { kind: 'barModel', structure: 'twoStepRemain', min: 30, max: 320 } },

    // --- Measurement ---
    { id: 'sg-p3-compound', group: 'meas', code: 'ME 1.3', name: 'Compound units → smaller unit',
      objective: 'converting a measurement in compound units to the smaller unit',
      example: '2 m 30 cm = 230 cm', timeTarget: 16,
      hint: 'Convert the big unit (×100 or ×1000), then add on the small unit.',
      spec: { kind: 'compoundToUnit' } },

    { id: 'sg-p3-duration', group: 'meas', code: 'ME 2.2', name: 'Time: finding a duration',
      objective: 'finding the duration given the starting and finishing times',
      example: '09:15 → 10:50 is 95 minutes', timeTarget: 22,
      hint: 'Count on from the start to the next hour, then on to the finish.',
      spec: { kind: 'duration' } },

    { id: 'sg-p3-clock', group: 'meas', code: 'ME 2.1', name: 'Telling time (to the minute)',
      objective: 'telling and writing time to the minute',
      example: 'hands at 10 and 37 → 10:37', timeTarget: 18,
      hint: 'Read the hour from the short hand, then the exact minutes from the long hand.',
      spec: { kind: 'clockRead', gran: 1 } },

    // --- Money ---
    { id: 'sg-p3-money-addsub', group: 'money', code: 'Money 1.1', name: 'Adding & subtracting money',
      objective: 'adding and subtracting money in decimal notation',
      example: '$12.45 + $3.70 = $16.15', timeTarget: 22,
      hint: 'Line up the decimal points and work in dollars and cents.',
      spec: { kind: 'moneyAddSub' } },

    { id: 'sg-p3-money-change', group: 'money', code: 'Money 1.1', name: 'Making change',
      objective: 'finding change in a money word problem',
      example: '$6.40 paid with $10 → $3.60', timeTarget: 24,
      hint: 'Change = amount paid − cost. Count up from the cost to the note.',
      spec: { kind: 'moneyChange' } },

    // --- Statistics (bar graph diagram) ---
    { id: 'sg-p3-stat', group: 'stat', code: 'Stat 1.1/1.2', name: 'Reading a bar graph',
      objective: 'reading and interpreting data from bar graphs, with different scales',
      example: 'Red 15, Blue 10 → 5 more red', timeTarget: 24,
      hint: 'Read each bar against the scale on the axis, then compare or total.',
      spec: { kind: 'barChart', mode: 'bar' } },

    { id: 'sg-p3-stat-most', group: 'stat', code: 'Stat 1.1', name: 'Most & least on a bar graph',
      objective: 'interpreting a bar graph to find the greatest/smallest category',
      example: 'which day had the most?', timeTarget: 18,
      hint: 'The tallest bar is the most; the shortest bar is the least.',
      spec: { kind: 'chartCategory', mode: 'bar' } },
  ],

  // In the P3 syllabus but needing item types beyond a single-integer answer.
  pending: [
    'WN 1.1 counting in hundreds/thousands (needs pictorial item)',
    'WN 1.3 reading & writing numbers in words (needs text item)',
    'Fractions 1.2 simplest form, 1.3 comparing/ordering unlike fractions (needs fraction item)',
    'Money: multi-step money word problems (adding, subtracting & making change now drillable)',
    'Measurement: the 24-hour clock (telling time to the minute, durations & conversions now drillable)',
    'Area & Perimeter of rectilinear/composite figures (rectangle & square now drillable with diagrams)',
    'Geometry: angles, perpendicular & parallel lines (needs geometry item)',
    'Multi-step (3+ step) word problems (single- and two-step bar models now drillable)',
  ],
};
