// MathPath analytics — lightweight, dashboard-ready aggregations computed from
// existing records plus timing-aware question attempts:
//
// - PracticeAttempt: historical response-time + accuracy for parent/tutor
//   summary in shared dashboards.
// - MathPathAttempt: question-level fluency timing + confidence + skip data
//   for fractions/MathPath-specific analytics.
//
// No new event store is introduced; we use MathPathAttempt as the source of
// truth for MathPath timing and the diagnostic/fluency signals.
import PracticeAttempt from '../models/PracticeAttempt.js';
import MasteryRecord from '../models/MasteryRecord.js';
import Question from '../models/Question.js';
import MathPathAttempt from '../models/mathpath/MathPathAttempt.js';
import MathPathSkill from '../models/mathpath/MathPathSkill.js';
import { deriveMastery } from './masteryEngine.js';

const median = (xs) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] : null);
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const std = (xs) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((s, n) => s + (n - m) ** 2, 0) / xs.length);
};
const round2 = (n) => (Number.isFinite(n) ? Math.round(n * 100) / 100 : 0);
const clamp01 = (n) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mapConfidence(value = '') {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'i_know_this' || raw === 'very confident') return 0.95;
  if (raw === 'pretty_sure' || raw === 'confident') return 0.82;
  if (raw === 'not_sure' || raw === 'unsure') return 0.58;
  if (raw === 'i_need_help' || raw === 'guessing') return 0.28;

  const numeric = Number(raw);
  if (Number.isFinite(numeric)) {
    if (numeric <= 1) return clamp01(numeric);
    if (numeric <= 100) return clamp01(numeric / 100);
  }
  return null;
}

function safeWeighted(value, weight) {
  if (!Number.isFinite(value) || !Number.isFinite(weight) || weight <= 0) return { sum: 0, weight: 0 };
  return { sum: value * weight, weight };
}

function buildSkillTargetMap(skills = []) {
  return new Map(
    skills
      .filter((s) => s?.skillId)
      .map((s) => [String(s.skillId).toUpperCase(), toNum(s?.fluency?.targetAverageSeconds, 20)])
  );
}

function summarizeAttempts(attempts = [], options = {}) {
  const windowStart = options.windowStart instanceof Date ? options.windowStart : null;
  const targets = buildSkillTargetMap(options.skills || []);
  const bySkill = {};
  const confidenceBySkill = new Map();
  const questionFamilyCounts = new Set();

  for (const attempt of attempts) {
    const skillId = String(attempt.skillId || '').toUpperCase();
    if (!skillId) continue;
    if (!bySkill[skillId]) {
      bySkill[skillId] = {
        skill_id: skillId,
        question_count: 0,
        correct_count: 0,
        skipped_count: 0,
        timeout_count: 0,
        time_spent_samples: [],
      };
    }
    const row = bySkill[skillId];
    row.question_count += 1;
    if (attempt.questionId) questionFamilyCounts.add(String(attempt.questionId));
    if (attempt.correct) row.correct_count += 1;
    if (attempt.skipped) row.skipped_count += 1;
    if (attempt.timedOut) row.timeout_count += 1;
    const spent = toNum(attempt.timeSpentSeconds ?? attempt.timeTaken, null);
    if (spent !== null && spent >= 0) row.time_spent_samples.push(spent);
    if (attempt.questionId) row.last_question_id = String(attempt.questionId);

    const confidenceValue = mapConfidence(attempt.confidence || attempt.confidenceLevel);
    if (confidenceValue !== null) {
      const key = skillId;
      const bucket = confidenceBySkill.get(key) || { total: 0, correctness: 0, confidence: 0 };
      bucket.total += 1;
      bucket.correctness += attempt.correct ? 1 : 0;
      bucket.confidence += confidenceValue;
      confidenceBySkill.set(key, bucket);
    }
  }

  const bySkillReport = Object.entries(bySkill).map(([skillId, raw]) => {
    const total = toNum(raw.question_count, 0);
    const timedSeconds = raw.time_spent_samples.slice().sort((a, b) => a - b);
    const average = mean(timedSeconds);
    const stdSeconds = std(timedSeconds);
    const consistency = timedSeconds.length > 1 ? clamp01(1 - Math.min(1, stdSeconds / Math.max(1, mean(timedSeconds)))) : 1;

    const targetSeconds = toNum(targets.get(skillId), 20);
    const speed = average === null
      ? null
      : clamp01(1 / (1 + Math.max(0, (average - targetSeconds) / Math.max(1, targetSeconds))));

    const confidenceBucket = confidenceBySkill.get(skillId);
    const confidenceCalibration = confidenceBucket?.total
      ? clamp01(1 - Math.abs((confidenceBucket.confidence / confidenceBucket.total) - (confidenceBucket.correctness / confidenceBucket.total)))
      : null;

    const accuracyRate = total ? raw.correct_count / total : 0;
    const skipRate = total ? raw.skipped_count / total : 0;

    const weightedAccuracy = safeWeighted(accuracyRate, 0.5);
    const weightedSpeed = safeWeighted(speed ?? 0, speed === null ? 0 : 0.25);
    const weightedConsistency = safeWeighted(consistency, 0.25);
    const effectiveWeight = weightedAccuracy.weight + weightedSpeed.weight + weightedConsistency.weight || 1;
    const stability = Math.min(1, total / 6);
    const fluencyCore = (weightedAccuracy.sum + weightedSpeed.sum + weightedConsistency.sum) / effectiveWeight;
    const fluencyScore = round2(clamp01(fluencyCore) * 100 * stability);

    return {
      ...raw,
      accuracy_rate: round2(accuracyRate * 100),
      average_response_time: average === null ? null : round2(average),
      skip_rate: round2(skipRate * 100),
      confidence_calibration: confidenceCalibration === null ? null : round2(confidenceCalibration * 100),
      consistency: round2(consistency * 100),
      fluency_score: isFinite(fluencyScore) ? fluencyScore : 0,
      confidence_sample_size: confidenceBucket?.total || 0,
      speed_score: speed === null ? null : round2(speed * 100),
      weighted: {
        accuracy: weightedAccuracy.sum,
        speed: weightedSpeed.sum,
        consistency: weightedConsistency.sum,
      },
      window: {
        start: windowStart,
        end: new Date(),
      },
      time_spent_sample_count: timedSeconds.length,
      skill_id: skillId,
      confidence_bucket: confidenceBucket || null,
      target_seconds: targetSeconds,
      question_id_last: raw.last_question_id || null,
      confidence_calibration_raw: confidenceCalibration,
      total_attempts: total,
    };
  });

  const totalRows = bySkillReport.length || 1;
  const overall = {
    question_attempts: attempts.length,
    unique_questions: questionFamilyCounts.size,
    average_accuracy_rate: round2((bySkillReport.reduce((s, row) => s + row.accuracy_rate, 0) / totalRows)),
    average_skip_rate: round2((bySkillReport.reduce((s, row) => s + row.skip_rate, 0) / totalRows)),
    average_fluency_score: round2((bySkillReport.reduce((s, row) => s + row.fluency_score, 0) / totalRows)),
  };

  return {
    totalAttempts: attempts.length,
    attemptsBySkill: bySkillReport,
    bySkill: bySkillReport.reduce((acc, row) => {
      acc[row.skill_id] = row;
      return acc;
    }, {}),
    overall,
  };
}

function getAttemptWindowFilter(studentId, options = {}) {
  const sinceDays = Number.isFinite(options.sinceDays) ? Math.max(1, Math.floor(options.sinceDays)) : null;
  const filter = { studentId: String(studentId), domainId: 'fractions' };
  if (options.sessionId) filter.sessionId = options.sessionId;
  if (sinceDays) filter.createdAt = { $gte: new Date(Date.now() - sinceDays * 86400000) };
  return filter;
}

async function getMathPathTimingAttempts(studentId, options = {}) {
  const filter = getAttemptWindowFilter(studentId, options);
  const attempts = await MathPathAttempt.find(filter).lean();
  const skills = await MathPathSkill.find({ domainId: 'fractions' }).select('skillId fluency').lean();
  const sinceDays = Number.isFinite(options.sinceDays) ? Math.max(1, Math.floor(options.sinceDays)) : null;
  const windowStart = options.sessionId || !sinceDays ? null : new Date(Date.now() - sinceDays * 86400000);
  return { attempts, skills, windowStart };
}

export async function studentMathPathTimingAnalytics(studentId, options = {}) {
  const { attempts, skills, windowStart } = await getMathPathTimingAttempts(studentId, options);
  return summarizeAttempts(attempts, {
    ...options,
    windowStart,
    skills,
  });
}

// One clean analytics object for a student's MathPath progress over a window.
export async function studentMathAnalytics(studentId, { sinceDays = 30 } = {}) {
  const since = new Date(Date.now() - sinceDays * 86400000);
  const records = await MasteryRecord.find({ studentId, module: 'MathPath' });
  const attempts = await PracticeAttempt.find({ studentId, createdAt: { $gte: since } });
  // MathPath DOMAIN practice + fluency write MathPathAttempt — a collection DISJOINT
  // from PracticeAttempt — so reading PracticeAttempt alone under-counts a student's
  // real math work, often by most of it. Fold in non-diagnostic MathPathAttempts
  // (diagnostics are an assessment context, excluded so they don't skew practice
  // accuracy/timing). Note: MathPath timing is in SECONDS; PracticeAttempt.timeMs is ms.
  const mpAttempts = await MathPathAttempt.find({
    studentId: String(studentId),
    sessionType: { $ne: 'diagnostic' },
    createdAt: { $gte: since },
  }).lean();

  // Unify both sources to { correct, ms, createdAt } for volume/accuracy/timing.
  const unified = [
    ...attempts.map((a) => ({
      correct: Boolean(a.correct),
      ms: toNum(a.timeMs, 0) > 0 ? toNum(a.timeMs, 0) : toNum(a.timeTakenSeconds, 0) * 1000,
      createdAt: a.createdAt,
    })),
    ...mpAttempts.map((a) => ({
      correct: Boolean(a.correct),
      ms: (toNum(a.timeSpentSeconds, 0) || toNum(a.effectiveAnswerTimeSeconds, 0) || toNum(a.rawTimeSeconds, 0)) * 1000,
      createdAt: a.createdAt,
    })),
  ];

  // Response time + accuracy (fluency uses correct-attempt times only).
  const correctTimes = unified.filter((a) => a.correct && a.ms > 0).map((a) => a.ms);
  const accuracy = unified.length ? unified.filter((a) => a.correct).length / unified.length : 0;

  // Practice consistency = distinct active days across the window.
  const activeDays = new Set(unified.map((a) => new Date(a.createdAt).toISOString().slice(0, 10))).size;

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
  for (const a of attempts) if (!a.correct) {
    const t = qTags.get(String(a.questionId));
    if (t) misCounts[t] = (misCounts[t] || 0) + 1;
  }
  const misconceptionFrequency = Object.entries(misCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag, count]) => ({ tag, count }));

  return {
    window: { sinceDays, since },
    attempts: unified.length,
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
