const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p4FractionsSkills = [
  {
    id: 'P4-FR-01',
    name: 'Mixed Numbers & Improper Fractions',
    description: 'Convert between mixed numbers and improper fractions.',
    strand: 'Fractions',
    prerequisites: ['P3-WN-01'],
    difficulty: 3,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 16 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-WN-01'],
    questionFamilies: ['QF_P4-FR-01_001', 'QF_P4-FR-01_002', 'QF_P4-FR-01_003'],
    visual: 'useful',
    misconceptions: ['mixed_to_improper_add_error', 'improper_to_mixed_remainder_error'],
  },
  {
    id: 'P4-FR-02',
    name: 'Fraction of a Set',
    description: 'Find a fraction of a given set of objects (e.g. 3/4 of 20).',
    strand: 'Fractions',
    prerequisites: ['P4-FR-01'],
    difficulty: 3,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 16 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P4-FR-01'],
    questionFamilies: ['QF_P4-FR-02_001', 'QF_P4-FR-02_002', 'QF_P4-FR-02_003'],
    visual: 'useful',
    misconceptions: ['fraction_of_set_divides_by_numerator', 'fraction_of_set_forgets_multiply'],
  },
  {
    id: 'P4-FR-03',
    name: 'Add & Subtract Unlike Fractions',
    description: 'Add and subtract fractions with different denominators (denominators up to 12).',
    strand: 'Fractions',
    prerequisites: ['P4-FR-01'],
    difficulty: 4,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 22 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P4-FR-01'],
    questionFamilies: ['QF_P4-FR-03_001', 'QF_P4-FR-03_002', 'QF_P4-FR-03_003'],
    visual: 'useful',
    misconceptions: ['adds_denominators', 'wrong_common_denominator', 'forgets_to_simplify'],
  },
];

const skills = p4FractionsSkills.map((s) => ({ ...s }));
const skillById = new Map(skills.map((s) => [s.id, s]));
const dependentMap = new Map();
skills.forEach((s) => { dependentMap.set(s.id, []); });
skills.forEach((s) => { s.prerequisites.forEach((p) => { if (dependentMap.has(p)) dependentMap.get(p).push(s.id); }); });

export function getSkill(id) { return skillById.get(id) || null; }
export function getAllSkills() { return [...skills]; }
export function getPrerequisites(id) { return getSkill(id)?.prerequisites || []; }
export function getDependents(id) { return dependentMap.get(id) || []; }
export function getRemediationTargets(id) { return getSkill(id)?.remediationIfWeak || []; }

export function validateP4FractionsSkillGraph() {
  const expected = ['P4-FR-01', 'P4-FR-02', 'P4-FR-03'];
  const actual = skills.map((s) => s.id);
  const missing = expected.filter((id) => !skillById.has(id));
  const dupes = actual.filter((id, i) => actual.indexOf(id) !== i);
  const errors = [];
  if (missing.length) errors.push('Missing required skill IDs.');
  if (dupes.length) errors.push('Duplicate skill IDs detected.');
  return { isValid: errors.length === 0, summary: { totalSkills: skills.length, missing, dupes }, errors };
}

export const p4FractionsSkillGraph = {
  domainId: 'p4-fractions', domainName: 'Primary 4 Fractions',
  version: '1.0.0', skillIds: skills.map((s) => s.id), skills,
};
export default p4FractionsSkillGraph;
