import * as wholeNumbersGen from './p3WholeNumbersQuestionGenerator.js';
import * as addSubGen from './p3AddSubQuestionGenerator.js';
import * as mulDivGen from './p3MulDivQuestionGenerator.js';
import * as moneyGen from './p3MoneyQuestionGenerator.js';
import * as measTimeGen from './p3MeasTimeQuestionGenerator.js';
import * as areaPerimGen from './p3AreaPerimQuestionGenerator.js';
import * as statGen from './p3StatQuestionGenerator.js';
import * as wordProbGen from './p3WordProbQuestionGenerator.js';

const domains = [
  { id: 'p3-wholenumbers', prefix: 'P3-WN', generator: wholeNumbersGen },
  { id: 'p3-addsub', prefix: 'P3-AS', generator: addSubGen },
  { id: 'p3-muldiv', prefix: 'P3-MD', generator: mulDivGen },
  { id: 'p3-money', prefix: 'P3-MON', generator: moneyGen },
  { id: 'p3-meastime', prefix: 'P3-MT', generator: measTimeGen },
  { id: 'p3-areaperim', prefix: 'P3-AP', generator: areaPerimGen },
  { id: 'p3-stat', prefix: 'P3-ST', generator: statGen },
  { id: 'p3-wordprob', prefix: 'P3-WP', generator: wordProbGen },
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
