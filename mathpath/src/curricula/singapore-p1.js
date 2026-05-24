// singapore-p1.js — Singapore Primary 1, Number and Algebra strand.
//
// Mapped to the official "2021 Primary Mathematics Syllabus (P1–P6)", Ministry of Education,
// Singapore (updated Oct 2025). `code` and `objective` are taken from the syllabus verbatim.
// This is the wedge IXL doesn't cover: an authentic Singapore-syllabus mapping.
//
// SCOPE: every drillable Number-and-Algebra objective that resolves to a single-integer
// answer is implemented below. Objectives that need a richer item type (counting objects,
// number-in-words, ordinal numbers, money, length, time, 2D shapes, picture graphs) are
// listed in `pending` so the coverage gap is explicit rather than hidden.

export default {
  id: 'sg-p1',
  country: 'Singapore',
  framework: 'MOE 2021 Primary Mathematics Syllabus (updated Oct 2025)',
  label: 'Singapore · Primary 1',
  source: 'https://www.moe.gov.sg/primary/curriculum/syllabus',
  groups: [
    { id: 'wn', name: 'Whole Numbers', subtitle: 'Numbers up to 100' },
    { id: 'as', name: 'Addition & Subtraction', subtitle: 'Within 100 (mental within 20)' },
    { id: 'md', name: 'Multiplication & Division', subtitle: 'Multiply within 40, divide within 20' },
    { id: 'wp', name: 'Word Problems', subtitle: 'Model method (bar models)' },
    { id: 'money', name: 'Money', subtitle: 'Counting coins' },
    { id: 'stat', name: 'Statistics', subtitle: 'Picture graphs' },
  ],
  skills: [
    // --- Whole Numbers ---
    { id: 'sg-p1-pv', group: 'wn', code: 'WN 1.2', name: 'Place value (tens and ones)',
      objective: 'number notation, representations and place values (tens, ones)',
      example: '3 tens and 4 ones = 34', timeTarget: 10,
      hint: 'The tens digit counts groups of ten; add on the ones.',
      spec: { kind: 'placeValue', maxTens: 9 } },

    { id: 'sg-p1-compare', group: 'wn', code: 'WN 1.5', name: 'Comparing & ordering numbers',
      objective: 'comparing and ordering numbers',
      example: 'Which is greater: 34 or 43? → 43', timeTarget: 8,
      hint: 'Compare tens first; if the tens are equal, compare the ones.',
      spec: { kind: 'compare', range: [3, 99], pick: 'greater' } },

    { id: 'sg-p1-pattern', group: 'wn', code: 'WN 1.6', name: 'Number patterns',
      objective: 'patterns in number sequences',
      example: '2, 4, 6, 8, ? → 10', timeTarget: 12,
      hint: 'Find the jump between terms, then add it once more.',
      spec: { kind: 'pattern', startRange: [1, 20], stepRange: [1, 5], len: 4 } },

    // --- Addition and Subtraction ---
    { id: 'sg-p1-bond', group: 'as', code: 'WN 2.1 / 2.3', name: 'Number bonds — making 10',
      objective: 'concepts of addition and subtraction; relationship between addition and subtraction',
      example: '10 = 6 + ? → 4', timeTarget: 7,
      hint: 'What adds to the first part to make the whole?',
      spec: { kind: 'missing', op: '+', sum: 10, style: 'bond' } },

    { id: 'sg-p1-add20', group: 'as', code: 'WN 2.7', name: 'Addition within 20 (mental)',
      objective: 'mental calculation involving addition and subtraction — within 20',
      example: '8 + 7 = 15', timeTarget: 8,
      hint: 'Make a 10 first, then add what is left.',
      spec: { kind: 'add', aRange: [2, 9], bRange: [2, 9], minSum: 11, maxSum: 18 } },

    { id: 'sg-p1-sub20', group: 'as', code: 'WN 2.7', name: 'Subtraction within 20 (mental)',
      objective: 'mental calculation involving addition and subtraction — within 20',
      example: '15 − 7 = 8', timeTarget: 9,
      hint: 'Subtract down to 10 first, then take away the rest.',
      spec: { kind: 'sub', aRange: [11, 20], bRange: [2, 9] } },

    { id: 'sg-p1-three', group: 'as', code: 'WN 2.4', name: 'Add three 1-digit numbers',
      objective: 'adding more than two 1-digit numbers',
      example: '3 + 4 + 5 = 12', timeTarget: 12,
      hint: 'Add two of them first, then add the third.',
      spec: { kind: 'add', terms: 3, aRange: [1, 6], maxSum: 18 } },

    { id: 'sg-p1-add2d-ones', group: 'as', code: 'WN 2.7', name: '2-digit + ones (no renaming)',
      objective: 'mental calculation … of a 2-digit number and ones without renaming',
      example: '42 + 5 = 47', timeTarget: 10,
      hint: 'Add the ones; the tens stay the same.',
      spec: { kind: 'add', aRange: [10, 89], bRange: [1, 9], carry: false } },

    { id: 'sg-p1-add2d-tens', group: 'as', code: 'WN 2.7', name: '2-digit + tens',
      objective: 'mental calculation … of a 2-digit number and tens',
      example: '34 + 20 = 54', timeTarget: 10,
      hint: 'Only the tens digit changes; the ones stay the same.',
      spec: { kind: 'add', aRange: [11, 79], bRange: [1, 6], bMultiple: 10, maxSum: 99 } },

    { id: 'sg-p1-add100', group: 'as', code: 'WN 2.5 / 2.6', name: 'Addition within 100',
      objective: 'adding and subtracting within 100; using algorithms',
      example: '48 + 37 = 85', timeTarget: 16,
      hint: 'Add the ones; if they reach 10, carry one ten over.',
      spec: { kind: 'add', aRange: [15, 84], bRange: [15, 84], maxSum: 99 } },

    { id: 'sg-p1-sub100', group: 'as', code: 'WN 2.5 / 2.6', name: 'Subtraction within 100',
      objective: 'adding and subtracting within 100; using algorithms',
      example: '72 − 38 = 34', timeTarget: 17,
      hint: 'If the top ones digit is too small, borrow one ten.',
      spec: { kind: 'sub', aRange: [30, 99], bRange: [11, 79] } },

    // --- Multiplication and Division ---
    { id: 'sg-p1-mul', group: 'md', code: 'MD 3.3', name: 'Multiplying within 40',
      objective: 'multiplying within 40',
      example: '6 × 5 = 30', timeTarget: 12,
      hint: 'Think of it as equal groups: 6 groups of 5.',
      spec: { kind: 'mul', aRange: [2, 9], bRange: [2, 5], maxProduct: 40 } },

    { id: 'sg-p1-div', group: 'md', code: 'MD 3.4', name: 'Dividing within 20',
      objective: 'dividing within 20',
      example: '18 ÷ 3 = 6', timeTarget: 14,
      hint: 'How many groups of the second number fit into the first?',
      spec: { kind: 'div', divisorRange: [2, 5], quotientRange: [2, 4], maxDividend: 20 } },

    // --- Word problems (bar model diagram + worded prompt) ---
    { id: 'sg-p1-wp-total', group: 'wp', code: 'WP +', name: 'Word problem: find the total',
      objective: 'add to find the whole, using the model method',
      example: '13 red + 8 blue → 21', timeTarget: 30,
      hint: 'The two parts join to make the whole — add them.',
      spec: { kind: 'barModel', structure: 'partWhole', min: 3, max: 20 } },

    { id: 'sg-p1-wp-part', group: 'wp', code: 'WP −', name: 'Word problem: find the missing part',
      objective: 'subtract to find a missing part, using the model method',
      example: '30 total, 18 boys → 12 girls', timeTarget: 32,
      hint: 'Take the known part away from the whole to find the other part.',
      spec: { kind: 'barModel', structure: 'missingPart', wholeMin: 12, wholeMax: 40 } },

    // --- Money ---
    { id: 'sg-p1-money', group: 'money', code: 'Money 1.1', name: 'Counting coins',
      objective: 'counting an amount of money in cents (shown as coins)',
      example: 'count the coins shown → e.g. 160 cents', timeTarget: 22,
      hint: 'Add up the value of each coin — count in fives, tens, twenties and fifties.',
      spec: { kind: 'moneyCount' } },

    // --- Statistics (picture graph diagram) ---
    { id: 'sg-p1-stat', group: 'stat', code: 'Stat 1.1', name: 'Reading a picture graph',
      objective: 'reading and interpreting data from picture graphs',
      example: 'count the icons in a row → e.g. 6', timeTarget: 20,
      hint: 'Each picture stands for one — count the pictures in the row.',
      spec: { kind: 'barChart', mode: 'picture', scale: 1 } },
  ],

  // Officially in P1 but needing item types beyond a single-integer answer.
  pending: [
    'WN 1.1 counting objects (needs pictorial item)',
    'WN 1.3 reading & writing numbers in words (needs text item)',
    'WN 1.7 ordinal numbers (needs context item)',
    'Money 1.1 recognising coins/notes from pictures (counting by value now drillable)',
    'Measurement: length & time (needs measurement items)',
    'Geometry: 2D shapes (needs shape item)',
    'Statistics: naming the most/least category (text answer; reading picture-graph values now drillable)',
  ],
};
