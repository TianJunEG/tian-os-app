import React, { useEffect, useState } from 'react';
import { BookOpenCheck, Eye, FileWarning, RefreshCw } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { Badge, Card, ErrorState, PageHeader, Spinner } from '../../components/ui';

function number(value) {
  const n = Number(value || 0);
  return new Intl.NumberFormat().format(Number.isFinite(n) ? n : 0);
}

function MetricCard({ icon: Icon, label, value, tone = 'navy', suffix = '' }) {
  const toneClass = {
    navy: 'bg-emerald-tint text-emerald-deep',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-danger-tint text-danger-deep',
  }[tone] || 'bg-emerald-tint text-emerald-deep';
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="font-mono text-2xl font-semibold text-ink-900 tabular-nums">{number(value)}{suffix}</p>
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

function Empty({ children = 'No gaps found.' }) {
  return <p className="text-sm text-ink-500">{children}</p>;
}

function AssetMatrix({ rows = [] }) {
  if (!rows.length) return <Empty>No misconception asset rows available.</Empty>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.08em] text-ink-500">
          <tr>
            <th className="pb-2 pr-4">Misconception</th>
            <th className="pb-2 pr-4">Worked Example</th>
            <th className="pb-2 pr-4">Visual</th>
            <th className="pb-2 pr-4">Guided</th>
            <th className="pb-2 pr-4">Independent</th>
            <th className="pb-2">Recheck</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 30).map((row) => (
            <tr key={row.misconceptionId} className="border-t border-line-soft">
              <td className="py-3 pr-4 font-semibold text-ink-800">{row.title}</td>
              <td className="py-3 pr-4"><Badge tone={row.workedExampleExists ? 'green' : 'error'}>{row.workedExampleExists ? 'yes' : 'missing'}</Badge></td>
              <td className="py-3 pr-4"><Badge tone={row.visualExplanationExists ? 'green' : 'error'}>{row.visualModelType || 'missing'}</Badge></td>
              <td className="py-3 pr-4"><Badge tone={row.guidedPracticeExists ? 'green' : 'error'}>{row.guidedPracticeExists ? 'yes' : 'missing'}</Badge></td>
              <td className="py-3 pr-4"><Badge tone={row.independentPracticeExists ? 'green' : 'error'}>{row.independentPracticeExists ? 'yes' : 'missing'}</Badge></td>
              <td className="py-3"><Badge tone={row.recheckExists ? 'green' : 'error'}>{row.recheckExists ? 'yes' : 'missing'}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GapRows({ rows = [], empty }) {
  if (!rows.length) return <Empty>{empty}</Empty>;
  return (
    <div className="space-y-3">
      {rows.slice(0, 12).map((row) => (
        <div key={row.misconceptionId || row.assignmentId} className="rounded-2xl border border-line-soft p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="yellow">{row.misconceptionId || row.assignmentId}</Badge>
            {row.status ? <Badge tone="navy">{row.status}</Badge> : null}
          </div>
          <p className="mt-2 text-sm font-semibold text-ink-800">{row.title || row.diagnosticSessionId || 'Review required'}</p>
          <p className="mt-1 text-sm text-ink-500">{(row.missing || row.missingSkillIds || row.missingMisconceptions || []).join(', ') || 'Needs asset review.'}</p>
        </div>
      ))}
    </div>
  );
}

export default function RecoveryPackAssetsPage() {
  const [state, setState] = useState({ loading: true, error: '', data: null });

  useEffect(() => {
    let active = true;
    adminAPI.getRecoveryPackAssets({ domainId: 'fractions' })
      .then((res) => {
        if (active) setState({ loading: false, error: '', data: res.data });
      })
      .catch((err) => {
        if (active) setState({ loading: false, error: err?.response?.data?.error || 'Could not load Recovery Pack assets.', data: null });
      });
    return () => { active = false; };
  }, []);

  if (state.loading) return <Spinner label="Loading Recovery Pack assets..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={() => window.location.reload()} />;

  const data = state.data || {};

  return (
    <main className="mx-auto max-w-7xl pb-8">
      <PageHeader
        title="Recovery Pack Assets"
        subtitle="Internal coverage report for misconception intervention assets: worked examples, visual explanations, guided practice, independent practice, and recheck support."
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={BookOpenCheck} label="Asset Coverage" value={data.assetCoveragePercent} suffix="%" tone={data.assetCoveragePercent >= 90 ? 'green' : 'amber'} />
        <MetricCard icon={Eye} label="Ready Misconceptions" value={data.readyCount} />
        <MetricCard icon={FileWarning} label="Missing Assets" value={(data.missingAssets || []).length} tone={(data.missingAssets || []).length ? 'rose' : 'green'} />
        <MetricCard icon={RefreshCw} label="Recheck Mismatches" value={(data.recheckMismatches || []).length} tone={(data.recheckMismatches || []).length ? 'amber' : 'green'} />
      </section>

      <section className="mt-5">
        <Section title="Recovery Pack Asset Matrix">
          <AssetMatrix rows={data.recoveryPackAssetMatrix || []} />
        </Section>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <Section title="Missing Worked Examples">
          <GapRows rows={data.missingWorkedExamples || []} empty="Every mapped misconception has a worked example." />
        </Section>
        <Section title="Missing Visual Explanations">
          <GapRows rows={data.missingVisualExplanations || []} empty="Every mapped misconception has a visual explanation." />
        </Section>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <Section title="Missing Rechecks">
          <GapRows rows={data.missingRechecks || []} empty="Every mapped misconception has a recheck reference." />
        </Section>
        <Section title="Recheck Target Mismatches">
          <GapRows rows={data.recheckMismatches || []} empty="No recheck target mismatches found." />
        </Section>
      </section>
    </main>
  );
}
