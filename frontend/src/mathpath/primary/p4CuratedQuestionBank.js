// p4CuratedQuestionBank.js
// ═══════════════════════════════════════════════════════════════════════════
// Curated questions extracted from real Singapore P4 Math exam papers.
// Each question is mapped to a MathPath skill ID for targeted practice.
//
// Source papers: ACSJ, Catholic High, Nanyang, Henry Park, Raffles (2021-2025)
// Figure-dependent questions are excluded — text-only items that can be
// rendered in the MathPath practice UI without diagrams.
//
// NOTE: 6 heuristic WP-02 questions (comparison-with-multiples, substitution,
// simultaneous-change) have been moved to Problem Solving Lab (PSL) as
// parameterised templates in scripts/seedPSLTemplates.js. See IDs:
// CQ-P4-050, CQ-P4-052, CQ-P4-053, CQ-P4-056, CQ-P4-072, CQ-P4-073.
//
// Format: each item matches the shape returned by QuestionGenerator so
// the practice engine can mix curated and generated questions seamlessly.
// ═══════════════════════════════════════════════════════════════════════════

// ---------------------------------------------------------------------------
// Skill ID mapping  (runtime → curriculum spec)
// ---------------------------------------------------------------------------
// P4-WN-01  → sg-p4-pv         Place value (ten thousands → ones)
// P4-WN-02  → sg-p4-compare    Comparing & ordering numbers
// P4-WN-03  → sg-p4-pattern    Number patterns
// P4-WN-04  → sg-p4-round      Rounding to 10/100/1000
// P4-FM-01  → sg-p4-hcf        Common factors (HCF)
// P4-FM-02  → sg-p4-lcm        Common multiples (LCM)
// P4-FO-01  → sg-p4-mul4by1    Multiply up to 4-digit × 1-digit
// P4-FO-02  → sg-p4-mul3by2    Multiply up to 3-digit × 2-digit
// P4-FO-03  → sg-p4-div4by1    Divide up to 4-digit ÷ 1-digit
// P4-FR-01  → sg-p4-mixed      Mixed number ↔ improper fraction
// P4-FR-02  → sg-p4-frac-set   Fraction of a set
// P4-FR-03  → sg-p4-frac-unlike  Add & subtract unlike fractions
// P4-DEC-01 → sg-p4-dec-pv     Decimal place value
// P4-DEC-02 → sg-p4-dec-compare  Comparing decimals
// P4-DEC-03 → sg-p4-dec-round  Rounding decimals
// P4-DEC-04 → sg-p4-dec-addsub Adding & subtracting decimals
// P4-DEC-05 → sg-p4-dec-muldiv Multiply/divide decimals by 1-digit
// P4-DEC-06 → sg-p4-dec-frac   Fraction → decimal
// P4-WP-01  → sg-p4-wp-fraction  Word problem: fraction of quantity
// P4-WP-02  → sg-p4-wp-twostep   Two-step word problem
// P4-STAT-01 → sg-p4-stat-line Line graph reading
// P4-STAT-02 → sg-p4-stat-pie  Pie chart reading
// ---------------------------------------------------------------------------

export const p4CuratedQuestions = [

  // ═══════════════════════════════════════════════════════════════════════
  // P4-WN-01  Place Value
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'CQ-P4-001',
    skillId: 'P4-WN-01',
    source: { school: 'ACSJ', exam: 'EOY', year: 2024, section: 'A', qn: 1 },
    type: 'mcq',
    marks: 2,
    prompt: 'The value of the digit 9 in 79 413 is ______.',
    options: ['90', '900', '9000', '90 000'],
    answer: '9000',
    answerIndex: 2,
    answerType: 'numeric',
    difficulty: 2,
    solutionSteps: [
      'The digit 9 is in the thousands place.',
      '9 × 1000 = 9000',
    ],
    misconceptionTraps: ['confuses_place_columns_5digit'],
    tags: ['place-value', 'five-digit'],
  },

  {
    id: 'CQ-P4-002',
    skillId: 'P4-WN-01',
    source: { school: 'ACSJ', exam: 'EOY', year: 2024, section: 'A', qn: 8 },
    type: 'mcq',
    marks: 2,
    prompt: 'Which one of the following is the same as 50 063?',
    options: ['500 + 6 + 3', '5000 + 60 + 3', '50 000 + 60 + 3', '50 000 + 600 + 3'],
    answer: '50 000 + 60 + 3',
    answerIndex: 2,
    answerType: 'text',
    difficulty: 2,
    solutionSteps: [
      '50 063 = 50 000 + 0 + 60 + 3',
      'The thousands digit is 0, so there is no thousands term.',
    ],
    misconceptionTraps: ['confuses_place_columns_5digit'],
    tags: ['place-value', 'expanded-form'],
  },

  {
    id: 'CQ-P4-003',
    skillId: 'P4-WN-01',
    source: { school: 'Catholic High', exam: 'EOY', year: 2024, section: 'A', qn: 1 },
    type: 'mcq',
    marks: 2,
    prompt: 'The value of the digit 6 in 56 013 is ______.',
    options: ['6', '60', '600', '6000'],
    answer: '6000',
    answerIndex: 3,
    answerType: 'numeric',
    difficulty: 2,
    solutionSteps: [
      'The digit 6 is in the thousands place.',
      '6 × 1000 = 6000',
    ],
    misconceptionTraps: ['confuses_place_columns_5digit'],
    tags: ['place-value', 'five-digit'],
  },

  {
    id: 'CQ-P4-004',
    skillId: 'P4-WN-01',
    source: { school: 'Catholic High', exam: 'EOY', year: 2024, section: 'B', qn: 21 },
    type: 'open',
    marks: 2,
    prompt: 'Write twenty-five thousand and thirteen in numerals.',
    options: null,
    answer: '25013',
    answerIndex: null,
    answerType: 'numeric',
    difficulty: 2,
    solutionSteps: [
      'Twenty-five thousand = 25 000',
      'Thirteen = 13',
      '25 000 + 13 = 25 013',
    ],
    misconceptionTraps: ['confuses_place_columns_5digit'],
    tags: ['place-value', 'words-to-numerals'],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // P4-WN-02  Comparing & Ordering
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'CQ-P4-005',
    skillId: 'P4-WN-02',
    source: { school: 'Nanyang', exam: 'WA1', year: 2025, section: 'B', qn: '7a' },
    type: 'open',
    marks: 2,
    prompt: 'Using the digits 3, 8, 6, 2 and 1 (each digit used only once), form the greatest 5-digit even number.',
    options: null,
    answer: '86312',
    answerIndex: null,
    answerType: 'numeric',
    difficulty: 3,
    solutionSteps: [
      'For the greatest number, arrange digits from largest to smallest.',
      'For an even number, the ones digit must be even (2 or 6).',
      'Use 2 in the ones place (smallest even digit) to keep larger digits in higher places.',
      '8, 6, 3, 1 in descending order, then 2 → 86 312',
    ],
    misconceptionTraps: ['ignores_even_constraint'],
    tags: ['comparing', 'ordering', 'greatest-number'],
  },

  {
    id: 'CQ-P4-006',
    skillId: 'P4-WN-02',
    source: { school: 'Nanyang', exam: 'WA1', year: 2025, section: 'B', qn: '7b' },
    type: 'open',
    marks: 2,
    prompt: 'Using the digits 3, 8, 6, 2 and 1 (each digit used only once), form the smallest 4-digit odd number.',
    options: null,
    answer: '1263',
    answerIndex: null,
    answerType: 'numeric',
    difficulty: 3,
    solutionSteps: [
      'For the smallest 4-digit number, start with the smallest non-zero digit in the thousands place.',
      'For an odd number, the ones digit must be odd (1 or 3).',
      'Put 1 in thousands. Remaining digits for 3 places: {3, 8, 6, 2}.',
      'Ones must be odd → use 3. Fill hundreds and tens with smallest remaining: 2, 6.',
      '1, 2, 6, 3 → 1263',
    ],
    misconceptionTraps: ['ignores_odd_constraint'],
    tags: ['comparing', 'ordering', 'smallest-number'],
  },

  {
    id: 'CQ-P4-007',
    skillId: 'P4-WN-02',
    source: { school: 'Catholic High', exam: 'EOY', year: 2024, section: 'A', qn: 7 },
    type: 'mcq',
    marks: 2,
    prompt: 'Which of the following numbers is 600 less than 76 891?',
    options: ['70 891', '76 291', '76 831', '77 491'],
    answer: '76 291',
    answerIndex: 1,
    answerType: 'numeric',
    difficulty: 2,
    solutionSteps: [
      '76 891 − 600 = 76 291',
    ],
    misconceptionTraps: ['subtraction_place_error'],
    tags: ['comparing', 'subtraction'],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // P4-WN-03  Number Patterns
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'CQ-P4-008',
    skillId: 'P4-WN-03',
    source: { school: 'Nanyang', exam: 'WA1', year: 2025, section: 'A', qn: 3 },
    type: 'mcq',
    marks: 2,
    prompt: 'Look at the number sequence carefully.\n24, 28, 32, 36, 40, ...\nWhat is the 20th number?',
    options: ['194', '100', '80', '76'],
    answer: '100',
    answerIndex: 1,
    answerType: 'numeric',
    difficulty: 3,
    solutionSteps: [
      'The common difference is 28 − 24 = 4.',
      '20th term = 1st term + (20 − 1) × 4 = 24 + 76 = 100',
    ],
    misconceptionTraps: ['off_by_one_in_sequence'],
    tags: ['pattern', 'arithmetic-sequence'],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // P4-WN-04  Rounding
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'CQ-P4-009',
    skillId: 'P4-WN-04',
    source: { school: 'ACSJ', exam: 'EOY', year: 2024, section: 'A', qn: 6 },
    type: 'mcq',
    marks: 2,
    prompt: 'Which number when rounded to the nearest ten becomes 37 500?',
    options: ['37 444', '37 496', '37 506', '37 554'],
    answer: '37 496',
    answerIndex: 1,
    answerType: 'numeric',
    difficulty: 3,
    solutionSteps: [
      '37 496 → ones digit is 6 (≥ 5), round up → 37 500 ✓',
      '37 444 → rounds to 37 440 ✗',
      '37 506 → rounds to 37 510 ✗',
      '37 554 → rounds to 37 550 ✗',
    ],
    misconceptionTraps: ['rounding_direction_error', 'rounding_wrong_place'],
    tags: ['rounding', 'nearest-ten', 'reverse-rounding'],
  },

  {
    id: 'CQ-P4-010',
    skillId: 'P4-WN-04',
    source: { school: 'Catholic High', exam: 'EOY', year: 2024, section: 'A', qn: 2 },
    type: 'mcq',
    marks: 2,
    prompt: 'Which of the following numbers when rounded to the nearest ten becomes 23 900?',
    options: ['22 844', '22 895', '23 904', '23 946'],
    answer: '23 904',
    answerIndex: 2,
    answerType: 'numeric',
    difficulty: 3,
    solutionSteps: [
      '23 904 → ones digit is 4 (< 5), round down → 23 900 ✓',
      '22 844 → rounds to 22 840 ✗',
      '22 895 → rounds to 22 900 ✗',
      '23 946 → rounds to 23 950 ✗',
    ],
    misconceptionTraps: ['rounding_direction_error', 'rounding_wrong_place'],
    tags: ['rounding', 'nearest-ten', 'reverse-rounding'],
  },

  {
    id: 'CQ-P4-011',
    skillId: 'P4-WN-04',
    source: { school: 'Nanyang', exam: 'WA1', year: 2025, section: 'A', qn: 2 },
    type: 'mcq',
    marks: 2,
    prompt: 'The number of beads Mrs Tan bought when rounded to the nearest hundred is 4500. What is the greatest possible number of beads that she bought?',
    options: ['4499', '4549', '4599', '4999'],
    answer: '4549',
    answerIndex: 1,
    answerType: 'numeric',
    difficulty: 3,
    solutionSteps: [
      'When rounded to nearest 100, the result is 4500.',
      'Numbers that round to 4500: from 4450 to 4549.',
      'The greatest is 4549 (4550 would round to 4600).',
    ],
    misconceptionTraps: ['rounding_five_goes_down', 'rounding_boundary_error'],
    tags: ['rounding', 'nearest-hundred', 'greatest-possible'],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // P4-FM-01  Common Factors (HCF)
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'CQ-P4-012',
    skillId: 'P4-FM-01',
    source: { school: 'Catholic High', exam: 'EOY', year: 2024, section: 'A', qn: 5 },
    type: 'mcq',
    marks: 2,
    prompt: 'Which of the following is a factor of both 18 and 48?',
    options: ['6', '7', '8', '9'],
    answer: '6',
    answerIndex: 0,
    answerType: 'numeric',
    difficulty: 2,
    solutionSteps: [
      'Factors of 18: 1, 2, 3, 6, 9, 18',
      'Factors of 48: 1, 2, 3, 4, 6, 8, 12, 16, 24, 48',
      'Common factors: 1, 2, 3, 6 → 6 is in the options',
    ],
    misconceptionTraps: ['confuses_factors_and_multiples', 'misses_factor_pair'],
    tags: ['common-factors'],
  },

  {
    id: 'CQ-P4-013',
    skillId: 'P4-FM-01',
    source: { school: 'Catholic High', exam: 'EOY', year: 2024, section: 'B', qn: 22 },
    type: 'open',
    marks: 2,
    prompt: 'Some factors of 20 are 1, 2, 4 and 20. What are the other two factors of 20?',
    options: null,
    answer: '5, 10',
    answerIndex: null,
    answerType: 'text',
    difficulty: 2,
    solutionSteps: [
      'All factors of 20: 1, 2, 4, 5, 10, 20',
      'Given: 1, 2, 4, 20 → Missing: 5 and 10',
    ],
    misconceptionTraps: ['misses_factor_pair', 'forgets_1_is_a_factor'],
    tags: ['factors', 'list-factors'],
  },

  {
    id: 'CQ-P4-014',
    skillId: 'P4-FM-01',
    source: { school: 'Nanyang', exam: 'WA1', year: 2025, section: 'B', qn: 5 },
    type: 'open',
    marks: 2,
    prompt: 'List down all the common factors of 15 and 42.',
    options: null,
    answer: '1, 3',
    answerIndex: null,
    answerType: 'text',
    difficulty: 2,
    solutionSteps: [
      'Factors of 15: 1, 3, 5, 15',
      'Factors of 42: 1, 2, 3, 6, 7, 14, 21, 42',
      'Common factors: 1, 3',
    ],
    misconceptionTraps: ['misses_factor_pair', 'forgets_1_is_a_factor'],
    tags: ['common-factors'],
  },

  {
    id: 'CQ-P4-015',
    skillId: 'P4-FM-01',
    source: { school: 'Catholic High', exam: 'EOY', year: 2024, section: 'B', qn: 30 },
    type: 'open',
    marks: 2,
    prompt: 'A number has the factors 3 and 7. The number is between 50 and 70. What is the number?',
    options: null,
    answer: '63',
    answerIndex: null,
    answerType: 'numeric',
    difficulty: 3,
    solutionSteps: [
      'The number must be a multiple of both 3 and 7.',
      'Multiples of 21 (= 3 × 7): 21, 42, 63, 84, ...',
      '63 is between 50 and 70.',
    ],
    misconceptionTraps: ['confuses_factors_and_multiples'],
    tags: ['factors', 'multiples', 'reasoning'],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // P4-FM-02  Common Multiples (LCM)
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'CQ-P4-016',
    skillId: 'P4-FM-02',
    source: { school: 'ACSJ', exam: 'EOY', year: 2024, section: 'A', qn: 11 },
    type: 'mcq',
    marks: 2,
    prompt: 'The first common multiple of 2 and 9 is also a multiple of ______.',
    options: ['6', '7', '8', '16'],
    answer: '6',
    answerIndex: 0,
    answerType: 'numeric',
    difficulty: 3,
    solutionSteps: [
      'LCM of 2 and 9 = 18',
      '18 ÷ 6 = 3 → 18 is a multiple of 6 ✓',
      '18 ÷ 7 ≠ whole number ✗',
    ],
    misconceptionTraps: ['confuses_factors_and_multiples', 'multiplies_instead_of_finding_lcm'],
    tags: ['common-multiples', 'lcm'],
  },

  {
    id: 'CQ-P4-017',
    skillId: 'P4-FM-02',
    source: { school: 'Catholic High', exam: 'EOY', year: 2024, section: 'A', qn: 10 },
    type: 'mcq',
    marks: 2,
    prompt: 'At a carnival, every 3rd child gets a candy and every 6th child gets a balloon. Which child is the first to get both a candy and a balloon?',
    options: ['6th', '9th', '12th', '18th'],
    answer: '6th',
    answerIndex: 0,
    answerType: 'text',
    difficulty: 3,
    solutionSteps: [
      'Child gets candy: 3, 6, 9, 12, ...',
      'Child gets balloon: 6, 12, 18, ...',
      'First common multiple of 3 and 6 = 6 → 6th child',
    ],
    misconceptionTraps: ['multiplies_instead_of_finding_lcm'],
    tags: ['common-multiples', 'lcm', 'word-problem'],
  },

  {
    id: 'CQ-P4-018',
    skillId: 'P4-FM-02',
    source: { school: 'Nanyang', exam: 'WA1', year: 2025, section: 'B', qn: '6a' },
    type: 'open',
    marks: 2,
    prompt: 'Find the 7th multiple of 4.',
    options: null,
    answer: '28',
    answerIndex: null,
    answerType: 'numeric',
    difficulty: 1,
    solutionSteps: [
      '7th multiple of 4 = 4 × 7 = 28',
    ],
    misconceptionTraps: ['confuses_factors_and_multiples'],
    tags: ['multiples'],
  },

  {
    id: 'CQ-P4-019',
    skillId: 'P4-FM-02',
    source: { school: 'Nanyang', exam: 'WA1', year: 2025, section: 'B', qn: '6b' },
    type: 'open',
    marks: 2,
    prompt: 'List down the second common multiple of 6 and 9.',
    options: null,
    answer: '36',
    answerIndex: null,
    answerType: 'numeric',
    difficulty: 3,
    solutionSteps: [
      'Multiples of 6: 6, 12, 18, 24, 30, 36, ...',
      'Multiples of 9: 9, 18, 27, 36, ...',
      'Common multiples: 18, 36, ... → 2nd common multiple = 36',
    ],
    misconceptionTraps: ['stops_listing_too_early', 'multiplies_instead_of_finding_lcm'],
    tags: ['common-multiples'],
  },

  {
    id: 'CQ-P4-020',
    skillId: 'P4-FM-02',
    source: { school: 'Catholic High', exam: 'EOY', year: 2024, section: 'B', qn: 31 },
    type: 'open',
    marks: 2,
    prompt: 'The fifth multiple of a 1-digit number is 14 more than its third multiple. What is the 1-digit number?',
    options: null,
    answer: '7',
    answerIndex: null,
    answerType: 'numeric',
    difficulty: 3,
    solutionSteps: [
      'Let the number be n.',
      '5n − 3n = 2n = 14',
      'n = 7',
    ],
    misconceptionTraps: ['confuses_factors_and_multiples'],
    tags: ['multiples', 'reasoning'],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // P4-FO-01  Multiply 4-digit × 1-digit
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'CQ-P4-021',
    skillId: 'P4-FO-01',
    source: { school: 'Nanyang', exam: 'WA1', year: 2025, section: 'C', qn: '9a' },
    type: 'open',
    marks: 2,
    prompt: 'Devi baked 675 cookies on Saturday. She baked 4 times as many cookies on Sunday as on Saturday. How many cookies did she bake on Sunday?',
    options: null,
    answer: '2700',
    answerIndex: null,
    answerType: 'numeric',
    difficulty: 2,
    solutionSteps: [
      'Sunday = 4 × Saturday = 4 × 675',
      '4 × 675 = 2700',
    ],
    misconceptionTraps: ['carry_error_multiplication'],
    tags: ['multiplication', 'word-problem'],
  },

  {
    id: 'CQ-P4-022',
    skillId: 'P4-FO-01',
    source: { school: 'Catholic High', exam: 'EOY', year: 2024, section: 'A', qn: 11 },
    type: 'mcq',
    marks: 2,
    prompt: 'All the books in a library were packed into boxes of 8. After packing 112 boxes, there were 6 books unpacked. How many books were there at first?',
    options: ['890', '896', '902', '904'],
    answer: '902',
    answerIndex: 2,
    answerType: 'numeric',
    difficulty: 3,
    solutionSteps: [
      '112 boxes × 8 books = 896 books packed',
      '896 + 6 unpacked = 902 books total',
    ],
    misconceptionTraps: ['carry_error_multiplication'],
    tags: ['multiplication', 'word-problem'],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // P4-FO-02  Multiply 3-digit × 2-digit
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'CQ-P4-023',
    skillId: 'P4-FO-02',
    source: { school: 'Nanyang', exam: 'WA1', year: 2025, section: 'A', qn: 1 },
    type: 'mcq',
    marks: 2,
    prompt: 'What is the product of 454 and 18?',
    options: ['4086', '7172', '7742', '8172'],
    answer: '8172',
    answerIndex: 3,
    answerType: 'numeric',
    difficulty: 3,
    solutionSteps: [
      '454 × 18 = 454 × 10 + 454 × 8',
      '454 × 10 = 4540',
      '454 × 8 = 3632',
      '4540 + 3632 = 8172',
    ],
    misconceptionTraps: ['carry_error_multiplication', 'forgets_tens_row_shift'],
    tags: ['multiplication', '3by2'],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // P4-FO-03  Divide 4-digit ÷ 1-digit
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'CQ-P4-024',
    skillId: 'P4-FO-03',
    source: { school: 'Nanyang', exam: 'WA1', year: 2025, section: 'B', qn: 4 },
    type: 'open',
    marks: 2,
    prompt: 'What is the remainder when 5729 is divided by 9?',
    options: null,
    answer: '5',
    answerIndex: null,
    answerType: 'numeric',
    difficulty: 2,
    solutionSteps: [
      '5729 ÷ 9 = 636 remainder 5',
      'Check: 636 × 9 = 5724, 5729 − 5724 = 5',
    ],
    misconceptionTraps: ['skips_zero_in_quotient', 'remainder_error'],
    tags: ['division', 'remainder'],
  },

  {
    id: 'CQ-P4-025',
    skillId: 'P4-FO-03',
    source: { school: 'Nanyang', exam: 'WA1', year: 2025, section: 'C', qn: '9b' },
    type: 'open',
    marks: 2,
    prompt: 'Devi packed all 675 cookies that she baked on Saturday into boxes. Each box had 5 cookies. How many boxes of cookies did she pack? Round your answer to the nearest ten.',
    options: null,
    answer: '140',
    answerIndex: null,
    answerType: 'numeric',
    difficulty: 3,
    solutionSteps: [
      '675 ÷ 5 = 135 boxes',
      'Round 135 to the nearest ten → 140',
    ],
    misconceptionTraps: ['rounding_direction_error'],
    tags: ['division', 'rounding', 'multi-step'],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // P4-FR-01  Mixed Numbers ↔ Improper Fractions
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'CQ-P4-026',
    skillId: 'P4-FR-01',
    source: { school: 'ACSJ', exam: 'EOY', year: 2024, section: 'A', qn: 2 },
    type: 'mcq',
    marks: 2,
    prompt: 'How many one-fifths are there in 3 wholes?',
    options: ['5/3', '3/5', '5', '15'],
    answer: '15',
    answerIndex: 3,
    answerType: 'numeric',
    difficulty: 2,
    solutionSteps: [
      '1 whole = 5 fifths',
      '3 wholes = 3 × 5 = 15 fifths',
    ],
    misconceptionTraps: ['mixed_to_improper_add_error'],
    tags: ['mixed-numbers', 'improper-fractions'],
  },

  {
    id: 'CQ-P4-027',
    skillId: 'P4-FR-01',
    source: { school: 'Catholic High', exam: 'EOY', year: 2024, section: 'A', qn: 3 },
    type: 'mcq',
    marks: 2,
    prompt: '5 7/8 = ☐/8. What is the missing number in the box?',
    options: ['33', '35', '40', '47'],
    answer: '47',
    answerIndex: 3,
    answerType: 'numeric',
    difficulty: 2,
    solutionSteps: [
      '5 × 8 = 40',
      '40 + 7 = 47',
      'So 5 7/8 = 47/8',
    ],
    misconceptionTraps: ['mixed_to_improper_add_error'],
    tags: ['mixed-numbers', 'improper-fractions'],
  },

  {
    id: 'CQ-P4-028',
    skillId: 'P4-FR-01',
    source: { school: 'Catholic High', exam: 'EOY', year: 2024, section: 'B', qn: 25 },
    type: 'open',
    marks: 2,
    prompt: 'How many sixths are there in 1 whole?',
    options: null,
    answer: '6',
    answerIndex: null,
    answerType: 'numeric',
    difficulty: 1,
    solutionSteps: [
      '1 whole = 6/6 = 6 sixths',
    ],
    misconceptionTraps: ['mixed_to_improper_add_error'],
    tags: ['mixed-numbers', 'unit-fractions'],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // P4-FR-02  Fraction of a Set
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'CQ-P4-029',
    skillId: 'P4-FR-02',
    source: { school: 'Catholic High', exam: 'EOY', year: 2024, section: 'A', qn: 13 },
    type: 'mcq',
    marks: 2,
    prompt: 'Cayden had $84. He spent 3/7 of his money on a puzzle. How much money did he have left?',
    options: ['$12', '$28', '$36', '$48'],
    answer: '$48',
    answerIndex: 3,
    answerType: 'numeric',
    difficulty: 3,
    solutionSteps: [
      'Spent = 3/7 × $84 = $36',
      'Left = $84 − $36 = $48',
    ],
    misconceptionTraps: ['forgets_to_subtract_from_whole'],
    tags: ['fraction-of-set', 'money', 'word-problem'],
  },

  {
    id: 'CQ-P4-030',
    skillId: 'P4-FR-02',
    source: { school: 'Catholic High', exam: 'EOY', year: 2024, section: 'B', qn: 33 },
    type: 'open',
    marks: 2,
    prompt: "Melissa's monthly salary is thrice the amount she spent in June. Her monthly salary is $8424. How much did she spend in June?",
    options: null,
    answer: '2808',
    answerIndex: null,
    answerType: 'numeric',
    difficulty: 3,
    solutionSteps: [
      'Salary = 3 × amount spent',
      'Amount spent = $8424 ÷ 3 = $2808',
    ],
    misconceptionTraps: ['forgets_to_subtract_from_whole'],
    tags: ['fraction-of-set', 'division', 'word-problem'],
  },

  {
    id: 'CQ-P4-031',
    skillId: 'P4-FR-02',
    source: { school: 'Nanyang', exam: 'WA2', year: 2025, section: 'B', qn: 5 },
    type: 'open',
    marks: 2,
    prompt: 'Lucy had $954. She spent 5/9 of her money to buy a pair of shoes. How much had she left after buying the pair of shoes?',
    options: null,
    answer: '424',
    answerIndex: null,
    answerType: 'numeric',
    difficulty: 3,
    solutionSteps: [
      'Spent = 5/9 × $954 = $530',
      'Left = $954 − $530 = $424',
    ],
    misconceptionTraps: ['forgets_to_subtract_from_whole'],
    tags: ['fraction-of-set', 'money', 'word-problem'],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // P4-FR-03  Add & Subtract Unlike Fractions
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'CQ-P4-032',
    skillId: 'P4-FR-03',
    source: { school: 'ACSJ', exam: 'EOY', year: 2024, section: 'A', qn: 14 },
    type: 'mcq',
    marks: 2,
    prompt: 'Sam took 3/4 h to complete a jigsaw puzzle. His sister was 1/6 h faster than him to complete the same jigsaw puzzle. How long did his sister take to complete the jigsaw puzzle?',
    options: ['4/10 h', '7/12 h', '11/12 h', '11/24 h'],
    answer: '7/12 h',
    answerIndex: 1,
    answerType: 'fraction',
    difficulty: 3,
    solutionSteps: [
      'Sister = 3/4 − 1/6',
      'LCD of 4 and 6 = 12',
      '3/4 = 9/12, 1/6 = 2/12',
      '9/12 − 2/12 = 7/12 h',
    ],
    misconceptionTraps: ['adds_denominators', 'forgets_to_find_lcd'],
    tags: ['unlike-fractions', 'subtraction', 'word-problem'],
  },

  {
    id: 'CQ-P4-033',
    skillId: 'P4-FR-03',
    source: { school: 'Catholic High', exam: 'EOY', year: 2024, section: 'A', qn: 12 },
    type: 'mcq',
    marks: 2,
    prompt: 'Alice bought 3/4 kg of cookies. Benny bought 1/5 kg of cookies more than Alice. How many kilograms of cookies did Benny buy?',
    options: ['2/9 kg', '4/9 kg', '11/20 kg', '19/20 kg'],
    answer: '19/20 kg',
    answerIndex: 3,
    answerType: 'fraction',
    difficulty: 3,
    solutionSteps: [
      'Benny = 3/4 + 1/5',
      'LCD of 4 and 5 = 20',
      '3/4 = 15/20, 1/5 = 4/20',
      '15/20 + 4/20 = 19/20 kg',
    ],
    misconceptionTraps: ['adds_denominators', 'forgets_to_find_lcd'],
    tags: ['unlike-fractions', 'addition', 'word-problem'],
  },

  {
    id: 'CQ-P4-034',
    skillId: 'P4-FR-03',
    source: { school: 'Catholic High', exam: 'EOY', year: 2024, section: 'B', qn: 23 },
    type: 'open',
    marks: 2,
    prompt: '2/9 + 1/3 = ______',
    options: null,
    answer: '5/9',
    answerIndex: null,
    answerType: 'fraction',
    difficulty: 2,
    solutionSteps: [
      'LCD of 9 and 3 = 9',
      '1/3 = 3/9',
      '2/9 + 3/9 = 5/9',
    ],
    misconceptionTraps: ['adds_denominators'],
    tags: ['unlike-fractions', 'addition'],
  },

  {
    id: 'CQ-P4-035',
    skillId: 'P4-FR-03',
    source: { school: 'Catholic High', exam: 'EOY', year: 2024, section: 'B', qn: 24 },
    type: 'open',
    marks: 2,
    prompt: 'Find the value of 1 − 1/2 − 1/8.',
    options: null,
    answer: '3/8',
    answerIndex: null,
    answerType: 'fraction',
    difficulty: 3,
    solutionSteps: [
      'LCD of 2 and 8 = 8',
      '1 = 8/8, 1/2 = 4/8',
      '8/8 − 4/8 − 1/8 = 3/8',
    ],
    misconceptionTraps: ['adds_denominators', 'forgets_to_find_lcd'],
    tags: ['unlike-fractions', 'subtraction'],
  },

  {
    id: 'CQ-P4-036',
    skillId: 'P4-FR-03',
    source: { school: 'Nanyang', exam: 'WA2', year: 2025, section: 'B', qn: '6a' },
    type: 'open',
    marks: 2,
    prompt: 'Bag A weighs 1/4 kg. Bag B weighs 3/5 kg. Bag C weighs 5/8 kg. Which 2 bags, when added together, will be heavier than 1 kg?',
    options: null,
    answer: 'B and C',
    answerIndex: null,
    answerType: 'text',
    difficulty: 3,
    solutionSteps: [
      'A + B = 1/4 + 3/5 = 5/20 + 12/20 = 17/20 < 1',
      'A + C = 1/4 + 5/8 = 2/8 + 5/8 = 7/8 < 1',
      'B + C = 3/5 + 5/8 = 24/40 + 25/40 = 49/40 > 1 ✓',
    ],
    misconceptionTraps: ['adds_denominators', 'forgets_to_find_lcd'],
    tags: ['unlike-fractions', 'addition', 'comparison'],
  },

  {
    id: 'CQ-P4-037',
    skillId: 'P4-FR-03',
    source: { school: 'Nanyang', exam: 'WA2', year: 2025, section: 'B', qn: 7 },
    type: 'open',
    marks: 2,
    prompt: 'Ali drank 7/10 ℓ of water. He drank 1/5 ℓ of water more than Harry. How much water did Ali and Harry drink in total? Give your answer as a mixed number.',
    options: null,
    answer: '1 1/5',
    answerIndex: null,
    answerType: 'fraction',
    difficulty: 3,
    solutionSteps: [
      'Harry = 7/10 − 1/5 = 7/10 − 2/10 = 5/10 = 1/2',
      'Total = 7/10 + 1/2 = 7/10 + 5/10 = 12/10 = 1 2/10 = 1 1/5',
    ],
    misconceptionTraps: ['adds_denominators', 'forgets_to_simplify'],
    tags: ['unlike-fractions', 'subtraction', 'addition', 'word-problem'],
  },

  {
    id: 'CQ-P4-038',
    skillId: 'P4-FR-03',
    source: { school: 'Nanyang', exam: 'WA2', year: 2025, section: 'C', qn: '8a' },
    type: 'open',
    marks: 2,
    prompt: 'Jim had 3 pieces of rope. Rope A is the longest. Its length is 9/10 m. The difference between the lengths of Rope A and Rope B is 3/4 m. What is the length of Rope B? Give your answer in its simplest form.',
    options: null,
    answer: '3/20',
    answerIndex: null,
    answerType: 'fraction',
    difficulty: 3,
    solutionSteps: [
      'Rope B = 9/10 − 3/4',
      'LCD of 10 and 4 = 20',
      '9/10 = 18/20, 3/4 = 15/20',
      '18/20 − 15/20 = 3/20 m',
    ],
    misconceptionTraps: ['adds_denominators', 'forgets_to_find_lcd'],
    tags: ['unlike-fractions', 'subtraction', 'word-problem'],
  },

  {
    id: 'CQ-P4-039',
    skillId: 'P4-FR-03',
    source: { school: 'Nanyang', exam: 'WA2', year: 2025, section: 'C', qn: '8b' },
    type: 'open',
    marks: 2,
    prompt: 'Rope B is the shortest. Its length is 3/20 m. The difference between the lengths of Rope B and Rope C is 1/2 m. What is the length of Rope C?',
    options: null,
    answer: '13/20',
    answerIndex: null,
    answerType: 'fraction',
    difficulty: 3,
    solutionSteps: [
      'Rope C = 3/20 + 1/2',
      '1/2 = 10/20',
      '3/20 + 10/20 = 13/20 m',
    ],
    misconceptionTraps: ['adds_denominators', 'forgets_to_find_lcd'],
    tags: ['unlike-fractions', 'addition', 'word-problem'],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // P4-DEC-01  Decimal Place Value
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'CQ-P4-040',
    skillId: 'P4-DEC-01',
    source: { school: 'ACSJ', exam: 'EOY', year: 2024, section: 'A', qn: 3 },
    type: 'mcq',
    marks: 2,
    prompt: 'In which of the following does the digit 4 stand for 4 tenths?',
    options: ['14.52', '23.47', '31.24', '46.07'],
    answer: '23.47',
    answerIndex: 1,
    answerType: 'text',
    difficulty: 2,
    solutionSteps: [
      'In 23.47, the digit 4 is in the tenths place.',
      '14.52 → 4 is in the ones place.',
      '31.24 → 4 is in the hundredths place.',
      '46.07 → 4 is in the tens place.',
    ],
    misconceptionTraps: ['confuses_decimal_places'],
    tags: ['decimal-place-value', 'tenths'],
  },

  {
    id: 'CQ-P4-041',
    skillId: 'P4-DEC-01',
    source: { school: 'Catholic High', exam: 'EOY', year: 2024, section: 'A', qn: 4 },
    type: 'mcq',
    marks: 2,
    prompt: 'In the number 12.34, the digit ______ is in the tenths place.',
    options: ['1', '2', '3', '4'],
    answer: '3',
    answerIndex: 2,
    answerType: 'numeric',
    difficulty: 2,
    solutionSteps: [
      'In 12.34: 1 is tens, 2 is ones, 3 is tenths, 4 is hundredths.',
    ],
    misconceptionTraps: ['confuses_decimal_places'],
    tags: ['decimal-place-value', 'tenths'],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // P4-DEC-02  Comparing Decimals
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'CQ-P4-042',
    skillId: 'P4-DEC-02',
    source: { school: 'Catholic High', exam: 'EOY', year: 2024, section: 'A', qn: 15 },
    type: 'mcq',
    marks: 2,
    prompt: 'Arrange the following decimals in increasing order.\n7.012 , 7.1 , 7.02',
    options: [
      '7.1, 7.02, 7.012',
      '7.1, 7.012, 7.02',
      '7.02, 7.012, 7.1',
      '7.012, 7.02, 7.1',
    ],
    answer: '7.012, 7.02, 7.1',
    answerIndex: 3,
    answerType: 'text',
    difficulty: 3,
    solutionSteps: [
      'Compare tenths: all have 0 in tenths except 7.1 (which has 1).',
      '7.012 vs 7.02: hundredths are 1 vs 2 → 7.012 < 7.02',
      'Order: 7.012, 7.02, 7.1',
    ],
    misconceptionTraps: ['more_digits_means_larger'],
    tags: ['comparing-decimals', 'ordering'],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // P4-DEC-03  Rounding Decimals
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'CQ-P4-043',
    skillId: 'P4-DEC-03',
    source: { school: 'Catholic High', exam: 'EOY', year: 2024, section: 'B', qn: 27 },
    type: 'open',
    marks: 2,
    prompt: 'Round 19.52 to the nearest whole number.',
    options: null,
    answer: '20',
    answerIndex: null,
    answerType: 'numeric',
    difficulty: 2,
    solutionSteps: [
      'Look at the tenths digit: 5',
      '5 ≥ 5 → round up',
      '19.52 → 20',
    ],
    misconceptionTraps: ['rounding_five_goes_down', 'rounding_direction_error'],
    tags: ['rounding-decimals', 'nearest-whole'],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // P4-DEC-04  Adding & Subtracting Decimals
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'CQ-P4-044',
    skillId: 'P4-DEC-04',
    source: { school: 'ACSJ', exam: 'EOY', year: 2024, section: 'A', qn: 12 },
    type: 'mcq',
    marks: 2,
    prompt: '83 tenths − 37 hundredths = ______',
    options: ['0.46', '4.6', '7.93', '82.63'],
    answer: '7.93',
    answerIndex: 2,
    answerType: 'decimal',
    difficulty: 3,
    solutionSteps: [
      '83 tenths = 8.3',
      '37 hundredths = 0.37',
      '8.3 − 0.37 = 7.93',
    ],
    misconceptionTraps: ['decimal_place_alignment_error'],
    tags: ['decimal-subtraction', 'place-value-conversion'],
  },

  {
    id: 'CQ-P4-045',
    skillId: 'P4-DEC-04',
    source: { school: 'Catholic High', exam: 'EOY', year: 2024, section: 'A', qn: 14 },
    type: 'mcq',
    marks: 2,
    prompt: 'Which number is 1.3 less than 4.56?',
    options: ['3.26', '4.43', '4.69', '5.86'],
    answer: '3.26',
    answerIndex: 0,
    answerType: 'decimal',
    difficulty: 2,
    solutionSteps: [
      '4.56 − 1.3 = 4.56 − 1.30 = 3.26',
    ],
    misconceptionTraps: ['decimal_place_alignment_error'],
    tags: ['decimal-subtraction'],
  },

  {
    id: 'CQ-P4-046',
    skillId: 'P4-DEC-04',
    source: { school: 'Catholic High', exam: 'EOY', year: 2024, section: 'B', qn: 34 },
    type: 'open',
    marks: 2,
    prompt: 'Harry had $50. He bought 1 chicken sandwich at $2.70 and a fruit juice at $1.55. How much money had he left?',
    options: null,
    answer: '45.75',
    answerIndex: null,
    answerType: 'decimal',
    difficulty: 2,
    solutionSteps: [
      '$2.70 + $1.55 = $4.25',
      '$50 − $4.25 = $45.75',
    ],
    misconceptionTraps: ['decimal_place_alignment_error'],
    tags: ['decimal-subtraction', 'money', 'word-problem'],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // P4-DEC-05  Multiply/Divide Decimals by 1-digit
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'CQ-P4-047',
    skillId: 'P4-DEC-05',
    source: { school: 'Catholic High', exam: 'EOY', year: 2024, section: 'B', qn: 28 },
    type: 'open',
    marks: 2,
    prompt: 'Find the value of 17.36 × 3.',
    options: null,
    answer: '52.08',
    answerIndex: null,
    answerType: 'decimal',
    difficulty: 2,
    solutionSteps: [
      '1736 × 3 = 5208',
      'Place the decimal point 2 places from right → 52.08',
    ],
    misconceptionTraps: ['decimal_point_placement_error'],
    tags: ['decimal-multiplication'],
  },

  {
    id: 'CQ-P4-048',
    skillId: 'P4-DEC-05',
    source: { school: 'Catholic High', exam: 'EOY', year: 2024, section: 'B', qn: 35 },
    type: 'open',
    marks: 2,
    prompt: 'Parry used a total of 23.25 m of ribbon to make 6 similar flowers and 9 similar bows. How much ribbon did he use to make 2 such flowers and 3 such bows?',
    options: null,
    answer: '7.75',
    answerIndex: null,
    answerType: 'decimal',
    difficulty: 4,
    solutionSteps: [
      '6 flowers + 9 bows = 3 × (2 flowers + 3 bows)',
      'So 2 flowers + 3 bows = 23.25 ÷ 3 = 7.75 m',
    ],
    misconceptionTraps: ['decimal_point_placement_error'],
    tags: ['decimal-division', 'word-problem', 'pattern-recognition'],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // P4-DEC-06  Fraction → Decimal
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'CQ-P4-049',
    skillId: 'P4-DEC-06',
    source: { school: 'Catholic High', exam: 'EOY', year: 2024, section: 'B', qn: 26 },
    type: 'open',
    marks: 2,
    prompt: 'Express 0.93 as a fraction.',
    options: null,
    answer: '93/100',
    answerIndex: null,
    answerType: 'fraction',
    difficulty: 2,
    solutionSteps: [
      '0.93 = 93 hundredths = 93/100',
    ],
    misconceptionTraps: ['decimal_to_fraction_error'],
    tags: ['fraction-decimal-conversion'],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // P4-WP-01  Word Problem: Fraction of Quantity
  // ═══════════════════════════════════════════════════════════════════════

  // (CQ-P4-029, CQ-P4-030, CQ-P4-031 above also test this skill)

  // ═══════════════════════════════════════════════════════════════════════
  // P4-WP-02  Two-Step Word Problem
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'CQ-P4-051',
    skillId: 'P4-WP-02',
    source: { school: 'Catholic High', exam: 'EOY', year: 2024, section: 'A', qn: 9 },
    type: 'mcq',
    marks: 2,
    prompt: 'A jug contains 1200 mℓ of water and a glass contains 710 mℓ of water. How much water will the jug and 2 such glasses contain?',
    options: ['1420 mℓ', '1910 mℓ', '2400 mℓ', '2620 mℓ'],
    answer: '2620 mℓ',
    answerIndex: 3,
    answerType: 'numeric',
    difficulty: 2,
    solutionSteps: [
      '2 glasses = 2 × 710 = 1420 mℓ',
      'Total = 1200 + 1420 = 2620 mℓ',
    ],
    misconceptionTraps: ['misidentifies_operation'],
    tags: ['two-step', 'measurement', 'word-problem'],
  },

  {
    id: 'CQ-P4-054',
    skillId: 'P4-WP-02',
    source: { school: 'Catholic High', exam: 'EOY', year: 2024, section: 'B', qn: 36 },
    type: 'open',
    marks: 2,
    prompt: 'Isaac is 7 years old and his sister is 3 years old. In how many years\' time will their total age add up to 18?',
    options: null,
    answer: '4',
    answerIndex: null,
    answerType: 'numeric',
    difficulty: 3,
    solutionSteps: [
      'Current total = 7 + 3 = 10',
      'Each year, total increases by 2 (both age by 1).',
      'Need 18 − 10 = 8 more → 8 ÷ 2 = 4 years',
    ],
    misconceptionTraps: ['forgets_both_ages_increase'],
    tags: ['two-step', 'age-problem', 'word-problem'],
  },

  {
    id: 'CQ-P4-055',
    skillId: 'P4-WP-02',
    source: { school: 'Nanyang', exam: 'WA2', year: 2025, section: 'A', qn: 2 },
    type: 'mcq',
    marks: 2,
    prompt: 'The table shows the number of candies sold in a supermarket.\n\n|         | Sweets | Lollipops | Chocolates | Total |\n|---------|--------|-----------|------------|-------|\n| Saturday| ?      | 425       | 878        | 1830  |\n| Sunday  |        | 670       | ?          | 1150  |\n\nFind the number of sweets sold on Saturday.',
    options: ['527', '952', '1205', '1303'],
    answer: '527',
    answerIndex: 0,
    answerType: 'numeric',
    difficulty: 2,
    solutionSteps: [
      'Saturday total = 1830',
      'Sweets = 1830 − 425 − 878 = 527',
    ],
    misconceptionTraps: ['misidentifies_operation'],
    tags: ['table-reading', 'subtraction', 'word-problem'],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // P4-STAT-01  Table / Data Reading (mapped to Statistics)
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'CQ-P4-057',
    skillId: 'P4-STAT-01',
    source: { school: 'ACSJ', exam: 'EOY', year: 2024, section: 'A', qn: 10 },
    type: 'mcq',
    marks: 2,
    prompt: 'The table shows the number of families in a condominium keeping a certain number of pets.\n\n| Number of pets    | 0  | 1  | 2  | 3 | 4 |\n|-------------------|----|----|----|---|---|\n| Number of families| 12 | 28 | 15 | 7 | 3 |\n\nHow many families keep 2 pets or more?',
    options: ['10', '15', '25', '65'],
    answer: '25',
    answerIndex: 2,
    answerType: 'numeric',
    difficulty: 2,
    solutionSteps: [
      'Families with 2+ pets = 15 + 7 + 3 = 25',
    ],
    misconceptionTraps: ['misreads_table'],
    tags: ['table-reading', 'data-interpretation'],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // BATCH 2 — Henry Park EOY 2023  +  Nanyang EOY 2023
  // ═══════════════════════════════════════════════════════════════════════

  // -----------------------------------------------------------------------
  // P4-WN-03  Number Patterns  (gap fill — was 1 question)
  // -----------------------------------------------------------------------

  {
    id: 'CQ-P4-058',
    skillId: 'P4-WN-03',
    source: { school: 'Henry Park', exam: 'EOY', year: 2023, section: 'A', qn: 2 },
    type: 'mcq',
    marks: 2,
    prompt: 'Complete the following number pattern.\n7, 11, 15, ___, ___, 27',
    options: ['16, 17', '16, 26', '19, 20', '19, 23'],
    answer: '19, 23',
    answerIndex: 3,
    answerType: 'numeric',
    difficulty: 2,
    solutionSteps: [
      'Find the rule: 11 − 7 = 4, 15 − 11 = 4 → add 4 each time',
      '15 + 4 = 19',
      '19 + 4 = 23',
      'Check: 23 + 4 = 27 ✓',
    ],
    misconceptionTraps: ['wrong_rule_identified', 'arithmetic_slip'],
    tags: ['number-pattern', 'addition-rule'],
  },

  {
    id: 'CQ-P4-059',
    skillId: 'P4-WN-03',
    source: { school: 'Nanyang', exam: 'EOY', year: 2023, section: 'A', qn: 13 },
    type: 'mcq',
    marks: 2,
    prompt: 'Study the number pattern below.\n\n| 100 | 120 | 140 | 160 | 180 |\n| 250, 300 | 270, 360 | 290, 420 | ?, ? | 330, 540 |\n\nWhat is the sum of the two missing numbers?',
    options: ['310', '480', '670', '790'],
    answer: '790',
    answerIndex: 3,
    answerType: 'numeric',
    difficulty: 3,
    solutionSteps: [
      'Middle row pattern: 250, 270, 290, ?, 330 → +20 each time → ? = 310',
      'Bottom row pattern: 300, 360, 420, ?, 540 → +60 each time → ? = 480',
      'Sum = 310 + 480 = 790',
    ],
    misconceptionTraps: ['only_finds_one_pattern', 'wrong_rule_identified'],
    tags: ['number-pattern', 'two-variable-pattern', 'table'],
  },

  // -----------------------------------------------------------------------
  // P4-FO-02  Multiply 3-digit × 2-digit  (gap fill — was 1 question)
  // -----------------------------------------------------------------------

  {
    id: 'CQ-P4-060',
    skillId: 'P4-FO-02',
    source: { school: 'Nanyang', exam: 'EOY', year: 2023, section: 'A', qn: 7 },
    type: 'mcq',
    marks: 2,
    prompt: 'Nelly sells 384 muffins every month. How many muffins will she sell in a year?',
    options: ['4608', '3408', '1608', '1152'],
    answer: '4608',
    answerIndex: 0,
    answerType: 'numeric',
    difficulty: 2,
    solutionSteps: [
      '1 year = 12 months',
      '384 × 12 = 384 × 10 + 384 × 2 = 3840 + 768 = 4608',
    ],
    misconceptionTraps: ['multiplication_carry_error', 'uses_wrong_months'],
    tags: ['multiplication', '3by2', 'word-problem'],
  },

  // -----------------------------------------------------------------------
  // P4-FO-03  Divide 4-digit ÷ 1-digit
  // -----------------------------------------------------------------------

  {
    id: 'CQ-P4-061',
    skillId: 'P4-FO-03',
    source: { school: 'Henry Park', exam: 'EOY', year: 2023, section: 'B', qn: 12 },
    type: 'open',
    marks: 2,
    prompt: '5964 ÷ 7 = ___',
    options: null,
    answer: '852',
    answerIndex: null,
    answerType: 'numeric',
    difficulty: 2,
    solutionSteps: [
      '5964 ÷ 7: 7 × 800 = 5600, remainder 364',
      '364 ÷ 7 = 52',
      '5964 ÷ 7 = 852',
    ],
    misconceptionTraps: ['long_division_error', 'remainder_confusion'],
    tags: ['division', '4by1'],
  },

  // -----------------------------------------------------------------------
  // P4-FM-02  Common Multiples / LCM
  // -----------------------------------------------------------------------

  {
    id: 'CQ-P4-062',
    skillId: 'P4-FM-02',
    source: { school: 'Henry Park', exam: 'EOY', year: 2023, section: 'B', qn: 22 },
    type: 'open',
    marks: 2,
    prompt: 'Xiao Hui had more than 10 and fewer than 40 candies. When she packed the candies in bags of 7, she was left with 2 candies. When she packed them in bags of 3, she had no candies left. How many candies did Xiao Hui have?',
    options: null,
    answer: '30',
    answerIndex: null,
    answerType: 'numeric',
    difficulty: 3,
    solutionSteps: [
      'Number is a multiple of 3 (no remainder when ÷ 3)',
      'Multiples of 3 between 10 and 40: 12, 15, 18, 21, 24, 27, 30, 33, 36, 39',
      'Number gives remainder 2 when ÷ 7',
      '30 ÷ 7 = 4 R 2 ✓',
    ],
    misconceptionTraps: ['forgets_range_constraint', 'confuses_remainder'],
    tags: ['multiples', 'divisibility', 'remainder', 'word-problem'],
  },

  // -----------------------------------------------------------------------
  // P4-DEC-01  Decimal Place Value
  // -----------------------------------------------------------------------

  {
    id: 'CQ-P4-063',
    skillId: 'P4-DEC-01',
    source: { school: 'Henry Park', exam: 'EOY', year: 2023, section: 'A', qn: 5 },
    type: 'mcq',
    marks: 2,
    prompt: 'In which of the following numbers does the digit 7 stand for 7 tenths?',
    options: ['413.75', '371.54', '237.68', '123.17'],
    answer: '413.75',
    answerIndex: 0,
    answerType: 'numeric',
    difficulty: 2,
    solutionSteps: [
      '413.75 → 7 is in the tenths place = 7 tenths ✓',
      '371.54 → 7 is in the tens place = 70',
      '237.68 → 7 is in the ones place = 7',
      '123.17 → 7 is in the hundredths place = 7 hundredths',
    ],
    misconceptionTraps: ['confuses_tenths_hundredths', 'confuses_place_value'],
    tags: ['decimal-place-value', 'tenths'],
  },

  {
    id: 'CQ-P4-064',
    skillId: 'P4-DEC-01',
    source: { school: 'Henry Park', exam: 'EOY', year: 2023, section: 'B', qn: 17 },
    type: 'open',
    marks: 2,
    prompt: 'Write 5 thousandths as a decimal.',
    options: null,
    answer: '0.005',
    answerIndex: null,
    answerType: 'decimal',
    difficulty: 2,
    solutionSteps: [
      '5 thousandths = 5/1000 = 0.005',
    ],
    misconceptionTraps: ['wrong_number_of_zeros', 'confuses_thousandths_hundredths'],
    tags: ['decimal-place-value', 'thousandths', 'conversion'],
  },

  // -----------------------------------------------------------------------
  // P4-DEC-02  Comparing Decimals  (gap fill — was 1 question)
  // -----------------------------------------------------------------------

  {
    id: 'CQ-P4-065',
    skillId: 'P4-DEC-02',
    source: { school: 'Henry Park', exam: 'EOY', year: 2023, section: 'A', qn: 4 },
    type: 'mcq',
    marks: 2,
    prompt: 'Which of the following decimals is the smallest?',
    options: ['4.07', '4.18', '4.032', '4.85'],
    answer: '4.032',
    answerIndex: 2,
    answerType: 'decimal',
    difficulty: 2,
    solutionSteps: [
      'All start with 4, so compare decimal parts',
      '4.032 = 4 + 0.032',
      '4.07 = 4 + 0.070',
      '0.032 < 0.070 < 0.180 < 0.850',
      'Smallest is 4.032',
    ],
    misconceptionTraps: ['compares_digit_count_not_value', 'ignores_trailing_zeros'],
    tags: ['comparing-decimals', 'ordering'],
  },

  // -----------------------------------------------------------------------
  // P4-DEC-03  Rounding Decimals  (gap fill — was 1 question)
  // -----------------------------------------------------------------------

  {
    id: 'CQ-P4-066',
    skillId: 'P4-DEC-03',
    source: { school: 'Henry Park', exam: 'EOY', year: 2023, section: 'B', qn: 18 },
    type: 'open',
    marks: 2,
    prompt: 'Round 117.65 to the nearest whole number.',
    options: null,
    answer: '118',
    answerIndex: null,
    answerType: 'numeric',
    difficulty: 1,
    solutionSteps: [
      'Look at the tenths digit: 6 ≥ 5, so round up',
      '117.65 → 118',
    ],
    misconceptionTraps: ['rounds_down_at_5', 'rounds_to_wrong_place'],
    tags: ['rounding-decimals', 'nearest-whole'],
  },

  {
    id: 'CQ-P4-067',
    skillId: 'P4-DEC-03',
    source: { school: 'Henry Park', exam: 'EOY', year: 2023, section: 'B', qn: 23 },
    type: 'open',
    marks: 2,
    prompt: 'Jeremy thought of a decimal number with 3 decimal places. When he rounded the number to the nearest hundredth, the value was 10.05. Find the greatest possible value of the decimal number Jeremy thought of.',
    options: null,
    answer: '10.054',
    answerIndex: null,
    answerType: 'decimal',
    difficulty: 4,
    solutionSteps: [
      'Number rounds to 10.05 at the hundredths place',
      'Range: 10.045 ≤ number < 10.055',
      'Greatest 3-decimal-place number less than 10.055 is 10.054',
    ],
    misconceptionTraps: ['off_by_one_rounding_boundary', 'gives_10.055'],
    tags: ['rounding-decimals', 'reverse-rounding', 'problem-solving'],
  },

  // -----------------------------------------------------------------------
  // P4-DEC-04  Adding & Subtracting Decimals
  // -----------------------------------------------------------------------

  {
    id: 'CQ-P4-068',
    skillId: 'P4-DEC-04',
    source: { school: 'Henry Park', exam: 'EOY', year: 2023, section: 'B', qn: 24 },
    type: 'open',
    marks: 2,
    prompt: 'The difference between two numbers is 6.18. Given the larger number is 8.03, find the value of the smaller number.',
    options: null,
    answer: '1.85',
    answerIndex: null,
    answerType: 'decimal',
    difficulty: 2,
    solutionSteps: [
      'Smaller number = larger number − difference',
      '8.03 − 6.18 = 1.85',
    ],
    misconceptionTraps: ['adds_instead_of_subtracts', 'decimal_borrowing_error'],
    tags: ['decimal-subtraction', 'word-problem'],
  },

  // -----------------------------------------------------------------------
  // P4-STAT-01  Table / Data Reading  (gap fill — was 1 question)
  // -----------------------------------------------------------------------

  {
    id: 'CQ-P4-069',
    skillId: 'P4-STAT-01',
    source: { school: 'Henry Park', exam: 'EOY', year: 2023, section: 'B', qn: 21 },
    type: 'open',
    marks: 2,
    prompt: 'The table below shows the number of pets that students have at home.\n\n| Pets per student | 0 | 1 | 2 | 3 | 4 |\n| Number of students | 12 | 15 | 3 | 9 | 1 |\n\nHow many students have more than 2 pets?',
    options: null,
    answer: '10',
    answerIndex: null,
    answerType: 'numeric',
    difficulty: 2,
    solutionSteps: [
      'More than 2 pets means 3 pets or 4 pets',
      '9 + 1 = 10 students',
    ],
    misconceptionTraps: ['includes_2_pets', 'misreads_table'],
    tags: ['table-reading', 'data-interpretation'],
  },

  // -----------------------------------------------------------------------
  // P4-WP-01  Word Problem: Fraction of Quantity  (gap fill — was 0!)
  // -----------------------------------------------------------------------

  {
    id: 'CQ-P4-070',
    skillId: 'P4-WP-01',
    source: { school: 'Henry Park', exam: 'EOY', year: 2023, section: 'B', qn: 32 },
    type: 'open',
    marks: 2,
    prompt: 'Ramli spent 1/3 of his monthly salary on a television. He spent 2/9 of his salary on food and saved the rest. Given that Ramli saved $2392, how much did Ramli spend on food?',
    options: null,
    answer: '1196',
    answerIndex: null,
    answerType: 'numeric',
    difficulty: 4,
    solutionSteps: [
      'Fraction spent = 1/3 + 2/9 = 3/9 + 2/9 = 5/9',
      'Fraction saved = 1 − 5/9 = 4/9',
      '4/9 of salary = $2392',
      'Salary = $2392 × 9 ÷ 4 = $5382',
      'Food = 2/9 × $5382 = $1196',
    ],
    misconceptionTraps: ['forgets_to_find_whole', 'wrong_lcd', 'finds_total_spent_not_food'],
    tags: ['fraction-of-quantity', 'multi-step', 'money'],
  },

  // -----------------------------------------------------------------------
  // P4-WP-02  Two-Step Word Problems
  // -----------------------------------------------------------------------

  {
    id: 'CQ-P4-071',
    skillId: 'P4-WP-02',
    source: { school: 'Henry Park', exam: 'EOY', year: 2023, section: 'B', qn: 30 },
    type: 'open',
    marks: 2,
    prompt: 'The table below shows the entrance fees to the Singapore Zoo.\n\n|  | Mon\u2013Fri | Sat & Sun |\n| Adult | $48 | $58 |\n| Child (3\u201312 years) | $33 | $43 |\n| Senior (60 and above) | $20 | $25 |\n\nOn Sunday, Mr and Mrs Fong, their ten-year-old child and sixty-five-year-old mother visited the Singapore Zoo. How much did the family pay for entrance fees altogether?',
    options: null,
    answer: '184',
    answerIndex: null,
    answerType: 'numeric',
    difficulty: 3,
    solutionSteps: [
      'Sunday prices: Adult $58, Child $43, Senior $25',
      'Mr Fong (adult) + Mrs Fong (adult) + child + mother (senior)',
      '2 × $58 + $43 + $25 = $116 + $43 + $25 = $184',
    ],
    misconceptionTraps: ['uses_weekday_prices', 'miscounts_family_members', 'wrong_age_category'],
    tags: ['table-reading', 'multi-step', 'money'],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // BATCH 3 — ACSJ CA2 (Bite-Sized Assessment Two) 2021
  // ═══════════════════════════════════════════════════════════════════════

  // -----------------------------------------------------------------------
  // P4-WP-01  Word Problem: Fraction of Quantity  (gap fill continues)
  // -----------------------------------------------------------------------

  {
    id: 'CQ-P4-074',
    skillId: 'P4-WP-01',
    source: { school: 'ACSJ', exam: 'CA2', year: 2021, section: 'A', qn: 5 },
    type: 'mcq',
    marks: 2,
    prompt: 'Uncle Alan bought some fruits. 5/9 of the fruits were mangoes and the rest were oranges. He used 12 oranges to make a jug of orange juice and had 16 oranges left. How many fruits did he buy?',
    options: ['20', '28', '36', '63'],
    answer: '63',
    answerIndex: 3,
    answerType: 'numeric',
    difficulty: 3,
    solutionSteps: [
      'Fraction that are oranges = 1 − 5/9 = 4/9',
      'Total oranges = 12 + 16 = 28',
      '4/9 of total = 28',
      'Total = 28 × 9 ÷ 4 = 63',
    ],
    misconceptionTraps: ['uses_wrong_fraction', 'forgets_to_add_oranges'],
    tags: ['fraction-of-quantity', 'multi-step', 'fruits'],
  },

  {
    id: 'CQ-P4-075',
    skillId: 'P4-WP-01',
    source: { school: 'ACSJ', exam: 'CA2', year: 2021, section: 'C', qn: 11 },
    type: 'open',
    marks: 3,
    prompt: 'Charles and Dennis shared some stickers. Charles took 3/11 of the stickers and Dennis took the rest. Charles had 120 fewer stickers than Dennis. How many stickers did Charles and Dennis have altogether?',
    options: null,
    answer: '264',
    answerIndex: null,
    answerType: 'numeric',
    difficulty: 4,
    solutionSteps: [
      'Charles = 3/11, Dennis = 8/11',
      'Difference = 8/11 − 3/11 = 5/11 of total',
      '5/11 of total = 120',
      'Total = 120 × 11 ÷ 5 = 264',
    ],
    misconceptionTraps: ['subtracts_fractions_wrong', 'finds_one_share_not_total'],
    tags: ['fraction-of-quantity', 'comparison', 'sharing'],
  },

  {
    id: 'CQ-P4-076',
    skillId: 'P4-WP-01',
    source: { school: 'ACSJ', exam: 'CA2', year: 2021, section: 'C', qn: '13a' },
    type: 'open',
    marks: 1,
    prompt: 'Kieran spent 3/4 of his money and saved the rest. He saved $78. How much money did Kieran have?',
    options: null,
    answer: '312',
    answerIndex: null,
    answerType: 'numeric',
    difficulty: 2,
    solutionSteps: [
      'Fraction saved = 1 − 3/4 = 1/4',
      '1/4 of total = $78',
      'Total = $78 × 4 = $312',
    ],
    misconceptionTraps: ['uses_spent_fraction_for_saved', 'divides_instead_of_multiplies'],
    tags: ['fraction-of-quantity', 'money'],
  },

  {
    id: 'CQ-P4-077',
    skillId: 'P4-WP-01',
    source: { school: 'ACSJ', exam: 'CA2', year: 2021, section: 'C', qn: '13b' },
    type: 'open',
    marks: 3,
    prompt: 'Kieran and Bernard had an equal amount of money. Kieran spent 3/4 of his money and saved the rest. He saved $78. Bernard spent 5/8 of his money and saved the rest. How much did Bernard save?',
    options: null,
    answer: '117',
    answerIndex: null,
    answerType: 'numeric',
    difficulty: 4,
    solutionSteps: [
      'Kieran saved 1/4 of his money = $78',
      'Total each person had = $78 × 4 = $312',
      'Bernard saved 1 − 5/8 = 3/8 of $312',
      '3/8 × $312 = $117',
    ],
    misconceptionTraps: ['forgets_to_find_total_first', 'uses_wrong_fraction_for_bernard'],
    tags: ['fraction-of-quantity', 'multi-step', 'money', 'comparison'],
  },

  // -----------------------------------------------------------------------
  // P4-DEC-05  Multiply / Divide Decimals by 1-digit
  // -----------------------------------------------------------------------

  {
    id: 'CQ-P4-078',
    skillId: 'P4-DEC-05',
    source: { school: 'ACSJ', exam: 'CA2', year: 2021, section: 'B', qn: 9 },
    type: 'open',
    marks: 2,
    prompt: 'Alice bought a roll of rope. She used 1.25 m of the rope to tie a box. After tying 9 similar boxes, she had 12.3 m of rope left. What was the total length of the roll of rope she bought?',
    options: null,
    answer: '23.55',
    answerIndex: null,
    answerType: 'decimal',
    difficulty: 3,
    solutionSteps: [
      'Rope used = 1.25 × 9 = 11.25 m',
      'Total = 11.25 + 12.3 = 23.55 m',
    ],
    misconceptionTraps: ['multiplication_decimal_error', 'forgets_remaining_rope'],
    tags: ['decimal-multiply', 'word-problem', 'measurement'],
  },

  // ── Batch 4 — Thin-skill depth (Raffles 2022, Catholic High WA3 2024) ──

  {
    id: 'CQ-P4-079',
    skillId: 'P4-DEC-02',
    source: { school: 'Catholic High', exam: 'WA3', year: 2024, section: 'A', qn: 2 },
    type: 'mcq',
    marks: 2,
    prompt: 'Arrange the following decimals in decreasing order.\n\n6.49 , 6.049 , 6.409 , 6.904',
    options: [
      '6.904 , 6.49 , 6.409 , 6.049',
      '6.904 , 6.409 , 6.49 , 6.049',
      '6.049 , 6.409 , 6.49 , 6.904',
      '6.049 , 6.49 , 6.409 , 6.904',
    ],
    answer: '6.904 , 6.49 , 6.409 , 6.049',
    answerIndex: 0,
    answerType: 'exact',
    difficulty: 2,
    solutionSteps: [
      'Compare the ones digit: all are 6, so compare tenths.',
      '6.904 has 9 tenths — largest.',
      '6.49 has 4 tenths, 6.409 has 4 tenths — compare hundredths: 9 > 0, so 6.49 > 6.409.',
      '6.049 has 0 tenths — smallest.',
      'Decreasing order: 6.904, 6.49, 6.409, 6.049',
    ],
    misconceptionTraps: ['confuses_more_digits_with_larger', 'ignores_trailing_zeros'],
    tags: ['decimal-ordering', 'place-value', 'decreasing'],
  },
  {
    id: 'CQ-P4-080',
    skillId: 'P4-DEC-02',
    source: { school: 'Raffles', exam: 'EOY', year: 2022, section: 'A', qn: 9 },
    type: 'mcq',
    marks: 2,
    prompt: 'Arrange the following decimals from the smallest to the greatest.\n\n5.8 , 0.58 , 5.08 , 0.85',
    options: [
      '0.58 , 0.85 , 5.08 , 5.8',
      '0.85 , 0.58 , 5.08 , 5.8',
      '0.58 , 5.8 , 5.08 , 0.85',
      '0.85 , 0.58 , 5.8 , 5.08',
    ],
    answer: '0.58 , 0.85 , 5.08 , 5.8',
    answerIndex: 0,
    answerType: 'exact',
    difficulty: 2,
    solutionSteps: [
      'Compare ones digits first: 0.58 and 0.85 have 0 ones; 5.08 and 5.8 have 5 ones.',
      '0.58 vs 0.85: compare tenths — 5 < 8, so 0.58 < 0.85.',
      '5.08 vs 5.8: compare tenths — 0 < 8, so 5.08 < 5.8.',
      'Smallest to greatest: 0.58, 0.85, 5.08, 5.8',
    ],
    misconceptionTraps: ['compares_digits_left_to_right_without_place_value', 'confuses_0.85_and_0.58'],
    tags: ['decimal-ordering', 'place-value', 'ascending'],
  },
  {
    id: 'CQ-P4-081',
    skillId: 'P4-FO-01',
    source: { school: 'Raffles', exam: 'EOY', year: 2022, section: 'A', qn: 14 },
    type: 'mcq',
    marks: 2,
    prompt: 'The chairs in a theatre were arranged equally in rows. There were 11 rows of chairs. Mark sat at the fourth row. 7 people were seated on his right and 9 people were seated on his left. How many chairs were there in the theatre?',
    options: ['27', '176', '187', '693'],
    answer: '187',
    answerIndex: 2,
    answerType: 'numeric',
    difficulty: 2,
    solutionSteps: [
      'Chairs in one row = 7 (right) + 1 (Mark) + 9 (left) = 17',
      'Total chairs = 17 × 11 = 187',
    ],
    misconceptionTraps: ['forgets_to_count_mark', 'multiplies_by_4_instead_of_11', 'adds_instead_of_multiplies'],
    tags: ['multiplication', 'word-problem', 'seating'],
  },
  {
    id: 'CQ-P4-082',
    skillId: 'P4-DEC-06',
    source: { school: 'Raffles', exam: 'EOY', year: 2022, section: 'B', qn: 27 },
    type: 'open',
    marks: 2,
    prompt: '3 cupcakes cost $2.95. How much do 12 cupcakes cost?',
    options: null,
    answer: '$11.80',
    answerIndex: null,
    answerType: 'money',
    difficulty: 2,
    solutionSteps: [
      'Number of groups of 3 in 12 = 12 ÷ 3 = 4',
      'Cost of 12 cupcakes = $2.95 × 4 = $11.80',
    ],
    misconceptionTraps: ['multiplies_by_12_instead_of_4', 'decimal_multiplication_error'],
    tags: ['decimal-multiply', 'word-problem', 'money'],
  },
  {
    id: 'CQ-P4-083',
    skillId: 'P4-DEC-06',
    source: { school: 'Raffles', exam: 'EOY', year: 2022, section: 'B', qn: 34 },
    type: 'open',
    marks: 2,
    prompt: 'Mrs Goh bought a dress and 2 skirts for $250. The dress cost $71.50 more than a skirt. How much was the cost of 1 skirt?',
    options: null,
    answer: '$59.50',
    answerIndex: null,
    answerType: 'money',
    difficulty: 3,
    solutionSteps: [
      'Let the cost of 1 skirt = S. Then dress = S + $71.50.',
      '(S + $71.50) + 2S = $250',
      '3S + $71.50 = $250',
      '3S = $250 − $71.50 = $178.50',
      '1 skirt = $178.50 ÷ 3 = $59.50',
    ],
    misconceptionTraps: ['subtracts_71.50_from_250_then_divides_by_2', 'forgets_dress_is_also_bought'],
    tags: ['decimal-divide', 'decimal-subtract', 'word-problem', 'comparison'],
  },
  {
    id: 'CQ-P4-084',
    skillId: 'P4-DEC-06',
    source: { school: 'Raffles', exam: 'EOY', year: 2022, section: 'C', qn: 36 },
    type: 'open',
    marks: 3,
    prompt: 'A pen cost $1.20 and a ruler cost $0.40. Sue bought 6 pens and 5 rulers. How much more did she pay for the pens than the rulers?',
    options: null,
    answer: '$5.20',
    answerIndex: null,
    answerType: 'money',
    difficulty: 2,
    solutionSteps: [
      'Cost of 6 pens = $1.20 × 6 = $7.20',
      'Cost of 5 rulers = $0.40 × 5 = $2.00',
      'Difference = $7.20 − $2.00 = $5.20',
    ],
    misconceptionTraps: ['adds_totals_instead_of_finding_difference', 'decimal_multiplication_error'],
    tags: ['decimal-multiply', 'decimal-subtract', 'word-problem', 'comparison'],
  },
  {
    id: 'CQ-P4-085',
    skillId: 'P4-DEC-06',
    source: { school: 'Raffles', exam: 'EOY', year: 2022, section: 'C', qn: 40 },
    type: 'open',
    marks: 2,
    prompt: 'The total mass of an empty box and 5 similar metal balls was 2.6 kg. The total mass of the same empty box and 3 similar metal balls was 2.34 kg. What was the mass of 1 metal ball?',
    options: null,
    answer: '0.13 kg',
    answerIndex: null,
    answerType: 'decimal',
    difficulty: 3,
    solutionSteps: [
      'Mass of 2 metal balls = 2.6 − 2.34 = 0.26 kg',
      'Mass of 1 metal ball = 0.26 ÷ 2 = 0.13 kg',
    ],
    misconceptionTraps: ['subtracts_balls_count_wrong', 'divides_by_5_instead_of_2'],
    tags: ['decimal-subtract', 'decimal-divide', 'word-problem', 'simultaneous'],
  },
  {
    id: 'CQ-P4-086',
    skillId: 'P4-STAT-01',
    source: { school: 'Raffles', exam: 'EOY', year: 2022, section: 'B', qn: 33 },
    type: 'open',
    marks: 2,
    prompt: 'The table shows the number of siblings that the pupils in 5A have.\n\n| Number of siblings | Number of pupils in 5A |\n|---|---|\n| 0 | 9 |\n| 1 | 15 |\n| 2 | 8 |\n| 3 | 7 |\n| 4 | 5 |\n\nHow many pupils have at least 2 siblings?',
    options: null,
    answer: '20',
    answerIndex: null,
    answerType: 'numeric',
    difficulty: 1,
    solutionSteps: [
      '"At least 2" means 2 or more siblings.',
      'Pupils with 2 siblings = 8, with 3 = 7, with 4 = 5.',
      'Total = 8 + 7 + 5 = 20',
    ],
    misconceptionTraps: ['includes_1_sibling_row', 'reads_at_least_as_exactly', 'adds_all_rows'],
    tags: ['table-reading', 'at-least', 'addition'],
  },
  {
    id: 'CQ-P4-087',
    skillId: 'P4-FR-01',
    source: { school: 'Raffles', exam: 'EOY', year: 2022, section: 'B', qn: 23 },
    type: 'open',
    marks: 2,
    prompt: 'Which two of the fractions below are smaller than ½?\n\n2/11 , 3/10 , 4/8 , 5/7',
    options: null,
    answer: '2/11 and 3/10',
    answerIndex: null,
    answerType: 'fraction',
    difficulty: 2,
    solutionSteps: [
      'Compare each fraction to ½:',
      '2/11: half of 11 is 5.5, and 2 < 5.5 → 2/11 < ½ ✓',
      '3/10: half of 10 is 5, and 3 < 5 → 3/10 < ½ ✓',
      '4/8 = ½ → not smaller than ½ ✗',
      '5/7: half of 7 is 3.5, and 5 > 3.5 → 5/7 > ½ ✗',
      'Answer: 2/11 and 3/10',
    ],
    misconceptionTraps: ['thinks_4_8_is_less_than_half', 'compares_numerators_only'],
    tags: ['fraction-comparison', 'benchmark-half'],
  },
  {
    id: 'CQ-P4-088',
    skillId: 'P4-DEC-03',
    source: { school: 'Raffles', exam: 'EOY', year: 2022, section: 'B', qn: 22 },
    type: 'open',
    marks: 2,
    prompt: '9.31 − 5.46 = ______',
    options: null,
    answer: '3.85',
    answerIndex: null,
    answerType: 'decimal',
    difficulty: 1,
    solutionSteps: [
      'Line up decimal points: 9.31 − 5.46',
      'Hundredths: 1 − 6 → borrow, 11 − 6 = 5',
      'Tenths: 2 − 4 → borrow, 12 − 4 = 8 (after borrowing: 3 became 2)',
      'Ones: 8 − 5 = 3',
      'Answer: 3.85',
    ],
    misconceptionTraps: ['borrows_incorrectly', 'subtracts_smaller_from_larger_in_each_column'],
    tags: ['decimal-subtract', 'regrouping'],
  },

];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

const questionsById = new Map(p4CuratedQuestions.map((q) => [q.id, q]));
const questionsBySkill = new Map();
p4CuratedQuestions.forEach((q) => {
  if (!questionsBySkill.has(q.skillId)) questionsBySkill.set(q.skillId, []);
  questionsBySkill.get(q.skillId).push(q);
});

/** Get a single curated question by its ID */
export function getCuratedQuestion(id) {
  return questionsById.get(id) || null;
}

/** Get all curated questions for a skill */
export function getCuratedQuestionsBySkill(skillId) {
  return questionsBySkill.get(skillId) || [];
}

/** Get all skill IDs that have curated questions */
export function getCuratedSkillIds() {
  return [...questionsBySkill.keys()];
}

/** Pick a random curated question for a skill */
export function pickRandomCurated(skillId) {
  const pool = getCuratedQuestionsBySkill(skillId);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Summary statistics */
export function getCuratedBankSummary() {
  const bySkill = {};
  const bySchool = {};
  const byType = { mcq: 0, open: 0 };

  p4CuratedQuestions.forEach((q) => {
    bySkill[q.skillId] = (bySkill[q.skillId] || 0) + 1;
    bySchool[q.source.school] = (bySchool[q.source.school] || 0) + 1;
    byType[q.type]++;
  });

  return {
    totalQuestions: p4CuratedQuestions.length,
    skillsCovered: Object.keys(bySkill).length,
    bySkill,
    bySchool,
    byType,
  };
}

export default {
  version: '1.0.0',
  level: 'P4',
  totalQuestions: p4CuratedQuestions.length,
  questions: p4CuratedQuestions,
};
