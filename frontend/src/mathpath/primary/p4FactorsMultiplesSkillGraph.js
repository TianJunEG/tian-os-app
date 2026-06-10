const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p4FactorsMultiplesSkills = [
  {
    id: 'P4-FM-01',
    name: 'Common Factors (HCF)',
    description: 'Find the common factors of two numbers and identify the highest common factor (HCF).',
    strand: 'Factors & Multiples',
    prerequisites: ['P3-MD-01'],
    difficulty: 3,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 18 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-MD-01'],
    questionFamilies: ['QF_P4-FM-01_001', 'QF_P4-FM-01_002', 'QF_P4-FM-01_003'],
    visual: 'useful',
    misconceptions: ['confuses_factors_and_multiples', 'misses_factor_pair', 'forgets_1_is_a_factor'],
  },
  {
    id: 'P4-FM-02',
    name: 'Common Multiples (LCM)',
    description: 'Find the common multiples of two 1-digit numbers and identify the lowest common multiple (LCM).',
    strand: 'Factors & Multiples',
    prerequisites: ['P3-MD-01'],
    difficulty: 3,
    singaporeLevel: ['P4'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 18 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P3-MD-01'],
    questionFamilies: ['QF_P4-FM-02_001', 'QF_P4-FM-02_002', 'QF_P4-FM-02_003'],
    visual: 'useful',
    misconceptions: ['confuses_factors_and_multiples', 'multiplies_instead_of_finding_lcm', 'stops_listing_too_early'],
  },
];

const skills = p4FactorsMultiplesSkills.map((s) => ({ ...s }));
const skillById = new Map(skills.map((s) => [s.id, s]));
const dependentMap = new Map();
skills.forEach((s) => { dependentMap.set(s.id, []); });
skills.forEach((s) => { s.prerequisites.forEach((p) => { if (dependentMap.has(p)) dependentMap.get(p).push(s.id); }); });

export function getSkill(id) { return skillById.get(id) || null; }
export function getAllSkills() { return [...skills]; }
export function getPrerequisites(id) { return getSkill(id)?.prerequisites || []; }
export function getDependents(id) { return dependentMap.get(id) || []; }
export function getRemediationTargets(id) { return getSkill(id)?.remediationIfWeak || []; }

export function validateP4FactorsMultiplesSkillGraph() {
  const expected = ['P4-FM-01', 'P4-FM-02'];
  const actual = skills.map((s) => s.id);
  const missing = expected.filter((id) => !skillById.has(id));
  const dupes = actual.filter((id, i) => actual.indexOf(id) !== i);
  const errors = [];
  if (missing.length) errors.push('Missing required skill IDs.');
  if (dupes.length) errors.push('Duplicate skill IDs detected.');
  return { isValid: errors.length === 0, summary: { totalSkills: skills.length, missing, dupes }, errors };
}

export const p4FactorsMultiplesSkillGraph = {
  domainId: 'p4-factors-multiples', domainName: 'Primary 4 Factors & Multiples',
  version: '1.0.0', skillIds: skills.map((s) => s.id), skills,
};
export default p4FactorsMultiplesSkillGraph;
