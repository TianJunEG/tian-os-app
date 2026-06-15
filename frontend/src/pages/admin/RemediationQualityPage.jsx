import React, { useEffect, useState } from 'react';
import { AlertTriangle, ClipboardList, RefreshCw, Target } from 'lucide-react';
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

function Empty({ children = 'No rows available.' }) {
  return <p className="text-sm text-ink-500">{children}</p>;
}

function PackRows({ rows = [], empty }) {
  if (!rows.length) return <Empty>{empty}</Empty>;
  return (
    <div className="space-y-3">
      {rows.slice(0, 12).map((row, index) => (
        <div key={`${row.assignmentId || row.skillId}-${index}`} className="border-b border-line-soft pb-3 last:border-b-0 last:pb-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-ink-800">{row.assignmentId || `${row.skillId} · ${row.skillName}`}</span>
            <Badge tone={row.qualityScore >= 85 || row.recheckSuccessRate >= 70 ? 'green' : row.qualityScore < 65 || row.repeatedFailureRate ? 'error' : 'yellow'}>
              {row.qualityScore !== undefined ? `${row.qualityScore}` : `${number(row.recheckSuccessRate)}% success`}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-ink-500">
            {(row.skillIds || [row.skillId]).filter(Boolean).join(', ')}
            {row.missing?.length ? ` · Missing: ${row.missing.join(', ')}` : ''}
            {row.unresolvedMisconceptions?.length ? ` · Unresolved: ${row.unresolvedMisconceptions.join(', ')}` : ''}
          </p>
        </div>
      ))}
    </div>
  );
}

function CoverageTable({ rows = [] }) {
  if (!rows.length) return <Empty>No Recovery Pack coverage rows available.</Empty>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.08em] text-ink-500">
          <tr>
            <th className="pb-2 pr-4">Skill</th>
            <th className="pb-2 pr-4">Misconceptions</th>
            <th className="pb-2 pr-4">Guided</th>
            <th className="pb-2 pr-4">Worked Example</th>
            <th className="pb-2">Recheck</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 26).map((row) => (
            <tr key={row.skillId} className="border-t border-line-soft">
              <td className="py-3 pr-4 font-semibold text-ink-800">{row.skillId} · {row.skillName}</td>
              <td className="py-3 pr-4"><Badge tone={row.misconceptionTargetingExists ? 'green' : 'error'}>{row.misconceptionTargetingExists ? 'mapped' : 'missing'}</Badge></td>
              <td className="py-3 pr-4"><Badge tone={row.guidedQuestionsExist ? 'green' : 'yellow'}>{row.guidedQuestionsExist ? 'yes' : 'partial'}</Badge></td>
              <td className="py-3 pr-4"><Badge tone={row.workedExamplesExist ? 'green' : 'error'}>{row.workedExamplesExist ? 'yes' : 'missing'}</Badge></td>
              <td className="py-3"><Badge tone={row.recheckAlignmentExists ? 'green' : 'error'}>{row.recheckAlignmentExists ? 'aligned' : 'missing'}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GapRows({ rows = [], label = 'No gaps detected.' }) {
  if (!rows.length) return <Empty>{label}</Empty>;
  return (
    <div className="space-y-3">
      {rows.slice(0, 12).map((row, index) => (
        <div key={`${row.misconceptionId || row.assignmentId || row.skillId}-${index}`} className="rounded-2xl border border-line-soft p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="yellow">{row.misconceptionId || row.skillId || row.assignmentId}</Badge>
            {row.alignmentStatus ? <Badge tone="error">{row.alignmentStatus}</Badge> : null}
          </div>
          <p className="mt-2 text-sm font-semibold text-ink-800">{row.misconceptionName || row.skillName || row.recheckDiagnosticId || 'Review required'}</p>
          <p className="mt-1 text-sm text-ink-500">{(row.missing || row.missingStages || row.missingTargetSkills || []).join(', ') || 'Needs intervention review.'}</p>
        </div>
      ))}
    </div>
  );
}

export default function RemediationQualityPage() {
  const [state, setState] = useState({ loading: true, error: '', data: null });

  useEffect(() => {
    let active = true;
    adminAPI.getRemediationQuality({ domainId: 'fractions' })
      .then((res) => {
        if (active) setState({ loading: false, error: '', data: res.data });
      })
      .catch((err) => {
        if (active) setState({ loading: false, error: err?.response?.data?.error || 'Could not load remediation quality.', data: null });
      });
    return () => { active = false; };
  }, []);

  if (state.loading) return <Spinner label="Loading remediation quality..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={() => window.location.reload()} />;

  const data = state.data || {};
  const effectiveness = data.effectiveness || {};

  return (
    <main className="mx-auto max-w-7xl pb-8">
      <PageHeader
        title="Remediation Quality"
        subtitle="Internal audit of whether Recovery Packs target misconceptions, progress from guided learning to recheck, and produce measurable improvement."
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={ClipboardList} label="Recovery Packs" value={data.assignmentCount} />
        <MetricCard icon={Target} label="Average Quality" value={data.averageQualityScore} suffix="%" tone={data.averageQualityScore >= 75 ? 'green' : 'amber'} />
        <MetricCard icon={RefreshCw} label="Recheck Success" value={effectiveness.recheckSuccessRate} suffix="%" tone={effectiveness.recheckSuccessRate >= 70 ? 'green' : 'amber'} />
        <MetricCard icon={AlertTriangle} label="Low Quality Packs" value={(data.lowQualityRecoveryPacks || []).length} tone={(data.lowQualityRecoveryPacks || []).length ? 'rose' : 'green'} />
      </section>

      <section className="mt-5">
        <Section title="Recovery Pack Coverage Matrix">
          <CoverageTable rows={data.recoveryPackCoverageMatrix || []} />
        </Section>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <Section title="Strongest Interventions">
          <PackRows rows={effectiveness.strongestInterventions || []} empty="No strong intervention evidence yet." />
        </Section>
        <Section title="Weakest Interventions">
          <PackRows rows={effectiveness.weakestInterventions || []} empty="No weak intervention evidence yet." />
        </Section>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <Section title="Low-Quality Recovery Packs">
          <PackRows rows={data.lowQualityRecoveryPacks || []} empty="No low-quality Recovery Packs found." />
        </Section>
        <Section title="Misconceptions Without Complete Interventions">
          <GapRows rows={data.misconceptionInterventionCoverage?.missingInterventions || []} label="All mapped misconceptions have intervention plans." />
        </Section>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <Section title="Worked Example Gaps">
          <GapRows rows={data.workedExampleGaps || []} label="No worked example gaps detected." />
        </Section>
        <Section title="Recheck Weaknesses">
          <GapRows rows={data.recheckWeaknesses || []} label="No recheck alignment weaknesses detected." />
        </Section>
      </section>
    </main>
  );
}
