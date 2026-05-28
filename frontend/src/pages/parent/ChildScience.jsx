import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FlaskConical } from 'lucide-react';
import { skillsAPI, mathpathAPI } from '../../services/api';
import { useChild } from './useChild';
import ChildNav from './ChildNav';
import { Card, StatTile, ProgressBar, Badge, Spinner, EmptyState } from '../../components/ui';

const TONE = { mastered: 'success', learning: 'gold', needs_review: 'error', not_started: 'neutral' };

// Parent view of a child's Science Adaptive Revision: mastery by topic + recent
// mistakes (read-only — Science has no parent assign flow yet).
export default function ChildScience() {
  const { studentId } = useParams();
  const child = useChild(studentId);
  const [skills, setSkills] = useState(null);
  const [mistakes, setMistakes] = useState(null);

  useEffect(() => {
    skillsAPI.list({ subject: 'science', studentId }).then((r) => setSkills(r.data.skills || [])).catch(() => setSkills([]));
    mathpathAPI.mistakes({ studentId, module: 'Science Adaptive Revision' }).then((r) => setMistakes(r.data.mistakes || [])).catch(() => setMistakes([]));
  }, [studentId]);

  // Group skills by topic for the standing list.
  const byTopic = {};
  for (const s of skills || []) (byTopic[s.topicName] ||= []).push(s);
  const attempted = (skills || []).filter((s) => s.status !== 'not_started');
  const overall = attempted.length ? Math.round(attempted.reduce((a, s) => a + (s.score || 0), 0) / attempted.length) : 0;
  const mastered = (skills || []).filter((s) => s.status === 'mastered').length;
  const learning = (skills || []).filter((s) => s.status === 'learning' || s.status === 'needs_review').length;

  return (
    <>
      <ChildNav studentId={studentId} name={child?.name || 'Child'} level={child?.level} />
      {!skills || !mistakes ? <Spinner label="Loading…" /> : skills.length === 0 ? (
        <EmptyState icon={FlaskConical} message="No Science activity yet for this child." />
      ) : (
        <>
          <Card className="mb-6 p-5">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">Science · Adaptive Revision</div>
            <div className="mt-2 flex items-center gap-6">
              <StatTile label="Overall mastery" value={overall} suffix="%" />
              <StatTile label="Mastered" value={mastered} />
              <StatTile label="Practising" value={learning} />
            </div>
            <ProgressBar value={overall} className="mt-4" />
          </Card>

          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">By topic</h3>
          <div className="mb-6 space-y-3">
            {Object.entries(byTopic).map(([topic, ts]) => {
              const done = ts.filter((s) => s.status === 'mastered').length;
              return (
                <Card key={topic} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink-700">{topic}</p>
                    <ProgressBar value={done} max={Math.max(ts.length, 1)} className="mt-2" />
                  </div>
                  <span className="shrink-0 font-mono text-sm tabular-nums text-ink-500">{done}/{ts.length}</span>
                </Card>
              );
            })}
          </div>

          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Recent mistakes</h3>
          {mistakes.length === 0 ? (
            <Card className="p-4 text-sm text-ink-500">No recent Science mistakes.</Card>
          ) : (
            <div className="space-y-3">
              {mistakes.map((m) => (
                <Card key={m.id} className="p-5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink-700">{m.skillName}</span>
                    {m.topicName && <Badge tone="neutral">{m.topicName}</Badge>}
                  </div>
                  <div className="text-ink-900">{m.questionStem}</div>
                  <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-xl bg-error-100 p-3">
                      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-error-700">Answered</div>
                      <div className="text-ink-900">{m.studentAnswer || '—'}</div>
                    </div>
                    {m.correctAnswer && (
                      <div className="rounded-xl bg-success-100 p-3">
                        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-success-700">Model answer</div>
                        <div className="text-ink-900">{m.correctAnswer}</div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
