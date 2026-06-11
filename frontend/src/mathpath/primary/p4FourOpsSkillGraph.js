const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p4FourOpsSkills = [
  {
    id: 'P4-FO-01',
    name: 'Multiply up to 4-digit by 1-digit',
    description: 'Use the standard multiplication algorithm for up to 4 digits by 1 digit.',
    strand: 'Four Operations',
    prerequisites: ['P3-MD-01'],
    difficulty: 3,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 26 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-MD-01'],
    questionFamilies: ['QF_P4-FO-01_001', 'QF_P4-FO-01_002', 'QF_P4-FO-01_003'],
    visual: 'optional',
    misconceptions: ['carry_error_multiplication', 'times_table_slip', 'multiplies_only_ones'],
  },
  {
    id: 'P4-FO-02',
    name: 'Multiply up to 3-digit by 2-digit',
    description: 'Use the standard multiplication algorithm for up to 3 digits by 2 digits (partial products).',
    strand: 'Four Operations',
    prerequisites: ['P4-FO-01'],
    difficulty: 4,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 30 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P4-FO-01'],
    questionFamilies: ['QF_P4-FO-02_001', 'QF_P4-FO-02_002', 'QF_P4-FO-02_003'],
    visual: 'optional',
    misconceptions: ['carry_error_multiplication', 'forgets_tens_row_shift', 'partial_product_addition_error'],
  },
  {
    id: 'P4-FO-03',
    name: 'Divide up to 4-digit by 1-digit',
    description: 'Use the long division algorithm for up to 4 digits by 1 digit (exact division).',
    strand: 'Four Operations',
    prerequisites: ['P3-MD-01'],
    difficulty: 4,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 30 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-MD-01'],
    questionFamilies: ['QF_P4-FO-03_001', 'QF_P4-FO-03_002', 'QF_P4-FO-03_003'],
    visual: 'optional',
    misconceptions: ['division_remainder_confusion', 'skips_zero_in_quotient', 'division_direction_error'],
  },
];

const skills = p4FourOpsSkills.map((s) => ({ ...s }));
const skillById = new Map(skills.map((s) => [s.id, s]));
const dependentMap = new Map();
skills.forEach((s) => { dependentMap.set(s.id, []); });
skills.forEach((s) => { s.prerequisites.forEach((p) => { if (dependentMap.has(p)) dependentMap.get(p).push(s.id); }); });

export function getSkill(id) { return skillById.get(id) || null; }
export function getAllSkills() { return [...skills]; }
export function getPrerequisites(id) { return getSkill(id)?.prerequisites || []; }
export function getDependents(id) { return dependentMap.get(id) || []; }
export function getRemediationTargets(id) { return getSkill(id)?.remediationIfWeak || []; }

export function validateP4FourOpsSkillGraph() {
  const expected = ['P4-FO-01', 'P4-FO-02', 'P4-FO-03'];
  const actual = skills.map((s) => s.id);
  const missing = expected.filter((id) => !skillById.has(id));
  const dupes = actual.filter((id, i) => actual.indexOf(id) !== i);
  const errors = [];
  if (missing.length) errors.push('Missing required skill IDs.');
  if (dupes.length) errors.push('Duplicate skill IDs detected.');
  return { isValid: errors.length === 0, summary: { totalSkills: skills.length, missing, dupes }, errors };
}

export const p4FourOpsSkillGraph = {
  domainId: 'p4-four-operations', domainName: 'Primary 4 Four Operations',
  version: '1.0.0', skillIds: skills.map((s) => s.id), skills,
};
export default p4FourOpsSkillGraph;
