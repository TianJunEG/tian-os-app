const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const p6SpeedSkills = [
  {
    id: 'P6-SPD-01',
    name: 'Speed-Distance-Time Basics',
    description: 'Calculate speed, distance, or time given the other two quantities using the relationship Speed = Distance ÷ Time.',
    strand: 'Speed',
    prerequisites: ['P5-WP-01'],
    difficulty: 4,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 25 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P5-WP-01'],
    questionFamilies: ['QF_P6-SPD-01_001', 'QF_P6-SPD-01_002', 'QF_P6-SPD-01_003'],
    visual: 'useful',
    misconceptions: ['confuses_speed_distance_time_formula', 'uses_wrong_formula_arrangement', 'forgets_time_unit_conversion'],
  },
  {
    id: 'P6-SPD-02',
    name: 'Average Speed',
    description: 'Calculate the average speed for multi-leg journeys using total distance ÷ total time.',
    strand: 'Speed',
    prerequisites: ['P6-SPD-01'],
    difficulty: 5,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 78, minimumQuestions: 12 },
    fluency: { targetAccuracy: 83, targetAverageSeconds: 40 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P6-SPD-01'],
    questionFamilies: ['QF_P6-SPD-02_001', 'QF_P6-SPD-02_002', 'QF_P6-SPD-02_003'],
    visual: 'useful',
    misconceptions: ['averages_speeds_instead_of_total', 'distance_not_additive_for_average', 'forgets_time_unit_conversion'],
  },
  {
    id: 'P6-SPD-03',
    name: 'Speed Word Problems',
    description: 'Solve word problems involving meeting, catching up, and journeys with stops.',
    strand: 'Speed',
    prerequisites: ['P6-SPD-02'],
    difficulty: 5,
    singaporeLevel: ['P6'],
    mastery: { minimumAccuracy: 75, minimumQuestions: 12 },
    fluency: { targetAccuracy: 80, targetAverageSeconds: 60 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['P6-SPD-02'],
    questionFamilies: ['QF_P6-SPD-03_001', 'QF_P6-SPD-03_002', 'QF_P6-SPD-03_003'],
    visual: 'useful',
    misconceptions: ['ignores_rest_stops_in_time', 'subtracts_speeds_for_same_direction', 'uses_wrong_formula_arrangement', 'time_in_hours_not_minutes'],
  },
];

const skills = p6SpeedSkills.map((s) => ({ ...s }));
const skillById = new Map(skills.map((s) => [s.id, s]));
const dependentMap = new Map();
skills.forEach((s) => { dependentMap.set(s.id, []); });
skills.forEach((s) => { s.prerequisites.forEach((p) => { if (dependentMap.has(p)) dependentMap.get(p).push(s.id); }); });

export function getSkill(id) { return skillById.get(id) || null; }
export function getAllSkills() { return [...skills]; }
export function getPrerequisites(id) { return getSkill(id)?.prerequisites || []; }
export function getDependents(id) { return dependentMap.get(id) || []; }
export function getRemediationTargets(id) { return getSkill(id)?.remediationIfWeak || []; }

export function validateP6SpeedSkillGraph() {
  const expected = ['P6-SPD-01', 'P6-SPD-02', 'P6-SPD-03'];
  const actual = skills.map((s) => s.id);
  const missing = expected.filter((id) => !skillById.has(id));
  const dupes = actual.filter((id, i) => actual.indexOf(id) !== i);
  const errors = [];
  if (missing.length) errors.push('Missing required skill IDs.');
  if (dupes.length) errors.push('Duplicate skill IDs detected.');
  return { isValid: errors.length === 0, summary: { totalSkills: skills.length, missing, dupes }, errors };
}

export const p6SpeedSkillGraph = {
  domainId: 'p6-speed', domainName: 'Primary 6 Speed',
  version: '1.0.0', skillIds: skills.map((s) => s.id), skills,
};
export default p6SpeedSkillGraph;
