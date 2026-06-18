import { p1MoneySkillGraph } from '../primary/p1MoneySkillGraph.js';
import { p2MoneySkillGraph } from '../primary/p2MoneySkillGraph.js';
import { p3MoneySkillGraph } from '../primary/p3MoneySkillGraph.js';

const allSkills = [
  ...p1MoneySkillGraph.skills,
  ...p2MoneySkillGraph.skills,
  ...p3MoneySkillGraph.skills,
];

const skillById = new Map(allSkills.map((s) => [s.id, s]));

export function getSkill(id) { return skillById.get(id) || null; }

export const moneySkillGraph = {
  domainId: 'money',
  domainName: 'Money (P1–P3)',
  version: '1.0.0',
  skillIds: allSkills.map((s) => s.id),
  skills: allSkills,
};

export default moneySkillGraph;
