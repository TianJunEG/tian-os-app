// Kid-friendly, Talia-voiced hints for the fraction misconceptions catalogued in
// FRACTION_MISCONCEPTION_LIBRARY. The library's `description`/`suggestedIntervention`
// are teacher-facing; these are warm, second-person, actionable lines for the
// student after a wrong answer. First-draft copy — review/tune freely.
import { FRACTION_MISCONCEPTION_LIBRARY } from './fractionDiagnosticExplainabilityEngine';

const STUDENT_HINTS = {
  frac_denominator_larger_means_larger:
    'Careful — a bigger bottom number means the pieces are smaller, not bigger (more slices = smaller slices). Picture a fraction bar and compare again.',
  frac_numerator_only_comparison:
    "When you compare fractions, check the bottom numbers too — not just the top. The bottom tells you how big each piece is.",
  frac_common_denominator_gap:
    'To add or compare these, make the bottom numbers match first using equivalent fractions — then it gets much easier.',
  frac_part_whole_model_gap:
    'Back to the picture: the bottom number is how many equal parts, the top is how many you have. Shade it in and count.',
  frac_mixed_improper_conversion_gap:
    'Remember a whole is made of fraction pieces too. Count how many pieces fit in one whole, then add the extra parts.',
  frac_operation_procedure_gap:
    "You've got the idea — now take the steps one at a time and write your working so each step is clear.",
};

// Precise hints for computed-mistake matches (answer-level diagnosis).
const PRECISE_HINTS = {
  add_across:
    "You added both the top numbers AND the bottom numbers — but the bottom shows the size of each piece, and that doesn't change when you add! Keep the bottom the same (or find a matching bottom first).",
  subtract_across:
    "You subtracted both the tops AND the bottoms — but the bottom number doesn't change when you subtract. Get matching bottoms first, then only subtract the tops.",
  keep_denominator_doubled:
    "Good thinking keeping the bottom, but it doubled! When both fractions already have the same bottom, it stays exactly the same — only the tops add together.",
  denominator_larger_is_bigger:
    "Careful — a bigger bottom means smaller pieces (more slices = tinier slices). So the fraction with the smaller bottom is actually bigger. Try drawing a fraction bar to see it!",
  numerator_only_compare:
    "You compared just the tops, but the bottoms matter too! A bigger top doesn't always mean a bigger fraction — check how big each piece is first.",
};

// ── Parsing helpers ──────────────────────────────────────────────────────────

function gcdOf(a, b) { return b === 0 ? Math.abs(a) : gcdOf(b, a % b); }

// Parse a student's answer string → { numerator, denominator } or null.
// Handles "3/4", "1 2/3" (mixed), "5" (whole), ">", "<" (text — returns null).
function parseFrac(s) {
  const str = String(s ?? '').trim();
  const mixedM = /^(\d+)\s+(\d+)\/(\d+)$/.exec(str);
  if (mixedM) {
    const w = +mixedM[1], n = +mixedM[2], d = +mixedM[3];
    return { numerator: w * d + n, denominator: d };
  }
  const fracM = /^(\d+)\/(\d+)$/.exec(str);
  if (fracM) return { numerator: +fracM[1], denominator: +fracM[2] };
  if (/^\d+$/.test(str)) return { numerator: +str, denominator: 1 };
  return null;
}

// True if studentFrac is equivalent to targetN/targetD.
function fracEq(studentFrac, targetN, targetD) {
  if (!studentFrac || targetD === 0) return false;
  return studentFrac.numerator * targetD === studentFrac.denominator * targetN;
}

// Extract the two operand fractions and operator from prompts like:
//   "Compute: 3/4 + 1/4"  or  "Compute: 2/3 - 1/6"
function parseArith(prompt) {
  const m = /(\d+)\/(\d+)\s*([\+\-])\s*(\d+)\/(\d+)/.exec(prompt || '');
  if (!m) return null;
  return {
    a: { numerator: +m[1], denominator: +m[2] },
    op: m[3],
    b: { numerator: +m[4], denominator: +m[5] },
  };
}

// Extract all fraction tokens from a prompt (for comparison questions).
function parseAllFracs(prompt) {
  return [...(prompt || '').matchAll(/(\d+)\/(\d+)/g)].map(
    (m) => ({ numerator: +m[1], denominator: +m[2] }),
  );
}

// ── Computed-mistake matchers ─────────────────────────────────────────────────

// Add-across: student computes (a+c)/(b+d) instead of finding a common denom.
// Same-denominator variant is keep_denominator_doubled when b===d → (a+c)/(2b).
function matchAddAcross(arith, studentFrac) {
  const { a, b } = arith;
  const wrongN = a.numerator + b.numerator;
  const wrongD = a.denominator + b.denominator;
  if (!fracEq(studentFrac, wrongN, wrongD)) return null;
  if (a.denominator === b.denominator) {
    return { misconceptionId: 'keep_denominator_doubled', hint: PRECISE_HINTS.keep_denominator_doubled, precise: true };
  }
  return { misconceptionId: 'add_across', hint: PRECISE_HINTS.add_across, precise: true };
}

// Subtract-across: student computes |a-c|/|b-d|.
// Only meaningful for unlike-denominator subtraction (same-denom subtract has b===d so d-d=0).
function matchSubtractAcross(arith, studentFrac) {
  const { a, b } = arith;
  if (a.denominator === b.denominator) return null; // can't form |d-d|=0 denom
  const wrongN = Math.abs(a.numerator - b.numerator);
  const wrongD = Math.abs(a.denominator - b.denominator);
  if (wrongD === 0) return null;
  if (!fracEq(studentFrac, wrongN, wrongD)) return null;
  return { misconceptionId: 'subtract_across', hint: PRECISE_HINTS.subtract_across, precise: true };
}

// Denominator-larger-is-bigger: student picks the fraction with larger denom as "bigger".
// Applies to unit-fraction (F006) and same-numerator comparison (F008) questions.
// For those question types the correct answer is the fraction with the SMALLER denominator.
// If the student answered wrong, we check whether they picked the larger-denom fraction.
function matchDenominatorLargerIsBigger(fracs, studentAnswer, question) {
  if (fracs.length < 2) return null;
  const [fa, fb] = fracs;
  const studentStr = String(studentAnswer).trim();
  const correctStr = String(question.answer?.value ?? question.answer?.display ?? '').trim();
  // Symbol answer (">","<"): student gave the opposite of correct → wrong direction.
  if ((studentStr === '>' || studentStr === '<') && studentStr !== correctStr) {
    // Verify the "larger denominator is bigger" logic would flip the answer.
    // For unit fracs: 1/a vs 1/b, correct is > when a<b. Misconception says < (picks 1/b).
    const wrongByDenom = fa.denominator > fb.denominator ? '>' : '<';
    if (studentStr === wrongByDenom) {
      return { misconceptionId: 'denominator_larger_is_bigger', hint: PRECISE_HINTS.denominator_larger_is_bigger, precise: true };
    }
  }
  // Fraction-string answer (F008): student names one of the two fractions.
  const studentFrac = parseFrac(studentStr);
  if (studentFrac) {
    // The fraction with the larger denominator
    const largerDenomFrac = fa.denominator > fb.denominator ? fa : fb;
    const correctFrac = parseFrac(correctStr);
    if (
      fracEq(studentFrac, largerDenomFrac.numerator, largerDenomFrac.denominator) &&
      correctFrac && !fracEq(correctFrac, largerDenomFrac.numerator, largerDenomFrac.denominator)
    ) {
      return { misconceptionId: 'denominator_larger_is_bigger', hint: PRECISE_HINTS.denominator_larger_is_bigger, precise: true };
    }
  }
  return null;
}

// ── Public API ────────────────────────────────────────────────────────────────

// Returns the most relevant student hint for a skill, or null if none is
// catalogued (so the caller can simply render nothing rather than a generic line).
export function getMisconceptionHintForSkill(skillId) {
  if (!skillId) return null;
  const entry = FRACTION_MISCONCEPTION_LIBRARY.find(
    (m) => Array.isArray(m.skillIds) && m.skillIds.includes(skillId),
  );
  if (!entry) return null;
  const hint = STUDENT_HINTS[entry.misconceptionId];
  if (!hint) return null;
  return { misconceptionId: entry.misconceptionId, hint };
}

// Answer-level diagnosis: tries computed-mistake matchers first; falls back to
// skill-level hint. Returns { misconceptionId, hint, precise } or null.
export function getMisconceptionFromAnswer(question, studentAnswer) {
  if (!question || studentAnswer == null || studentAnswer === '') {
    return getMisconceptionHintForSkill(question?.skillId);
  }

  const prompt = question.prompt || '';
  const skillId = question.skillId || '';
  const studentFrac = parseFrac(studentAnswer);

  // ── Arithmetic misconceptions ───────────────────────────────────────────
  const ARITH_SKILLS = ['F016', 'F017', 'F018', 'F019', 'F020', 'F021', 'F022', 'F023', 'F025', 'F026'];
  if (ARITH_SKILLS.includes(skillId)) {
    const arith = parseArith(prompt);
    if (arith && studentFrac) {
      if (arith.op === '+') {
        const hit = matchAddAcross(arith, studentFrac);
        if (hit) return hit;
      }
      if (arith.op === '-') {
        const hit = matchSubtractAcross(arith, studentFrac);
        if (hit) return hit;
      }
    }
  }

  // ── Comparison misconceptions ───────────────────────────────────────────
  // F006: unit-fraction comparison ("Which is greater: 1/a or 1/b?")
  // F008: same-numerator comparison ("Compare n/a and n/b. Which is greater?")
  const DENOM_COMPARE_SKILLS = ['F006', 'F008'];
  if (DENOM_COMPARE_SKILLS.includes(skillId)) {
    const fracs = parseAllFracs(prompt);
    const hit = matchDenominatorLargerIsBigger(fracs, studentAnswer, question);
    if (hit) return hit;
  }

  // ── Skill-level fallback ────────────────────────────────────────────────
  return getMisconceptionHintForSkill(skillId);
}

export { STUDENT_HINTS };
