import * as wholeNumbersGen from './p2WholeNumbersQuestionGenerator.js';
import * as addSubGen from './p2AddSubQuestionGenerator.js';
import * as mulDivGen from './p2MulDivQuestionGenerator.js';
import * as moneyGen from './p2MoneyQuestionGenerator.js';
import * as fractionsGen from './p2FractionsQuestionGenerator.js';
import * as statGen from './p2StatQuestionGenerator.js';
import * as timeGen from './p2TimeQuestionGenerator.js';
import * as geoGen from './p2GeoQuestionGenerator.js';
import * as wordProbGen from './p2WordProbQuestionGenerator.js';

const domains = [
  { id: 'p2-wholenumbers', prefix: 'P2-WN', generator: wholeNumbersGen },
  { id: 'p2-addsub', prefix: 'P2-AS', generator: addSubGen },
  { id: 'p2-muldiv', prefix: 'P2-MD', generator: mulDivGen },
  { id: 'p2-money', prefix: 'P2-MON', generator: moneyGen },
  { id: 'p2-fractions', prefix: 'P2-FR', generator: fractionsGen },
  { id: 'p2-stat', prefix: 'P2-ST', generator: statGen },
  { id: 'p2-time', prefix: 'P2-TM', generator: timeGen },
  { id: 'p2-geo', prefix: 'P2-GEO', generator: geoGen },
  { id: 'p2-wordprob', prefix: 'P2-WP', generator: wordProbGen },
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
