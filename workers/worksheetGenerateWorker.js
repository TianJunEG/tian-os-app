// Job handler for the `worksheet-generate` queue (Phase 1 WS3).
//
// The job carries the photo by reference (storageKey/storageProvider) rather than
// as an inline base64 blob, so the Redis payload stays tiny; runPhotoWorksheetGeneration
// re-reads the persisted upload via the storage facade. The pending Worksheet doc
// already exists; this fills it in.
import { runPhotoWorksheetGeneration } from '../services/worksheets/photoWorksheet.js';

export async function processWorksheetGenerate(job) {
  const { worksheetId } = job.data || {};
  if (!worksheetId) throw new Error('worksheet-generate job is missing worksheetId.');
  return runPhotoWorksheetGeneration(job.data);
}
