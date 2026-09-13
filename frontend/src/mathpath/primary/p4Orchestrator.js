import * as wholeNumbersGen from './p4WholeNumbersQuestionGenerator.js';
import * as factorsMultiplesGen from './p4FactorsMultiplesQuestionGenerator.js';
import * as fourOpsGen from './p4FourOpsQuestionGenerator.js';
import * as fractionsGen from './p4FractionsQuestionGenerator.js';
import * as decimalsGen from './p4DecimalsQuestionGenerator.js';
import * as wordProbGen from './p4WordProbQuestionGenerator.js';
import * as statGen from './p4StatQuestionGenerator.js';

const domains = [
  { id: 'p4-wholenumbers', prefix: 'P4-WN', generator: wholeNumbersGen },
  { id: 'p4-factorsmultiples', prefix: 'P4-FM', generator: factorsMultiplesGen },
  { id: 'p4-fourops', prefix: 'P4-FO', generator: fourOpsGen },
  { id: 'p4-fractions', prefix: 'P4-FR', generator: fractionsGen },
  { id: 'p4-decimals', prefix: 'P4-DEC', generator: decimalsGen },
  { id: 'p4-wordprob', prefix: 'P4-WP', generator: wordProbGen },
  { id: 'p4-stat', prefix: 'P4-ST', generator: statGen },
];

function findGenerator(skillId) {
  for (const domain of domains) {
    if (skillId.startsWith(domain.prefix)) return domain.generator;
  }
  return null;
}

// Cross-domain quick diagnostic. Linked from the P4 learning-path page; gives
// the student one question from every supported P4 domain so the engine can
// place them, instead of dead-ending (the prior plumbing dropped 'P4-DIAGNOSTIC'
// in normalizeFrameworkSkillId and the practice session silently fell back to a
// fractions session).
const P4_DIAGNOSTIC_ID = 'P4-DIAGNOSTIC';
function generateP4Diagnostic(count) {
  const questions = [];
  // Take the FIRST supported skill of each domain as the canonical entry probe.
  const entrySkills = domains.map((d) => d.generator.getSupportedSkillIds()?.[0]).filter(Boolean);
  for (const skillId of entrySkills) {
    const set = generateQuestionSet(skillId, 1);
    if (set.length) questions.push(set[0]);
    if (questions.length >= count) break;
  }
  return questions;
}

export function generateQuestion(skillId, options = {}) {
  if (skillId === P4_DIAGNOSTIC_ID) return generateP4Diagnostic(1)[0] || null;
  const gen = findGenerator(skillId);
  return gen ? gen.generateQuestion(skillId, options) : null;
}

export function generateQuestionSet(skillId, count = 5, options = {}) {
  if (skillId === P4_DIAGNOSTIC_ID) return generateP4Diagnostic(count);
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
  if (skillId === P4_DIAGNOSTIC_ID) return 'p4-diagnostic';
  for (const domain of domains) {
    if (skillId.startsWith(domain.prefix)) return domain.id;
  }
  return null;
}

export function getDomains() {
  return domains.map((d) => ({ id: d.id, prefix: d.prefix, skillIds: d.generator.getSupportedSkillIds() }));
}

export default { generateQuestion, generateQuestionSet, generateDiagnosticSet, getAllSupportedSkillIds, getDomainForSkill, getDomains };
