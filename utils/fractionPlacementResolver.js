const MODE_RANGES = {
  basic: ['F001', 'F005'],
  core: ['F001', 'F019'],
  full: ['F001', 'F026'],
};

function skillNum(id = '') {
  return Number(String(id).replace(/^F/i, '')) || 0;
}

function inModeRange(skillId = '', mode = 'core') {
  const [start, end] = MODE_RANGES[mode] || MODE_RANGES.core;
  const n = skillNum(skillId);
  return n >= skillNum(start) && n <= skillNum(end);
}

function earliestInRange(skillIds = [], mode = 'core') {
  return [...skillIds]
    .filter((id) => inModeRange(id, mode))
    .sort((a, b) => skillNum(a) - skillNum(b))[0] || null;
}

export function normalizeDiagnosticModeForLevel(level = '', requestedMode = '') {
  const l = String(level || '').toUpperCase();
  if (requestedMode && ['basic', 'core', 'full'].includes(String(requestedMode).toLowerCase())) {
    return String(requestedMode).toLowerCase();
  }
  if (l === 'P3') return 'basic';
  if (l === 'P4') return 'core';
  if (l === 'P1' || l === 'P2') return 'basic';
  return 'full';
}

// Fractions-first recommendation resolver:
// 1) prefer weakest/root-gap F-code inside mode range
// 2) else placement recommended skill if in range
// 3) else earliest target skill in diagnostic scope
export function resolveFractionsStartingSkill({
  mode = 'core',
  weakSkills = [],
  prerequisiteGaps = [],
  placementRecommended = null,
  targetSkillIds = [],
}) {
  const rootGapIds = prerequisiteGaps
    .map((g) => g?.rootGap?.skillId || g?.rootGap)
    .filter(Boolean);
  const weakIds = weakSkills.map((w) => w?.skillId || w).filter(Boolean);
  const preferred = earliestInRange([...rootGapIds, ...weakIds], mode);
  if (preferred) return preferred;

  const recommendedId = placementRecommended?.skillId || placementRecommended || null;
  if (recommendedId && inModeRange(recommendedId, mode)) return recommendedId;

  return earliestInRange(targetSkillIds, mode) || 'F001';
}

