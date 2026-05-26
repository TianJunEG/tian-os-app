import { NextResponse } from 'next/server';
import { ensureStudent } from '@/lib/student.js';
import { refreshRecommendation } from '@/lib/recommend.js';
import { buildSession } from '@/lib/questions.js';
import { getSkill, domainName, QUESTIONS_PER_SESSION } from '@/lib/graph.js';
import { collections } from '@/lib/db.js';

// POST /api/session/start { studentId, skillId? }
// Picks the recommended skill (or an explicit one), generates a session, and returns fully
// renderable items (type, LaTeX/text prompt, visual, choices, answer, params).
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const studentId = body.studentId || 'demo-student';
  await ensureStudent(studentId);

  const rec = await refreshRecommendation(studentId);
  const skillId = body.skillId || rec.recommended_skill_id;
  const skill = getSkill(skillId);
  if (!skill) return NextResponse.json({ error: 'unknown skill' }, { status: 400 });

  const items = buildSession(skill, QUESTIONS_PER_SESSION);
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const { sessions } = await collections();
  await sessions.insertOne({
    _id: sessionId, student_id: studentId, skill_id: skillId, mode: rec.mode || 'practice',
    started_at: new Date().toISOString(), ended_at: null, item_count: items.length, correct_count: 0, items: [],
  });

  return NextResponse.json({
    session_id: sessionId,
    recommendation: rec,
    skill: {
      skill_id: skill.skill_id, skill_name: skill.skill_name, level_tag: skill.level_tag,
      domain: domainName(skill.skill_id), expected_time_seconds: skill.expected_time_seconds,
    },
    items: items.map((q) => ({
      question_id: q.question_id, skill_id: q.skill_id, question_type: q.question_type,
      prompt_latex: q.prompt_latex || null, prompt_text: q.prompt_text || null,
      visual: q.visual || null, choices: q.choices || null,
      params: q.params, answer: q.answer, expected_time_seconds: q.expected_time_seconds,
    })),
  });
}
