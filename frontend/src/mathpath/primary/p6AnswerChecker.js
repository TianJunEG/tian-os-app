const NUMERIC_TOLERANCE = 0.0001;

function normalizeText(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*([\+\-\*\/\=])\s*/g, '$1');
}

function closeEnough(a, b, tol = NUMERIC_TOLERANCE) {
  return Math.abs(a - b) <= tol;
}

export function checkP6Answer(question, studentAnswer) {
  const { answer, answerType } = question;

  if (answerType === 'number') {
    const parsed = parseFloat(String(studentAnswer).replace(/,/g, ''));
    if (Number.isNaN(parsed)) return { correct: false, feedback: 'Please enter a valid number.' };
    const expected = typeof answer === 'string' ? parseFloat(answer) : answer;
    const correct = closeEnough(parsed, expected);
    return { correct, expected, given: parsed };
  }

  if (answerType === 'choice') {
    const correct = String(studentAnswer).trim().toUpperCase() === String(answer).trim().toUpperCase();
    return { correct, expected: answer, given: studentAnswer };
  }

  if (answerType === 'text') {
    const correct = normalizeText(studentAnswer) === normalizeText(answer);
    return { correct, expected: answer, given: studentAnswer };
  }

  return { correct: false, feedback: 'Unknown answer type.' };
}

export function checkP6AnswerCompat(question, studentAnswer) {
  const result = checkP6Answer(question, studentAnswer);
  return { isCorrect: result.correct, ...result };
}

export default { checkP6Answer, checkP6AnswerCompat };
