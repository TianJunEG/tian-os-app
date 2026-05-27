import { NextResponse } from 'next/server';
import { updateMastery } from '@/lib/mastery.js';
import { refreshRecommendation } from '@/lib/recommend.js';
import { collections } from '@/lib/db.js';

// POST /api/session/complete { studentId, session_id, skill_id, items }
// items: [{ question_id, given_answer, correct, first_try, hint_used, time_seconds, misconception_tag }]
// Updates mastery, stores per-session analytics, and returns the fresh profile + next step.
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { studentId = 'demo-student', session_id, skill_id, items = [] } = body;
  if (!skill_id) return NextResponse.json({ error: 'skill_id required' }, { status: 400 });

  const masteryUpdate = await updateMastery(studentId, skill_id, items);
  const next = await refreshRecommendation(studentId);

  const total = items.length;
  const correct = items.filter((i) => i.correct).length;
  const times = items.map((i) => Number(i.time_seconds)).filter((t) => Number.isFinite(t));
  const avgTime = times.length ? Math.round((times.reduce((s, t) => s + t, 0) / times.length) * 10) / 10 : null;
  const mistakes = items.filter((i) => !i.correct).map((i) => ({ question_id: i.question_id, given: i.given_answer, misconception_tag: i.misconception_tag || null }));

  const analytics = {
    student_id: studentId, skill_id,
    total_questions: total, correct_questions: correct,
    accuracy: total ? Math.round((correct / total) * 100) / 100 : 0,
    average_time_seconds: avgTime,
    mistakes_count: mistakes.length, mistakes,
    remediation_triggered: items.some((i) => i.misconception_tag),
    mastery_delta: masteryUpdate.score_delta,
    mastery_status: masteryUpdate.mastery_status, fluency_status: masteryUpdate.fluency_status,
    confidence: masteryUpdate.score, // 0–1, the practised skill's mastery score at session end
    next_recommendation: { skill_id: next.recommended_skill_id, skill_name: next.skill.skill_name, mode: next.mode },
  };

  // Always persist the completed session's analytics (update the open session, or insert one
  // if this came in without a session_id) so the dashboard's history/trend stays complete.
  const { sessions } = await collections();
  const ended_at = new Date().toISOString();
  if (session_id) {
    await sessions.updateOne({ _id: session_id }, { $set: { ended_at, correct_count: correct, items, analytics } });
  } else {
    await sessions.insertOne({ _id: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, student_id: studentId, skill_id, started_at: ended_at, ended_at, correct_count: correct, items, analytics });
  }

  return NextResponse.json({
    mastery_update: masteryUpdate,
    session_summary: { item_count: total, correct_count: correct, average_time_seconds: avgTime },
    analytics,
    next_recommendation: next,
  });
}
