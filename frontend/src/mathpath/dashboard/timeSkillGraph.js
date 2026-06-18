import { p2TimeSkillGraph } from '../primary/p2TimeSkillGraph.js';
import { p3MeasTimeSkillGraph } from '../primary/p3MeasTimeSkillGraph.js';

const allSkills = [
  ...p2TimeSkillGraph.skills,
  ...p3MeasTimeSkillGraph.skills.filter((s) => s.strand === 'Time'),
];

const skillById = new Map(allSkills.map((s) => [s.id, s]));

export function getSkill(id) { return skillById.get(id) || null; }

export const timeSkillGraph = {
  domainId: 'time',
  domainName: 'Time (P2–P3)',
  version: '1.0.0',
  skillIds: allSkills.map((s) => s.id),
  skills: allSkills,
};

export default timeSkillGraph;
