// ---------------------------------------------------------------------------
// P4 Orchestrator
// ---------------------------------------------------------------------------
// Routes skill IDs to the correct P4 domain question generator and integrates
// the curated question bank for exam-quality question sourcing.
//
// 7 domains (22 skills):
//   WN  — Whole Numbers to 100 000 (4 skills)
//   FM  — Factors & Multiples (2 skills)
//   FO  — Four Operations (3 skills)
//   FR  — Fractions (3 skills)
//   DEC — Decimals (6 skills)
//   WP  — Word Problems (2 skills)
//   STAT— Statistics (2 skills)
// ---------------------------------------------------------------------------

import * as wholeNumbersGen from './p4WholeNumbersQuestionGenerator.js';
import * as factorsMultiplesGen from './p4FactorsMultiplesQuestionGenerator.js';
import * as fourOpsGen from './p4FourOpsQuestionGenerator.js';
import * as fractionsGen from './p4FractionsQuestionGenerator.js';
import * as decimalsGen from './p4DecimalsQuestionGenerator.js';
import * as wordProbGen from './p4WordProbQuestionGenerator.js';
import * as statGen from './p4StatQuestionGenerator.js';
import { getCuratedQuestionsBySkill, pickRandomCurated } from './p4CuratedQuestionBank.js';

const domains = [
  { id: 'p4-wholenumbers', prefix: 'P4-WN', generator: wholeNumbersGen },
  { id: 'p4-factorsmultiples', prefix: 'P4-FM', generator: factorsMultiplesGen },
  { id: 'p4-fourops', prefix: 'P4-FO', generator: fourOpsGen },
  { id: 'p4-fractions', prefix: 'P4-FR', generator: fractionsGen },
  { id: 'p4-decimals', prefix: 'P4-DEC', generator: decimalsGen },
  { id: 'p4-wordprob', prefix: 'P4-WP', generator: wordProbGen },
  { id: 'p4-stat', prefix: 'P4-STAT', generator: statGen },
];

function findGenerator(skillId) {
  for (const domain of domains) {
    if (skillId.startsWith(domain.prefix)) return domain.generator;
  }
  return null;
}

/**
 * Generate a single question for a skill.
 * If `options.preferCurated` is true, tries the curated bank first.
 */
export function generateQuestion(skillId, options = {}) {
  if (options.preferCurated) {
    const curated = pickRandomCurated(skillId);
    if (curated) return normalizeCuratedQuestion(curated);
  }

  const gen = findGenerator(skillId);
  return gen ? gen.generateQuestion(skillId, options) : null;
}

/**
 * Generate a set of questions for a skill.
 * Mixes procedural + curated questions for variety when available.
 */
export function generateQuestionSet(skillId, count = 5, options = {}) {
  const gen = findGenerator(skillId);
  const curatedPool = getCuratedQuestionsBySkill(skillId);

  // If no generator exists, fall back entirely to curated bank
  if (!gen) {
    return curatedPool.slice(0, count).map(normalizeCuratedQuestion);
  }

  // Mix: use curated for ~30% of questions to add exam authenticity
  const curatedCount = Math.min(Math.floor(count * 0.3), curatedPool.length);
  const proceduralCount = count - curatedCount;

  const procedural = gen.generateQuestionSet
    ? gen.generateQuestionSet(skillId, proceduralCount, options)
    : Array.from({ length: proceduralCount }, () => gen.generateQuestion(skillId, options)).filter(Boolean);

  // Shuffle curated and pick
  const shuffled = [...curatedPool].sort(() => Math.random() - 0.5);
  const curated = shuffled.slice(0, curatedCount).map(normalizeCuratedQuestion);

  // Interleave: procedural first, curated sprinkled in
  const combined = [...procedural, ...curated];
  return combined.sort(() => Math.random() - 0.5);
}

export function generateDiagnosticSet(skillIds, questionsPerSkill = 3) {
  const questions = [];
  for (const skillId of skillIds) {
    const set = generateQuestionSet(skillId, questionsPerSkill, { preferCurated: true });
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
  return domains.map((d) => ({
    id: d.id,
    prefix: d.prefix,
    skillIds: d.generator.getSupportedSkillIds(),
  }));
}

// ---------------------------------------------------------------------------
// Curated question normalizer
// ---------------------------------------------------------------------------
// Curated questions use: { id, skillId, prompt, answer, answerType, options, ... }
// Generators produce:    { questionId, skillId, prompt, answer, answerType, options, ... }

function normalizeCuratedQuestion(cq) {
  return {
    questionId: cq.id,
    skillId: cq.skillId,
    questionFamilyId: `CQ_${cq.skillId}`,
    prompt: cq.prompt,
    stem: cq.prompt,
    answer: cq.answer,
    answerType: cq.answerType || 'text',
    answerIndex: cq.answerIndex ?? null,
    options: cq.options || null,
    type: cq.type || (cq.options ? 'mcq' : 'open'),
    difficulty: cq.difficulty || 2,
    marks: cq.marks || 1,
    solutionSteps: cq.solutionSteps || [],
    solutionText: (cq.solutionSteps || []).join(' → '),
    misconceptionTraps: cq.misconceptionTraps || [],
    tags: cq.tags || [],
    source: cq.source || null,
    isCurated: true,
    estimatedSeconds: cq.marks <= 1 ? 15 : cq.marks <= 2 ? 30 : 45,
  };
}

export default {
  generateQuestion,
  generateQuestionSet,
  generateDiagnosticSet,
  getAllSupportedSkillIds,
  getDomainForSkill,
  getDomains,
};
