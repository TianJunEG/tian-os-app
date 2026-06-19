// Maps a canonical MathPath domainId to the frontend skill graph + skill
// lookup used by the parent dashboard engine. Phase 1 of the parent-dashboard
// domain-parity work: the engine no longer hardcodes the fractions graph — it
// resolves the right graph per domain through here.
//
// Notes:
//  - `area_perimeter` maps to the P6 area & volume graph as the closest
//    available figure-geometry graph until a dedicated one exists.
//  - Lower-primary domains (money, time, measurement, four_operations,
//    number_sense) aggregate skills across all relevant P-levels.

import { fractionSkillGraph, getSkill as getFractionSkill } from '../fractions/fractionSkillGraph.js';
import { p6PercentageSkillGraph, getSkill as getPercentageSkill } from '../primary/p6PercentageSkillGraph.js';
import { p6RatioSkillGraph, getSkill as getRatioSkill } from '../primary/p6RatioSkillGraph.js';
import { p6CirclesSkillGraph, getSkill as getCirclesSkill } from '../primary/p6CirclesSkillGraph.js';
import { p6GeometrySkillGraph, getSkill as getGeometrySkill } from '../primary/p6GeometrySkillGraph.js';
import { p6AlgebraSkillGraph, getSkill as getAlgebraSkill } from '../primary/p6AlgebraSkillGraph.js';
import { p6AreaVolSkillGraph, getSkill as getAreaVolSkill } from '../primary/p6AreaVolSkillGraph.js';
import { p6DataAnalysisSkillGraph, getSkill as getDataAnalysisSkill } from '../primary/p6DataAnalysisSkillGraph.js';
import { p6SpeedSkillGraph, getSkill as getSpeedSkill } from '../primary/p6SpeedSkillGraph.js';
import { moneySkillGraph, getSkill as getMoneySkill } from './moneySkillGraph.js';
import { timeSkillGraph, getSkill as getTimeSkill } from './timeSkillGraph.js';
import { measurementSkillGraph, getSkill as getMeasurementSkill } from './measurementSkillGraph.js';
import { fourOperationsSkillGraph, getSkill as getFourOperationsSkill } from './fourOperationsSkillGraph.js';
import { numberSenseSkillGraph, getSkill as getNumberSenseSkill } from './numberSenseSkillGraph.js';

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
  money: { skillGraph: moneySkillGraph, getSkill: getMoneySkill },
  time: { skillGraph: timeSkillGraph, getSkill: getTimeSkill },
  measurement: { skillGraph: measurementSkillGraph, getSkill: getMeasurementSkill },
  four_operations: { skillGraph: fourOperationsSkillGraph, getSkill: getFourOperationsSkill },
  number_sense: { skillGraph: numberSenseSkillGraph, getSkill: getNumberSenseSkill },
};

export const UNMAPPED_DOMAINS = [];

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
