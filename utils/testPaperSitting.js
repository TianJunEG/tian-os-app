// Join a completed sitting's server-side question snapshot with the student's
// marked answers into the per-question "review" shape the results UIs render
// (student TestPaperResults + the teacher drill-down). One source of truth so a
// teacher sees exactly what the student saw at submission — including the correct
// answer, worked solution, and any working-canvas image.
export function projectMarkedSitting(questions = [], answers = []) {
  const byOrder = new Map((answers || []).map((a) => [Number(a.order), a]));
  return (questions || []).map((q) => {
    const a = byOrder.get(Number(q.order)) || {};
    return {
      order: q.order,
      section: q.section,
      paper: q.paper || 1,
      groupId: q.groupId || '',
      groupIntro: q.groupIntro || '',
      partLabel: q.partLabel || '',
      marks: q.marks,
      type: q.type,
      stem: q.stem,
      choices: Array.isArray(q.choices) ? q.choices : [],
      diagram: q.diagram || null,
      grid: q.grid || null,
      unit: q.unit || '',
      studentAnswer: String(a.answer ?? ''),
      correctAnswer: q.answer,
      correct: Boolean(a.correct),
      marksAwarded: Number(a.marksAwarded) || 0,
      workedSolution: q.workedSolution || '',
      solutionSteps: Array.isArray(q.solutionSteps) ? q.solutionSteps : [],
      skillName: q.skillName || '',
      workingSubmitted: Boolean(a.workingSubmitted),
      workingImage: String(a.workingImage || ''),
    };
  });
}
