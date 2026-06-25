// Singapore primary level → ordinal for comparison (K = 0, P1..P6 = 1..6,
// Secondary = 7). Returns null when the level can't be parsed.
export function levelOrdinal(level) {
  const l = String(level || '').toUpperCase().trim();
  if (!l) return null;
  if (l.startsWith('K')) return 0;
  if (/SEC|SECONDARY|^S\d/.test(l)) return 7;
  const m = l.match(/([1-6])/);
  return m ? Number(m[1]) : null;
}

// Show a skill's level tag only when it is at or above the student's own level.
// A P5 student practising a remedial P1 skill should not be shown a demoralising
// "Primary 1" badge, so we hide the tag (return '') when the skill level is below
// the student's. When either level is unknown, the tag is shown unchanged.
export function visibleSkillLevel(skillLevel, studentLevel) {
  const label = String(skillLevel || '').trim();
  if (!label) return '';
  const s = levelOrdinal(skillLevel);
  const u = levelOrdinal(studentLevel);
  if (s == null || u == null) return label;
  return s < u ? '' : label;
}

export default visibleSkillLevel;
