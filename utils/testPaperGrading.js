import { isCorrectWithContext } from './answerCheck.js';

// Lenient exam marking on top of the shared grader. A student's answer is
// correct if the canonical grader accepts it OR if it matches after tolerating
// harmless presentation differences:
//  • a leading currency symbol  ($60 === 60)
//  • a trailing unit            (38 cm === 38, when the question's unit is cm)
//  • spacing around a ratio colon (3:4 === 3 : 4)
// Marking a correct answer wrong over formatting is the worst failure mode for
// an exam, so this layer exists and is unit-tested.
export function normalizeForCompare(s, unit = '') {
  let t = String(s == null ? '' : s).trim().toLowerCase();
  t = t.replace(/^\$\s*/, '');
  if (unit) {
    const u = unit.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    t = t.replace(new RegExp(`\\s*${u}\\.?$`), '');
  }
  t = t.replace(/\s*:\s*/g, ':');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

// Grade one answer against an embedded paper question { answer, stem, unit,
// tolerance }. A non-zero `tolerance` (e.g. "measure the angle") accepts the
// typed number within ±tolerance. Shade-grid answers are serialised "r-c,r-c"
// strings and match exactly via the fallthrough.
export function gradeAnswer(given, question = {}) {
  const g = String(given == null ? '' : given).trim();
  if (g === '') return false;
  const tol = Number(question.tolerance) || 0;
  if (tol > 0) {
    const gn = parseFloat(g.replace(/[^0-9.\-]/g, ''));
    const an = parseFloat(String(question.answer ?? '').replace(/[^0-9.\-]/g, ''));
    if (Number.isFinite(gn) && Number.isFinite(an) && Math.abs(gn - an) <= tol) return true;
  }
  if (isCorrectWithContext(given, question.answer, question.stem)) return true;
  return normalizeForCompare(given, question.unit) === normalizeForCompare(question.answer, question.unit);
}

export default { normalizeForCompare, gradeAnswer };
