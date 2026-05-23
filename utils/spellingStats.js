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
