// Job handler for the `paper-analysis` queue (Phase 1 WS3).
//
// The pipeline reads the uploaded file from its on-disk storageKey when no buffer
// is provided, so the job payload carries only references (analysisId, mimeType,
// filename) — never the raw file — keeping Redis payloads small. The pipeline owns
// all status transitions (processing → … → needs_review, or → failed on error and
// re-throws so BullMQ retries).
import {
  runPaperAnalysisPipeline,
  resumeFromOcrConfirmation,
} from '../services/mathpath/paperAnalysisPipeline.js';

export async function processPaperAnalysis(job) {
  const { analysisId, mimeType = '', filename = '', resumeFrom = '' } = job.data || {};
  if (!analysisId) throw new Error('paper-analysis job is missing analysisId.');
  const analysis = resumeFrom === 'questions_confirmed'
    ? await resumeFromOcrConfirmation(analysisId)
    : await runPaperAnalysisPipeline({ analysisId, mimeType, filename });
  return { analysisId: String(analysis._id), status: analysis.status };
}
