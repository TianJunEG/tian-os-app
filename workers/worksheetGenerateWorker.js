// Job handler for the `worksheet-generate` queue (Phase 1 WS3).
//
// The job carries the photo as base64 (bounded by the 8MB upload limit) rather
// than a storage reference, so this offload is independent of where worksheet
// photos are stored. The pending Worksheet doc already exists; this fills it in.
import { runPhotoWorksheetGeneration } from '../services/worksheets/photoWorksheet.js';

export async function processWorksheetGenerate(job) {
  const { worksheetId } = job.data || {};
  if (!worksheetId) throw new Error('worksheet-generate job is missing worksheetId.');
  return runPhotoWorksheetGeneration(job.data);
}
