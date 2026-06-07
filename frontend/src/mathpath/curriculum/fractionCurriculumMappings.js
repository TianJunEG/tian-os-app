import {
  FRACTION_CANONICAL_SKILL_ROWS,
  FRACTIONS_PILOT_SCOPE_LABEL,
} from './fractionCanonicalSkillMap.js';
import { getUniversalSkillByFrameworkId } from './fractionUniversalSkills.js';

const LEVEL_ORDER = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'S1'];
const LEVEL_ALIASES = {
  PRIMARY1: 'P1',
  PRIMARY2: 'P2',
  PRIMARY3: 'P3',
  PRIMARY4: 'P4',
  PRIMARY5: 'P5',
  PRIMARY6: 'P6',
  SEC1: 'S1',
  S1G1: 'S1',
  SECONDARY1: 'S1',
  'SECONDARY 1': 'S1',
};

function parseLevels(value) {
  return String(value || '')
    .split('/')
    .map((part) => {
      const raw = String(part || '').trim().toUpperCase();
      if (LEVEL_ORDER.includes(raw)) return raw;
      const compact = raw.replace(/[^A-Z0-9]/g, '');
      return LEVEL_ALIASES[compact] || null;
    })
    .filter((part) => LEVEL_ORDER.includes(part));
}

function buildLevelBand(introducedLevel, masteryLevel, fallback = []) {
  const introduced = parseLevels(introducedLevel);
  const mastery = parseLevels(masteryLevel);
  const all = [...new Set([...introduced, ...mastery, ...fallback])];
  return all.sort((a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b));
}

const SG_BASE = {
  country: 'SG',
  curriculum: 'MOE_PRIMARY_MATH_2021',
  subject: 'Mathematics',
  phase: 'Primary',
  stream: 'Standard',
  domain: 'fractions',
  topic: 'Fractions',
  strand: 'Number and Algebra',
  subStrand: 'Fractions',
  syllabusTopic: 'Fractions',
  pilotScope: FRACTIONS_PILOT_SCOPE_LABEL,
  sourceDocument: 'Singapore MOE Primary Mathematics Syllabus (2021, updated October 2025)',
};

const SECONDARY_SG_BASE = {
  ...SG_BASE,
  curriculum: 'MOE_SECONDARY_G1_MATH_2021',
  phase: 'Secondary',
  stream: 'G1',
  level: 'S1',
  levelBand: ['S1'],
  sourceDocument: 'Singapore MOE Secondary 1 G1 Mathematics Syllabus (2021, updated October 2025)',
};

const S1_MAPPED_SKILL_REFS = {
  F010: 'N1.3',
  F013: 'N1.3',
  F014: 'N1.3',
  F017: 'N1.3',
  F018: 'N1.3',
  F021: 'N1.3',
  F022: 'N1.3',
  F023: 'N2.3',
  F025: 'N3.1',
 F026: 'N5.2',
};

const primaryMappings = FRACTION_CANONICAL_SKILL_ROWS.map((row) => {
  const universalSkill = getUniversalSkillByFrameworkId(row.frameworkSkillId);
  const levelBand = buildLevelBand(row.introducedLevel, row.masteryLevel, row.levelBand);
  return {
    ...SG_BASE,
    frameworkSkillId: row.frameworkSkillId,
    skillId: universalSkill?.skillId || row.slug,
    slug: row.slug,
    title: row.displayName,
    studentName: row.studentName,
    parentName: row.parentName,
    topic: SG_BASE.topic,
    level: levelBand[levelBand.length - 1] || row.masteryLevel,
    introducedLevel: row.introducedLevel,
    masteryLevel: row.masteryLevel,
    levelBand,
    prerequisites: [...row.prerequisites],
    questionFamilies: [...row.questionFamilies],
    syllabusOutcome: row.syllabusOutcome,
    syllabusRef: row.syllabusRef,
    notes: 'Canonical F-code mapping aligned to active fractionSkillGraph.js.',
  };
});

const secondaryMappings = primaryMappings
  .filter((mapping) => Object.keys(S1_MAPPED_SKILL_REFS).includes(mapping.frameworkSkillId))
  .map((mapping) => ({
    ...mapping,
    ...SECONDARY_SG_BASE,
    curriculum: 'MOE_SECONDARY_G1_MATH_2021',
    level: 'S1',
    levelBand: ['S1'],
    syllabusRef: S1_MAPPED_SKILL_REFS[mapping.frameworkSkillId] || mapping.syllabusRef,
    notes: 'Derived from canonical SG primary fraction mappings for Secondary 1 G1 support.',
  }));

export const fractionCurriculumMappings = [...primaryMappings, ...secondaryMappings];

const mappingByFrameworkId = new Map(
  fractionCurriculumMappings.map((mapping) => [`${mapping.country}::${mapping.curriculum}::${mapping.frameworkSkillId}`, mapping])
);

const mappingBySkillId = new Map(
  fractionCurriculumMappings
    .filter((mapping) => mapping.skillId)
    .map((mapping) => [`${mapping.country}::${mapping.curriculum}::${mapping.skillId}`, mapping])
);

export function getFractionCurriculumMappingByFrameworkId(frameworkSkillId, options = {}) {
  const country = String(options.country || 'SG').toUpperCase();
  const curriculum = String(options.curriculum || 'MOE_PRIMARY_MATH_2021').toUpperCase();
  const key = `${country}::${curriculum}::${String(frameworkSkillId || '').toUpperCase()}`;
  return mappingByFrameworkId.get(key) || null;
}

export function getFractionCurriculumMappingBySkillId(skillId, options = {}) {
  const country = String(options.country || 'SG').toUpperCase();
  const curriculum = String(options.curriculum || 'MOE_PRIMARY_MATH_2021').toUpperCase();
  const key = `${country}::${curriculum}::${String(skillId || '')}`;
  return mappingBySkillId.get(key) || null;
}

export function getAvailableFractionCurricula() {
  return [...new Set(
    fractionCurriculumMappings.map((mapping) => `${mapping.country}:${mapping.curriculum}`)
  )];
}

export function getAvailableFractionLevels(options = {}) {
  const country = String(options.country || 'SG').toUpperCase();
  const curriculum = String(options.curriculum || 'MOE_PRIMARY_MATH_2021').toUpperCase();
  const rows = fractionCurriculumMappings.filter(
    (mapping) => mapping.country === country && mapping.curriculum === curriculum
  );
  return [...new Set(rows.flatMap((mapping) => mapping.levelBand || []))]
    .sort((a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b));
}

export const fractionCurriculumMeta = {
  levelOrder: LEVEL_ORDER,
  levelAliases: LEVEL_ALIASES,
  pilotScope: FRACTIONS_PILOT_SCOPE_LABEL,
  availableCurricula: getAvailableFractionCurricula(),
};

export default fractionCurriculumMappings;
