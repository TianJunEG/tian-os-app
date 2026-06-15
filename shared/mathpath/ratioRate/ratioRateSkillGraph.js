// MathPath domain: Ratio & Rate (Primary 5 → 6).
//
// Ratio as multiplicative comparison (not additive), equivalent ratios,
// dividing in a ratio, rates/speed, and direct-proportion foundations.
// Visual-first: bar models, ratio tables and double number lines build the
// multiplicative intuition that the misconceptions (additive thinking,
// wrong base, averaging speeds) attack.
//
// Prerequisites keep the graph acyclic and fully reachable from R001.
// Cross-domain prerequisites (fraction meaning, percentage convert, mult/div
// facts) are on `crossDomainPrerequisites` for curriculum tooling without
// coupling this graph.

const RETENTION_REVIEW_DAYS = [3, 7, 30, 90];

const ratioRateSkills = [
  // ── Meaning ──
  {
    id: 'R001',
    slug: 'rr.meaning',
    name: 'Understanding ratio (part-to-part, part-to-whole)',
    description: 'Read and write ratios; distinguish part-to-part from part-to-whole comparisons.',
    strand: 'Foundations',
    prerequisites: [],
    crossDomainPrerequisites: ['fr.meaning.parts'],
    difficulty: 2,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 10 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: [],
    misconceptions: ['rr/order-reversed', 'rr/part-whole-mixup'],
    questionFamilies: ['QF_R001_001', 'QF_R001_002'],
  },

  // ── Equivalent & simplifying ──
  {
    id: 'R002',
    slug: 'rr.equivalent',
    name: 'Equivalent ratios',
    description: 'Scale both terms of a ratio by the same factor to find equivalent ratios.',
    strand: 'Proportional Core',
    prerequisites: ['R001'],
    crossDomainPrerequisites: ['op.mult.facts'],
    difficulty: 3,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 6 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['R001'],
    misconceptions: ['rr/add-not-multiply'],
    questionFamilies: ['QF_R002_001', 'QF_R002_002'],
  },
  {
    id: 'R003',
    slug: 'rr.simplify',
    name: 'Simplifying ratios to simplest form',
    description: 'Divide both terms by their HCF to write a ratio in simplest form.',
    strand: 'Proportional Core',
    prerequisites: ['R002'],
    crossDomainPrerequisites: ['op.div.facts'],
    difficulty: 3,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 6 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['R002'],
    misconceptions: ['rr/incomplete-simplify'],
    questionFamilies: ['QF_R003_001', 'QF_R003_002'],
  },
  {
    id: 'R004',
    slug: 'rr.three-term',
    name: 'Three-term ratios (a : b : c)',
    description: 'Simplify and interpret three-term ratios by dividing all terms by the HCF.',
    strand: 'Proportional Core',
    prerequisites: ['R003'],
    crossDomainPrerequisites: [],
    difficulty: 4,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 12 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['R003'],
    misconceptions: ['rr/pairwise-only'],
    questionFamilies: ['QF_R004_001', 'QF_R004_002'],
  },

  // ── Relating ratio to fractions & percentages ──
  {
    id: 'R005',
    slug: 'rr.ratio-fraction',
    name: 'Relating ratio to fractions (part of a whole)',
    description: 'Express each part of a ratio as a fraction of the total.',
    strand: 'Connections',
    prerequisites: ['R001'],
    crossDomainPrerequisites: ['fr.of-quantity'],
    difficulty: 3,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 15 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['R001'],
    misconceptions: ['rr/part-part-as-fraction'],
    questionFamilies: ['QF_R005_001', 'QF_R005_002'],
  },
  {
    id: 'R006',
    slug: 'rr.ratio-percent',
    name: 'Relating ratio to percentage',
    description: 'Convert a part-to-whole ratio to a percentage.',
    strand: 'Connections',
    prerequisites: ['R005'],
    crossDomainPrerequisites: ['pct.convert'],
    difficulty: 3,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 15 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['R005'],
    misconceptions: ['rr/percent-of-part'],
    questionFamilies: ['QF_R006_001', 'QF_R006_002'],
  },

  // ── Dividing in a ratio ──
  {
    id: 'R007',
    slug: 'rr.divide',
    name: 'Dividing a quantity in a given ratio',
    description: 'Divide a total amount between two parties in a given ratio.',
    strand: 'Applications',
    prerequisites: ['R002'],
    crossDomainPrerequisites: ['op.div.short'],
    difficulty: 4,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 14 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 20 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['R002'],
    misconceptions: ['rr/forgot-total-units', 'rr/unit-then-stop'],
    heuristic: 'ratio',
    questionFamilies: ['QF_R007_001', 'QF_R007_002'],
  },
  {
    id: 'R008',
    slug: 'rr.divide-3',
    name: 'Dividing in a three-part ratio',
    description: 'Divide a total among three parties in a three-term ratio.',
    strand: 'Applications',
    prerequisites: ['R007'],
    crossDomainPrerequisites: [],
    difficulty: 4,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 25 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['R007'],
    misconceptions: ['rr/three-units-error'],
    heuristic: 'ratio',
    questionFamilies: ['QF_R008_001', 'QF_R008_002'],
  },
  {
    id: 'R009',
    slug: 'rr.before-after',
    name: 'Ratio before and after a change',
    description: 'Solve ratio problems where one or both quantities change.',
    strand: 'Applications',
    prerequisites: ['R007'],
    crossDomainPrerequisites: [],
    difficulty: 5,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 80, targetAverageSeconds: 35 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['R007'],
    misconceptions: ['rr/assume-total-constant'],
    heuristic: 'before-after',
    questionFamilies: ['QF_R009_001', 'QF_R009_002'],
  },
  {
    id: 'R010',
    slug: 'rr.combine',
    name: 'Combining two ratios (a:b and b:c)',
    description: 'Form a three-term ratio by scaling two overlapping two-term ratios.',
    strand: 'Applications',
    prerequisites: ['R002'],
    crossDomainPrerequisites: [],
    difficulty: 5,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 80, targetAverageSeconds: 30 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['R002'],
    misconceptions: ['rr/no-common-term'],
    heuristic: 'ratio',
    questionFamilies: ['QF_R010_001', 'QF_R010_002'],
  },

  // ── Rates ──
  {
    id: 'R011',
    slug: 'rr.rate',
    name: 'Rates and unit rate',
    description: 'Express a comparison of two different quantities as a rate; find the unit rate.',
    strand: 'Rates',
    prerequisites: ['R001'],
    crossDomainPrerequisites: ['op.div.short'],
    difficulty: 3,
    singaporeLevel: ['Primary 5'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 90, targetAverageSeconds: 7 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['R001'],
    misconceptions: ['rr/rate-inverted'],
    questionFamilies: ['QF_R011_001', 'QF_R011_002'],
  },
  {
    id: 'R012',
    slug: 'rr.rate-tiered',
    name: 'Tiered / compound rates (tariffs)',
    description: 'Calculate bills where different rates apply to different usage tiers.',
    strand: 'Rates',
    prerequisites: ['R011'],
    crossDomainPrerequisites: [],
    difficulty: 4,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 85, targetAverageSeconds: 25 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['R011'],
    misconceptions: ['rr/flat-rate'],
    heuristic: 'ratio',
    questionFamilies: ['QF_R012_001', 'QF_R012_002'],
  },

  // ── Speed ──
  {
    id: 'R013',
    slug: 'rr.speed',
    name: 'Speed, distance and time',
    description: 'Apply speed = distance ÷ time and its rearrangements.',
    strand: 'Speed',
    prerequisites: ['R011'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 88, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 10 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['R011'],
    misconceptions: ['rr/formula-confusion', 'rr/unit-mismatch'],
    questionFamilies: ['QF_R013_001', 'QF_R013_002'],
  },
  {
    id: 'R014',
    slug: 'rr.speed-avg',
    name: 'Average speed and relative motion',
    description: 'Find average speed using total distance ÷ total time; solve relative-motion problems.',
    strand: 'Speed',
    prerequisites: ['R013'],
    crossDomainPrerequisites: [],
    difficulty: 5,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 80, minimumQuestions: 12 },
    fluency: { targetAccuracy: 80, targetAverageSeconds: 35 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['R013'],
    misconceptions: ['rr/avg-of-speeds'],
    heuristic: 'ratio',
    questionFamilies: ['QF_R014_001', 'QF_R014_002'],
  },

  // ── Proportion foundations ──
  {
    id: 'R015',
    slug: 'rr.proportion',
    name: 'Direct proportion foundations',
    description: 'Solve direct proportion problems using the unitary method (find 1 unit, scale up).',
    strand: 'Proportion',
    prerequisites: ['R002'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['Primary 6'],
    mastery: { minimumAccuracy: 85, minimumQuestions: 12 },
    fluency: { targetAccuracy: 88, targetAverageSeconds: 15 },
    retention: { reviewDays: RETENTION_REVIEW_DAYS },
    remediationIfWeak: ['R002'],
    misconceptions: ['rr/additive-not-multiplicative'],
    heuristic: 'ratio',
    questionFamilies: ['QF_R015_001', 'QF_R015_002'],
  },
];

const skills = ratioRateSkills.map((skill) => ({ ...skill }));
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
    if (visiting.has(id)) {
      const start = stack.indexOf(id);
      cycles.push([...stack.slice(start), id]);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    stack.push(id);
    const skill = skillById.get(id);
    if (skill) skill.prerequisites.forEach((prereq) => dfs(prereq, stack));
    stack.pop();
    visiting.delete(id);
    visited.add(id);
  }

  graphSkills.forEach((skill) => dfs(skill.id, []));
  return cycles;
}

export function validateRatioRateSkillGraph() {
  const expectedIds = Array.from({ length: 15 }, (_, i) => `R${String(i + 1).padStart(3, '0')}`);
  const actualIds = skills.map((s) => s.id);

  const missingSkills = expectedIds.filter((id) => !skillById.has(id));
  const duplicateIds = actualIds.filter((id, index) => actualIds.indexOf(id) !== index);

  const invalidPrereqReferences = skills.flatMap((skill) =>
    skill.prerequisites
      .filter((prereqId) => !skillById.has(prereqId))
      .map((invalidPrereqId) => ({ skillId: skill.id, invalidPrereqId }))
  );

  const invalidRemediationReferences = skills.flatMap((skill) =>
    skill.remediationIfWeak
      .filter((targetId) => !skillById.has(targetId))
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
    ...(invalidPrereqReferences.length ? ['Invalid prerequisite references detected.'] : []),
    ...(invalidRemediationReferences.length ? ['Invalid remediation references detected.'] : []),
    ...(cycles.length ? ['Circular dependency detected.'] : []),
    ...(unreachableSkills.length ? ['Unreachable skills detected.'] : []),
  ]);

  return {
    isValid: errors.length === 0,
    summary: {
      totalSkills: skills.length,
      foundationSkills: foundationIds,
      missingSkills,
      duplicateIds: unique(duplicateIds),
      invalidPrereqReferences,
      invalidRemediationReferences,
      cycles,
      unreachableSkills,
    },
    errors,
  };
}

export const ratioRateSkillGraph = {
  domainId: 'ratio-rate',
  domainName: 'Ratio & Rate',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default ratioRateSkillGraph;
