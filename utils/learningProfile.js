// Unified learning profile — the backbone of "one connected learning platform".
// Every learning app (Spelling now; Math/Science as they come online) contributes a normalised
// signal here, and we assemble them into ONE profile that all dashboards read via the API.
// Pure + dependency-free so it is easy to unit test; the route layer feeds it real data.

export const PROFILE_SUBJECTS = {
  eng: 'English', chi: 'Chinese', emath: 'E-Math', amath: 'A-Math',
  chem: 'Chemistry', bio: 'Biology', phys: 'Physics',
};
const band = (score) => (score >= 75 ? 'on track' : score >= 50 ? 'building' : 'at risk');

// Spelling app (per-word stats from utils/spellingStats) → an English/Chinese contribution.
// `stats` shape mirrors GET /api/spelling/stats.
export function spellingContribution(stats, subjectId = 'eng') {
  const m = stats.mastery || { mastered: 0, learning: 0, weak: 0 };
  const uniq = stats.uniqueWords || (m.mastered + m.learning + m.weak);
  return {
    source: 'spelling',
    subjectId,
    accuracy: stats.accuracy || 0,
    masteryPct: uniq ? Math.round((m.mastered / uniq) * 100) : 0,
    counts: m,
    weak: (stats.weakWords || []).slice(0, 10).map((w) => ({ label: w.word, detail: `${w.misses} miss${w.misses === 1 ? '' : 'es'}` })),
    volume: stats.total || 0,
  };
}

// Topic-based source (Math/Science) → a contribution. `topics`: [{ name, status, accuracy }]
// where status ∈ not-started|learning|needs-revision|mastered (matches the MathPath/edu-os model).
export function topicContribution(source, subjectId, topics = []) {
  const mastered = topics.filter((t) => t.status === 'mastered').length;
  const accs = topics.filter((t) => t.accuracy).map((t) => t.accuracy);
  return {
    source,
    subjectId,
    accuracy: accs.length ? Math.round(accs.reduce((a, b) => a + b, 0) / accs.length) : 0,
    masteryPct: topics.length ? Math.round((mastered / topics.length) * 100) : 0,
    counts: {
      mastered,
      learning: topics.filter((t) => t.status === 'learning').length,
      weak: topics.filter((t) => t.status === 'needs-revision').length,
    },
    weak: topics.filter((t) => t.status === 'needs-revision').map((t) => ({ label: t.name, detail: `${t.accuracy || 0}%` })),
    volume: topics.length,
  };
}

// Assemble contributions (from any sources) into the unified profile the dashboards consume.
export function buildProfile(userId, contributions = []) {
  const subjects = contributions.filter(Boolean).map((c) => {
    const readiness = Math.round(0.6 * c.masteryPct + 0.4 * c.accuracy);
    return {
      subjectId: c.subjectId,
      subject: PROFILE_SUBJECTS[c.subjectId] || c.subjectId,
      source: c.source,
      masteryPct: c.masteryPct,
      accuracy: c.accuracy,
      readiness,
      band: band(readiness),
      counts: c.counts,
      weak: c.weak,
    };
  });
  const overall = subjects.length ? Math.round(subjects.reduce((a, s) => a + s.readiness, 0) / subjects.length) : 0;
  const weakAcross = subjects.flatMap((s) => s.weak.map((w) => ({ ...w, subject: s.subject })));
  return {
    userId,
    overall,
    band: band(overall),
    subjects,
    weakTopics: weakAcross.slice(0, 12),
    sources: [...new Set(contributions.filter(Boolean).map((c) => c.source))],
    updatedAt: new Date().toISOString(),
  };
}
