const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p6RatioSkills = [
  {
    id: 'P6-RAT-01',
    name: 'Equivalent Ratios & Simplification',
    description: 'Express ratios in simplest form, find missing terms in equivalent ratios, and work with three-quantity ratios.',
    strand: 'Ratio',
    prerequisites: ['P5-RAT-01'],
    difficulty: 4,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P5-RAT-01'],
    questionFamilies: ['QF_P6-RAT-01_001', 'QF_P6-RAT-01_002', 'QF_P6-RAT-01_003'],
    visual: 'useful',
    misconceptions: ['simplifies_only_one_term', 'ratio_order_reversed', 'three_quantity_ratio_error'],
  },
  {
    id: 'P6-RAT-02',
    name: 'Ratio Word Problems',
    description: 'Share a quantity in a given ratio, find total or difference from a ratio, and solve ratio problems with a total given.',
    strand: 'Ratio',
    prerequisites: ['P6-RAT-01'],
    difficulty: 4,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 78, minimumQuestions: 12 },
    fluency: { targetAccuracy: 83, targetAverageSeconds: 30 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P6-RAT-01'],
    questionFamilies: ['QF_P6-RAT-02_001', 'QF_P6-RAT-02_002', 'QF_P6-RAT-02_003'],
    visual: 'useful',
    misconceptions: ['divides_by_wrong_total', 'forgets_ratio_sum', 'ratio_order_reversed'],
  },
  {
    id: 'P6-RAT-03',
    name: 'Changing Ratios (Before-After)',
    description: 'Solve problems where a ratio changes after an amount is added, removed, or transferred, working backwards to find original quantities.',
    strand: 'Ratio',
    prerequisites: ['P6-RAT-02'],
    difficulty: 5,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 75, minimumQuestions: 12 },
    fluency: { targetAccuracy: 80, targetAverageSeconds: 45 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P6-RAT-02'],
    questionFamilies: ['QF_P6-RAT-03_001', 'QF_P6-RAT-03_002', 'QF_P6-RAT-03_003'],
    visual: 'useful',
    misconceptions: ['before_after_wrong_constant', 'subtracts_ratio_parts', 'confuses_ratio_fraction'],
  },
];

const skills = p6RatioSkills.map((s) => ({ ...s }));
const skillById = new Map(skills.map((s) => [s.id, s]));
const dependentMap = new Map();
skills.forEach((s) => { dependentMap.set(s.id, []); });
skills.forEach((s) => { s.prerequisites.forEach((p) => { if (dependentMap.has(p)) dependentMap.get(p).push(s.id); }); });

export function getSkill(id) { return skillById.get(id) || null; }
export function getAllSkills() { return [...skills]; }
export function getPrerequisites(id) { return getSkill(id)?.prerequisites || []; }
export function getDependents(id) { return dependentMap.get(id) || []; }
export function getRemediationTargets(id) { return getSkill(id)?.remediationIfWeak || []; }

export function validateP6RatioSkillGraph() {
  const expected = ['P6-RAT-01', 'P6-RAT-02', 'P6-RAT-03'];
  const actual = skills.map((s) => s.id);
  const missing = expected.filter((id) => !skillById.has(id));
  const dupes = actual.filter((id, i) => actual.indexOf(id) !== i);
  const errors = [];
  if (missing.length) errors.push('Missing required skill IDs.');
  if (dupes.length) errors.push('Duplicate skill IDs detected.');
  return { isValid: errors.length === 0, summary: { totalSkills: skills.length, missing, dupes }, errors };
}

export const p6RatioSkillGraph = {
  domainId: 'p6-ratio', domainName: 'Primary 6 Ratio',
  version: '1.0.0', skillIds: skills.map((s) => s.id), skills,
};
export default p6RatioSkillGraph;
