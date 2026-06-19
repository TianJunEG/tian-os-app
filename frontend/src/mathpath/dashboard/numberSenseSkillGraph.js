import { p1NumbersSkillGraph } from '../primary/p1SkillGraph.js';
import { p2WholeNumbersSkillGraph } from '../primary/p2WholeNumbersSkillGraph.js';
import { p3WholeNumbersSkillGraph } from '../primary/p3WholeNumbersSkillGraph.js';
import { p4WholeNumbersSkillGraph } from '../primary/p4WholeNumbersSkillGraph.js';
import { p5WholeNumbersSkillGraph } from '../primary/p5WholeNumbersSkillGraph.js';

const allSkills = [
  ...p1NumbersSkillGraph.skills,
  ...p2WholeNumbersSkillGraph.skills,
  ...p3WholeNumbersSkillGraph.skills,
  ...p4WholeNumbersSkillGraph.skills,
  ...p5WholeNumbersSkillGraph.skills,
];

const skillById = new Map(allSkills.map((s) => [s.id, s]));

export function getSkill(id) { return skillById.get(id) || null; }

export const numberSenseSkillGraph = {
  domainId: 'number_sense',
  domainName: 'Number Sense & Whole Numbers (P1–P5)',
  version: '1.0.0',
  skillIds: allSkills.map((s) => s.id),
  skills: allSkills,
};

export default numberSenseSkillGraph;
