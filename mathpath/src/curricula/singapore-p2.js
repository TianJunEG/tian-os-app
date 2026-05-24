// singapore-p2.js — Singapore Primary 2, Number and Algebra + Fractions strands.
//
// Mapped to the official "2021 Primary Mathematics Syllabus (P1–P6)", MOE Singapore
// (updated Oct 2025). `code`/`objective` are taken from the syllabus verbatim.
// Single-integer-answer objectives are implemented; objectives needing richer item types
// (fraction-of-a-whole, money, measurement, geometry, charts, word problems) are in `pending`.

export default {
  id: 'sg-p2',
  country: 'Singapore',
  framework: 'MOE 2021 Primary Mathematics Syllabus (updated Oct 2025)',
  label: 'Singapore · Primary 2',
  source: 'https://www.moe.gov.sg/primary/curriculum/syllabus',
  groups: [
    { id: 'wn', name: 'Whole Numbers', subtitle: 'Numbers up to 1000' },
    { id: 'as', name: 'Addition & Subtraction', subtitle: 'Algorithms up to 3 digits' },
    { id: 'md', name: 'Multiplication & Division', subtitle: 'Tables of 2, 3, 4, 5 and 10' },
    { id: 'fr', name: 'Fractions', subtitle: 'Like fractions within one whole' },
    { id: 'wp', name: 'Word Problems', subtitle: 'Model method (bar models)' },
    { id: 'money', name: 'Money', subtitle: 'Dollars & cents' },
    { id: 'stat', name: 'Statistics', subtitle: 'Picture graphs' },
  ],
  skills: [
    // --- Whole Numbers ---
    { id: 'sg-p2-pv', group: 'wn', code: 'WN 1.2', name: 'Place value (hundreds, tens, ones)',
      objective: 'number notation, representations and place values (hundreds, tens, ones)',
      example: '2 hundreds, 3 tens and 4 ones = 234', timeTarget: 12,
      hint: 'Hundreds count groups of 100, tens count groups of 10, then add the ones.',
      spec: { kind: 'placeValue', hundreds: true } },

    { id: 'sg-p2-compare', group: 'wn', code: 'WN 1.4', name: 'Comparing & ordering numbers',
      objective: 'comparing and ordering numbers',
      example: 'Which is greater: 347 or 374? → 374', timeTarget: 9,
      hint: 'Compare hundreds first, then tens, then ones.',
      spec: { kind: 'compare', range: [3, 999], pick: 'greater' } },

    { id: 'sg-p2-parity', group: 'wn', code: 'WN 1.6', name: 'Odd & even numbers',
      objective: 'odd and even numbers',
      example: 'Next even number after 23 → 24', timeTarget: 8,
      hint: 'Even numbers end in 0, 2, 4, 6 or 8; odd numbers end in 1, 3, 5, 7 or 9.',
      spec: { kind: 'parity', which: 'either', range: [10, 99] } },

    { id: 'sg-p2-pattern', group: 'wn', code: 'WN 1.5', name: 'Number patterns (tens/hundreds)',
      objective: 'patterns in number sequences',
      example: '150, 200, 250, 300, ? → 350', timeTarget: 13,
      hint: 'Find the jump between terms, then add it once more.',
      spec: { kind: 'pattern', startRange: [50, 400], stepRange: [10, 50], len: 4 } },

    // --- Addition and Subtraction ---
    { id: 'sg-p2-mental-add', group: 'as', code: 'WN 2.2', name: '3-digit + ones/tens/hundreds (mental)',
      objective: 'mental calculation … of a 3-digit number and ones/tens/hundreds',
      example: '340 + 50 = 390', timeTarget: 14,
      hint: 'Add to just one place value — only that digit changes (unless it spills over).',
      spec: { kind: 'add', aRange: [110, 880], bRange: [1, 9], bMultipleSet: [1, 10, 100], maxSum: 999 } },

    { id: 'sg-p2-mental-sub', group: 'as', code: 'WN 2.2', name: '3-digit − ones/tens/hundreds (mental)',
      objective: 'mental calculation … of a 3-digit number and ones/tens/hundreds',
      example: '470 − 200 = 270', timeTarget: 15,
      hint: 'Subtract from just one place value — only that digit changes (unless you must borrow).',
      spec: { kind: 'sub', aRange: [120, 990], bRange: [1, 9], bMultipleSet: [1, 10, 100] } },

    { id: 'sg-p2-add1000', group: 'as', code: 'WN 2.1', name: 'Addition within 1000 (algorithm)',
      objective: 'addition and subtraction algorithms (up to 3 digits)',
      example: '248 + 367 = 615', timeTarget: 20,
      hint: 'Add ones, then tens, then hundreds — carry when a column reaches 10.',
      spec: { kind: 'add', aRange: [100, 800], bRange: [100, 800], maxSum: 999 } },

    { id: 'sg-p2-sub1000', group: 'as', code: 'WN 2.1', name: 'Subtraction within 1000 (algorithm)',
      objective: 'addition and subtraction algorithms (up to 3 digits)',
      example: '712 − 348 = 364', timeTarget: 22,
      hint: 'Subtract ones, then tens, then hundreds — borrow when the top digit is too small.',
      spec: { kind: 'sub', aRange: [300, 999], bRange: [101, 700] } },

    // --- Multiplication and Division ---
    { id: 'sg-p2-tables-mul', group: 'md', code: 'MD 3.1 / 3.4', name: 'Multiplication tables (2,3,4,5,10)',
      objective: 'multiplication tables of 2, 3, 4, 5 and 10; multiplying within the tables',
      example: '4 × 7 = 28', timeTarget: 10,
      hint: 'Recall the table fact, or skip-count by the first number.',
      spec: { kind: 'mul', aSet: [2, 3, 4, 5, 10], bRange: [1, 10], maxProduct: 100 } },

    { id: 'sg-p2-tables-div', group: 'md', code: 'MD 3.4', name: 'Dividing within the tables',
      objective: 'multiplying and dividing within the multiplication tables',
      example: '28 ÷ 4 = 7', timeTarget: 12,
      hint: 'Ask: which table fact gives this number? That is the missing factor.',
      spec: { kind: 'div', divisorSet: [2, 3, 4, 5, 10], quotientRange: [1, 10], maxDividend: 100 } },

    // --- Fractions ---
    { id: 'sg-p2-frac-likeaddsub', group: 'fr', code: 'Fr 2.1', name: 'Add & subtract like fractions',
      objective: 'adding and subtracting like fractions within one whole with denominators not exceeding 12',
      example: '3/8 + 2/8 = ?/8 → 5', timeTarget: 14,
      hint: 'The denominator stays the same; just add or subtract the top numbers.',
      spec: { kind: 'fractionLike', denomRange: [3, 12] } },

    // --- Word problems (bar model diagram + worded prompt) ---
    { id: 'sg-p2-wp-compare', group: 'wp', code: 'WP +/−', name: 'Word problem: comparing two quantities',
      objective: 'compare two quantities (more/fewer) using the model method',
      example: 'Ben has 8 more than Mei (24) → 32', timeTarget: 38,
      hint: 'Draw two bars one above the other; the longer one is bigger by the difference.',
      spec: { kind: 'barModel', structure: 'compare', min: 5, max: 60, dMin: 3, dMax: 25 } },

    { id: 'sg-p2-wp-units', group: 'wp', code: 'WP ×', name: 'Word problem: equal groups',
      objective: 'multiply equal groups using the model method',
      example: '4 bags × 5 marbles → 20', timeTarget: 34,
      hint: 'Each equal bar is one group — there are as many bars as groups.',
      spec: { kind: 'barModel', structure: 'unitsTotal', nMax: 5, eachMax: 10 } },

    // --- Money ---
    { id: 'sg-p2-money', group: 'money', code: 'Money 1.2/1.4', name: 'Money: dollars & cents',
      objective: 'reading and writing money in decimal notation; converting dollars and cents',
      example: '$4.85 = 485 cents', timeTarget: 14,
      hint: '$1 = 100 cents — multiply dollars by 100, or split cents into dollars and cents.',
      spec: { kind: 'moneyConvert' } },

    { id: 'sg-p2-money-count', group: 'money', code: 'Money 1.1', name: 'Counting notes & coins',
      objective: 'counting an amount of money in dollars and cents (shown as notes and coins)',
      example: '$5 + $2 + 50¢ → $7.50', timeTarget: 24,
      hint: 'Add the notes (in dollars), then the coins (in cents), and combine.',
      spec: { kind: 'moneyCount', withNotes: true } },

    { id: 'sg-p2-money-compare', group: 'money', code: 'Money 1.3', name: 'Comparing amounts of money',
      objective: 'comparing two or three amounts of money',
      example: '$4.50 vs $4.05 → $4.50', timeTarget: 14,
      hint: 'Compare the dollars first, then the cents — line up the decimal points.',
      spec: { kind: 'moneyCompare' } },

    // --- Statistics (picture graph diagram) ---
    { id: 'sg-p2-stat', group: 'stat', code: 'Stat 1.1', name: 'Reading a picture graph',
      objective: 'reading and interpreting data from picture graphs with scales',
      example: '5 icons × 2 each → 10', timeTarget: 22,
      hint: 'Count the icons for a row, then multiply by what each icon stands for.',
      spec: { kind: 'barChart', mode: 'picture' } },
  ],

  // In the P2 syllabus but needing item types beyond a single-integer answer.
  pending: [
    'WN 1.1 counting in tens/hundreds (needs pictorial item)',
    'WN 1.3 reading & writing numbers in words (needs text item)',
    'Fractions 1.1–1.3 fraction of a whole, notation, comparing/ordering fractions (needs fraction/pictorial item)',
    'Money 1.1 counting coins/notes from pictures (notation, conversion & comparing now drillable)',
    'Measurement: length, mass, volume, time (needs measurement items)',
    'Geometry: 2D/3D shapes, lines and curves (needs shape item)',
    'Statistics: naming the most/least category (text answer; reading picture-graph values now drillable)',
    'Multi-step (2–3 step) word problems (single-step bar models now drillable)',
  ],
};
