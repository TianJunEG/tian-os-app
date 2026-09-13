// ELPath · Comprehension Cloze — grader
// ----------------------------------------------------------------------------
// Open cloze ("fill in each blank with a suitable word") has no options — the
// student types a word. Each blank accepts exactly one correct answer.
//
// The grader is layered, cheapest first, and works fully offline:
//   1. exact match       — the blank's accepted word
//   2. typo tolerance    — right word, one letter off (kids mis-spell)
//
// Pure and framework-agnostic, like the vocabulary engine.

/** Lowercase, trim, and strip surrounding punctuation/spaces. */
export function norm(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/^[^a-z]+|[^a-z]+$/g, '');
}

/** Levenshtein distance, bailing early for very different lengths. */
export function editDistance(a, b) {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 2) return 99;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] : 1 + Math.min(prev[j - 1], prev[j], cur[j - 1]);
    }
    prev = cur;
  }
  return prev[n];
}

/**
 * Grade one typed answer against a blank's accepted word.
 * Returns { verdict, ... }:
 *   'blank'   — nothing typed
 *   'correct' — exact match
 *   'typo'    — one letter off the correct word (counts as correct, flags spelling)
 *   'review'  — wrong answer
 */
export function gradeBlank(raw, blank) {
  const a = norm(raw);
  if (!a) return { verdict: 'blank', accepted: blank.accept };
  const accept = blank.accept.map(norm);
  if (accept.includes(a)) return { verdict: 'correct', matched: a };
  // Typo: within one edit of a valid word (guard on length so short words don't
  // collapse into each other — "on"/"in" are different answers, not typos).
  const near = blank.accept.find((w) => norm(w).length >= 4 && editDistance(norm(w), a) === 1);
  if (near) return { verdict: 'typo', matched: near, note: `Right word — check the spelling: "${near}"` };
  return { verdict: 'review', accepted: blank.accept };
}

const isCorrect = (v) => v === 'correct' || v === 'typo';

/**
 * Grade a whole passage. `answers` maps blank number -> typed string.
 * Returns the score, per-blank verdicts, and a per-skill breakdown (the thing a
 * readiness report needs: "grammar 60%, collocation 80%, content 90%").
 */
export function gradePassage(answers = {}, passage) {
  const perBlank = passage.blanks.map((b) => ({
    n: b.n,
    skill: b.skill,
    note: b.note,
    ...gradeBlank(answers[b.n], b),
  }));
  const bySkill = {};
  for (const r of perBlank) {
    const s = (bySkill[r.skill] ||= { total: 0, correct: 0 });
    s.total += 1;
    if (isCorrect(r.verdict)) s.correct += 1;
  }
  return {
    score: perBlank.filter((r) => isCorrect(r.verdict)).length,
    total: passage.blanks.length,
    perBlank,
    bySkill,
    needsReview: perBlank.filter((r) => r.verdict === 'review').map((r) => r.n),
  };
}
