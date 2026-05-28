import React, { useEffect, useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { skillsAPI } from '../services/api';
import { Card, StatTile, ProgressBar, Badge } from './ui';

// Read-only Science mastery summary for one student. Adult-role panels
// (Tutor / Teacher student detail screens) drop this in alongside their
// existing cards so they can see where a child stands on Science Adaptive
// Revision at a glance, without leaving the page they're already on.
//
// Self-contained on purpose: computes overall/mastered/learning inline so it
// can sit in components/ without pulling helpers from pages/parent/.
function summarise(skills) {
  const attempted = skills.filter((s) => s.status && s.status !== 'not_started');
  const mastered = skills.filter((s) => s.status === 'mastered').length;
  const learning = skills.filter((s) => s.status === 'learning' || s.status === 'needs_review').length;
  const overall = attempted.length
    ? Math.round(attempted.reduce((sum, s) => sum + (s.score || 0), 0) / attempted.length)
    : 0;
  return { overall, mastered, learning, attempted: attempted.length };
}

const TONE = { needs_review: 'error', learning: 'gold', mastered: 'success', not_started: 'neutral' };

export default function StudentSciencePanel({ studentId }) {
  const [skills, setSkills] = useState(null);

  useEffect(() => {
    if (!studentId) return;
    let alive = true;
    skillsAPI.list({ subject: 'science', studentId })
      .then((r) => { if (alive) setSkills(r.data.skills || []); })
      .catch(() => { if (alive) setSkills([]); });
    return () => { alive = false; };
  }, [studentId]);

  if (!skills) return null; // first paint — let the parent page render its own spinner

  if (skills.length === 0) {
    return (
      <Card className="mt-5 p-5">
        <div className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">
          <FlaskConical className="h-3.5 w-3.5" /> Science · Adaptive Revision
        </div>
        <p className="text-sm text-ink-500">No Science activity yet for this student.</p>
      </Card>
    );
  }

  const { overall, mastered, learning, attempted } = summarise(skills);
  const weak = [...skills]
    .filter((s) => s.status === 'needs_review' || s.status === 'learning')
    .sort((a, b) => (a.score || 0) - (b.score || 0))
    .slice(0, 3);

  return (
    <Card className="mt-5 p-5">
      <div className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">
        <FlaskConical className="h-3.5 w-3.5" /> Science · Adaptive Revision
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <StatTile label="Overall mastery" value={overall} suffix="%" />
        <StatTile label="Mastered" value={mastered} />
        <StatTile label="Learning" value={learning} />
      </div>
      <ProgressBar value={overall} className="mt-3" />
      {attempted === 0 ? (
        <p className="mt-3 text-sm text-ink-500">No Science skills attempted yet.</p>
      ) : weak.length > 0 ? (
        <div className="mt-4">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">Weakest Science topics</div>
          <ul className="space-y-1.5">
            {weak.map((s) => (
              <li key={s.skillId} className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate text-ink-700">{s.topicName} <span className="text-ink-400">· {s.moeLevel}</span></span>
                <Badge tone={TONE[s.status] || 'neutral'}>{s.statusLabel || s.status}</Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
