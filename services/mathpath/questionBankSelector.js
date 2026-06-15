// Level-aware question selector.
// Pulls questions from any registered diagnostic domain and filters them to the
// target Singapore Primary level, with optional difficulty-weighted sampling.
// Works with both DB-free (whole_numbers, decimals) and DB-backed (fractions) domains.

import { getDiagnosticDomain } from '../diagnostics/diagnosticDomainRegistry.js';

const LEVEL_ORDER = {
  'Primary 1': 1, 'Primary 2': 2, 'Primary 3': 3,
  'Primary 4': 4, 'Primary 5': 5, 'Primary 6': 6,
};

export function levelOrdinal(levelStr = '') {
  return LEVEL_ORDER[levelStr] ?? 99;
}

// Keep questions whose skill level is at or below targetLevel (includePrior=true)
// or exactly at targetLevel (includePrior=false).
// Questions with no resolvable level pass through.
export function questionsForLevel(questionsWithLevel, targetLevel, { includePrior = true } = {}) {
  const targetOrd = levelOrdinal(targetLevel);
  return questionsWithLevel.filter(({ _skillLevel }) => {
    const ord = levelOrdinal(_skillLevel);
    if (ord === 99) return true;
    return includePrior ? ord <= targetOrd : ord === targetOrd;
  });
}

// Sample `count` questions from a pool, respecting difficultyMix percentages.
// Falls back to any remaining questions when a bucket runs short.
export function sampleByDifficulty(questions, count, difficultyMix = {}) {
  const easy   = questions.filter((q) => q.difficulty <= 1);
  const medium = questions.filter((q) => q.difficulty === 2);
  const hard   = questions.filter((q) => q.difficulty >= 3);

  const raw = (difficultyMix.easy || 0) + (difficultyMix.medium || 0) + (difficultyMix.hard || 0);
  const pctEasy = raw > 0 ? (difficultyMix.easy   || 0) / raw : 0.4;
  const pctMed  = raw > 0 ? (difficultyMix.medium || 0) / raw : 0.4;

  const nEasy = Math.round(count * pctEasy);
  const nMed  = Math.round(count * pctMed);
  const nHard = Math.max(0, count - nEasy - nMed);

  const picked = [
    ...easy.slice(0, nEasy),
    ...medium.slice(0, nMed),
    ...hard.slice(0, nHard),
  ];

  // Fill shortfall from whatever is left (any difficulty)
  if (picked.length < count) {
    const usedIds = new Set(picked.map((q) => q.questionId || q.id));
    const rest = questions.filter((q) => !usedIds.has(q.questionId || q.id));
    picked.push(...rest.slice(0, count - picked.length));
  }

  return picked.slice(0, count);
}

// Main selector: fetch a domain's question bank, annotate with skill levels,
// filter to target level, and return a difficulty-sampled question list.
export async function selectQuestionsForLevel({
  domainId,
  subjectId = 'math',
  targetLevel = 'Primary 3',
  count = 10,
  skillIds = [],
  includePrior = true,
  difficultyMix = { easy: 40, medium: 40, hard: 20 },
  perSkill = 5,
} = {}) {
  const domain = getDiagnosticDomain({ subjectId, domainId });
  const bank   = await domain.getQuestionBank({ targetSkillIds: skillIds, perSkill });
  const allQ   = bank.bank || bank.docs || [];
  const sfMap  = bank.skillsByFrameworkId;

  const withLevel = allQ.map((q) => {
    const skill = sfMap?.get?.(q.skillId);
    return {
      ...q,
      _skillLevel: skill?._original?.level || skill?.singaporeLevel?.[0] || '',
    };
  });

  const filtered = questionsForLevel(withLevel, targetLevel, { includePrior });
  return sampleByDifficulty(filtered, count, difficultyMix);
}
