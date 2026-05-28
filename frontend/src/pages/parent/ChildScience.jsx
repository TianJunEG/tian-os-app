import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FlaskConical } from 'lucide-react';
import { skillsAPI, mathpathAPI } from '../../services/api';
import { useChild } from './useChild';
import ChildNav from './ChildNav';
import { Card, StatTile, ProgressBar, Spinner, EmptyState } from '../../components/ui';
import { summariseMastery, statusTone } from './masterySummary';
import MistakeCard from './MistakeCard';

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
  const { mastered, learning, overall } = summariseMastery(skills || []);

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
              <StatTile label="Learning" value={learning} />
            </div>
            <ProgressBar value={overall} className="mt-4" />
          </Card>

          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">By topic</h3>
          <div className="mb-6 space-y-3">
            {Object.entries(byTopic).map(([topic, ts]) => {
              const done = ts.filter((s) => s.status === 'mastered').length;
              return (
                <Card key={topic} className="p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate font-medium text-ink-700">{topic}</p>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-ink-500">{done}/{ts.length} mastered</span>
                  </div>
                  <div className="mt-2 flex gap-0.5" aria-label={`Skill mastery for ${topic}`}>
                    {ts.map((s, i) => (
                      <span
                        key={s.skillId || i}
                        className={`h-2 flex-1 rounded ${statusTone(s.status)}`}
                        title={`${s.name} — ${s.statusLabel || s.status}`}
                      />
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>

          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Recent mistakes</h3>
          {mistakes.length === 0 ? (
            <Card className="p-4 text-sm text-ink-500">No recent Science mistakes.</Card>
          ) : (
            <div className="space-y-3">
              {mistakes.map((m) => <MistakeCard key={m.id} mistake={m} />)}
            </div>
          )}
        </>
      )}
    </>
  );
}
