// Test-mode catalog + difficulty-balancing sampler for spec-driven paper generation.
//
// Two responsibilities:
//   1. TEST_MODES — names the eight assessment modes as first-class presets and
//      gives each a default difficulty mix plus generation flags. Previously
//      `outputMode` was stored but never influenced generation; `testMode` does.
//   2. sampleQuestionsByDifficulty — enforces a difficultyMix across a candidate
//      pool instead of taking the first N (the old `.slice(0, count)` behaviour).
//
// The Question bank stores difficulty as the strings 'easy' | 'medium' | 'hard',
// so this sampler is string-aware (the sibling questionBankSelector.sampleByDifficulty
// works on numeric 1/2/3 difficulty and is not interchangeable).

// Each preset supplies a default difficultyMix (percentages, need not sum to 100)
// and behaviour flags consumed by generateTestFromSpecification.
export const TEST_MODES = {
  topic_test: {
    label: 'Topic Test',
    difficultyMix: { easy: 40, medium: 40, hard: 20 },
  },
  skill_test: {
    label: 'Skill Test',
    difficultyMix: { easy: 30, medium: 50, hard: 20 },
  },
  mixed_review: {
    label: 'Mixed Topical Review',
    difficultyMix: { easy: 35, medium: 40, hard: 25 },
  },
  weakness_drill: {
    label: 'Weakness Drill',
    difficultyMix: { easy: 55, medium: 35, hard: 10 },
    // Skills should be sourced from the student's weak MasteryRecord/skill state.
    // Selection still honours whatever skillIds the spec carries; auto-sourcing
    // weak skills is a separate follow-up (see audit Section C.3).
    sourceWeakSkills: true,
  },
  timed_paper: {
    label: 'Timed Paper',
    difficultyMix: { easy: 30, medium: 45, hard: 25 },
    forceTimed: true,
  },
  weighted_exam: {
    label: 'Weighted Exam-Prep Paper',
    difficultyMix: { easy: 30, medium: 40, hard: 30 },
    honorWeights: true,
  },
  error_diagnosis: {
    label: 'Error Diagnosis Test',
    difficultyMix: { easy: 25, medium: 45, hard: 30 },
    // Prefer MCQ items carrying a misconception tag so a wrong answer maps to a
    // named error. Preference is a soft sort, not a hard filter, to avoid
    // returning an empty paper when the bank is thin.
    preferMcq: true,
    preferMisconception: true,
  },
  psle_mock: {
    label: 'PSLE-style Mixed Paper',
    difficultyMix: { easy: 25, medium: 45, hard: 30 },
    forceTimed: true,
    multiTopic: true,
  },
};

export const DEFAULT_TEST_MODE = 'topic_test';

// Back-compat bridge: specs created before testMode existed only carry outputMode.
const OUTPUT_MODE_TO_TEST_MODE = {
  quickCheck: 'skill_test',
  topicTest: 'topic_test',
  miniPaper: 'mixed_review',
  fullPaper: 'weighted_exam',
  schoolAlignedMock: 'psle_mock',
};

export function isTestMode(mode) {
  return Object.prototype.hasOwnProperty.call(TEST_MODES, String(mode || ''));
}

// Resolve the effective mode from an explicit testMode, falling back to a mapped
// legacy outputMode, then the default.
export function resolveTestMode({ testMode, outputMode } = {}) {
  if (isTestMode(testMode)) return String(testMode);
  const mapped = OUTPUT_MODE_TO_TEST_MODE[String(outputMode || '')];
  if (isTestMode(mapped)) return mapped;
  return DEFAULT_TEST_MODE;
}

export function getTestModeConfig(mode) {
  return TEST_MODES[resolveTestMode({ testMode: mode })];
}

// Normalize a partial difficultyMix into a clean { easy, medium, hard } object,
// returning null when nothing usable was supplied (caller should fall back).
export function normalizeDifficultyMix(mix) {
  if (!mix || typeof mix !== 'object') return null;
  const easy = Math.max(0, Number(mix.easy || 0));
  const medium = Math.max(0, Number(mix.medium || 0));
  const hard = Math.max(0, Number(mix.hard || 0));
  if (easy + medium + hard <= 0) return null;
  return { easy, medium, hard };
}

// Pick `count` questions from `questions`, enforcing difficultyMix percentages.
// Questions are bucketed by their string difficulty; shortfall in any bucket is
// backfilled from the remaining pool so the paper always reaches `count` when
// enough questions exist. Pool order is preserved within each bucket, so callers
// can pre-sort to express a soft preference (e.g. MCQ-first for error diagnosis).
export function sampleQuestionsByDifficulty(questions, count, difficultyMix = {}) {
  const pool = Array.isArray(questions) ? questions : [];
  const target = Math.max(0, Number(count || 0));
  if (target <= 0 || pool.length === 0) return [];

  const easy = pool.filter((q) => q.difficulty === 'easy');
  const medium = pool.filter((q) => q.difficulty === 'medium');
  const hard = pool.filter((q) => q.difficulty === 'hard');

  const mix = normalizeDifficultyMix(difficultyMix) || { easy: 40, medium: 40, hard: 20 };
  const raw = mix.easy + mix.medium + mix.hard;

  // Largest-remainder allocation: floor each bucket's exact share, then hand the
  // leftover slots to the largest fractional parts. This keeps the counts summing
  // to exactly `target` without letting independent rounding (e.g. round(1.6)
  // twice) overshoot and silently zero out the smallest bucket.
  const exact = {
    easy: (target * mix.easy) / raw,
    medium: (target * mix.medium) / raw,
    hard: (target * mix.hard) / raw,
  };
  const alloc = { easy: Math.floor(exact.easy), medium: Math.floor(exact.medium), hard: Math.floor(exact.hard) };
  let leftover = target - (alloc.easy + alloc.medium + alloc.hard);
  const byRemainder = ['easy', 'medium', 'hard'].sort(
    (a, b) => (exact[b] - alloc[b]) - (exact[a] - alloc[a])
  );
  for (let i = 0; leftover > 0; i += 1, leftover -= 1) alloc[byRemainder[i % 3]] += 1;

  const picked = [
    ...easy.slice(0, alloc.easy),
    ...medium.slice(0, alloc.medium),
    ...hard.slice(0, alloc.hard),
  ];

  if (picked.length < target) {
    const used = new Set(picked.map((q) => keyOf(q)));
    const rest = pool.filter((q) => !used.has(keyOf(q)));
    picked.push(...rest.slice(0, target - picked.length));
  }

  return picked.slice(0, target);
}

function keyOf(q) {
  return String(q?._id ?? q?.questionId ?? q?.id ?? '');
}
