import * as algebraGen from './p6AlgebraQuestionGenerator.js';
import * as areaVolGen from './p6AreaVolQuestionGenerator.js';
import * as speedGen from './p6SpeedQuestionGenerator.js';

const domains = [
  { id: 'p6-algebra', prefix: 'P6-ALG', generator: algebraGen },
  { id: 'p6-area-volume', prefix: 'P6-AV', generator: areaVolGen },
  { id: 'p6-speed', prefix: 'P6-SPD', generator: speedGen },
];

function findGenerator(skillId) {
  for (const domain of domains) {
    if (skillId.startsWith(domain.prefix)) return domain.generator;
  }
  return null;
}

export function generateQuestion(skillId, options = {}) {
  const gen = findGenerator(skillId);
  return gen ? gen.generateQuestion(skillId, options) : null;
}

export function generateQuestionSet(skillId, count = 5, options = {}) {
  const gen = findGenerator(skillId);
  return gen ? gen.generateQuestionSet(skillId, count, options) : [];
}

export function generateDiagnosticSet(skillIds, questionsPerSkill = 3) {
  const questions = [];
  for (const skillId of skillIds) {
    const set = generateQuestionSet(skillId, questionsPerSkill);
    questions.push(...set);
  }
  return questions;
}

export function getAllSupportedSkillIds() {
  return domains.flatMap((d) => d.generator.getSupportedSkillIds());
}

export function getDomainForSkill(skillId) {
  for (const domain of domains) {
    if (skillId.startsWith(domain.prefix)) return domain.id;
  }
  return null;
}

export function getDomains() {
  return domains.map((d) => ({ id: d.id, prefix: d.prefix, skillIds: d.generator.getSupportedSkillIds() }));
}

export default { generateQuestion, generateQuestionSet, generateDiagnosticSet, getAllSupportedSkillIds, getDomainForSkill, getDomains };
