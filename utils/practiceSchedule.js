// Spaced-repetition schedule, in days from today.
export const SESSION_OFFSETS = [0, 2, 7];
const DAY_MS = 24 * 60 * 60 * 1000;
const DIFFICULTY_RANK = { easier: 0, similar: 1, harder: 2 };

// Split a flat, AI-generated question pool into the spaced sessions, spreading
// difficulties across sessions so each session is a balanced mini-set.
export function buildSessions(questions, fromTime = Date.now()) {
  if (!Array.isArray(questions) || questions.length === 0) return [];

  const sorted = [...questions].sort(
    (a, b) => (DIFFICULTY_RANK[a.difficulty] ?? 1) - (DIFFICULTY_RANK[b.difficulty] ?? 1)
  );

  const n = SESSION_OFFSETS.length;
  const buckets = Array.from({ length: n }, () => []);
  sorted.forEach((q, i) => buckets[i % n].push(q));

  return buckets
    .map((qs, i) => ({
      sessionNumber: i + 1,
      scheduledFor: new Date(fromTime + SESSION_OFFSETS[i] * DAY_MS),
      completed: false,
      questions: qs
    }))
    .filter((s) => s.questions.length > 0);
}

// Refresh the denormalized due-tracking fields from the session list.
export function recomputeSchedule(worksheet) {
  worksheet.sessionsTotal = worksheet.practiceSessions.length;
  worksheet.sessionsCompleted = worksheet.practiceSessions.filter((s) => s.completed).length;
  const upcoming = worksheet.practiceSessions
    .filter((s) => !s.completed)
    .map((s) => s.scheduledFor)
    .sort((a, b) => new Date(a) - new Date(b));
  worksheet.nextDueAt = upcoming[0] || null;
}
