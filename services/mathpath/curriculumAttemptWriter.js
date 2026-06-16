// Persists per-question MathPathAttempt records for the System A curriculum
// practice routes (/api/mathpath/<domain>). These routes already score per-
// response timing (timeTaken) and question-family ids but historically only
// aggregated them into skill states — the raw attempts were discarded, leaving
// the tutor dashboard with no data to compute fluency from. This captures them.
//
// Idempotent: attemptId is derived from sessionId + questionId, so resubmitting
// a session upserts rather than duplicating.
import MathPathAttempt from '../../models/mathpath/MathPathAttempt.js';

export function buildCurriculumAttemptDocs({ studentId, domainId, sessionId, sessionType = 'practice', results = [] } = {}) {
  return (Array.isArray(results) ? results : [])
    .filter((r) => r && !r.error && r.questionId != null)
    .map((r) => ({
      attemptId: `${sessionId}_${r.questionId}`,
      studentId: String(studentId),
      domainId,
      skillId: r.skillId || '',
      questionFamilyId: r.questionFamilyId || '',
      questionId: String(r.questionId),
      sessionId: String(sessionId),
      sessionType,
      answer: String(r.studentAnswer ?? r.answer ?? ''),
      studentAnswer: String(r.studentAnswer ?? r.answer ?? ''),
      correctAnswer: String(r.correctAnswer ?? ''),
      answerCorrect: Boolean(r.correct),
      correct: Boolean(r.correct),
      timeTaken: Number.isFinite(Number(r.timeTaken)) ? Number(r.timeTaken) : null,
      timeSpentSeconds: Number.isFinite(Number(r.timeTaken)) ? Number(r.timeTaken) : null,
      confidence: String(r.confidence || ''),
      confidenceLevel: String(r.confidence || ''),
      skipped: Boolean(r.skipped),
      timestamp: new Date(),
    }));
}

export async function writeCurriculumAttempts(opts = {}) {
  const docs = buildCurriculumAttemptDocs(opts);
  if (!docs.length) return { written: 0 };
  const write = await MathPathAttempt.bulkWrite(
    docs.map((doc) => ({
      updateOne: { filter: { attemptId: doc.attemptId }, update: { $set: doc }, upsert: true },
    })),
    { ordered: false },
  );
  return { written: (write.upsertedCount || 0) + (write.modifiedCount || 0), total: docs.length };
}

export default { buildCurriculumAttemptDocs, writeCurriculumAttempts };
