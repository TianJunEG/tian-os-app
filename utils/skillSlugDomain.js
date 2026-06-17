// Maps a Skill slug prefix to the canonical MathPath domainId used by the domain
// registry. MathPath skill slugs are 'prefix.rest' — e.g. 'fr.equivalent',
// 'pct.convert', 'rr.meaning', 'cir.area'. The prefix (segment before the first
// '.') identifies the domain.
//
// Used by the /mastery route to tag each returned record with its domainId so
// adult dashboards can filter mastery by domain (parent-dashboard domain parity,
// phase 2). Purely additive — no existing behaviour depends on this field.

const PREFIX_TO_DOMAIN = {
  fr: 'fractions',
  dec: 'decimals',
  pct: 'percentage',
  rr: 'ratio',
  op: 'four_operations',
  ns: 'number_sense',
  geo: 'geometry',
  mea: 'measurement',
  alg: 'algebra',
  stat: 'statistics',
  ap: 'area_perimeter',
  tim: 'time',
  mon: 'money',
  vol: 'volume',
  cir: 'circles',
};

// Returns the canonical domainId for a skill slug, or null when the slug is
// missing or its prefix is unrecognised (caller decides how to treat unknowns).
export function domainIdFromSlug(slug) {
  const s = String(slug || '');
  if (!s) return null;
  const prefix = s.includes('.') ? s.slice(0, s.indexOf('.')) : s;
  return PREFIX_TO_DOMAIN[prefix] || null;
}

export { PREFIX_TO_DOMAIN };
export default { domainIdFromSlug, PREFIX_TO_DOMAIN };
