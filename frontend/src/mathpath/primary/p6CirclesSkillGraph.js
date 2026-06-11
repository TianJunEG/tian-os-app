const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p6CirclesSkills = [
  {
    id: 'P6-CIR-01',
    name: 'Circumference of Circle',
    description: 'Find the circumference of a circle using C = π × d or C = 2 × π × r, with π = 22/7 or 3.14.',
    strand: 'Circles',
    prerequisites: ['P5-GEO-01'],
    difficulty: 4,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 25 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P5-GEO-01'],
    questionFamilies: [
      'QF_P6-CIR-01_001',
      'QF_P6-CIR-01_002',
      'QF_P6-CIR-01_003',
    ],
    visual: 'essential',
    misconceptions: ['uses_diameter_as_radius', 'pi_approximation_error', 'confuses_circumference_area_formulas'],
  },
  {
    id: 'P6-CIR-02',
    name: 'Area of Circle',
    description: 'Find the area of a circle using A = π × r × r, with π = 22/7 or 3.14.',
    strand: 'Circles',
    prerequisites: ['P6-CIR-01'],
    difficulty: 4,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 28 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P6-CIR-01'],
    questionFamilies: [
      'QF_P6-CIR-02_001',
      'QF_P6-CIR-02_002',
      'QF_P6-CIR-02_003',
    ],
    visual: 'essential',
    misconceptions: ['area_uses_diameter_not_radius', 'confuses_circumference_area_formulas', 'pi_approximation_error'],
  },
  {
    id: 'P6-CIR-03',
    name: 'Composite Figures with Circles',
    description: 'Find the perimeter or area of semicircles, quadrants, and composite shapes combining circles with rectangles or squares.',
    strand: 'Circles',
    prerequisites: ['P6-CIR-02'],
    difficulty: 5,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 75, minimumQuestions: 15 },
    fluency: { targetAccuracy: 80, targetAverageSeconds: 40 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P6-CIR-02'],
    questionFamilies: [
      'QF_P6-CIR-03_001',
      'QF_P6-CIR-03_002',
      'QF_P6-CIR-03_003',
    ],
    visual: 'essential',
    misconceptions: [
      'forgets_straight_edge_in_semicircle',
      'forgets_to_halve_for_semicircle',
      'wrong_fraction_for_quadrant',
      'adds_full_circumference_to_semicircle',
    ],
  },
];

const skills = p6CirclesSkills.map((s) => ({ ...s }));
const skillById = new Map(skills.map((s) => [s.id, s]));
const dependentMap = new Map();
skills.forEach((s) => { dependentMap.set(s.id, []); });
skills.forEach((s) => { s.prerequisites.forEach((p) => { if (dependentMap.has(p)) dependentMap.get(p).push(s.id); }); });

export function getSkill(id) { return skillById.get(id) || null; }
export function getAllSkills() { return [...skills]; }
export function getPrerequisites(id) { return getSkill(id)?.prerequisites || []; }
export function getDependents(id) { return dependentMap.get(id) || []; }
export function getRemediationTargets(id) { return getSkill(id)?.remediationIfWeak || []; }

export function validateP6CirclesSkillGraph() {
  const expected = ['P6-CIR-01', 'P6-CIR-02', 'P6-CIR-03'];
  const actual = skills.map((s) => s.id);
  const missing = expected.filter((id) => !skillById.has(id));
  const dupes = actual.filter((id, i) => actual.indexOf(id) !== i);
  const errors = [];
  if (missing.length) errors.push('Missing required skill IDs.');
  if (dupes.length) errors.push('Duplicate skill IDs detected.');
  return { isValid: errors.length === 0, summary: { totalSkills: skills.length, missing, dupes }, errors };
}

export const p6CirclesSkillGraph = {
  domainId: 'p6-circles', domainName: 'Primary 6 Circles',
  version: '1.0.0', skillIds: skills.map((s) => s.id), skills,
};
export default p6CirclesSkillGraph;
