// Shared sanitiser for tutor-entered per-topic homework results (the structured
// block on a lesson note). Coerces counts to non-negative integers, clamps
// `correct` to `total` so accuracy can never exceed 100%, and drops rows without
// a topic name or any questions — so a bad client payload can't write junk.
export function sanitizeHomeworkResults(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r) => {
      const total = Math.max(0, Math.round(Number(r?.total) || 0));
      const correct = Math.max(0, Math.round(Number(r?.correct) || 0));
      return {
        topicId: r?.topicId || null,
        topicName: String(r?.topicName || '').trim(),
        total,
        correct: Math.min(correct, total),
      };
    })
    .filter((r) => r.topicName && r.total > 0);
}
