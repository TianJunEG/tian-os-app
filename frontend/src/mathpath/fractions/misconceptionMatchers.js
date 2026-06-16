// Precise misconception diagnosis: instead of "likely misconception for this
// skill" (skill-level, see misconceptionHints), infer the SPECIFIC misconception
// from the student's actual wrong answer by computing what answer each mistake
// would produce and matching it. Conservative — only fires on an unambiguous
// match; anything else returns null so the caller falls back to the skill-level
// hint. Operands are parsed from the prompt (questions don't expose them).
import { STUDENT_HINTS, getMisconceptionHintForSkill } from './misconceptionHints';

const fracsIn = (text) =>
  [...String(text || '').matchAll(/(\d+)\s*\/\s*(\d+)/g)].map((m) => ({
    n: Number(m[1]),
    d: Number(m[2]),
  }));

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
// Canonical "n/d" in lowest terms, for tolerant comparison of answers.
const canon = (n, d) => {
  if (!d) return null;
  const g = gcd(n, d) || 1;
  return `${n / g}/${d / g}`;
};
const answerCanon = (raw) => {
  const m = String(raw || '').trim().match(/^(\d+)\s*\/\s*(\d+)$/);
  return m ? canon(Number(m[1]), Number(m[2])) : String(raw || '').trim();
};

// Each matcher returns true only when the student's answer matches the exact
// mistake. Hints are kid-friendly Talia copy (precise cases reuse or extend the
// skill-level library).
const MATCHERS = [
  {
    id: 'frac_denominator_larger_means_larger',
    hint: STUDENT_HINTS.frac_denominator_larger_means_larger,
    test: ({ prompt, studentAnswer }) => {
      if (!/greater|larger|bigger/i.test(prompt)) return false;
      const fr = fracsIn(prompt);
      if (fr.length !== 2 || fr[0].n !== fr[1].n) return false; // same-numerator compare
      const picked = answerCanon(studentAnswer);
      // The larger-denominator fraction is the SMALLER value; picking it is the mistake.
      const largerDen = fr[0].d > fr[1].d ? fr[0] : fr[1];
      return picked === canon(largerDen.n, largerDen.d);
    },
  },
  {
    id: 'frac_operation_procedure_gap',
    hint: "Looks like you added the bottom numbers too. When the bottoms already match, keep them the same — just add the tops.",
    test: ({ prompt, studentAnswer }) => {
      if (!/\+/.test(prompt)) return false;
      const fr = fracsIn(prompt);
      if (fr.length !== 2) return false;
      const across = canon(fr[0].n + fr[1].n, fr[0].d + fr[1].d); // added across
      return answerCanon(studentAnswer) === across && across !== null;
    },
  },
  {
    id: 'frac_operation_procedure_gap',
    hint: "Looks like you subtracted the bottom numbers too. Keep the denominator the same — just subtract the tops.",
    test: ({ prompt, studentAnswer }) => {
      if (!/[-−–]/.test(prompt) || /\+/.test(prompt)) return false;
      const fr = fracsIn(prompt);
      if (fr.length !== 2) return false;
      const across = canon(fr[0].n - fr[1].n, fr[0].d - fr[1].d);
      return answerCanon(studentAnswer) === across && across !== null;
    },
  },
];

// diagnoseMisconception(question, studentAnswer) -> { misconceptionId, hint } | null
export function diagnoseMisconception(question, studentAnswer) {
  const prompt = question?.prompt || question?.text || '';
  if (!prompt || studentAnswer == null || studentAnswer === '') return null;
  for (const m of MATCHERS) {
    try {
      if (m.test({ prompt, studentAnswer })) return { misconceptionId: m.id, hint: m.hint };
    } catch { /* conservative: ignore a bad parse */ }
  }
  return null;
}

// Precise-first: the specific misconception from the actual wrong answer; falls
// back to the skill-level hint (#244) when no matcher fires.
export function getMisconceptionFromAnswer(question, studentAnswer) {
  return diagnoseMisconception(question, studentAnswer)
    || getMisconceptionHintForSkill(question?.skillId);
}
