import Mistake from '../../models/Mistake.js';
import MathPathMistakeRecord from '../../models/mathpath/MathPathMistakeRecord.js';
import { recordLearningEvents } from '../telemetry/learningTelemetryService.js';

// Shared mistake persistence for every non-fractions MathPath domain practice
// submission. Replaces the inline MathPathMistakeRecord loop that was
// copy-pasted across 13 domain routes and adds the missing half: per-question
// `Mistake` documents.
//
// Why two writes:
//  • MathPathMistakeRecord — aggregate misconception clusters per skill/code,
//    used by analytics / dashboards (unchanged behaviour).
//  • Mistake — per-question records that power the student Mistake-to-Mastery
//    review and the acknowledge→correct→understand→master correction ladder.
//    Domain practice never wrote these, so domain mistakes never appeared in
//    review and the loop could not close. They do now.
//
// Mistake docs are deduped per (student, skill, question family) via upsert so
// re-attempting a family updates one record (frequency++/fresh snapshot) rather
// than flooding the review with duplicates.
export async function persistDomainPracticeMistakes({ student, domainId, sessionId = '', scored = {}, questions = [] }) {
  const studentId = String(student._id);

  // Telemetry FIRST (before any early return): emit a question_answered event
  // for EVERY answered question so the global dashboard ("Questions answered",
  // weekly accuracy, confidence) reflects domain practice. Domain submits used
  // to update only per-skill mastery and never these events, so a student who
  // practised a lot of non-fractions questions saw the dashboard counters stay
  // flat (the reported "I answered a lot but it's not updated"). Best-effort:
  // never fail a submit on telemetry. NOTE: must run before the mistake
  // early-return below, or a 100%-correct session would emit nothing.
  const results = Array.isArray(scored.results) ? scored.results : [];
  const answered = results.filter((r) => r && r.questionId != null && !r.error);
  if (answered.length) {
    try {
      await recordLearningEvents(answered.map((r) => ({
        studentId,
        eventType: 'question_answered',
        domain: 'mathpath',
        skillCode: String(r.skillId || ''),
        questionId: String(r.questionId || ''),
        sessionId,
        metadata: { answerCorrect: Boolean(r.correct), domainId },
      })));
    } catch { /* telemetry is best-effort */ }
  }

  const mistakes = Array.isArray(scored.mistakes) ? scored.mistakes : [];
  if (!mistakes.length) return { aggregateCount: 0, mistakeCount: 0 };

  const questionById = new Map((questions || []).map((q) => [String(q.questionId), q]));
  let mistakeCount = 0;

  for (const mistake of mistakes) {
    const tag = mistake.misconceptionTag || `${domainId}_error`;
    const familyId = mistake.questionFamilyId || mistake.questionId || '';

    // 1) Aggregate misconception record (prior behaviour, unchanged shape).
    await MathPathMistakeRecord.findOneAndUpdate(
      { studentId, domainId, mistakeCode: tag, skillId: mistake.skillId || '', questionFamilyId: mistake.questionFamilyId || '' },
      {
        $inc: { frequency: 1 },
        $set: { mistakeName: tag, severity: mistake.confidence === 'i_know_this' ? 'high' : 'medium', lastSeenAt: new Date() },
        $push: {
          evidence: {
            source: `${domainId}-practice-incorrect`, questionId: mistake.questionId,
            sessionId, studentAnswer: mistake.studentAnswer, correctAnswer: mistake.correctAnswer,
            answerCorrect: false, confidence: mistake.confidence, timeTaken: mistake.timeTaken, seenAt: new Date(),
            workingSubmitted: Boolean(mistake.workingSubmitted || mistake.fullscreenWorkingSubmitted),
            workingSessionId: mistake.workingSessionId || '',
          },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // 2) Per-question Mistake doc feeding the review + correction ladder.
    const q = questionById.get(String(mistake.questionId)) || {};
    const questionText = String(q.prompt || q.stem || mistake.questionText || '').trim();
    await Mistake.findOneAndUpdate(
      // Dedup key: one open Mistake per student/skill/question-family.
      { studentId: student._id, module: 'MathPath', skillCode: mistake.skillId || '', questionId: familyId, status: { $ne: 'resolved' } },
      {
        $set: {
          workspaceId: student.workspaceId,
          sessionId,
          skillCode: mistake.skillId || '',
          module: 'MathPath',
          questionText,
          questionStem: questionText,
          // Structured walkthrough + flattened paragraph so the review can render
          // an ordered list (preferred) and still fall back to prose.
          solutionSteps: Array.isArray(q.solutionSteps) ? q.solutionSteps : [],
          workedSolution: String(
            q.workedSolution || (Array.isArray(q.solutionSteps) ? q.solutionSteps.join('\n') : '')
          ),
          studentAnswer: String(mistake.studentAnswer ?? ''),
          correctAnswer: String(mistake.correctAnswer ?? ''),
          answerCorrect: false,
          confidence: String(mistake.confidence || ''),
          timeTaken: Number(mistake.timeTaken || 0),
          workingSubmitted: Boolean(mistake.workingSubmitted || mistake.fullscreenWorkingSubmitted),
          workingImage: mistake.workingImage || '',
          workingPreviewImage: mistake.workingImage || '',
          workingStrokes: Array.isArray(mistake.workingStrokes) ? mistake.workingStrokes : [],
          workingMathObjects: Array.isArray(mistake.workingMathObjects) ? mistake.workingMathObjects : [],
          workingSessionId: mistake.workingSessionId || '',
          fullscreenWorkingSubmitted: Boolean(mistake.fullscreenWorkingSubmitted || mistake.workingSubmitted),
          mistakeType: 'unknown',
          misconceptionTag: tag,
          status: 'open',
          source: 'practice-incorrect',
          mostRecentOccurredAt: new Date(),
          occurredAt: new Date(),
          timestamp: new Date(),
        },
        $setOnInsert: { questionId: familyId, firstOccurredAt: new Date() },
        $inc: { frequency: 1 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    mistakeCount += 1;
  }

  return { aggregateCount: mistakes.length, mistakeCount };
}

export default { persistDomainPracticeMistakes };
