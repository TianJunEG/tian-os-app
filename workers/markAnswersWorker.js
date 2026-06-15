// Job handler for the `mark-answers` queue (Phase 1 WS3). Marks one practice
// session for an existing worksheet off the request path.
import { runSessionMarking } from '../services/worksheets/markSession.js';

export async function processMarkAnswers(job) {
  const { worksheetId, sessionNumber } = job.data || {};
  if (!worksheetId || sessionNumber == null) throw new Error('mark-answers job is missing worksheetId/sessionNumber.');
  return runSessionMarking(job.data);
}
