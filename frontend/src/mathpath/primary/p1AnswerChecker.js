// ---------------------------------------------------------------------------
// P1 Answer Checker
// ---------------------------------------------------------------------------
// Handles the three answer types produced by P1 question generators:
//   'number'  — numeric comparison (integer or decimal)
//   'choice'  — exact string match from MCQ options
//   'text'    — case-insensitive string comparison
//
// Returns the same shape as checkFractionAnswer so PracticeSession can use
// either checker interchangeably:
//   { correct: boolean, normalizedStudentAnswer, normalizedCorrectAnswer }
// ---------------------------------------------------------------------------

/**
 * Check a student's answer against a P1 question's correct answer.
 *
 * @param {object}  options
 * @param {string}  options.studentAnswer  — raw student input (always a string)
 * @param {object}  options.question       — the full P1 question object
 * @returns {{ correct: boolean, normalizedStudentAnswer: string|null, normalizedCorrectAnswer: string }}
 */
export function checkP1Answer({ studentAnswer, question }) {
  const { answer, answerType } = question;

  // --- number ---
  if (answerType === 'number' || typeof answer === 'number') {
    return checkNumericAnswer(studentAnswer, answer);
  }

  // --- choice (MCQ) ---
  if (answerType === 'choice') {
    return checkChoiceAnswer(studentAnswer, answer);
  }

  // --- text ---
  if (answerType === 'text') {
    return checkTextAnswer(studentAnswer, answer);
  }

  // --- fallback: case-insensitive string comparison ---
  return checkTextAnswer(studentAnswer, answer);
}

// ---------------------------------------------------------------------------
// Adapter for PracticeSession's checkFractionAnswer-compatible call site
// ---------------------------------------------------------------------------
// PracticeSession calls checkFractionAnswer({ studentAnswer, correctAnswer, acceptedAnswers })
// This adapter lets P1 questions use the same call pattern.

export function checkP1AnswerCompat({ studentAnswer, correctAnswer, acceptedAnswers = [], question }) {
  // If we have the full question object, use the proper checker
  if (question) {
    return checkP1Answer({ studentAnswer, question });
  }

  // Fallback: correctAnswer is the raw answer value, figure out the type
  if (typeof correctAnswer === 'number' || (typeof correctAnswer === 'object' && correctAnswer?.type === 'whole')) {
    const value = typeof correctAnswer === 'number' ? correctAnswer : correctAnswer.value ?? correctAnswer.display;
    return checkNumericAnswer(studentAnswer, value);
  }

  if (typeof correctAnswer === 'object' && correctAnswer?.display != null) {
    return checkTextAnswer(studentAnswer, correctAnswer.display);
  }

  return checkTextAnswer(studentAnswer, correctAnswer);
}

// ---------------------------------------------------------------------------
// Internal checkers
// ---------------------------------------------------------------------------

function checkNumericAnswer(studentAnswer, correctAnswer) {
  const raw = String(studentAnswer ?? '').trim();
  const studentNum = parseFloat(raw);
  const correctNum = typeof correctAnswer === 'number'
    ? correctAnswer
    : parseFloat(String(correctAnswer));

  const correct = !isNaN(studentNum) && !isNaN(correctNum) && studentNum === correctNum;

  return {
    correct,
    normalizedStudentAnswer: isNaN(studentNum) ? (raw || null) : String(studentNum),
    normalizedCorrectAnswer: String(correctNum),
  };
}

function checkChoiceAnswer(studentAnswer, correctAnswer) {
  const studentStr = String(studentAnswer ?? '').trim().toLowerCase();
  const correctStr = String(correctAnswer ?? '').trim().toLowerCase();
  const correct = Boolean(studentStr && studentStr === correctStr);

  return {
    correct,
    normalizedStudentAnswer: studentStr || null,
    normalizedCorrectAnswer: String(correctAnswer ?? ''),
  };
}

function checkTextAnswer(studentAnswer, correctAnswer) {
  const studentStr = String(studentAnswer ?? '').trim().toLowerCase();
  const correctStr = String(correctAnswer ?? '').trim().toLowerCase();
  const correct = Boolean(studentStr && studentStr === correctStr);

  return {
    correct,
    normalizedStudentAnswer: studentStr || null,
    normalizedCorrectAnswer: String(correctAnswer ?? ''),
  };
}

export default { checkP1Answer, checkP1AnswerCompat };
