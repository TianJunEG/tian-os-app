// ---------------------------------------------------------------------------
// P2 Answer Checker
// ---------------------------------------------------------------------------
// Mirrors p3AnswerChecker.js — normalises student answers for comparison
// against the canonical answer from the P2 generators.
// ---------------------------------------------------------------------------

function normaliseNumeric(value) {
  if (value === null || value === undefined || value === '') return NaN;
  const cleaned = String(value).replace(/[$,\s]/g, '').trim();
  return Number(cleaned);
}

function normaliseText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Check a student answer against the canonical answer.
 *
 * @param {object} question - The normalised question object from the P2 flow.
 * @param {string|number} studentAnswer - The student's raw answer.
 * @returns {{ correct: boolean, expected: string, given: string }}
 */
export function checkP2Answer(question, studentAnswer) {
  const rawAnswer = question._rawAnswer ?? question.answer?.value ?? question.answer;
  const answerType = question._rawAnswerType ?? question.answer?.type ?? 'text';

  // --- Numeric answers ---
  if (answerType === 'number' || typeof rawAnswer === 'number') {
    const expected = normaliseNumeric(rawAnswer);
    const given = normaliseNumeric(studentAnswer);

    return {
      correct: !isNaN(expected) && !isNaN(given) && Math.abs(expected - given) < 0.005,
      expected: String(rawAnswer),
      given: String(studentAnswer ?? ''),
    };
  }

  // --- MCQ / choice answers ---
  if (answerType === 'choice') {
    const expected = normaliseText(rawAnswer);
    const given = normaliseText(studentAnswer);

    return {
      correct: expected === given,
      expected: String(rawAnswer),
      given: String(studentAnswer ?? ''),
    };
  }

  // --- Text answers (money strings, etc.) ---
  const expected = normaliseText(rawAnswer);
  const given = normaliseText(studentAnswer);

  return {
    correct: expected === given,
    expected: String(rawAnswer),
    given: String(studentAnswer ?? ''),
  };
}

export default { checkP2Answer };
