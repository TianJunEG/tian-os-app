import {
  FRACTION_CANONICAL_SKILL_ROWS,
  getCanonicalFractionSkill,
} from './fractionCanonicalSkillMap.js';

const DIFFICULTY_BAND_BY_LEVEL = {
  1: 'beginner',
  2: 'basic',
  3: 'standard',
  4: 'advanced',
  5: 'challenge',
};

const QUESTION_TYPES_BY_STRAND = {
  Foundations: ['visual_model', 'short_answer', 'mcq'],
  Representation: ['number_line', 'visual_model', 'short_answer'],
  Comparison: ['comparison', 'visual_model', 'short_answer'],
  Equivalence: ['equation', 'short_answer', 'visual_model'],
  Conversion: ['symbolic', 'visual_model', 'short_answer'],
  Operations: ['symbolic', 'word_problem', 'short_answer'],
  Applications: ['word_problem', 'bar_model', 'short_answer'],
  'Assessment Prep': ['word_problem', 'multi_step', 'diagram'],
  Mastery: ['multi_step', 'word_problem', 'open_response'],
};

const MISTAKE_TYPES_BY_TOPIC = {
  'Understanding Fractions': ['M001', 'M003'],
  'Representing Fractions': ['M003'],
  'Comparing Fractions': ['M002', 'M004'],
  'Equivalent Fractions': ['M004', 'M005'],
  'Improper Fractions and Mixed Numbers': ['M006'],
  'Fraction Operations': ['M004', 'M007'],
  'Fraction Applications': ['M008', 'M010'],
};

function difficultyBand(row = {}) {
  const maxLevel = Math.max(...(row.levelBand || []).map((level) => Number(String(level).replace(/\D/g, '')) || 1));
  if (row.frameworkSkillId === 'F026') return 'challenge';
  if (maxLevel >= 6) return 'advanced';
  if (maxLevel >= 5) return 'standard';
  if (maxLevel >= 4) return 'basic';
  return DIFFICULTY_BAND_BY_LEVEL[1];
}

const FRACTION_UNIVERSAL_SKILL_ROWS = FRACTION_CANONICAL_SKILL_ROWS.map((row, index) => ({
  frameworkSkillId: row.frameworkSkillId,
  skillId: row.slug,
  title: row.displayName,
  description: row.description,
  prerequisites: [...row.prerequisites],
  difficultyBand: difficultyBand(row),
  questionTypes: QUESTION_TYPES_BY_STRAND[row.strand] || ['short_answer'],
  mistakeTypes: MISTAKE_TYPES_BY_TOPIC[row.topic] || [],
  pathwayOrder: index + 1,
}));

const universalByFrameworkId = new Map(
  FRACTION_UNIVERSAL_SKILL_ROWS.map((row) => [row.frameworkSkillId, row])
);

const universalBySkillId = new Map(
  FRACTION_UNIVERSAL_SKILL_ROWS.map((row) => [row.skillId, row])
);

export const fractionUniversalSkills = FRACTION_UNIVERSAL_SKILL_ROWS.map((row) => ({
  ...row,
  domain: 'fractions',
}));

export function getUniversalSkillByFrameworkId(frameworkSkillId) {
  const id = String(frameworkSkillId || '').toUpperCase();
  return universalByFrameworkId.get(id) || (getCanonicalFractionSkill(id)
    ? universalByFrameworkId.get(id)
    : null);
}

export function getUniversalSkillBySkillId(skillId) {
  return universalBySkillId.get(String(skillId || '')) || null;
}

export default fractionUniversalSkills;
