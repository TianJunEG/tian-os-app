import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileSearch, ShieldAlert } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { Badge, Card, ErrorState, PageHeader, Spinner } from '../../components/ui';

function toneForRisk(risk) {
  if (risk === 'High') return 'error';
  if (risk === 'Medium') return 'yellow';
  return 'success';
}

function Metric({ icon: Icon, label, value, tone = 'navy' }) {
  const classes = {
    navy: 'bg-navy-50 text-navy-700',
    success: 'bg-emerald-50 text-emerald-700',
    yellow: 'bg-amber-50 text-amber-700',
    error: 'bg-rose-50 text-rose-700',
  }[tone] || 'bg-navy-50 text-navy-700';
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${classes}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="font-mono text-2xl font-semibold text-ink-900">{value || 0}</p>
          <p className="text-sm font-semibold text-ink-500">{label}</p>
        </div>
      </div>
    </Card>
  );
}

function IssueRows({ rows = [] }) {
  if (!rows.length) return <p className="text-sm text-ink-500">No rows in this category.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.08em] text-ink-500">
          <tr>
            <th className="pb-2 pr-4">Question</th>
            <th className="pb-2 pr-4">Skill</th>
            <th className="pb-2 pr-4">Risk</th>
            <th className="pb-2 pr-4">Issue</th>
            <th className="pb-2">Text sample</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 30).map((row) => (
            <tr key={`${row.sourceType}-${row.questionId}`} className="border-t border-hairline">
              <td className="py-3 pr-4 font-mono text-xs text-ink-600">{row.questionId}</td>
              <td className="py-3 pr-4 font-semibold text-ink-800">{row.skillId || 'Unmapped'}</td>
              <td className="py-3 pr-4"><Badge tone={toneForRisk(row.risk)}>{row.risk}</Badge></td>
              <td className="py-3 pr-4 text-ink-700">{(row.issues || []).map((issue) => issue.code).join(', ') || row.classification}</td>
              <td className="max-w-xl py-3 text-ink-600">{row.textSample}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CanonicalRows({ rows = [] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {rows.map((row) => (
        <Card key={row.skillId} className="p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="font-semibold text-ink-900">{row.skillId} · {row.topic}</p>
            <Badge tone="outline">{(row.levelBand || []).join('/') || 'Level'}</Badge>
          </div>
          <p className="text-sm text-ink-600">{row.canonicalMeaning}</p>
          <p className="mt-2 text-xs text-ink-500">Types: {(row.expectedQuestionTypes || []).join(', ')}</p>
        </Card>
      ))}
    </div>
  );
}

export default function FractionsSkillIntegrityPage() {
  const [state, setState] = useState({ loading: true, error: '', data: null });

  useEffect(() => {
    let active = true;
    adminAPI.getFractionsSkillIntegrity()
      .then((res) => {
        if (active) setState({ loading: false, error: '', data: res.data });
      })
      .catch((err) => {
        if (active) setState({ loading: false, error: err?.response?.data?.error || 'Could not load Fractions skill integrity report.', data: null });
      });
    return () => { active = false; };
  }, []);

  if (state.loading) return <Spinner label="Loading Fractions skill integrity..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={() => window.location.reload()} />;

  const data = state.data || {};
  return (
    <main className="mx-auto max-w-7xl pb-8">
      <PageHeader
        title="Fractions Skill Integrity"
        subtitle="Internal QA: checks whether question families genuinely match the canonical F001-F026 skill map."
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={FileSearch} label="Audited Questions" value={data.auditedQuestions} />
        <Metric icon={ShieldAlert} label="Incorrect Mapping" value={data.byClassification?.['Incorrect Mapping']} tone="error" />
        <Metric icon={AlertTriangle} label="Questionable Mapping" value={data.byClassification?.['Questionable Mapping']} tone="yellow" />
        <Metric icon={CheckCircle2} label="Correct Mapping" value={data.byClassification?.['Correct Mapping']} tone="success" />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold text-ink-900">Pilot Blockers</h2>
          <div className="mt-4"><IssueRows rows={data.pilotBlockers || []} /></div>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold text-ink-900">High Priority Drift</h2>
          <div className="mt-4"><IssueRows rows={data.highPriority || []} /></div>
        </Card>
      </section>

      <section className="mt-5">
        <Card className="p-5">
          <h2 className="font-semibold text-ink-900">Medium Priority Review</h2>
          <div className="mt-4"><IssueRows rows={data.mediumPriority || []} /></div>
        </Card>
      </section>

      <section className="mt-5">
        <h2 className="mb-3 font-semibold text-ink-900">Canonical Reference</h2>
        <CanonicalRows rows={data.canonicalReference || []} />
      </section>
    </main>
  );
}
