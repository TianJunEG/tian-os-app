import Mistake from '../../models/Mistake.js';
import Student from '../../models/Student.js';

// A detected question counts as a mistake once the adult has vetted the paper:
// they explicitly confirmed it wrong, or accepted an OCR-read teacher mark of wrong.
// (Same criterion the assign-practice route uses.)
export function isConfirmedWrong(q) {
  return q?.adultConfirmedWrong === true || q?.teacherMarkedCorrect === false;
}

// Bridge a reviewed PaperAnalysis into the unified Mistake model so scanned-paper
// mistakes surface in the student's Mistakes review (the teacher weak-groups already
// read PaperAnalysis directly). Idempotent per paper+question, so re-reviewing an
// already-recorded paper never duplicates. Best-effort — never throws to the caller.
export async function recordMistakesFromPaperAnalysis(analysis) {
  try {
    if (!analysis || !analysis.studentId) return { created: 0 };
    // Mistake requires a workspaceId; PaperAnalysis doesn't carry one, so read the student.
    const student = await Student.findById(analysis.studentId).select('_id workspaceId').lean();
    if (!student?.workspaceId) return { created: 0 };

    const questions = analysis.detectedQuestions || [];
    let created = 0;
    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      if (!isConfirmedWrong(q)) continue;
      const questionId = `paper:${analysis._id}:${q._id || i}`; // stable → idempotent
      const tag = (Array.isArray(q.misconceptionTags) && q.misconceptionTags[0]) || '';
      // eslint-disable-next-line no-await-in-loop
      const res = await Mistake.updateOne(
        { studentId: student._id, questionId },
        {
          $setOnInsert: {
            studentId: student._id,
            workspaceId: student.workspaceId,
            questionId,
            module: 'MathPath',
            skillCode: (Array.isArray(q.detectedSkillIds) && q.detectedSkillIds[0]) || '',
            questionText: q.questionText || '',
            studentAnswer: String(q.studentAnswer ?? ''),
            answerCorrect: false,
            mistakeCategory: tag ? 'conceptual_misconception' : '',
            misconceptionTag: tag,
            source: 'other',
            learningStatus: 'new',
            status: 'open',
            occurredAt: analysis.reviewedAt || analysis.createdAt || new Date(),
          },
        },
        { upsert: true },
      );
      if (res.upsertedCount) created += 1;
    }
    return { created };
  } catch {
    return { created: 0 };
  }
}

export default { recordMistakesFromPaperAnalysis, isConfirmedWrong };
