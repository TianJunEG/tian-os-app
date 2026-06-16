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

export { STUDENT_HINTS };
