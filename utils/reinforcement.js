import { buildSessions } from './practiceSchedule.js';

// Build the Worksheet fields for a reinforcement plan derived from `source`.
// Critically, the student assignment (studentId) is carried forward so an
// assigned student keeps access to the reinforced plan across cycles.
export function buildReinforcementWorksheet({ source, userId, misconceptions, questions }) {
  const titles = (misconceptions || []).map((m) => m.title).join(', ');
  return {
    userId,
    studentId: source.studentId,
    studentName: source.studentName,
    subject: source.subject,
    topic: source.topic,
    gradeLevel: source.gradeLevel,
    overallSummary: `Reinforcement practice targeting: ${titles || source.topic}.`,
    misconceptions,
    skillsToReinforce: source.skillsToReinforce,
    practiceSessions: buildSessions(questions),
  };
}
