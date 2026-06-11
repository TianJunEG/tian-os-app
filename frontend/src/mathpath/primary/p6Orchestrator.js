import * as algebraGen from './p6AlgebraQuestionGenerator.js';
import * as fractionsGen from './p6FractionsQuestionGenerator.js';
import * as percentageGen from './p6PercentageQuestionGenerator.js';
import * as ratioGen from './p6RatioQuestionGenerator.js';
import * as speedGen from './p6SpeedQuestionGenerator.js';
import * as circlesGen from './p6CirclesQuestionGenerator.js';
import * as geometryGen from './p6GeometryQuestionGenerator.js';
import * as areaVolGen from './p6AreaVolQuestionGenerator.js';
import * as dataAnalysisGen from './p6DataAnalysisQuestionGenerator.js';

const domains = [
  { id: 'p6-algebra', prefix: 'P6-ALG', generator: algebraGen },
  { id: 'p6-fractions', prefix: 'P6-FR', generator: fractionsGen },
  { id: 'p6-percentage', prefix: 'P6-PCT', generator: percentageGen },
  { id: 'p6-ratio', prefix: 'P6-RAT', generator: ratioGen },
  { id: 'p6-speed', prefix: 'P6-SPD', generator: speedGen },
  { id: 'p6-circles', prefix: 'P6-CIR', generator: circlesGen },
  { id: 'p6-geometry', prefix: 'P6-GEO', generator: geometryGen },
  { id: 'p6-areavol', prefix: 'P6-AV', generator: areaVolGen },
  { id: 'p6-dataanalysis', prefix: 'P6-DA', generator: dataAnalysisGen },
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
