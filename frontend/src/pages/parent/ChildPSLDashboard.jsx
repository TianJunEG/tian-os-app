import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Brain, Calendar, Target, TrendingUp, Trophy } from 'lucide-react';
import { pslAPI } from '../../services/api';
import { useChild } from './useChild';
import ChildNav from './ChildNav';
import { Badge, Card, EmptyState, ErrorState, PageHeader, Spinner } from '../../components/ui';

function scoreTone(pct) {
  if (pct >= 70) return 'navy';
  if (pct >= 50) return 'gold';
  return 'error';
}

function OverviewCards({ data }) {
  const items = [
    { label: 'Sessions', value: data.totalSessions, icon: Target },
    { label: 'Skills Tried', value: data.skillsAttempted, icon: TrendingUp },
    { label: 'Mastered', value: data.skillsMastered, icon: Trophy },
    { label: 'Accuracy', value: `${data.averageAccuracy}%`, icon: Brain },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((it) => (
        <Card key={it.label} className="p-4">
          <div className="flex items-center gap-2 text-ink-500">
            <it.icon className="h-4 w-4" />
            <span className="text-xs font-medium">{it.label}</span>
          </div>
          <p className="mt-1 font-mono text-xl sm:text-2xl text-emerald-deep">{it.value}</p>
        </Card>
      ))}
    </div>
  );
}

function StepPerformanceCard({ rows }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Step-by-Step Accuracy</h3>
      <p className="mt-1 text-xs text-ink-500">How well your child handles each part of the problem-solving process</p>
      <div className="mt-4 space-y-3">
        {rows.map((step) => (
          <div key={step.stepId}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-700">{step.label}</span>
              <Badge tone={scoreTone(step.accuracy)}>{step.accuracy}%</Badge>
            </div>
            <div className="mt-1 h-2 w-full rounded-full bg-ink-100">
              <div
                className={`h-2 rounded-full transition-all ${step.accuracy >= 70 ? 'bg-emerald-400' : step.accuracy >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${step.accuracy}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SkillsCard({ rows }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink-700">Skills Practised</h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-ink-500">No skills attempted yet.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {rows.map((sk) => (
            <div key={sk.skillId} className="flex items-center justify-between rounded-lg border border-line-soft p-3">
              <div>
                <p className="text-sm font-medium text-ink-700">{sk.name}</p>
                <p className="text-xs text-ink-500 capitalize">{sk.heuristic.replace(/-/g, ' ')} &middot; {sk.sessions} session{sk.sessions !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                {sk.mastered && <Badge tone="navy">Mastered</Badge>}
                <Badge tone={scoreTone(sk.averageScore)}>{sk.averageScore}%</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function MisconceptionsCard({ rows }) {
  if (!rows.length) return null;
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="h-4 w-4 text-ink-500" />
        <h3 className="text-sm font-semibold text-ink-700">Areas to Watch</h3>
      </div>
      <p className="text-xs text-ink-500 mb-3">Common thinking patterns that need attention</p>
      <div className="space-y-1.5">
        {rows.map((m) => (
          <div key={m.tag} className="flex items-center justify-between rounded-lg border border-line-soft px-3 py-2">
            <p className="text-sm text-ink-700">{m.tag}</p>
            <Badge tone="neutral">{m.count}x</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RecentSessionsCard({ rows }) {
  if (!rows.length) return null;
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-4 w-4 text-ink-500" />
        <h3 className="text-sm font-semibold text-ink-700">Recent Sessions</h3>
      </div>
      <div className="space-y-2">
        {rows.map((s) => (
          <div key={s.sessionId} className="flex items-center justify-between rounded-lg border border-line-soft p-3">
            <div>
              <p className="text-sm font-medium text-ink-700">{s.skillName}</p>
              <p className="text-xs text-ink-500">
                {new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                {' '}&middot; {s.problems} problem{s.problems !== 1 ? 's' : ''}
              </p>
            </div>
            <Badge tone={scoreTone(s.score)}>{s.score}%</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function ChildPSLDashboard() {
  const { studentId } = useParams();
  const child = useChild(studentId);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    setDashboard(null);
    try {
      const res = await pslAPI.dashboard(studentId);
      setDashboard(res?.data || null);
    } catch {
      setError(true);
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  if (error) return <><ChildNav studentId={studentId} name={child?.name || 'Child'} level={child?.level} /><ErrorState message="Couldn't load Problem Solving Lab data." onRetry={load} /></>;
  if (!dashboard) return <><ChildNav studentId={studentId} name={child?.name || 'Child'} level={child?.level} /><Spinner label="Loading Problem Solving Lab..." /></>;

  const hasData = dashboard.overview.totalSessions > 0;

  return (
    <>
      <ChildNav studentId={studentId} name={child?.name || 'Child'} level={child?.level} />
      <PageHeader
        title="Problem Solving Lab"
        subtitle={`${child?.name || 'Your child'}'s word problem practice — heuristic reasoning, step-by-step.`}
      />
      <div className="space-y-4">
        <OverviewCards data={dashboard.overview} />
        {!hasData ? (
          <EmptyState message="No Problem Solving Lab sessions yet. Once your child starts practising, their progress appears here." />
        ) : (
          <>
            <StepPerformanceCard rows={dashboard.stepPerformance || []} />
            <SkillsCard rows={dashboard.skills || []} />
            <MisconceptionsCard rows={dashboard.topMisconceptions || []} />
            <RecentSessionsCard rows={dashboard.recentSessions || []} />
          </>
        )}
      </div>
    </>
  );
}
