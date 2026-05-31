import {
  fractionUniversalSkills,
  getUniversalSkillByFrameworkId,
  getUniversalSkillBySkillId,
} from './fractionUniversalSkills.js';
import {
  fractionCurriculumMappings,
  getFractionCurriculumMappingByFrameworkId,
  getFractionCurriculumMappingBySkillId,
  fractionCurriculumMeta,
} from './fractionCurriculumMappings.js';

const DEFAULT_COUNTRY = 'SG';
const DEFAULT_CURRICULUM = 'MOE_PRIMARY_MATH_2021';
const DEFAULT_DOMAIN = 'fractions';
const LEVEL_ORDER = fractionCurriculumMeta.levelOrder || ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];
const LEVEL_ALIASES = fractionCurriculumMeta.levelAliases || {};

export function normalizeCurriculum(value, level = '') {
  const raw = String(value || '').trim().toUpperCase();
  if (raw) return raw;
  const lv = normalizeLevel(level);
  if (lv.startsWith('S')) return 'MOE_SECONDARY_G1_MATH_2021';
  return DEFAULT_CURRICULUM;
}

function normalizeLevel(level) {
  const raw = String(level || '').trim().toUpperCase();
  if (LEVEL_ORDER.includes(raw)) return raw;
  const compact = raw.replace(/[^A-Z0-9]/g, '');
  return LEVEL_ALIASES[compact] || raw;
}

function levelRank(level) {
  const idx = LEVEL_ORDER.indexOf(normalizeLevel(level));
  return idx >= 0 ? idx : Number.POSITIVE_INFINITY;
}

function normalizeSkillRef(skillRef) {
  if (!skillRef) return '';
  const text = String(skillRef).trim();
  if (/^F\d{3}$/i.test(text)) return text.toUpperCase();
  return text;
}

function skillRefToFrameworkSkillId(skillRef) {
  const normalized = normalizeSkillRef(skillRef);
  if (!normalized) return '';
  if (/^F\d{3}$/i.test(normalized)) return normalized;
  const universal = getUniversalSkillBySkillId(normalized);
  if (universal?.frameworkSkillId) return universal.frameworkSkillId;
  const fromRow = fractionUniversalSkills.find(
    (row) => row.skillId === normalized || row.title.toLowerCase() === normalized.toLowerCase()
  );
  return fromRow?.frameworkSkillId || '';
}

function inLevelBand(mapping, targetLevel) {
  if (!mapping || !targetLevel) return true;
  const targetRank = levelRank(targetLevel);
  if (!Number.isFinite(targetRank)) return true;
  const introducedRank = Math.min(...(mapping.levelBand || []).map(levelRank).filter(Number.isFinite));
  return Number.isFinite(introducedRank) ? introducedRank <= targetRank : true;
}

function sortByPathwayOrder(rows = []) {
  return [...rows].sort((a, b) => (a.pathwayOrder || 0) - (b.pathwayOrder || 0));
}

function buildEnrichedUniversalSkill(universalSkill, mapping = null) {
  if (!universalSkill) return null;
  return {
    ...universalSkill,
    mapping,
    levelTag: mapping?.level || null,
    introducedLevel: mapping?.introducedLevel || null,
    masteryLevel: mapping?.masteryLevel || null,
    levelBand: mapping?.levelBand || [],
    strand: mapping?.strand || null,
    subStrand: mapping?.subStrand || null,
    syllabusRef: mapping?.syllabusRef || null,
  };
}

export function getSkillCurriculumMapping(skillRef, options = {}) {
  const country = String(options.country || DEFAULT_COUNTRY).toUpperCase();
  const curriculum = normalizeCurriculum(options.curriculum, options.level || options.studentLevel);
  const frameworkSkillId = skillRefToFrameworkSkillId(skillRef);
  if (frameworkSkillId) {
    return getFractionCurriculumMappingByFrameworkId(frameworkSkillId, { country, curriculum });
  }
  const normalized = normalizeSkillRef(skillRef);
  return getFractionCurriculumMappingBySkillId(normalized, { country, curriculum });
}

export function getSkillsByCountryCurriculumLevel(options = {}) {
  const country = String(options.country || DEFAULT_COUNTRY).toUpperCase();
  const curriculum = normalizeCurriculum(options.curriculum, options.level || options.studentLevel);
  const domain = String(options.domain || DEFAULT_DOMAIN).toLowerCase();
  const level = normalizeLevel(options.level);
  const includeFutureLevels = Boolean(options.includeFutureLevels);

  const rows = fractionUniversalSkills
    .filter((skill) => String(skill.domain || '').toLowerCase() === domain)
    .map((skill) => {
      const mapping = getSkillCurriculumMapping(skill.frameworkSkillId, { country, curriculum });
      return buildEnrichedUniversalSkill(skill, mapping);
    })
    .filter((row) => row.mapping);

  if (!level || includeFutureLevels) return sortByPathwayOrder(rows);
  return sortByPathwayOrder(rows.filter((row) => inLevelBand(row.mapping, level)));
}

export function getPrerequisiteSkills(skillRef, options = {}) {
  const frameworkSkillId = skillRefToFrameworkSkillId(skillRef);
  const universal = frameworkSkillId ? getUniversalSkillByFrameworkId(frameworkSkillId) : getUniversalSkillBySkillId(skillRef);
  if (!universal) return [];
  return sortByPathwayOrder(
    (universal.prerequisites || [])
      .map((prereqRef) => {
        const prereqFrameworkId = skillRefToFrameworkSkillId(prereqRef) || prereqRef;
        const prereqUniversal = getUniversalSkillByFrameworkId(prereqFrameworkId) || getUniversalSkillBySkillId(prereqRef);
        if (!prereqUniversal) return null;
        const mapping = getSkillCurriculumMapping(prereqFrameworkId, options);
        return buildEnrichedUniversalSkill(prereqUniversal, mapping);
      })
      .filter(Boolean)
  );
}

export function getRemediationSkillsForWeakPrerequisites(options = {}) {
  const weakSkillIds = Array.isArray(options.weakSkillIds) ? options.weakSkillIds : [];
  const seen = new Set();
  const queue = [];

  function collect(ref) {
    const frameworkSkillId = skillRefToFrameworkSkillId(ref);
    if (!frameworkSkillId || seen.has(frameworkSkillId)) return;
    seen.add(frameworkSkillId);
    const prereqs = getPrerequisiteSkills(frameworkSkillId, options);
    prereqs.forEach((skill) => {
      if (!skill?.frameworkSkillId) return;
      queue.push(skill);
      collect(skill.frameworkSkillId);
    });
  }

  weakSkillIds.forEach((skillRef) => collect(skillRef));

  const byFramework = new Map();
  queue.forEach((skill) => {
    if (!byFramework.has(skill.frameworkSkillId)) {
      byFramework.set(skill.frameworkSkillId, skill);
    }
  });
  return sortByPathwayOrder([...byFramework.values()]);
}

export function getVisibleSkillsForStudentLevel(options = {}) {
  const country = String(options.country || DEFAULT_COUNTRY).toUpperCase();
  const curriculum = normalizeCurriculum(options.curriculum, options.studentLevel || options.level);
  const domain = String(options.domain || DEFAULT_DOMAIN).toLowerCase();
  const studentLevel = normalizeLevel(options.studentLevel || options.level);
  const weakSkillIds = Array.isArray(options.weakSkillIds) ? options.weakSkillIds : [];
  const currentSkillId = options.currentSkillId ? String(options.currentSkillId) : '';

  const visible = getSkillsByCountryCurriculumLevel({
    country,
    curriculum,
    domain,
    level: studentLevel,
  });

  const extras = [];
  const fromCurrent = currentSkillId ? getPrerequisiteSkills(currentSkillId, { country, curriculum }) : [];
  const fromWeak = getRemediationSkillsForWeakPrerequisites({
    weakSkillIds,
    country,
    curriculum,
  });
  extras.push(...fromCurrent, ...fromWeak);

  const keyed = new Map();
  [...visible, ...extras].forEach((row) => {
    if (!row?.frameworkSkillId) return;
    keyed.set(row.frameworkSkillId, row);
  });

  return sortByPathwayOrder([...keyed.values()]);
}

export function getCurriculumCoverageSummary(options = {}) {
  const country = String(options.country || DEFAULT_COUNTRY).toUpperCase();
  const curriculum = normalizeCurriculum(options.curriculum, options.studentLevel || options.level);
  const domain = String(options.domain || DEFAULT_DOMAIN).toLowerCase();
  const levels = [...new Set(
    fractionCurriculumMappings
      .filter((mapping) =>
        mapping.country === country
        && mapping.curriculum === curriculum
        && String(mapping.skillId || '').startsWith(`${domain}.`)
      )
      .flatMap((mapping) => mapping.levelBand || [])
  )].sort((a, b) => levelRank(a) - levelRank(b));

  return {
    country,
    curriculum,
    domain,
    totalUniversalSkills: fractionUniversalSkills.filter((skill) => skill.domain === domain).length,
    mappedSkills: fractionCurriculumMappings.filter((mapping) => mapping.country === country && mapping.curriculum === curriculum).length,
    levels,
  };
}

export default {
  normalizeCurriculum,
  getSkillCurriculumMapping,
  getSkillsByCountryCurriculumLevel,
  getPrerequisiteSkills,
  getVisibleSkillsForStudentLevel,
  getRemediationSkillsForWeakPrerequisites,
  getCurriculumCoverageSummary,
};
