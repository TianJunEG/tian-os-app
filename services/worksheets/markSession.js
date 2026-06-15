// Shared session-marking logic (Phase 1 WS3), used by both the inline route path
// (queue disabled) and the background worker (queue enabled).
import Worksheet from '../../models/Worksheet.js';
import { markAnswers } from '../../utils/aiService.js';
import { recomputeSchedule } from '../../utils/practiceSchedule.js';
import { applyMarks } from '../../utils/marking.js';

// Build the AI marking items from submitted answers, mutating the session's
// questions with the student's response metadata (same as the original inline
// loop). Returns the items array (empty if nothing markable was submitted).
export function buildMarkItems(session, answers = []) {
  const items = [];
  for (const a of Array.isArray(answers) ? answers : []) {
    const i = parseInt(a.questionIndex, 10);
    const q = session.questions[i];
    if (!q) continue;

    if (a.type === 'image' && typeof a.imageDataUrl === 'string') {
      const match = a.imageDataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
      if (!match) continue;
      items.push({ index: i, prompt: q.prompt, correctAnswer: q.answer, type: 'image', mimeType: match[1], imageBase64: match[2] });
      q.studentResponseType = 'image';
    } else {
      const text = typeof a.text === 'string' ? a.text.trim() : '';
      if (!text) continue;
      items.push({ index: i, prompt: q.prompt, correctAnswer: q.answer, type: 'text', text });
      q.studentResponseType = 'text';
      q.studentResponse = text;
    }
  }
  return items;
}

// Misconceptions targeted by questions the student got wrong this session.
export function missedMisconceptions(session) {
  return [...new Set(
    (session.questions || [])
      .filter((q) => q.correct === false && q.targetsMisconception)
      .map((q) => q.targetsMisconception)
  )];
}

// Run AI marking for one session and persist results. Mutates+saves the worksheet.
export function applyMarkResults(worksheet, session, results) {
  applyMarks(session, results);
  session.markingStatus = 'marked';
  session.markingError = '';
  recomputeSchedule(worksheet);
  worksheet.updatedAt = new Date();
}

// Worker entry: mark a session for an existing worksheet. On failure, persist
// 'failed' + the message, then re-throw so BullMQ records/retries.
export async function runSessionMarking({ worksheetId, sessionNumber, answers }) {
  const worksheet = await Worksheet.findById(worksheetId);
  if (!worksheet) throw new Error('Worksheet not found for marking job.');
  const session = worksheet.practiceSessions.find((s) => s.sessionNumber === Number(sessionNumber));
  if (!session) throw new Error('Practice session not found for marking job.');
  try {
    const items = buildMarkItems(session, answers);
    const { results } = await markAnswers({ items });
    applyMarkResults(worksheet, session, results);
    await worksheet.save();
    return { worksheetId: String(worksheet._id), sessionNumber: Number(sessionNumber), status: 'marked', score: session.score };
  } catch (err) {
    session.markingStatus = 'failed';
    session.markingError = err.message || 'Marking failed.';
    await worksheet.save().catch(() => {});
    throw err;
  }
}
