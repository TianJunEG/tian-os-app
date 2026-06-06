const ANSWER_PATTERN = /\b(?:ans(?:wer)?|student answer|answer written)\s*[:=-]\s*([^;\n]+)/i;
const SELECTED_OPTION_PATTERN = /\b(?:option|choice|selected)\s*[:=-]?\s*([A-D])\b/i;
const SCORE_PATTERN = /(?:score|marks?|teacher mark)\s*[:=-]\s*(\d+(?:\.\d+)?)\s*(?:\/|out of)\s*(\d+(?:\.\d+)?)/i;
const CORRECT_MARK_PATTERN = /(?:✓|✔|\btick\b|\bcorrect\b|\bfull marks\b)/i;
const WRONG_MARK_PATTERN = /(?:✗|×|\bcross\b|\bwrong\b|\bincorrect\b|\bno marks\b)/i;

function clamp(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

export function detectStudentAnswer(blockText = '') {
  const text = String(blockText || '');
  const answerMatch = text.match(ANSWER_PATTERN);
  const optionMatch = text.match(SELECTED_OPTION_PATTERN);
  return {
    studentAnswer: answerMatch ? answerMatch[1].trim() : '',
    studentAnswerConfidence: answerMatch ? 0.72 : 0,
    selectedOption: optionMatch ? optionMatch[1].toUpperCase() : '',
    selectedOptionConfidence: optionMatch ? 0.68 : 0,
  };
}

export function detectTeacherMark(blockText = '') {
  const text = String(blockText || '');
  const scoreMatch = text.match(SCORE_PATTERN);
  const detectedMarks = scoreMatch ? Number(scoreMatch[1]) : null;
  const possibleMarks = scoreMatch ? Number(scoreMatch[2]) : null;
  const hasCorrect = CORRECT_MARK_PATTERN.test(text);
  const hasWrong = WRONG_MARK_PATTERN.test(text);
  const teacherMarkedCorrect = hasCorrect ? true : hasWrong ? false : null;
  const teacherMark = hasCorrect
    ? 'correct'
    : hasWrong
      ? 'wrong'
      : scoreMatch
        ? `${detectedMarks}/${possibleMarks}`
        : '';

  return {
    teacherMarkedCorrect,
    teacherMark,
    teacherMarkConfidence: hasCorrect || hasWrong ? 0.7 : scoreMatch ? 0.55 : 0,
    detectedMarks,
    detectedMarksConfidence: scoreMatch ? clamp(0.65) : 0,
  };
}

export function detectPaperMarks(blockText = '') {
  return {
    ...detectStudentAnswer(blockText),
    ...detectTeacherMark(blockText),
  };
}

export default {
  detectStudentAnswer,
  detectTeacherMark,
  detectPaperMarks,
};
