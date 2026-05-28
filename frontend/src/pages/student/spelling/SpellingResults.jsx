import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Wrench } from 'lucide-react';
import { spellingPracticeAPI } from '../../../services/api';
import { Card, Button, ProgressBar, PageHeader, Spinner, EmptyState } from '../../../components/ui';

export default function SpellingResults() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  useEffect(() => { spellingPracticeAPI.getSession(sessionId).then((r) => setData(r.data)).catch(() => setData(null)); }, [sessionId]);

  if (!data) return <Spinner label="Scoring…" />;
  const { stats, missed } = data;

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Spelling complete" subtitle={data.listTitle} />
      <Card className="mb-5 p-6 text-center">
        <div className="font-mono text-5xl font-semibold tabular-nums text-navy-700">{stats.accuracy}%</div>
        <p className="mt-1 text-sm text-ink-500">{stats.correct} of {stats.total} correct</p>
        <ProgressBar value={stats.correct} max={Math.max(stats.total, 1)} className="mt-4" />
      </Card>

      {missed.length > 0 ? (
        <Card className="mb-5 p-5">
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Words missed ({missed.length})</h3>
          <ul className="space-y-2">
            {missed.map((m, i) => (
              <li key={i} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-error-700 line-through">{m.yourAnswer || '(blank)'}</span>
                <span className="font-semibold text-success-700">{m.correct}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <EmptyState message="No words missed — excellent spelling!" />
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {missed.length > 0 && <Button variant="secondary" icon={Wrench} onClick={() => navigate('/student/spelling/mistakes')} className="flex-1">Practise missed words</Button>}
        <Button icon={ArrowRight} onClick={() => navigate('/student/spelling')} className="flex-1">Back to spelling</Button>
      </div>
    </div>
  );
}
