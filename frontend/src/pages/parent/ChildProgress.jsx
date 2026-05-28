import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { mathpathAPI } from '../../services/api';
import { useChild } from './useChild';
import ChildNav from './ChildNav';
import { Card, Button, StatTile, ProgressBar, Spinner } from '../../components/ui';
import { summariseMastery, statusTone } from './masterySummary';

// Math-first progress overview for one child.
export default function ChildProgress() {
  const { studentId } = useParams();
  const child = useChild(studentId);
  const [mastery, setMastery] = useState(null);
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    mathpathAPI.mastery({ studentId }).then((r) => setMastery(r.data)).catch(() => {});
    mathpathAPI.map({ studentId }).then((r) => setTopics(r.data.topics || [])).catch(() => {});
  }, [studentId]);

  const { mastered, learning, overall } = summariseMastery(mastery?.records || []);

  return (
    <>
      <ChildNav studentId={studentId} name={child?.name || 'Child'} level={child?.level} />
      {!mastery ? <Spinner label="Loading…" /> : (
        <>
          <Card className="mb-6 p-5">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">Maths · MathPath</div>
            <div className="mt-2 flex items-center gap-6">
              <StatTile label="Overall mastery" value={overall} suffix="%" />
              <StatTile label="Mastered" value={mastered} />
              <StatTile label="Learning" value={learning} />
            </div>
            <ProgressBar value={overall} className="mt-4" />
          </Card>

          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">By topic</h3>
          <div className="mb-6 space-y-3">
            {topics.map((t) => (
              <Card key={t.topicId} className="p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-medium text-ink-700">{t.name}</p>
                  <span className="font-mono text-xs tabular-nums text-ink-500">{t.masteredCount}/{t.total} mastered</span>
                </div>
                {/* One tile per skill, coloured by status. A flat 0/N progress bar
                    would read "no progress" for a topic full of in-flight skills;
                    this shows what's been started, what's stuck, what's mastered. */}
                <div className="mt-2 flex gap-0.5" aria-label={`Skill mastery for ${t.name}`}>
                  {(t.skills || []).map((s, i) => (
                    <span
                      key={s.skillId || i}
                      className={`h-2 flex-1 rounded ${statusTone(s.status)}`}
                      title={`${s.name} — ${s.statusLabel || s.status}`}
                    />
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <Button to={`/parent/children/${studentId}/weak-topics`} icon={ArrowRight}>View weak topics</Button>
        </>
      )}
    </>
  );
}
