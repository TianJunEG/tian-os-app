// Server-side resolver: canonical domainId → that domain's shared skill graph.
//
// Non-fractions MathPath practice persists progress to MathPathStudentSkillState
// keyed by the skill GRAPH id (e.g. 'P001', 'GE001'), not a Mongo Skill _id.
// The parent dashboard aggregator uses this resolver to turn those ids into
// parent-friendly names and to know each domain's full skill count (the
// denominator for "x of y mastered").
//
// Every non-fractions domain whose practice route writes MathPathStudentSkillState
// and which ships a shared skill graph is registered here. Fractions is
// intentionally absent: it flows through the legacy MasteryRecord + Skill
// collection path, so its names/denominator come from Mongo, unchanged.

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

// Keyed on the registry's canonical domainIds (services/domains/domainRegistry.js)
// — which match each practice service's DOMAIN_ID constant.
const GRAPHS = {
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
