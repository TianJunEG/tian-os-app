// Class-level progress note "from Chelya" for the teacher dashboard. Teacher-
// toned: concise signal and a clear "start here", not parent-style praise.
// Pure/deterministic (Tier 1) over buildClassOverview() output.
//   classOverview: { totalStudents, studentsOnTrack, studentsNeedingSupport, studentsReadyForExtension }
//   opts: { className, needsAttentionCount }
export function buildTeacherNarration(classOverview = {}, opts = {}) {
  const total = Number(classOverview.totalStudents) || 0;
  const onTrack = Number(classOverview.studentsOnTrack) || 0;
  const needSupport = Number(classOverview.studentsNeedingSupport) || 0;
  const ready = Number(classOverview.studentsReadyForExtension) || 0;
  const flagged = Number(opts.needsAttentionCount) || 0;
  const className = opts.className || 'Your class';

  if (!total) {
    return { headline: 'Class update', body: `No MathPath activity to summarise for ${className} yet.` };
  }

  const parts = [`${onTrack} of ${total} on track`];
  if (needSupport) parts.push(`${needSupport} need support`);
  if (ready) parts.push(`${ready} ready for extension`);

  let body = `${className}: ${parts.join(', ')}.`;
  if (flagged) {
    body += ` ${flagged} student${flagged === 1 ? '' : 's'} flagged for you this week — start there.`;
  }
  return { headline: 'Class update', body };
}

export default buildTeacherNarration;
