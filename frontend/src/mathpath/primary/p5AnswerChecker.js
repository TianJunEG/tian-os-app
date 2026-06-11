export function checkP5Answer({ studentAnswer, question }) {
  const { answer, answerType } = question;

  if (answerType === 'number' || typeof answer === 'number') {
    return checkNumericAnswer(studentAnswer, answer);
  }

  if (answerType === 'choice') {
    return checkChoiceAnswer(studentAnswer, answer);
  }

  if (answerType === 'text') {
    return checkTextAnswer(studentAnswer, answer);
  }

  return checkTextAnswer(studentAnswer, answer);
}

export function checkP5AnswerCompat({ studentAnswer, correctAnswer, acceptedAnswers = [], question }) {
  if (question) {
    return checkP5Answer({ studentAnswer, question });
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

function checkNumericAnswer(studentAnswer, correctAnswer) {
  const raw = String(studentAnswer ?? '').trim();
  const studentNum = parseFloat(raw);
  const correctNum = typeof correctAnswer === 'number'
    ? correctAnswer
    : parseFloat(String(correctAnswer));

  const correct = !isNaN(studentNum) && !isNaN(correctNum) && Math.abs(studentNum - correctNum) < 0.0001;

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
  const studentStr = String(studentAnswer ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  const correctStr = String(correctAnswer ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  const correct = Boolean(studentStr && studentStr === correctStr);

  return {
    correct,
    normalizedStudentAnswer: studentStr || null,
    normalizedCorrectAnswer: String(correctAnswer ?? ''),
  };
}

export default { checkP5Answer, checkP5AnswerCompat };
