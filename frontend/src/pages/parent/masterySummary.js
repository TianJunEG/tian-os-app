// Shared mastery rollup. Before this, ChildProgress (Math) and ChildScience
// (Science) computed "Overall mastery" with different denominators — Math
// averaged across every record (including never-attempted skills scoring 0),
// Science averaged across attempted skills only. Same kid showed two different
// numbers on two screens. This helper is the single source of truth for the
// three stat tiles that appear on both pages.
//
// Accepts any array of `{ status, score }` items (mastery records or
// per-skill rows — they share the same shape on the wire).
export function summariseMastery(records = []) {
  const attempted = records.filter((r) => r.status !== 'not_started');
  const mastered = records.filter((r) => r.status === 'mastered').length;
  const learning = records.filter((r) => r.status === 'learning' || r.status === 'needs_review').length;
  const overall = attempted.length
    ? Math.round(attempted.reduce((sum, r) => sum + (r.score || 0), 0) / attempted.length)
    : 0;
  return { mastered, learning, overall, attempted: attempted.length, total: records.length };
}

// Tailwind background classes for the per-skill status tile bars. Kept here
// so Math and Science by-topic strips stay visually identical.
//
// not_started gets an inset ring so a topic with zero attempts (the common
// brand-new-account case) still reads as "this is a 23-tile bar" instead of
// blending into the card background. The post-Batch-4 verify caught this:
// the segmented tiles change was invisible to a fresh student.
export function statusTone(status) {
  if (status === 'mastered') return 'bg-navy-700';
  if (status === 'learning') return 'bg-navy-300';
  if (status === 'needs_review') return 'bg-error-300';
  return 'bg-ink-100 ring-1 ring-inset ring-ink-200'; // not_started
}
