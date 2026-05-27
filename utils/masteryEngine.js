// Shared mastery engine — the ONE place mastery is computed/written. Every
// module (MathPath, Mistake-to-Mastery, Worksheet practice, Fluency) calls
// recordAttempt(); nothing else writes MasteryRecord. Keeps "one shared core".
import MasteryRecord from '../models/MasteryRecord.js';
import Mistake from '../models/Mistake.js';

const MASTERED_AT = 80;   // score >= → mastered (with enough attempts)
const REVIEW_BELOW = 50;  // score < → needs_review
const MIN_ATTEMPTS_FOR_MASTERY = 5;

// Exponential moving average so recent performance moves the needle without
// erasing history. correct → 100, wrong → 0.
function nextScore(prev, correct, attempts) {
  const alpha = attempts < 3 ? 0.5 : 0.3;
  return Math.round(prev * (1 - alpha) + (correct ? 100 : 0) * alpha);
}

function deriveStatus(score, attempts) {
  if (attempts === 0) return 'not_started';
  if (score >= MASTERED_AT && attempts >= MIN_ATTEMPTS_FOR_MASTERY) return 'mastered';
  if (score < REVIEW_BELOW) return 'needs_review';
  return 'learning';
}

// Update mastery for one (student, skill) from a single graded attempt.
// Returns { before, after, masteredNow }.
export async function recordAttempt({ studentId, skillId, workspaceId, correct, module = 'MathPath', subject = 'Math' }) {
  let rec = await MasteryRecord.findOne({ studentId, skillId });
  if (!rec) {
    rec = new MasteryRecord({ studentId, skillId, workspaceId, module, subject, score: 0, attempts: 0, status: 'not_started' });
  }
  const before = { score: rec.score, status: rec.status };
  rec.attempts += 1;
  rec.score = nextScore(rec.score, correct, rec.attempts);
  rec.status = deriveStatus(rec.score, rec.attempts);
  rec.lastPracticedAt = new Date();
  await rec.save();

  const masteredNow = before.status !== 'mastered' && rec.status === 'mastered';
  if (rec.status === 'mastered') {
    // Resolution is mastery-derived (not "did a worksheet"): clear open mistakes.
    await Mistake.updateMany(
      { studentId, skillId, status: { $ne: 'resolved' } },
      { $set: { status: 'resolved' } }
    );
  }
  return { before, after: { score: rec.score, status: rec.status }, masteredNow };
}

// Weak skills for a student: lowest score / needs_review first. Optionally only
// those with recent unresolved mistakes.
export async function weakSkills(studentId, { limit = 10, withMistakesOnly = false } = {}) {
  // MathPath surfaces only — spelling/other-module records are excluded.
  const q = { studentId, module: 'MathPath', status: { $in: ['needs_review', 'learning', 'not_started'] } };
  let records = await MasteryRecord.find(q).populate({ path: 'skillId', populate: { path: 'topicId' } }).sort({ score: 1 }).limit(limit * 2);
  if (withMistakesOnly) {
    const skillIds = records.map((r) => r.skillId?._id).filter(Boolean);
    const withMistakes = await Mistake.distinct('skillId', { studentId, skillId: { $in: skillIds }, status: { $ne: 'resolved' } });
    const set = new Set(withMistakes.map(String));
    records = records.filter((r) => set.has(String(r.skillId?._id)));
  }
  return records.slice(0, limit);
}
