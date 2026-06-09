const misconceptions = [
  {
    tag: 'skip_count_objects',
    label: 'Skips objects or counts same object twice',
    description: 'Misses objects or double-counts when counting a set, losing track of which objects have been counted.',
    remediationExplanation: 'Touch and move each object as you count. Say one number for each object. Push counted objects to one side.',
    visualScaffold: 'touch_count_animation',
    recheckPattern: 'Count a new set of scattered objects.',
    parentNote: 'Use physical objects at home — buttons, coins, or fruit. Have your child move each item as they count.',
    relatedSkills: ['P1-NUM-01', 'P1-NUM-03', 'P1-NUM-05', 'P1-NUM-07'],
  },
  {
    tag: 'reverses_digits',
    label: 'Writes digits backwards (e.g. writes 6 as ε)',
    description: 'Writes numerals as mirror images, commonly reversing 2, 3, 5, 6, 7, or 9.',
    remediationExplanation: 'This is very common for young children. Practise tracing the correct direction. Start from the top for most digits.',
    visualScaffold: 'digit_tracing_guide',
    recheckPattern: 'Write the numeral for a given number.',
    parentNote: 'Provide tracing worksheets. Point out which direction each stroke goes. This usually resolves with practice.',
    relatedSkills: ['P1-NUM-02', 'P1-NUM-04', 'P1-NUM-06', 'P1-NUM-08'],
  },
  {
    tag: 'teens_counting_error',
    label: 'Mistakes in the teen numbers (11–19)',
    description: 'Confuses the order of teen numbers, e.g. counting 12, 14, 13 or saying "ten-two" instead of twelve.',
    remediationExplanation: 'Teen numbers are tricky because their names don\'t follow a simple pattern. Practise counting 11 to 20 regularly. Use a number chart.',
    visualScaffold: 'teens_number_chart',
    recheckPattern: 'Count a set of 13–19 objects.',
    parentNote: 'The names "eleven" and "twelve" are irregular in English. Practise counting objects between 10 and 20 every day.',
    relatedSkills: ['P1-NUM-03', 'P1-NUM-04'],
  },
  {
    tag: 'loses_count_past_20',
    label: 'Loses track when counting above 20',
    description: 'Counts accurately to 20 but then skips numbers, repeats, or stalls when counting beyond 20 (especially at decade transitions like 29→30).',
    remediationExplanation: 'The pattern after 20 is regular: twenty-one, twenty-two, ... When you reach twenty-nine, the next number starts a new group of ten: thirty. Use a hundred chart.',
    visualScaffold: 'hundred_chart',
    recheckPattern: 'Count a set of 25–40 objects.',
    parentNote: 'Use a printed hundred chart. Point out the pattern in each row. Practise counting across decade boundaries (29→30, 39→40).',
    relatedSkills: ['P1-NUM-05', 'P1-NUM-07'],
  },
  {
    tag: 'number_bond_recall_error',
    label: 'Incorrect recall of number bonds to 10',
    description: 'Gives the wrong pair for a number bond, e.g. says 3 + 6 = 10 instead of 3 + 7 = 10.',
    remediationExplanation: 'Number bonds to 10 are important facts. Practise with ten-frames: fill in one part and count the empty spaces.',
    visualScaffold: 'ten_frame',
    recheckPattern: 'Find the missing number: ? + 6 = 10.',
    parentNote: 'Make flashcards for all pairs that add to 10 (1+9, 2+8, 3+7, 4+6, 5+5). Daily 2-minute drills help.',
    relatedSkills: ['P1-NUM-09'],
  },
  {
    tag: 'confuses_more_less_symbols',
    label: 'Mixes up > and < symbols',
    description: 'Uses the wrong comparison symbol, e.g. writes 5 > 8 instead of 5 < 8.',
    remediationExplanation: 'The symbol always opens toward the bigger number. Think of it as a hungry crocodile that eats the bigger number. 5 < 8 means 5 is less than 8.',
    visualScaffold: 'crocodile_comparison',
    recheckPattern: 'Compare two new numbers using > or <.',
    parentNote: 'Draw a "hungry alligator" that always opens its mouth toward the larger number. This visual trick helps many children remember.',
    relatedSkills: ['P1-NUM-10', 'P1-NUM-11'],
  },
  {
    tag: 'pattern_direction_error',
    label: 'Counts forwards when pattern goes backwards (or vice versa)',
    description: 'Fills in a number pattern going in the wrong direction, e.g. writes 26 instead of 24 in the sequence 22, 23, ?, 25.',
    remediationExplanation: 'Look at the pattern carefully. Are the numbers getting bigger or smaller? Check whether you need to add or subtract.',
    visualScaffold: 'number_line_arrows',
    recheckPattern: 'Complete a new counting pattern.',
    parentNote: 'Ask your child: are these numbers going up or down? Then ask: by how much? Practise with a number line.',
    relatedSkills: ['P1-NUM-12'],
  },
  {
    tag: 'skip_count_reverts_to_ones',
    label: 'Starts skip-counting correctly but reverts to counting by 1s',
    description: 'Begins a skip-count pattern (2, 4, 6) but then switches to counting by ones (2, 4, 6, 7, 8...).',
    remediationExplanation: 'Keep the same skip each time. If you are counting by 2s, always add 2 to the last number. Write "+2" between each number to stay on track.',
    visualScaffold: 'skip_count_number_line',
    recheckPattern: 'Continue: 5, 10, 15, ?, ?',
    parentNote: 'Practise skip-counting with physical objects grouped in 2s, 5s, or 10s. Clapping or stepping while counting helps rhythm.',
    relatedSkills: ['P1-NUM-13'],
  },
  {
    tag: 'swaps_tens_ones',
    label: 'Confuses tens and ones place',
    description: 'Identifies the ones digit as tens or vice versa, e.g. says 35 has 5 tens and 3 ones.',
    remediationExplanation: 'In a two-digit number, the left digit is tens and the right digit is ones. 35 = 3 tens and 5 ones. Use place value blocks to check.',
    visualScaffold: 'place_value_blocks',
    recheckPattern: 'Break a new two-digit number into tens and ones.',
    parentNote: 'Use bundles of 10 (sticks, straws, LEGO towers of 10) and singles. Ask: how many tens? How many ones?',
    relatedSkills: ['P1-NUM-14', 'P1-NUM-15'],
  },
  {
    tag: 'ordinal_cardinal_confusion',
    label: 'Confuses ordinal (1st, 2nd) with cardinal (1, 2) numbers',
    description: 'When asked for position, gives the count or quantity instead, e.g. says "3" instead of "3rd".',
    remediationExplanation: 'Ordinal numbers tell position: 1st, 2nd, 3rd... Cardinal numbers tell how many: 1, 2, 3... "Who is 3rd in line?" is asking about position, not quantity.',
    visualScaffold: 'ordinal_positions_line',
    recheckPattern: 'Point to the 4th object in a row.',
    parentNote: 'Practise in daily life: who is first in line? Which is the second house? Use ordinal words during everyday activities.',
    relatedSkills: ['P1-NUM-16'],
  },
];

const misconceptionByTag = new Map(misconceptions.map((m) => [m.tag, m]));

export function getMisconception(tag) {
  return misconceptionByTag.get(tag) || null;
}

export function getMisconceptionsForSkill(skillId) {
  return misconceptions.filter((m) => m.relatedSkills.includes(skillId));
}

export function getAllMisconceptions() {
  return [...misconceptions];
}

export function getRemediationForTag(tag) {
  const m = misconceptionByTag.get(tag);
  if (!m) return null;
  return {
    tag: m.tag,
    explanation: m.remediationExplanation,
    visualScaffold: m.visualScaffold,
    recheckPattern: m.recheckPattern,
    parentNote: m.parentNote,
  };
}

export default { getMisconception, getMisconceptionsForSkill, getAllMisconceptions, getRemediationForTag };
