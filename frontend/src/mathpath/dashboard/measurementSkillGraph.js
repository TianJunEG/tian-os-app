import { p1MeasurementSkillGraph } from '../primary/p1MeasurementSkillGraph.js';
import { p3MeasTimeSkillGraph } from '../primary/p3MeasTimeSkillGraph.js';

const allSkills = [
  ...p1MeasurementSkillGraph.skills,
  ...p3MeasTimeSkillGraph.skills.filter((s) => s.strand === 'Measurement'),
];

const skillById = new Map(allSkills.map((s) => [s.id, s]));

export function getSkill(id) { return skillById.get(id) || null; }

export const measurementSkillGraph = {
  domainId: 'measurement',
  domainName: 'Measurement (P1, P3)',
  version: '1.0.0',
  skillIds: allSkills.map((s) => s.id),
  skills: allSkills,
};

export default measurementSkillGraph;
