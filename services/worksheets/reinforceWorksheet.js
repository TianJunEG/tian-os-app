// Shared reinforcement-generation logic (Phase 1 WS3), used by both the inline
// route path (queue disabled) and the background worker (queue enabled). The
// pending worksheet already carries the source-derived fields (topic, summary,
// misconceptions, skills); this only generates the questions → sessions.
import Worksheet from '../../models/Worksheet.js';
import { generateReinforcement } from '../../utils/aiService.js';
import { buildSessions, recomputeSchedule } from '../../utils/practiceSchedule.js';

// Worker entry: generate reinforcement questions for an existing (pending)
// worksheet and mark it ready. On failure, persist 'failed' + message, re-throw.
export async function runReinforcementGeneration({ worksheetId, topic, misconceptions, gradeLevel, totalQuestions }) {
  const worksheet = await Worksheet.findById(worksheetId);
  if (!worksheet) throw new Error('Worksheet not found for reinforcement job.');
  try {
    const questions = await generateReinforcement({ topic, misconceptions, gradeLevel, numQuestions: totalQuestions });
    worksheet.practiceSessions = buildSessions(questions);
    worksheet.generationStatus = 'ready';
    worksheet.generationError = '';
    recomputeSchedule(worksheet);
    await worksheet.save();
    return { worksheetId: String(worksheet._id), status: 'ready' };
  } catch (err) {
    worksheet.generationStatus = 'failed';
    worksheet.generationError = err.message || 'Reinforcement generation failed.';
    await worksheet.save().catch(() => {});
    throw err;
  }
}
