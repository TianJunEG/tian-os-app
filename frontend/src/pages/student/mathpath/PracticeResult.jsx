import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Wrench } from 'lucide-react';
import { mathpathAPI } from '../../../services/api';
import { Card, Button, Badge, StatTile, ProgressBar, PageHeader, Spinner, EmptyState } from '../../../components/ui';
import { MathText } from '../../../components/ui/Fraction';

// End-of-session summary: score, skills practised, mistakes, recommended next.
export default function PracticeResult() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [recommended, setRecommended] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, m] = await Promise.all([mathpathAPI.getSession(sessionId), mathpathAPI.mastery()]);
        setData(s.data);
        setRecommended(m.data.recommended);
      } finally { setLoading(false); }
    })();
  }, [sessionId]);

  if (loading) return <Spinner label="Scoring…" />;
  if (!data) return <EmptyState message="Could not load these results." />;

  const { stats, skills, mistakes } = data;
  // Route follow-on actions by module so a Science session returns to Science.
  const isScience = data.session?.module === 'Science Adaptive Revision';
  const homeBase = isScience ? '/student/science' : '/student/mathpath';
  const mistakesBase = isScience ? '/student/science/mistakes' : '/student/mathpath/mistakes';

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Session complete" subtitle="Nice work — here's how it went." />

      <Card className="mb-5 p-6 text-center">
        <div className="font-mono text-5xl font-semibold tabular-nums text-navy-700">{stats.accuracy}%</div>
        <p className="mt-1 text-sm text-ink-500">{stats.correct} of {stats.total} correct</p>
        <ProgressBar value={stats.correct} max={Math.max(stats.total, 1)} className="mt-4" />
      </Card>

      <Card className="mb-5 p-5">
        <div className="flex items-center gap-6">
          <StatTile label="Correct" value={stats.correct} />
          <StatTile label="To review" value={stats.incorrect} />
          <StatTile label="Avg time" value={stats.avgTimeMs ? Math.round(stats.avgTimeMs / 1000) : '—'} suffix={stats.avgTimeMs ? 's' : ''} />
        </div>
      </Card>

      <div className="mb-5">
        <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Skills practised</h3>
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => <Badge key={s.id} tone="navy">{s.name}</Badge>)}
        </div>
      </div>

      {mistakes.length > 0 && (
        <Card className="mb-5 p-5">
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Mistakes to review ({mistakes.length})</h3>
          <ul className="space-y-3">
            {mistakes.map((m) => (
              <li key={m.id} className="text-sm">
                <div className="text-ink-700"><MathText text={m.stem} /></div>
                <div className="mt-0.5 text-ink-500">You: <MathText text={m.yourAnswer} className="font-mono" /> · Answer: <MathText text={m.correctAnswer} className="font-mono text-success-700" /></div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {recommended && (
        <Card className="mb-5 border-l-4 border-l-gold-400 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gold-700">Recommended next</div>
          <p className="mt-0.5 text-sm text-ink-700">{recommended.skillName} <span className="text-ink-500">· {recommended.topicName}</span></p>
        </Card>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {mistakes.length > 0 && (
          <Button variant="secondary" icon={Wrench} onClick={() => navigate(mistakesBase)} className="flex-1">Review mistakes</Button>
        )}
        <Button icon={ArrowRight} onClick={() => navigate(homeBase)} className="flex-1">{isScience ? 'Continue Science Revision' : 'Continue MathPath'}</Button>
      </div>
    </div>
  );
}
