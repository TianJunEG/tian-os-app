import { NextResponse } from 'next/server';
import { ensureStudent } from '@/lib/student.js';
import { refreshRecommendation } from '@/lib/recommend.js';
import { getProfiles } from '@/lib/mastery.js';
import { SKILLS, DOMAINS, domainName, prerequisitesOf } from '@/lib/graph.js';
import { collections } from '@/lib/db.js';

// GET /api/recommendation?studentId=…
// Returns the current recommendation, the skill graph snapshot grouped by domain, and the most
// recent completed session's analytics (for the dashboard).
export async function GET(req) {
  const studentId = req.nextUrl.searchParams.get('studentId') || 'demo-student';
  await ensureStudent(studentId);
  const recommendation = await refreshRecommendation(studentId);
  const profiles = await getProfiles(studentId);
  const masteryOf = (id) => profiles.find((x) => x.skill_id === id)?.mastery_status || 'not_started';

  const chain = SKILLS.map((s) => {
    const p = profiles.find((x) => x.skill_id === s.skill_id);
    const locked = prerequisitesOf(s.skill_id).some((pre) => masteryOf(pre) !== 'mastered');
    return {
      skill_id: s.skill_id, skill_name: s.skill_name, level_tag: s.level_tag,
      domain: s.domain, domain_name: domainName(s.skill_id), example: s.example,
      mastery_status: p?.mastery_status || 'not_started', fluency_status: p?.fluency_status || 'slow',
      score: p?.score || 0, accuracy: p?.accuracy || 0,
      average_time_seconds: p?.average_time_seconds ?? null,
      median_first_try_seconds: p?.median_first_try_seconds ?? null,
      best_streak: p?.best_streak || 0, last_practiced_at: p?.last_practiced_at || null, locked,
    };
  });

  const domains = Object.entries(DOMAINS).map(([key, name]) => ({ key, name, skills: chain.filter((c) => c.domain === key) }));

  // Most recent completed session analytics + a confidence trend (last ~14 sessions).
  let last_session = null;
  let confidence_trend = [];
  try {
    const { sessions } = await collections();
    const rows = await (await sessions.find({ student_id: studentId })).toArray();
    const done = rows.filter((r) => r.ended_at && r.analytics).sort((a, b) => (a.ended_at < b.ended_at ? -1 : 1));
    if (done.length) last_session = { skill_id: done[done.length - 1].skill_id, ...done[done.length - 1].analytics };
    confidence_trend = done.slice(-14).map((r) => (r.analytics.confidence ?? r.analytics.accuracy ?? 0));
  } catch { /* best-effort */ }

  return NextResponse.json({ recommendation, chain, domains, last_session, confidence_trend });
}
