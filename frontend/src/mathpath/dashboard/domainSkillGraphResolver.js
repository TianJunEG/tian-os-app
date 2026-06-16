// Maps a canonical MathPath domainId to the frontend skill graph + skill
// lookup used by the parent dashboard engine. Phase 1 of the parent-dashboard
// domain-parity work: the engine no longer hardcodes the fractions graph — it
// resolves the right graph per domain through here.
//
// Notes / known gaps (to be closed in later phases):
//  - The canonical registry domains are P6-level; this maps to the P6 frontend
//    graphs where they exist. Lower-primary-only domains (money, time,
//    operations/four_operations, number_sense, measurement) have no P6 graph yet
//    and fall back to an empty graph + identity lookup, so the dashboard degrades
//    gracefully (0 total skills, raw skill IDs) rather than mis-attributing
//    fractions skills. Per-level resolution is a Phase 2/3 concern.
//  - `area_perimeter` maps to the P6 area & volume graph as the closest
//    available figure-geometry graph until a dedicated one exists.

import { fractionSkillGraph, getSkill as getFractionSkill } from '../fractions/fractionSkillGraph.js';
import { p6PercentageSkillGraph, getSkill as getPercentageSkill } from '../primary/p6PercentageSkillGraph.js';
import { p6RatioSkillGraph, getSkill as getRatioSkill } from '../primary/p6RatioSkillGraph.js';
import { p6CirclesSkillGraph, getSkill as getCirclesSkill } from '../primary/p6CirclesSkillGraph.js';
import { p6GeometrySkillGraph, getSkill as getGeometrySkill } from '../primary/p6GeometrySkillGraph.js';
import { p6AlgebraSkillGraph, getSkill as getAlgebraSkill } from '../primary/p6AlgebraSkillGraph.js';
import { p6AreaVolSkillGraph, getSkill as getAreaVolSkill } from '../primary/p6AreaVolSkillGraph.js';
import { p6DataAnalysisSkillGraph, getSkill as getDataAnalysisSkill } from '../primary/p6DataAnalysisSkillGraph.js';
import { p6SpeedSkillGraph, getSkill as getSpeedSkill } from '../primary/p6SpeedSkillGraph.js';

// Empty graph + identity lookup for domains without a frontend graph yet.
const EMPTY_GRAPH = { domainId: 'unknown', skillIds: [] };
function identityGetSkill() { return null; }

// Canonical domainId → { skillGraph, getSkill }. Keyed on the registry's
// underscore canonical IDs (see services/domains/domainRegistry.js).
const REGISTRY = {
  fractions: { skillGraph: fractionSkillGraph, getSkill: getFractionSkill },
  percentage: { skillGraph: p6PercentageSkillGraph, getSkill: getPercentageSkill },
  ratio: { skillGraph: p6RatioSkillGraph, getSkill: getRatioSkill },
  circles: { skillGraph: p6CirclesSkillGraph, getSkill: getCirclesSkill },
  geometry: { skillGraph: p6GeometrySkillGraph, getSkill: getGeometrySkill },
  algebra: { skillGraph: p6AlgebraSkillGraph, getSkill: getAlgebraSkill },
  volume: { skillGraph: p6AreaVolSkillGraph, getSkill: getAreaVolSkill },
  area_perimeter: { skillGraph: p6AreaVolSkillGraph, getSkill: getAreaVolSkill },
  statistics: { skillGraph: p6DataAnalysisSkillGraph, getSkill: getDataAnalysisSkill },
  speed: { skillGraph: p6SpeedSkillGraph, getSkill: getSpeedSkill },
};

// Domains that are intentionally not yet mapped (lower-primary-only). Listed so
// callers/tests can distinguish "deliberately unmapped" from "typo".
export const UNMAPPED_DOMAINS = ['four_operations', 'number_sense', 'money', 'time', 'measurement'];

export function hasDomainSkillGraph(domainId) {
  return Object.prototype.hasOwnProperty.call(REGISTRY, String(domainId || ''));
}

// Resolve the skill graph + lookup for a domain. Unknown/unmapped domains get a
// safe empty graph + identity lookup so the engine degrades gracefully.
export function resolveDomainSkillGraph(domainId) {
  const key = String(domainId || 'fractions');
  if (REGISTRY[key]) return REGISTRY[key];
  return { skillGraph: { ...EMPTY_GRAPH, domainId: key }, getSkill: identityGetSkill };
}

export default { resolveDomainSkillGraph, hasDomainSkillGraph, UNMAPPED_DOMAINS };
