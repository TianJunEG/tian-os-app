// mastery.js — the mastery engine. One record per (student, skill).
//
// Tracks: attempts, correct attempts, accuracy (first-try), average + fastest response time,
// retries, current/best streak, last practiced date, plus two status ladders:
//
//   mastery_status:  not_started → developing (<70%) → practising (70–89%)
//                    → fluent (≥90% accurate, not yet fast) → mastered (accurate AND fast)
//   fluency_status:  slow → steady → fast   (median first-try time vs the skill's target)
//
// Fluency timing counts first-try, un-hinted, correct answers only.

import { collections } from './db.js';
import { getSkill } from './graph.js';

const WINDOW = 40;
const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const round1 = (x) => (x == null ? null : Math.round(x * 10) / 10);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

function blank(studentId, skillId) {
  return {
    student_id: studentId, skill_id: skillId,
    mastery_status: 'not_started', fluency_status: 'slow',
    attempts: 0, correct_attempts: 0, first_try_attempts: 0, first_try_correct: 0, retries: 0,
    current_streak: 0, best_streak: 0, fluent_times: [], misconceptions: {},
    accuracy: 0, average_time_seconds: null, fastest_time_seconds: null, median_first_try_seconds: null,
    score: 0, mastered_at: null, last_practiced_at: null,
  };
}

export async function updateMastery(studentId, skillId, items) {
  const skill = getSkill(skillId);
  const { mastery, fluency } = await collections();
  const p = (await mastery.findOne({ student_id: studentId, skill_id: skillId })) || blank(studentId, skillId);
  const prevScore = p.score || 0;

  let fluentTimes = [...(p.fluent_times || [])];
  let streak = p.current_streak || 0;
  let best = p.best_streak || 0;
  const misc = { ...(p.misconceptions || {}) };

  for (const it of items) {
    p.attempts += 1;
    if (it.correct) p.correct_attempts += 1;
    if (it.hint_used) p.retries += 1;
    if (it.misconception_tag) misc[it.misconception_tag] = (misc[it.misconception_tag] || 0) + 1;
    if (it.first_try) {
      p.first_try_attempts += 1;
      if (it.correct) {
        p.first_try_correct += 1;
        streak += 1; best = Math.max(best, streak);
        if (!it.hint_used) fluentTimes.push(Number(it.time_seconds) || skill.expected_time_seconds);
      } else {
        streak = 0;
      }
    }
  }
  fluentTimes = fluentTimes.slice(-WINDOW);

  const accuracy = p.first_try_attempts ? p.first_try_correct / p.first_try_attempts : 0;
  const medTime = median(fluentTimes);
  const avgTime = fluentTimes.length ? fluentTimes.reduce((s, x) => s + x, 0) / fluentTimes.length : null;
  const fastest = fluentTimes.length ? Math.min(...fluentTimes) : null;
  const target = skill.expected_time_seconds * skill.mastery_threshold.speed_grace;

  const meetsAccuracy = accuracy >= skill.mastery_threshold.accuracy;
  const meetsSpeed = medTime != null && fluentTimes.length >= 6 && medTime <= target;
  const speedScore = medTime ? clamp01(target / medTime) : 0;
  const score = clamp01(0.6 * accuracy + 0.4 * speedScore);

  // mastery_status ladder
  let mastery_status;
  if (p.attempts === 0) mastery_status = 'not_started';
  else if (accuracy < 0.7) mastery_status = 'developing';
  else if (accuracy < 0.9) mastery_status = 'practising';
  else if (!meetsSpeed) mastery_status = 'fluent';
  else mastery_status = 'mastered';

  // fluency_status dial (speed)
  let fluency_status = 'slow';
  if (medTime != null) {
    if (medTime <= skill.expected_time_seconds) fluency_status = 'fast';
    else if (medTime <= target) fluency_status = 'steady';
  }

  const masteredAt = mastery_status === 'mastered' ? (p.mastered_at || new Date().toISOString()) : p.mastered_at;
  const lastPracticed = new Date().toISOString();

  const next = {
    student_id: studentId, skill_id: skillId, mastery_status, fluency_status,
    attempts: p.attempts, correct_attempts: p.correct_attempts,
    first_try_attempts: p.first_try_attempts, first_try_correct: p.first_try_correct,
    retries: p.retries, current_streak: streak, best_streak: best,
    fluent_times: fluentTimes, misconceptions: misc,
    accuracy: Math.round(accuracy * 100) / 100,
    average_time_seconds: round1(avgTime), fastest_time_seconds: round1(fastest),
    median_first_try_seconds: round1(medTime),
    meets_accuracy: meetsAccuracy, meets_speed: meetsSpeed,
    score: Math.round(score * 100) / 100,
    mastered_at: masteredAt, last_practiced_at: lastPracticed,
  };

  await mastery.updateOne({ student_id: studentId, skill_id: skillId }, { $set: next }, { upsert: true });
  await fluency.updateOne(
    { student_id: studentId, skill_id: skillId },
    { $set: { student_id: studentId, skill_id: skillId, fluency_status, average_time_seconds: next.average_time_seconds, fastest_time_seconds: next.fastest_time_seconds, median_time_seconds: next.median_first_try_seconds, best_streak: best, updated_at: lastPracticed } },
    { upsert: true },
  );

  return { ...next, score_delta: Math.round((score - prevScore) * 100) / 100 };
}

export async function getProfiles(studentId) {
  const { mastery } = await collections();
  return (await mastery.find({ student_id: studentId })).toArray();
}
