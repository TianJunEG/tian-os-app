// ELPath · Comprehension Cloze — grader
// ----------------------------------------------------------------------------
// Open cloze ("fill in each blank with a suitable word") has no options — the
// student types a word. Each blank accepts exactly one correct answer.
// Exact match only — no typo tolerance, no alternative word forms.
//
// Pure and framework-agnostic, like the vocabulary engine.

/** Lowercase, trim, and strip surrounding punctuation/spaces. */
export function norm(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/^[^a-z]+|[^a-z]+$/g, '');
}

/**
 * Grade one typed answer against a blank's accepted word.
 * Returns { verdict, ... }:
 *   'blank'   — nothing typed
 *   'correct' — exact match
 *   'wrong'   — anything else
 */
export function gradeBlank(raw, blank) {
  const a = norm(raw);
  if (!a) return { verdict: 'blank', accepted: blank.accept };
  const accept = blank.accept.map(norm);
  if (accept.includes(a)) return { verdict: 'correct', matched: a };
  return { verdict: 'wrong', accepted: blank.accept };
}

const isCorrect = (v) => v === 'correct';

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
    needsWrong: perBlank.filter((r) => r.verdict === 'wrong').map((r) => r.n),
  };
}
