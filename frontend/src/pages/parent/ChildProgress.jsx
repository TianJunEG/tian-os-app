import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { mathpathAPI } from '../../services/api';
import { useChild } from './useChild';
import ChildNav from './ChildNav';
import { Card, Button, StatTile, ProgressBar, StatusBadge, Spinner } from '../../components/ui';

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

  const records = mastery?.records || [];
  const mastered = records.filter((r) => r.status === 'mastered').length;
  const learning = records.filter((r) => r.status === 'learning').length;
  const overall = records.length ? Math.round(records.reduce((s, r) => s + r.score, 0) / records.length) : 0;

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
              <Card key={t.topicId} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink-700">{t.name}</p>
                  <ProgressBar value={t.masteredCount} max={Math.max(t.total, 1)} className="mt-2" />
                </div>
                <span className="font-mono text-sm tabular-nums text-ink-500">{t.masteredCount}/{t.total}</span>
              </Card>
            ))}
          </div>

          <Button to={`/parent/children/${studentId}/weak-topics`} icon={ArrowRight}>View weak topics</Button>
        </>
      )}
    </>
  );
}
