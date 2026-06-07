import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, GitBranch, TrendingDown } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { Badge, Card, ErrorState, PageHeader, Spinner } from '../../components/ui';

function number(value) {
  const n = Number(value || 0);
  return new Intl.NumberFormat().format(Number.isFinite(n) ? n : 0);
}

function MetricCard({ icon: Icon, label, value, tone = 'navy' }) {
  const toneClass = {
    navy: 'bg-navy-50 text-navy-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
  }[tone] || 'bg-navy-50 text-navy-700';
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="font-mono text-2xl font-semibold text-ink-900 tabular-nums">{number(value)}</p>
          <p className="mt-1 text-sm font-semibold text-ink-500">{label}</p>
        </div>
      </div>
    </Card>
  );
}

function Section({ title, children }) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold text-ink-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function Empty({ children = 'No rows available.' }) {
  return <p className="text-sm text-ink-500">{children}</p>;
}

function ReadinessTable({ rows = [] }) {
  if (!rows.length) return <Empty>No learning path readiness rows available.</Empty>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.08em] text-ink-500">
          <tr>
            <th className="pb-2 pr-4">Skill</th>
            <th className="pb-2 pr-4">Path</th>
            <th className="pb-2 pr-4">Stages</th>
            <th className="pb-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 26).map((row) => (
            <tr key={row.skillId} className="border-t border-hairline">
              <td className="py-3 pr-4 font-semibold text-ink-800">{row.skillId} · {row.skillName}</td>
              <td className="py-3 pr-4 text-ink-600">{row.learningPathId}</td>
              <td className="py-3 pr-4">{row.stageCount}</td>
              <td className="py-3">
                <Badge tone={row.readinessStatus === 'ready' ? 'green' : 'yellow'}>
                  {row.readinessStatus}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GapList({ rows = [], empty }) {
  if (!rows.length) return <Empty>{empty}</Empty>;
  return (
    <div className="space-y-3">
      {rows.slice(0, 12).map((row, index) => (
        <div key={`${row.learningPathId || row.misconceptionId || row.stageId || row.skillId}-${index}`} className="rounded-2xl border border-hairline p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="yellow">{row.skillId || row.stageId || row.learningPathId || 'Review'}</Badge>
            {row.misconceptionId ? <Badge tone="navy">{row.misconceptionId}</Badge> : null}
          </div>
          <p className="mt-2 text-sm font-semibold text-ink-800">{row.skillName || row.title || row.misconceptionName || 'Learning path review needed'}</p>
          <p className="mt-1 text-sm text-ink-500">{(row.missing || row.missingCriteria || []).join(', ') || 'Review criteria and stage progression.'}</p>
        </div>
      ))}
    </div>
  );
}

export default function LearningPathQualityPage() {
  const [state, setState] = useState({ loading: true, error: '', data: null });

  useEffect(() => {
    let active = true;
    adminAPI.getLearningPathQuality({ domainId: 'fractions' })
      .then((res) => {
        if (active) setState({ loading: false, error: '', data: res.data });
      })
      .catch((err) => {
        if (active) setState({ loading: false, error: err?.response?.data?.error || 'Could not load learning path quality.', data: null });
      });
    return () => { active = false; };
  }, []);

  if (state.loading) return <Spinner label="Loading learning path quality..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={() => window.location.reload()} />;

  const data = state.data || {};
  const readiness = data.readinessMatrix || {};
  const analytics = data.assignmentStageAnalytics || {};

  return (
    <main className="mx-auto max-w-7xl pb-8">
      <PageHeader
        title="Learning Path Quality"
        subtitle="Internal audit of whether Recovery Packs form a structured remediation journey before recheck."
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={GitBranch} label="Persisted Paths" value={data.pathCount} />
        <MetricCard icon={CheckCircle2} label="Ready Skill Paths" value={readiness.readyCount} tone="green" />
        <MetricCard icon={AlertTriangle} label="Missing Persisted Paths" value={(data.misconceptionsWithoutLearningPaths || []).length} tone={(data.misconceptionsWithoutLearningPaths || []).length ? 'amber' : 'green'} />
        <MetricCard icon={TrendingDown} label="High Drop-off Stages" value={(data.highDropOffStages || []).length} tone={(data.highDropOffStages || []).length ? 'rose' : 'green'} />
      </section>

      <section className="mt-5">
        <Section title="Recovery Path Readiness Matrix">
          <ReadinessTable rows={readiness.rows || []} />
        </Section>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <Section title="Misconceptions Without Persisted Paths">
          <GapList rows={data.misconceptionsWithoutLearningPaths || []} empty="No missing persisted paths detected." />
        </Section>
        <Section title="Incomplete Learning Paths">
          <GapList rows={data.incompleteLearningPaths || []} empty="No incomplete learning paths detected." />
        </Section>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <Section title="Weak Mastery Criteria">
          <GapList rows={data.weakMasteryCriteria || []} empty="No weak mastery criteria detected." />
        </Section>
        <Section title="Stage Drop-off">
          <GapList rows={analytics.highDropOffStages || data.highDropOffStages || []} empty="No stage drop-off evidence yet." />
        </Section>
      </section>
    </main>
  );
}
