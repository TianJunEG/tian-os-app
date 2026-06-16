// MathPath domain: Measurement
const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const measurementSkills = [
  {
    id: 'ME001',
    slug: 'mea.length',
    name: 'Length and its units (cm, m, km)',
    description: 'Length and its units (cm, m, km).',
    strand: 'Length',
    prerequisites: [],
    crossDomainPrerequisites: ['ns.pv.3-digit'],
    difficulty: 3,
    singaporeLevel: ['Primary 2'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['mea/wrong-unit'],
    questionFamilies: ['QF_ME001_001', 'QF_ME001_002'],
  },
  {
    id: 'ME002',
    slug: 'mea.mass',
    name: 'Mass and its units (g, kg)',
    description: 'Mass and its units (g, kg).',
    strand: 'Mass',
    prerequisites: [],
    crossDomainPrerequisites: ['ns.pv.3-digit'],
    difficulty: 3,
    singaporeLevel: ['Primary 2'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['mea/wrong-unit'],
    questionFamilies: ['QF_ME002_001', 'QF_ME002_002'],
  },
  {
    id: 'ME003',
    slug: 'mea.volume-capacity',
    name: 'Volume and capacity (ml, L)',
    description: 'Volume and capacity (ml, L).',
    strand: 'Volume',
    prerequisites: [],
    crossDomainPrerequisites: ['ns.pv.3-digit'],
    difficulty: 3,
    singaporeLevel: ['Primary 3'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['mea/capacity-volume-confuse'],
    questionFamilies: ['QF_ME003_001', 'QF_ME003_002'],
  },
  {
    id: 'ME004',
    slug: 'mea.read-scales',
    name: 'Reading measuring scales',
    description: 'Reading measuring scales.',
    strand: 'Reading Scales',
    prerequisites: ['ME001', 'ME003'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 3'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['mea/scale-interval'],
    questionFamilies: ['QF_ME004_001', 'QF_ME004_002'],
  },
  {
    id: 'ME005',
    slug: 'mea.time-tell',
    name: 'Telling time and the 24-hour clock',
    description: 'Telling time and the 24-hour clock.',
    strand: 'Time',
    prerequisites: [],
    crossDomainPrerequisites: ['ns.count.to-100'],
    difficulty: 3,
    singaporeLevel: ['Primary 4'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 5 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['mea/24hr-convert'],
    questionFamilies: ['QF_ME005_001', 'QF_ME005_002'],
  },
  {
    id: 'ME006',
    slug: 'mea.time-duration',
    name: 'Duration and time intervals',
    description: 'Duration and time intervals.',
    strand: 'Time',
    prerequisites: ['ME005'],
    crossDomainPrerequisites: ['op.sub.regroup'],
    difficulty: 3,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['mea/time-base-60'],
    questionFamilies: ['QF_ME006_001', 'QF_ME006_002'],
  },
  {
    id: 'ME007',
    slug: 'mea.unit-convert',
    name: 'Unit conversions (length, mass, volume)',
    description: 'Unit conversions (length, mass, volume).',
    strand: 'Unit Conversion',
    prerequisites: [],
    crossDomainPrerequisites: ['op.mult.by-10-100'],
    difficulty: 3,
    singaporeLevel: ['Primary 4'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 6 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['mea/convert-direction'],
    questionFamilies: ['QF_ME007_001', 'QF_ME007_002'],
  },
  {
    id: 'ME008',
    slug: 'mea.compare-measures',
    name: 'Comparing and converting measurements',
    description: 'Comparing and converting measurements.',
    strand: 'Comparing',
    prerequisites: ['ME007'],
    crossDomainPrerequisites: ['dec.compare'],
    difficulty: 3,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['mea/compare-mixed-units'],
    questionFamilies: ['QF_ME008_001', 'QF_ME008_002'],
  },
  {
    id: 'ME009',
    slug: 'mea.perimeter-apply',
    name: 'Perimeter in measurement contexts',
    description: 'Perimeter in measurement contexts.',
    strand: 'Perimeter',
    prerequisites: ['ME007'],
    crossDomainPrerequisites: ['geo.perimeter'],
    difficulty: 3,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['mea/perimeter-units'],
    questionFamilies: ['QF_ME009_001', 'QF_ME009_002'],
  },
  {
    id: 'ME010',
    slug: 'mea.area-apply',
    name: 'Area in measurement contexts',
    description: 'Area in measurement contexts.',
    strand: 'Area',
    prerequisites: ['ME007'],
    crossDomainPrerequisites: ['geo.area-rect'],
    difficulty: 3,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['mea/area-units'],
    questionFamilies: ['QF_ME010_001', 'QF_ME010_002'],
  },
  {
    id: 'ME011',
    slug: 'mea.volume-cuboid',
    name: 'Volume of cubes and cuboids',
    description: 'Volume of cubes and cuboids.',
    strand: 'Volume',
    prerequisites: [],
    crossDomainPrerequisites: ['geo.3d-shapes', 'op.mult.2x1'],
    difficulty: 3,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 8 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['mea/volume-add-edges'],
    questionFamilies: ['QF_ME011_001', 'QF_ME011_002'],
  },
  {
    id: 'ME012',
    slug: 'mea.nets-volume',
    name: 'Nets and volume of cuboids',
    description: 'Nets and volume of cuboids.',
    strand: 'Volume',
    prerequisites: ['ME011'],
    crossDomainPrerequisites: ['geo.nets-views'],
    difficulty: 3,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['mea/net-dimensions'],
    questionFamilies: ['QF_ME012_001', 'QF_ME012_002'],
  },
  {
    id: 'ME013',
    slug: 'mea.volume-rate',
    name: 'Volume, water level and rate',
    description: 'Volume, water level and rate.',
    strand: 'Volume',
    prerequisites: ['ME011'],
    crossDomainPrerequisites: ['rr.rate'],
    difficulty: 3,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['mea/rate-volume-confuse'],
    questionFamilies: ['QF_ME013_001', 'QF_ME013_002'],
  },
  {
    id: 'ME014',
    slug: 'mea.money',
    name: 'Money word problems and reasoning',
    description: 'Money word problems and reasoning.',
    strand: 'Money',
    prerequisites: [],
    crossDomainPrerequisites: ['op.add.regroup', 'dec.add-sub'],
    difficulty: 3,
    singaporeLevel: ['Primary 4'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['mea/money-decimal-place'],
    questionFamilies: ['QF_ME014_001', 'QF_ME014_002'],
  },
];

const skills = measurementSkills.map((skill) => ({ ...skill }));
const skillById = new Map(skills.map((skill) => [skill.id, skill]));

const dependentMap = new Map();
skills.forEach((skill) => dependentMap.set(skill.id, []));
skills.forEach((skill) => {
  skill.prerequisites.forEach((prereqId) => {
    if (dependentMap.has(prereqId)) dependentMap.get(prereqId).push(skill.id);
  });
});

function unique(values) {
  return [...new Set(values)];
}

export function getSkill(skillId) {
  return skillById.get(skillId) || null;
}

export function getPrerequisites(skillId) {
  return getSkill(skillId)?.prerequisites || [];
}

export function getDependents(skillId) {
  return dependentMap.get(skillId) || [];
}

export function getRemediationTargets(skillId) {
  return getSkill(skillId)?.remediationIfWeak || [];
}

export function getSkillPath(skillId) {
  if (!skillById.has(skillId)) return [];
  const visited = new Set();
  const path = [];
  function walk(currentId) {
    if (visited.has(currentId)) return;
    visited.add(currentId);
    const prereqs = getPrerequisites(currentId);
    if (prereqs.length > 0) walk(prereqs[0]);
    path.push(currentId);
  }
  walk(skillId);
  return path;
}

export function getDependencyMap() {
  return skills.reduce((acc, skill) => {
    acc[skill.id] = {
      prerequisites: [...skill.prerequisites],
      dependents: getDependents(skill.id),
      remediationIfWeak: [...skill.remediationIfWeak],
    };
    return acc;
  }, {});
}

function detectCycles(graphSkills) {
  const visiting = new Set();
  const visited = new Set();
  const cycles = [];
  function dfs(id, stack) {
    if (visiting.has(id)) { cycles.push([...stack.slice(stack.indexOf(id)), id]); return; }
    if (visited.has(id)) return;
    visiting.add(id); stack.push(id);
    const skill = skillById.get(id);
    if (skill) skill.prerequisites.forEach((prereq) => dfs(prereq, stack));
    stack.pop(); visiting.delete(id); visited.add(id);
  }
  graphSkills.forEach((skill) => dfs(skill.id, []));
  return cycles;
}

export function validateMeasurementSkillGraph() {
  const expectedIds = ['ME001', 'ME002', 'ME003', 'ME004', 'ME005', 'ME006', 'ME007', 'ME008', 'ME009', 'ME010', 'ME011', 'ME012', 'ME013', 'ME014'];
  const actualIds = skills.map((s) => s.id);
  const missingSkills = expectedIds.filter((id) => !skillById.has(id));
  const duplicateIds = actualIds.filter((id, index) => actualIds.indexOf(id) !== index);
  const invalidPrereqReferences = skills.flatMap((skill) =>
    skill.prerequisites.filter((prereqId) => !skillById.has(prereqId))
      .map((invalidPrereqId) => ({ skillId: skill.id, invalidPrereqId }))
  );
  const invalidRemediationReferences = skills.flatMap((skill) =>
    skill.remediationIfWeak.filter((targetId) => !skillById.has(targetId))
      .map((invalidTargetId) => ({ skillId: skill.id, invalidTargetId }))
  );
  const cycles = detectCycles(skills);
  const foundationIds = skills.filter((skill) => skill.prerequisites.length === 0).map((skill) => skill.id);
  const reachable = new Set();
  const queue = [...foundationIds];
  while (queue.length) {
    const current = queue.shift();
    if (reachable.has(current)) continue;
    reachable.add(current);
    getDependents(current).forEach((dependentId) => queue.push(dependentId));
  }
  const unreachableSkills = skills.filter((skill) => !reachable.has(skill.id)).map((skill) => skill.id);
  const errors = unique([
    ...(missingSkills.length ? ['Missing required skill IDs.'] : []),
    ...(duplicateIds.length ? ['Duplicate skill IDs detected.'] : []),
    ...(invalidPrereqReferences.length ? ['Invalid prerequisite references.'] : []),
    ...(cycles.length ? ['Circular dependency detected.'] : []),
  ]);
  return { isValid: errors.length === 0, summary: { totalSkills: skills.length, foundationSkills: foundationIds, missingSkills, duplicateIds: unique(duplicateIds), invalidPrereqReferences, cycles, unreachableSkills }, errors };
}

export const measurementSkillGraph = {
  domainId: 'measurement',
  domainName: 'Measurement',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default measurementSkillGraph;
