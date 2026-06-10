const misconceptions = [
  {
    tag: 'confuses_factors_and_multiples',
    label: 'Mixes up factors and multiples',
    description: 'When asked for factors, lists multiples instead (or vice versa). E.g. says "factors of 6 are 6, 12, 18" instead of "1, 2, 3, 6".',
    remediationExplanation: 'Factors DIVIDE INTO the number evenly (they are smaller or equal). Multiples are the TIMES TABLE of the number (they are bigger or equal). Factors of 6: 1, 2, 3, 6. Multiples of 6: 6, 12, 18, 24, ...',
    visualScaffold: 'factor_vs_multiple_table',
    recheckPattern: 'List the factors of 12, then list the first 5 multiples of 12.',
    parentNote: 'Use the mnemonic: Factors are Few (and Finite), Multiples are Many (and go on forever). Practise by asking "Is 4 a factor of 20?" and "Is 20 a multiple of 4?"',
    relatedSkills: ['P4-FM-01', 'P4-FM-02'],
  },
  {
    tag: 'misses_factor_pair',
    label: 'Misses one or more factor pairs',
    description: 'Lists some but not all factors. E.g. for 24 writes 1, 2, 3, 4, 6, 24 but forgets 8 and 12.',
    remediationExplanation: 'Use systematic factor pairs: start from 1 and work up. 1 \u00d7 24, 2 \u00d7 12, 3 \u00d7 8, 4 \u00d7 6. Stop when the pairs meet in the middle.',
    visualScaffold: 'factor_rainbow',
    recheckPattern: 'Find ALL the factors of 36 using factor pairs.',
    parentNote: 'Draw a factor rainbow: write 1 on the left and the number on the right, then find pairs that multiply to make the number. Connect each pair with an arc.',
    relatedSkills: ['P4-FM-01'],
  },
  {
    tag: 'forgets_1_is_a_factor',
    label: 'Forgets that 1 is always a factor',
    description: 'Starts listing factors from 2 instead of 1, missing 1 (and sometimes the number itself).',
    remediationExplanation: '1 is a factor of every number because every number divided by 1 equals itself. The number itself is also always a factor.',
    visualScaffold: 'factor_checklist',
    recheckPattern: 'List all factors of 15, starting from 1.',
    parentNote: 'Remind your child: every number has at least two factors \u2014 1 and itself. Always start and end with these.',
    relatedSkills: ['P4-FM-01'],
  },
  {
    tag: 'multiplies_instead_of_finding_lcm',
    label: 'Just multiplies the two numbers instead of finding the LCM',
    description: 'For LCM of 4 and 6, writes 24 (4 \u00d7 6) instead of 12. Multiplying only gives the LCM when the numbers share no common factor.',
    remediationExplanation: 'The LCM is the SMALLEST number that both numbers divide into. List multiples of each until you find the first match. Multiples of 4: 4, 8, 12. Multiples of 6: 6, 12. LCM = 12.',
    visualScaffold: 'multiple_number_line',
    recheckPattern: 'Find the LCM of 6 and 8 by listing multiples.',
    parentNote: 'Show that multiplying works sometimes (e.g. 3 \u00d7 5 = 15 = LCM) but not always (4 \u00d7 6 = 24 \u2260 LCM 12). The listing method always works.',
    relatedSkills: ['P4-FM-02'],
  },
  {
    tag: 'stops_listing_too_early',
    label: 'Stops listing multiples before finding all common ones',
    description: 'Only lists a few multiples and misses common multiples that appear further along the sequence.',
    remediationExplanation: 'Keep listing until you reach the limit. For common multiples of 4 and 6 up to 36: 12, 24, 36 \u2014 three common multiples, not just one.',
    visualScaffold: 'multiple_list_extended',
    recheckPattern: 'List all common multiples of 3 and 5 up to 60.',
    parentNote: 'Ask your child to list multiples in a table side by side, then circle the ones that appear in both columns.',
    relatedSkills: ['P4-FM-02'],
  },
];

const misconceptionByTag = new Map(misconceptions.map((m) => [m.tag, m]));

export function getMisconception(tag) { return misconceptionByTag.get(tag) || null; }
export function getMisconceptionsForSkill(skillId) {
  return misconceptions.filter((m) => m.relatedSkills.includes(skillId));
}
export function getAllMisconceptions() { return [...misconceptions]; }
export function getRemediationForTag(tag) {
  const m = misconceptionByTag.get(tag);
  if (!m) return null;
  return { tag: m.tag, explanation: m.remediationExplanation, visualScaffold: m.visualScaffold, recheckPattern: m.recheckPattern, parentNote: m.parentNote };
}

export default { getMisconception, getMisconceptionsForSkill, getAllMisconceptions, getRemediationForTag };
