import { NextResponse } from 'next/server';
import { buildRemediation } from '@/lib/remediation.js';
import { collections } from '@/lib/db.js';

// POST /api/attempt { studentId, skill_id, params, given }
// Stateless remediation for a wrong answer: diagnose → message → worked example → guided sibling.
// Logs a misconception observation (best-effort).
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { studentId = 'demo-student', skill_id, params, given } = body;
  if (!skill_id || !params) {
    return NextResponse.json({ error: 'skill_id and params required' }, { status: 400 });
  }

  const remediation = await buildRemediation(skill_id, params, given);

  try {
    const { misconceptions } = await collections();
    await misconceptions.insertOne({
      doc_type: 'observation', tag: remediation.misconception.tag,
      student_id: studentId, skill_id, given_answer: String(given),
      observed_at: new Date().toISOString(),
    });
  } catch { /* best-effort */ }

  return NextResponse.json({ remediation });
}
