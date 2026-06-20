// Server-side resolver: canonical domainId → that domain's shared skill graph.
// All 15 MathPath domains are registered here so the parent dashboard aggregator
// can resolve parent-friendly skill names and the correct total-skill denominator
// ("x of y mastered") for every domain including Fractions.

import { FRACTION_CANONICAL_SKILL_ROWS } from '../../shared/mathpath/curriculum/fractionCanonicalSkillMap.js';
import percentageSkillGraph from '../../shared/mathpath/percentages/percentageSkillGraph.js';
import ratioRateSkillGraph from '../../shared/mathpath/ratioRate/ratioRateSkillGraph.js';
import algebraSkillGraph from '../../shared/mathpath/algebra/AlgebraSkillGraph.js';
import geometrySkillGraph from '../../shared/mathpath/geometry/GeometrySkillGraph.js';
import volumeSkillGraph from '../../shared/mathpath/volume/VolumeSkillGraph.js';
import decimalsSkillGraph from '../../shared/mathpath/decimals/decimalsSkillGraph.js';
import areaPerimeterSkillGraph from '../../shared/mathpath/areaPerimeter/AreaPerimeterSkillGraph.js';
import circlesSkillGraph from '../../shared/mathpath/circles/CirclesSkillGraph.js';
import statisticsSkillGraph from '../../shared/mathpath/statistics/StatisticsSkillGraph.js';
import measurementSkillGraph from '../../shared/mathpath/measurement/MeasurementSkillGraph.js';
import moneySkillGraph from '../../shared/mathpath/money/MoneySkillGraph.js';
import timeSkillGraph from '../../shared/mathpath/time/TimeSkillGraph.js';
import numberSenseSkillGraph from '../../shared/mathpath/numberSense/NumberSenseSkillGraph.js';
import operationsSkillGraph from '../../shared/mathpath/operations/OperationsSkillGraph.js';
import earlyNumeracySkillGraph from '../../shared/mathpath/earlyNumeracy/EarlyNumeracySkillGraph.js';

// Fractions skill graph derived from the canonical skill map (F001–F026).
// Uses parentName so labels are parent-friendly ("Recognising fractions as equal parts").
const fractionsSkillGraph = {
  skills: FRACTION_CANONICAL_SKILL_ROWS.map((row) => ({ id: row.frameworkSkillId, name: row.parentName })),
};

// Keyed on the registry's canonical domainIds (services/domains/domainRegistry.js)
// — which match each practice service's DOMAIN_ID constant.
const GRAPHS = {
  fractions: fractionsSkillGraph,
  percentage: percentageSkillGraph,
  ratio: ratioRateSkillGraph,
  algebra: algebraSkillGraph,
  geometry: geometrySkillGraph,
  volume: volumeSkillGraph,
  decimals: decimalsSkillGraph,
  area_perimeter: areaPerimeterSkillGraph,
  circles: circlesSkillGraph,
  statistics: statisticsSkillGraph,
  measurement: measurementSkillGraph,
  money: moneySkillGraph,
  time: timeSkillGraph,
  number_sense: numberSenseSkillGraph,
  four_operations: operationsSkillGraph,
  early_numeracy: earlyNumeracySkillGraph,
};

export function hasDomainSkillGraph(domainId) {
  return Boolean(GRAPHS[String(domainId || '')]);
}

// Returns { domainId, skills, skillIds, nameFor, totalSkills, hasGraph }.
// `nameFor(skillId)` resolves a friendly name, falling back to the raw id.
export function getDomainSkillGraph(domainId) {
  const graph = GRAPHS[String(domainId || '')] || null;
  const skills = Array.isArray(graph?.skills) ? graph.skills : [];
  const nameById = new Map(skills.map((s) => [String(s.id), s.name || String(s.id)]));
  return {
    domainId,
    skills,
    skillIds: skills.map((s) => String(s.id)),
    totalSkills: skills.length,
    nameFor: (id) => nameById.get(String(id)) || String(id || ''),
    hasGraph: skills.length > 0,
  };
}

export default { hasDomainSkillGraph, getDomainSkillGraph };
