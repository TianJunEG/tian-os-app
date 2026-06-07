import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardCheck, ShieldCheck } from 'lucide-react';
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

function Empty({ children = 'No records found.' }) {
  return <p className="text-sm text-ink-500">{children}</p>;
}

function ValidationTable({ rows = [] }) {
  if (!rows.length) return <Empty>No diagnostic validation rows available.</Empty>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.08em] text-ink-500">
          <tr>
            <th className="pb-2 pr-4">Skill</th>
            <th className="pb-2 pr-4">Questions</th>
            <th className="pb-2 pr-4">Evidence</th>
            <th className="pb-2 pr-4">Confidence</th>
            <th className="pb-2 pr-4">Action</th>
            <th className="pb-2">Risks</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 40).map((row, index) => (
            <tr key={`${row.skillId}-${index}`} className="border-t border-hairline">
              <td className="py-3 pr-4 font-semibold text-ink-800">{row.skillId} · {row.skillName}</td>
              <td className="py-3 pr-4 tabular-nums">{row.questionsUsed}</td>
              <td className="py-3 pr-4">
                <Badge tone={row.evidenceStrength === 'strong' ? 'green' : row.evidenceStrength === 'moderate' ? 'yellow' : 'error'}>
                  {row.evidenceStrength}
                </Badge>
              </td>
              <td className="py-3 pr-4">
                <span className="font-mono tabular-nums">{row.confidenceScore}</span>
                <span className="ml-1 text-ink-500">({row.confidenceLevel})</span>
              </td>
              <td className="py-3 pr-4 text-ink-700">{row.recommendedAction}</td>
              <td className="py-3">
                <div className="flex flex-wrap gap-1">
                  {row.falsePositiveRisk ? <Badge tone="error">false-positive risk</Badge> : null}
                  {row.falseNegativeRisk ? <Badge tone="yellow">false-negative risk</Badge> : null}
                  {!row.falsePositiveRisk && !row.falseNegativeRisk ? <Badge tone="green">clear</Badge> : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RiskList({ rows = [], empty }) {
  if (!rows.length) return <Empty>{empty}</Empty>;
  return (
    <div className="space-y-3">
      {rows.slice(0, 12).map((row, index) => (
        <div key={`${row.skillId}-${index}`} className="rounded-2xl border border-hairline p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={row.falsePositiveRisk ? 'error' : 'yellow'}>{row.skillId}</Badge>
            <Badge tone="navy">{row.confidenceLevel}</Badge>
          </div>
          <p className="mt-2 text-sm font-semibold text-ink-800">{row.skillName}</p>
          <p className="mt-1 text-sm text-ink-500">{(row.alternativeExplanations || []).join(', ') || row.recommendedAction}</p>
        </div>
      ))}
    </div>
  );
}

function InterventionRows({ rows = [] }) {
  if (!rows.length) return <Empty>No completed interventions available for validation.</Empty>;
  return (
    <div className="space-y-3">
      {rows.slice(0, 12).map((row) => (
        <div key={row.assignmentId} className="border-b border-hairline pb-3 last:border-b-0 last:pb-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-ink-800">{row.sourceType} · {row.assignmentId}</span>
            <Badge tone={row.interventionSucceeded ? 'green' : row.recheckCompleted ? 'error' : 'yellow'}>
              {row.interventionSucceeded ? 'improved' : row.recheckCompleted ? 'still weak' : 'pending recheck'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-ink-500">
            Accuracy {number(row.completionAccuracy)}% · unresolved {(row.unresolvedMisconceptions || []).join(', ') || 'none'}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function DiagnosticValidationPage() {
  const [state, setState] = useState({ loading: true, error: '', data: null });

  useEffect(() => {
    let active = true;
    adminAPI.getDiagnosticValidation({ subjectId: 'math', domainId: 'fractions' })
      .then((res) => {
        if (active) setState({ loading: false, error: '', data: res.data });
      })
      .catch((err) => {
        if (active) setState({ loading: false, error: err?.response?.data?.error || 'Could not load diagnostic validation.', data: null });
      });
    return () => { active = false; };
  }, []);

  if (state.loading) return <Spinner label="Loading diagnostic validation..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={() => window.location.reload()} />;

  const data = state.data || {};

  return (
    <main className="mx-auto max-w-7xl pb-8">
      <PageHeader
        title="Diagnostic Validation"
        subtitle="Internal evidence audit showing whether weak-skill and intervention recommendations are supported by diagnostic, paper, working, assignment, and recheck evidence."
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={ClipboardCheck} label="Completed Diagnostics" value={data.sessionCount} />
        <MetricCard icon={ShieldCheck} label="Strong Evidence" value={(data.strongestEvidence || []).length} tone="green" />
        <MetricCard icon={AlertTriangle} label="Weak Evidence" value={(data.weakEvidence || []).length} tone={(data.weakEvidence || []).length ? 'amber' : 'green'} />
        <MetricCard icon={CheckCircle2} label="Interventions Improved" value={data.interventionSuccessRates?.succeeded} tone="green" />
      </section>

      <section className="mt-5">
        <Section title="Skill Validation Matrix">
          <ValidationTable rows={data.skillValidationMatrix || []} />
        </Section>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <Section title="False-Positive Risks">
          <RiskList rows={data.falsePositives || []} empty="No weak-skill claims with low evidence found." />
        </Section>
        <Section title="False-Negative Risks">
          <RiskList rows={data.falseNegatives || []} empty="No passed skills with conflicting evidence found." />
        </Section>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <Section title="Confidence Distribution">
          <div className="grid grid-cols-3 gap-3 text-center">
            {['high', 'medium', 'low'].map((key) => (
              <div key={key} className="rounded-2xl border border-hairline p-3">
                <p className="font-mono text-xl font-semibold text-ink-900">{number(data.confidenceDistribution?.[key])}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">{key}</p>
              </div>
            ))}
          </div>
        </Section>
        <Section title="Intervention Validation">
          <InterventionRows rows={data.interventionValidation || []} />
        </Section>
      </section>
    </main>
  );
}
