import { p1AddSubSkillGraph } from '../primary/p1AddSubSkillGraph.js';
import { p1EqualGroupsSkillGraph } from '../primary/p1EqualGroupsSkillGraph.js';
import { p2AddSubSkillGraph } from '../primary/p2AddSubSkillGraph.js';
import { p2MulDivSkillGraph } from '../primary/p2MulDivSkillGraph.js';
import { p3AddSubSkillGraph } from '../primary/p3AddSubSkillGraph.js';
import { p3MulDivSkillGraph } from '../primary/p3MulDivSkillGraph.js';
import { p4FourOpsSkillGraph } from '../primary/p4FourOpsSkillGraph.js';

const allSkills = [
  ...p1AddSubSkillGraph.skills,
  ...p1EqualGroupsSkillGraph.skills,
  ...p2AddSubSkillGraph.skills,
  ...p2MulDivSkillGraph.skills,
  ...p3AddSubSkillGraph.skills,
  ...p3MulDivSkillGraph.skills,
  ...p4FourOpsSkillGraph.skills,
];

const skillById = new Map(allSkills.map((s) => [s.id, s]));

export function getSkill(id) { return skillById.get(id) || null; }

export const fourOperationsSkillGraph = {
  domainId: 'four_operations',
  domainName: 'Four Operations (P1–P4)',
  version: '1.0.0',
  skillIds: allSkills.map((s) => s.id),
  skills: allSkills,
};

export default fourOperationsSkillGraph;
