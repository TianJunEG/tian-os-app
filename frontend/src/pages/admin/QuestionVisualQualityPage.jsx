import React, { useEffect, useState } from 'react';
import { AlertTriangle, BarChart3, Eye, Layers, RefreshCw } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { Badge, Card, ErrorState, PageHeader, Spinner } from '../../components/ui';

function number(value) {
  const n = Number(value || 0);
  return new Intl.NumberFormat().format(Number.isFinite(n) ? n : 0);
}

function MetricCard({ icon: Icon, label, value, tone = 'navy', suffix = '' }) {
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

function Empty({ children = 'No visual gaps detected in this sample.' }) {
  return <p className="text-sm text-ink-500">{children}</p>;
}

function SkillCoverageTable({ rows = [] }) {
  if (!rows.length) return <Empty />;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.08em] text-ink-500">
          <tr>
            <th className="pb-2 pr-4">Skill</th>
            <th className="pb-2 pr-4">Required Visuals</th>
            <th className="pb-2 pr-4">Status</th>
            <th className="pb-2">Concern</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 26).map((row) => (
            <tr key={row.skillId} className="border-t border-hairline">
              <td className="py-3 pr-4 font-semibold text-ink-800">{row.skillId} · {row.skillName}</td>
              <td className="py-3 pr-4">
                <div className="flex flex-wrap gap-1">
                  {(row.requiredVisualTypes || []).map((type) => <Badge key={type} tone="navy">{type}</Badge>)}
                </div>
              </td>
              <td className="py-3 pr-4">
                <Badge tone={row.currentStatus === 'implemented' ? 'green' : row.currentStatus === 'partial' ? 'yellow' : 'error'}>
                  {row.currentStatus}
                </Badge>
              </td>
              <td className="max-w-md py-3 text-ink-600">{(row.qualityConcerns || []).join(' ') || row.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MissingQuestionList({ rows = [] }) {
  if (!rows.length) return <Empty />;
  return (
    <div className="space-y-3">
      {rows.slice(0, 12).map((row) => (
        <div key={row.questionId} className="rounded-2xl border border-hairline p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="yellow">{row.skillId || 'Unmapped'}</Badge>
            {(row.missingVisualTypes || []).map((type) => <Badge key={type} tone="navy">{type}</Badge>)}
          </div>
          <p className="mt-2 text-sm text-ink-700">{row.questionText}</p>
          {row.reasons?.length ? <p className="mt-1 text-xs text-ink-500">{row.reasons[0]}</p> : null}
        </div>
      ))}
    </div>
  );
}

function SimpleRows({ rows = [], labelKey, valueKey, empty = 'No rows available.' }) {
  if (!rows.length) return <Empty>{empty}</Empty>;
  return (
    <div className="space-y-3">
      {rows.slice(0, 12).map((row) => (
        <div key={`${row[labelKey]}-${row[valueKey]}`} className="flex items-center justify-between gap-3 border-b border-hairline pb-3 last:border-b-0 last:pb-0">
          <span className="text-sm font-semibold text-ink-800">{row[labelKey]}</span>
          <Badge tone="navy">{number(row[valueKey])}</Badge>
        </div>
      ))}
    </div>
  );
}

function BarModelRows({ rows = [] }) {
  if (!rows.length) return <Empty>No bar-model requirements found.</Empty>;
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.skillId} className="border-b border-hairline pb-3 last:border-b-0 last:pb-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-ink-800">{row.skillId} · {row.skillName}</span>
            <Badge tone={row.currentStatus === 'implemented' ? 'green' : 'yellow'}>{row.currentStatus}</Badge>
          </div>
          <p className="mt-1 text-sm text-ink-500">{row.recommendation}</p>
        </div>
      ))}
    </div>
  );
}

export default function QuestionVisualQualityPage() {
  const [state, setState] = useState({ loading: true, error: '', data: null });

  useEffect(() => {
    let active = true;
    adminAPI.getQuestionVisualQuality({ domainId: 'fractions' })
      .then((res) => {
        if (active) setState({ loading: false, error: '', data: res.data });
      })
      .catch((err) => {
        if (active) setState({ loading: false, error: err?.response?.data?.error || 'Could not load visual quality audit.', data: null });
      });
    return () => { active = false; };
  }, []);

  if (state.loading) return <Spinner label="Loading visual quality audit..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={() => window.location.reload()} />;

  const data = state.data || {};

  return (
    <main className="mx-auto max-w-7xl pb-8">
      <PageHeader
        title="Question Visual Quality"
        subtitle="Internal audit of visual models required for Singapore Math diagnostics, practice, worksheets, paper review, and remediation."
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={BarChart3} label="Visual Coverage" value={data.visualCoveragePercent} suffix="%" tone={data.visualCoveragePercent >= 80 ? 'green' : 'amber'} />
        <MetricCard icon={Layers} label="Questions Audited" value={data.totalQuestions} />
        <MetricCard icon={Eye} label="Required Visual Questions" value={data.requiredQuestionCount} />
        <MetricCard icon={AlertTriangle} label="Missing Visuals" value={data.missingVisualQuestionCount} tone={data.missingVisualQuestionCount ? 'amber' : 'green'} />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <Section title="Skills Missing Visual Support">
          <SkillCoverageTable rows={data.skillsMissingVisuals || []} />
        </Section>
        <Section title="Questions Missing Visuals">
          <MissingQuestionList rows={data.missingQuestionVisuals || []} />
        </Section>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <Section title="Bar Model Coverage">
          <BarModelRows rows={data.barModelFindings || []} />
        </Section>
        <Section title="Coverage By Level">
          <SimpleRows rows={data.visualCoverageByLevel || []} labelKey="level" valueKey="visualCoveragePercent" empty="No level coverage available." />
        </Section>
      </section>

      <Card className="mt-5 p-4">
        <div className="flex items-center gap-3 text-sm text-ink-600">
          <RefreshCw className="h-4 w-4 text-ink-400" />
          <span>This audit is advisory and does not change student question delivery.</span>
        </div>
      </Card>
    </main>
  );
}
