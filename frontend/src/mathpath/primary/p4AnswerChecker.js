// ---------------------------------------------------------------------------
// P4 Answer Checker
// ---------------------------------------------------------------------------
// Handles answer types produced by P4 generators and the curated question bank:
//   'number'   — numeric comparison (integer or decimal)
//   'numeric'  — alias for number
//   'decimal'  — decimal comparison (e.g. 3.85, 0.13)
//   'money'    — money format (strips $ sign, compares numerically)
//   'fraction' — fraction string comparison (e.g. '2/11 and 3/10')
//   'choice'   — exact string match from MCQ options
//   'exact'    — exact string match (ordering questions)
//   'text'     — case-insensitive string comparison
//
// Returns { correct, normalizedStudentAnswer, normalizedCorrectAnswer }
// ---------------------------------------------------------------------------

/**
 * Check a student's answer against a P4 question's correct answer.
 */
export function checkP4Answer({ studentAnswer, question }) {
  const { answer, answerType } = question;

  if (answerType === 'number' || answerType === 'numeric' || answerType === 'decimal'
      || typeof answer === 'number') {
    return checkNumericAnswer(studentAnswer, answer);
  }

  if (answerType === 'money') {
    return checkMoneyAnswer(studentAnswer, answer);
  }

  if (answerType === 'fraction') {
    return checkFractionTextAnswer(studentAnswer, answer);
  }

  if (answerType === 'choice' || answerType === 'exact') {
    return checkChoiceAnswer(studentAnswer, answer);
  }

  if (answerType === 'text') {
    return checkTextAnswer(studentAnswer, answer);
  }

  // Fallback: try numeric first, then text
  const numResult = checkNumericAnswer(studentAnswer, answer);
  if (numResult.correct || !isNaN(parseFloat(String(answer)))) return numResult;
  return checkTextAnswer(studentAnswer, answer);
}

/**
 * Compat adapter matching PracticeSession's checkFractionAnswer call signature.
 */
export function checkP4AnswerCompat({ studentAnswer, correctAnswer, acceptedAnswers = [], question }) {
  if (question) {
    return checkP4Answer({ studentAnswer, question });
  }

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
  const raw = String(studentAnswer ?? '').replace(/[$,\s]/g, '').trim();
  const studentNum = parseFloat(raw);
  const correctRaw = String(correctAnswer ?? '').replace(/[$,\s]/g, '').trim();
  const correctNum = typeof correctAnswer === 'number'
    ? correctAnswer
    : parseFloat(correctRaw);

  const correct = !isNaN(studentNum) && !isNaN(correctNum)
    && Math.abs(studentNum - correctNum) < 0.0001;

  return {
    correct,
    normalizedStudentAnswer: isNaN(studentNum) ? (raw || null) : String(studentNum),
    normalizedCorrectAnswer: String(correctNum),
  };
}

function checkMoneyAnswer(studentAnswer, correctAnswer) {
  // Strip $ sign and whitespace from both
  const studentClean = String(studentAnswer ?? '').replace(/[$,\s]/g, '').trim();
  const correctClean = String(correctAnswer ?? '').replace(/[$,\s]/g, '').trim();

  const studentNum = parseFloat(studentClean);
  const correctNum = parseFloat(correctClean);

  const correct = !isNaN(studentNum) && !isNaN(correctNum)
    && Math.abs(studentNum - correctNum) < 0.005;

  return {
    correct,
    normalizedStudentAnswer: isNaN(studentNum) ? (studentClean || null) : `$${studentNum.toFixed(2)}`,
    normalizedCorrectAnswer: `$${correctNum.toFixed(2)}`,
  };
}

function checkFractionTextAnswer(studentAnswer, correctAnswer) {
  // Normalize fraction text: remove extra spaces, lowercase
  const normalize = (s) => String(s ?? '').trim().toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s*and\s*/g, ' and ');

  const studentStr = normalize(studentAnswer);
  const correctStr = normalize(correctAnswer);

  // Check exact match first
  if (studentStr === correctStr) {
    return { correct: true, normalizedStudentAnswer: studentStr, normalizedCorrectAnswer: correctStr };
  }

  // For "X and Y" answers, also accept "Y and X" order
  if (correctStr.includes(' and ')) {
    const parts = correctStr.split(' and ').map((s) => s.trim());
    const reversed = parts.reverse().join(' and ');
    if (studentStr === reversed) {
      return { correct: true, normalizedStudentAnswer: studentStr, normalizedCorrectAnswer: correctStr };
    }
  }

  return { correct: false, normalizedStudentAnswer: studentStr || null, normalizedCorrectAnswer: correctStr };
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

export default { checkP4Answer, checkP4AnswerCompat };
