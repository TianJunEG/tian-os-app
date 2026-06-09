import * as numbersGen from './p1NumbersQuestionGenerator.js';
import * as addSubGen from './p1AddSubQuestionGenerator.js';
import * as moneyGen from './p1MoneyQuestionGenerator.js';
import * as measurementGen from './p1MeasurementQuestionGenerator.js';
import * as geometryGen from './p1GeometryQuestionGenerator.js';
import * as equalGroupsGen from './p1EqualGroupsQuestionGenerator.js';
import * as dataGen from './p1DataQuestionGenerator.js';

const domains = [
  { id: 'p1-numbers', prefix: 'P1-NUM', generator: numbersGen },
  { id: 'p1-addsub', prefix: 'P1-ADD', generator: addSubGen },
  { id: 'p1-money', prefix: 'P1-MON', generator: moneyGen },
  { id: 'p1-measurement', prefix: 'P1-MEA', generator: measurementGen },
  { id: 'p1-geometry', prefix: 'P1-GEO', generator: geometryGen },
  { id: 'p1-equalgroups', prefix: 'P1-EQG', generator: equalGroupsGen },
  { id: 'p1-data', prefix: 'P1-DAT', generator: dataGen },
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
