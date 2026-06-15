// Job handler for the `worksheet-reinforce` queue (Phase 1 WS3). Generates a
// reinforcement plan for an existing (pending) worksheet off the request path.
import { runReinforcementGeneration } from '../services/worksheets/reinforceWorksheet.js';

export async function processReinforce(job) {
  const { worksheetId } = job.data || {};
  if (!worksheetId) throw new Error('worksheet-reinforce job is missing worksheetId.');
  return runReinforcementGeneration(job.data);
}
