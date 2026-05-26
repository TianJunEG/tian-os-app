import { NextResponse } from 'next/server';
import { buildRemediation } from '@/lib/remediation.js';
import { getProfiles, weakestPrerequisite } from '@/lib/mastery.js';
import { collections } from '@/lib/db.js';

// POST /api/attempt { studentId, skill_id, params, given }
// Graph-aware remediation: diagnose → message → worked example → guided "now you try". For a
// concept-skill miss with a weak prerequisite, the guided item is drawn from that prerequisite.
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { studentId = 'demo-student', skill_id, params, given } = body;
  if (!skill_id || !params) {
    return NextResponse.json({ error: 'skill_id and params required' }, { status: 400 });
  }

  const profiles = await getProfiles(studentId);
  const routeTo = weakestPrerequisite(skill_id, profiles);
  const remediation = await buildRemediation(skill_id, params, given, routeTo);

  try {
    const { misconceptions } = await collections();
    await misconceptions.insertOne({
      doc_type: 'observation', tag: remediation.misconception.tag,
      student_id: studentId, skill_id, routed_to: remediation.route_to || null,
      given_answer: String(given), observed_at: new Date().toISOString(),
    });
  } catch { /* best-effort */ }

  return NextResponse.json({ remediation });
}
