// MathPath domain: Early Numeracy (Kindergarten / K2)
//
// Grounded in Singapore MOE's Nurturing Early Learners (NEL) 2022 framework,
// Educators' Guide for Numeracy. NEL numeracy is play-based and observation-led,
// NOT test-driven — so this domain runs in a gentle "Explore & Practise" mode:
// no high-stakes diagnostic, no fluency/retention drills. Mastery thresholds are
// intentionally low and surface to parents as encouraging "readiness signals",
// not grades. See docs/k2-numeracy-scope.md.
//
// v1 covers Strand A — Counting & Number Sense (NEL Learning Goal 3). Patterns
// (LG2), Shapes & Spatial (LG4) and Informal Measurement (LG2) follow in later
// strands once this slice is validated.

const earlyNumeracySkills = [
  {
    id: 'EN001',
    slug: 'en.count.to10',
    name: 'Counting to 10',
    description: 'Rote count to 10 and count along one-to-one.',
    strand: 'Counting & Number',
    prerequisites: [],
    crossDomainPrerequisites: [],
    difficulty: 1,
    singaporeLevel: ['K2'],
    mastery: { minimumAccuracy: 70, minimumQuestions: 5 },
    remediationIfWeak: [],
    misconceptions: ['en/skips-a-number', 'en/double-counts'],
    questionFamilies: ['QF_EN001_001', 'QF_EN001_002'],
  },
  {
    id: 'EN002',
    slug: 'en.count.objects',
    name: 'How many? (counting objects)',
    description: 'Count a set of objects one-to-one and say how many there are (cardinality).',
    strand: 'Counting & Number',
    prerequisites: ['EN001'],
    crossDomainPrerequisites: [],
    difficulty: 1,
    singaporeLevel: ['K2'],
    mastery: { minimumAccuracy: 70, minimumQuestions: 5 },
    remediationIfWeak: ['EN001'],
    misconceptions: ['en/recounts-for-total', 'en/counts-not-cardinal'],
    questionFamilies: ['QF_EN002_001', 'QF_EN002_002'],
  },
  {
    id: 'EN003',
    slug: 'en.count.to20',
    name: 'Counting to 20',
    description: 'Rote count and count objects reliably up to 20.',
    strand: 'Counting & Number',
    prerequisites: ['EN001'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['K2'],
    mastery: { minimumAccuracy: 70, minimumQuestions: 5 },
    remediationIfWeak: ['EN001'],
    misconceptions: ['en/teen-number-confusion'],
    questionFamilies: ['QF_EN003_001', 'QF_EN003_002'],
  },
  {
    id: 'EN004',
    slug: 'en.numerals.to10',
    name: 'Numbers 0 to 10',
    description: 'Recognise numerals 0–10 and match a numeral to the quantity it represents.',
    strand: 'Counting & Number',
    prerequisites: ['EN002'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['K2'],
    mastery: { minimumAccuracy: 70, minimumQuestions: 5 },
    remediationIfWeak: ['EN002'],
    misconceptions: ['en/numeral-quantity-mismatch'],
    questionFamilies: ['QF_EN004_001', 'QF_EN004_002'],
  },
  {
    id: 'EN005',
    slug: 'en.compare.sets',
    name: 'More, fewer or the same',
    description: 'Compare two sets of up to 10 things using "more than", "fewer than" and "same as".',
    strand: 'Counting & Number',
    prerequisites: ['EN002'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['K2'],
    mastery: { minimumAccuracy: 70, minimumQuestions: 5 },
    remediationIfWeak: ['EN002'],
    misconceptions: ['en/longer-row-is-more', 'en/confuses-more-fewer'],
    questionFamilies: ['QF_EN005_001', 'QF_EN005_002'],
  },
  {
    id: 'EN006',
    slug: 'en.bonds.to10',
    name: 'Number bonds to 10',
    description: 'Name the parts that make a whole up to 10 (e.g. 5 is 2 and 3).',
    strand: 'Counting & Number',
    prerequisites: ['EN004'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['K2'],
    mastery: { minimumAccuracy: 70, minimumQuestions: 5 },
    remediationIfWeak: ['EN004'],
    misconceptions: ['en/part-whole-confusion'],
    questionFamilies: ['QF_EN006_001', 'QF_EN006_002'],
  },
  {
    id: 'EN007',
    slug: 'en.add.within10',
    name: 'Adding within 10',
    description: 'Put two groups together to find how many altogether (within 10).',
    strand: 'Counting & Number',
    prerequisites: ['EN006'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['K2'],
    mastery: { minimumAccuracy: 70, minimumQuestions: 5 },
    remediationIfWeak: ['EN006'],
    misconceptions: ['en/counts-one-group-only'],
    questionFamilies: ['QF_EN007_001', 'QF_EN007_002'],
  },
  {
    id: 'EN008',
    slug: 'en.subtract.within10',
    name: 'Taking away within 10',
    description: 'Take some away from a group to find how many are left (within 10).',
    strand: 'Counting & Number',
    prerequisites: ['EN006'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['K2'],
    mastery: { minimumAccuracy: 70, minimumQuestions: 5 },
    remediationIfWeak: ['EN006'],
    misconceptions: ['en/adds-instead-of-takes-away'],
    questionFamilies: ['QF_EN008_001', 'QF_EN008_002'],
  },

  // ── Strand B — Relationships & Patterns (NEL Learning Goal 2) ──────────────
  {
    id: 'EN009',
    slug: 'en.sort.match',
    name: 'Same and different',
    description: 'Match and sort things by an attribute — colour or shape.',
    strand: 'Patterns',
    prerequisites: [],
    crossDomainPrerequisites: [],
    difficulty: 1,
    singaporeLevel: ['K2'],
    mastery: { minimumAccuracy: 70, minimumQuestions: 5 },
    remediationIfWeak: [],
    misconceptions: ['en/matches-wrong-attribute'],
    questionFamilies: ['QF_EN009_001', 'QF_EN009_002'],
  },
  {
    id: 'EN010',
    slug: 'en.compare.size',
    name: 'Bigger and smaller',
    description: 'Compare two things by size using "bigger" and "smaller".',
    strand: 'Patterns',
    prerequisites: ['EN009'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['K2'],
    mastery: { minimumAccuracy: 70, minimumQuestions: 5 },
    remediationIfWeak: ['EN009'],
    misconceptions: ['en/confuses-bigger-smaller'],
    questionFamilies: ['QF_EN010_001', 'QF_EN010_002'],
  },
  {
    id: 'EN011',
    slug: 'en.pattern.next',
    name: 'What comes next?',
    description: 'Recognise and extend a repeating pattern (e.g. ABAB).',
    strand: 'Patterns',
    prerequisites: ['EN009'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['K2'],
    mastery: { minimumAccuracy: 70, minimumQuestions: 5 },
    remediationIfWeak: ['EN009'],
    misconceptions: ['en/pattern-picks-any'],
    questionFamilies: ['QF_EN011_001', 'QF_EN011_002'],
  },
  {
    id: 'EN012',
    slug: 'en.pattern.missing',
    name: "What's missing?",
    description: 'Find the missing item in the middle of a repeating pattern.',
    strand: 'Patterns',
    prerequisites: ['EN011'],
    crossDomainPrerequisites: [],
    difficulty: 3,
    singaporeLevel: ['K2'],
    mastery: { minimumAccuracy: 70, minimumQuestions: 5 },
    remediationIfWeak: ['EN011'],
    misconceptions: ['en/pattern-ignores-position'],
    questionFamilies: ['QF_EN012_001', 'QF_EN012_002'],
  },
  {
    id: 'EN022',
    slug: 'en.sort.groups',
    name: 'Sort into groups',
    description: 'Sort objects into groups by an attribute (drag each into the right box).',
    strand: 'Patterns',
    prerequisites: ['EN009'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['K2'],
    mastery: { minimumAccuracy: 70, minimumQuestions: 5 },
    remediationIfWeak: ['EN009'],
    misconceptions: ['en/sorts-wrong-group'],
    questionFamilies: ['QF_EN022_001', 'QF_EN022_002'],
  },

  // ── Strand C — Basic Shapes & Spatial Concepts (NEL Learning Goal 4) ───────
  {
    id: 'EN013',
    slug: 'en.shapes.recognise',
    name: 'Basic shapes',
    description: 'Recognise and name circle, square, rectangle and triangle.',
    strand: 'Shapes & Space',
    prerequisites: [],
    crossDomainPrerequisites: [],
    difficulty: 1,
    singaporeLevel: ['K2'],
    mastery: { minimumAccuracy: 70, minimumQuestions: 5 },
    remediationIfWeak: [],
    misconceptions: ['en/shape-name-mismatch'],
    questionFamilies: ['QF_EN013_001', 'QF_EN013_002'],
  },
  {
    id: 'EN014',
    slug: 'en.shapes.attributes',
    name: 'Shape sides & corners',
    description: 'Know the attributes of the basic shapes (a triangle has 3 sides).',
    strand: 'Shapes & Space',
    prerequisites: ['EN013'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['K2'],
    mastery: { minimumAccuracy: 70, minimumQuestions: 5 },
    remediationIfWeak: ['EN013'],
    misconceptions: ['en/miscounts-sides'],
    questionFamilies: ['QF_EN014_001', 'QF_EN014_002'],
  },
  {
    id: 'EN015',
    slug: 'en.shapes.around',
    name: 'Shapes around us',
    description: 'Recognise basic shapes in everyday objects.',
    strand: 'Shapes & Space',
    prerequisites: ['EN013'],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['K2'],
    mastery: { minimumAccuracy: 70, minimumQuestions: 5 },
    remediationIfWeak: ['EN013'],
    misconceptions: ['en/shape-name-mismatch'],
    questionFamilies: ['QF_EN015_001', 'QF_EN015_002'],
  },
  {
    id: 'EN016',
    slug: 'en.spatial.direction',
    name: 'Which way?',
    description: 'Use direction words — up, down, left and right.',
    strand: 'Shapes & Space',
    prerequisites: [],
    crossDomainPrerequisites: [],
    difficulty: 1,
    singaporeLevel: ['K2'],
    mastery: { minimumAccuracy: 70, minimumQuestions: 5 },
    remediationIfWeak: [],
    misconceptions: ['en/confuses-left-right'],
    questionFamilies: ['QF_EN016_001', 'QF_EN016_002'],
  },

  // ── Strand D — Informal Measurement (NEL Learning Goal 2, comparison) ──────
  // Compare by a single attribute. Size (bigger/smaller) lives in EN010; these
  // cover the other measurable attributes NEL names.
  {
    id: 'EN017',
    slug: 'en.measure.length',
    name: 'Longer & shorter',
    description: 'Compare two things by length (longer / shorter).',
    strand: 'Measuring',
    prerequisites: [],
    crossDomainPrerequisites: [],
    difficulty: 1,
    singaporeLevel: ['K2'],
    mastery: { minimumAccuracy: 70, minimumQuestions: 5 },
    remediationIfWeak: [],
    misconceptions: ['en/confuses-longer-shorter'],
    questionFamilies: ['QF_EN017_001', 'QF_EN017_002'],
  },
  {
    id: 'EN018',
    slug: 'en.measure.height',
    name: 'Taller & shorter',
    description: 'Compare two things by height (taller / shorter).',
    strand: 'Measuring',
    prerequisites: [],
    crossDomainPrerequisites: [],
    difficulty: 1,
    singaporeLevel: ['K2'],
    mastery: { minimumAccuracy: 70, minimumQuestions: 5 },
    remediationIfWeak: [],
    misconceptions: ['en/confuses-taller-shorter'],
    questionFamilies: ['QF_EN018_001', 'QF_EN018_002'],
  },
  {
    id: 'EN019',
    slug: 'en.measure.weight',
    name: 'Heavier & lighter',
    description: 'Compare two things by weight (heavier / lighter).',
    strand: 'Measuring',
    prerequisites: [],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['K2'],
    mastery: { minimumAccuracy: 70, minimumQuestions: 5 },
    remediationIfWeak: [],
    misconceptions: ['en/confuses-heavier-lighter'],
    questionFamilies: ['QF_EN019_001', 'QF_EN019_002'],
  },
  {
    id: 'EN020',
    slug: 'en.measure.capacity',
    name: 'Holds more & less',
    description: 'Compare two containers by how much they hold.',
    strand: 'Measuring',
    prerequisites: [],
    crossDomainPrerequisites: [],
    difficulty: 2,
    singaporeLevel: ['K2'],
    mastery: { minimumAccuracy: 70, minimumQuestions: 5 },
    remediationIfWeak: [],
    misconceptions: ['en/confuses-holds-more-less'],
    questionFamilies: ['QF_EN020_001', 'QF_EN020_002'],
  },
  {
    id: 'EN021',
    slug: 'en.spatial.position',
    name: 'On top & at the bottom',
    description: 'Use position words — top and bottom — to describe where things are.',
    strand: 'Shapes & Space',
    prerequisites: [],
    crossDomainPrerequisites: [],
    difficulty: 1,
    singaporeLevel: ['K2'],
    mastery: { minimumAccuracy: 70, minimumQuestions: 5 },
    remediationIfWeak: [],
    misconceptions: ['en/confuses-top-bottom'],
    questionFamilies: ['QF_EN021_001', 'QF_EN021_002'],
  },
  {
    id: 'EN023',
    slug: 'en.spatial.distance',
    name: 'Near & far',
    description: 'Use distance words — near and far — to describe where things are.',
    strand: 'Shapes & Space',
    prerequisites: [],
    crossDomainPrerequisites: [],
    difficulty: 1,
    singaporeLevel: ['K2'],
    mastery: { minimumAccuracy: 70, minimumQuestions: 5 },
    remediationIfWeak: [],
    misconceptions: ['en/confuses-near-far'],
    questionFamilies: ['QF_EN023_001', 'QF_EN023_002'],
  },
];

const skills = earlyNumeracySkills.map((skill) => ({ ...skill }));
const skillById = new Map(skills.map((skill) => [skill.id, skill]));
const skillBySlug = new Map(skills.filter((s) => s.slug).map((s) => [s.slug, s]));

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

// Resolve by canonical id (EN001) or slug (en.count.to10), mirroring the
// Operations graph so the practice service can accept either form.
export function getSkill(skillId) {
  return skillById.get(skillId) || skillBySlug.get(skillId) || null;
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

export function validateEarlyNumeracySkillGraph() {
  const actualIds = skills.map((s) => s.id);
  const duplicateIds = actualIds.filter((id, index) => actualIds.indexOf(id) !== index);
  const invalidPrereqReferences = skills.flatMap((skill) =>
    skill.prerequisites.filter((prereqId) => !skillById.has(prereqId))
      .map((invalidPrereqId) => ({ skillId: skill.id, invalidPrereqId }))
  );
  const cycles = detectCycles(skills);
  const errors = unique([
    ...(duplicateIds.length ? ['Duplicate skill IDs detected.'] : []),
    ...(invalidPrereqReferences.length ? ['Invalid prerequisite references.'] : []),
    ...(cycles.length ? ['Circular dependency detected.'] : []),
  ]);
  return {
    isValid: errors.length === 0,
    summary: { totalSkills: skills.length, duplicateIds: unique(duplicateIds), invalidPrereqReferences, cycles },
    errors,
  };
}

export const earlyNumeracySkillGraph = {
  domainId: 'early_numeracy',
  domainName: 'Numeracy (K2)',
  version: '1.0.0',
  skillIds: skills.map((s) => s.id),
  skills,
};

export default earlyNumeracySkillGraph;
