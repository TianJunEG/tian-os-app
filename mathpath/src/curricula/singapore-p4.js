// singapore-p4.js — Singapore Primary 4, Number and Algebra strand (Whole Numbers,
// Factors & Multiples, Four Operations, Fractions, Decimals).
//
// Mapped to the official "2021 Primary Mathematics Syllabus (P1–P6)", MOE Singapore
// (updated Oct 2025). `code`/`objective` are taken from the syllabus verbatim.
// P4 introduces decimals — those items grade as decimals (the keypad gains a "." key).
// Objectives needing richer item types (fraction-of-set diagrams, money, measurement,
// area, geometry, tables/line graphs, word problems) are listed in `pending`.

export default {
  id: 'sg-p4',
  country: 'Singapore',
  framework: 'MOE 2021 Primary Mathematics Syllabus (updated Oct 2025)',
  label: 'Singapore · Primary 4',
  source: 'https://www.moe.gov.sg/primary/curriculum/syllabus',
  groups: [
    { id: 'wn', name: 'Whole Numbers', subtitle: 'Numbers up to 100 000' },
    { id: 'fm', name: 'Factors & Multiples', subtitle: 'Common factors & multiples' },
    { id: 'fo', name: 'Four Operations', subtitle: 'Multiplication & division algorithms' },
    { id: 'fr', name: 'Fractions', subtitle: 'Mixed numbers, sets, unlike fractions' },
    { id: 'dec', name: 'Decimals', subtitle: 'Up to 3 decimal places' },
  ],
  skills: [
    // --- Whole Numbers ---
    { id: 'sg-p4-pv', group: 'wn', code: 'WN 1.1', name: 'Place value (ten thousands→ones)',
      objective: 'number notation, representations and place values (ten thousands, thousands, hundreds, tens, ones)',
      example: '5 ten thousands, 0 thousands, 3 hundreds, 0 tens and 2 ones = 50302', timeTarget: 16,
      hint: 'Ten thousands → ×10000, thousands → ×1000, and so on, then add the ones.',
      spec: { kind: 'placeValue', tenThousands: true } },

    { id: 'sg-p4-compare', group: 'wn', code: 'WN 1.3', name: 'Comparing & ordering numbers',
      objective: 'comparing and ordering numbers',
      example: 'Which is greater: 47312 or 47231? → 47312', timeTarget: 11,
      hint: 'Compare from the largest place value down until the digits differ.',
      spec: { kind: 'compare', range: [3, 99999], pick: 'greater' } },

    { id: 'sg-p4-pattern', group: 'wn', code: 'WN 1.4', name: 'Number patterns',
      objective: 'patterns in number sequences',
      example: '12000, 14500, 17000, 19500, ? → 22000', timeTarget: 15,
      hint: 'Find the constant jump between terms, then add it once more.',
      spec: { kind: 'pattern', startRange: [2000, 20000], stepRange: [250, 2500], len: 4 } },

    { id: 'sg-p4-round', group: 'wn', code: 'WN 1.5', name: 'Rounding to 10/100/1000',
      objective: 'rounding numbers to the nearest 10, 100 or 1000',
      example: 'Round 3847 to the nearest 100 → 3800', timeTarget: 13,
      hint: 'Look at the digit just below the rounding place: 5 or more rounds up, else down.',
      spec: { kind: 'roundInt', range: [101, 9999], unitSet: [10, 100, 1000] } },

    // --- Factors and Multiples ---
    { id: 'sg-p4-hcf', group: 'fm', code: 'FM 2.3', name: 'Common factors',
      objective: 'finding the common factors of two given numbers',
      example: 'Greatest common factor of 24 and 36 → 12', timeTarget: 18,
      hint: 'List the factors of each number; the largest they share is the answer.',
      spec: { kind: 'hcf' } },

    { id: 'sg-p4-lcm', group: 'fm', code: 'FM 2.5', name: 'Common multiples',
      objective: 'finding the common multiples of two given 1-digit numbers',
      example: 'Lowest common multiple of 4 and 6 → 12', timeTarget: 18,
      hint: 'Count up in each number until you reach a value that appears in both lists.',
      spec: { kind: 'lcm' } },

    // --- Four Operations ---
    { id: 'sg-p4-mul4by1', group: 'fo', code: 'FO 3.1', name: 'Multiply up to 4-digit by 1-digit',
      objective: 'multiplication algorithm (up to 4 digits by 1 digit)',
      example: '3247 × 6 = 19482', timeTarget: 26,
      hint: 'Multiply each digit by the 1-digit number from the right, carrying as you go.',
      spec: { kind: 'mul', aRange: [1000, 9999], bRange: [2, 9] } },

    { id: 'sg-p4-mul3by2', group: 'fo', code: 'FO 3.1', name: 'Multiply up to 3-digit by 2-digit',
      objective: 'multiplication algorithm (up to 3 digits by 2 digits)',
      example: '243 × 37 = 8991', timeTarget: 30,
      hint: 'Multiply by the ones, then the tens, then add the two partial products.',
      spec: { kind: 'mul', aRange: [100, 999], bRange: [11, 99] } },

    { id: 'sg-p4-div4by1', group: 'fo', code: 'FO 3.2', name: 'Divide up to 4-digit by 1-digit',
      objective: 'division algorithm (up to 4 digits by 1 digit)',
      example: '4872 ÷ 6 = 812', timeTarget: 30,
      hint: 'Use long division, bringing down one digit at a time from the left.',
      spec: { kind: 'div', divisorRange: [2, 9], quotientRange: [111, 1500], maxDividend: 9999 } },

    // --- Fractions ---
    { id: 'sg-p4-mixed', group: 'fr', code: 'Fr 1.1', name: 'Mixed number → improper fraction',
      objective: 'mixed numbers, improper fractions and their relationship',
      example: '2 1/3 = ?/3 → 7', timeTarget: 16,
      hint: 'Multiply the whole number by the denominator, then add the numerator.',
      spec: { kind: 'mixedToImproper', maxDenom: 12 } },

    { id: 'sg-p4-frac-set', group: 'fr', code: 'Fr 2.1', name: 'Fraction of a set',
      objective: 'fraction as part of a set',
      example: '3/4 of 20 = 15', timeTarget: 16,
      hint: 'Divide the set by the denominator to get one part, then multiply by the numerator.',
      spec: { kind: 'fractionOfSet' } },

    { id: 'sg-p4-frac-unlike', group: 'fr', code: 'Fr 3.1', name: 'Add & subtract unlike fractions',
      objective: 'adding and subtracting fractions … not more than two different denominators (≤ 12)',
      example: '1/3 + 1/4 = ?/12 → 7', timeTarget: 22,
      hint: 'Rewrite both over their lowest common denominator, then add/subtract the tops.',
      spec: { kind: 'fractionUnlike', maxDenom: 12 } },

    // --- Decimals (answers graded as decimals) ---
    { id: 'sg-p4-dec-pv', group: 'dec', code: 'Dec 1.1', name: 'Decimal place value',
      objective: 'notation, representations and place values (tenths, hundredths, thousandths)',
      example: '4 tenths, 7 hundredths and 3 thousandths = 0.473', timeTarget: 16,
      hint: 'Tenths fill the first place after the point, then hundredths, then thousandths.',
      spec: { kind: 'decimalPlaceValue' } },

    { id: 'sg-p4-dec-compare', group: 'dec', code: 'Dec 1.2', name: 'Comparing decimals',
      objective: 'comparing and ordering decimals',
      example: 'Which is greater: 0.7 or 0.65? → 0.7', timeTarget: 12,
      hint: 'Compare the tenths first, then hundredths — more digits does not mean larger.',
      spec: { kind: 'compareDecimal' } },

    { id: 'sg-p4-dec-round', group: 'dec', code: 'Dec 1.5', name: 'Rounding decimals',
      objective: 'rounding decimals to the nearest whole number, 1 dp or 2 dp',
      example: 'Round 3.467 to 1 decimal place → 3.5', timeTarget: 15,
      hint: 'Look at the digit just after the rounding place: 5 or more rounds up.',
      spec: { kind: 'roundDecimal' } },

    { id: 'sg-p4-dec-addsub', group: 'dec', code: 'Dec 2.1', name: 'Adding & subtracting decimals',
      objective: 'adding and subtracting decimals (up to 2 decimal places)',
      example: '12.3 + 4.05 = 16.35', timeTarget: 22,
      hint: 'Line up the decimal points, then add or subtract column by column.',
      spec: { kind: 'addSubDecimal' } },

    { id: 'sg-p4-dec-muldiv', group: 'dec', code: 'Dec 3.1', name: 'Multiply/divide decimals by 1-digit',
      objective: 'multiplying and dividing decimals (up to 2 dp) by a 1-digit whole number',
      example: '1.2 × 4 = 4.8', timeTarget: 22,
      hint: 'Compute as if there were no point, then place the point back in the answer.',
      spec: { kind: 'mulDivDecimal' } },

    { id: 'sg-p4-dec-frac', group: 'dec', code: 'Dec 1.4', name: 'Fraction → decimal',
      objective: 'expressing fractions as decimals when the denominator is a factor of 10 or 100',
      example: '3/4 = 0.75', timeTarget: 16,
      hint: 'Rename the fraction with denominator 10 or 100, then read off the decimal.',
      spec: { kind: 'fracToDecimal' } },
  ],

  // In the P4 syllabus but needing item types beyond a single number answer.
  pending: [
    'WN 1.2 reading & writing numbers in words (needs text item)',
    'FM 2.1/2.2/2.4 factor & multiple identification (needs true/false or multi-select item)',
    'Fractions 1.1 improper → mixed number, set diagrams (needs mixed-number / pictorial item)',
    'Decimals 1.3 expressing decimals as fractions (needs fraction item)',
    'Money: adding & subtracting money in decimal notation (covered numerically by decimals; context item pending)',
    'Measurement: time (24-hour clock, duration), area & perimeter of composite figures',
    'Geometry: angles, symmetry, properties of squares/rectangles, nets',
    'Statistics: reading & interpreting tables and line graphs (needs chart item)',
    'Multi-step word problems (needs word-problem / bar-model item)',
  ],
};
