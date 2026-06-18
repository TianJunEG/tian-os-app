// Server-side marking for spec-generated assessment sessions.
//
// `markAssessment` is pure: given the blueprint questions (from the session's
// result.questions) and the student's raw responses, it marks each answer,
// allocates marks, and returns a scored summary plus per-item detail (including
// the misconception tag for wrong answers, which the route uses to emit
// MathPathMistakeRecords for error-diagnosis papers).

// Normalize an answer for lenient string comparison: lowercase, collapse
// whitespace, strip spaces around the value. Not a full math-equality check —
// the blueprint's acceptedAnswers carry the canonical variants.
export function normalizeAnswer(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function isCorrect(studentAnswer, question) {
  const given = normalizeAnswer(studentAnswer);
  if (!given) return false;
  const accepted = [
    question?.answer?.display,
    ...(Array.isArray(question?.acceptedAnswers) ? question.acceptedAnswers : []),
  ].map(normalizeAnswer).filter(Boolean);
  return accepted.includes(given);
}

// questions: blueprint questions (each { questionId, skillId, skillRefId, marks,
//   misconceptionTag, answer, acceptedAnswers, type }).
// responses: [{ questionId, answer, timeTaken }].
export function markAssessment({ questions = [], responses = [] } = {}) {
  const byId = new Map((Array.isArray(responses) ? responses : []).map((r) => [String(r.questionId), r]));
  const items = [];
  let totalAwarded = 0;
  let totalMarks = 0;

  for (const q of (Array.isArray(questions) ? questions : [])) {
    const marks = Number(q.marks || 0);
    totalMarks += marks;
    const response = byId.get(String(q.questionId)) || {};
    const studentAnswer = response.answer ?? '';
    const correct = isCorrect(studentAnswer, q);
    const marksAwarded = correct ? marks : 0;
    totalAwarded += marksAwarded;
    items.push({
      questionId: String(q.questionId),
      skillId: q.skillId || '',
      skillRefId: q.skillRefId || '',
      questionFamilyId: q.questionFamilyId || '',
      misconceptionTag: q.misconceptionTag || '',
      studentAnswer: String(studentAnswer ?? ''),
      correctAnswer: String(q?.answer?.display ?? ''),
      correct,
      marks,
      marksAwarded,
      timeMs: Number(response.timeTaken || response.timeMs || 0),
      skipped: normalizeAnswer(studentAnswer) === '',
    });
  }

  const scorePct = totalMarks > 0 ? Math.round((totalAwarded / totalMarks) * 100) : 0;
  return { items, totalAwarded, totalMarks, scorePct };
}
