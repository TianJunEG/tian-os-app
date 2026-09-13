// Lightweight retention signal computed from episode-completion timestamps —
// no new backend, just the completedAt values /progress already returns.
//   thisWeek: completions in the last 7 days
//   streak:   consecutive local calendar days (up to today) with ≥1 completion.
//             Stays "alive" if the most recent activity was today OR yesterday.

function localDayKey(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
}

export function comicMomentum(completedAtList = [], now = new Date()) {
  const dates = completedAtList
    .map((c) => new Date(c))
    .filter((d) => !Number.isNaN(d.getTime()));

  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const thisWeek = dates.filter((d) => {
    const age = now - d;
    return age >= 0 && age <= WEEK_MS;
  }).length;

  const activeDays = new Set(dates.map(localDayKey));
  let streak = 0;
  const cursor = new Date(now);
  // If today has no activity yet, start the count at yesterday so a one-day gap
  // (hasn't read *today*) doesn't read as a broken streak.
  if (!activeDays.has(localDayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (activeDays.has(localDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { thisWeek, streak };
}
