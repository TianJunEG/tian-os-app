// Shared photo-worksheet generation logic (Phase 1 WS3), used by BOTH the inline
// route path (queue disabled) and the background worker (queue enabled), so the AI
// call + session building + misconception logging live in one place.
import Worksheet from '../../models/Worksheet.js';
import logger from '../../config/logger.js';
import { analyzeAndGenerateWorksheet } from '../../utils/aiService.js';
import { buildSessions, recomputeSchedule } from '../../utils/practiceSchedule.js';
import { logDiagnosedMisconceptions } from '../../utils/misconceptionLog.js';
import { getUploadBuffer } from '../../services/storage/objectStore.js';

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
    logger.error({ err: logErr.message }, 'diagnosed-misconception logging failed (non-fatal)');
  }
}

// Worker entry: analyze the photo for an already-created (pending) worksheet, fill
// it in, and mark it ready. On failure, persist 'failed' + the message, then
// re-throw so BullMQ records/retries the job.
//
// The photo is passed by reference (storageKey/storageProvider) rather than as an
// inline base64 blob: the route already persists the upload via the storage facade,
// so the worker re-reads it here. This keeps the Redis job payload tiny (a key, not
// an 8MB string). `imageBase64` remains as a fallback for callers that still pass
// the bytes inline (e.g. the synchronous, queue-disabled path).
export async function runPhotoWorksheetGeneration({
  worksheetId, imageBase64, storageKey, storageProvider, mimeType, gradeLevel, topicHint, totalQuestions,
  ownerUserId, studentUserId, studentName,
}) {
  const worksheet = await Worksheet.findById(worksheetId);
  if (!worksheet) throw new Error('Worksheet not found for generation job.');
  try {
    // Resolve the image: prefer inline base64 when present, else fetch the
    // persisted upload by reference (payload-by-reference pattern). Inside the try
    // so a storage miss marks the worksheet 'failed' (and lets BullMQ retry)
    // rather than leaving the client polling a 'pending' doc forever.
    let resolvedBase64 = imageBase64;
    if (!resolvedBase64 && storageKey) {
      const buf = await getUploadBuffer({ storageKey, storageProvider });
      if (!buf) throw new Error('Worksheet photo could not be read from storage.');
      resolvedBase64 = buf.toString('base64');
    }
    const result = await analyzeAndGenerateWorksheet({
      imageBase64: resolvedBase64, mimeType, gradeLevel, topicHint, numQuestions: totalQuestions,
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
