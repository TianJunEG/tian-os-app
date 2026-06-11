const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p5RatioSkills = [
  {
    id: 'P5-RAT-01',
    name: 'Ratio Concept & Equivalent Ratios',
    description: 'Express a ratio in simplest form and find the missing term in equivalent ratios.',
    strand: 'Ratio',
    prerequisites: ['P4-FM-01'],
    difficulty: 3,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 82, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P4-FM-01'],
    questionFamilies: ['QF_P5-RAT-01_001', 'QF_P5-RAT-01_002', 'QF_P5-RAT-01_003'],
    visual: 'useful',
    misconceptions: ['reverses_ratio_order', 'forgets_to_simplify_ratio', 'adds_instead_of_divides_for_ratio'],
  },
  {
    id: 'P5-RAT-02',
    name: 'Ratio & Fraction Connection',
    description: 'Express one quantity as a fraction of another or of the total using a given ratio.',
    strand: 'Ratio',
    prerequisites: ['P5-RAT-01'],
    difficulty: 4,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 86, targetAverageSeconds: 22 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P5-RAT-01'],
    questionFamilies: ['QF_P5-RAT-02_001', 'QF_P5-RAT-02_002', 'QF_P5-RAT-02_003'],
    visual: 'useful',
    misconceptions: ['confuses_ratio_with_fraction', 'divides_total_by_one_part', 'forgets_to_simplify_ratio'],
  },
  {
    id: 'P5-RAT-03',
    name: 'Ratio Word Problems',
    description: 'Share quantities in a given ratio, find individual shares, and compare quantities.',
    strand: 'Ratio',
    prerequisites: ['P5-RAT-02'],
    difficulty: 5,
    singaporeLevel: ['P5'],
    mastery: { minimumAccuracy: 78, minimumQuestions: 12 },
    fluency: { targetAccuracy: 84, targetAverageSeconds: 30 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P5-RAT-02'],
    questionFamilies: ['QF_P5-RAT-03_001', 'QF_P5-RAT-03_002', 'QF_P5-RAT-03_003'],
    visual: 'useful',
    misconceptions: ['divides_total_by_one_part', 'adds_instead_of_divides_for_ratio', 'reverses_ratio_order'],
  },
];

const skills = p5RatioSkills.map((s) => ({ ...s }));
const skillById = new Map(skills.map((s) => [s.id, s]));
const dependentMap = new Map();
skills.forEach((s) => { dependentMap.set(s.id, []); });
skills.forEach((s) => { s.prerequisites.forEach((p) => { if (dependentMap.has(p)) dependentMap.get(p).push(s.id); }); });

export function getSkill(id) { return skillById.get(id) || null; }
export function getAllSkills() { return [...skills]; }
export function getPrerequisites(id) { return getSkill(id)?.prerequisites || []; }
export function getDependents(id) { return dependentMap.get(id) || []; }
export function getRemediationTargets(id) { return getSkill(id)?.remediationIfWeak || []; }

export function validateP5RatioSkillGraph() {
  const expected = ['P5-RAT-01', 'P5-RAT-02', 'P5-RAT-03'];
  const actual = skills.map((s) => s.id);
  const missing = expected.filter((id) => !skillById.has(id));
  const dupes = actual.filter((id, i) => actual.indexOf(id) !== i);
  const errors = [];
  if (missing.length) errors.push('Missing required skill IDs.');
  if (dupes.length) errors.push('Duplicate skill IDs detected.');
  return { isValid: errors.length === 0, summary: { totalSkills: skills.length, missing, dupes }, errors };
}

export const p5RatioSkillGraph = {
  domainId: 'p5-ratio', domainName: 'Primary 5 Ratio',
  version: '1.0.0', skillIds: skills.map((s) => s.id), skills,
};
export default p5RatioSkillGraph;
