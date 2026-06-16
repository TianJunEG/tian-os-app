// Server-side resolver: canonical domainId → that domain's shared skill graph.
//
// Non-fractions MathPath practice persists progress to MathPathStudentSkillState
// keyed by the skill GRAPH id (e.g. 'PC001', 'GE001'), not a Mongo Skill _id.
// The parent dashboard aggregator uses this resolver to turn those ids into
// parent-friendly names and to know each domain's full skill count (the
// denominator for "x of y mastered").
//
// Fractions is intentionally absent: it flows through the legacy MasteryRecord +
// Skill collection path, so its names/denominator come from Mongo, unchanged.

import percentageSkillGraph from '../../shared/mathpath/percentages/percentageSkillGraph.js';
import ratioRateSkillGraph from '../../shared/mathpath/ratioRate/ratioRateSkillGraph.js';
import algebraSkillGraph from '../../shared/mathpath/algebra/AlgebraSkillGraph.js';
import geometrySkillGraph from '../../shared/mathpath/geometry/GeometrySkillGraph.js';
import volumeSkillGraph from '../../shared/mathpath/volume/VolumeSkillGraph.js';

// Keyed on the registry's canonical domainIds (services/domains/domainRegistry.js)
// — which match each practice service's DOMAIN_ID constant.
const GRAPHS = {
  percentage: percentageSkillGraph,
  ratio: ratioRateSkillGraph,
  algebra: algebraSkillGraph,
  geometry: geometrySkillGraph,
  volume: volumeSkillGraph,
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
