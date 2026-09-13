// ---------------------------------------------------------------------------
// P4 Answer Checker
// ---------------------------------------------------------------------------
// Mirrors p2AnswerChecker.js — normalises student answers for comparison
// against the canonical answer from the P4 generators.
// P4 adds decimal support (tolerance 0.005) for the Decimals domain.
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
 * @param {object} question - The normalised question object from the P4 flow.
 * @param {string|number} studentAnswer - The student's raw answer.
 * @returns {{ correct: boolean, expected: string, given: string }}
 */
export function checkP4Answer({ studentAnswer, question = {} } = {}) {
  const rawAnswer = question._rawAnswer ?? question.answer?.value ?? question.answer;
  const answerType = question._rawAnswerType ?? question.answerType ?? question.answer?.type ?? 'text';

  // --- Numeric answers (including decimals) ---
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

  // --- Text answers (decimal strings, money, etc.) ---
  const expected = normaliseText(rawAnswer);
  const given = normaliseText(studentAnswer);

  // Also try numeric comparison for text answers that look numeric
  const expectedNum = normaliseNumeric(rawAnswer);
  const givenNum = normaliseNumeric(studentAnswer);
  if (!isNaN(expectedNum) && !isNaN(givenNum) && Math.abs(expectedNum - givenNum) < 0.005) {
    return {
      correct: true,
      expected: String(rawAnswer),
      given: String(studentAnswer ?? ''),
    };
  }

  return {
    correct: expected === given,
    expected: String(rawAnswer),
    given: String(studentAnswer ?? ''),
  };
}

export default { checkP4Answer };
