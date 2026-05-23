// Mastery / revision logic for the spelling app, derived purely from a user's
// recorded attempts. Kept dependency-free so it is easy to unit test.

// A word is "mastered" once it has this many correct attempts in a row.
export const MASTERY_STREAK = 3;

// Aggregate attempts into per-word stats. `attempts` MUST be sorted
// newest-first. Returns a Map keyed by the lowercased word, where each value is
// { word, total, correct, misses, streak, lastSeen, mastered, weak }.
export function computeWordStats(attempts) {
  const stats = new Map();
  for (const a of attempts) {
    if (!a.word) continue;
    const key = a.word.toLowerCase();
    let s = stats.get(key);
    if (!s) {
      s = { word: a.word, total: 0, correct: 0, misses: 0, streak: 0, streakOpen: true, lastSeen: a.createdAt };
      stats.set(key, s);
    }
    s.total += 1;
    if (a.correct) s.correct += 1;
    else s.misses += 1;
    // Walking newest-first, the current streak runs until the first wrong answer.
    if (s.streakOpen) {
      if (a.correct) s.streak += 1;
      else s.streakOpen = false;
    }
  }
  for (const s of stats.values()) {
    s.mastered = s.streak >= MASTERY_STREAK;
    s.weak = !s.mastered && s.misses > 0; // attempted, missed, not yet mastered
  }
  return stats;
}

// Sort comparator: weak words first (most misses, then least-recently seen so
// revision spaces out over time).
export function byRevisionPriority(a, b) {
  return b.misses - a.misses || new Date(a.lastSeen) - new Date(b.lastSeen);
}

// --- Spaced repetition scheduling --------------------------------------------
// Review gaps in days, indexed by the word's current correct streak. A correct
// answer lengthens the gap (the word is "sticking"); a miss resets the streak
// to 0 so the word returns the next day. The index is clamped to the last gap,
// so well-known words still resurface roughly every couple of months.
export const REVIEW_INTERVAL_DAYS = [1, 2, 4, 7, 14, 30, 60];

const DAY_MS = 24 * 60 * 60 * 1000;

// When a word is next due for review, from its streak and when it was last seen.
export function nextReviewAt(stat) {
  const idx = Math.min(stat.streak, REVIEW_INTERVAL_DAYS.length - 1);
  return new Date(new Date(stat.lastSeen).getTime() + REVIEW_INTERVAL_DAYS[idx] * DAY_MS);
}

// Whole-day comparison, so a word stays "due today" for the whole calendar day
// rather than only after the exact time it was last practised.
const dayNumber = (d) => Math.floor(new Date(d).getTime() / DAY_MS);

export function isDue(stat, now = new Date()) {
  return dayNumber(nextReviewAt(stat)) <= dayNumber(now);
}

// Sort comparator for the review queue: most overdue first, then most-missed.
export function byDuePriority(a, b) {
  return nextReviewAt(a) - nextReviewAt(b) || b.misses - a.misses;
}
