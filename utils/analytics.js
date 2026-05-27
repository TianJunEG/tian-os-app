// MathPath analytics — lightweight, dashboard-ready aggregations computed from
// data the app ALREADY stores (PracticeAttempt event log + MasteryRecord +
// Question). No new event store: PracticeAttempt is the source of truth for
// response times / accuracy, MasteryRecord for mastery & fluency, and joining
// wrong attempts to Question gives misconception frequency. Kept intentionally
// small and stateless so parent/tutor dashboards and the AI layer can reuse it.
import PracticeAttempt from '../models/PracticeAttempt.js';
import MasteryRecord from '../models/MasteryRecord.js';
import Question from '../models/Question.js';
import { deriveMastery } from './masteryEngine.js';

const median = (xs) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] : null);
const round2 = (n) => Math.round(n * 100) / 100;

// One clean analytics object for a student's MathPath progress over a window.
export async function studentMathAnalytics(studentId, { sinceDays = 30 } = {}) {
  const since = new Date(Date.now() - sinceDays * 86400000);
  const records = await MasteryRecord.find({ studentId, module: 'MathPath' });
  const attempts = await PracticeAttempt.find({ studentId, createdAt: { $gte: since } });

  // Response time + accuracy (fluency uses correct-attempt times only).
  const correctTimes = attempts.filter((a) => a.correct && a.timeMs > 0).map((a) => a.timeMs);
  const accuracy = attempts.length ? attempts.filter((a) => a.correct).length / attempts.length : 0;

  // Practice consistency = distinct active days across the window.
  const activeDays = new Set(attempts.map((a) => new Date(a.createdAt).toISOString().slice(0, 10))).size;

  // Mastery velocity = skills mastered AND practised within the window.
  const masteryVelocity = records.filter((r) => r.status === 'mastered' && r.lastPracticedAt && new Date(r.lastPracticedAt) >= since).length;

  // Distributions over the derived vocabulary.
  const masteryDistribution = {};
  const fluencyTrend = {};
  for (const r of records) {
    const s = deriveMastery(r); masteryDistribution[s] = (masteryDistribution[s] || 0) + 1;
    const f = r.fluencyStatus || 'unknown'; fluencyTrend[f] = (fluencyTrend[f] || 0) + 1;
  }

  // Misconception frequency: wrong attempts → the question's misconceptionTag.
  const wrongQids = attempts.filter((a) => !a.correct).map((a) => a.questionId);
  const qTags = new Map((await Question.find({ _id: { $in: wrongQids } }, { misconceptionTag: 1 }))
    .map((q) => [String(q._id), q.misconceptionTag]));
  const misCounts = {};
  for (const a of attempts) if (!a.correct) { const t = qTags.get(String(a.questionId)); if (t) misCounts[t] = (misCounts[t] || 0) + 1; }
  const misconceptionFrequency = Object.entries(misCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag, count]) => ({ tag, count }));

  return {
    window: { sinceDays, since },
    attempts: attempts.length,
    accuracy: round2(accuracy),
    medianResponseMs: median(correctTimes),
    activeDays,
    practiceConsistency: round2(activeDays / sinceDays),
    masteryVelocity,
    masteryDistribution,                         // { not_started, developing, practising, fluent, mastered }
    fluencyTrend,                                // { unknown, effortful, developing, automatic }
    misconceptionFrequency,                      // top 5 [{ tag, count }]
    remediationTriggers: records.filter((r) => ['needs_review', 'learning'].includes(r.status)).length,
    avgConfidence: records.length ? round2(records.reduce((s, r) => s + (r.confidence || 0), 0) / records.length) : 0,
    avgConsistency: records.length ? round2(records.reduce((s, r) => s + (r.consistency ?? 1), 0) / records.length) : 0,
    trackedSkills: records.length,
  };
}
