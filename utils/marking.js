// Apply AI marking results to a practice session, in place.
// results: [{ index, correct, readAs, feedback }] — only for answered questions.
// Returns { answered, correct } counts.
export function applyMarks(session, results) {
  const byIndex = new Map(results.map((r) => [r.index, r]));
  let answered = 0;
  let correct = 0;

  session.questions.forEach((q, i) => {
    const r = byIndex.get(i);
    if (!r) return;
    answered += 1;
    if (r.correct) correct += 1;
    q.correct = !!r.correct;
    q.feedback = r.feedback;
    // For handwritten answers the route leaves studentResponse empty; fall back
    // to the transcription the model read from the image.
    if (!q.studentResponse && r.readAs) q.studentResponse = r.readAs;
    q.markedAt = new Date();
  });

  session.marked = true;
  session.score = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  session.completed = true;
  session.completedAt = new Date();

  return { answered, correct };
}
