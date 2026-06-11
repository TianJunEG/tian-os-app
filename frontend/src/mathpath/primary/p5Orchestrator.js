import * as wholeNumbersGen from './p5WholeNumbersQuestionGenerator.js';
import * as fractionsGen from './p5FractionsQuestionGenerator.js';
import * as decimalsGen from './p5DecimalsQuestionGenerator.js';
import * as percentageGen from './p5PercentageQuestionGenerator.js';
import * as ratioGen from './p5RatioQuestionGenerator.js';
import * as geometryGen from './p5GeometryQuestionGenerator.js';
import * as areaVolGen from './p5AreaVolQuestionGenerator.js';
import * as statGen from './p5StatQuestionGenerator.js';
import * as wordProbGen from './p5WordProbQuestionGenerator.js';

const domains = [
  { id: 'p5-wholenumbers', prefix: 'P5-WN', generator: wholeNumbersGen },
  { id: 'p5-fractions', prefix: 'P5-FR', generator: fractionsGen },
  { id: 'p5-decimals', prefix: 'P5-DEC', generator: decimalsGen },
  { id: 'p5-percentage', prefix: 'P5-PCT', generator: percentageGen },
  { id: 'p5-ratio', prefix: 'P5-RAT', generator: ratioGen },
  { id: 'p5-geometry', prefix: 'P5-GEO', generator: geometryGen },
  { id: 'p5-areavol', prefix: 'P5-AV', generator: areaVolGen },
  { id: 'p5-stat', prefix: 'P5-ST', generator: statGen },
  { id: 'p5-wordprob', prefix: 'P5-WP', generator: wordProbGen },
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
