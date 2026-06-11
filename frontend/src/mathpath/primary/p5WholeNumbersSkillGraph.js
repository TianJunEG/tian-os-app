const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p5WholeNumbersSkills = [
  {
    id: 'P5-WN-01',
    name: 'Place Value to Millions',
    description: 'Read, write, and identify place values of digits in numbers up to 10 million.',
    strand: 'Whole Numbers',
    prerequisites: ['P4-WN-01'],
    difficulty: 3,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 15 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P4-WN-01'],
    questionFamilies: ['QF_P5-WN-01_001', 'QF_P5-WN-01_002', 'QF_P5-WN-01_003'],
    visual: 'optional',
    misconceptions: ['confuses_place_value_names', 'omits_zeros_in_word_form', 'wrong_digit_value'],
  },
  {
    id: 'P5-WN-02',
    name: 'Rounding & Estimation',
    description: 'Round whole numbers to the nearest 10, 100, 1000, or 10 000 and use rounding to estimate.',
    strand: 'Whole Numbers',
    prerequisites: ['P5-WN-01'],
    difficulty: 3,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 14 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P5-WN-01'],
    questionFamilies: ['QF_P5-WN-02_001', 'QF_P5-WN-02_002', 'QF_P5-WN-02_003'],
    visual: 'optional',
    misconceptions: ['rounds_wrong_direction', 'rounds_to_wrong_place', 'truncates_instead_of_rounding'],
  },
  {
    id: 'P5-WN-03',
    name: 'Order of Operations',
    description: 'Evaluate expressions using the correct order of operations (brackets, ×/÷ before +/−).',
    strand: 'Whole Numbers',
    prerequisites: ['P4-FO-01'],
    difficulty: 4,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 25 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P4-FO-01'],
    questionFamilies: ['QF_P5-WN-03_001', 'QF_P5-WN-03_002', 'QF_P5-WN-03_003'],
    visual: 'optional',
    misconceptions: ['left_to_right_ignoring_precedence', 'forgets_brackets_first', 'wrong_division_in_chain'],
  },
];

const skills = p5WholeNumbersSkills.map((s) => ({ ...s }));
const skillById = new Map(skills.map((s) => [s.id, s]));
const dependentMap = new Map();
skills.forEach((s) => { dependentMap.set(s.id, []); });
skills.forEach((s) => { s.prerequisites.forEach((p) => { if (dependentMap.has(p)) dependentMap.get(p).push(s.id); }); });

export function getSkill(id) { return skillById.get(id) || null; }
export function getAllSkills() { return [...skills]; }
export function getPrerequisites(id) { return getSkill(id)?.prerequisites || []; }
export function getDependents(id) { return dependentMap.get(id) || []; }
export function getRemediationTargets(id) { return getSkill(id)?.remediationIfWeak || []; }

export function validateP5WholeNumbersSkillGraph() {
  const expected = ['P5-WN-01', 'P5-WN-02', 'P5-WN-03'];
  const actual = skills.map((s) => s.id);
  const missing = expected.filter((id) => !skillById.has(id));
  const dupes = actual.filter((id, i) => actual.indexOf(id) !== i);
  const errors = [];
  if (missing.length) errors.push('Missing required skill IDs.');
  if (dupes.length) errors.push('Duplicate skill IDs detected.');
  return { isValid: errors.length === 0, summary: { totalSkills: skills.length, missing, dupes }, errors };
}

export const p5WholeNumbersSkillGraph = {
  domainId: 'p5-wholenumbers', domainName: 'Primary 5 Whole Numbers',
  version: '1.0.0', skillIds: skills.map((s) => s.id), skills,
};
export default p5WholeNumbersSkillGraph;
