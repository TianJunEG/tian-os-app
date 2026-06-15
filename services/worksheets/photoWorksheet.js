// Shared photo-worksheet generation logic (Phase 1 WS3), used by BOTH the inline
// route path (queue disabled) and the background worker (queue enabled), so the AI
// call + session building + misconception logging live in one place.
import Worksheet from '../../models/Worksheet.js';
import { analyzeAndGenerateWorksheet } from '../../utils/aiService.js';
import { buildSessions, recomputeSchedule } from '../../utils/practiceSchedule.js';
import { logDiagnosedMisconceptions } from '../../utils/misconceptionLog.js';

// Map an AI analysis result to the worksheet's photo-flow fields.
export function photoWorksheetFields(result) {
  return {
    topic: result.topic,
    overallSummary: result.overallSummary,
    misconceptions: Array.isArray(result.misconceptions) ? result.misconceptions : [],
    skillsToReinforce: Array.isArray(result.skillsToReinforce) ? result.skillsToReinforce : [],
    practiceSessions: buildSessions(result.questions),
  };
}

// Best-effort: log diagnosed misconceptions against the student. Never throws.
export async function logPhotoMisconceptions({ result, ownerUserId, studentUserId, studentName, worksheetId }) {
  try {
    await logDiagnosedMisconceptions({ result, ownerUserId, studentUserId, studentName: studentName || '', worksheetId });
  } catch (logErr) {
    console.error('Diagnosed-misconception logging failed (non-fatal):', logErr.message);
  }
}

// Worker entry: analyze the photo for an already-created (pending) worksheet, fill
// it in, and mark it ready. On failure, persist 'failed' + the message, then
// re-throw so BullMQ records/retries the job.
export async function runPhotoWorksheetGeneration({
  worksheetId, imageBase64, mimeType, gradeLevel, topicHint, totalQuestions,
  ownerUserId, studentUserId, studentName,
}) {
  const worksheet = await Worksheet.findById(worksheetId);
  if (!worksheet) throw new Error('Worksheet not found for generation job.');
  try {
    const result = await analyzeAndGenerateWorksheet({
      imageBase64, mimeType, gradeLevel, topicHint, numQuestions: totalQuestions,
    });
    Object.assign(worksheet, photoWorksheetFields(result));
    worksheet.generationStatus = 'ready';
    worksheet.generationError = '';
    recomputeSchedule(worksheet);
    await worksheet.save();
    await logPhotoMisconceptions({ result, ownerUserId, studentUserId, studentName, worksheetId: worksheet._id });
    return { worksheetId: String(worksheet._id), status: 'ready', modelUsed: result.modelUsed, escalated: result.escalated };
  } catch (err) {
    worksheet.generationStatus = 'failed';
    worksheet.generationError = err.message || 'Worksheet generation failed.';
    await worksheet.save().catch(() => {});
    throw err;
  }
}
